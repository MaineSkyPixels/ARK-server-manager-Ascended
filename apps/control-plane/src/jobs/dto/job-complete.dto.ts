import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { JobCompleteDto, JobStatus } from '@ark-asa/contracts';

export class JobCompleteDtoClass implements JobCompleteDto {
  @IsString()
  jobId!: string;

  @IsString()
  jobRunId!: string;

  @IsEnum([JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED])
  status!: JobStatus;

  @IsOptional()
  @IsObject()
  result?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  errorDetails?: string;
}

