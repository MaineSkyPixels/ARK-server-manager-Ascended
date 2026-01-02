import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InstancesService } from './instances.service';
import { LogEntryDto } from '@ark-asa/contracts';
import { InstanceLogsQueryDto } from './dto/log-entry.dto';

@ApiTags('instances')
@Controller('instances')
export class InstancesController {
  constructor(private readonly instancesService: InstancesService) {}

  @Get(':instanceId/logs')
  @ApiOperation({ summary: 'Get log entries for an instance' })
  @ApiParam({ name: 'instanceId', description: 'Instance identifier' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of log entries (1-1000, default: 100)' })
  @ApiQuery({ name: 'since', required: false, description: 'ISO 8601 timestamp to fetch logs since' })
  @ApiQuery({ name: 'level', required: false, description: 'Filter by log level (INFO, WARN, ERROR, DEBUG, TRACE)' })
  @ApiResponse({
    status: 200,
    description: 'List of log entries',
    type: [Object],
  })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  async getInstanceLogs(
    @Param('instanceId') instanceId: string,
    @Query() query: InstanceLogsQueryDto,
  ): Promise<LogEntryDto[]> {
    return this.instancesService.getInstanceLogs(instanceId, query);
  }
}

