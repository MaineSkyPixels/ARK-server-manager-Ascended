import { GameType, InstanceStatus } from '../enums';

/**
 * Instance Create DTO
 * Request to create a new server instance
 */
export interface InstanceCreateDto {
  name: string;
  gameType: GameType;
  agentId: string;
  config?: Record<string, unknown>; // Instance-specific config
}

/**
 * Instance Response DTO
 * Full instance information
 */
export interface InstanceResponseDto {
  instanceId: string;
  name: string;
  gameType: GameType;
  status: InstanceStatus;
  agentId: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  config?: Record<string, unknown>;
}

/**
 * Instance Update DTO
 * Partial update to instance properties
 */
export interface InstanceUpdateDto {
  name?: string;
  config?: Record<string, unknown>;
}

/**
 * Instance List DTO
 * Query parameters for listing instances
 */
export interface InstanceListDto {
  agentId?: string;
  gameType?: GameType;
  status?: InstanceStatus;
  limit?: number;
  offset?: number;
}

/**
 * Log Entry DTO
 * Represents a single log entry for an instance
 */
export interface LogEntryDto {
  timestamp: string; // ISO 8601
  level: string; // INFO, WARN, ERROR, DEBUG, TRACE
  message: string;
}

