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
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: WebsocketGateway,
  ) {}

  /**
   * Create a new job
   * Assigns job to an agent based on instance or round-robin
   */
  async createJob(dto: JobCreateDto): Promise<JobResponseDto> {
    this.logger.log(`Creating job: ${dto.jobType}${dto.instanceId ? ` for instance: ${dto.instanceId}` : ''}`);

    // Validate instance exists if provided
    let instance = null;
    let agentId: string | null = null;

    if (dto.instanceId) {
      instance = await this.prisma.instance.findUnique({
        where: { instanceId: dto.instanceId },
        include: { agent: true },
      });

      if (!instance) {
        throw new NotFoundException(`Instance not found: ${dto.instanceId}`);
      }

      // Assign to instance's agent if available
      if (instance.agentId) {
        const agent = await this.prisma.agent.findUnique({
          where: { id: instance.agentId },
        });
        if (agent && agent.status === 'ONLINE') {
          agentId = agent.id;
        }
      }
    }

    // If no agent assigned yet, find an available agent (round-robin or first available)
    if (!agentId) {
      const availableAgent = await this.prisma.agent.findFirst({
        where: {
          status: 'ONLINE',
        },
        orderBy: {
          lastSeenAt: 'desc',
        },
      });

      if (!availableAgent) {
        throw new BadRequestException('No available agents to assign job');
      }

      agentId = availableAgent.id;
    }

    // Generate unique job ID and job run ID
    const jobId = `job-${uuidv4()}`;
    const jobRunId = `run-${uuidv4()}`;

    // Create job
    const job = await this.prisma.job.create({
      data: {
        jobId,
        jobType: dto.jobType,
        status: JobStatus.QUEUED,
        instanceId: instance?.id || null,
        agentId,
        parameters: dto.parameters,
        priority: dto.priority || 0,
      },
    });

    // Create initial job run
    await this.prisma.jobRun.create({
      data: {
        jobRunId,
        jobId: job.id,
        status: JobStatus.QUEUED,
        percent: 0,
        message: 'Job queued',
      },
    });

    this.logger.log(`Created job: ${jobId} (run: ${jobRunId}) assigned to agent`);

    // Build response
    const response: JobResponseDto = {
      jobId,
      jobRunId,
      jobType: job.jobType as JobType,
      status: job.status as JobStatus,
      instanceId: instance?.instanceId || undefined,
      agentId: undefined, // Don't expose internal agent ID
      parameters: job.parameters as Record<string, unknown>,
      createdAt: job.createdAt.toISOString(),
      startedAt: job.startedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      error: job.error || undefined,
      retryCount: job.retryCount,
      progressPercent: 0,
      progressMessage: 'Job queued',
    };

    // Emit WebSocket event for job creation
    this.wsGateway.emitJobCreated({
      jobId,
      jobType: dto.jobType,
      instanceId: dto.instanceId,
      createdAt: job.createdAt.toISOString(),
    });

    return response;
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
      .filter((job: any) => job.runs.length > 0)
      .map((job: any) => {
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

