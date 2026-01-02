# Agent B - Process Control Implementation Handoff

## ✅ Completed Tasks

### Process Control Job Handlers
- ✅ `START_INSTANCE` - Start ASA server instance
- ✅ `STOP_INSTANCE` - Stop ASA server instance  
- ✅ `RESTART_INSTANCE` - Restart ASA server instance

### Components Created

**New Files:**
- `src/runtime/process-manager.ts` - Windows process management
  - Process lifecycle (start, stop, status)
  - PID tracking and persistence
  - Process state management
  - Log file redirection

- `src/jobs/handlers/process-control.ts` - Process control job handlers
  - START_INSTANCE handler
  - STOP_INSTANCE handler
  - RESTART_INSTANCE handler
  - Idempotent operations (safe to retry)

**Modified Files:**
- `src/jobs/executor.ts` - Updated to route process control jobs to handlers

## 📋 How to Run Agent Locally

### Prerequisites
- Node.js 18+ (for built-in `fetch`)
- pnpm 8+
- Control plane running
- Windows 10+ or Windows Server 2019+

### Steps

1. **Install dependencies:**
   ```bash
   cd apps/agent
   pnpm install
   ```

2. **Build:**
   ```bash
   pnpm build
   ```

3. **Run (development):**
   ```bash
   pnpm start:dev
   ```

4. **Run (production):**
   ```bash
   pnpm start
   ```

## 🔧 Supported Job Types

### ✅ Fully Implemented

1. **START_INSTANCE**
   - Starts an ASA server instance
   - Validates instance directory and executable exist
   - Builds command-line arguments from job parameters
   - Tracks process PID
   - Redirects stdout/stderr to instance log file
   - **Idempotent:** Returns success if already running

2. **STOP_INSTANCE**
   - Stops a running ASA server instance
   - Uses Windows `taskkill` for graceful shutdown
   - Configurable timeout (default: 30 seconds)
   - **Idempotent:** Returns success if already stopped

3. **RESTART_INSTANCE**
   - Stops instance (if running), then starts it
   - Handles partial failures gracefully
   - **Idempotent:** Safe to retry

### ⏳ Not Yet Implemented

- `INSTALL_SERVER` - SteamCMD server installation
- `UPDATE_SERVER` - SteamCMD server update
- `BACKUP_INSTANCE` - Create instance backup
- `VERIFY_BACKUP` - Verify backup integrity
- `RESTORE_BACKUP` - Restore from backup
- `PRUNE_BACKUPS` - Clean up old backups
- `SYNC_MODS` - Synchronize mods
- `ACTIVATE_BUILD` - Activate cached server build

## 📝 Job Parameters

### START_INSTANCE Parameters

```typescript
{
  gameType?: string;          // 'ASA' or 'ASE' (default: 'ASA')
  port?: number;              // Server port
  queryPort?: number;         // Query port
  serverPassword?: string;    // Server password
  adminPassword?: string;     // Admin password
  map?: string;               // Map name
  additionalArgs?: string[];  // Additional command-line arguments
}
```

### STOP_INSTANCE Parameters

```typescript
{
  timeoutMs?: number;         // Timeout before force kill (default: 30000)
}
```

### RESTART_INSTANCE Parameters

Same as START_INSTANCE + STOP_INSTANCE combined.

## 🏗️ Architecture

### Process Manager

The `ProcessManager` class handles:
- Process lifecycle management
- PID tracking and persistence (saved to `runtime/agent/processes.json`)
- Process status checking
- Log file redirection (stdout/stderr → `runtime/logs/instances/{instanceId}.log`)

### Process Control Handler

The `ProcessControlHandler` class:
- Routes job types to appropriate handlers
- Validates instance configuration
- Builds command-line arguments
- Reports progress at key milestones
- Ensures idempotency

### Job Executor Integration

The `JobExecutor` routes jobs:
- Process control jobs → `ProcessControlHandler`
- Other jobs → Placeholder (throws "not implemented" error)

## 📁 File Structure

```
apps/agent/src/
├── runtime/
│   └── process-manager.ts      # Process lifecycle management
├── jobs/
│   ├── executor.ts             # Job executor (updated)
│   └── handlers/
│       └── process-control.ts  # Process control handlers
```

## 🔍 Process State Management

Process information is persisted to:
- **File:** `D:\Ark ASA ASM\runtime\agent\processes.json`
- **Format:** JSON with instanceId → ProcessInfo mapping
- **Fields:** pid, instanceId, commandLine, startedAt

Process state is checked on:
- Agent startup (loads from disk)
- Job execution (validates process exists)
- Process exit (cleans up state)

## ⚠️ Known Limitations

1. **Exit Code Tracking:** Exit codes are not currently tracked after process exit
2. **Graceful Shutdown:** Uses `taskkill /F` (force kill) - no graceful shutdown signal
3. **Process Tree:** Kills process tree but doesn't handle child processes separately
4. **Log Rotation:** Log files are appended but not rotated (can grow large)
5. **Error Recovery:** Basic error handling - could be enhanced with retry logic

## 🐛 Known Failure Modes

1. **Executable Not Found**
   - **Cause:** Instance not installed or `active/` directory missing
   - **Error:** "Executable not found: {path}"
   - **Recovery:** Run INSTALL_SERVER job first

2. **Process Already Running**
   - **Cause:** Instance already started (possibly from previous run)
   - **Behavior:** START_INSTANCE returns success with existing PID (idempotent)
   - **Recovery:** Use STOP_INSTANCE first if needed

3. **Process Not Running**
   - **Cause:** Instance not started or crashed
   - **Behavior:** STOP_INSTANCE returns success (idempotent)
   - **Recovery:** Check logs for crash reason

4. **Taskkill Failure**
   - **Cause:** Process already dead or permissions issue
   - **Error:** "Failed to stop instance"
   - **Recovery:** Process state is cleaned up automatically

5. **Instance Directory Missing**
   - **Cause:** Instance not created in control plane
   - **Error:** "Instance directory not found"
   - **Recovery:** Create instance in control plane first

## ✅ Idempotency Guarantees

All process control jobs are idempotent:

- **START_INSTANCE:** If already running, returns success with existing PID
- **STOP_INSTANCE:** If not running, returns success immediately
- **RESTART_INSTANCE:** Handles partial failures (stop succeeds, start fails) safely

## 🔄 Next Steps

1. **SteamCMD Integration**
   - Implement INSTALL_SERVER handler
   - Implement UPDATE_SERVER handler
   - Stage downloads in cache before activation

2. **Backup System**
   - Implement BACKUP_INSTANCE handler
   - Create backup manifests with file hashes
   - Implement VERIFY_BACKUP and RESTORE_BACKUP

3. **Logging Enhancement**
   - Add structured logging
   - Implement log rotation
   - Add job-specific log files

4. **Error Handling**
   - Add retry logic for transient failures
   - Better error messages
   - Crash detection and recovery

5. **Testing**
   - Unit tests for ProcessManager
   - Integration tests for job handlers
   - End-to-end tests with real instances

## 📚 Additional Notes

- Process manager uses Windows `taskkill` command for stopping processes
- Log files are written to `runtime/logs/instances/{instanceId}.log`
- Process info is persisted to survive agent restarts
- Command-line arguments are built from job parameters
- All operations follow STORAGE_LAYOUT.md conventions

## 🎯 Success Criteria Met

✅ Process control handlers implemented  
✅ Idempotent operations  
✅ Progress reporting at key milestones  
✅ Process state persistence  
✅ Log file redirection  
✅ Error handling and validation  

---

**Last Updated:** 2024-01-XX  
**Status:** Process control jobs ready for testing

