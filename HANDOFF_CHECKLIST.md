# Handoff Checklist — First Milestone

**Integration Lead** — Monorepo Scaffolding Complete

---

## ✅ Completed Tasks

### 1. Repository Structure
- ✅ Created monorepo directory structure:
  - `apps/control-plane/`
  - `apps/agent/`
  - `apps/desktop-ui/`
  - `packages/contracts/`
  - `packages/db/`
  - `packages/common/`

### 2. Tooling Configuration
- ✅ Configured pnpm workspace (`pnpm-workspace.yaml`)
- ✅ Root `package.json` with workspace scripts
- ✅ TypeScript configuration:
  - Root `tsconfig.base.json` (shared base config)
  - Individual `tsconfig.json` per package/app (extends base)
- ✅ ESLint configuration (`.eslintrc.json`)
- ✅ Prettier configuration (`.prettierrc.json`, `.prettierignore`)

### 3. Contracts Package (`packages/contracts`)
- ✅ Enums:
  - `GameType` (ASA | ASE)
  - `JobStatus` (CREATED, QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED)
  - `JobType` (all standard job types from JOBS_PROTOCOL.md)
  - `AgentStatus` (OFFLINE, REGISTERING, ONLINE, DEGRADED)
  - `InstanceStatus` (STOPPED, STARTING, RUNNING, STOPPING, ERROR)
- ✅ DTOs (stubs):
  - Agent DTOs (registration, heartbeat, capabilities, config)
  - Instance DTOs (create, response, update, list)
  - Job DTOs (create, response, progress, poll, assignment, complete)
  - Host DTOs (create, response)
  - Cluster DTOs (create, response)
- ✅ WebSocket Events:
  - Event names enum (`WSEventName`)
  - Type-safe event payloads for all events
  - Union type (`WSEvent`) for all events

### 4. Database Package (`packages/db`)
- ✅ Prisma schema stub with core entities:
  - Cluster, Host, Agent, Instance, Job, JobRun, Backup
- ✅ Schema enforces gameType separation (ASA/ASE)
- ✅ Relationships defined (Agent → Host, Instance → Agent, Job → Instance, etc.)

### 5. Common Package (`packages/common`)
- ✅ Basic skeleton (placeholder for shared utilities)

### 6. App Skeletons
- ✅ `apps/control-plane/` — package.json + tsconfig.json
- ✅ `apps/agent/` — package.json + tsconfig.json
- ✅ `apps/desktop-ui/` — package.json + tsconfig.json (Avalonia TBD)

---

## 📋 Commands Reference

### Build Commands
```bash
# Build all packages and apps
pnpm build

# Build specific package/app
pnpm --filter @ark-asa/contracts build
pnpm --filter @ark-asa/db build
pnpm --filter @ark-asa/control-plane build
pnpm --filter @ark-asa/agent build
```

### Lint Commands
```bash
# Lint all packages and apps
pnpm lint

# Lint specific package/app
pnpm --filter @ark-asa/contracts lint
pnpm --filter @ark-asa/db lint
pnpm --filter @ark-asa/control-plane lint
pnpm --filter @ark-asa/agent lint
```

### Type Checking
```bash
# Type check all packages and apps
pnpm typecheck

# Type check specific package/app
pnpm --filter @ark-asa/contracts typecheck
pnpm --filter @ark-asa/db typecheck
```

### Formatting
```bash
# Format all files
pnpm format

# Check formatting (CI)
pnpm format:check
```

### Database Commands (packages/db)
```bash
# Generate Prisma client
pnpm --filter @ark-asa/db prisma:generate

# Run migrations
pnpm --filter @ark-asa/db prisma:migrate

# Open Prisma Studio
pnpm --filter @ark-asa/db prisma:studio
```

### Clean
```bash
# Clean all build artifacts
pnpm clean
```

---

## 📦 Contracts Status

### ✅ Implemented Contracts

#### Enums
- `GameType` — ASA | ASE (CRITICAL: enforced everywhere)
- `JobStatus` — Full lifecycle states
- `JobType` — All 11 standard job types
- `AgentStatus` — Agent health states
- `InstanceStatus` — Instance runtime states

#### DTOs
- **Agent**: Registration, Capabilities, Response, Config, Heartbeat, ResourceUsage
- **Instance**: Create, Response, Update, List (with gameType enforcement)
- **Job**: Create, Response, Progress, Poll Response, Assignment, Complete
- **Host**: Create, Response
- **Cluster**: Create, Response

#### WebSocket Events
- **Job Events**: `job:created`, `job:progress`, `job:completed`, `job:failed`, `job:cancelled`
- **Instance Events**: `instance:created`, `instance:updated`, `instance:status_changed`, `instance:deleted`
- **Agent Events**: `agent:registered`, `agent:heartbeat`, `agent:offline`
- **System Events**: `system:error`

All events have type-safe payloads defined.

### ⚠️ Missing Contracts (To Be Added)

#### DTOs (Future)
- **Backup DTOs**: Create, Response, List, Verify, Restore
- **Mod DTOs**: Sync, List, Install, Remove
- **Settings DTOs**: Get, Set, Validate, Schema
- **Auth DTOs**: Login, Token Refresh, User Profile
- **RBAC DTOs**: Roles, Permissions, Assignments

#### API Endpoints (Future)
- OpenAPI/Swagger spec generation from contracts
- Endpoint path constants
- Request/Response validation schemas

#### Additional Enums (Future)
- Backup status
- Mod status
- User roles
- Permission types

---

## 🔒 Policy Decisions Made

### 1. Contract-First Architecture
- **Decision**: All DTOs, enums, and WS events live in `packages/contracts`
- **Enforcement**: No app may invent shapes ad-hoc
- **Process**: Changes require LEAD approval via `docs/change_requests.md`

### 2. Game Type Guardrails
- **Decision**: Every instance MUST specify `gameType = ASA | ASE`
- **Enforcement**: 
  - Enum defined in contracts
  - Prisma schema includes `gameType` field
  - DTOs require `gameType` field
- **Rule**: No shared paths, configs, or defaults between ASA and ASE

### 3. Job Transport (V1 — LOCKED)
- **Decision**: Agent polls control plane via HTTP (not push)
- **Decision**: Agent reports progress via HTTP
- **Decision**: UI receives updates via WebSocket ONLY
- **Status**: Protocol defined in `docs/jobs_protocol.md`, contracts reflect this

### 4. Monorepo Structure
- **Decision**: pnpm workspaces
- **Decision**: TypeScript project references (composite: true in packages)
- **Decision**: Shared ESLint/Prettier configs at root
- **Decision**: Each package/app has own tsconfig extending base

### 5. Database Schema
- **Decision**: Prisma as ORM
- **Decision**: PostgreSQL as database
- **Decision**: Schema enforces relationships and constraints
- **Status**: Initial schema created, migrations TBD

### 6. File Ownership Rules
- **Decision**: Only LEAD edits `packages/contracts/**` and `packages/db/**`
- **Process**: Agents must propose changes via `docs/change_requests.md`
- **Enforcement**: Code review required for contract/schema changes

---

## 🚧 Next Steps for Other Agents

### Agent A (Control Plane)
1. Set up NestJS with Fastify adapter
2. Implement HTTP endpoints using contracts DTOs
3. Implement WebSocket gateway for UI events
4. Set up Prisma client from `@ark-asa/db`
5. Implement job queue (BullMQ + Redis)
6. **DO NOT** edit contracts directly — propose changes via change requests

### Agent B (Windows Agent)
1. Implement agent registration using `AgentRegistrationDto`
2. Implement job polling using `JobPollResponseDto`
3. Implement progress reporting using `JobProgressDto`
4. Implement job execution logic (idempotent, retryable)
5. **DO NOT** edit contracts directly — propose changes via change requests

### Agent C (Settings Engine)
1. Propose settings DTOs via change request
2. Implement settings registry
3. Implement INI parsing/preservation
4. **DO NOT** edit contracts directly — propose changes via change requests

### Agent D (Avalonia UI)
1. Set up Avalonia project structure
2. Implement WebSocket client for events
3. Implement UI using contracts types (via codegen or shared types)
4. **DO NOT** edit contracts directly — propose changes via change requests

---

## ⚠️ Important Notes

1. **Contracts are the single source of truth** — all apps must import from `@ark-asa/contracts`
2. **GameType enforcement** — every instance creation must specify ASA or ASE
3. **Job idempotency** — all jobs must be safe to retry (enforced by protocol)
4. **No ad-hoc shapes** — if you need a new DTO/enum, create a change request
5. **Build order** — contracts must build before other packages (pnpm handles this)

---

## 🧪 Testing Status

- ❌ Unit tests not yet implemented
- ❌ Integration tests not yet implemented
- ✅ Type checking configured
- ✅ Linting configured

**Recommendation**: Agents should add tests as they implement features.

---

## 📝 Change Request Process

If you need to modify contracts or database schema:

1. Create/edit `ai-taskboards/docs/change_requests.md`
2. Describe what needs to change and why
3. Wait for LEAD approval
4. LEAD will update contracts/schema
5. LEAD will fix downstream compilation errors
6. Merge when ready

**DO NOT** edit `packages/contracts/**` or `packages/db/**` directly.

---

## ✅ Verification Checklist

Before starting work, verify:

- [ ] `pnpm install` completes successfully
- [ ] `pnpm build` completes successfully
- [ ] `pnpm lint` passes (or has only expected warnings)
- [ ] `pnpm typecheck` passes
- [ ] Contracts package exports are accessible
- [ ] Database schema is valid (run `prisma:generate`)

---

**Status**: ✅ First milestone complete — ready for agent handoff

**Last Updated**: 2024-01-XX (Integration Lead)

