# JOBS_PROTOCOL — Execution & Progress Model

This document defines how **jobs are created, executed, retried, and reported**.
All agents must follow this exactly.

---

## 1. Job Transport (V1 — LOCKED)

### Control Plane → Agent
- Agent POLLS for jobs via HTTP
- Poll interval configurable (default 3–5 seconds)

### Agent → Control Plane
- Progress reported via HTTP
- Final result reported via HTTP

### UI
- UI receives job updates via WebSocket ONLY
- UI never polls agents directly

---

## 2. Job Lifecycle

All jobs follow this lifecycle:

1. CREATED
2. QUEUED
3. RUNNING
4. COMPLETED | FAILED | CANCELLED
5. (optional) RETRIED

Each retry creates a new `job_run`.

---

## 3. Idempotency Rules (CRITICAL)

Every job MUST be safe to retry.

That means:
- Partial work must be detectable
- Re-running the job must not corrupt state
- Side effects must be guarded

Examples:
- Backups write to a temp folder then atomically finalize
- Updates stage to cache before activation
- Restores verify files before replacing live data

---

## 4. Job Progress Reporting

Progress events include:
- jobId
- jobRunId
- instanceId (if applicable)
- status
- percent (0–100, optional but preferred)
- message (human-readable)
- timestamp

Progress semantics:
- 0–100 means overall progress
- If percent unknown, emit step-based messages
- Avoid flooding (throttle events)

---

## 5. Standard Job Types (Initial)

- INSTALL_SERVER
- UPDATE_SERVER
- START_INSTANCE
- STOP_INSTANCE
- RESTART_INSTANCE
- BACKUP_INSTANCE
- VERIFY_BACKUP
- RESTORE_BACKUP
- PRUNE_BACKUPS
- SYNC_MODS
- ACTIVATE_BUILD

New job types require LEAD approval.

---

## 6. Failure Handling

On failure:
- Record error message + stack (sanitized)
- Mark job_run FAILED
- Job may be retried manually or automatically

Never silently swallow errors.

---

## 7. Cancellation

If a job is cancellable:
- Check cancellation flag at safe points
- Stop gracefully
- Leave system in consistent state

If not cancellable:
- Clearly document why in job metadata

---

## 8. Logging

All jobs must:
- Log start
- Log major steps
- Log completion or failure
Logs must be traceable by jobId.
