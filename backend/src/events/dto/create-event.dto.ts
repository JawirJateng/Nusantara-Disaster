import { IsNotEmpty, IsEnum, IsString, IsNumber, IsOptional, IsDateString, MaxLength, Min, Max } from 'class-validator';
import { Category, Severity, EventStatus, VerificationStatus } from '@prisma/client';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
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
  @MaxLength(100)
  province: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  regency?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  locationName: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsDateString()
  occurredAt: string;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  metadata?: any;
}
