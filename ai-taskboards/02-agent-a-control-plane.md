# AGENT A — CONTROL PLANE (NestJS + Prisma)

## Scope
You build the **orchestration brain**.
You NEVER touch:
- SteamCMD
- file systems
- save data

---

## Primary Deliverables

### 1. Prisma Schema
Must support:
- multiple organizations
- clusters
- hosts
- agents
- server instances
- jobs + retries
- backups (multi-year)
- settings registry
- templates
- artifacts
- audit log

---

### 2. NestJS Modules
Required modules:
- Auth + RBAC
- Hosts / Agents
- Server Instances
- Jobs (BullMQ)
- Backups
- Settings
- Telemetry
- WebSocket Gateway

---

### 3. Job Lifecycle
Jobs must support:
- queued
- running
- progress events
- failure + retry
- cancellation

---

### 4. Agent Communication
- Agent registers + heartbeats
- Jobs assigned to agents
- Progress streamed via WS

---

## Constraints
- NO blocking operations
- NO filesystem access
- NO game logic

---

## Acceptance Criteria
- Can manage 100+ instances in DB
- Can dispatch jobs to multiple agents
- UI receives live progress updates
