# LEAD_AUTO_DIFF_REVIEW_CHECKLIST — Agent Diff Review

This checklist is used by the **Integration Lead** when reviewing
diffs produced by Cursor agents.

The goal is to:
- catch drift early
- prevent silent contract/schema breakage
- approve merges quickly when safe

Use this checklist EVERY TIME.

---

## 0) Pre-Review Sanity Check (30 seconds)

☐ Agent provided a handoff bundle  
☐ Files changed match the agent’s role  
☐ No unexpected directories touched  
☐ No “drive-by refactors”  

If any box fails → STOP and send back to agent.

---

## 1) File Ownership Validation (CRITICAL)

Scan the diff headers.

☐ Agent modified ONLY allowed directories  
☐ NO changes to:
  - packages/contracts/**
  - packages/db/**
unless explicitly approved via Change Request

☐ No new top-level directories created  
☐ No runtime paths hardcoded outside STORAGE_LAYOUT.md  

FAIL ANY → REJECT MERGE.

---

## 2) Contract & API Drift Detection

(Yes, even if the agent claims “no contract changes”)

☐ No new endpoint URLs invented  
☐ No request/response shapes invented inline  
☐ No duplicated DTO definitions in app code  
☐ No enum literals hardcoded instead of imported types  

Red flags:
- inline `{ status: "RUNNING" }`
- magic strings for job types
- ad-hoc progress payloads

If found → require Change Request.

---

## 3) ASA / ASE Guardrail Enforcement

☐ All server logic explicitly references `gameType`  
☐ No shared defaults or paths between ASA and ASE  
☐ No assumptions like “ARK server path” without adapter  

Red flags:
- shared config folders
- implicit ASA-only behavior without guard
- comments like “for now just ASA”

ASA must be explicit.

---

## 4) JOBS_PROTOCOL Compliance

Review any job-related changes.

☐ Job type exists in JOBS_PROTOCOL.md  
☐ No new job types introduced silently  
☐ Job execution is idempotent  
☐ Temp/staging used for destructive operations  
☐ Progress events:
  - throttled
  - meaningful steps
  - no spam loops

Red flags:
- writing directly into live instance folders
- progress emitted every file
- missing failure handling

---

## 5) STORAGE_LAYOUT Compliance

Review any filesystem changes.

☐ All paths rooted under:
  D:\Ark ASA ASM\runtime\
☐ Cache treated as immutable  
☐ Instance writes only to instance folders  
☐ Backups follow timestamped layout  
☐ No absolute paths hardcoded  

Red flags:
- relative paths without base root
