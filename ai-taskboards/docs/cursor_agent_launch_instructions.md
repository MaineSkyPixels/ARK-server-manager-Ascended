# CURSOR_AGENT_LAUNCH_INSTRUCTIONS — Parallel Agent Playbook

These instructions are optimized for running **2–4 Cursor agents simultaneously** on this project.

Project Root:
D:\Ark ASA ASM

---

## 0) One-Time Setup (Do This Once)

### 0.1 Ensure these files exist
D:\Ark ASA ASM\ai-taskboards\
- 00-FOUNDATION.md
- 01-INTEGRATION-LEAD.md
- 02-AGENT-A-CONTROL-PLANE.md
- 03-AGENT-B-WINDOWS-AGENT.md
- 04-AGENT-C-SETTINGS-ENGINE.md
- 05-AGENT-D-AVALONIA-UI.md

D:\Ark ASA ASM\ai-taskboards\docs\
- CONTRIBUTING_AI.md
- JOBS_PROTOCOL.md
- STORAGE_LAYOUT.md
- CHANGE_REQUESTS.md
- CURSOR_AGENT_LAUNCH_INSTRUCTIONS.md (this file)

If any are missing, create them before launching agents.

---

## 1) Critical Rules (Read Before Launch)

### 1.1 File ownership is enforced
- Agents must follow ai-taskboards/docs/CONTRIBUTING_AI.md
- Cross-boundary changes MUST be proposed in ai-taskboards/docs/CHANGE_REQUESTS.md

### 1.2 Job transport is locked (v1)
- Agent polls control plane via HTTP for assigned jobs
- Agent posts progress via HTTP
- UI receives updates via WebSocket only

Reference: ai-taskboards/docs/JOBS_PROTOCOL.md

### 1.3 Storage layout is locked
Reference: ai-taskboards/docs/STORAGE_LAYOUT.md

---

## 2) Launch Strategy (Recommended)

### Option A (3 agents, fast + safe)
- LEAD
- Agent A (control plane)
- Agent B (windows agent)
- Agent C (settings engine)
(UI starts after contracts stabilize)

### Option B (4 agents, fastest)
- LEAD
- Agent A
- Agent B
- Agent C
- Agent D (Avalonia UI) starts after contracts exist

Redis is allowed. Avalonia is the UI framework.

---

## 3) How to Launch Each Agent in Cursor

For EACH agent, do the following:

### 3.1 Open only the relevant files (context control)
Before starting the agent, open these files in the editor so Cursor has context.

### 3.2 Paste the agent’s System Prompt
Use the system prompt you generated for that role.

### 3.3 Assign the agent a “First Milestone”
Agents perform best with a clear first milestone and hard boundaries.

### 3.4 Require a “handoff bundle”
Before the agent stops, require:
- list of files changed
- how to run/test
- any Change Requests created
- any TODOs and risks

---

## 4) Agent-Specific Launch Packs

Each pack includes:
- REQUIRED context files to open
- OPTIONAL extra context files
- First milestone suggestions
- Handoff checklist

---

# 4.1 LEAD — Integration Lead

## Open these files (required)
- ai-taskboards/00-FOUNDATION.md
- ai-taskboards/01-INTEGRATION-LEAD.md
- ai-taskboards/docs/CONTRIBUTING_AI.md
- ai-taskboards/docs/JOBS_PROTOCOL.md
- ai-taskboards/docs/STORAGE_LAYOUT.md
- ai-taskboards/docs/CHANGE_REQUESTS.md

## Optional context
- any open PR diffs / agent output files

## First milestone
- Scaffold repo structure:
  - apps/control-plane
  - apps/agent
  - apps/desktop-ui
  - packages/contracts
  - packages/db
  - packages/common
- Configure pnpm, eslint, prettier, tsconfigs
- Create initial packages/contracts skeleton:
  - enums + DTO stubs + WS event names

## Handoff checklist
- Commands to build/lint/test
- What contracts exist and what’s still missing
- Any policy decisions made

---

# 4.2 Agent A — Control Plane (NestJS + Prisma)

## Open these files (required)
- ai-taskboards/00-FOUNDATION.md
- ai-taskboards/02-AGENT-A-CONTROL-PLANE.md
- ai-taskboards/docs/CONTRIBUTING_AI.md
- ai-taskboards/docs/JOBS_PROTOCOL.md

## Optional context
- packages/contracts/** (read-only unless LEAD asks)
- packages/db/** (read-only unless LEAD asks)

## First milestone
- Create NestJS app (Fastify adapter)
- Add Swagger
- Add modules skeleton:
  - agents/hosts
  - instances
  - jobs
- Implement:
  - POST /agents/register
  - POST /agents/heartbeat
  - basic health endpoint

## Handoff checklist
- Endpoints implemented and tested
- Notes on missing contract fields (create Change Requests if needed)
- Run instructions

---

# 4.3 Agent B — Windows Agent Runtime

## Open these files (required)
- ai-taskboards/00-FOUNDATION.md
- ai-taskboards/03-AGENT-B-WINDOWS-AGENT.md
- ai-taskboards/docs/CONTRIBUTING_AI.md
- ai-taskboards/docs/JOBS_PROTOCOL.md
- ai-taskboards/docs/STORAGE_LAYOUT.md

## Optional context
- packages/contracts/** (read-only unless LEAD asks)

## First milestone
- Build agent skeleton:
  - config loader (paths rooted at D:\Ark ASA ASM\runtime)
  - registration + heartbeat
- Implement job polling loop (HTTP)
- Implement progress reporting (HTTP)

## Handoff checklist
- How to run agent locally
- What jobs are supported so far
- Any assumptions made about endpoints (create Change Requests if missing)

---

# 4.4 Agent C — Settings / INI / Templates Engine

## Open these files (required)
- ai-taskboards/00-FOUNDATION.md
- ai-taskboards/04-AGENT-C-SETTINGS-ENGINE.md
- ai-taskboards/docs/CONTRIBUTING_AI.md
- ai-taskboards/docs/JOBS_PROTOCOL.md

## Optional context
- packages/contracts/** (read-only)
- apps/control-plane/** (read-only for endpoint assumptions)

## First milestone
- Implement INI parser + stable renderer in packages/common/ini
- Unit tests:
  - round-trip stable output
  - unknown key preservation
- Create minimal data structures to represent:
  - registry-known keys
  - raw/unclassified keys

## Handoff checklist
- Test instructions
- Example INI inputs/outputs
- Any contract additions requested (Change Requests)

---

# 4.5 Agent D — Avalonia UI

## Open these files (required)
- ai-taskboards/00-FOUNDATION.md
- ai-taskboards/05-AGENT-D-AVALONIA-UI.md
- ai-taskboards/docs/CONTRIBUTING_AI.md
- ai-taskboards/docs/JOBS_PROTOCOL.md

## Optional context
- packages/contracts/** (read-only)
- any OpenAPI/Swagger docs from control-plane

## First milestone
- Create Avalonia app shell:
  - left nav
  - main content region
- Add pages:
  - Instances list
  - Instance detail (tabs: Overview, Logs, Jobs)
- Implement API client scaffolding:
  - typed client from packages/contracts types (manual at first is OK)
- Add WS client scaffolding (reconnect, status indicator)

## Handoff checklist
- How to run UI
- What endpoints it expects
- Any missing API shapes (Change Requests)

---

## 5) Operating Procedure for Multi-Agent Sessions

### 5.1 Daily / per-session flow
1. LEAD merges contracts + structure first
2. Agents A/B/C/D build against the contracts
3. Agents submit Change Requests instead of editing contracts/db directly
4. LEAD approves & merges change requests
5. Agents update their code to match

### 5.2 Preventing divergence
- If an agent needs an API shape: Change Request
- If an agent needs a DB field: Change Request
- If an agent needs a path change: Change Request

### 5.3 Merge order
1. packages/contracts + packages/db (LEAD)
2. apps/control-plane (A)
3. apps/agent (B)
4. packages/common/settings|ini|templates (C)
5. apps/desktop-ui (D)

---

## 6) Required Handoff Bundle (All Agents)

When an agent stops work, it MUST provide:

- Files changed (list)
- New commands/scripts added (list)
- How to run tests
- Any Change Requests created (IDs)
- Known issues / TODOs
- Risks or assumptions

This reduces integration time dramatically.
