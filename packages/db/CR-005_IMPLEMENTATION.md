# CR-005 Implementation: Settings Registry Schema

## Status: ✅ COMPLETE

The `SettingRegistry` model has been added to the Prisma schema as approved in CR-005.

## Changes Made

### Schema Addition
- Added `SettingRegistry` model to `packages/db/prisma/schema.prisma` (lines 143-165)
- All fields match the approved specification from CR-005

### Model Details

```prisma
model SettingRegistry {
  id                String   @id @default(uuid())
  gameType          String   // 'ASA' | 'ASE'
  fileType          String   // 'Game.ini', 'GameUserSettings.ini', 'Cmdline', etc.
  section           String   // Section name (empty string for top-level)
  key               String   // Key name
  valueType         String   // 'string', 'int', 'float', 'bool', 'array', etc.
  defaultValue      String?  // Default value as string
  constraints       Json?    // Validation constraints (min, max, enum values, etc.)
  category          String?  // UI category for grouping
  advanced          Boolean  @default(false) // Whether this is an advanced setting
  controlType       String?  // UI control type ('text', 'number', 'checkbox', 'select', etc.)
  introducedVersion String?  // Version when this setting was introduced
  deprecatedVersion String? // Version when this setting was deprecated
  description       String?  // Human-readable description
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([gameType, fileType, section, key])
  @@index([gameType, fileType])
  @@index([section, key])
  @@map("setting_registry")
}
```

## Next Steps

### 1. Generate Prisma Client
```bash
cd packages/db
pnpm prisma:generate
```

### 2. Create Migration (when ready)
```bash
cd packages/db
pnpm prisma:migrate --name add_setting_registry
```

Or using the workspace command:
```bash
pnpm --filter @ark-asa/db prisma migrate dev --name add_setting_registry
```

### 3. Verify Schema
The schema is ready for use. Once the migration is run, the `SettingRegistry` table will be created in the database.

## Alignment with Common Package

The schema aligns perfectly with the `RegistryKeyMetadata` type defined in `packages/common/src/ini/types.ts`:

- ✅ All fields from `RegistryKeyMetadata` are represented
- ✅ Additional useful fields added (`constraints`, `description`)
- ✅ Unique constraint ensures no duplicate registry entries
- ✅ Indexes optimize common query patterns

## Usage

Once the migration is run, the Prisma client will include the `SettingRegistry` model:

```typescript
import { PrismaClient } from '@ark-asa/db';

const prisma = new PrismaClient();

// Query registry entries
const asaSettings = await prisma.settingRegistry.findMany({
  where: {
    gameType: 'ASA',
    fileType: 'Game.ini',
  },
});

// Create registry entry
await prisma.settingRegistry.create({
  data: {
    gameType: 'ASA',
    fileType: 'Game.ini',
    section: 'ServerSettings',
    key: 'ServerName',
    valueType: 'string',
    category: 'Server',
    advanced: false,
  },
});
```

## Notes

- The schema is ready for Milestone 2 implementation
- No contract changes were required (as noted in CR-005)
- Seed data mechanism can be designed separately when needed
- DTOs for API operations can be added later if registry operations need API endpoints

