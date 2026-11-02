import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSummary(): Promise<{
        kpis: {
            totalEvents: number;
            activeEvents: number;
            verifiedEvents: number;
            sourcesCount: number;
        };
        categoryCounts: {
            category: import(".prisma/client").$Enums.Category;
            count: number;
        }[];
        severityCounts: {
            severity: import(".prisma/client").$Enums.Severity;
            count: number;
        }[];
        provinceCounts: {
            province: string;
            count: number;
        }[];
    }>;
}
