import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from '../sync/sync.service';
export declare class SourcesService {
    private prisma;
    private syncService;
    constructor(prisma: PrismaService, syncService: SyncService);
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
    toggle(id: string, isEnabled: boolean, userId?: string): Promise<{
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
    triggerSync(id: string, userId?: string): Promise<{
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
