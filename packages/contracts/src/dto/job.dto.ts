import { JobType, JobStatus } from '../enums';

/**
 * Job Create DTO
 * Request to create a new job
 */
export interface JobCreateDto {
  jobType: JobType;
  instanceId?: string; // Required for instance-specific jobs
  parameters: Record<string, unknown>; // Job-specific parameters
  priority?: number; // Higher = more priority, default 0
}

/**
 * Job Response DTO
 * Full job information
 */
export interface JobResponseDto {
  jobId: string;
  jobRunId: string; // Current or latest run
  jobType: JobType;
  status: JobStatus;
  instanceId?: string;
  agentId?: string;
  parameters: Record<string, unknown>;
  createdAt: string; // ISO 8601
  startedAt?: string; // ISO 8601
  completedAt?: string; // ISO 8601
  error?: string;
  retryCount: number;
  progressPercent?: number; // 0-100, current progress
  progressMessage?: string; // Current status message
}

/**
 * Job Progress DTO
 * Progress update from agent to control plane
 */
export interface JobProgressDto {
  jobId: string;
  jobRunId: string;
  status: JobStatus;
  percent?: number; // 0-100
  message: string;
  timestamp: string; // ISO 8601
}

/**
 * Job Poll Response DTO
 * Response when agent polls for assigned jobs
 */
export interface JobPollResponseDto {
  jobs: JobAssignmentDto[];
}

/**
 * Job Assignment DTO
 * Job assigned to an agent
 */
export interface JobAssignmentDto {
  jobId: string;
  jobRunId: string;
  jobType: JobType;
  instanceId?: string;
  parameters: Record<string, unknown>;
}

/**
 * Job Complete DTO
 * Final result reported by agent
 */
export interface JobCompleteDto {
  jobId: string;
  jobRunId: string;
  status: JobStatus; // COMPLETED | FAILED | CANCELLED
  result?: Record<string, unknown>; // Job-specific result data
  error?: string;
  errorDetails?: string; // Sanitized stack trace
}

