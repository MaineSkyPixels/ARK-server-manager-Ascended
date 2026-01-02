# ARK ASA Agent Runtime

Windows Agent Runtime for ARK Survival Ascended Server Manager.

## Overview

This agent runs on Windows 10+ and Windows Server 2019+ and executes jobs from the control plane, including:
- Process control (start/stop/restart ASA servers)
- SteamCMD installs/updates
- Content caching and deployment
- Backups and restores
- Telemetry and log streaming

## First Milestone Status

✅ **Completed:**
- Agent skeleton with config loader (paths rooted at `D:\Ark ASA ASM\runtime`)
- Registration and heartbeat system
- HTTP job polling loop
- HTTP progress reporting

## How to Run Agent Locally

### Prerequisites

- Node.js 18+ (built-in `fetch` support required)
- pnpm 8+
- Control plane running and accessible

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Build the agent:
```bash
pnpm build
```

### Running

**Development mode:**
```bash
pnpm start:dev
```

**Production mode:**
```bash
pnpm build
pnpm start
```

### Configuration

The agent loads configuration from:
1. Environment variables (highest priority)
2. `D:\Ark ASA ASM\runtime\agent\config.json` (if exists)
3. Default values

**Environment Variables:**
- `AGENT_ID` - Unique agent identifier (auto-generated if not set)
- `CONTROL_PLANE_URL` - Control plane API URL (default: `http://localhost:3000`)
- `POLL_INTERVAL_SECONDS` - Job polling interval (default: 5)
- `HEARTBEAT_INTERVAL_SECONDS` - Heartbeat interval (default: 30)
- `MAX_RETRIES` - Maximum retry attempts (default: 3)
- `MAX_CONCURRENT_JOBS` - Maximum concurrent jobs (default: 5)

**Config File Example:**
```json
{
  "agentId": "agent-hostname-1234567890",
  "version": "0.1.0",
  "controlPlaneUrl": "http://localhost:3000",
  "runtimeRoot": "D:\\Ark ASA ASM\\runtime",
  "pollIntervalSeconds": 5,
  "heartbeatIntervalSeconds": 30,
  "maxRetries": 3,
  "maxConcurrentJobs": 5,
  "supportedGameTypes": ["ASA"]
}
```

### Runtime Directory Structure

The agent creates and uses the following directory structure under `D:\Ark ASA ASM\runtime`:

```
runtime/
├── agent/          # Agent state and config
├── cache/          # Immutable shared content
│   ├── server_builds/ASA/
│   └── mods/
├── instances/      # Per-server working directories
├── backups/        # Time-based backups
├── logs/           # Agent, job, instance logs
│   ├── agent.log
│   ├── jobs/
│   └── instances/
└── temp/           # Job staging and scratch space
```

## Jobs Supported So Far

**Current Status:** Job executor skeleton is implemented with placeholder logic.

**Job Types Defined (from contracts):**
- `INSTALL_SERVER` - Install ASA server via SteamCMD
- `UPDATE_SERVER` - Update ASA server via SteamCMD
- `START_INSTANCE` - Start a server instance
- `STOP_INSTANCE` - Stop a server instance
- `RESTART_INSTANCE` - Restart a server instance
- `BACKUP_INSTANCE` - Create a backup of an instance
- `VERIFY_BACKUP` - Verify backup integrity
- `RESTORE_BACKUP` - Restore from backup
- `PRUNE_BACKUPS` - Clean up old backups
- `SYNC_MODS` - Synchronize mods
- `ACTIVATE_BUILD` - Activate a cached server build

**Implementation Status:**
- ✅ Job polling and assignment
- ✅ Progress reporting infrastructure
- ✅ Completion reporting infrastructure
- ✅ Process control jobs (START_INSTANCE, STOP_INSTANCE, RESTART_INSTANCE)
- ✅ SteamCMD jobs (INSTALL_SERVER, UPDATE_SERVER, ACTIVATE_BUILD)
- ⏳ Backup and mod jobs (placeholder - will throw "not implemented" error)

## Assumptions About Endpoints

The agent assumes the following control plane endpoints exist:

1. **POST /agents/register**
   - Already implemented ✅
   - Registers agent with control plane

2. **POST /agents/heartbeat**
   - Already implemented ✅
   - Sends periodic heartbeat

3. **GET /jobs/poll?agentId={agentId}**
   - **NOT YET IMPLEMENTED** ⚠️
   - See Change Request CR-001 in `ai-taskboards/docs/change_requests.md`

4. **POST /jobs/progress**
   - **NOT YET IMPLEMENTED** ⚠️
   - See Change Request CR-001 in `ai-taskboards/docs/change_requests.md`

5. **POST /jobs/complete**
   - **NOT YET IMPLEMENTED** ⚠️
   - See Change Request CR-001 in `ai-taskboards/docs/change_requests.md`

## Architecture

### Components

1. **Config Loader** (`src/config/config.ts`)
   - Loads configuration from file and environment
   - Detects hardlink support
   - Ensures runtime directories exist

2. **Control Plane Client** (`src/api/client.ts`)
   - HTTP client for control plane communication
   - Handles registration, heartbeat, job polling, progress reporting

3. **Registration Manager** (`src/agent/registration.ts`)
   - Handles agent registration
   - Manages heartbeat loop
   - Tracks active jobs for heartbeat

4. **Job Poller** (`src/jobs/poller.ts`)
   - Polls control plane for assigned jobs
   - Submits jobs to executor

5. **Job Executor** (`src/jobs/executor.ts`)
   - Manages job execution lifecycle
   - Reports progress and completion
   - Enforces concurrency limits

### Flow

1. Agent starts and loads configuration
2. Agent registers with control plane
3. Agent starts heartbeat loop (every 30s by default)
4. Agent starts job polling loop (every 5s by default)
5. When jobs are received, executor runs them
6. Progress and completion are reported back to control plane

## Next Steps

1. **Wait for Control Plane Endpoints** (CR-001)
   - Job polling and progress endpoints must be implemented

2. **Implement Job Handlers**
   - Process control (start/stop/restart)
   - SteamCMD integration
   - Backup/restore logic
   - Mod synchronization

3. **Add Telemetry**
   - CPU/RAM per process
   - Disk space monitoring
   - IO throughput estimation

4. **Add Logging**
   - Structured logging to files
   - Job-specific log files
   - Log rotation

## Troubleshooting

**Agent fails to register:**
- Check control plane is running and accessible
- Verify `CONTROL_PLANE_URL` environment variable or config file
- Check network connectivity

**No jobs received:**
- Verify job polling endpoints are implemented (CR-001)
- Check agent ID matches control plane records
- Verify jobs are assigned to this agent in control plane

**Heartbeat failures:**
- Agent will attempt re-registration if not found
- Check control plane logs for errors

## Development

### Type Checking
```bash
pnpm typecheck
```

### Linting
```bash
pnpm lint
```

### Building
```bash
pnpm build
```

