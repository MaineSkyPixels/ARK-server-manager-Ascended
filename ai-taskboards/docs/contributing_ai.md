# CONTRIBUTING_AI — Multi-Agent Development Rules

This project is developed by **multiple AI coding agents in parallel**.
These rules exist to prevent conflicts, architectural drift, and wasted work.

ALL AGENTS MUST FOLLOW THIS DOCUMENT.

---

## 1. File Ownership (HARD RULES)

### Integration Lead (LEAD) ONLY
May edit:
- packages/contracts/**
- packages/db/**
  - prisma.schema
  - migrations
- root tsconfig / eslint / prettier configs

Other agents MUST NOT directly modify these paths.

If a change is needed:
1. Write a proposal in `docs/CHANGE_REQUESTS.md`
2. Reference required fields / endpoints / tables
3. Wait for LEAD to merge

---

### Agent A — Control Plane
May edit:
- apps/control-plane/**
- packages/common/** (with caution, no breaking changes)

Must NOT edit:
- packages/contracts/**
- packages/db/**
- apps/agent/**
- apps/desktop-ui/**

---

### Agent B — Windows Agent Runtime
May edit:
- apps/agent/**
- packages/common/** (utilities only)

Must NOT edit:
- packages/contracts/**
- packages/db/**
- apps/control-plane/**
- apps/desktop-ui/**

---

### Agent C — Settings / INI Engine
May edit:
- packages/common/settings/**
- packages/common/ini/**
- packages/common/templates/**

Must NOT edit:
- Prisma schema
- UI code
- Agent runtime code

---

### Agent D — Avalonia UI
May edit:
- apps/desktop-ui/**

Must NOT edit:
- backend code
- agent runtime
- contracts or DB

---

## 2. Contracts First (MANDATORY)

- All APIs, DTOs, job payloads, and WS events are defined in:
  - packages/contracts
- No agent may invent shapes ad-hoc.
- If something is missing:
  - create a short proposal in CHANGE_REQUESTS.md
  - describe the minimum addition needed

---

## 3. Game Guardrails (ASA vs ASE)

- Every server instance MUST explicitly specify:
  - gameType = ASA | ASE
- ASA is supported.
- ASE exists only as a stub adapter.
- No shared defaults, paths, or config logic between games.

---

## 4. No “Helpful” Refactors

AI agents must NOT:
- rename shared fields
- reorganize directories
- refactor for “cleanliness”
unless explicitly requested.

Stability > elegance.

---

## 5. Definition of Done (ALL AGENTS)

A task is DONE only if:
- it works with multiple server instances
- it survives restart
- it logs actions and errors
- it respects file ownership boundaries
- it does not break other agents’ code

---

## 6. When in Doubt

If unsure:
- STOP
- Write a proposal
- Let LEAD decide

This is faster than fixing broken merges.
