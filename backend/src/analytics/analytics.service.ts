import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const [
      totalEvents,
      activeEvents,
      verifiedEvents,
      categoryCounts,
      severityCounts,
      provinceCounts,
      sourcesCount,
    ] = await Promise.all([
      this.prisma.disasterEvent.count(),
      this.prisma.disasterEvent.count({ where: { status: 'ACTIVE' } }),
      this.prisma.disasterEvent.count({ where: { verificationStatus: 'VERIFIED' } }),
      this.prisma.disasterEvent.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
      this.prisma.disasterEvent.groupBy({
        by: ['severity'],
        _count: { severity: true },
      }),
      this.prisma.disasterEvent.groupBy({
        by: ['province'],
        _count: { province: true },
        orderBy: { _count: { province: 'desc' } },
        take: 10,
      }),
      this.prisma.dataSource.count({ where: { isEnabled: true } }),
    ]);

    return {
      kpis: {
        totalEvents,
        activeEvents,
        verifiedEvents,
        sourcesCount,
      },
      categoryCounts: categoryCounts.map((c) => ({ category: c.category, count: c._count.category })),
      severityCounts: severityCounts.map((s) => ({ severity: s.severity, count: s._count.severity })),
      provinceCounts: provinceCounts.map((p) => ({ province: p.province, count: p._count.province })),
    };
  }
}
