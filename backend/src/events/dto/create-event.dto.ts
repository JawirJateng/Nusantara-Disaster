import { IsNotEmpty, IsEnum, IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { Category, Severity, EventStatus, VerificationStatus } from '@prisma/client';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(Category)
  category: Category;

  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsNotEmpty()
  @IsString()
  province: string;

  @IsOptional()
  @IsString()
  regency?: string;

  @IsNotEmpty()
  @IsString()
  locationName: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsDateString()
  occurredAt: string;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  metadata?: any;
}
