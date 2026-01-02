import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HostDto, HostCreateDto } from '@ark-asa/contracts';

@Injectable()
export class HostsService {
  private readonly logger = new Logger(HostsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Placeholder for future implementation
  async createHost(dto: HostCreateDto): Promise<HostDto> {
    this.logger.log(`Creating host: ${dto.hostname}`);
    // Implementation will be added in future milestones
    throw new Error('Not implemented');
  }
}

