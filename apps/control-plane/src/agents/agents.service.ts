import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AgentRegistrationDto,
  AgentResponseDto,
  AgentHeartbeatDto,
  AgentConfigDto,
  AgentStatus,
} from '@ark-asa/contracts';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a new agent or update existing agent registration
   */
  async registerAgent(dto: AgentRegistrationDto): Promise<AgentResponseDto> {
    this.logger.log(`Registering agent: ${dto.agentId} on host: ${dto.hostname}`);

    // Find or create host
    let host = await this.prisma.host.findUnique({
      where: { hostname: dto.hostname },
    });

    if (!host) {
      this.logger.log(`Creating new host: ${dto.hostname}`);
      host = await this.prisma.host.create({
        data: {
          hostname: dto.hostname,
        },
      });
    }

    // Find or create agent
    let agent = await this.prisma.agent.findUnique({
      where: { agentId: dto.agentId },
    });

    if (agent) {
      // Update existing agent
      agent = await this.prisma.agent.update({
        where: { id: agent.id },
        data: {
          hostId: host.id,
          status: AgentStatus.ONLINE,
          version: dto.version,
          lastSeenAt: new Date(),
        },
      });
      this.logger.log(`Updated existing agent: ${dto.agentId}`);
    } else {
      // Create new agent
      agent = await this.prisma.agent.create({
        data: {
          agentId: dto.agentId,
          hostId: host.id,
          status: AgentStatus.ONLINE,
          version: dto.version,
          lastSeenAt: new Date(),
        },
      });
      this.logger.log(`Created new agent: ${dto.agentId}`);
    }

    // Get assigned jobs (jobs that are QUEUED and assigned to this agent)
    const assignedJobs = await this.prisma.job.findMany({
      where: {
        agentId: agent.id,
        status: 'QUEUED',
      },
      select: {
        jobId: true,
      },
    });

    const config: AgentConfigDto = {
      pollIntervalSeconds: 5,
      heartbeatIntervalSeconds: 30,
      maxRetries: 3,
    };

    return {
      agentId: agent.agentId,
      status: agent.status as AgentStatus,
      assignedJobs: assignedJobs.map((j: { jobId: string }) => j.jobId),
      config,
    };
  }

  /**
   * Process agent heartbeat
   */
  async processHeartbeat(dto: AgentHeartbeatDto): Promise<void> {
    this.logger.debug(`Heartbeat from agent: ${dto.agentId}`);

    const agent = await this.prisma.agent.findUnique({
      where: { agentId: dto.agentId },
    });

    if (!agent) {
      this.logger.warn(`Heartbeat from unknown agent: ${dto.agentId}`);
      throw new NotFoundException(`Agent not found: ${dto.agentId}`);
    }

    // Update agent status and last seen timestamp
    await this.prisma.agent.update({
      where: { id: agent.id },
      data: {
        status: dto.status,
        lastSeenAt: new Date(),
      },
    });

    // Update job statuses based on activeJobIds
    // If a job is RUNNING but not in activeJobIds, it might have completed
    // (This is simplified - full implementation would handle job completion separately)
    // Note: Full job completion handling will be in JobsService
    // This is just updating the agent's last seen time
    // Future: const runningJobs = await this.prisma.job.findMany({ ... });
  }
}

