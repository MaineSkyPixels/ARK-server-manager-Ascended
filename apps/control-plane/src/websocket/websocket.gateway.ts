import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import {
  WSEvent,
  WSEventName,
  WSJobCreatedEvent,
  WSJobProgressEvent,
  WSJobCompletedEvent,
  WSJobFailedEvent,
  WSJobCancelledEvent,
  WSInstanceCreatedEvent,
  WSInstanceUpdatedEvent,
  WSInstanceDeletedEvent,
  WSInstanceStatusChangedEvent,
  WSInstanceLogEvent,
} from '@ark-asa/contracts';

@WebSocketGateway({
  path: '/ws',
  transports: ['websocket'],
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private clients: Set<WebSocket> = new Set();

  afterInit(_server: Server) {
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: WebSocket) {
    this.clients.add(client);
    this.logger.debug(`Client connected. Total clients: ${this.clients.size}`);
    // Client will receive events as they occur - no welcome message needed
  }

  handleDisconnect(client: WebSocket) {
    this.clients.delete(client);
    this.logger.debug(`Client disconnected. Total clients: ${this.clients.size}`);
  }

  /**
   * Broadcast an event to all connected clients
   */
  broadcast(event: WSEvent) {
    const message = JSON.stringify(event);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          this.logger.warn('Failed to send WebSocket message', error);
        }
      }
    });
    this.logger.debug(`Broadcasted event: ${event.event} to ${this.clients.size} clients`);
  }

  /**
   * Emit job progress event
   */
  emitJobProgress(data: WSJobProgressEvent['data']) {
    const event: WSJobProgressEvent = {
      event: WSEventName.JOB_PROGRESS,
      data,
    };
    this.broadcast(event);
  }

  /**
   * Emit job completed event
   */
  emitJobCompleted(data: WSJobCompletedEvent['data']) {
    const event: WSJobCompletedEvent = {
      event: WSEventName.JOB_COMPLETED,
      data,
    };
    this.broadcast(event);
  }

  /**
   * Emit job failed event
   */
  emitJobFailed(data: WSJobFailedEvent['data']) {
    const event: WSJobFailedEvent = {
      event: WSEventName.JOB_FAILED,
      data,
    };
    this.broadcast(event);
  }

  /**
   * Emit job cancelled event
   */
  emitJobCancelled(data: WSJobCancelledEvent['data']) {
    const event: WSJobCancelledEvent = {
      event: WSEventName.JOB_CANCELLED,
      data,
    };
    this.broadcast(event);
  }

  /**
   * Emit job created event
   */
  emitJobCreated(data: WSJobCreatedEvent['data']) {
    const event: WSJobCreatedEvent = {
      event: WSEventName.JOB_CREATED,
      data,
    };
    this.broadcast(event);
  }

  /**
   * Emit instance created event
   */
  emitInstanceCreated(data: WSInstanceCreatedEvent['data']) {
    const event: WSInstanceCreatedEvent = {
      event: WSEventName.INSTANCE_CREATED,
      data,
    };
    this.broadcast(event);
  }

  /**
   * Emit instance updated event
   */
  emitInstanceUpdated(data: WSInstanceUpdatedEvent['data']) {
    const event: WSInstanceUpdatedEvent = {
      event: WSEventName.INSTANCE_UPDATED,
      data,
    };
    this.broadcast(event);
  }

  /**
   * Emit instance deleted event
   */
  emitInstanceDeleted(data: WSInstanceDeletedEvent['data']) {
    const event: WSInstanceDeletedEvent = {
      event: WSEventName.INSTANCE_DELETED,
      data,
    };
    this.broadcast(event);
  }

  /**
   * Emit instance status changed event
   */
  emitInstanceStatusChanged(data: WSInstanceStatusChangedEvent['data']) {
    const event: WSInstanceStatusChangedEvent = {
      event: WSEventName.INSTANCE_STATUS_CHANGED,
      data,
    };
    this.broadcast(event);
  }

  /**
   * Emit instance log event
   */
  emitInstanceLog(data: WSInstanceLogEvent['data']) {
    const event: WSInstanceLogEvent = {
      event: WSEventName.INSTANCE_LOG,
      data,
    };
    this.broadcast(event);
  }
}

