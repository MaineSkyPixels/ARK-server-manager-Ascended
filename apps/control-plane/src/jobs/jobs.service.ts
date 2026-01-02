import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import {
  JobCreateDto,
  JobResponseDto,
  JobPollResponseDto,
  JobAssignmentDto,
  JobProgressDto,
  JobCompleteDto,
  JobStatus,
  JobType,
} from '@ark-asa/contracts';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: WebsocketGateway,
  ) {}

  // Placeholder for future implementation
  async createJob(dto: JobCreateDto): Promise<JobResponseDto> {
    this.logger.log(`Creating job: ${dto.jobType}`);
    // Implementation will be added in future milestones
    throw new Error('Not implemented');
  }

  /**
   * Get job by ID with progress details
   * Populates progressPercent and progressMessage from latest JobRun
   */
  async getJobById(jobId: string): Promise<JobResponseDto> {
    this.logger.debug(`Fetching job: ${jobId}`);

    const job = await this.prisma.job.findUnique({
      where: { jobId },
      include: {
        runs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get latest run
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job not found: ${jobId}`);
    }

    const latestRun = job.runs[0];

    // Build response with progress fields from latest run
    const response: JobResponseDto = {
      jobId: job.jobId,
      jobRunId: latestRun?.jobRunId || '',
      jobType: job.jobType as JobType,
      status: job.status as JobStatus,
      instanceId: job.instanceId || undefined,
      agentId: job.agentId || undefined,
      parameters: job.parameters as Record<string, unknown>,
      createdAt: job.createdAt.toISOString(),
      startedAt: job.startedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      error: job.error || undefined,
      retryCount: job.retryCount,
      // Populate progress fields from latest run (CR-004)
      progressPercent: latestRun?.percent ?? undefined,
      progressMessage: latestRun?.message ?? undefined,
    };

    return response;
  }

  /**
   * Poll for jobs assigned to an agent
   * Returns jobs with status QUEUED assigned to the specified agent
   */
  async pollJobs(agentId: string): Promise<JobPollResponseDto> {
    this.logger.debug(`Polling jobs for agent: ${agentId}`);

    // Verify agent exists and is active
    const agent = await this.prisma.agent.findUnique({
      where: { agentId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent not found: ${agentId}`);
    }

    // Find jobs assigned to this agent with status QUEUED
    const jobs = await this.prisma.job.findMany({
      where: {
        agentId: agent.id,
        status: JobStatus.QUEUED,
      },
      include: {
        runs: {
          where: {
            status: JobStatus.QUEUED,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    // Convert to JobAssignmentDto format
    const assignments: JobAssignmentDto[] = jobs
      .filter((job) => job.runs.length > 0)
      .map((job) => {
        const latestRun = job.runs[0];
        return {
          jobId: job.jobId,
          jobRunId: latestRun.jobRunId,
          jobType: job.jobType as JobType,
          instanceId: job.instanceId || undefined,
          parameters: job.parameters as Record<string, unknown>,
        };
      });

    this.logger.debug(`Found ${assignments.length} jobs for agent ${agentId}`);

    return {
      jobs: assignments,
    };
  }

  /**
   * Report job progress update
   * Updates the job_run record and job status
   */
  async reportProgress(dto: JobProgressDto): Promise<void> {
    this.logger.debug(`Job progress: ${dto.jobId} (${dto.jobRunId}) - ${dto.percent}% - ${dto.message}`);

    // Find job and job run
    const job = await this.prisma.job.findUnique({
      where: { jobId: dto.jobId },
      include: {
        runs: {
          where: { jobRunId: dto.jobRunId },
          take: 1,
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job not found: ${dto.jobId}`);
    }

    if (job.runs.length === 0) {
      throw new NotFoundException(`Job run not found: ${dto.jobRunId}`);
    }

    const jobRun = job.runs[0];

    // Update job run
    await this.prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: dto.status,
        percent: dto.percent,
        message: dto.message,
      },
    });

    // Update job status if transitioning to RUNNING
    if (dto.status === JobStatus.RUNNING && job.status !== JobStatus.RUNNING) {
      await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.RUNNING,
          startedAt: new Date(),
        },
      });
    }

    // Emit WebSocket event for job progress
    this.wsGateway.emitJobProgress({
      jobId: dto.jobId,
      jobRunId: dto.jobRunId,
      status: dto.status,
      percent: dto.percent,
      message: dto.message,
      timestamp: dto.timestamp,
    });
  }

  /**
   * Report job completion (success, failure, or cancellation)
   * Updates the job_run and job records, marks job as complete
   */
  async reportCompletion(dto: JobCompleteDto): Promise<void> {
    this.logger.log(`Job completion: ${dto.jobId} (${dto.jobRunId}) - ${dto.status}`);

    // Find job and job run
    const job = await this.prisma.job.findUnique({
      where: { jobId: dto.jobId },
      include: {
        runs: {
          where: { jobRunId: dto.jobRunId },
          take: 1,
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job not found: ${dto.jobId}`);
    }

    if (job.runs.length === 0) {
      throw new NotFoundException(`Job run not found: ${dto.jobRunId}`);
    }

    const jobRun = job.runs[0];

    // Validate status
    if (
      dto.status !== JobStatus.COMPLETED &&
      dto.status !== JobStatus.FAILED &&
      dto.status !== JobStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Invalid completion status: ${dto.status}. Must be COMPLETED, FAILED, or CANCELLED`,
      );
    }

    const completedAt = new Date();

    // Update job run
    await this.prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: dto.status,
        result: dto.result || null,
        error: dto.error || null,
        errorDetails: dto.errorDetails || null,
        completedAt,
      },
    });

    // Update job
    await this.prisma.job.update({
      where: { id: job.id },
      data: {
        status: dto.status,
        error: dto.error || null,
        completedAt,
      },
    });

    // Emit WebSocket event based on completion status
    if (dto.status === JobStatus.COMPLETED) {
      this.wsGateway.emitJobCompleted({
        jobId: dto.jobId,
        jobRunId: dto.jobRunId,
        result: dto.result,
        completedAt: completedAt.toISOString(),
      });
    } else if (dto.status === JobStatus.FAILED) {
      this.wsGateway.emitJobFailed({
        jobId: dto.jobId,
        jobRunId: dto.jobRunId,
        error: dto.error || 'Job failed',
        failedAt: completedAt.toISOString(),
      });
    } else if (dto.status === JobStatus.CANCELLED) {
      this.wsGateway.emitJobCancelled({
        jobId: dto.jobId,
        jobRunId: dto.jobRunId,
        cancelledAt: completedAt.toISOString(),
      });
    }
  }
}

