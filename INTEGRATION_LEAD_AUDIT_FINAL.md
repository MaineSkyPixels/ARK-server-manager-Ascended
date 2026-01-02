# Integration Lead Audit — Repository Status & Agent Instructions

**Date:** 2024-01-XX  
**Auditor:** Integration Lead  
**Scope:** Complete repository audit + continuation instructions

---

## 1. EXECUTIVE SUMMARY

**Project Health:** ✅ **GOOD** — Contract-first architecture maintained, critical path unblocked, significant progress

**Status:**
- ✅ Contracts: Complete and stable (all CRs integrated)
- ✅ Database Schema: Complete (CR-005 schema added, migration pending)
- ✅ Control Plane: 75% complete (core endpoints implemented)
- ✅ Agent Runtime: 60% complete (process control + SteamCMD handlers implemented)
- ✅ Settings Engine: 100% complete (Milestone 1)
- ⚠️ Desktop UI: 45% complete (structure ready, needs WebSocket integration)

**Blockers:** None  
**Warnings:** Agent B backup handlers still missing (not blocking current milestone)

**Change Requests:** All 5 CRs approved and implemented ✅

---

## 2. REPO AUDIT FINDINGS

### 2.1 Contracts & Guardrails ✅

**Status:** ✅ **EXCELLENT**

**Findings:**
- ✅ `GameType` enum exists (ASA | ASE) — properly enforced
- ✅ `JobType` enum matches `JOBS_PROTOCOL.md` — all 11 types defined
- ✅ Progress event payloads stable — `JobProgressDto` matches contracts
- ✅ No unauthorized contract edits — all changes via CR process
- ✅ WebSocket events complete — all events defined in `ws-events.ts`
- ✅ DTOs complete — all required DTOs exist

**Category:** ✅ **OK**

---

### 2.2 Prisma / DB State ✅

**Status:** ✅ **COMPLETE**

**Findings:**
- ✅ Core tables exist: `instances`, `jobs`, `job_runs`, `backups`, `agents`, `hosts`, `clusters`
- ✅ `SettingRegistry` model added (CR-005) — schema ready, migration pending
- ✅ No unauthorized schema edits — all changes via CR process
- ✅ Relationships correct — foreign keys properly defined
- ✅ Indexes appropriate — query patterns supported

**Issues:**
- ⏳ Migration pending: CR-005 `SettingRegistry` table (not blocking)

**Category:** ✅ **OK**

---

### 2.3 Control Plane (Agent A) ✅

**Status:** ✅ **75% COMPLETE**

**Findings:**
- ✅ NestJS app structure correct
- ✅ Agent registration + heartbeat — implemented and tested
- ✅ Job polling + progress + completion — CR-001 implemented
- ✅ Job creation endpoint — implemented
- ✅ Instance CRUD endpoints — implemented (create, read, update, delete, list)
- ✅ WebSocket gateway — CR-003 implemented at `/ws`
- ✅ Instance logs endpoint — CR-002 implemented
- ✅ Configuration service — runtime root extracted
- ✅ Global exception filter — standardized errors
- ⚠️ Host management — endpoints are stubs (low priority)
- ⚠️ Test coverage — ~30% (Agents module only)

**Category:** ✅ **OK** (warnings acceptable)

---

### 2.4 Agent Runtime (Agent B) ✅

**Status:** ✅ **60% COMPLETE**

**Findings:**
- ✅ Agent infrastructure — registration, polling, progress reporting
- ✅ Process control handlers — START_INSTANCE, STOP_INSTANCE, RESTART_INSTANCE implemented
- ✅ **NEW:** SteamCMD handler — INSTALL_SERVER, UPDATE_SERVER implemented
- ✅ ProcessManager — Windows process control
- ✅ SteamCMD runtime — SteamCMD integration
- ✅ Build activator — build activation logic
- ⚠️ Backup handlers — BACKUP_INSTANCE, RESTORE_BACKUP, VERIFY_BACKUP still placeholders
- ⚠️ Other handlers — PRUNE_BACKUPS, SYNC_MODS, ACTIVATE_BUILD still placeholders
- ⚠️ No structured file logging (console only)
- ⚠️ No tests (0% coverage)

**Category:** ✅ **OK** (critical path unblocked)

---

### 2.5 Settings Engine (Agent C) ✅

**Status:** ✅ **100% COMPLETE** (Milestone 1)

**Findings:**
- ✅ INI parser — implemented
- ✅ Unknown keys preserved — raw blocks implemented
- ✅ Renderer deterministic — round-trip stable
- ✅ Tests comprehensive — high coverage
- ✅ Documentation excellent

**Category:** ✅ **OK**

---

### 2.6 Avalonia UI (Agent D) ⚠️

**Status:** ⚠️ **45% COMPLETE**

**Findings:**
- ✅ App structure — MVVM pattern
- ✅ Navigation service
- ✅ API client — all endpoints implemented
- ✅ Configuration support — AppConfiguration parameter added
- ✅ WebSocket client infrastructure
- ⚠️ WebSocket events not wired to ViewModels
- ⚠️ Instance logs view not connected to endpoint
- ⚠️ WebSocket reconnect uses fixed delay
- ⚠️ No tests (0% coverage)

**Category:** ✅ **OK** (warnings acceptable)

---

## 3. DRIFT & RISK ANALYSIS

### 3.1 Violations of CONTRIBUTING_AI.md

**Findings:**
- ✅ No violations — all agents respect file ownership
- ✅ Contracts edited only via CR process
- ✅ Schema edited only via CR process

**Category:** ✅ **OK**

---

### 3.2 Invented API Shapes

**Findings:**
- ✅ None — all endpoints match contracts
- ✅ UI uses exact contract DTOs

**Category:** ✅ **OK**

---

### 3.3 Hardcoded Paths/Settings

**Findings:**
- ✅ UI ApiClient — supports AppConfiguration (improved)
- ✅ Control Plane — uses AppConfigService
- ✅ Agent — uses env vars with defaults (acceptable)

**Category:** ✅ **OK**

---

### 3.4 ASA/ASE Boundary Violations

**Findings:**
- ✅ None — `GameType` enum enforced throughout
- ✅ Instance schema requires `gameType` field
- ✅ No mixed defaults/paths

**Category:** ✅ **OK**

---

### 3.5 Blocking Issues

**Findings:**
- ✅ No blockers — all critical paths unblocked

**Category:** ✅ **OK**

---

## 4. CHANGE REQUEST REVIEW

### Status: All 5 CRs Approved and Implemented ✅

**CR-001:** Job Polling Endpoints — ✅ **COMPLETE**  
**CR-002:** Instance Logs Endpoint — ✅ **COMPLETE**  
**CR-003:** WebSocket Gateway — ✅ **COMPLETE**  
**CR-004:** Job Progress in Responses — ✅ **COMPLETE**  
**CR-005:** Settings Registry Schema — ✅ **SCHEMA ADDED** (migration pending)

**No pending change requests.**

---

## 5. AGENT-BY-AGENT INSTRUCTIONS

### Agent A (Control Plane) — Status

**Complete:**
- ✅ Agent registration + heartbeat (tested)
- ✅ Job polling + progress + completion
- ✅ Job creation endpoint
- ✅ Instance CRUD endpoints
- ✅ Instance logs endpoint
- ✅ WebSocket gateway
- ✅ Configuration service
- ✅ Global exception filter

**Partially Complete:**
- ⚠️ Host management endpoints (stubs)
- ⚠️ Test coverage (Agents module only)

**Missing:**
- ⚠️ Tests for jobs module (E2E)
- ⚠️ Tests for WebSocket gateway
- ⚠️ Tests for instances module

---

### Agent A — NEXT TASKS (MAX 3)

1. **Add E2E tests for job creation workflow**
   - File: `apps/control-plane/test/jobs.e2e-spec.ts` (create)
   - Test: Create job → agent polls → agent reports progress → job completes
   - Verify: WebSocket events emitted correctly
   - Use: Supertest for HTTP, mock WebSocket

2. **Add unit tests for instances service**
   - File: `apps/control-plane/src/instances/instances.service.spec.ts` (create)
   - Test: `createInstance()`, `updateInstance()`, `deleteInstance()`, `listInstances()`
   - Mock: PrismaService
   - Verify: Error cases (instance not found, agent not found)

3. **Add WebSocket gateway tests**
   - File: `apps/control-plane/src/websocket/websocket.gateway.spec.ts` (create)
   - Test: Connection handling, event broadcasting, disconnection
   - Mock: WebSocket clients
   - Verify: Events broadcast to all connected clients

---

### Agent A — DO NOT

- Modify contracts without CR
- Modify Prisma schema without CR
- Implement host management (low priority, defer)
- Add new job types (frozen this cycle)

---

### Agent B (Windows Agent) — Status

**Complete:**
- ✅ Agent infrastructure (registration, polling, progress)
- ✅ Process control handlers (START_INSTANCE, STOP_INSTANCE, RESTART_INSTANCE)
- ✅ **NEW:** SteamCMD handler (INSTALL_SERVER, UPDATE_SERVER)
- ✅ ProcessManager
- ✅ SteamCMD runtime
- ✅ Build activator

**Partially Complete:**
- ⚠️ Backup handlers (BACKUP_INSTANCE, RESTORE_BACKUP, VERIFY_BACKUP — placeholders)
- ⚠️ Other handlers (PRUNE_BACKUPS, SYNC_MODS, ACTIVATE_BUILD — placeholders)

**Missing:**
- ⚠️ Structured file logging
- ⚠️ Tests for handlers
- ⚠️ Backup/restore logic

---

### Agent B — NEXT TASKS (MAX 3)

1. **Implement BACKUP_INSTANCE job handler**
   - File: `apps/agent/src/jobs/handlers/backup-instance.handler.ts` (create)
   - Requirements:
     - Stop instance if running (or create hot backup)
     - Copy instance data from `runtime/instances/{instanceId}/data/`
     - Compress backup archive
     - Store in `runtime/backups/{instanceId}/{timestamp}.zip`
     - Report progress: 0-40% (stopping), 40-80% (copying), 80-100% (compressing)
   - Reference: `STORAGE_LAYOUT.md` for backup paths
   - Make idempotent (check if backup already exists)
   - Integrate into executor switch statement

2. **Add structured file logging**
   - File: `apps/agent/src/utils/logger.ts` (create)
   - Use: `winston` or similar
   - Log to: `runtime/logs/agent/agent.log` (rotate daily)
   - Log job execution to: `runtime/logs/jobs/{jobId}.log`
   - Replace: `console.log` calls with logger
   - Start with: `executor.ts`, `process-control.ts`, `steamcmd.ts`

3. **Add unit tests for ProcessControlHandler**
   - File: `apps/agent/src/jobs/handlers/process-control.spec.ts` (create)
   - Test: START_INSTANCE (idempotency, error cases), STOP_INSTANCE (idempotency), RESTART_INSTANCE
   - Mock: ProcessManager
   - Verify: Progress reporting called correctly, error handling

---

### Agent B — DO NOT

- Modify contracts
- Modify storage layout
- Add new job types
- Change job polling protocol (V1 locked)
- Implement all remaining handlers at once (focus on BACKUP_INSTANCE)

---

### Agent C (Settings Engine) — Status

**Complete:**
- ✅ INI parser (Milestone 1)
- ✅ INI renderer (Milestone 1)
- ✅ Unknown key preservation
- ✅ Round-trip stability
- ✅ Comprehensive tests
- ✅ Documentation

**Partially Complete:**
- N/A (Milestone 1 complete)

**Missing:**
- ⏳ Registry integration (Milestone 2, schema ready)

---

### Agent C — NEXT TASKS (MAX 3)

1. **Prepare for Milestone 2 (Registry Integration)**
   - Review CR-005 schema in `packages/db/prisma/schema.prisma`
   - Design registry seed data format (JSON or CSV)
   - Plan import mechanism (CLI tool or migration script)

2. **Wait for migration**
   - Migration command: `pnpm --filter @ark-asa/db prisma migrate dev --name add_setting_registry`
   - Run when ready to proceed with Milestone 2
   - Verify: Table created successfully

3. **Document registry integration plan**
   - File: `packages/common/HANDOFF_AGENT_C_MILESTONE_2.md` (create)
   - Outline: How registry will be populated, how parser will use registry, API endpoints needed (if any), testing strategy

---

### Agent C — DO NOT

- Modify contracts without CR
- Modify Prisma schema (already approved, wait for migration)
- Start Milestone 2 implementation until migration is run
- Add new features beyond registry integration

---

### Agent D (Desktop UI) — Status

**Complete:**
- ✅ App structure (MVVM)
- ✅ Navigation service
- ✅ API client (all endpoints)
- ✅ Configuration support (AppConfiguration parameter)
- ✅ WebSocket client infrastructure
- ✅ ViewModels for instances, jobs
- ✅ Views for instances list, instance detail, jobs

**Partially Complete:**
- ⚠️ WebSocket integration (client exists, events not wired to ViewModels)
- ⚠️ Instance logs view (UI ready, endpoint available ✅)

**Missing:**
- ⚠️ WebSocket events wired to ViewModels
- ⚠️ Instance logs view integration
- ⚠️ WebSocket reconnect with exponential backoff
- ⚠️ Tests

---

### Agent D — NEXT TASKS (MAX 3)

1. **Connect instance logs view to endpoint**
   - File: `apps/desktop-ui/ViewModels/InstanceDetailViewModel.cs` (modify)
   - Method: Add `LoadLogsAsync()` method
   - Call: `ApiClient.GetInstanceLogsAsync(instanceId)` in Logs tab
   - Display: Logs in `InstanceDetailPage.axaml` DataGrid
   - Endpoint available: `GET /instances/{instanceId}/logs` ✅
   - Handle: Empty logs, errors, loading states

2. **Wire WebSocket events to ViewModels**
   - File: `apps/desktop-ui/ViewModels/InstanceDetailViewModel.cs` (modify)
   - Subscribe: `instance:log` events from WebSocketClient
   - Update: Logs DataGrid in real-time (append new logs)
   - File: `apps/desktop-ui/ViewModels/JobsViewModel.cs` (modify)
   - Subscribe: `job:progress`, `job:completed`, `job:failed` events
   - Update: Job progress bars in real-time
   - Update: Job status indicators

3. **Implement exponential backoff for WebSocket reconnect**
   - File: `apps/desktop-ui/Services/WebSocketClient.cs` (modify)
   - Replace: Fixed delay with exponential backoff
   - Formula: `min(5000 * 2^attempt, 60000)` (max 60 seconds)
   - Reset: Backoff on successful connection
   - Log: Reconnection attempts

---

### Agent D — DO NOT

- Modify contracts (use C# DTOs as-is)
- Invent new API endpoints
- Change WebSocket protocol (V1 locked)
- Implement authentication (deferred)
- Add new views (focus on existing views first)

---

## 6. GLOBAL ALIGNMENT NOTES

### Current Milestone State

**Milestone: Single-Machine ASA Server** — ⏳ **IN PROGRESS**
- ✅ Process control working (START_INSTANCE, STOP_INSTANCE, RESTART_INSTANCE)
- ✅ Server installation/update working (INSTALL_SERVER, UPDATE_SERVER)
- ⏳ End-to-end workflow: Create instance → Install server → Start server → View logs → Stop server
- ⏳ Remaining: UI integration, backup support

**Next Milestone Target: Backup & Restore**
- Goal: Create backups, restore from backups, verify backups
- Blockers: None (BACKUP_INSTANCE handler needed)

---

### Success Criteria for Next Agent Cycle

**Agent A:**
- ✅ E2E tests for job workflow
- ✅ Unit tests for instances module
- ✅ WebSocket gateway tests

**Agent B:**
- ✅ BACKUP_INSTANCE handler working
- ✅ Structured logging implemented
- ✅ Process control handler tests

**Agent C:**
- ✅ Registry integration plan documented
- ⏳ Wait for migration (not blocking)

**Agent D:**
- ✅ Instance logs view working
- ✅ WebSocket real-time updates working
- ✅ Exponential backoff implemented

---

### Hard Freezes for Next Cycle

1. **No new job types** — Current 11 types are frozen
2. **No contract changes** — All contracts stable
3. **No schema changes** — Schema complete (except CR-005 migration when ready)
4. **Job transport V1 locked** — HTTP polling + HTTP progress reporting (no changes)
5. **Storage layout locked** — Follow `STORAGE_LAYOUT.md` exactly

---

**Audit Completed:** 2024-01-XX  
**Next Audit:** After Agent B implements BACKUP_INSTANCE and Agent D completes WebSocket integration

