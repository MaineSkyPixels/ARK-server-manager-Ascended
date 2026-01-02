# Agent B (Windows Agent) - Implementation Guidance

## Overview
This document provides implementation guidance for Agent B based on code review recommendations and architectural requirements.

## Priority 1: Job Handler Implementation

### Current Status
- ✅ Job executor skeleton exists (`apps/agent/src/jobs/executor.ts`)
- ✅ API client implemented (`apps/agent/src/api/client.ts`)
- ❌ Job handlers are stubs (INSTANCE_START, INSTANCE_STOP, INSTANCE_RESTART, BACKUP_CREATE, BACKUP_RESTORE)

### Required Implementation

#### 1. INSTANCE_START Handler
**Location**: `apps/agent/src/jobs/handlers/instance-start.handler.ts`

**Requirements**:
- Validate instance exists and is STOPPED
- Check if game server process is already running (prevent duplicates)
- Use SteamCMD to ensure server files are up-to-date
- Launch ARK server process with correct parameters:
  - Port from instance config
  - Game type (ASA/ASE) determines executable path
  - INI files from `runtime/instances/{instanceId}/config/`
- Monitor process and report progress:
  - 0-30%: Downloading/updating server files
  - 30-60%: Starting server process
  - 60-90%: Waiting for server to initialize
  - 90-100%: Server ready
- Update instance status to RUNNING on success
- Handle errors gracefully (SteamCMD failures, port conflicts, etc.)

**Example Structure**:
```typescript
export class InstanceStartHandler implements JobHandler {
  async execute(job: JobAssignmentDto, reportProgress: ProgressReporter): Promise<void> {
    // 1. Validate instance
    // 2. Check for running process
    // 3. Update server files (SteamCMD)
    // 4. Start server process
    // 5. Monitor and report progress
    // 6. Update instance status
  }
}
```

#### 2. INSTANCE_STOP Handler
**Location**: `apps/agent/src/jobs/handlers/instance-stop.handler.ts`

**Requirements**:
- Find running server process (by instanceId or port)
- Send graceful shutdown command (RCON if available, otherwise SIGTERM)
- Wait for process to terminate (with timeout)
- Force kill if necessary (SIGKILL after timeout)
- Update instance status to STOPPED
- Report progress: 0-50% (shutting down), 50-100% (verifying stopped)

#### 3. INSTANCE_RESTART Handler
**Location**: `apps/agent/src/jobs/handlers/instance-restart.handler.ts`

**Requirements**:
- Call INSTANCE_STOP handler logic
- Wait for clean shutdown
- Call INSTANCE_START handler logic
- Report combined progress

#### 4. BACKUP_CREATE Handler
**Location**: `apps/agent/src/jobs/handlers/backup-create.handler.ts`

**Requirements**:
- Stop instance if running (or create hot backup)
- Copy instance data from `runtime/instances/{instanceId}/data/`
- Compress backup archive
- Store in `runtime/backups/{instanceId}/{timestamp}.zip`
- Create database record (via control plane API)
- Report progress: 0-40% (stopping), 40-80% (copying), 80-100% (compressing)

#### 5. BACKUP_RESTORE Handler
**Location**: `apps/agent/src/jobs/handlers/backup-restore.handler.ts`

**Requirements**:
- Stop instance if running
- Validate backup exists
- Extract backup archive
- Restore files to instance data directory
- Report progress: 0-30% (stopping), 30-70% (extracting), 70-100% (restoring)

### Implementation Notes

1. **Process Management**:
   - Use `child_process` for spawning server processes
   - Store process PIDs in `runtime/instances/{instanceId}/process.pid`
   - Implement process monitoring to detect crashes

2. **SteamCMD Integration**:
   - Use `@ark-asa/common` utilities if available
   - Cache server files in `runtime/steamcmd/apps/{appId}/`
   - Handle SteamCMD authentication and updates

3. **Error Handling**:
   - All handlers must be idempotent (safe to retry)
   - Report detailed errors via `reportCompletion` with error details
   - Clean up partial state on failure

4. **Progress Reporting**:
   - Report progress every 5-10 seconds during long operations
   - Use descriptive messages: "Downloading server files...", "Starting server process..."
   - Include percentage estimates

5. **Game Type Handling**:
   - ASA: Use `ShooterGameServer.exe` (or appropriate executable)
   - ASE: Use ASE-specific executable
   - Never mix paths or defaults

## Priority 2: Process Monitoring

### Current Status
- ❌ No process monitoring implementation

### Required Implementation

**Location**: `apps/agent/src/monitoring/process-monitor.ts`

**Requirements**:
- Monitor all running server processes
- Detect crashes and report to control plane
- Update instance status on process exit
- Restart crashed instances if auto-restart enabled
- Report resource usage (CPU, memory)

## Priority 3: Testing

### Current Status
- ❌ No unit tests for job handlers
- ❌ No integration tests

### Required Tests

1. **Unit Tests**:
   - Test each handler with mocked dependencies
   - Test error scenarios
   - Test idempotency

2. **Integration Tests**:
   - Test full job lifecycle (create -> execute -> complete)
   - Test with real SteamCMD (or mocked)
   - Test process management

## Priority 4: Configuration

### Current Status
- ⚠️ Hardcoded paths and values

### Required Changes

**Location**: `apps/agent/src/config/config.ts`

**Requirements**:
- Extract all hardcoded paths to configuration
- Support environment variables
- Validate configuration on startup
- Document all configuration options

## File Structure

```
apps/agent/src/
├── jobs/
│   ├── executor.ts (update to use handlers)
│   ├── handlers/
│   │   ├── instance-start.handler.ts (NEW)
│   │   ├── instance-stop.handler.ts (NEW)
│   │   ├── instance-restart.handler.ts (NEW)
│   │   ├── backup-create.handler.ts (NEW)
│   │   ├── backup-restore.handler.ts (NEW)
│   │   └── index.ts (export all handlers)
│   └── types.ts (JobHandler interface)
├── monitoring/
│   └── process-monitor.ts (NEW)
├── config/
│   └── config.ts (NEW or update)
└── utils/
    ├── steamcmd.ts (NEW - SteamCMD wrapper)
    └── process.ts (NEW - Process management utilities)
```

## Dependencies

Add these dependencies if needed:
- `pidusage` - Process monitoring
- `archiver` - Backup compression
- `yauzl` - Backup extraction

## Integration Points

1. **Control Plane API**:
   - Use `ApiClient` for job polling and progress reporting
   - Update instance status via API

2. **Contracts**:
   - All job types defined in `@ark-asa/contracts`
   - Use `JobType`, `JobStatus` enums

3. **Common Package**:
   - Use INI parser from `@ark-asa/common` for config files
   - Use any shared utilities

## Testing Checklist

- [ ] INSTANCE_START handler works for ASA
- [ ] INSTANCE_START handler works for ASE
- [ ] INSTANCE_STOP handler gracefully shuts down server
- [ ] INSTANCE_RESTART handler completes successfully
- [ ] BACKUP_CREATE creates valid backup archive
- [ ] BACKUP_RESTORE restores instance data correctly
- [ ] Handlers are idempotent (safe to retry)
- [ ] Errors are reported with details
- [ ] Progress is reported regularly
- [ ] Process monitoring detects crashes

## Next Steps

1. Implement INSTANCE_START handler (highest priority)
2. Implement INSTANCE_STOP handler
3. Add process monitoring
4. Implement backup handlers
5. Add comprehensive tests
6. Extract configuration

