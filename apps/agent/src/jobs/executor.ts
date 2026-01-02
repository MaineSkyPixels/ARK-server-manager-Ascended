import { ControlPlaneClient } from '../api/client';
import { AgentConfig } from '../config/config';
import {
  JobAssignmentDto,
  JobStatus,
  JobProgressDto,
  JobCompleteDto,
} from '@ark-asa/contracts';

/**
 * Job executor - manages job execution lifecycle
 */
export class JobExecutor {
  private readonly client: ControlPlaneClient;
  private readonly config: AgentConfig;
  private readonly activeJobs = new Map<string, Promise<void>>();
  private readonly maxConcurrent: number;
  
  constructor(client: ControlPlaneClient, config: AgentConfig) {
    this.client = client;
    this.config = config;
    this.maxConcurrent = config.maxConcurrentJobs;
  }
  
  /**
   * Submit a job for execution
   */
  async submitJob(job: JobAssignmentDto): Promise<void> {
    // Check if already executing
    if (this.activeJobs.has(job.jobId)) {
      console.log(`Job ${job.jobId} is already executing`);
      return;
    }
    
    // Check concurrency limit
    if (this.activeJobs.size >= this.maxConcurrent) {
      console.log(`Concurrency limit reached (${this.maxConcurrent}), queuing job ${job.jobId}`);
      // In a real implementation, we'd queue this job
      // For now, we'll just log and skip
      return;
    }
    
    // Execute job
    const jobPromise = this.executeJob(job);
    this.activeJobs.set(job.jobId, jobPromise);
    
    // Clean up when done
    jobPromise.finally(() => {
      this.activeJobs.delete(job.jobId);
    });
  }
  
  /**
   * Execute a job
   */
  private async executeJob(job: JobAssignmentDto): Promise<void> {
    console.log(`Starting job ${job.jobId} (type: ${job.jobType})`);
    
    try {
      // Report job started
      await this.reportProgress({
        jobId: job.jobId,
        jobRunId: job.jobRunId,
        status: JobStatus.RUNNING,
        percent: 0,
        message: `Job ${job.jobType} started`,
        timestamp: new Date().toISOString(),
      });
      
      // TODO: Implement actual job execution logic
      // For now, we'll simulate a simple job
      await this.executeJobInternal(job);
      
      // Report completion
      await this.reportComplete({
        jobId: job.jobId,
        jobRunId: job.jobRunId,
        status: JobStatus.COMPLETED,
        result: { message: 'Job completed successfully' },
      });
      
      console.log(`Job ${job.jobId} completed successfully`);
    } catch (error) {
      console.error(`Job ${job.jobId} failed: ${error}`);
      
      // Report failure
      await this.reportComplete({
        jobId: job.jobId,
        jobRunId: job.jobRunId,
        status: JobStatus.FAILED,
        error: error instanceof Error ? error.message : String(error),
        errorDetails: error instanceof Error ? error.stack : undefined,
      });
    }
  }
  
  /**
   * Execute job internal logic (placeholder)
   */
  private async executeJobInternal(job: JobAssignmentDto): Promise<void> {
    // TODO: Implement actual job handlers
    // For now, simulate work
    await this.reportProgress({
      jobId: job.jobId,
      jobRunId: job.jobRunId,
      status: JobStatus.RUNNING,
      percent: 50,
      message: `Processing ${job.jobType}...`,
      timestamp: new Date().toISOString(),
    });
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.reportProgress({
      jobId: job.jobId,
      jobRunId: job.jobRunId,
      status: JobStatus.RUNNING,
      percent: 100,
      message: `Completed ${job.jobType}`,
      timestamp: new Date().toISOString(),
    });
  }
  
  /**
   * Report job progress
   */
  private async reportProgress(dto: JobProgressDto): Promise<void> {
    try {
      await this.client.reportProgress(dto);
    } catch (error) {
      console.error(`Failed to report progress for job ${dto.jobId}: ${error}`);
      // Don't throw - progress reporting failures shouldn't stop job execution
    }
  }
  
  /**
   * Report job completion
   */
  private async reportComplete(dto: JobCompleteDto): Promise<void> {
    try {
      await this.client.reportComplete(dto);
    } catch (error) {
      console.error(`Failed to report completion for job ${dto.jobId}: ${error}`);
      // Still throw to ensure error is logged
      throw error;
    }
  }
  
  /**
   * Get active job IDs
   */
  getActiveJobIds(): string[] {
    return Array.from(this.activeJobs.keys());
  }
  
  /**
   * Check if executor has capacity
   */
  hasCapacity(): boolean {
    return this.activeJobs.size < this.maxConcurrent;
  }
}

