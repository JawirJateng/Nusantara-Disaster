import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class NewsService implements OnModuleInit {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    handleCronSync(): Promise<void>;
    fetchAndSyncDisasterNews(): Promise<void>;
    findAll(limit?: number, offset?: number): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            category: import(".prisma/client").$Enums.Category;
            summary: string;
            content: string | null;
            sourceName: string;
            sourceUrl: string | null;
            publishedAt: Date;
        }[];
        meta: {
            total: number;
            limit: number;
            offset: number;
        };
    }>;
}
