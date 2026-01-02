# WEBSOCKET_PROTOCOL — Real-Time Event Streaming

This document defines the **WebSocket connection protocol** for the ARK ASA Server Manager Control Plane.

ALL CLIENTS MUST FOLLOW THIS PROTOCOL.

---

## 1. Connection

### Endpoint
```
ws://{host}:{port}/ws
```

**Examples:**
- `ws://localhost:3000/ws`
- `ws://control-plane.example.com:3000/ws`

### Connection Flow

1. **Client connects** to `/ws` endpoint
2. **Server accepts** connection (no authentication required initially)
3. **Server streams events** as they occur
4. **Client receives** all events (no subscription filtering needed initially)

### Reconnection

- Clients should implement automatic reconnection logic
- Reconnection is stateless - no session state is maintained
- Clients will receive all new events after reconnection
- No need to replay missed events (use REST API for historical data)

---

## 2. Message Format

All messages are **JSON objects** with the following structure:

```json
{
  "event": "event:name",
  "data": { ... }
}
```

### Event Names

Event names follow the pattern: `{category}:{action}`

**Job Events:**
- `job:created` - New job created
- `job:progress` - Job progress update
- `job:completed` - Job completed successfully
- `job:failed` - Job failed
- `job:cancelled` - Job cancelled

**Instance Events:**
- `instance:created` - New instance created
- `instance:updated` - Instance updated
- `instance:status_changed` - Instance status changed
- `instance:deleted` - Instance deleted
- `instance:log` - New log entry for instance

**Agent Events:**
- `agent:registered` - Agent registered
- `agent:heartbeat` - Agent heartbeat received
- `agent:offline` - Agent went offline

**System Events:**
- `system:error` - System error occurred

---

## 3. Event Payloads

All event payloads are defined in `packages/contracts/src/ws-events.ts`.

### Example: Job Progress Event

```json
{
  "event": "job:progress",
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "jobRunId": "660e8400-e29b-41d4-a716-446655440001",
    "status": "RUNNING",
    "percent": 45,
    "message": "Installing server files...",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Example: Job Completed Event

```json
{
  "event": "job:completed",
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "jobRunId": "660e8400-e29b-41d4-a716-446655440001",
    "result": {
      "buildId": "12345678",
      "installPath": "D:\\Ark ASA ASM\\runtime\\cache\\server_builds\\ASA\\12345678"
    },
    "completedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

### Example: Instance Status Changed Event

```json
{
  "event": "instance:status_changed",
  "data": {
    "instanceId": "770e8400-e29b-41d4-a716-446655440002",
    "status": "RUNNING",
    "changedAt": "2024-01-15T10:40:00.000Z"
  }
}
```

---

## 4. Error Handling

### Invalid Messages

- If client sends invalid JSON, server will **ignore** the message
- Server logs a warning but does not disconnect the client
- Client should not send messages (server is push-only)

### Connection Errors

- Network errors should trigger automatic reconnection
- Server may close connection on internal errors
- Client should handle connection drops gracefully

### Message Parsing Errors

- If client receives malformed JSON, it should **log and ignore** the message
- Client should continue processing subsequent messages

---

## 5. Client Implementation Guidelines

### TypeScript Example

```typescript
import { WSEvent, WSEventName } from '@ark-asa/contracts';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect(url: string) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WSEvent = JSON.parse(event.data);
        this.handleEvent(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect(url);
    };
  }

  private handleEvent(event: WSEvent) {
    switch (event.event) {
      case WSEventName.JOB_PROGRESS:
        // Handle job progress
        break;
      case WSEventName.JOB_COMPLETED:
        // Handle job completion
        break;
      // ... other events
    }
  }

  private attemptReconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => this.connect(url), delay);
    }
  }
}
```

---

## 6. Authentication (Future)

Currently, **no authentication is required**. In future milestones:

- Authentication token may be passed via query string: `ws://host:port/ws?token={token}`
- Or via custom header (if supported by WebSocket implementation)
- Unauthenticated connections will be rejected

---

## 7. Rate Limiting (Future)

Currently, **no rate limiting is applied**. In future milestones:

- Clients may be rate-limited if they send too many messages
- Server may disconnect clients that violate rate limits
- Rate limits will be documented here when implemented

---

## 8. Testing

### Manual Testing with `wscat`

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:3000/ws

# You should see events as they occur
```

### Example Output

```
Connected (press CTRL+C to quit)
< {"event":"job:progress","data":{"jobId":"...","jobRunId":"...","status":"RUNNING","percent":25,"message":"Downloading files...","timestamp":"2024-01-15T10:30:00.000Z"}}
< {"event":"job:progress","data":{"jobId":"...","jobRunId":"...","status":"RUNNING","percent":50,"message":"Extracting files...","timestamp":"2024-01-15T10:31:00.000Z"}}
< {"event":"job:completed","data":{"jobId":"...","jobRunId":"...","result":{},"completedAt":"2024-01-15T10:35:00.000Z"}}
```

---

## 9. Protocol Version

**Current Version:** V1

Protocol changes will be versioned and documented here.

---

## 10. References

- Event type definitions: `packages/contracts/src/ws-events.ts`
- DTO definitions: `packages/contracts/src/dto/`
- Control plane implementation: `apps/control-plane/src/websocket/`
