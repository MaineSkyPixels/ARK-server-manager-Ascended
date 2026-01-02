# Change Requests Review — Integration Lead Decision

**Date:** 2024-01-XX  
**Reviewer:** Integration Lead

---

## Summary

All 5 change requests have been **APPROVED** with conditions. Contract updates have been completed for CR-002 and CR-004. CR-005 is approved for future implementation (Milestone 2).

---

## ✅ CR-001: Job Polling and Progress Reporting Endpoints

**Status:** ✅ **APPROVED** — Ready for Implementation

**Decision:** Approved without contract changes. All required DTOs already exist in contracts.

**Required Actions:**
- Agent A (Control Plane) must implement 3 endpoints:
  1. `GET /jobs/poll?agentId={agentId}` — Returns `JobPollResponseDto`
  2. `POST /jobs/progress` — Accepts `JobProgressDto`, returns 204
  3. `POST /jobs/complete` — Accepts `JobCompleteDto`, returns 204

**Implementation Requirements:**
- Poll endpoint filters jobs by `agentId` and status `QUEUED`
- Progress/completion endpoints update `job_run` records
- Progress/completion endpoints emit WebSocket events (`job:progress`, `job:completed`, `job:failed`)
- All endpoints validate agentId exists and is active

**Priority:** HIGH (blocks Agent B)

---

## ✅ CR-002: Instance Logs Endpoint

**Status:** ✅ **APPROVED** — Contracts Updated

**Decision:** Approved with contract updates completed.

**Contract Changes Completed:**
- ✅ Added `LogEntryDto` to `packages/contracts/src/dto/instance.dto.ts`
- ✅ Added `INSTANCE_LOG` event to `WSEventName` enum
- ✅ Added `WSInstanceLogEvent` interface to `packages/contracts/src/ws-events.ts`
- ✅ Added to `WSEvent` union type

**Required Actions:**
- Agent A (Control Plane) must implement:
  1. `GET /instances/{instanceId}/logs` endpoint
  2. WebSocket event emission for `instance:log`

**Implementation Requirements:**
- Endpoint validates `instanceId` exists
- Log level filter accepts: INFO, WARN, ERROR, DEBUG, TRACE (case-insensitive)
- Default limit: 100, max limit: 1000
- WebSocket event emitted when new log entries available

**Priority:** MEDIUM (enhances UI functionality)

---

## ✅ CR-003: WebSocket Connection Endpoint

**Status:** ✅ **APPROVED** — Protocol Documentation

**Decision:** Approved. This is an implementation/documentation request. No contract changes needed.

**Required Actions:**
- Agent A (Control Plane) must implement WebSocket gateway at `/ws`
- Create `docs/WEBSOCKET_PROTOCOL.md` documenting:
  - Connection URL format: `ws://{host}:{port}/ws`
  - Message format (already matches contracts)
  - Reconnection behavior
  - Error handling

**Implementation Requirements:**
- Endpoint path: `/ws` (not `/ws/` or `/websocket`)
- Server may send welcome message: `{ "event": "system:connected", "data": { "timestamp": "..." } }`
- Client receives all events (no subscription filtering needed initially)
- Invalid JSON messages ignored (log warning)
- Connection errors allow reconnection
- Authentication deferred to future milestone

**Priority:** HIGH (blocks UI WebSocket connection)

---

## ✅ CR-004: Job Progress Details in JobResponseDto

**Status:** ✅ **APPROVED** — Contracts Updated

**Decision:** Approved with contract updates completed.

**Contract Changes Completed:**
- ✅ Added `progressPercent?: number` to `JobResponseDto`
- ✅ Added `progressMessage?: string` to `JobResponseDto`

**Required Actions:**
- Agent A (Control Plane) must populate these fields from latest `JobRun`:
  - `progressPercent` from `jobRun.percent`
  - `progressMessage` from `jobRun.message`
- Fields should be `undefined` if no progress reported yet
- When job is COMPLETED/FAILED/CANCELLED, fields reflect final state

**Priority:** MEDIUM (enhances UI functionality)

---

## 📋 Implementation Order (Recommended)

1. **CR-001** (HIGH) — Unblocks Agent B
2. **CR-003** (HIGH) — Enables UI WebSocket
3. **CR-004** (MEDIUM) — Enhances UI job display
4. **CR-002** (MEDIUM) — Enhances UI logs tab

---

## 📝 Notes for Agent A (Control Plane)

### CR-001 Implementation Guide

```typescript
// GET /jobs/poll?agentId={agentId}
// Returns: JobPollResponseDto
// Filters: agentId matches AND status = 'QUEUED'

// POST /jobs/progress
// Body: JobProgressDto
// Updates: job_run.percent, job_run.message, job_run.status
// Emits: WebSocket event 'job:progress'

// POST /jobs/complete
// Body: JobCompleteDto
// Updates: job_run.status, job_run.result, job_run.error
// Emits: WebSocket event 'job:completed' or 'job:failed'
```

### CR-003 Implementation Guide

- Use NestJS WebSocket gateway (`@nestjs/websockets`)
- Endpoint: `/ws`
- Message format matches `WSEvent` union type from contracts
- Handle reconnection gracefully
- Document protocol in `docs/WEBSOCKET_PROTOCOL.md`

### CR-004 Implementation Guide

- When returning `JobResponseDto`, populate from latest `JobRun`:
  ```typescript
  progressPercent: latestJobRun?.percent,
  progressMessage: latestJobRun?.message,
  ```

### CR-002 Implementation Guide

- Endpoint: `GET /instances/{instanceId}/logs`
- Query params: `limit`, `since`, `level`
- Response: `LogEntryDto[]`
- Emit WebSocket event `instance:log` when new logs available

---

## ✅ Contract Changes Summary

### Files Modified:
1. `packages/contracts/src/dto/instance.dto.ts`
   - Added `LogEntryDto` interface

2. `packages/contracts/src/dto/job.dto.ts`
   - Added `progressPercent?: number` to `JobResponseDto`
   - Added `progressMessage?: string` to `JobResponseDto`

3. `packages/contracts/src/ws-events.ts`
   - Added `INSTANCE_LOG = 'instance:log'` to `WSEventName` enum
   - Added `WSInstanceLogEvent` interface
   - Added to `WSEvent` union type

### Breaking Changes:
- ❌ None — All changes are backward compatible (optional fields or new endpoints)

---

## 🚀 Next Steps

1. **Agent A**: Implement CR-001 endpoints (HIGH priority)
2. **Agent A**: Implement CR-003 WebSocket gateway (HIGH priority)
3. **Agent A**: Update job responses to include progress (CR-004)
4. **Agent A**: Implement instance logs endpoint (CR-002)
5. **All Agents**: Rebuild contracts package and verify no compilation errors

---

## 📊 Approval Status

| CR | Status | Contract Changes | Implementation Required |
|----|--------|------------------|------------------------|
| CR-001 | ✅ Approved | None needed | Agent A |
| CR-002 | ✅ Approved | ✅ Completed | Agent A |
| CR-003 | ✅ Approved | None needed | Agent A |
| CR-004 | ✅ Approved | ✅ Completed | Agent A |
| CR-005 | ✅ Approved | None needed | Agent C (Milestone 2) |

---

## ✅ CR-005: Settings Registry Database Schema

**Status:** ✅ **APPROVED** — Ready for Milestone 2

**Decision:** Approved. Schema design aligns perfectly with `RegistryKeyMetadata` type and supports all requirements.

**Required Actions:**
- Agent C (or Integration Lead) must add `SettingRegistry` model to Prisma schema when ready for Milestone 2
- Run migration: `pnpm --filter @ark-asa/db prisma migrate dev --name add_setting_registry`

**Implementation Requirements:**
- Schema matches proposed design exactly
- Unique constraint on `[gameType, fileType, section, key]`
- Indexes on `[gameType, fileType]` and `[section, key]`
- JSON field for flexible constraints

**Priority:** MEDIUM (needed for Milestone 2, not blocking Milestone 1)

**Note:** This can be implemented when Agent C is ready to move to Milestone 2. No immediate action required.

---

**All change requests approved. Ready for implementation.**

