import { SourcesService } from './sources.service';
export declare class SourcesController {
    private readonly sourcesService;
    constructor(sourcesService: SourcesService);
    findAll(): Promise<({
        _count: {
            events: number;
            syncLogs: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isEnabled: boolean;
        pollIntervalMinutes: number;
        lastSyncAt: Date | null;
        lastSyncStatus: import(".prisma/client").$Enums.SyncStatus | null;
        lastErrorMessage: string | null;
        config: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    findOne(id: string): Promise<{
        syncLogs: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.SyncStatus;
            eventsProcessed: number;
            eventsCreated: number;
            eventsUpdated: number;
            errorMessage: string | null;
            durationMs: number;
            dataSourceId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isEnabled: boolean;
        pollIntervalMinutes: number;
        lastSyncAt: Date | null;
        lastSyncStatus: import(".prisma/client").$Enums.SyncStatus | null;
        lastErrorMessage: string | null;
        config: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    toggle(id: string, isEnabled: boolean, req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isEnabled: boolean;
        pollIntervalMinutes: number;
        lastSyncAt: Date | null;
        lastSyncStatus: import(".prisma/client").$Enums.SyncStatus | null;
        lastErrorMessage: string | null;
        config: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    triggerSync(id: string, req: any): Promise<{
        syncLogs: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.SyncStatus;
            eventsProcessed: number;
            eventsCreated: number;
            eventsUpdated: number;
            errorMessage: string | null;
            durationMs: number;
            dataSourceId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isEnabled: boolean;
        pollIntervalMinutes: number;
        lastSyncAt: Date | null;
        lastSyncStatus: import(".prisma/client").$Enums.SyncStatus | null;
        lastErrorMessage: string | null;
        config: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
