import { IsEnum, IsString, IsOptional, IsObject, IsNumber, Min } from 'class-validator';
import { JobCreateDto, JobType } from '@ark-asa/contracts';

export class JobCreateDtoClass implements JobCreateDto {
  @IsEnum(JobType)
  jobType!: JobType;

  @IsOptional()
  @IsString()
  instanceId?: string;

  @IsObject()
  parameters!: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;
}

