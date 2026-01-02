import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { InstanceCreateDto, GameType } from '@ark-asa/contracts';

export class InstanceCreateDtoClass implements InstanceCreateDto {
  @IsString()
  name!: string;

  @IsEnum(GameType)
  gameType!: GameType;

  @IsString()
  agentId!: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

