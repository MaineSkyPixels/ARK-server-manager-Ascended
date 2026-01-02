# Agent B - SteamCMD Implementation Handoff

## 📋 Files Changed

### Created Files
1. `src/runtime/steamcmd.ts` - SteamCMD manager (installation/update execution)
2. `src/runtime/build-activator.ts` - Build activation with hardlinks/copy
3. `src/jobs/handlers/steamcmd.ts` - SteamCMD job handlers
4. `CYCLE_HANDOFF_STEAMCMD.md` - This file

### Modified Files
1. `src/jobs/executor.ts` - Added routing to SteamCMD handlers and ACTIVATE_BUILD

## 🚀 How to Run Agent Locally

Same as previous cycle - no changes to runtime requirements.

```bash
cd apps/agent
pnpm install
pnpm build
pnpm start:dev
```

## ✅ Supported Job Types

### Fully Implemented (6/11)

**Process Control (from previous cycle):**
1. **START_INSTANCE** ✅
2. **STOP_INSTANCE** ✅
3. **RESTART_INSTANCE** ✅

**SteamCMD (new this cycle):**
4. **INSTALL_SERVER** ✅
   - Installs ASA/ASE server via SteamCMD
   - Stages to temp, validates, moves to cache
   - **Idempotent:** Returns success if already installed

5. **UPDATE_SERVER** ✅
   - Updates server via SteamCMD
   - Stages update, validates, moves to cache
   - **Idempotent:** Returns success if already at target build

6. **ACTIVATE_BUILD** ✅
   - Activates cached build for an instance
   - Uses hardlinks when supported, falls back to copy
   - Creates `active/ShooterGame/` directory in instance

### Not Yet Implemented (5/11)

- `BACKUP_INSTANCE` - Will throw "not implemented" error
- `VERIFY_BACKUP` - Will throw "not implemented" error
- `RESTORE_BACKUP` - Will throw "not implemented" error
- `PRUNE_BACKUPS` - Will throw "not implemented" error
- `SYNC_MODS` - Will throw "not implemented" error

## 📝 Job Parameters

### INSTALL_SERVER Parameters

```typescript
{
  gameType?: string;          // 'ASA' or 'ASE' (default: 'ASA')
  appId?: number;             // Steam App ID (ASA: 2430930, ASE: 346110)
  buildId?: string;           // Build identifier (auto-generated if not provided)
  beta?: string;              // Beta branch name (optional)
  betaPassword?: string;      // Beta password (optional)
}
```

### UPDATE_SERVER Parameters

```typescript
{
  gameType?: string;          // 'ASA' or 'ASE' (default: 'ASA')
  appId?: number;             // Steam App ID
  currentBuildId?: string;    // Current build ID (for idempotency check)
  beta?: string;              // Beta branch name (optional)
  betaPassword?: string;      // Beta password (optional)
}
```

### ACTIVATE_BUILD Parameters

```typescript
{
  buildId: string;            // Required - Build ID to activate
  instanceId: string;         // Required - Instance ID (from job)
  gameType?: string;          // 'ASA' or 'ASE' (default: 'ASA')
}
```

## 🏗️ Architecture

### SteamCMD Manager

- Finds SteamCMD executable (checks common paths)
- Executes SteamCMD commands with timeout (30 minutes)
- Validates installation after completion
- Generates build ID fingerprint

### Build Activator

- Activates cached builds for instances
- Uses hardlinks when filesystem supports it
- Falls back to file copy if hardlinks unavailable
- Atomic activation (removes old, creates new)

### SteamCMD Handler

- Routes INSTALL_SERVER and UPDATE_SERVER jobs
- Stages operations in temp directory
- Validates before moving to cache
- Ensures idempotency

## 📁 File Structure

```
apps/agent/src/
├── runtime/
│   ├── process-manager.ts      # Process lifecycle (existing)
│   ├── steamcmd.ts             # SteamCMD execution (new)
│   └── build-activator.ts      # Build activation (new)
├── jobs/
│   ├── executor.ts             # Job executor (updated)
│   └── handlers/
│       ├── process-control.ts  # Process control (existing)
│       └── steamcmd.ts         # SteamCMD handlers (new)
```

## ⚠️ Known Limitations

1. **SteamCMD Auto-Download:** SteamCMD must be manually installed - auto-download not implemented
2. **Build ID Fingerprinting:** Uses file stats instead of actual Steam build ID
3. **Beta Branches:** Supported but not extensively tested
4. **Large Downloads:** 30-minute timeout may not be enough for slow connections
5. **Disk Space:** No pre-flight disk space checks

## 🐛 Known Failure Modes

### 1. SteamCMD Not Found
- **Error:** "SteamCMD not found"
- **Cause:** SteamCMD not installed in expected locations
- **Recovery:** Install SteamCMD to one of:
  - `D:\Ark ASA ASM\runtime\steamcmd\steamcmd.exe`
  - `C:\steamcmd\steamcmd.exe`
  - Or set `STEAMCMD_PATH` environment variable

### 2. Installation Timeout
- **Error:** "SteamCMD installation failed: timeout"
- **Cause:** Download took longer than 30 minutes
- **Recovery:** Retry job (idempotent - will resume)

### 3. Validation Failure
- **Error:** "Installation validation failed"
- **Cause:** Required files missing after SteamCMD completion
- **Recovery:** Check SteamCMD logs, retry installation

### 4. Cache Directory Full
- **Error:** "ENOSPC: no space left on device"
- **Cause:** Disk full
- **Recovery:** Free disk space, retry job

### 5. Build Already Installed (INSTALL_SERVER)
- **Behavior:** Returns success immediately (idempotent)
- **Recovery:** No action needed - build is ready

### 6. Build Already Updated (UPDATE_SERVER)
- **Behavior:** Returns success if already at target build (idempotent)
- **Recovery:** No action needed

### 7. Hardlink Failure
- **Behavior:** Falls back to file copy automatically
- **Impact:** Slower activation, uses more disk space
- **Recovery:** Automatic - no action needed

## ✅ Idempotency Guarantees

All SteamCMD jobs are idempotent:

- **INSTALL_SERVER:** If build already in cache, returns success immediately
- **UPDATE_SERVER:** If already at target build, returns success immediately
- **ACTIVATE_BUILD:** Safe to retry - replaces existing activation atomically

## 🔄 Workflow Example

### Installing and Starting a Server

1. **INSTALL_SERVER** job:
   - Downloads server files via SteamCMD
   - Stages in temp directory
   - Validates installation
   - Moves to cache: `runtime/cache/server_builds/ASA/<buildId>/ShooterGame/`

2. **ACTIVATE_BUILD** job:
   - Creates hardlinks from cache to instance: `runtime/instances/<instanceId>/active/ShooterGame/`
   - Atomic operation (removes old, creates new)

3. **START_INSTANCE** job:
   - Starts server from `active/ShooterGame/` directory
   - Process runs and logs to `runtime/logs/instances/<instanceId>.log`

## 📊 Progress Summary

**Completed:**
- ✅ Agent skeleton and infrastructure
- ✅ Registration and heartbeat
- ✅ Job polling and progress reporting
- ✅ Process control handlers (3 job types)
- ✅ SteamCMD handlers (3 job types)

**Remaining:**
- ⏳ Backup system (BACKUP_INSTANCE, VERIFY_BACKUP, RESTORE_BACKUP, PRUNE_BACKUPS)
- ⏳ Mod synchronization (SYNC_MODS)
- ⏳ Enhanced logging and telemetry
- ⏳ Unit and integration tests

## 🎯 Next Development Cycle

**Recommended Next Steps:**
1. Implement BACKUP_INSTANCE handler (backup system foundation)
2. Implement VERIFY_BACKUP and RESTORE_BACKUP handlers
3. Add disk space pre-flight checks
4. Enhance build ID tracking (use actual Steam build IDs)
5. Add unit tests for SteamCMD manager

---

**Status:** SteamCMD jobs ready for testing  
**Last Updated:** 2024-01-XX

