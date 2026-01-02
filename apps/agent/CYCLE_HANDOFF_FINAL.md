# Agent B - Development Cycle Handoff

## 📋 Files Changed

### Created Files
1. `src/runtime/steamcmd.ts` - SteamCMD manager (installation/update execution)
2. `src/runtime/build-activator.ts` - Build activation with hardlinks/copy
3. `src/jobs/handlers/steamcmd.ts` - SteamCMD job handlers
4. `CYCLE_HANDOFF_STEAMCMD.md` - Detailed SteamCMD documentation
5. `CYCLE_HANDOFF_FINAL.md` - This file

### Modified Files
1. `src/jobs/executor.ts` - Added routing to SteamCMD handlers and ACTIVATE_BUILD
2. `CYCLE_HANDOFF.md` - Updated job status
3. `README.md` - Updated implementation status

## 🚀 How to Run Agent Locally

### Prerequisites
- Node.js 18+
- pnpm 8+
- Control plane running at `http://localhost:3000` (or set `CONTROL_PLANE_URL`)
- Windows 10+ or Windows Server 2019+
- **SteamCMD installed** (see SteamCMD setup below)

### Quick Start

```bash
# Install dependencies
cd apps/agent
pnpm install

# Build
pnpm build

# Run (development mode)
pnpm start:dev

# Or run (production mode)
pnpm start
```

### SteamCMD Setup

SteamCMD must be installed before running INSTALL_SERVER or UPDATE_SERVER jobs.

**Installation Options:**
1. Download from: https://developer.valvesoftware.com/wiki/SteamCMD
2. Extract to one of these locations:
   - `D:\Ark ASA ASM\runtime\steamcmd\steamcmd.exe`
   - `C:\steamcmd\steamcmd.exe`
   - Or set `STEAMCMD_PATH` environment variable

## ✅ Supported Job Types

### Fully Implemented (6/11)

**Process Control:**
1. **START_INSTANCE** ✅ - Start ASA server instance
2. **STOP_INSTANCE** ✅ - Stop running instance
3. **RESTART_INSTANCE** ✅ - Restart instance

**SteamCMD:**
4. **INSTALL_SERVER** ✅ - Install ASA/ASE server via SteamCMD
5. **UPDATE_SERVER** ✅ - Update server via SteamCMD
6. **ACTIVATE_BUILD** ✅ - Activate cached build for instance

### Not Yet Implemented (5/11)

- `BACKUP_INSTANCE` - Will throw "not implemented" error
- `VERIFY_BACKUP` - Will throw "not implemented" error
- `RESTORE_BACKUP` - Will throw "not implemented" error
- `PRUNE_BACKUPS` - Will throw "not implemented" error
- `SYNC_MODS` - Will throw "not implemented" error

## 📝 Change Requests Created

**None** - All required endpoints and contracts are already implemented.

## ⚠️ Known Failure Modes

### SteamCMD Related

1. **SteamCMD Not Found**
   - **Error:** "SteamCMD not found"
   - **Cause:** SteamCMD not installed in expected locations
   - **Recovery:** Install SteamCMD (see setup above)

2. **Installation Timeout**
   - **Error:** "SteamCMD installation failed: timeout"
   - **Cause:** Download took longer than 30 minutes
   - **Recovery:** Retry job (idempotent - will resume)

3. **Validation Failure**
   - **Error:** "Installation validation failed"
   - **Cause:** Required files missing after SteamCMD completion
   - **Recovery:** Check SteamCMD logs, retry installation

4. **Disk Space**
   - **Error:** "ENOSPC: no space left on device"
   - **Cause:** Disk full
   - **Recovery:** Free disk space, retry job

### Process Control Related (from previous cycle)

5. **Executable Not Found**
   - **Error:** "Executable not found: {path}"
   - **Cause:** Instance not installed or `active/` directory missing
   - **Recovery:** Run INSTALL_SERVER then ACTIVATE_BUILD jobs first

6. **Instance Directory Missing**
   - **Error:** "Instance directory not found: {path}"
   - **Cause:** Instance not created in control plane
   - **Recovery:** Create instance in control plane first

### General

7. **Control Plane Unavailable**
   - **Behavior:** Registration fails, agent exits
   - **Recovery:** Ensure control plane is running and accessible

8. **Job Polling Errors**
   - **Behavior:** Errors logged, polling continues
   - **Recovery:** Check control plane logs and network connectivity

## 🔍 Testing Checklist

### SteamCMD Jobs
- [ ] INSTALL_SERVER job executes successfully
- [ ] UPDATE_SERVER job executes successfully
- [ ] ACTIVATE_BUILD job executes successfully
- [ ] INSTALL_SERVER is idempotent (returns success if already installed)
- [ ] UPDATE_SERVER is idempotent (returns success if already updated)
- [ ] Hardlinks are used when filesystem supports them
- [ ] Falls back to copy when hardlinks unavailable

### End-to-End Workflow
- [ ] INSTALL_SERVER → ACTIVATE_BUILD → START_INSTANCE workflow works
- [ ] UPDATE_SERVER → ACTIVATE_BUILD → RESTART_INSTANCE workflow works
- [ ] Builds are cached correctly in `runtime/cache/server_builds/`
- [ ] Instance `active/` directory is created correctly

### Error Handling
- [ ] INSTALL_SERVER fails gracefully if SteamCMD not found
- [ ] UPDATE_SERVER handles already-updated case
- [ ] ACTIVATE_BUILD handles missing build gracefully

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
5. Add unit tests for SteamCMD manager and BuildActivator

---

**Status:** SteamCMD jobs ready for testing  
**Last Updated:** 2024-01-XX

