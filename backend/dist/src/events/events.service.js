"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EventsService = class EventsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filter) {
        const where = {};
        if (filter.rollingWindow === '7d') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            where.occurredAt = { gte: sevenDaysAgo };
        }
        if (filter.category)
            where.category = filter.category;
        if (filter.severity)
            where.severity = filter.severity;
        if (filter.status)
            where.status = filter.status;
        if (filter.verificationStatus)
            where.verificationStatus = filter.verificationStatus;
        if (filter.province)
            where.province = { contains: filter.province, mode: 'insensitive' };
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
        const seen = new Set();
        const items = rawItems.filter((item) => {
            const timeHour = new Date(item.occurredAt).toISOString().slice(0, 13);
            const magMatch = item.title.match(/M([0-9\.]+)/);
            const mag = magMatch ? magMatch[1] : '';
            const latStr = (item.latitude || 0).toFixed(1);
            const lngStr = (item.longitude || 0).toFixed(1);
            let key = item.externalId;
            if (item.category === 'EARTHQUAKE' && mag) {
                key = `EQ-${timeHour}-${mag}-${latStr}-${lngStr}`;
            }
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        }).slice(0, limit);
        return {
            items,
            meta: {
                total,
                limit,
                offset,
            },
        };
    }
    async findGeoJSON(filter) {
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
    async findOne(id) {
        const event = await this.prisma.disasterEvent.findUnique({
            where: { id },
            include: { source: true },
        });
        if (!event)
            throw new common_1.NotFoundException(`Disaster event with ID ${id} not found`);
        return event;
    }
    async create(dto, userId) {
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
                },
            });
        }
        return event;
    }
    async update(id, dto, userId) {
        await this.findOne(id);
        const updateData = { ...dto };
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
                },
            });
        }
        return updated;
    }
    async remove(id, userId) {
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
                },
            });
        }
        return { success: true, id: event.id };
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventsService);
//# sourceMappingURL=events.service.js.map