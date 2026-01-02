# STORAGE_LAYOUT — Disk, Cache, and Backup Conventions

This document defines the **authoritative filesystem layout** for the
ARK Survival Ascended Server Manager.

ALL AGENTS MUST FOLLOW THIS DOCUMENT.
No agent may invent paths or formats outside this specification.

---

## 1. Project Root

All paths are rooted at:

D:\Ark ASA ASM

---

## 2. Repository & AI Taskboard Layout

These paths exist only for development and AI coordination.

D:\Ark ASA ASM\
├── ai-taskboards\
│   ├── 00-FOUNDATION.md
│   ├── 01-INTEGRATION-LEAD.md
│   ├── 02-AGENT-A-CONTROL-PLANE.md
│   ├── 03-AGENT-B-WINDOWS-AGENT.md
│   ├── 04-AGENT-C-SETTINGS-ENGINE.md
│   ├── 05-AGENT-D-AVALONIA-UI.md
│   └── docs\
│       ├── CONTRIBUTING_AI.md
│       ├── JOBS_PROTOCOL.md
│       └── STORAGE_LAYOUT.md

These files are **not used at runtime**.

---

## 3. Runtime Root (Per Host)

The runtime data root lives directly under the project root:

D:\Ark ASA ASM\
├── runtime\

All operational data MUST live under `runtime\`.

---

## 4. Runtime Directory Structure

D:\Ark ASA ASM\runtime\
├── agent\          (agent state, config, internal metadata)
├── cache\          (immutable shared content)
├── instances\      (per-server working directories)
├── backups\        (time-based backups)
├── logs\           (agent, job, instance logs)
└── temp\           (job staging and scratch space)

---

## 5. Cache Layout (READ-ONLY)

Cache content is immutable.  
Updates always create new folders; existing cache entries are never modified.

### 5.1 Server Build Cache

D:\Ark ASA ASM\runtime\cache\
└── server_builds\
    └── ASA\
        └── <buildId>\
            └── ShooterGame\

Rules:
- `<buildId>` is a unique identifier (Steam build ID or derived fingerprint).
- No instance writes directly into cache.
- Cache content may be shared across many instances via hardlinks.

---

### 5.2 Mod Cache

D:\Ark ASA ASM\runtime\cache\
└── mods\
    └── <modId>\
        └── <fingerprint>\
            └── ...

Rules:
- `<fingerprint>` is a content hash (e.g. SHA-256 truncated).
- Multiple fingerprints may exist for the same modId.
- Cache is strictly read-only once created.

---

## 6. Instance Layout (PER SERVER)

Each ARK server instance has its own isolated directory.

D:\Ark ASA ASM\runtime\instances\
└── <instanceId>\
    ├── active\     (hardlinks to cache content)
    ├── config\     (INI files and command-line configs)
    ├── saves\      (world, tribe, player save data)
    ├── mods\       (links or overlays if required)
    └── logs\       (instance-specific logs)

Rules:
- `active\` is replaced atomically during updates.
- `config\` and `saves\` are instance-owned and backed up.
- Cache content is never modified from within an instance.

---

## 7. Backup Layout

Backups are time-based and stored per instance.

D:\Ark ASA ASM\runtime\backups\
└── <instanceId>\
    └── YYYY\
        └── MM\
            └── DD\
                └── HHmmss\
                    ├── manifest.json
                    ├── saves\
                    └── config\

---

### 7.1 Backup Manifest Requirements

Each `manifest.json` MUST include:

- instanceId
- gameType (ASA)
- timestamp (UTC)
- serverBuildId
- enabled mods with fingerprints
- list of files with:
  - relative path
  - size
  - hash
- verification status
- backup version

---

## 8. Restore Rules

Restore sequence (MANDATORY):

1. Stop server process
2. Validate backup integrity
3. Restore `saves\` and `config\`
4. Start server
5. Monitor startup health

Rollback rules:
- Previous instance state MUST remain untouched until restore succeeds.
- Failed restore MUST leave server stoppable and recoverable.

---

## 9. Hardlinks & Fallback Behavior

Preferred:
- NTFS hardlinks from cache → instance `active\`

Fallback:
- Full file copy if hardlinks unavailable or fail

Agent must detect hardlink capability at startup and report it as a capability.

---

## 10. Temp & Staging

Temporary job staging area:

D:\Ark ASA ASM\runtime\temp\
└── <jobId>\

Rules:
- All destructive operations stage here first
- Temp folders cleaned on:
  - job completion
  - job failure
  - agent startup (orphan cleanup)

---

## 11. Logging Layout

D:\Ark ASA ASM\runtime\logs\
├── agent.log
├── jobs\
│   └── <jobId>.log
└── instances\
    └── <instanceId>.log

Rules:
- Logging must never block execution
- Logs must be correlated by jobId and instanceId
- Large logs should be rotated

---

## 12. Prohibited Practices

Agents MUST NOT:
- Write directly into cache directories
- Modify active instances without staging
- Invent new top-level runtime folders
- Store runtime data outside `runtime\`

Violations WILL cause merge rejection.
