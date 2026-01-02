import { ControlPlaneClient } from '../api/client';
import { AgentConfig } from '../config/config';
import { JobAssignmentDto, JobStatus } from '@ark-asa/contracts';
import { JobExecutor } from './executor';

/**
 * Job polling manager
 */
export class JobPoller {
  private readonly client: ControlPlaneClient;
  private readonly config: AgentConfig;
  private readonly executor: JobExecutor;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  
  constructor(
    client: ControlPlaneClient,
    config: AgentConfig,
    executor: JobExecutor
  ) {
    this.client = client;
    this.config = config;
    this.executor = executor;
  }
  
  /**
   * Start polling for jobs
   */
  startPolling(): void {
    if (this.pollingInterval) {
      return; // Already polling
    }
    
    const intervalMs = this.config.pollIntervalSeconds * 1000;
    
    // Poll immediately, then periodically
    this.pollOnce().catch(err => {
      console.error(`Initial job poll failed: ${err}`);
    });
    
    this.pollingInterval = setInterval(() => {
      this.pollOnce().catch(err => {
        console.error(`Job poll failed: ${err}`);
      });
    }, intervalMs);
    
    console.log(`Job polling started (interval: ${this.config.pollIntervalSeconds}s)`);
  }
  
  /**
   * Stop polling for jobs
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Job polling stopped');
    }
  }
  
  /**
   * Poll for jobs once
   */
  private async pollOnce(): Promise<void> {
    if (this.isPolling) {
      return; // Prevent concurrent polls
    }
    
    this.isPolling = true;
    
    try {
      const response = await this.client.pollJobs(this.config.agentId);
      
      if (response.jobs && response.jobs.length > 0) {
        console.log(`Received ${response.jobs.length} job(s) from control plane`);
        
        // Submit jobs to executor
        for (const job of response.jobs) {
          this.executor.submitJob(job).catch(err => {
            console.error(`Failed to submit job ${job.jobId}: ${err}`);
          });
        }
      }
    } catch (error) {
      console.error(`Job poll error: ${error}`);
      // Don't throw - we'll retry on next interval
    } finally {
      this.isPolling = false;
    }
  }
}

