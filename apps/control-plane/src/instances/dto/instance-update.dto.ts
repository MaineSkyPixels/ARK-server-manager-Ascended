import { IsString, IsOptional, IsObject } from 'class-validator';
import { InstanceUpdateDto } from '@ark-asa/contracts';

export class InstanceUpdateDtoClass implements InstanceUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

