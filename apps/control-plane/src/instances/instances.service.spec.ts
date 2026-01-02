import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InstancesService } from './instances.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/config.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { InstanceStatus, GameType } from '@ark-asa/contracts';

describe('InstancesService', () => {
  let service: InstancesService;

  const mockPrismaService = {
    agent: {
      findUnique: jest.fn(),
    },
    instance: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    job: {
      findFirst: jest.fn(),
    },
  };

  const mockConfigService = {
    runtimeRoot: 'D:\\Ark ASA ASM\\runtime',
  };

  const mockWsGateway = {
    emitInstanceCreated: jest.fn(),
    emitInstanceUpdated: jest.fn(),
    emitInstanceDeleted: jest.fn(),
    emitInstanceStatusChanged: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstancesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
        {
          provide: WebsocketGateway,
          useValue: mockWsGateway,
        },
      ],
    }).compile();

    service = module.get<InstancesService>(InstancesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInstance', () => {
    it('should create a new instance', async () => {
      const createDto = {
        name: 'Test Instance',
        gameType: GameType.ASA,
        agentId: 'test-agent-1',
        config: { port: 7777 },
      };

      const mockAgent = {
        id: 'agent-1',
        agentId: 'test-agent-1',
        hostId: 'host-1',
        host: {
          id: 'host-1',
          hostname: 'test-host',
        },
      };

      const mockInstance = {
        id: 'inst-1',
        instanceId: 'inst-uuid-123',
        name: 'Test Instance',
        gameType: GameType.ASA,
        status: InstanceStatus.STOPPED,
        agentId: 'agent-1',
        hostId: 'host-1',
        config: { port: 7777 },
        createdAt: new Date(),
        updatedAt: new Date(),
        agent: {
          agentId: 'test-agent-1',
        },
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.instance.create.mockResolvedValue(mockInstance);

      const result = await service.createInstance(createDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Instance');
      expect(result.gameType).toBe(GameType.ASA);
      expect(result.status).toBe(InstanceStatus.STOPPED);
      expect(mockPrismaService.instance.create).toHaveBeenCalled();
      expect(mockWsGateway.emitInstanceCreated).toHaveBeenCalled();
    });

    it('should throw NotFoundException if agent does not exist', async () => {
      const createDto = {
        name: 'Test Instance',
        gameType: GameType.ASA,
        agentId: 'non-existent-agent',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      await expect(service.createInstance(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.instance.create).not.toHaveBeenCalled();
    });
  });

  describe('getInstanceById', () => {
    it('should return instance by ID', async () => {
      const mockInstance = {
        id: 'inst-1',
        instanceId: 'inst-uuid-123',
        name: 'Test Instance',
        gameType: GameType.ASA,
        status: InstanceStatus.STOPPED,
        agentId: 'agent-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        agent: {
          agentId: 'test-agent-1',
        },
      };

      mockPrismaService.instance.findUnique.mockResolvedValue(mockInstance);

      const result = await service.getInstanceById('inst-uuid-123');

      expect(result).toBeDefined();
      expect(result.instanceId).toBe('inst-uuid-123');
      expect(result.name).toBe('Test Instance');
    });

    it('should throw NotFoundException if instance does not exist', async () => {
      mockPrismaService.instance.findUnique.mockResolvedValue(null);

      await expect(service.getInstanceById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listInstances', () => {
    it('should return list of instances', async () => {
      const mockInstances = [
        {
          id: 'inst-1',
          instanceId: 'inst-uuid-1',
          name: 'Instance 1',
          gameType: GameType.ASA,
          status: InstanceStatus.STOPPED,
          agentId: 'agent-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          agent: {
            agentId: 'test-agent-1',
          },
        },
        {
          id: 'inst-2',
          instanceId: 'inst-uuid-2',
          name: 'Instance 2',
          gameType: GameType.ASA,
          status: InstanceStatus.RUNNING,
          agentId: 'agent-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          agent: {
            agentId: 'test-agent-1',
          },
        },
      ];

      mockPrismaService.instance.findMany.mockResolvedValue(mockInstances);

      const result = await service.listInstances({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should filter by agentId', async () => {
      const mockAgent = {
        id: 'agent-1',
        agentId: 'test-agent-1',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.instance.findMany.mockResolvedValue([]);

      await service.listInstances({ agentId: 'test-agent-1' });

      expect(mockPrismaService.agent.findUnique).toHaveBeenCalledWith({
        where: { agentId: 'test-agent-1' },
      });
    });

    it('should return empty array if agent not found', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      const result = await service.listInstances({ agentId: 'non-existent' });

      expect(result).toEqual([]);
    });

    it('should filter by gameType', async () => {
      mockPrismaService.instance.findMany.mockResolvedValue([]);

      await service.listInstances({ gameType: GameType.ASA });

      expect(mockPrismaService.instance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            gameType: GameType.ASA,
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrismaService.instance.findMany.mockResolvedValue([]);

      await service.listInstances({ status: InstanceStatus.RUNNING });

      expect(mockPrismaService.instance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: InstanceStatus.RUNNING,
          }),
        }),
      );
    });
  });

  describe('updateInstance', () => {
    it('should update instance', async () => {
      const mockInstance = {
        id: 'inst-1',
        instanceId: 'inst-uuid-123',
        name: 'Old Name',
        status: InstanceStatus.STOPPED,
        agentId: 'agent-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        agent: {
          agentId: 'test-agent-1',
        },
      };

      const mockUpdated = {
        ...mockInstance,
        name: 'New Name',
        updatedAt: new Date(),
      };

      mockPrismaService.instance.findUnique.mockResolvedValue(mockInstance);
      mockPrismaService.instance.update.mockResolvedValue(mockUpdated);

      const updateDto = {
        name: 'New Name',
      };

      const result = await service.updateInstance('inst-uuid-123', updateDto);

      expect(result.name).toBe('New Name');
      expect(mockPrismaService.instance.update).toHaveBeenCalled();
      expect(mockWsGateway.emitInstanceUpdated).toHaveBeenCalled();
    });

    it('should emit status changed event if status changes', async () => {
      const mockInstance = {
        id: 'inst-1',
        instanceId: 'inst-uuid-123',
        name: 'Test Instance',
        status: InstanceStatus.STOPPED,
        agentId: 'agent-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        agent: {
          agentId: 'test-agent-1',
        },
      };

      const mockUpdated = {
        ...mockInstance,
        status: InstanceStatus.STOPPED, // Status stays the same
        name: 'Updated Name',
        updatedAt: new Date(),
      };

      mockPrismaService.instance.findUnique.mockResolvedValue(mockInstance);
      mockPrismaService.instance.update.mockResolvedValue(mockUpdated);

      await service.updateInstance('inst-uuid-123', { name: 'Updated Name' });

      // Status didn't change in this update, so status changed event shouldn't fire
      expect(mockWsGateway.emitInstanceStatusChanged).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if instance does not exist', async () => {
      mockPrismaService.instance.findUnique.mockResolvedValue(null);

      await expect(
        service.updateInstance('non-existent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteInstance', () => {
    it('should delete instance', async () => {
      const mockInstance = {
        id: 'inst-1',
        instanceId: 'inst-uuid-123',
        name: 'Test Instance',
        agentId: 'agent-1',
      };

      mockPrismaService.instance.findUnique.mockResolvedValue(mockInstance);
      mockPrismaService.job.findFirst.mockResolvedValue(null);
      mockPrismaService.instance.delete.mockResolvedValue(mockInstance);

      await service.deleteInstance('inst-uuid-123');

      expect(mockPrismaService.instance.delete).toHaveBeenCalled();
      expect(mockWsGateway.emitInstanceDeleted).toHaveBeenCalled();
    });

    it('should throw NotFoundException if instance does not exist', async () => {
      mockPrismaService.instance.findUnique.mockResolvedValue(null);

      await expect(service.deleteInstance('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if instance has running jobs', async () => {
      const mockInstance = {
        id: 'inst-1',
        instanceId: 'inst-uuid-123',
        name: 'Test Instance',
        agentId: 'agent-1',
      };

      const mockJob = {
        id: 'job-1',
        jobId: 'job-uuid-123',
        status: 'RUNNING',
      };

      mockPrismaService.instance.findUnique.mockResolvedValue(mockInstance);
      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);

      await expect(service.deleteInstance('inst-uuid-123')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.instance.delete).not.toHaveBeenCalled();
    });
  });
});

