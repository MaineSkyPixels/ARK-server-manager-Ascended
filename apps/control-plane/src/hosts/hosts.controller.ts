import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { HostsService } from './hosts.service'; // Will be used when endpoints are implemented

@ApiTags('hosts')
@Controller('hosts')
export class HostsController {
  // Endpoints will be implemented in future milestones
  // constructor(private readonly hostsService: HostsService) {}
}

