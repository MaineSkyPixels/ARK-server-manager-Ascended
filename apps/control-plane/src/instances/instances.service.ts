import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/config.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import {
  InstanceCreateDto,
  InstanceResponseDto,
  InstanceUpdateDto,
  InstanceListDto,
  LogEntryDto,
  InstanceStatus,
  GameType,
} from '@ark-asa/contracts';
import { InstanceLogsQueryDto } from './dto/log-entry.dto';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class InstancesService {
  private readonly logger = new Logger(InstancesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly wsGateway: WebsocketGateway,
  ) {}

  private get runtimeRoot(): string {
    return this.config.runtimeRoot;
  }

  /**
   * Create a new server instance
   */
  async createInstance(dto: InstanceCreateDto): Promise<InstanceResponseDto> {
    this.logger.log(`Creating instance: ${dto.name} (gameType: ${dto.gameType})`);

    // Validate agent exists
    const agent = await this.prisma.agent.findUnique({
      where: { agentId: dto.agentId },
      include: { host: true },
    });

    if (!agent) {
      throw new NotFoundException(`Agent not found: ${dto.agentId}`);
    }

    // Generate unique instance ID
    const instanceId = `inst-${uuidv4()}`;

    // Create instance in database
    const instance = await this.prisma.instance.create({
      data: {
        instanceId,
        name: dto.name,
        gameType: dto.gameType,
        status: InstanceStatus.STOPPED,
        agentId: agent.id,
        hostId: agent.hostId,
        config: dto.config || null,
      },
    });

    this.logger.log(`Created instance: ${instanceId}`);

    const response = this.mapToResponseDto(instance);

    // Emit WebSocket event for instance creation
    this.wsGateway.emitInstanceCreated({
      instanceId,
      name: instance.name,
      gameType: instance.gameType,
      createdAt: instance.createdAt.toISOString(),
    });

    return response;
  }

  /**
   * Get instance by ID
   */
  async getInstanceById(instanceId: string): Promise<InstanceResponseDto> {
    const instance = await this.prisma.instance.findUnique({
      where: { instanceId },
      include: { agent: true },
    });

    if (!instance) {
      throw new NotFoundException(`Instance not found: ${instanceId}`);
    }

    return this.mapToResponseDto(instance);
  }

  /**
   * List instances with optional filters
   */
  async listInstances(query: InstanceListDto): Promise<InstanceResponseDto[]> {
    const where: any = {};

    if (query.agentId) {
      const agent = await this.prisma.agent.findUnique({
        where: { agentId: query.agentId },
      });
      if (agent) {
        where.agentId = agent.id;
      } else {
        // Agent not found, return empty list
        return [];
      }
    }

    if (query.gameType) {
      where.gameType = query.gameType;
    }

    if (query.status) {
      where.status = query.status;
    }

    const instances = await this.prisma.instance.findMany({
      where,
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
      take: query.limit || 100,
      skip: query.offset || 0,
    });

    return instances.map((instance: any) => this.mapToResponseDto(instance));
  }

  /**
   * Update instance
   */
  async updateInstance(instanceId: string, dto: InstanceUpdateDto): Promise<InstanceResponseDto> {
    const instance = await this.prisma.instance.findUnique({
      where: { instanceId },
      include: { agent: true },
    });

    if (!instance) {
      throw new NotFoundException(`Instance not found: ${instanceId}`);
    }

    const oldStatus = instance.status;
    const updated = await this.prisma.instance.update({
      where: { id: instance.id },
      include: { agent: true },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.config !== undefined && { config: dto.config }),
      },
    });

    this.logger.log(`Updated instance: ${instanceId}`);

    const response = this.mapToResponseDto(updated);

    // Emit WebSocket event for instance update
    this.wsGateway.emitInstanceUpdated({
      instanceId,
      updatedAt: updated.updatedAt.toISOString(),
    });

    // Emit status changed event if status changed
    if (oldStatus !== updated.status) {
      this.wsGateway.emitInstanceStatusChanged({
        instanceId,
        status: updated.status as InstanceStatus,
        changedAt: updated.updatedAt.toISOString(),
      });
    }

    return response;
  }

  /**
   * Delete instance
   */
  async deleteInstance(instanceId: string): Promise<void> {
    const instance = await this.prisma.instance.findUnique({
      where: { instanceId },
    });

    if (!instance) {
      throw new NotFoundException(`Instance not found: ${instanceId}`);
    }

    // Check if instance has running jobs
    const runningJobs = await this.prisma.job.findFirst({
      where: {
        instanceId: instance.id,
        status: {
          in: ['QUEUED', 'RUNNING'],
        },
      },
    });

    if (runningJobs) {
      throw new BadRequestException(
        `Cannot delete instance ${instanceId}: has running or queued jobs`,
      );
    }

    await this.prisma.instance.delete({
      where: { id: instance.id },
    });

    this.logger.log(`Deleted instance: ${instanceId}`);

    // Emit WebSocket event for instance deletion
    this.wsGateway.emitInstanceDeleted({
      instanceId,
      deletedAt: new Date().toISOString(),
    });
  }

  /**
   * Map Prisma instance to response DTO
   */
  private mapToResponseDto(instance: any): InstanceResponseDto {
    // Get external agentId from agent relation if available
    const agentId = instance.agent?.agentId || '';
    
    return {
      instanceId: instance.instanceId,
      name: instance.name,
      gameType: instance.gameType as GameType,
      status: instance.status as InstanceStatus,
      agentId,
      createdAt: instance.createdAt.toISOString(),
      updatedAt: instance.updatedAt.toISOString(),
      config: (instance.config as Record<string, unknown>) || undefined,
    };
  }

  /**
   * Get logs for an instance
   * Reads logs from the file system per STORAGE_LAYOUT.md
   */
  async getInstanceLogs(
    instanceId: string,
    query: InstanceLogsQueryDto,
  ): Promise<LogEntryDto[]> {
    this.logger.debug(`Fetching logs for instance: ${instanceId}`);

    // Verify instance exists
    const instance = await this.prisma.instance.findUnique({
      where: { instanceId },
    });

    if (!instance) {
      throw new NotFoundException(`Instance not found: ${instanceId}`);
    }

    // Log file path per STORAGE_LAYOUT.md: runtime/logs/instances/{instanceId}.log
    const logFilePath = path.join(
      this.runtimeRoot,
      'logs',
      'instances',
      `${instanceId}.log`,
    );

    try {
      // Read log file
      const logContent = await fs.readFile(logFilePath, 'utf-8');
      const lines = logContent.split('\n').filter((line) => line.trim());

      // Parse log entries (assuming format: [TIMESTAMP] [LEVEL] MESSAGE)
      // This is a simplified parser - actual format may vary
      const entries: LogEntryDto[] = [];
      const sinceDate = query.since ? new Date(query.since) : null;
      const levelFilter = query.level?.toUpperCase();

      for (const line of lines) {
        // Try to parse log line
        // Format: [2024-01-15T10:30:00.000Z] [INFO] Message here
        const match = line.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.+)$/);
        if (match) {
          const [, timestamp, level, message] = match;
          const entryDate = new Date(timestamp);

          // Apply filters
          if (sinceDate && entryDate < sinceDate) {
            continue;
          }

          if (levelFilter && level.toUpperCase() !== levelFilter) {
            continue;
          }

          entries.push({
            timestamp,
            level: level.toUpperCase(),
            message: message.trim(),
          });
        } else {
          // Fallback: treat entire line as message with current timestamp
          entries.push({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: line.trim(),
          });
        }
      }

      // Sort by timestamp (newest first)
      entries.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      // Apply limit
      const limit = query.limit || 100;
      return entries.slice(0, limit);
    } catch (error) {
      // If file doesn't exist, return empty array (instance may not have logs yet)
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.logger.debug(`Log file not found for instance: ${instanceId}`);
        return [];
      }
      throw error;
    }
  }
}

