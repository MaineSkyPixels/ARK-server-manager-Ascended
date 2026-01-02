import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AgentStatus } from '@ark-asa/contracts';

describe('AgentsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
  });

  afterAll(async () => {
    // Clean up test data
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

  describe('POST /agents/register', () => {
    it('should register a new agent', () => {
      const registrationDto = {
        agentId: 'test-agent-e2e-1',
        hostname: 'test-host-e2e-1',
        capabilities: {
          supportsHardlinks: true,
          maxConcurrentJobs: 5,
          supportedGameTypes: ['ASA'],
        },
        version: '1.0.0',
      };

      return request(app.getHttpServer())
        .post('/agents/register')
        .send(registrationDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('agentId', 'test-agent-e2e-1');
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('assignedJobs');
          expect(res.body).toHaveProperty('config');
          expect(Array.isArray(res.body.assignedJobs)).toBe(true);
        });
    });

    it('should reject invalid registration (missing fields)', () => {
      const invalidDto = {
        agentId: 'test-agent-invalid',
        // missing hostname, capabilities, version
      };

      return request(app.getHttpServer())
        .post('/agents/register')
        .send(invalidDto)
        .expect(400);
    });

    it('should update existing agent on re-registration', async () => {
      const registrationDto = {
        agentId: 'test-agent-e2e-2',
        hostname: 'test-host-e2e-2',
        capabilities: {
          supportsHardlinks: true,
          maxConcurrentJobs: 5,
          supportedGameTypes: ['ASA'],
        },
        version: '1.0.0',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/agents/register')
        .send(registrationDto)
        .expect(200);

      // Second registration with updated version
      const updatedDto = {
        ...registrationDto,
        version: '1.1.0',
      };

      return request(app.getHttpServer())
        .post('/agents/register')
        .send(updatedDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.agentId).toBe('test-agent-e2e-2');
        });
    });
  });

  describe('POST /agents/heartbeat', () => {
    it('should accept heartbeat from registered agent', async () => {
      // First register an agent
      const registrationDto = {
        agentId: 'test-agent-heartbeat',
        hostname: 'test-host-heartbeat',
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

      // Then send heartbeat
      const heartbeatDto = {
        agentId: 'test-agent-heartbeat',
        status: AgentStatus.ONLINE,
        activeJobIds: [],
      };

      return request(app.getHttpServer())
        .post('/agents/heartbeat')
        .send(heartbeatDto)
        .expect(204);
    });

    it('should reject heartbeat from unregistered agent', () => {
      const heartbeatDto = {
        agentId: 'non-existent-agent',
        status: AgentStatus.ONLINE,
        activeJobIds: [],
      };

      return request(app.getHttpServer())
        .post('/agents/heartbeat')
        .send(heartbeatDto)
        .expect(404);
    });

    it('should reject invalid heartbeat (missing fields)', () => {
      const invalidDto = {
        agentId: 'test-agent',
        // missing status, activeJobIds
      };

      return request(app.getHttpServer())
        .post('/agents/heartbeat')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('GET /health', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('database');
        });
    });
  });
});

