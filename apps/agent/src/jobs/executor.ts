import { ControlPlaneClient } from '../api/client';
import { AgentConfig } from '../config/config';
import {
  JobAssignmentDto,
  JobStatus,
  JobProgressDto,
  JobCompleteDto,
  JobType,
} from '@ark-asa/contracts';
import { ProcessControlHandler } from './handlers/process-control';
import { SteamCMDHandler } from './handlers/steamcmd';
import { BuildActivator } from '../runtime/build-activator';

/**
 * Job executor - manages job execution lifecycle
 */
export class JobExecutor {
  private readonly client: ControlPlaneClient;
  private readonly config: AgentConfig;
  private readonly activeJobs = new Map<string, Promise<void>>();
  private readonly maxConcurrent: number;
  private readonly processControlHandler: ProcessControlHandler;
  private readonly steamCmdHandler: SteamCMDHandler;
  private readonly buildActivator: BuildActivator;
  
  constructor(client: ControlPlaneClient, config: AgentConfig) {
    this.client = client;
    this.config = config;
    this.maxConcurrent = config.maxConcurrentJobs;
    this.processControlHandler = new ProcessControlHandler(config.runtimeRoot);
    this.steamCmdHandler = new SteamCMDHandler(config.runtimeRoot, config.supportsHardlinks);
    this.buildActivator = new BuildActivator(config.runtimeRoot, config.supportsHardlinks);
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
      
      // Execute job
      const result = await this.executeJobInternal(job);
      
      // Report completion
      await this.reportComplete({
        jobId: job.jobId,
        jobRunId: job.jobRunId,
        status: JobStatus.COMPLETED,
        result: result || { message: 'Job completed successfully' },
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
   * Execute job internal logic
   */
  private async executeJobInternal(job: JobAssignmentDto): Promise<Record<string, unknown>> {
    // Route to appropriate handler based on job type
    switch (job.jobType) {
      case JobType.START_INSTANCE:
      case JobType.STOP_INSTANCE:
      case JobType.RESTART_INSTANCE:
        return this.processControlHandler.handle(
          job,
          async (percent, message) => {
            await this.reportProgress({
              jobId: job.jobId,
              jobRunId: job.jobRunId,
              status: JobStatus.RUNNING,
              percent,
              message,
              timestamp: new Date().toISOString(),
            });
          },
        );

      case JobType.INSTALL_SERVER:
      case JobType.UPDATE_SERVER:
        return this.steamCmdHandler.handle(
          job,
          async (percent, message) => {
            await this.reportProgress({
              jobId: job.jobId,
              jobRunId: job.jobRunId,
              status: JobStatus.RUNNING,
              percent,
              message,
              timestamp: new Date().toISOString(),
            });
          },
        );

      case JobType.BACKUP_INSTANCE:
      case JobType.VERIFY_BACKUP:
      case JobType.RESTORE_BACKUP:
      case JobType.PRUNE_BACKUPS:
      case JobType.ACTIVATE_BUILD:
        return this.activateBuild(
          job,
          async (percent, message) => {
            await this.reportProgress({
              jobId: job.jobId,
              jobRunId: job.jobRunId,
              status: JobStatus.RUNNING,
              percent,
              message,
              timestamp: new Date().toISOString(),
            });
          },
        );

      case JobType.SYNC_MODS:
        // Not yet implemented - return placeholder
        await this.reportProgress({
          jobId: job.jobId,
          jobRunId: job.jobRunId,
          status: JobStatus.RUNNING,
          percent: 50,
          message: `Job type ${job.jobType} not yet implemented`,
          timestamp: new Date().toISOString(),
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        throw new Error(`Job type ${job.jobType} is not yet implemented`);

      default:
        throw new Error(`Unknown job type: ${job.jobType}`);
    }
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

  /**
   * Activate a cached build for an instance
   */
  private async activateBuild(
    job: JobAssignmentDto,
    reportProgress: (percent: number, message: string) => Promise<void>,
  ): Promise<Record<string, unknown>> {
    await reportProgress(10, 'Preparing build activation...');

    const instanceId = job.instanceId;
    if (!instanceId) {
      throw new Error('Instance ID is required for ACTIVATE_BUILD job');
    }

    const buildId = job.parameters.buildId as string;
    if (!buildId) {
      throw new Error('Build ID is required for ACTIVATE_BUILD job');
    }

    const gameType = (job.parameters.gameType as string) || 'ASA';

    await reportProgress(30, `Activating build ${buildId} for instance ${instanceId}...`);

    // Activate build (creates hardlinks or copies)
    await this.buildActivator.activateBuild(buildId, instanceId, gameType);

    await reportProgress(100, `Build ${buildId} activated successfully for instance ${instanceId}`);

    return {
      buildId,
      instanceId,
      gameType,
      status: 'activated',
    };
  }
}

