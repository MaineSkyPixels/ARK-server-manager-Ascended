import { IsString, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { JobProgressDto, JobStatus } from '@ark-asa/contracts';

export class JobProgressDtoClass implements JobProgressDto {
  @IsString()
  jobId!: string;

  @IsString()
  jobRunId!: string;

  @IsEnum(JobStatus)
  status!: JobStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percent?: number;

  @IsString()
  message!: string;

  @IsString()
  timestamp!: string;
}

