import { JobAssignmentDto, JobStatus, JobType } from '@ark-asa/contracts';
import { ProcessManager } from '../../runtime/process-manager';
import { getRuntimePaths } from '../../config/config';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Process control job handlers
 * Handles START_INSTANCE, STOP_INSTANCE, RESTART_INSTANCE jobs
 */
export class ProcessControlHandler {
  private readonly processManager: ProcessManager;
  private readonly runtimeRoot: string;

  constructor(runtimeRoot: string) {
    this.runtimeRoot = runtimeRoot;
    this.processManager = new ProcessManager(runtimeRoot);
  }

  /**
   * Handle a process control job
   */
  async handle(job: JobAssignmentDto, reportProgress: (percent: number, message: string) => Promise<void>): Promise<Record<string, unknown>> {
    const instanceId = job.instanceId;
    if (!instanceId) {
      throw new Error('Instance ID is required for process control jobs');
    }

    switch (job.jobType) {
      case JobType.START_INSTANCE:
        return this.startInstance(job, instanceId, reportProgress);
      case JobType.STOP_INSTANCE:
        return this.stopInstance(job, instanceId, reportProgress);
      case JobType.RESTART_INSTANCE:
        return this.restartInstance(job, instanceId, reportProgress);
      default:
        throw new Error(`Unsupported job type for process control: ${job.jobType}`);
    }
  }

  /**
   * Start an instance
   */
  private async startInstance(
    job: JobAssignmentDto,
    instanceId: string,
    reportProgress: (percent: number, message: string) => Promise<void>,
  ): Promise<Record<string, unknown>> {
    await reportProgress(10, 'Preparing to start instance...');

    // Check if already running (idempotency check)
    const existing = await this.processManager.getProcessInfo(instanceId);
    if (existing) {
      await reportProgress(100, `Instance ${instanceId} is already running (PID: ${existing.pid})`);
      return {
        pid: existing.pid,
        status: 'already_running',
        message: 'Instance was already running',
      };
    }

    await reportProgress(20, 'Validating instance configuration...');

    // Get instance paths
    const paths = getRuntimePaths(this.runtimeRoot);
    const instanceDir = path.join(paths.instances, instanceId);
    const activeDir = path.join(instanceDir, 'active');
    const configDir = path.join(instanceDir, 'config');

    // Verify instance directory exists
    if (!fs.existsSync(instanceDir)) {
      throw new Error(`Instance directory not found: ${instanceDir}`);
    }

    // Find executable (ShooterGameServer.exe)
    const executablePath = path.join(activeDir, 'ShooterGame', 'Binaries', 'Win64', 'ShooterGameServer.exe');
    if (!fs.existsSync(executablePath)) {
      throw new Error(`Executable not found: ${executablePath}. Instance may need server installation first.`);
    }

    await reportProgress(40, 'Building command-line arguments...');

    // Build command-line arguments from parameters
    const args: string[] = [];
    
    // Game type (required)
    const gameType = (job.parameters.gameType as string) || 'ASA';
    args.push(`?gameType=${gameType}`);

    // Port (if specified)
    if (job.parameters.port) {
      args.push(`?Port=${job.parameters.port}`);
    }

    // Query port (if specified)
    if (job.parameters.queryPort) {
      args.push(`?QueryPort=${job.parameters.queryPort}`);
    }

    // Server password (if specified)
    if (job.parameters.serverPassword) {
      args.push(`?ServerPassword=${job.parameters.serverPassword}`);
    }

    // Admin password (if specified)
    if (job.parameters.adminPassword) {
      args.push(`?ServerAdminPassword=${job.parameters.adminPassword}`);
    }

    // Map (if specified)
    if (job.parameters.map) {
      args.push(`?Map=${job.parameters.map}`);
    }

    // Additional parameters
    if (job.parameters.additionalArgs && Array.isArray(job.parameters.additionalArgs)) {
      args.push(...job.parameters.additionalArgs);
    }

    await reportProgress(60, 'Starting server process...');

    // Start the process
    const processInfo = await this.processManager.startInstance(
      instanceId,
      executablePath,
      args,
      activeDir,
    );

    await reportProgress(90, 'Waiting for process to initialize...');

    // Give process a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    await reportProgress(100, `Instance ${instanceId} started successfully (PID: ${processInfo.pid})`);

    return {
      pid: processInfo.pid,
      commandLine: processInfo.commandLine,
      startedAt: processInfo.startedAt.toISOString(),
      status: 'running',
    };
  }

  /**
   * Stop an instance
   */
  private async stopInstance(
    job: JobAssignmentDto,
    instanceId: string,
    reportProgress: (percent: number, message: string) => Promise<void>,
  ): Promise<Record<string, unknown>> {
    await reportProgress(10, 'Checking instance status...');

    // Check if running (idempotency check)
    const existing = await this.processManager.getProcessInfo(instanceId);
    if (!existing) {
      await reportProgress(100, `Instance ${instanceId} is not running`);
      return {
        status: 'already_stopped',
        message: 'Instance was already stopped',
      };
    }

    await reportProgress(30, `Stopping instance ${instanceId} (PID: ${existing.pid})...`);

    // Stop timeout from parameters or default
    const timeoutMs = (job.parameters.timeoutMs as number) || 30000;

    await this.processManager.stopInstance(instanceId, timeoutMs);

    await reportProgress(100, `Instance ${instanceId} stopped successfully`);

    return {
      pid: existing.pid,
      status: 'stopped',
      stoppedAt: new Date().toISOString(),
    };
  }

  /**
   * Restart an instance
   */
  private async restartInstance(
    job: JobAssignmentDto,
    instanceId: string,
    reportProgress: (percent: number, message: string) => Promise<void>,
  ): Promise<Record<string, unknown>> {
    await reportProgress(5, 'Restarting instance...');

    // Step 1: Stop if running
    const existing = await this.processManager.getProcessInfo(instanceId);
    if (existing) {
      await reportProgress(30, 'Stopping instance...');
      try {
        const timeoutMs = (job.parameters.timeoutMs as number) || 30000;
        await this.processManager.stopInstance(instanceId, timeoutMs);
        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        // Log but continue - might already be stopped
        console.warn(`Error stopping instance during restart: ${error}`);
      }
    }

    await reportProgress(50, 'Starting instance...');

    // Step 2: Start
    // Create a modified job for starting
    const startJob: JobAssignmentDto = {
      ...job,
      jobType: JobType.START_INSTANCE,
    };

    const startResult = await this.startInstance(startJob, instanceId, async (percent, message) => {
      // Map start progress to 50-100 range
      await reportProgress(50 + (percent * 0.5), message);
    });

    await reportProgress(100, `Instance ${instanceId} restarted successfully`);

    return {
      ...startResult,
      restartedAt: new Date().toISOString(),
      previousPid: existing?.pid,
    };
  }
}

