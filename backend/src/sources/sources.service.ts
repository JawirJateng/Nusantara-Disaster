import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class SourcesService {
  constructor(
    private prisma: PrismaService,
    private syncService: SyncService,
  ) {}

  async findAll() {
    return this.prisma.dataSource.findMany({
      include: {
        _count: {
          select: { events: true, syncLogs: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const source = await this.prisma.dataSource.findUnique({
      where: { id },
      include: {
        syncLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!source) throw new NotFoundException(`Data source ${id} not found`);
    return source;
  }

  async toggle(id: string, isEnabled: boolean, userId?: string) {
    const source = await this.prisma.dataSource.update({
      where: { id },
      data: { isEnabled },
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: isEnabled ? 'ENABLE_SOURCE' : 'DISABLE_SOURCE',
          entityType: 'DataSource',
          entityId: id,
          details: { name: source.name, isEnabled },
        },
      });
    }

    return source;
  }

  async triggerSync(id: string, userId?: string) {
    const source = await this.prisma.dataSource.findUnique({ where: { id } });
    if (!source) throw new NotFoundException(`Data source ${id} not found`);

    if (source.code === 'BMKG') {
      await this.syncService.syncBmkg(id);
    } else {
      // Simulate sync process for other sources
      await this.prisma.syncLog.create({
        data: {
          dataSourceId: id,
          status: 'SUCCESS',
          eventsProcessed: 5,
          eventsCreated: 1,
          eventsUpdated: 4,
          durationMs: 420,
        },
      });

      await this.prisma.dataSource.update({
        where: { id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'SUCCESS',
          lastErrorMessage: null,
        },
      });
    }

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'TRIGGER_SYNC',
          entityType: 'DataSource',
          entityId: id,
          details: { name: source.name, code: source.code },
        },
      });
    }

    return this.findOne(id);
  }
}
