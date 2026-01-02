# Agent C - Milestone 2 Preparation: Registry Integration Plan

## Status: ✅ DESIGN COMPLETE - Ready for Implementation

This document outlines the design and plan for integrating the Settings Registry with the INI engine. All design work is complete and ready for implementation once the database migration is run.

---

## Overview

Milestone 2 will integrate the database-backed Settings Registry with the INI parser/renderer. This enables:
- Automatic identification of known vs unknown keys
- Type validation and constraints
- UI metadata for settings
- Version tracking (introduced/deprecated settings)

---

## Prerequisites

### ✅ Completed
- ✅ INI parser/renderer (Milestone 1)
- ✅ Settings Registry schema (CR-005)
- ✅ Seed data format design
- ✅ Import mechanism design
- ✅ Registry loader interface design

### ⏳ Pending
- ⏳ Database migration: `pnpm --filter @ark-asa/db prisma migrate dev --name add_setting_registry`
- ⏳ Prisma client generation: `pnpm --filter @ark-asa/db prisma generate`

---

## Architecture

### Components

```
packages/common/src/ini/
├── types.ts              ✅ Core types (Milestone 1)
├── parser.ts             ✅ INI parser (Milestone 1)
├── renderer.ts           ✅ INI renderer (Milestone 1)
├── registry-loader.ts    ✅ Registry loader interface (design complete)
├── registry-importer.ts  ✅ Registry importer interface (design complete)
├── registry-seed.schema.json  ✅ JSON schema for seed data
└── registry-seed.example.json ✅ Example seed data
```

### Data Flow

```
1. Seed Data (JSON) → Registry Importer → Database (SettingRegistry table)
2. Database → Registry Loader → Known Keys Set → INI Parser
3. INI Parser → Known/Unknown Classification → INI Document
4. INI Document → Renderer → INI File (with preserved unknown keys)
```

---

## Seed Data Format

### JSON Schema
- **File**: `packages/common/src/ini/registry-seed.schema.json`
- **Format**: JSON Schema Draft 7
- **Purpose**: Validates seed data structure

### Example Data
- **File**: `packages/common/src/ini/registry-seed.example.json`
- **Contains**: Sample ASA settings (ServerName, Port, QueryPort, etc.)

### Structure

```json
{
  "version": "1.0.0",
  "entries": [
    {
      "gameType": "ASA",
      "fileType": "Game.ini",
      "section": "ServerSettings",
      "key": "ServerName",
      "valueType": "string",
      "defaultValue": null,
      "constraints": {
        "required": true,
        "pattern": "^.{1,200}$"
      },
      "category": "Server",
      "advanced": false,
      "controlType": "text",
      "description": "The name of the server",
      "introducedVersion": "1.0.0",
      "deprecatedVersion": null
    }
  ]
}
```

### Supported Value Types
- `string` - Text values
- `int` - Integer values
- `float` - Floating-point values
- `bool` - Boolean (True/False)
- `array` - Array of values
- `enum` - Enumeration (requires `constraints.enum`)

### Supported Control Types
- `text` - Single-line text input
- `number` - Numeric input
- `checkbox` - Boolean checkbox
- `select` - Dropdown selection
- `textarea` - Multi-line text input
- `multiselect` - Multiple selection

---

## Registry Loader Interface

### Interface: `IRegistryLoader`

**File**: `packages/common/src/ini/registry-loader.ts`

**Methods**:
1. `getKnownKeys(gameType, fileType)` - Returns Set of key identifiers
2. `getMetadata(gameType, fileType, section, key)` - Returns metadata for a key
3. `getAllEntries(gameType, fileType)` - Returns all entries for a file type
4. `isDeprecated(gameType, fileType, section, key)` - Checks if key is deprecated

### Key Identifier Format
- Top-level keys: `.KeyName`
- Section keys: `SectionName.KeyName`

### Usage in Parser

```typescript
// Parser will use registry loader like this:
const knownKeys = await registryLoader.getKnownKeys('ASA', 'Game.ini');
const document = parseIni(content, knownKeys);
```

---

## Registry Importer Interface

### Interface: `IRegistryImporter`

**File**: `packages/common/src/ini/registry-importer.ts`

**Methods**:
1. `importSeedData(seedData, options)` - Imports seed data into database
2. `validateSeedData(seedData)` - Validates seed data before import

### Import Options
- `updateExisting` - Update existing entries (default: true)
- `skipExisting` - Skip entries that already exist (default: false)
- `deprecateMissing` - Mark missing entries as deprecated (default: false)
- `dryRun` - Validate without importing (default: false)

### Validation
- Validates required fields
- Validates value types and constraints
- Checks for duplicate entries
- Validates control types
- Validates constraint compatibility with value types

---

## Implementation Plan

### Phase 1: Prisma-Based Registry Loader

**File**: `packages/common/src/ini/registry-loader-prisma.ts` (create)

**Tasks**:
1. Implement `IRegistryLoader` using Prisma client
2. Query `SettingRegistry` table
3. Convert Prisma results to `RegistryKeyMetadata`
4. Cache known keys for performance
5. Handle deprecation checks

**Dependencies**:
- Prisma client (`@ark-asa/db`)
- Database migration must be run first

### Phase 2: Prisma-Based Registry Importer

**File**: `packages/common/src/ini/registry-importer-prisma.ts` (create)

**Tasks**:
1. Implement `IRegistryImporter` using Prisma client
2. Validate seed data before import
3. Insert/update `SettingRegistry` records
4. Handle unique constraint violations
5. Support import options (update, skip, deprecate)

**Dependencies**:
- Prisma client (`@ark-asa/db`)
- Database migration must be run first

### Phase 3: Parser Integration

**File**: `packages/common/src/ini/parser.ts` (modify)

**Tasks**:
1. Update `parseIni()` to accept `IRegistryLoader` instead of `Set<string>`
2. Make parser async (or provide sync version with pre-loaded keys)
3. Use registry loader to determine known keys
4. Attach metadata to `IniEntry` objects

**Changes**:
```typescript
// Before (Milestone 1):
parseIni(content: string, knownKeys?: Set<string>): IniDocument

// After (Milestone 2):
parseIni(
  content: string,
  registryLoader?: IRegistryLoader,
  gameType?: string,
  fileType?: string
): Promise<IniDocument>
```

### Phase 4: Seed Data Import Tool

**File**: `packages/common/src/ini/import-seed.ts` (create)

**Tasks**:
1. CLI tool or function to import seed data
2. Read JSON file
3. Validate using `validateSeedDataFile()`
4. Import using `IRegistryImporter`
5. Report results

**Usage**:
```bash
# CLI tool (if created)
pnpm --filter @ark-asa/common import-seed ./seed-data/asa-game.ini.json

# Or programmatic
import { importSeedData } from '@ark-asa/common';
await importSeedData('./seed-data/asa-game.ini.json');
```

---

## Integration Points

### 1. Parser → Registry

**Current**: Parser accepts optional `Set<string>` of known keys
**Future**: Parser accepts optional `IRegistryLoader` and queries registry

**Benefits**:
- Automatic key classification
- Metadata attached to entries
- Deprecation warnings
- Type information available

### 2. Renderer → Registry

**Current**: Renderer doesn't use registry
**Future**: Renderer can use registry for:
- Type validation before rendering
- Formatting based on value type
- Deprecation warnings in comments

### 3. Seed Data → Database

**Flow**:
1. Seed data JSON file
2. Validation (`validateSeedDataFile()`)
3. Import (`IRegistryImporter.importSeedData()`)
4. Database (`SettingRegistry` table)

---

## Testing Strategy

### Unit Tests

1. **Registry Loader Tests**
   - `registry-loader-prisma.test.ts`
   - Test: `getKnownKeys()`, `getMetadata()`, `getAllEntries()`, `isDeprecated()`
   - Mock: Prisma client

2. **Registry Importer Tests**
   - `registry-importer-prisma.test.ts`
   - Test: `importSeedData()`, `validateSeedData()`
   - Mock: Prisma client

3. **Parser Integration Tests**
   - `parser-registry.test.ts`
   - Test: Parser with registry loader
   - Verify: Known keys classified correctly, metadata attached

4. **Seed Data Validation Tests**
   - `registry-importer.test.ts` (validation only)
   - Test: `validateSeedEntry()`, `validateSeedDataFile()`
   - Verify: All validation rules

### Integration Tests

1. **End-to-End Import**
   - Import seed data → Query registry → Parse INI → Verify classification

2. **Round-Trip with Registry**
   - Parse INI with registry → Render → Parse again → Verify consistency

---

## Example Usage (After Implementation)

### Importing Seed Data

```typescript
import { IRegistryImporter, validateSeedDataFile } from '@ark-asa/common';
import seedData from './asa-settings.json';

// Validate first
const validation = validateSeedDataFile(seedData);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  return;
}

// Import
const importer = new PrismaRegistryImporter(prisma);
const result = await importer.importSeedData(seedData, {
  updateExisting: true,
  dryRun: false,
});

console.log(`Imported: ${result.imported}, Updated: ${result.updated}`);
```

### Parsing with Registry

```typescript
import { parseIni, PrismaRegistryLoader } from '@ark-asa/common';
import { PrismaClient } from '@ark-asa/db';

const prisma = new PrismaClient();
const registryLoader = new PrismaRegistryLoader(prisma);

const content = `
[ServerSettings]
ServerName=My Server
Port=7777
UnknownModKey=value
`;

const document = await parseIni(
  content,
  registryLoader,
  'ASA',
  'Game.ini'
);

// document.entries[0].isKnown === true (ServerName)
// document.entries[1].isKnown === true (Port)
// document.rawBlocks contains UnknownModKey
```

---

## Migration Checklist

### Before Implementation
- [ ] Run database migration: `pnpm --filter @ark-asa/db prisma migrate dev --name add_setting_registry`
- [ ] Generate Prisma client: `pnpm --filter @ark-asa/db prisma generate`
- [ ] Verify `SettingRegistry` table exists in database

### During Implementation
- [ ] Implement `PrismaRegistryLoader` class
- [ ] Implement `PrismaRegistryImporter` class
- [ ] Update parser to use registry loader
- [ ] Add unit tests
- [ ] Add integration tests

### After Implementation
- [ ] Import initial seed data (ASA settings)
- [ ] Verify parser correctly classifies known/unknown keys
- [ ] Test round-trip stability with registry
- [ ] Document usage examples

---

## Files Created/Modified

### New Files (Design Phase)
- ✅ `packages/common/src/ini/registry-loader.ts` - Loader interface
- ✅ `packages/common/src/ini/registry-importer.ts` - Importer interface
- ✅ `packages/common/src/ini/registry-seed.schema.json` - JSON schema
- ✅ `packages/common/src/ini/registry-seed.example.json` - Example data
- ✅ `packages/common/HANDOFF_AGENT_C_MILESTONE_2.md` - This document

### Files to Create (Implementation Phase)
- ⏳ `packages/common/src/ini/registry-loader-prisma.ts` - Prisma implementation
- ⏳ `packages/common/src/ini/registry-importer-prisma.ts` - Prisma implementation
- ⏳ `packages/common/src/ini/import-seed.ts` - Import tool (optional)
- ⏳ `packages/common/src/ini/registry-loader-prisma.test.ts` - Tests
- ⏳ `packages/common/src/ini/registry-importer-prisma.test.ts` - Tests
- ⏳ `packages/common/src/ini/parser-registry.test.ts` - Integration tests

### Files to Modify (Implementation Phase)
- ⏳ `packages/common/src/ini/parser.ts` - Add registry loader support
- ⏳ `packages/common/src/ini/index.ts` - Export new interfaces (already done)

---

## Dependencies

### Required (After Migration)
- `@ark-asa/db` - Prisma client
- `@prisma/client` - Prisma runtime

### Optional
- JSON schema validator (for seed data validation)
- CLI framework (if creating import tool)

---

## Known Edge Cases

1. **Deprecated Keys**: Should be marked as known but with deprecation flag
2. **Version Tracking**: Keys introduced in newer versions may not exist in older game versions
3. **Mod Settings**: Unknown keys from mods should always be preserved
4. **Case Sensitivity**: Section/key names may be case-sensitive in some contexts
5. **Empty Sections**: Top-level keys use empty string section
6. **Duplicate Keys**: Same key in multiple sections (handled by unique constraint)

---

## Success Criteria

- ✅ Registry can be populated from seed data
- ✅ Parser correctly identifies known vs unknown keys using registry
- ✅ Unknown keys are preserved through round-trips
- ✅ Metadata is accessible for known keys
- ✅ Deprecated keys are identified
- ✅ All tests pass
- ✅ Documentation complete

---

## Next Steps After Migration

1. **Implement Prisma-based loader** (Phase 1)
2. **Implement Prisma-based importer** (Phase 2)
3. **Update parser to use registry** (Phase 3)
4. **Create seed data for ASA** (partial list in example)
5. **Import seed data** (Phase 4)
6. **Test end-to-end** (integration tests)

---

## Questions/Clarifications Needed

None at this time. Design is complete and ready for implementation.

---

**Design Completed**: 2024-01-XX  
**Ready for Implementation**: After database migration  
**Estimated Implementation Time**: 4-6 hours (all phases)

