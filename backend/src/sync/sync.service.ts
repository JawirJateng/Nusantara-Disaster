import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, Prisma, SyncHealth, SyncStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SourceHttpError } from './http-client';
import { parseBmkgCoordinates, parseBmkgDate, bmkgExternalId } from './adapters/bmkg.adapter';
import {
  AdapterResult,
  NormalizedEvent,
  SOURCE_ADAPTERS,
  SourceAdapter,
  backoffDelayMs,
  buildContentHash,
  buildIdentityFingerprint,
  buildPatch,
  mergeMetadata,
  validateEvent,
} from './sync.core';

export type SyncRunStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'SKIPPED' | 'LOCKED' | 'NO_ADAPTER';

export interface SyncRunResult {
  status: SyncRunStatus;
  inserted?: number;
  updated?: number;
  skipped?: number;
  rejected?: number;
  review?: number;
  logId?: string;
}

const LOCK_TTL_MS = 10 * 60_000;
const MAX_ERROR_MESSAGE = 500;
const DEFAULT_LOG_RETENTION_DAYS = 30;
const CLEANUP_BATCH_SIZE = 5000;

@Injectable()
export class SyncService implements OnModuleInit {
  private readonly logger = new Logger(SyncService.name);
  private readonly adapters = new Map<string, SourceAdapter>();
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SOURCE_ADAPTERS) adapters: SourceAdapter[],
  ) {
    for (const adapter of adapters || []) this.adapters.set(adapter.code, adapter);
  }

  async onModuleInit() {
    this.logger.log('🚀 Backend aktif: menyiapkan Intelligent Disaster Data Synchronization Engine...');

    try {
      await this.backfillLegacyBmkgIdentity();
    } catch (err) {
      this.logger.warn(`⚠️ Backfill identitas BMKG gagal: ${this.safeMessage(err)}`);
    }

    const bmkgSource = await this.prisma.dataSource.findUnique({ where: { code: 'BMKG' } }).catch(() => null);
    if (bmkgSource?.isEnabled) {
      this.syncSource(bmkgSource.id).catch((err) => {
        this.logger.error(`❌ Gagal sinkronisasi awal BMKG: ${this.safeMessage(err)}`);
      });
    }
  }

  hasAdapter(code: string): boolean {
    return this.adapters.has(code);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutoSync() {
    if (this.isRunning) {
      this.logger.warn('⏭️ Siklus sinkronisasi sebelumnya masih berjalan, siklus ini dilewati.');
      return;
    }

    this.isRunning = true;
    try {
      const results = await this.syncAll();
      const ran = results.filter((r) => r.status !== 'SKIPPED');
      if (ran.length) {
        const summary = ran.map((r) => `${r.status}(+${r.inserted ?? 0}/~${r.updated ?? 0}/=${r.skipped ?? 0})`).join(' ');
        this.logger.log(`🔄 Sinkronisasi otomatis: ${summary}`);
      }
    } finally {
      this.isRunning = false;
    }
  }

  /** Retention job: sync logs are operational data and expire per source. Events are never pruned here. */
  @Cron('0 3 * * *')
  async handleRetention() {
    try {
      const deleted = await this.pruneSyncLogs();
      if (deleted) this.logger.log(`🧹 Retention: ${deleted} log sinkronisasi lama dihapus.`);
    } catch (err) {
      this.logger.error(`❌ Retention log gagal: ${this.safeMessage(err)}`);
    }
  }

  async pruneSyncLogs(): Promise<number> {
    const sources = await this.prisma.dataSource.findMany({
      select: { id: true, logRetentionDays: true },
    });

    let total = 0;
    for (const source of sources) {
      const days = Math.max(1, source.logRetentionDays || DEFAULT_LOG_RETENTION_DAYS);
      const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);
      let deleted = 0;
      do {
        deleted = await this.prisma.$executeRaw(
          Prisma.sql`DELETE FROM "SyncLog" WHERE "id" IN (
            SELECT "id" FROM "SyncLog"
            WHERE "dataSourceId" = ${source.id} AND "createdAt" < ${cutoff}
            LIMIT ${CLEANUP_BATCH_SIZE}
          )`,
        );
        total += deleted;
      } while (deleted >= CLEANUP_BATCH_SIZE);
    }
    return total;
  }

  /** Run every enabled source that has an adapter and is due for polling. */
  async syncAll(options: { force?: boolean } = {}): Promise<SyncRunResult[]> {
    const sources = await this.prisma.dataSource.findMany({ where: { isEnabled: true } });
    const results: SyncRunResult[] = [];

    for (const source of sources) {
      if (!this.adapters.has(source.code)) continue;
      if (!options.force && source.nextPollAt && source.nextPollAt.getTime() > Date.now()) continue;

      try {
        results.push(await this.syncSource(source.id));
      } catch (err) {
        // One provider must never stop the others.
        this.logger.error(`❌ Sumber ${source.code} gagal: ${this.safeMessage(err)}`);
        results.push({ status: 'FAILED' });
      }
    }

    return results;
  }

  async syncSource(sourceId: string): Promise<SyncRunResult> {
    const source = await this.prisma.dataSource.findUnique({ where: { id: sourceId } });
    if (!source) throw new Error(`Data source ${sourceId} not found`);

    const adapter = this.adapters.get(source.code);
    if (!adapter) {
      this.logger.warn(`ℹ️ Sumber ${source.code} belum memiliki adapter; sinkronisasi dilewati.`);
      return { status: 'NO_ADAPTER' };
    }

    if (!(await this.acquireLock(source.id))) {
      this.logger.warn(`⏭️ Sumber ${source.code} sedang disinkronkan proses lain; dilewati.`);
      return { status: 'LOCKED' };
    }

    const startedAt = Date.now();
    const now = new Date();
    const counters = { inserted: 0, updated: 0, skipped: 0, rejected: 0, review: 0, errors: 0 };
    const rejectSamples: string[] = [];
    let invalidRecords = 0;
    let retryCount = 0;
    let rateLimitCount = 0;

    try {
      await this.updateCheckpoint(source.id, { status: SyncHealth.RUNNING, lastAttemptAt: now });

      const config = (source.config as Record<string, any>) || {};
      const result: AdapterResult = await adapter.fetch({
        config,
        timeoutMs: source.timeoutMs ?? this.numberFromConfig(config.requestTimeoutMs, 10_000),
        maxRetries: source.maxRetries ?? this.numberFromConfig(config.maxRetries, 2),
      });

      retryCount = result.retryCount ?? 0;
      rateLimitCount = result.rateLimitCount ?? 0;
      counters.rejected = result.rejected.length;
      counters.review = result.review?.length ?? 0;
      for (const rejection of result.rejected) {
        rejectSamples.push(`${rejection.reason}${rejection.ref ? ` (${rejection.ref})` : ''}`);
      }
      for (const review of result.review ?? []) {
        rejectSamples.push(`review: ${review.reason}${review.ref ? ` (${review.ref})` : ''}`);
      }

      const seenIds: string[] = [];
      for (const record of result.records) {
        const invalid = validateEvent(record);
        if (invalid) {
          counters.rejected++;
          invalidRecords++;
          rejectSamples.push(`${invalid}${record?.externalId ? ` (${record.externalId})` : ''}`);
          continue;
        }

        try {
          const outcome = await this.persistEvent(source, record, now);
          counters[outcome.action]++;
          seenIds.push(outcome.id);
        } catch (err) {
          counters.errors++;
          rejectSamples.push(`persist failed${record.externalId ? ` (${record.externalId})` : ''}: ${this.safeMessage(err)}`);
          this.logger.error(`❌ Gagal menyimpan kejadian ${record.externalId || record.title}: ${this.safeMessage(err)}`);
        }
      }

      if (seenIds.length) await this.touchLastSeen(seenIds, now);

      // A failed record write means the batch is not fully processed: keep the checkpoint where it is.
      const batchComplete = counters.errors === 0;
      const hasWarnings = (result.warnings?.length ?? 0) > 0;
      const status: SyncStatus = batchComplete && !hasWarnings && counters.rejected === 0
        ? SyncStatus.SUCCESS
        : SyncStatus.PARTIAL;
      const durationMs = Date.now() - startedAt;
      const errorMessage = this.summarize(rejectSamples, result.warnings);

      const log = await this.prisma.syncLog.create({
        data: {
          dataSourceId: source.id,
          status,
          eventsFetched: result.fetched ?? result.records.length,
          eventsProcessed: result.records.length,
          eventsValid: Math.max(0, result.records.length - invalidRecords),
          eventsCreated: counters.inserted,
          eventsUpdated: counters.updated,
          eventsSkipped: counters.skipped,
          eventsRejected: counters.rejected,
          eventsReview: counters.review,
          errorCount: counters.errors,
          retryCount,
          rateLimitCount,
          errorMessage,
          durationMs,
          startedAt: new Date(startedAt),
          finishedAt: new Date(),
        },
      });

      await this.prisma.dataSource.update({
        where: { id: source.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: status,
          lastErrorMessage: status === SyncStatus.SUCCESS ? null : errorMessage,
          failureCount: 0,
          syncLockExpiresAt: null,
          nextPollAt: this.nextPollAfterSuccess(source),
        },
      });

      await this.updateCheckpoint(source.id, {
        status: batchComplete ? (hasWarnings ? SyncHealth.DEGRADED : SyncHealth.HEALTHY) : SyncHealth.DEGRADED,
        consecutiveFailures: 0,
        lastAttemptAt: new Date(),
        ...(batchComplete ? { lastSuccessfulSyncAt: new Date() } : {}),
      });

      this.logger.log(
        `✅ ${source.code}: ${counters.inserted} baru, ${counters.updated} diperbarui, ${counters.skipped} tidak berubah, ${counters.rejected} ditolak.`,
      );

      return {
        status: status === SyncStatus.SUCCESS ? 'SUCCESS' : 'PARTIAL',
        inserted: counters.inserted,
        updated: counters.updated,
        skipped: counters.skipped,
        rejected: counters.rejected,
        review: counters.review,
        logId: log.id,
      };
    } catch (err) {
      const durationMs = Date.now() - startedAt;
      const message = this.safeMessage(err);
      const retryAfterMs = err instanceof SourceHttpError ? err.retryAfterMs : undefined;
      if (err instanceof SourceHttpError) {
        retryCount = Math.max(retryCount, err.retryCount);
        if (err.kind === 'rate_limit') rateLimitCount = Math.max(rateLimitCount, 1);
      }

      const nextPollAt = retryAfterMs !== undefined && retryAfterMs > 0
        ? new Date(Date.now() + retryAfterMs)
        : new Date(Date.now() + backoffDelayMs(source.failureCount + 1));

      this.logger.error(`❌ Gagal sinkronisasi ${source.code}: ${message}`);

      try {
        await this.prisma.syncLog.create({
          data: {
            dataSourceId: source.id,
            status: SyncStatus.FAILED,
            eventsFetched: 0,
            eventsProcessed: 0,
            eventsValid: 0,
            eventsCreated: 0,
            eventsUpdated: 0,
            eventsSkipped: 0,
            eventsRejected: counters.rejected,
            eventsReview: counters.review,
            errorCount: 1,
            retryCount,
            rateLimitCount,
            errorMessage: message,
            durationMs,
            startedAt: new Date(startedAt),
            finishedAt: new Date(),
          },
        });

        await this.prisma.dataSource.update({
          where: { id: source.id },
          data: {
            lastSyncAt: new Date(),
            lastSyncStatus: SyncStatus.FAILED,
            lastErrorMessage: message,
            failureCount: { increment: 1 },
            nextPollAt,
            syncLockExpiresAt: null,
          },
        });

        // Do not advance lastSuccessfulSyncAt on failure.
        await this.updateCheckpoint(source.id, {
          status: SyncHealth.FAILED,
          consecutiveFailures: (source.failureCount || 0) + 1,
          lastAttemptAt: new Date(),
        });
      } catch (logErr) {
        this.logger.error(`❌ Gagal menulis log sinkronisasi ${source.code}: ${this.safeMessage(logErr)}`);
      }

      return { status: 'FAILED', inserted: counters.inserted, updated: counters.updated, skipped: counters.skipped, rejected: counters.rejected, review: counters.review };
    } finally {
      await this.releaseLock(source.id).catch(() => undefined);
    }
  }

  /**
   * INSERT when the identity is new, SKIP when the meaningful content hash is unchanged,
   * UPDATE otherwise. The compound unique constraint protects against concurrent inserts.
   */
  private async persistEvent(
    source: DataSource,
    event: NormalizedEvent,
    now: Date,
  ): Promise<{ action: 'inserted' | 'updated' | 'skipped'; id: string }> {
    const externalId = event.externalId ?? null;
    const identityFingerprint = externalId ? null : buildIdentityFingerprint(source.code, event);
    const where = externalId
      ? { sourceId_externalId: { sourceId: source.id, externalId } }
      : { sourceId_identityFingerprint: { sourceId: source.id, identityFingerprint } };

    let existing = await this.prisma.disasterEvent.findUnique({ where, select: this.hashSelection() });
    const patch = buildPatch(event);
    const mergedMetadata = event.metadata !== undefined ? mergeMetadata(existing?.metadata, event.metadata) : undefined;
    if (mergedMetadata !== undefined) patch.metadata = mergedMetadata;

    if (!existing) {
      const effective = this.effectiveContent(event, mergedMetadata);
      const data: Prisma.DisasterEventUncheckedCreateInput = {
        ...patch,
        category: event.category,
        title: event.title,
        province: event.province ?? 'Indonesia',
        locationName: event.locationName ?? event.title,
        latitude: event.latitude,
        longitude: event.longitude,
        occurredAt: event.occurredAt,
        sourceId: source.id,
        externalId,
        identityFingerprint,
        contentHash: buildContentHash(effective),
        firstSeenAt: now,
        lastSeenAt: now,
        metadata: (mergedMetadata ?? event.metadata ?? undefined) as unknown as Prisma.InputJsonValue,
        rawPayload: (event.rawPayload ?? undefined) as Prisma.InputJsonValue,
      };
      try {
        const created = await this.prisma.disasterEvent.create({ data, select: { id: true } });
        return { action: 'inserted', id: created.id };
      } catch (err) {
        // Lost a race against another worker: continue as an update.
        if ((err as any)?.code !== 'P2002') throw err;
        existing = await this.prisma.disasterEvent.findUnique({ where, select: this.hashSelection() });
        if (!existing) throw err;
      }
    }

    const effective = this.effectiveContent(event, mergedMetadata, existing);
    const contentHash = buildContentHash(effective);

    if (existing.contentHash === contentHash) {
      return { action: 'skipped', id: existing.id };
    }

    // Rows created before change detection have no hash: adopt one without touching the event.
    if (existing.contentHash === null && buildContentHash(existing) === contentHash) {
      await this.prisma.$executeRaw(
        Prisma.sql`UPDATE "DisasterEvent" SET "contentHash" = ${contentHash} WHERE "id" = ${existing.id}`,
      );
      return { action: 'skipped', id: existing.id };
    }

    await this.prisma.disasterEvent.update({
      where: { id: existing.id },
      data: {
        ...patch,
        metadata: mergedMetadata === undefined
          ? undefined
          : mergedMetadata === null
            ? Prisma.DbNull
            : (mergedMetadata as unknown as Prisma.InputJsonObject),
        contentHash,
        lastSeenAt: now,
      },
    });
    return { action: 'updated', id: existing.id };
  }

  /** The record as it will be stored after a partial update, used to hash exactly what is persisted. */
  private effectiveContent(
    event: NormalizedEvent,
    mergedMetadata?: Record<string, unknown> | null,
    existing?: Record<string, any> | null,
  ): Record<string, any> {
    return {
      category: event.category,
      title: event.title ?? existing?.title,
      description: event.description ?? existing?.description ?? null,
      severity: event.severity ?? existing?.severity ?? 'MODERATE',
      status: event.status ?? existing?.status ?? 'ACTIVE',
      verificationStatus: event.verificationStatus ?? existing?.verificationStatus ?? 'UNVERIFIED',
      province: event.province ?? existing?.province ?? 'Indonesia',
      regency: event.regency ?? existing?.regency ?? null,
      locationName: event.locationName ?? existing?.locationName ?? event.title,
      latitude: event.latitude,
      longitude: event.longitude,
      occurredAt: event.occurredAt,
      metadata: mergedMetadata !== undefined ? mergedMetadata : existing?.metadata ?? event.metadata ?? null,
    };
  }

  private hashSelection() {
    return {
      id: true,
      title: true,
      description: true,
      category: true,
      severity: true,
      status: true,
      verificationStatus: true,
      province: true,
      regency: true,
      locationName: true,
      latitude: true,
      longitude: true,
      occurredAt: true,
      metadata: true,
      contentHash: true,
    } as const;
  }

  /** Refresh `lastSeenAt` in one statement so `updatedAt` (content change) stays untouched. */
  private async touchLastSeen(ids: string[], now: Date) {
    await this.prisma.$executeRaw(
      Prisma.sql`UPDATE "DisasterEvent" SET "lastSeenAt" = ${now} WHERE "id" IN (${Prisma.join(ids)})`,
    );
  }

  private async acquireLock(sourceId: string): Promise<boolean> {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - LOCK_TTL_MS);
    const result = await this.prisma.dataSource.updateMany({
      where: {
        id: sourceId,
        OR: [{ syncLockExpiresAt: null }, { syncLockExpiresAt: { lt: staleBefore } }],
      },
      data: {
        syncLockExpiresAt: new Date(now.getTime() + LOCK_TTL_MS),
        lastAttemptAt: now,
      },
    });
    return result.count === 1;
  }

  private async releaseLock(sourceId: string) {
    await this.prisma.dataSource.updateMany({
      where: { id: sourceId, syncLockExpiresAt: { not: null } },
      data: { syncLockExpiresAt: null },
    });
  }

  private async updateCheckpoint(
    dataSourceId: string,
    data: Prisma.SyncCheckpointUpdateInput,
  ) {
    const update = data as Prisma.SyncCheckpointUncheckedUpdateInput;
    await this.prisma.syncCheckpoint.upsert({
      where: { dataSourceId },
      update,
      create: { dataSourceId, ...(update as Prisma.SyncCheckpointUncheckedCreateInput) },
    });
  }

  private nextPollAfterSuccess(source: DataSource): Date {
    const minutes = Math.max(1, source.pollIntervalMinutes || 15);
    return new Date(Date.now() + minutes * 60_000);
  }

  private numberFromConfig(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private safeMessage(err: any): string {
    return String(err?.message || err || 'unknown error').slice(0, MAX_ERROR_MESSAGE);
  }

  private summarize(rejects: string[], warnings?: string[]): string | null {
    const parts = [...(warnings || []), ...rejects].filter(Boolean);
    if (!parts.length) return null;
    return parts.slice(0, 3).join('; ').slice(0, MAX_ERROR_MESSAGE);
  }

  /**
   * Rewrite BMKG IDs created by the old formula (which included magnitude) to the stable
   * source-scoped ID. Rows that cannot be parsed or would collide are left untouched.
   */
  private async backfillLegacyBmkgIdentity() {
    const source = await this.prisma.dataSource.findUnique({ where: { code: 'BMKG' } });
    if (!source) return;

    const events = await this.prisma.disasterEvent.findMany({
      where: { sourceId: source.id, externalId: { startsWith: 'BMKG-' }, rawPayload: { not: Prisma.DbNull } },
      select: { id: true, externalId: true, rawPayload: true },
    });

    let migrated = 0;
    let skipped = 0;
    for (const event of events) {
      const raw = event.rawPayload as any;
      const occurredAt = parseBmkgDate(raw);
      const coordinates = parseBmkgCoordinates(raw);
      if (!occurredAt || !coordinates) {
        skipped++;
        continue;
      }
      const stableId = bmkgExternalId(occurredAt, coordinates.latitude, coordinates.longitude);
      if (stableId === event.externalId) continue;

      const clash = await this.prisma.disasterEvent.findUnique({
        where: { sourceId_externalId: { sourceId: source.id, externalId: stableId } },
        select: { id: true },
      });
      if (clash) {
        skipped++;
        continue;
      }

      // Raw SQL: a data migration must not change the event's content timestamp.
      await this.prisma.$executeRaw(
        Prisma.sql`UPDATE "DisasterEvent" SET "externalId" = ${stableId} WHERE "id" = ${event.id}`,
      );
      migrated++;
    }

    if (migrated || skipped) {
      this.logger.log(`🧬 Backfill identitas BMKG: ${migrated} dimigrasi, ${skipped} dilewati (perlu review).`);
    }
  }
}
