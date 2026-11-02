import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
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
