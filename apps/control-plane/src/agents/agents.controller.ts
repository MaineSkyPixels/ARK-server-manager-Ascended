import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import {
  AgentResponseDto,
} from '@ark-asa/contracts';
import { AgentRegistrationDtoClass } from './dto/agent-registration.dto';
import { AgentHeartbeatDtoClass } from './dto/agent-heartbeat.dto';

@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  private readonly logger = new Logger(AgentsController.name);

  constructor(private readonly agentsService: AgentsService) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a new agent or update existing registration' })
  @ApiBody({ type: AgentRegistrationDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Agent registered successfully',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async register(@Body() dto: AgentRegistrationDtoClass): Promise<AgentResponseDto> {
    this.logger.log(`Agent registration request: ${dto.agentId}`);
    return this.agentsService.registerAgent(dto);
  }

  @Post('heartbeat')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Send agent heartbeat' })
  @ApiBody({ type: AgentHeartbeatDtoClass })
  @ApiResponse({
    status: 204,
    description: 'Heartbeat received',
  })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async heartbeat(@Body() dto: AgentHeartbeatDtoClass): Promise<void> {
    this.logger.debug(`Heartbeat received from agent: ${dto.agentId}`);
    await this.agentsService.processHeartbeat(dto);
  }
}

