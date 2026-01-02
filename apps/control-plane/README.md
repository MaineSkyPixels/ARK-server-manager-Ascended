# Control Plane API

NestJS-based control plane API for ARK Survival Ascended Server Manager.

## Tech Stack

- **Framework**: NestJS with Fastify adapter
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL database
- Redis (for future BullMQ integration)

## Setup

1. **Install dependencies** (from monorepo root):
   ```bash
   pnpm install
   ```

2. **Generate Prisma client**:
   ```bash
   cd packages/db
   pnpm prisma:generate
   ```

3. **Set up database**:
   - Create a PostgreSQL database
   - Copy `.env.example` to `.env` in `apps/control-plane/`
   - Update `DATABASE_URL` in `.env` with your database connection string

4. **Run migrations**:
   ```bash
   cd packages/db
   pnpm prisma:migrate dev
   ```

## Running the Application

### Development Mode

```bash
cd apps/control-plane
pnpm start:dev
```

The API will be available at `http://localhost:3000`
Swagger documentation: `http://localhost:3000/api`

### Production Mode

```bash
pnpm build
pnpm start:prod
```

## API Endpoints

### Health Check
- `GET /health` - Health check endpoint

### Agents
- `POST /agents/register` - Register a new agent or update existing registration
- `POST /agents/heartbeat` - Send agent heartbeat

### Hosts
- (Endpoints to be implemented in future milestones)

### Instances
- (Endpoints to be implemented in future milestones)

### Jobs
- (Endpoints to be implemented in future milestones)

## Testing

### Unit Tests
```bash
pnpm test
```

### E2E Tests
```bash
pnpm test:e2e
```

### Test Coverage
```bash
pnpm test:cov
```

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts          # Root module
├── prisma/                # Prisma service and module
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── agents/                # Agents module
│   ├── agents.module.ts
│   ├── agents.controller.ts
│   ├── agents.service.ts
│   └── dto/               # Validation DTOs
├── hosts/                 # Hosts module (skeleton)
├── instances/             # Instances module (skeleton)
├── jobs/                  # Jobs module (skeleton)
└── health/                # Health check module
```

## Environment Variables

See `.env.example` for required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)
- `REDIS_HOST` - Redis host (for future BullMQ)
- `REDIS_PORT` - Redis port (for future BullMQ)

## Notes

- DTOs from `@ark-asa/contracts` are interfaces. Validation DTOs are created locally in each module's `dto/` directory.
- Prisma schema is managed in `packages/db/prisma/schema.prisma` (owned by LEAD).
- All API contracts are defined in `packages/contracts` (owned by LEAD).

## Next Steps

- [ ] Implement instance creation endpoints
- [ ] Implement job creation and polling endpoints
- [ ] Add BullMQ integration for job orchestration
- [ ] Add WebSocket gateway for real-time updates
- [ ] Add RBAC authentication
- [ ] Add comprehensive error handling and logging

