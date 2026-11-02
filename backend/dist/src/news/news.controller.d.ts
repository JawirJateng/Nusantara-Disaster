import { NewsService } from './news.service';
export declare class NewsController {
    private readonly newsService;
    constructor(newsService: NewsService);
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
