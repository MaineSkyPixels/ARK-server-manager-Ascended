import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { InstancesService } from './instances.service';
import {
  InstanceResponseDto,
  LogEntryDto,
} from '@ark-asa/contracts';
import { InstanceCreateDtoClass } from './dto/instance-create.dto';
import { InstanceUpdateDtoClass } from './dto/instance-update.dto';
import { InstanceListQueryDto } from './dto/instance-list.dto';
import { InstanceLogsQueryDto } from './dto/log-entry.dto';

@ApiTags('instances')
@Controller('instances')
export class InstancesController {
  constructor(private readonly instancesService: InstancesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new server instance' })
  @ApiBody({ type: InstanceCreateDtoClass })
  @ApiResponse({
    status: 201,
    description: 'Instance created successfully',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createInstance(@Body() dto: InstanceCreateDtoClass): Promise<InstanceResponseDto> {
    return this.instancesService.createInstance(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List instances with optional filters' })
  @ApiQuery({ name: 'agentId', required: false, description: 'Filter by agent ID' })
  @ApiQuery({ name: 'gameType', required: false, description: 'Filter by game type (ASA/ASE)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by instance status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results (default: 100)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of instances',
    type: [Object],
  })
  async listInstances(@Query() query: InstanceListQueryDto): Promise<InstanceResponseDto[]> {
    return this.instancesService.listInstances(query);
  }

  @Get(':instanceId')
  @ApiOperation({ summary: 'Get instance by ID' })
  @ApiParam({ name: 'instanceId', description: 'Instance identifier' })
  @ApiResponse({
    status: 200,
    description: 'Instance details',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  async getInstance(@Param('instanceId') instanceId: string): Promise<InstanceResponseDto> {
    return this.instancesService.getInstanceById(instanceId);
  }

  @Put(':instanceId')
  @ApiOperation({ summary: 'Update instance' })
  @ApiParam({ name: 'instanceId', description: 'Instance identifier' })
  @ApiBody({ type: InstanceUpdateDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Instance updated successfully',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  async updateInstance(
    @Param('instanceId') instanceId: string,
    @Body() dto: InstanceUpdateDtoClass,
  ): Promise<InstanceResponseDto> {
    return this.instancesService.updateInstance(instanceId, dto);
  }

  @Delete(':instanceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete instance' })
  @ApiParam({ name: 'instanceId', description: 'Instance identifier' })
  @ApiResponse({
    status: 204,
    description: 'Instance deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete instance with running jobs' })
  async deleteInstance(@Param('instanceId') instanceId: string): Promise<void> {
    return this.instancesService.deleteInstance(instanceId);
  }

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

