import { ControlPlaneClient } from '../api/client';
import { AgentConfig } from '../config/config';
import {
  AgentRegistrationDto,
  AgentHeartbeatDto,
  AgentResponseDto,
  AgentStatus,
  ResourceUsageDto,
} from '@ark-asa/contracts';
import * as os from 'os';

/**
 * Agent registration and heartbeat manager
 */
export class RegistrationManager {
  private readonly client: ControlPlaneClient;
  private readonly config: AgentConfig;
  private registrationResponse: AgentResponseDto | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private activeJobIds: string[] = [];
  
  constructor(client: ControlPlaneClient, config: AgentConfig) {
    this.client = client;
    this.config = config;
  }
  
  /**
   * Register agent with control plane
   */
  async register(): Promise<AgentResponseDto> {
    const dto: AgentRegistrationDto = {
      agentId: this.config.agentId,
      hostname: os.hostname(),
      capabilities: {
        supportsHardlinks: this.config.supportsHardlinks,
        maxConcurrentJobs: this.config.maxConcurrentJobs,
        supportedGameTypes: this.config.supportedGameTypes,
      },
      version: this.config.version,
    };
    
    try {
      this.registrationResponse = await this.client.register(dto);
      
      // Update config from response if provided
      if (this.registrationResponse.config) {
        this.updateConfigFromResponse(this.registrationResponse.config);
      }
      
      console.log(`Agent registered successfully: ${this.config.agentId}`);
      return this.registrationResponse;
    } catch (error) {
      console.error(`Registration failed: ${error}`);
      throw error;
    }
  }
  
  /**
   * Start heartbeat loop
   */
  startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    const intervalMs = this.config.heartbeatIntervalSeconds * 1000;
    
    // Send initial heartbeat immediately
    this.sendHeartbeat().catch(err => {
      console.error(`Initial heartbeat failed: ${err}`);
    });
    
    // Then send periodic heartbeats
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat().catch(err => {
        console.error(`Heartbeat failed: ${err}`);
      });
    }, intervalMs);
  }
  
  /**
   * Stop heartbeat loop
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  /**
   * Send heartbeat to control plane
   */
  private async sendHeartbeat(): Promise<void> {
    const resourceUsage = await this.getResourceUsage();
    
    const dto: AgentHeartbeatDto = {
      agentId: this.config.agentId,
      status: AgentStatus.ONLINE,
      activeJobIds: [...this.activeJobIds],
      resourceUsage,
    };
    
    try {
      await this.client.heartbeat(dto);
    } catch (error) {
      console.error(`Heartbeat error: ${error}`);
      // If agent not found, try to re-register
      if (error instanceof Error && error.message.includes('not found')) {
        console.log('Agent not found, attempting re-registration...');
        try {
          await this.register();
        } catch (regError) {
          console.error(`Re-registration failed: ${regError}`);
        }
      }
    }
  }
  
  /**
   * Update active job IDs (called by job executor)
   */
  updateActiveJobs(jobIds: string[]): void {
    this.activeJobIds = jobIds;
  }
  
  /**
   * Get current resource usage
   */
  private async getResourceUsage(): Promise<ResourceUsageDto> {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      
      // Get CPU usage (simplified - in production, use a proper library)
      const cpus = os.cpus();
      const cpuPercent = 0; // TODO: Implement proper CPU usage tracking
      
      return {
        cpuPercent,
        memoryMB: Math.round(usedMemory / (1024 * 1024)),
        diskFreeGB: 0, // TODO: Implement disk space check
      };
    } catch (error) {
      console.warn(`Failed to get resource usage: ${error}`);
      return {};
    }
  }
  
  /**
   * Update config from control plane response
   */
  private updateConfigFromResponse(config: AgentResponseDto['config']): void {
    if (!config) return;
    
    // Update intervals if provided
    if (config.pollIntervalSeconds) {
      this.config.pollIntervalSeconds = config.pollIntervalSeconds;
    }
    if (config.heartbeatIntervalSeconds) {
      this.config.heartbeatIntervalSeconds = config.heartbeatIntervalSeconds;
      // Restart heartbeat with new interval
      this.startHeartbeat();
    }
    if (config.maxRetries !== undefined) {
      this.config.maxRetries = config.maxRetries;
    }
  }
  
  /**
   * Get registration response
   */
  getRegistrationResponse(): AgentResponseDto | null {
    return this.registrationResponse;
  }
}

