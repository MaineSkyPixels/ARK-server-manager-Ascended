import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { LogEntryDto } from '@ark-asa/contracts';

export class LogEntryDtoClass implements LogEntryDto {
  @IsString()
  timestamp!: string;

  @IsString()
  level!: string;

  @IsString()
  message!: string;
}

export class InstanceLogsQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 100;

  @IsOptional()
  @IsString()
  since?: string; // ISO 8601 timestamp

  @IsOptional()
  @IsEnum(['INFO', 'WARN', 'ERROR', 'DEBUG', 'TRACE'], {
    message: 'level must be one of: INFO, WARN, ERROR, DEBUG, TRACE',
  })
  level?: string;
}

