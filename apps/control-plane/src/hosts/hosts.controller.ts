import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HostsService } from './hosts.service';

@ApiTags('hosts')
@Controller('hosts')
export class HostsController {
  constructor(private readonly hostsService: HostsService) {}

  // Endpoints will be implemented in future milestones
}

