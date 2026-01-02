import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JobType, JobStatus, AgentStatus, GameType } from '@ark-asa/contracts';
import WebSocket from 'ws';

describe('Jobs Workflow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testAgentId: string;
  let testInstanceId: string;
  let wsClient: WebSocket | null = null;
  let wsMessages: any[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Setup: Register an agent
    testAgentId = 'test-agent-jobs-e2e';
    const registrationDto = {
      agentId: testAgentId,
      hostname: 'test-host-jobs-e2e',
      capabilities: {
        supportsHardlinks: true,
        maxConcurrentJobs: 5,
        supportedGameTypes: ['ASA'],
      },
      version: '1.0.0',
    };

    await request(app.getHttpServer())
      .post('/agents/register')
      .send(registrationDto)
      .expect(200);

    // Update agent status to ONLINE
    await prisma.agent.updateMany({
      where: { agentId: testAgentId },
      data: { status: AgentStatus.ONLINE },
    });

    // Setup: Create a test instance
    const agent = await prisma.agent.findUnique({
      where: { agentId: testAgentId },
    });

    const instance = await prisma.instance.create({
      data: {
        instanceId: 'test-instance-jobs-e2e',
        name: 'Test Instance',
        gameType: GameType.ASA,
        status: 'STOPPED',
        agentId: agent!.id,
        hostId: agent!.hostId,
      },
    });

    testInstanceId = instance.instanceId;
  });

  afterAll(async () => {
    // Close WebSocket connection if open
    if (wsClient) {
      wsClient.close();
    }

    // Clean up test data
    await prisma.jobRun.deleteMany({
      where: {
        job: {
          jobId: {
            startsWith: 'job-',
          },
        },
      },
    });
    await prisma.job.deleteMany({
      where: {
        jobId: {
          startsWith: 'job-',
        },
      },
    });
    await prisma.instance.deleteMany({
      where: {
        instanceId: {
          startsWith: 'test-instance-',
        },
      },
    });
    await prisma.agent.deleteMany({
      where: {
        agentId: {
          startsWith: 'test-agent-',
        },
      },
    });
    await prisma.host.deleteMany({
      where: {
        hostname: {
          startsWith: 'test-host-',
        },
      },
    });
    await app.close();
  });

  describe('Job Creation Workflow', () => {
    it('should create job → agent polls → agent reports progress → job completes', async () => {
      // Step 1: Create a job
      const createJobDto = {
        jobType: JobType.BACKUP_INSTANCE,
        instanceId: testInstanceId,
        parameters: {
          backupName: 'test-backup',
        },
        priority: 0,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/jobs')
        .send(createJobDto)
        .expect(201);

      const jobId = createResponse.body.jobId;
      const jobRunId = createResponse.body.jobRunId;

      expect(jobId).toBeDefined();
      expect(jobRunId).toBeDefined();
      expect(createResponse.body.status).toBe(JobStatus.QUEUED);

      // Step 2: Agent polls for jobs
      const pollResponse = await request(app.getHttpServer())
        .get(`/jobs/poll?agentId=${testAgentId}`)
        .expect(200);

      expect(pollResponse.body.jobs).toBeDefined();
      expect(Array.isArray(pollResponse.body.jobs)).toBe(true);
      expect(pollResponse.body.jobs.length).toBeGreaterThan(0);

      const assignedJob = pollResponse.body.jobs.find((j: any) => j.jobId === jobId);
      expect(assignedJob).toBeDefined();
      expect(assignedJob.jobRunId).toBe(jobRunId);
      expect(assignedJob.jobType).toBe(JobType.BACKUP_INSTANCE);

      // Step 3: Agent reports progress
      const progressDto = {
        jobId,
        jobRunId,
        status: JobStatus.RUNNING,
        percent: 50,
        message: 'Backing up instance files...',
        timestamp: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/jobs/progress')
        .send(progressDto)
        .expect(204);

      // Verify job status updated
      const jobResponse = await request(app.getHttpServer())
        .get(`/jobs/${jobId}`)
        .expect(200);

      expect(jobResponse.body.status).toBe(JobStatus.RUNNING);
      expect(jobResponse.body.progressPercent).toBe(50);
      expect(jobResponse.body.progressMessage).toBe('Backing up instance files...');

      // Step 4: Agent reports completion
      const completeDto = {
        jobId,
        jobRunId,
        status: JobStatus.COMPLETED,
        result: {
          backupId: 'backup-123',
          size: 1024000,
        },
      };

      await request(app.getHttpServer())
        .post('/jobs/complete')
        .send(completeDto)
        .expect(204);

      // Verify job completed
      const completedJobResponse = await request(app.getHttpServer())
        .get(`/jobs/${jobId}`)
        .expect(200);

      expect(completedJobResponse.body.status).toBe(JobStatus.COMPLETED);
      expect(completedJobResponse.body.completedAt).toBeDefined();
    });

    it('should emit WebSocket events during job workflow', (done) => {
      // Connect WebSocket client
      const port = app.getHttpServer().address()?.port || 3000;
      wsClient = new WebSocket(`ws://localhost:${port}/ws`);

      wsMessages = [];

      wsClient.on('open', async () => {
        // Create a job
        const createJobDto = {
          jobType: JobType.START_INSTANCE,
          instanceId: testInstanceId,
          parameters: {},
          priority: 0,
        };

        const createResponse = await request(app.getHttpServer())
          .post('/jobs')
          .send(createJobDto)
          .expect(201);

        const jobId = createResponse.body.jobId;
        const jobRunId = createResponse.body.jobRunId;

        // Report progress
        setTimeout(async () => {
          await request(app.getHttpServer())
            .post('/jobs/progress')
            .send({
              jobId,
              jobRunId,
              status: JobStatus.RUNNING,
              percent: 25,
              message: 'Starting instance...',
              timestamp: new Date().toISOString(),
            })
            .expect(204);
        }, 100);

        // Complete job
        setTimeout(async () => {
          await request(app.getHttpServer())
            .post('/jobs/complete')
            .send({
              jobId,
              jobRunId,
              status: JobStatus.COMPLETED,
              result: {},
            })
            .expect(204);

          // Wait a bit for all events
          setTimeout(() => {
            wsClient?.close();

            // Verify WebSocket events received
            const jobCreatedEvents = wsMessages.filter(
              (m) => m.event === 'job:created',
            );
            const jobProgressEvents = wsMessages.filter(
              (m) => m.event === 'job:progress',
            );
            const jobCompletedEvents = wsMessages.filter(
              (m) => m.event === 'job:completed',
            );

            expect(jobCreatedEvents.length).toBeGreaterThan(0);
            expect(jobProgressEvents.length).toBeGreaterThan(0);
            expect(jobCompletedEvents.length).toBeGreaterThan(0);

            // Verify event payloads
            const createdEvent = jobCreatedEvents[0];
            expect(createdEvent.data.jobId).toBe(jobId);

            const progressEvent = jobProgressEvents[0];
            expect(progressEvent.data.jobId).toBe(jobId);
            expect(progressEvent.data.percent).toBe(25);

            const completedEvent = jobCompletedEvents[0];
            expect(completedEvent.data.jobId).toBe(jobId);

            done();
          }, 500);
        }, 200);
      });

      wsClient.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          wsMessages.push(message);
        } catch (e) {
          // Ignore parse errors
        }
      });

      wsClient.on('error', (error) => {
        // Ignore connection errors in test
        console.error('WebSocket error:', error);
      });
    }, 10000); // 10 second timeout for WebSocket test
  });
});

