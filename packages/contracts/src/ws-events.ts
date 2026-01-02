import { JobStatus, InstanceStatus } from './enums';
import { JobProgressDto } from './dto';

/**
 * WebSocket Event Names
 * All WebSocket events emitted by control plane to UI clients
 */
export enum WSEventName {
  // Job events
  JOB_CREATED = 'job:created',
  JOB_PROGRESS = 'job:progress',
  JOB_COMPLETED = 'job:completed',
  JOB_FAILED = 'job:failed',
  JOB_CANCELLED = 'job:cancelled',

  // Instance events
  INSTANCE_CREATED = 'instance:created',
  INSTANCE_UPDATED = 'instance:updated',
  INSTANCE_STATUS_CHANGED = 'instance:status_changed',
  INSTANCE_DELETED = 'instance:deleted',
  INSTANCE_LOG = 'instance:log',

  // Agent events
  AGENT_REGISTERED = 'agent:registered',
  AGENT_HEARTBEAT = 'agent:heartbeat',
  AGENT_OFFLINE = 'agent:offline',

  // System events
  SYSTEM_ERROR = 'system:error',
}

/**
 * WebSocket Event Payload Types
 * Type-safe payloads for each event
 */

export interface WSJobCreatedEvent {
  event: WSEventName.JOB_CREATED;
  data: {
    jobId: string;
    jobType: string;
    instanceId?: string;
    createdAt: string;
  };
}

export interface WSJobProgressEvent {
  event: WSEventName.JOB_PROGRESS;
  data: JobProgressDto;
}

export interface WSJobCompletedEvent {
  event: WSEventName.JOB_COMPLETED;
  data: {
    jobId: string;
    jobRunId: string;
    result?: Record<string, unknown>;
    completedAt: string;
  };
}

export interface WSJobFailedEvent {
  event: WSEventName.JOB_FAILED;
  data: {
    jobId: string;
    jobRunId: string;
    error: string;
    failedAt: string;
  };
}

export interface WSJobCancelledEvent {
  event: WSEventName.JOB_CANCELLED;
  data: {
    jobId: string;
    jobRunId: string;
    cancelledAt: string;
  };
}

export interface WSInstanceCreatedEvent {
  event: WSEventName.INSTANCE_CREATED;
  data: {
    instanceId: string;
    name: string;
    gameType: string;
    createdAt: string;
  };
}

export interface WSInstanceUpdatedEvent {
  event: WSEventName.INSTANCE_UPDATED;
  data: {
    instanceId: string;
    updatedAt: string;
  };
}

export interface WSInstanceStatusChangedEvent {
  event: WSEventName.INSTANCE_STATUS_CHANGED;
  data: {
    instanceId: string;
    status: InstanceStatus;
    changedAt: string;
  };
}

export interface WSInstanceDeletedEvent {
  event: WSEventName.INSTANCE_DELETED;
  data: {
    instanceId: string;
    deletedAt: string;
  };
}

export interface WSInstanceLogEvent {
  event: WSEventName.INSTANCE_LOG;
  data: {
    instanceId: string;
    timestamp: string; // ISO 8601
    level: string; // INFO, WARN, ERROR, DEBUG, TRACE
    message: string;
  };
}

export interface WSAgentRegisteredEvent {
  event: WSEventName.AGENT_REGISTERED;
  data: {
    agentId: string;
    hostname: string;
    registeredAt: string;
  };
}

export interface WSAgentHeartbeatEvent {
  event: WSEventName.AGENT_HEARTBEAT;
  data: {
    agentId: string;
    status: string;
    timestamp: string;
  };
}

export interface WSAgentOfflineEvent {
  event: WSEventName.AGENT_OFFLINE;
  data: {
    agentId: string;
    lastSeenAt: string;
  };
}

export interface WSSystemErrorEvent {
  event: WSEventName.SYSTEM_ERROR;
  data: {
    error: string;
    timestamp: string;
    context?: Record<string, unknown>;
  };
}

/**
 * Union type of all WebSocket events
 */
export type WSEvent =
  | WSJobCreatedEvent
  | WSJobProgressEvent
  | WSJobCompletedEvent
  | WSJobFailedEvent
  | WSJobCancelledEvent
  | WSInstanceCreatedEvent
  | WSInstanceUpdatedEvent
  | WSInstanceStatusChangedEvent
  | WSInstanceDeletedEvent
  | WSInstanceLogEvent
  | WSAgentRegisteredEvent
  | WSAgentHeartbeatEvent
  | WSAgentOfflineEvent
  | WSSystemErrorEvent;

