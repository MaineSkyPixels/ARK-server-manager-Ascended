import { IsString, ValidateNested, IsArray, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { AgentRegistrationDto, AgentCapabilitiesDto } from '@ark-asa/contracts';

export class AgentCapabilitiesDtoClass implements AgentCapabilitiesDto {
  @IsBoolean()
  supportsHardlinks!: boolean;

  @IsNumber()
  maxConcurrentJobs!: number;

  @IsArray()
  @IsString({ each: true })
  supportedGameTypes!: string[];
}

export class AgentRegistrationDtoClass implements AgentRegistrationDto {
  @IsString()
  agentId!: string;

  @IsString()
  hostname!: string;

  @ValidateNested()
  @Type(() => AgentCapabilitiesDtoClass)
  capabilities!: AgentCapabilitiesDtoClass;

  @IsString()
  version!: string;
}

