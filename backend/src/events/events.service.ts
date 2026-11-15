import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventFilterDto } from './dto/event-filter.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: EventFilterDto) {
    const where: any = {};

    // 7-day rolling window only when requested (e.g. for homepage main map)
    if (filter.rollingWindow === '7d') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      where.occurredAt = { gte: sevenDaysAgo };
    }

    if (filter.category) where.category = filter.category;
    if (filter.severity) where.severity = filter.severity;
    if (filter.status) where.status = filter.status;
    if (filter.verificationStatus) where.verificationStatus = filter.verificationStatus;
    if (filter.province) where.province = { contains: filter.province, mode: 'insensitive' };

    if (filter.sourceCode) {
      where.source = { code: filter.sourceCode };
    }

    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { locationName: { contains: filter.search, mode: 'insensitive' } },
        { regency: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const limit = filter.limit ? Number(filter.limit) : 100;
    const offset = filter.offset ? Number(filter.offset) : 0;

    const [rawItems, total] = await Promise.all([
      this.prisma.disasterEvent.findMany({
        where,
        include: { source: true },
        orderBy: { occurredAt: 'desc' },
        take: limit * 2,
        skip: offset,
      }),
      this.prisma.disasterEvent.count({ where }),
    ]);

    // One earthquake per location (±0.2°): rawItems is newest-first, so the latest one wins.
    const items: typeof rawItems = [];
    for (const item of rawItems) {
      if (items.length >= limit) break;
      const isNearbyQuake =
        item.category === 'EARTHQUAKE' &&
        items.some(
          (kept) =>
            kept.category === 'EARTHQUAKE' &&
            Math.abs(kept.latitude - item.latitude) < 0.2 &&
            Math.abs(kept.longitude - item.longitude) < 0.2,
        );
      if (!isNearbyQuake) items.push(item);
    }

    return {
      items,
      meta: {
        total,
        limit,
        offset,
      },
    };
  }

  async findGeoJSON(filter: EventFilterDto) {
    const { items } = await this.findAll({ ...filter, limit: 500 });
    return {
      type: 'FeatureCollection',
      features: items.map((ev) => ({
        type: 'Feature',
        geometry: ev.geometry || {
          type: 'Point',
          coordinates: [ev.longitude, ev.latitude],
        },
        properties: {
          id: ev.id,
          title: ev.title,
          category: ev.category,
          severity: ev.severity,
          province: ev.province,
          regency: ev.regency,
          locationName: ev.locationName,
          occurredAt: ev.occurredAt,
          source: ev.source ? ev.source.name : null,
          metadata: ev.metadata,
        },
      })),
    };
  }

  async findOne(id: string) {
    const event = await this.prisma.disasterEvent.findUnique({
      where: { id },
      include: { source: true },
    });
    if (!event) throw new NotFoundException(`Disaster event with ID ${id} not found`);
    return event;
  }

  async create(dto: CreateEventDto, userId?: string, ip?: string) {
    const event = await this.prisma.disasterEvent.create({
      data: {
        ...dto,
        occurredAt: new Date(dto.occurredAt),
        geometry: {
          type: 'Point',
          coordinates: [dto.longitude, dto.latitude],
        },
      },
      include: { source: true },
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE_EVENT',
          entityType: 'DisasterEvent',
          entityId: event.id,
          details: { title: event.title },
          ipAddress: ip,
        },
      });
    }

    return event;
  }

  async update(id: string, dto: UpdateEventDto, userId?: string, ip?: string) {
    await this.findOne(id);

    const updateData: any = { ...dto };
    if (dto.occurredAt) {
      updateData.occurredAt = new Date(dto.occurredAt);
    }
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      updateData.geometry = {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      };
    }

    const updated = await this.prisma.disasterEvent.update({
      where: { id },
      data: updateData,
      include: { source: true },
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_EVENT',
          entityType: 'DisasterEvent',
          entityId: updated.id,
          details: JSON.parse(JSON.stringify(dto)),
          ipAddress: ip,
        },
      });
    }

    return updated;
  }

  async remove(id: string, userId?: string, ip?: string) {
    const event = await this.findOne(id);
    await this.prisma.disasterEvent.delete({ where: { id: event.id } });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'DELETE_EVENT',
          entityType: 'DisasterEvent',
          entityId: event.id,
          details: { title: event.title },
          ipAddress: ip,
        },
      });
    }

    return { success: true, id: event.id };
  }
}
