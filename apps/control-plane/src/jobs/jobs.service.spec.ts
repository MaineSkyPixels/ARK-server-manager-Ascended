import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { JobStatus, JobType } from '@ark-asa/contracts';

describe('JobsService', () => {
  let service: JobsService;

  const mockPrismaService = {
    job: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    jobRun: {
      create: jest.fn(),
      update: jest.fn(),
    },
    agent: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    instance: {
      findUnique: jest.fn(),
    },
  };

  const mockWsGateway = {
    broadcast: jest.fn(),
    emitJobCreated: jest.fn(),
    emitJobProgress: jest.fn(),
    emitJobCompleted: jest.fn(),
    emitJobFailed: jest.fn(),
    emitJobCancelled: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: WebsocketGateway,
          useValue: mockWsGateway,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);

    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create a job with instance assignment', async () => {
      const dto = {
        jobType: JobType.START_INSTANCE,
        instanceId: 'inst-123',
        parameters: { port: 7777 },
        priority: 5,
      };

      const mockInstance = {
        id: 'instance-db-id',
        instanceId: 'inst-123',
        agentId: 'agent-db-id',
      };

      const mockAgent = {
        id: 'agent-db-id',
        status: 'ONLINE',
      };

      const mockJob = {
        id: 'job-db-id',
        jobId: 'job-uuid',
        jobType: JobType.START_INSTANCE,
        status: JobStatus.QUEUED,
        instanceId: 'instance-db-id',
        agentId: 'agent-db-id',
        parameters: dto.parameters,
        priority: 5,
        createdAt: new Date(),
        startedAt: null,
        completedAt: null,
        error: null,
        retryCount: 0,
      };

      const mockJobRun = {
        id: 'run-db-id',
        jobRunId: 'run-uuid',
        jobId: 'job-db-id',
        status: JobStatus.QUEUED,
        percent: 0,
        message: 'Job queued',
      };

      mockPrismaService.instance.findUnique.mockResolvedValue(mockInstance);
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.job.create.mockResolvedValue(mockJob);
      mockPrismaService.jobRun.create.mockResolvedValue(mockJobRun);

      const result = await service.createJob(dto);

      expect(result.jobId).toMatch(/^job-[a-f0-9-]+$/);
      expect(result.jobType).toBe(JobType.START_INSTANCE);
      expect(result.status).toBe(JobStatus.QUEUED);
      expect(mockPrismaService.job.create).toHaveBeenCalled();
      expect(mockPrismaService.jobRun.create).toHaveBeenCalled();
      expect(mockWsGateway.emitJobCreated).toHaveBeenCalled();
    });

    it('should throw NotFoundException if instance not found', async () => {
      const dto = {
        jobType: JobType.START_INSTANCE,
        instanceId: 'inst-123',
        parameters: {},
      };

      mockPrismaService.instance.findUnique.mockResolvedValue(null);

      await expect(service.createJob(dto)).rejects.toThrow(NotFoundException);
    });

    it('should assign to available agent if instance has no agent', async () => {
      const dto = {
        jobType: JobType.START_INSTANCE,
        instanceId: 'inst-123',
        parameters: {},
      };

      const mockInstance = {
        id: 'instance-db-id',
        instanceId: 'inst-123',
        agentId: null,
      };

      const mockAvailableAgent = {
        id: 'available-agent-id',
        status: 'ONLINE',
      };

      const mockJob = {
        id: 'job-db-id',
        jobId: 'job-uuid',
        jobType: JobType.START_INSTANCE,
        status: JobStatus.QUEUED,
        instanceId: 'instance-db-id',
        agentId: 'available-agent-id',
        parameters: {},
        priority: 0,
        createdAt: new Date(),
        startedAt: null,
        completedAt: null,
        error: null,
        retryCount: 0,
      };

      const mockJobRun = {
        id: 'run-db-id',
        jobRunId: 'run-uuid',
        jobId: 'job-db-id',
        status: JobStatus.QUEUED,
        percent: 0,
        message: 'Job queued',
      };

      mockPrismaService.instance.findUnique.mockResolvedValue(mockInstance);
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAvailableAgent);
      mockPrismaService.job.create.mockResolvedValue(mockJob);
      mockPrismaService.jobRun.create.mockResolvedValue(mockJobRun);

      await service.createJob(dto);

      expect(mockPrismaService.agent.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.job.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agentId: 'available-agent-id',
          }),
        }),
      );
    });

    it('should throw BadRequestException if no agents available', async () => {
      const dto = {
        jobType: JobType.START_INSTANCE,
        parameters: {},
      };

      mockPrismaService.agent.findFirst.mockResolvedValue(null);

      await expect(service.createJob(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getJobById', () => {
    it('should return job with progress from latest run', async () => {
      const jobId = 'job-123';
      const mockJob = {
        id: 'job-db-id',
        jobId: 'job-123',
        jobType: JobType.START_INSTANCE,
        status: JobStatus.RUNNING,
        instanceId: 'instance-db-id',
        agentId: 'agent-db-id',
        parameters: { port: 7777 },
        createdAt: new Date('2024-01-01'),
        startedAt: new Date('2024-01-01T10:00:00'),
        completedAt: null,
        error: null,
        retryCount: 0,
        runs: [
          {
            jobRunId: 'run-123',
            percent: 50,
            message: 'Starting server...',
          },
        ],
      };

      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      const result = await service.getJobById(jobId);

      expect(result.jobId).toBe('job-123');
      expect(result.progressPercent).toBe(50);
      expect(result.progressMessage).toBe('Starting server...');
    });

    it('should throw NotFoundException if job not found', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      await expect(service.getJobById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('pollJobs', () => {
    it('should return queued jobs for agent', async () => {
      const agentId = 'agent-123';
      const mockAgent = {
        id: 'agent-db-id',
        agentId: 'agent-123',
      };

      const mockJobs = [
        {
          id: 'job-db-id-1',
          jobId: 'job-1',
          jobType: JobType.START_INSTANCE,
          instanceId: 'instance-db-id',
          agentId: 'agent-db-id',
          parameters: {},
          priority: 5,
          createdAt: new Date(),
          runs: [
            {
              jobRunId: 'run-1',
              status: JobStatus.QUEUED,
            },
          ],
        },
      ];

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      const result = await service.pollJobs(agentId);

      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].jobId).toBe('job-1');
      expect(mockPrismaService.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            agentId: 'agent-db-id',
            status: JobStatus.QUEUED,
          },
        }),
      );
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      await expect(service.pollJobs('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});

