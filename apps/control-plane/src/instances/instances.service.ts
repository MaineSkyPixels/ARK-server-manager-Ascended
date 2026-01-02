import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstanceCreateDto, InstanceResponseDto, LogEntryDto } from '@ark-asa/contracts';
import { InstanceLogsQueryDto } from './dto/log-entry.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class InstancesService {
  private readonly logger = new Logger(InstancesService.name);
  private readonly runtimeRoot = process.env.RUNTIME_ROOT || 'D:\\Ark ASA ASM\\runtime';

  constructor(private readonly prisma: PrismaService) {}

  // Placeholder for future implementation
  async createInstance(dto: InstanceCreateDto): Promise<InstanceResponseDto> {
    this.logger.log(`Creating instance: ${dto.name}`);
    // Implementation will be added in future milestones
    throw new Error('Not implemented');
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

