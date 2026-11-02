import { EventsService } from './events.service';
import { EventFilterDto } from './dto/event-filter.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    findAll(filter: EventFilterDto): Promise<{
        items: ({
            source: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            externalId: string | null;
            title: string;
            description: string | null;
            category: import(".prisma/client").$Enums.Category;
            severity: import(".prisma/client").$Enums.Severity;
            status: import(".prisma/client").$Enums.EventStatus;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            province: string;
            regency: string | null;
            locationName: string;
            latitude: number;
            longitude: number;
            geometry: import("@prisma/client/runtime/library").JsonValue | null;
            occurredAt: Date;
            sourceId: string | null;
            rawPayload: import("@prisma/client/runtime/library").JsonValue | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        meta: {
            total: number;
            limit: number;
            offset: number;
        };
    }>;
    findGeoJSON(filter: EventFilterDto): Promise<{
        type: string;
        features: {
            type: string;
            geometry: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
            properties: {
                id: string;
                title: string;
                category: import(".prisma/client").$Enums.Category;
                severity: import(".prisma/client").$Enums.Severity;
                province: string;
                regency: string;
                locationName: string;
                occurredAt: Date;
                source: string;
                metadata: import("@prisma/client/runtime/library").JsonValue;
            };
        }[];
    }>;
    findOne(id: string): Promise<{
        source: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        externalId: string | null;
        title: string;
        description: string | null;
        category: import(".prisma/client").$Enums.Category;
        severity: import(".prisma/client").$Enums.Severity;
        status: import(".prisma/client").$Enums.EventStatus;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        province: string;
        regency: string | null;
        locationName: string;
        latitude: number;
        longitude: number;
        geometry: import("@prisma/client/runtime/library").JsonValue | null;
        occurredAt: Date;
        sourceId: string | null;
        rawPayload: import("@prisma/client/runtime/library").JsonValue | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    create(dto: CreateEventDto, req: any): Promise<{
        source: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        externalId: string | null;
        title: string;
        description: string | null;
        category: import(".prisma/client").$Enums.Category;
        severity: import(".prisma/client").$Enums.Severity;
        status: import(".prisma/client").$Enums.EventStatus;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        province: string;
        regency: string | null;
        locationName: string;
        latitude: number;
        longitude: number;
        geometry: import("@prisma/client/runtime/library").JsonValue | null;
        occurredAt: Date;
        sourceId: string | null;
        rawPayload: import("@prisma/client/runtime/library").JsonValue | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(id: string, dto: UpdateEventDto, req: any): Promise<{
        source: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        externalId: string | null;
        title: string;
        description: string | null;
        category: import(".prisma/client").$Enums.Category;
        severity: import(".prisma/client").$Enums.Severity;
        status: import(".prisma/client").$Enums.EventStatus;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        province: string;
        regency: string | null;
        locationName: string;
        latitude: number;
        longitude: number;
        geometry: import("@prisma/client/runtime/library").JsonValue | null;
        occurredAt: Date;
        sourceId: string | null;
        rawPayload: import("@prisma/client/runtime/library").JsonValue | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
        id: string;
    }>;
}
