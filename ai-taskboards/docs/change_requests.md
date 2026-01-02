# CHANGE_REQUESTS — Controlled Cross-Boundary Changes

This document is the **ONLY approved mechanism** for proposing changes that
cross ownership boundaries or affect shared contracts, schemas, or protocols.

ALL AI AGENTS MUST USE THIS PROCESS.

---

## 1. When a Change Request Is REQUIRED

You MUST create a Change Request if you need to modify or add to:

- packages/contracts/**
  - DTOs
  - API endpoints
  - WebSocket events
  - Enums used across services
- packages/db/**
  - Prisma schema
  - Migrations
- JOBS_PROTOCOL.md
- STORAGE_LAYOUT.md
- Any ASA vs ASE guardrail
- Any shared identifier, format, or convention

If unsure → create a Change

---

## Change Requests

### CR-001: Job Polling and Progress Reporting Endpoints

**Requested by:** Agent B (Windows Agent Runtime)

**Date:** 2024-01-XX

**Type:** API Endpoints

**Description:**
The agent requires HTTP endpoints for job polling and progress reporting as specified in `docs/jobs_protocol.md`. These endpoints are currently missing from the control plane.

**Required Endpoints:**

1. **GET /jobs/poll?agentId={agentId}**
   - Purpose: Agent polls for assigned jobs
   - Response: `JobPollResponseDto` (from contracts)
   - Behavior: Returns list of jobs assigned to the specified agent with status QUEUED

2. **POST /jobs/progress**
   - Purpose: Agent reports job progress updates
   - Request Body: `JobProgressDto` (from contracts)
   - Response: 204 No Content on success

3. **POST /jobs/complete**
   - Purpose: Agent reports job completion (success or failure)
   - Request Body: `JobCompleteDto` (from contracts)
   - Response: 204 No Content on success

**Contract References:**
- `JobPollResponseDto` - Already defined in `packages/contracts/src/dto/job.dto.ts`
- `JobProgressDto` - Already defined in `packages/contracts/src/dto/job.dto.ts`
- `JobCompleteDto` - Already defined in `packages/contracts/src/dto/job.dto.ts`

**Implementation Notes:**
- Endpoints should be added to `apps/control-plane/src/jobs/jobs.controller.ts`
- Service methods should be added to `apps/control-plane/src/jobs/jobs.service.ts`
- Job polling should filter jobs by `agentId` and status `QUEUED`
- Progress and completion should update job_run records and emit WebSocket events

**Status:** ✅ **APPROVED** by Integration Lead

**Review Notes:**
- ✅ All required DTOs already exist in contracts (`JobPollResponseDto`, `JobProgressDto`, `JobCompleteDto`)
- ✅ Endpoints align perfectly with `JOBS_PROTOCOL.md` (V1 - LOCKED)
- ✅ Implementation path is clear and follows existing patterns
- ✅ No contract changes required - ready for implementation

**Approval Conditions:**
- Endpoints must update `job_run` records in database
- Progress/completion endpoints must emit WebSocket events (`job:progress`, `job:completed`, `job:failed`)
- Poll endpoint should return jobs with status `QUEUED` assigned to the agent
- All endpoints must validate agentId exists and is active

**Implementation Priority:** HIGH (blocks Agent B)

**Implementation Status:** ✅ **COMPLETE** - All endpoints implemented
- ✅ `GET /jobs/poll?agentId={agentId}` - Implemented in `apps/control-plane/src/jobs/jobs.controller.ts` (line 15-27)
- ✅ `POST /jobs/progress` - Implemented in `apps/control-plane/src/jobs/jobs.controller.ts` (line 29-41)
- ✅ `POST /jobs/complete` - Implemented in `apps/control-plane/src/jobs/jobs.controller.ts` (line 43-56)
- ✅ Service methods implemented in `apps/control-plane/src/jobs/jobs.service.ts`
- ✅ WebSocket events emitted for progress and completion
- ✅ Database updates working (job_run records updated)
- ✅ Agent validation working (agentId verified)

---

### CR-002: Instance Logs Endpoint

**Requested by:** Agent D (Avalonia Desktop UI)

**Date:** 2024-01-XX

**Type:** API Endpoint

**Description:**
The instance detail page has a Logs tab, but there's no endpoint to fetch instance logs. The UI needs to display live logs for server instances.

**Required Endpoint:**

1. **GET /instances/{instanceId}/logs**
   - Purpose: Fetch log entries for an instance
   - Query Parameters:
     - `limit` (optional, default: 100) - Number of log entries to return
     - `since` (optional) - ISO 8601 timestamp to fetch logs since
     - `level` (optional) - Filter by log level (INFO, WARN, ERROR, etc.)
   - Response: Array of log entries
   ```typescript
   interface LogEntryDto {
     timestamp: string; // ISO 8601
     level: string;
     message: string;
   }
   ```

2. **WebSocket Event: `instance:log`**
   - Purpose: Stream new log entries in real-time
   - Payload:
   ```typescript
   {
     event: "instance:log",
     data: {
       instanceId: string;
       timestamp: string;
       level: string;
       message: string;
     }
   }
   ```

**Contract References:**
- Should be added to `packages/contracts/src/dto/instance.dto.ts`
- Should be added to `packages/contracts/src/ws-events.ts`

**Implementation Notes:**
- Endpoint should be added to `apps/control-plane/src/instances/instances.controller.ts`
- WebSocket event should be emitted when new log entries are available
- Logs should be stored/retrieved from the database or log aggregation system

**Status:** ✅ **APPROVED** with contract updates required

**Review Notes:**
- ✅ Endpoint design is reasonable and follows REST conventions
- ✅ Query parameters are well-specified
- ⚠️ **REQUIRED**: `LogEntryDto` must be added to contracts before implementation
- ⚠️ **REQUIRED**: `instance:log` WebSocket event must be added to contracts
- ✅ WebSocket event payload matches proposed structure

**Approval Conditions:**
1. **MUST ADD** to `packages/contracts/src/dto/instance.dto.ts`:
   ```typescript
   export interface LogEntryDto {
     timestamp: string; // ISO 8601
     level: string; // INFO, WARN, ERROR, DEBUG, etc.
     message: string;
   }
   ```

2. **MUST ADD** to `packages/contracts/src/ws-events.ts`:
   - Add `INSTANCE_LOG = 'instance:log'` to `WSEventName` enum
   - Add `WSInstanceLogEvent` interface matching the payload structure
   - Add to `WSEvent` union type

3. Endpoint should validate `instanceId` exists
4. Log level filter should accept: INFO, WARN, ERROR, DEBUG, TRACE (case-insensitive)
5. Default limit should be 100, max limit should be 1000
6. WebSocket event should be emitted when new log entries are available

**Implementation Priority:** MEDIUM (enhances UI functionality)

**Contract Status:** ✅ **COMPLETE** - All contract updates have been implemented
- ✅ `LogEntryDto` added to `packages/contracts/src/dto/instance.dto.ts` (lines 54-58)
- ✅ `INSTANCE_LOG = 'instance:log'` added to `WSEventName` enum in `packages/contracts/src/ws-events.ts` (line 21)
- ✅ `WSInstanceLogEvent` interface defined (lines 116-124)
- ✅ Added to `WSEvent` union type (line 174)

**Implementation Status:** ⏳ **PENDING** - Endpoint not yet implemented
- `apps/control-plane/src/instances/instances.controller.ts` - Endpoint needed
- WebSocket event emission needed when logs are available

---

### CR-003: WebSocket Connection Endpoint

**Requested by:** Agent D (Avalonia Desktop UI)

**Date:** 2024-01-XX

**Type:** WebSocket Protocol

**Description:**
The UI needs to connect to a WebSocket endpoint to receive real-time updates. The endpoint and connection protocol need to be defined.

**Required:**

1. **WebSocket Endpoint: `ws://{host}:{port}/ws`**
   - Purpose: Real-time event streaming
   - Authentication: TBD (may need auth token in query string or header)
   - Protocol: JSON messages

2. **Connection Flow:**
   - Client connects to `/ws`
   - Server sends welcome message (optional)
   - Client can subscribe to specific event types (optional - currently receives all)
   - Server streams events as they occur

3. **Message Format:**
   ```json
   {
     "event": "event:name",
     "data": { ... }
   }
   ```

**Contract References:**
- WebSocket events are already defined in `packages/contracts/src/ws-events.ts`
- Need to document the connection protocol in a new doc or update existing docs

**Implementation Notes:**
- Should be implemented in `apps/control-plane/src/` (WebSocket gateway)
- Need to handle reconnection gracefully
- Should support multiple concurrent clients

**Status:** ✅ **APPROVED** - Protocol documentation only

**Review Notes:**
- ✅ WebSocket events are already fully defined in `packages/contracts/src/ws-events.ts`
- ✅ Message format matches existing event structure
- ⚠️ **CLARIFICATION NEEDED**: Endpoint path should be `/ws` (not `/ws/` or `/websocket`)
- ✅ No contract changes required - this is an implementation/documentation request

**Approval Conditions:**
1. **Endpoint Path**: Use `/ws` (consistent with REST API base path)
2. **Connection Flow**:
   - Client connects to `ws://{host}:{port}/ws`
   - Server may send welcome message: `{ "event": "system:connected", "data": { "timestamp": "..." } }`
   - Client receives all events (no subscription filtering needed initially)
   - Server handles reconnection gracefully (no state required)
3. **Authentication**: Defer to future milestone (currently no auth required)
4. **Error Handling**: 
   - Invalid JSON messages should be ignored (log warning)
   - Connection errors should allow reconnection
5. **Documentation**: Create `docs/WEBSOCKET_PROTOCOL.md` documenting:
   - Connection URL format
   - Message format (already matches contracts)
   - Reconnection behavior
   - Error handling

**Implementation Priority:** HIGH (blocks UI WebSocket connection)

**Contract Status:** ✅ **COMPLETE** - No contract changes required (events already defined)

**Implementation Status:** ✅ **COMPLETE** - WebSocket gateway and documentation implemented
- ✅ WebSocket gateway implemented at `/ws` in `apps/control-plane/src/websocket/websocket.gateway.ts`
- ✅ Protocol documentation created at `ai-taskboards/docs/websocket_protocol.md`
- ✅ Gateway handles connections, disconnections, and event broadcasting
- ✅ Integrated with jobs service for event emission
- ✅ Supports all required WebSocket events (job:progress, job:completed, job:failed, job:cancelled)

---

### CR-004: Job Progress Details in JobResponseDto

**Requested by:** Agent D (Avalonia Desktop UI)

**Date:** 2024-01-XX

**Type:** API Response Enhancement

**Description:**
The UI displays job progress, but the `JobResponseDto` doesn't include progress percentage or current status message. These are available in `JobProgressDto` but only via WebSocket events.

**Required:**

1. **Enhance `JobResponseDto`** to include:
   ```typescript
   interface JobResponseDto {
     // ... existing fields ...
     progressPercent?: number; // 0-100, current progress
     progressMessage?: string; // Current status message
   }
   ```

**Contract References:**
- Update `packages/contracts/src/dto/job.dto.ts`

**Implementation Notes:**
- Control plane should populate these fields from the latest `JobProgressDto` when returning job details
- Should be optional fields to maintain backward compatibility

**Status:** ✅ **APPROVED** - Contract enhancement

**Review Notes:**
- ✅ Makes sense for UI to get progress from REST API (not just WebSocket)
- ✅ Optional fields maintain backward compatibility
- ✅ Aligns with existing `JobProgressDto` structure
- ✅ Simple, non-breaking change

**Approval Conditions:**
1. **MUST UPDATE** `packages/contracts/src/dto/job.dto.ts`:
   - Add `progressPercent?: number; // 0-100, current progress` to `JobResponseDto`
   - Add `progressMessage?: string; // Current status message` to `JobResponseDto`
2. Control plane should populate from latest `JobRun` record:
   - `progressPercent` from `jobRun.percent`
   - `progressMessage` from `jobRun.message`
3. Fields should be `undefined` if no progress has been reported yet
4. When job is COMPLETED/FAILED/CANCELLED, these fields should reflect final state

**Contract Status:** ✅ **COMPLETE** - Contract updates have been implemented
- ✅ `progressPercent?: number` added to `JobResponseDto` in `packages/contracts/src/dto/job.dto.ts` (line 31)
- ✅ `progressMessage?: string` added to `JobResponseDto` (line 32)

**Implementation Status:** ⏳ **PENDING** - Control plane must populate these fields
- Control plane should populate from latest `JobRun` record when returning job details
- Fields should be `undefined` if no progress has been reported yet

**Implementation Priority:** MEDIUM (enhances UI functionality)

---

### CR-005: Settings Registry Database Schema

**Requested by:** Agent C (Settings/INI/Template Engine)

**Date:** 2024-01-XX

**Type:** Database Schema

**Description:**
The Settings Registry is a DB-backed catalog of known ASA/ASE INI settings. It stores metadata about settings (gameType, fileType, section/key, valueType, defaults, constraints, UI metadata) and supports version tracking for settings that are introduced or deprecated.

**Required Schema:**

Add to `packages/db/prisma/schema.prisma`:

```prisma
model SettingRegistry {
  id                String   @id @default(uuid())
  gameType          String   // 'ASA' | 'ASE'
  fileType          String   // 'Game.ini', 'GameUserSettings.ini', 'Cmdline', etc.
  section           String   // Section name (empty string for top-level)
  key               String   // Key name
  valueType         String   // 'string', 'int', 'float', 'bool', 'array', etc.
  defaultValue      String?  // Default value as string
  constraints       Json?    // Validation constraints (min, max, enum values, etc.)
  category          String?  // UI category for grouping
  advanced          Boolean  @default(false) // Whether this is an advanced setting
  controlType       String?  // UI control type ('text', 'number', 'checkbox', 'select', etc.)
  introducedVersion String?  // Version when this setting was introduced
  deprecatedVersion String? // Version when this setting was deprecated
  description       String?  // Human-readable description
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([gameType, fileType, section, key])
  @@index([gameType, fileType])
  @@index([section, key])
  @@map("setting_registry")
}
```

**Contract References:**
- `RegistryKeyMetadata` type already defined in `packages/common/src/ini/types.ts`
- May need DTOs for registry operations if exposed via API (defer to future milestone)

**Implementation Notes:**
- Schema supports the full requirements from Agent C specification
- Unique constraint ensures no duplicate registry entries
- Indexes support common query patterns (by gameType/fileType, by section/key)
- JSON field for constraints allows flexible validation rules
- Version tracking supports ASA update churn (introduced/deprecated)

**Status:** ✅ **APPROVED** by Integration Lead

**Review Notes:**
- ✅ Schema design aligns perfectly with `RegistryKeyMetadata` type in `packages/common/src/ini/types.ts`
- ✅ Supports all requirements: gameType, fileType, section/key, valueType, defaults, constraints, UI metadata
- ✅ Version tracking fields (`introducedVersion`, `deprecatedVersion`) support ASA update churn
- ✅ Unique constraint `@@unique([gameType, fileType, section, key])` prevents duplicates
- ✅ Indexes optimize common query patterns (by gameType/fileType, by section/key)
- ✅ JSON field for `constraints` allows flexible validation rules
- ✅ All fields from `RegistryKeyMetadata` are represented, plus additional useful fields (`constraints`, `description`)
- ⚠️ **DEFERRED**: DTOs for API operations can be added later if needed (when registry operations need API endpoints)
- ⚠️ **DEFERRED**: Seed data mechanism/import process can be designed separately

**Approval Conditions:**
1. **MUST ADD** to `packages/db/prisma/schema.prisma`:
   - Add `SettingRegistry` model as specified above
   - Run migration: `pnpm --filter @ark-asa/db prisma migrate dev --name add_setting_registry`
2. **OPTIONAL** (future milestone): Add DTOs to `packages/contracts/src/dto/` if registry operations need API endpoints
3. **OPTIONAL** (future milestone): Design seed data format and import mechanism

**Implementation Priority:** MEDIUM (needed for Milestone 2, not blocking Milestone 1)

**Implementation Status:** ✅ **COMPLETE** - Schema added to Prisma
- ✅ `SettingRegistry` model added to `packages/db/prisma/schema.prisma` (lines 143-165)
- ✅ All fields match approved specification
- ✅ Unique constraint `@@unique([gameType, fileType, section, key])` added
- ✅ Indexes `@@index([gameType, fileType])` and `@@index([section, key])` added
- ✅ Table mapping `@@map("setting_registry")` added
- ⏳ **Migration pending** - Run `pnpm --filter @ark-asa/db prisma migrate dev --name add_setting_registry` when ready to create the database table