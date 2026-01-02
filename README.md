# ARK Survival Ascended Server Manager

Monorepo for managing ARK Survival Ascended (ASA) server instances.

## Architecture

This is a pnpm monorepo with the following structure:

```
apps/
  control-plane/    # NestJS (Fastify) orchestration service
  agent/            # Windows agent runtime (Node/TS)
  desktop-ui/       # Avalonia desktop application

packages/
  contracts/        # Shared DTOs, enums, WebSocket events (SINGLE SOURCE OF TRUTH)
  db/               # Prisma schema and migrations
  common/           # Shared utilities
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL (for control-plane)
- Redis (for job queue)

### Installation

```bash
pnpm install
```

### Build

```bash
pnpm build
```

### Development

See `HANDOFF_CHECKLIST.md` for detailed commands and contract documentation.

## Key Principles

1. **Contract-First**: All DTOs, enums, and WebSocket events live in `packages/contracts`
2. **Game Guardrails**: Every instance must specify `gameType = ASA | ASE`
3. **Job Idempotency**: All jobs must be safe to retry
4. **File Ownership**: Only Integration Lead edits `packages/contracts/**` and `packages/db/**`

## Documentation

- `HANDOFF_CHECKLIST.md` — First milestone handoff guide
- `ai-taskboards/docs/` — Architecture and protocol documentation
- `ai-taskboards/docs/change_requests.md` — Process for proposing contract/schema changes

## License

Private repository.

