import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class SourcesService {
  constructor(
    private prisma: PrismaService,
    private syncService: SyncService,
  ) {}

  // Public endpoint: never return `config`, checkpoints or sync logs here.
  async findAll() {
    return this.prisma.dataSource.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        isEnabled: true,
        pollIntervalMinutes: true,
        lastSyncAt: true,
        lastSyncStatus: true,
        _count: { select: { events: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const source = await this.prisma.dataSource.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        isEnabled: true,
        pollIntervalMinutes: true,
        lastSyncAt: true,
        lastSyncStatus: true,
        _count: { select: { events: true } },
      },
    });
    if (!source) throw new NotFoundException(`Data source ${id} not found`);
    return source;
  }

  async toggle(id: string, isEnabled: boolean, userId?: string, ip?: string) {
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
          ipAddress: ip,
        },
      });
    }

    return source;
  }

  async triggerSync(id: string, userId?: string, ip?: string) {
    const source = await this.prisma.dataSource.findUnique({ where: { id } });
    if (!source) throw new NotFoundException(`Data source ${id} not found`);

    const result = await this.syncService.syncSource(id);

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'TRIGGER_SYNC',
          entityType: 'DataSource',
          entityId: id,
          details: { name: source.name, code: source.code, result } as unknown as Prisma.InputJsonObject,
          ipAddress: ip,
        },
      });
    }

    return this.findOne(id);
  }
}
