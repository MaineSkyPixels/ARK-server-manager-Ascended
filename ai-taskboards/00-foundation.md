# FOUNDATION — ARK ASA Server Manager

## Purpose
This document defines **global rules, constraints, and invariants**.
All agents MUST comply with this document.

---

## Tech Stack (Locked)
- Backend: TypeScript + NestJS (Fastify adapter)
- DB: PostgreSQL + Prisma
- Queue: Redis + BullMQ
- Desktop UI: Avalonia
- Runtime: Windows 10+ / Windows Server 2019+
- Game focus: **ARK Survival Ascended (ASA)**

---

## Non-Negotiable Rules

### 1. Game Guardrails
- Every server instance MUST explicitly specify:
  - `gameType = ASA | ASE`
- ASA is supported.
- ASE exists only as a stub adapter.
- No shared paths, configs, or defaults between ASA and ASE.

### 2. Contract-First Development
- All APIs, DTOs, events live in:
  - `packages/contracts`
- No agent may invent endpoints or payloads ad-hoc.
- If something is missing → update contracts first.

### 3. Control Plane vs Execution Plane
- Control Plane (NestJS):
  - orchestration, validation, persistence
  - NEVER performs heavy IO
- Agent Runtime:
  - process control
  - file operations
  - backups, updates, mods

### 4. Jobs Are Idempotent
- Any job must be safe to retry.
- Partial execution must not corrupt state.

### 5. Settings Are Data
- Unknown INI keys must survive round-trip.
- No hard-coding ASA settings into UI or logic.

---

## Required Modules (High Level)
- Auth / RBAC
- Clusters / Hosts / Agents
- Server Instances
- Job Scheduler
- Backup Catalog
- Settings Registry
- Artifact Cache Index
- Telemetry + Logs
- Audit Trail

---

## Directory Structure (Authoritative)
```text
apps/
  control-plane/
  agent/
  desktop-ui/

packages/
  contracts/
  db/
  common/
