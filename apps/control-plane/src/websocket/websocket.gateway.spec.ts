import { Test, TestingModule } from '@nestjs/testing';
import { WebsocketGateway } from './websocket.gateway';
import { WSEventName, WSJobProgressEvent, JobStatus } from '@ark-asa/contracts';
import WebSocket from 'ws';

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway;
  let mockServer: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebsocketGateway],
    }).compile();

    gateway = module.get<WebsocketGateway>(WebsocketGateway);

    // Mock WebSocket server
    mockServer = {
      on: jest.fn(),
      clients: new Set(),
    };

    gateway.server = mockServer as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('afterInit', () => {
    it('should initialize gateway', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log');
      gateway.afterInit(mockServer as any);
      expect(loggerSpy).toHaveBeenCalledWith('WebSocket gateway initialized');
    });
  });

  describe('handleConnection', () => {
    it('should add client to clients set', () => {
      const mockClient = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
      } as any;

      const initialSize = gateway['clients'].size;
      gateway.handleConnection(mockClient);
      expect(gateway['clients'].size).toBe(initialSize + 1);
      expect(gateway['clients'].has(mockClient)).toBe(true);
    });

    it('should log connection', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'debug');
      const mockClient = {} as any;

      gateway.handleConnection(mockClient);
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should remove client from clients set', () => {
      const mockClient = {} as any;
      gateway['clients'].add(mockClient);

      const initialSize = gateway['clients'].size;
      gateway.handleDisconnect(mockClient);
      expect(gateway['clients'].size).toBe(initialSize - 1);
      expect(gateway['clients'].has(mockClient)).toBe(false);
    });

    it('should log disconnection', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'debug');
      const mockClient = {} as any;

      gateway.handleDisconnect(mockClient);
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('broadcast', () => {
    it('should send message to all connected clients', () => {
      const mockClient1 = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
      } as any;

      const mockClient2 = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
      } as any;

      gateway['clients'].add(mockClient1);
      gateway['clients'].add(mockClient2);

      const event: WSJobProgressEvent = {
        event: WSEventName.JOB_PROGRESS,
        data: {
          jobId: 'test-job',
          jobRunId: 'run-1',
          status: JobStatus.RUNNING,
          percent: 50,
          message: 'Test progress',
          timestamp: new Date().toISOString(),
        },
      };

      gateway.broadcast(event);

      expect(mockClient1.send).toHaveBeenCalledWith(JSON.stringify(event));
      expect(mockClient2.send).toHaveBeenCalledWith(JSON.stringify(event));
    });

    it('should not send to closed clients', () => {
      const mockClient1 = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
      } as any;

      const mockClient2 = {
        readyState: WebSocket.CLOSED,
        send: jest.fn(),
      } as any;

      gateway['clients'].add(mockClient1);
      gateway['clients'].add(mockClient2);

      const event: WSJobProgressEvent = {
        event: WSEventName.JOB_PROGRESS,
        data: {
          jobId: 'test-job',
          jobRunId: 'run-1',
          status: JobStatus.RUNNING,
          percent: 50,
          message: 'Test progress',
          timestamp: new Date().toISOString(),
        },
      };

      gateway.broadcast(event);

      expect(mockClient1.send).toHaveBeenCalled();
      expect(mockClient2.send).not.toHaveBeenCalled();
    });

    it('should handle send errors gracefully', () => {
      const mockClient = {
        readyState: WebSocket.OPEN,
        send: jest.fn().mockImplementation(() => {
          throw new Error('Send failed');
        }),
      } as any;

      gateway['clients'].add(mockClient);

      const loggerSpy = jest.spyOn(gateway['logger'], 'warn');
      const event: WSJobProgressEvent = {
        event: WSEventName.JOB_PROGRESS,
        data: {
          jobId: 'test-job',
          jobRunId: 'run-1',
          status: JobStatus.RUNNING,
          percent: 50,
          message: 'Test progress',
          timestamp: new Date().toISOString(),
        },
      };

      gateway.broadcast(event);

      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('emitJobProgress', () => {
    it('should broadcast job progress event', () => {
      const broadcastSpy = jest.spyOn(gateway, 'broadcast');
      const data = {
        jobId: 'job-123',
        jobRunId: 'run-123',
        status: 'RUNNING' as any,
        percent: 50,
        message: 'Processing...',
        timestamp: new Date().toISOString(),
      };

      gateway.emitJobProgress(data);

      expect(broadcastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: WSEventName.JOB_PROGRESS,
          data,
        }),
      );
    });
  });

  describe('emitJobCompleted', () => {
    it('should broadcast job completed event', () => {
      const broadcastSpy = jest.spyOn(gateway, 'broadcast');
      const data = {
        jobId: 'job-123',
        jobRunId: 'run-123',
        result: { success: true },
        completedAt: new Date().toISOString(),
      };

      gateway.emitJobCompleted(data);

      expect(broadcastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: WSEventName.JOB_COMPLETED,
          data,
        }),
      );
    });
  });

  describe('emitJobFailed', () => {
    it('should broadcast job failed event', () => {
      const broadcastSpy = jest.spyOn(gateway, 'broadcast');
      const data = {
        jobId: 'job-123',
        jobRunId: 'run-123',
        error: 'Job failed',
        failedAt: new Date().toISOString(),
      };

      gateway.emitJobFailed(data);

      expect(broadcastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: WSEventName.JOB_FAILED,
          data,
        }),
      );
    });
  });

  describe('emitJobCancelled', () => {
    it('should broadcast job cancelled event', () => {
      const broadcastSpy = jest.spyOn(gateway, 'broadcast');
      const data = {
        jobId: 'job-123',
        jobRunId: 'run-123',
        cancelledAt: new Date().toISOString(),
      };

      gateway.emitJobCancelled(data);

      expect(broadcastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: WSEventName.JOB_CANCELLED,
          data,
        }),
      );
    });
  });

  describe('emitInstanceCreated', () => {
    it('should broadcast instance created event', () => {
      const broadcastSpy = jest.spyOn(gateway, 'broadcast');
      const data = {
        instanceId: 'inst-123',
        name: 'Test Instance',
        gameType: 'ASA',
        createdAt: new Date().toISOString(),
      };

      gateway.emitInstanceCreated(data);

      expect(broadcastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: WSEventName.INSTANCE_CREATED,
          data,
        }),
      );
    });
  });

  describe('emitInstanceUpdated', () => {
    it('should broadcast instance updated event', () => {
      const broadcastSpy = jest.spyOn(gateway, 'broadcast');
      const data = {
        instanceId: 'inst-123',
        updatedAt: new Date().toISOString(),
      };

      gateway.emitInstanceUpdated(data);

      expect(broadcastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: WSEventName.INSTANCE_UPDATED,
          data,
        }),
      );
    });
  });

  describe('emitInstanceDeleted', () => {
    it('should broadcast instance deleted event', () => {
      const broadcastSpy = jest.spyOn(gateway, 'broadcast');
      const data = {
        instanceId: 'inst-123',
        deletedAt: new Date().toISOString(),
      };

      gateway.emitInstanceDeleted(data);

      expect(broadcastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: WSEventName.INSTANCE_DELETED,
          data,
        }),
      );
    });
  });

  describe('emitInstanceStatusChanged', () => {
    it('should broadcast instance status changed event', () => {
      const broadcastSpy = jest.spyOn(gateway, 'broadcast');
      const data = {
        instanceId: 'inst-123',
        status: 'RUNNING' as any,
        changedAt: new Date().toISOString(),
      };

      gateway.emitInstanceStatusChanged(data);

      expect(broadcastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: WSEventName.INSTANCE_STATUS_CHANGED,
          data,
        }),
      );
    });
  });

  describe('emitInstanceLog', () => {
    it('should broadcast instance log event', () => {
      const broadcastSpy = jest.spyOn(gateway, 'broadcast');
      const data = {
        instanceId: 'inst-123',
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Test log message',
      };

      gateway.emitInstanceLog(data);

      expect(broadcastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: WSEventName.INSTANCE_LOG,
          data,
        }),
      );
    });
  });
});

