import { Category, Severity, EventStatus, VerificationStatus } from '@prisma/client';
export declare class EventFilterDto {
    category?: Category;
    severity?: Severity;
    status?: EventStatus;
    verificationStatus?: VerificationStatus;
    province?: string;
    search?: string;
    sourceCode?: string;
    rollingWindow?: string;
    limit?: number;
    offset?: number;
}
