import { AgentStatus } from '../enums';

/**
 * Agent Registration DTO
 * Sent by agent to control plane during registration
 */
export interface AgentRegistrationDto {
  agentId: string;
  hostname: string;
  capabilities: AgentCapabilitiesDto;
  version: string;
}

/**
 * Agent Capabilities DTO
 * Describes what the agent can do
 */
export interface AgentCapabilitiesDto {
  supportsHardlinks: boolean;
  maxConcurrentJobs: number;
  supportedGameTypes: string[]; // ['ASA', 'ASE']
}

/**
 * Agent Response DTO
 * Returned by control plane after registration
 */
export interface AgentResponseDto {
  agentId: string;
  status: AgentStatus;
  assignedJobs: string[]; // jobIds
  config: AgentConfigDto;
}

/**
 * Agent Config DTO
 * Configuration sent from control plane to agent
 */
export interface AgentConfigDto {
  pollIntervalSeconds: number;
  heartbeatIntervalSeconds: number;
  maxRetries: number;
}

/**
 * Agent Heartbeat DTO
 * Sent periodically by agent to control plane
 */
export interface AgentHeartbeatDto {
  agentId: string;
  status: AgentStatus;
  activeJobIds: string[];
  resourceUsage?: ResourceUsageDto;
}

/**
 * Resource Usage DTO
 * Optional metrics about agent resource consumption
 */
export interface ResourceUsageDto {
  cpuPercent?: number;
  memoryMB?: number;
  diskFreeGB?: number;
}

