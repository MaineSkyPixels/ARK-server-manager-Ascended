import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { InstanceListDto, GameType, InstanceStatus } from '@ark-asa/contracts';

export class InstanceListQueryDto implements InstanceListDto {
  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsEnum(GameType)
  gameType?: GameType;

  @IsOptional()
  @IsEnum(InstanceStatus)
  status?: InstanceStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

