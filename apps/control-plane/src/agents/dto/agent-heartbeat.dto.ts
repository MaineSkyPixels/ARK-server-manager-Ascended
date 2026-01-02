import { IsString, IsEnum, IsArray, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AgentHeartbeatDto, AgentStatus, ResourceUsageDto } from '@ark-asa/contracts';

export class ResourceUsageDtoClass implements ResourceUsageDto {
  @IsOptional()
  @IsNumber()
  cpuPercent?: number;

  @IsOptional()
  @IsNumber()
  memoryMB?: number;

  @IsOptional()
  @IsNumber()
  diskFreeGB?: number;
}

export class AgentHeartbeatDtoClass implements AgentHeartbeatDto {
  @IsString()
  agentId!: string;

  @IsEnum(AgentStatus)
  status!: AgentStatus;

  @IsArray()
  @IsString({ each: true })
  activeJobIds!: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ResourceUsageDtoClass)
  resourceUsage?: ResourceUsageDtoClass;
}

