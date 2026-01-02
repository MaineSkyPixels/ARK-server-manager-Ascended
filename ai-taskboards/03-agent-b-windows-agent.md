# AGENT B — WINDOWS AGENT RUNTIME

## Scope
You control **real servers**.
You execute jobs dispatched by control plane.

---

## Responsibilities

### 1. Agent Runtime
- Runs on Windows
- Registers with control plane
- Sends heartbeat + capabilities

---

### 2. ASA Server Process Control
- Start / stop / restart
- Crash detection
- Log capture
- PID tracking

---

### 3. SteamCMD + Updates
- Install ASA server
- Update safely via staging
- Rollback support
- No live corruption

---

### 4. Content Cache
- Server build cache
- Mod cache
- Hardlink deployment
- NVMe-optimized layout

---

### 5. Backup & Restore
- Hourly backups minimum
- Manifest + hashes
- Retention pruning
- Fast restore path

---

### 6. Telemetry
- CPU/RAM per process
- Disk IO rough stats
- Network throughput estimate

---

## Constraints
- Never invent API payloads
- Never modify DB directly
- All actions via jobs

---

## Acceptance Criteria
- Restore from corruption < 2 minutes
- 10 servers share same mod files
- Server recovers automatically after crash
