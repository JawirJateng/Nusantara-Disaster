import { Category, Severity, EventStatus, VerificationStatus } from '@prisma/client';
export declare class CreateEventDto {
    title: string;
    description?: string;
    category: Category;
    severity?: Severity;
    status?: EventStatus;
    verificationStatus?: VerificationStatus;
    province: string;
    regency?: string;
    locationName: string;
    latitude: number;
    longitude: number;
    occurredAt: string;
    sourceId?: string;
    metadata?: any;
}
