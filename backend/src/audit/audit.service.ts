import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(limit = 50, offset = 0) {
    const takeNum = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const skipNum = Math.max(0, Number(offset) || 0);

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: takeNum,
        skip: skipNum,
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      items,
      meta: { total, limit: takeNum, offset: skipNum },
    };
  }
}
