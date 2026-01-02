import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { PrismaService } from '../prisma/prisma.service';
import { AgentStatus } from '@ark-asa/contracts';

describe('AgentsController', () => {
  let controller: AgentsController;
  let service: AgentsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    host: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    agent: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    job: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentsController],
      providers: [
        AgentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<AgentsController>(AgentsController);
    service = module.get<AgentsService>(AgentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new agent', async () => {
      const registrationDto = {
        agentId: 'test-agent-1',
        hostname: 'test-host',
        capabilities: {
          supportsHardlinks: true,
          maxConcurrentJobs: 5,
          supportedGameTypes: ['ASA'],
        },
        version: '1.0.0',
      };

      const mockHost = {
        id: 'host-1',
        hostname: 'test-host',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAgent = {
        id: 'agent-1',
        agentId: 'test-agent-1',
        hostId: 'host-1',
        status: AgentStatus.REGISTERING,
        version: '1.0.0',
        lastSeenAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.host.findUnique.mockResolvedValue(null);
      mockPrismaService.host.create.mockResolvedValue(mockHost);
      mockPrismaService.agent.findUnique.mockResolvedValue(null);
      mockPrismaService.agent.create.mockResolvedValue(mockAgent);
      mockPrismaService.job.findMany.mockResolvedValue([]);

      const result = await controller.register(registrationDto);

      expect(result).toBeDefined();
      expect(result.agentId).toBe('test-agent-1');
      expect(result.status).toBe(AgentStatus.REGISTERING);
      expect(result.assignedJobs).toEqual([]);
      expect(result.config).toBeDefined();
    });
  });

  describe('heartbeat', () => {
    it('should process heartbeat', async () => {
      const heartbeatDto = {
        agentId: 'test-agent-1',
        status: AgentStatus.ONLINE,
        activeJobIds: [],
      };

      const mockAgent = {
        id: 'agent-1',
        agentId: 'test-agent-1',
        hostId: 'host-1',
        status: AgentStatus.ONLINE,
        version: '1.0.0',
        lastSeenAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.agent.update.mockResolvedValue({
        ...mockAgent,
        lastSeenAt: new Date(),
      });
      mockPrismaService.job.findMany.mockResolvedValue([]);

      await expect(controller.heartbeat(heartbeatDto)).resolves.not.toThrow();
    });
  });
});

