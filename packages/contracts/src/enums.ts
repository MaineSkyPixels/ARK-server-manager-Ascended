/**
 * Game Type Enum
 * CRITICAL: Every instance MUST specify gameType = ASA | ASE
 * ASA is supported; ASE is a stub adapter.
 */
export enum GameType {
  ASA = 'ASA',
  ASE = 'ASE',
}

/**
 * Job Status Enum
 * Represents the lifecycle state of a job
 */
export enum JobStatus {
  CREATED = 'CREATED',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Standard Job Types
 * All job types must be idempotent and retryable.
 * New job types require LEAD approval.
 */
export enum JobType {
  INSTALL_SERVER = 'INSTALL_SERVER',
  UPDATE_SERVER = 'UPDATE_SERVER',
  START_INSTANCE = 'START_INSTANCE',
  STOP_INSTANCE = 'STOP_INSTANCE',
  RESTART_INSTANCE = 'RESTART_INSTANCE',
  BACKUP_INSTANCE = 'BACKUP_INSTANCE',
  VERIFY_BACKUP = 'VERIFY_BACKUP',
  RESTORE_BACKUP = 'RESTORE_BACKUP',
  PRUNE_BACKUPS = 'PRUNE_BACKUPS',
  SYNC_MODS = 'SYNC_MODS',
  ACTIVATE_BUILD = 'ACTIVATE_BUILD',
}

/**
 * Agent Status Enum
 * Represents the registration and health state of an agent
 */
export enum AgentStatus {
  OFFLINE = 'OFFLINE',
  REGISTERING = 'REGISTERING',
  ONLINE = 'ONLINE',
  DEGRADED = 'DEGRADED',
}

/**
 * Instance Status Enum
 * Represents the runtime state of a server instance
 */
export enum InstanceStatus {
  STOPPED = 'STOPPED',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  STOPPING = 'STOPPING',
  ERROR = 'ERROR',
}

