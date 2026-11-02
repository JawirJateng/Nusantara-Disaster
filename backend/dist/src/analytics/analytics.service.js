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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummary() {
        const [totalEvents, activeEvents, verifiedEvents, categoryCounts, severityCounts, provinceCounts, sourcesCount,] = await Promise.all([
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map