# INI Engine Test Instructions

## Prerequisites

1. Install dependencies:
   ```bash
   cd packages/common
   pnpm install
   ```

2. Ensure TypeScript is configured correctly (should use `tsconfig.base.json`)

## Running Tests

### Run all tests
```bash
cd packages/common
pnpm test
```

### Run tests in watch mode
```bash
pnpm test:watch
```

### Run tests with coverage
```bash
pnpm test:cov
```

## Test Files

- `src/ini/parser.test.ts` - Parser tests (round-trip, comments, unknown keys)
- `src/ini/renderer.test.ts` - Renderer tests (deterministic output, formatting)

## Example Test Scenarios

### 1. Round-Trip Stability

**Test**: Parse an INI file, render it, parse again - should produce equivalent structure.

**Example Input:**
```ini
[ServerSettings]
ServerName=My Server
Port=7777
```

**Expected**: After parse → render → parse, the document structure should be equivalent.

### 2. Unknown Key Preservation

**Test**: Unknown keys should be preserved in raw blocks.

**Example Input:**
```ini
[ServerSettings]
ServerName=My Server
UnknownModKey=value123
```

**Expected**: `UnknownModKey` should appear in `rawBlocks` and be preserved in rendered output.

### 3. Comment Preservation

**Test**: Comments should survive round-trip.

**Example Input:**
```ini
; Leading comment
[ServerSettings]
ServerName=My Server ; Trailing comment
```

**Expected**: Both leading and trailing comments should be preserved.

## Manual Testing

### Test with Real ARK INI File

1. Copy a real `Game.ini` or `GameUserSettings.ini` file
2. Create a test script:

```typescript
import { readFileSync } from 'fs';
import { parseIni, renderIni } from './src/ini';

const content = readFileSync('path/to/Game.ini', 'utf-8');
const document = parseIni(content);
const rendered = renderIni(document);

console.log('Original length:', content.length);
console.log('Rendered length:', rendered.length);
console.log('Entries:', document.entries.length);
console.log('Raw blocks:', document.rawBlocks.length);
```

3. Verify:
   - All keys are preserved
   - Comments are preserved
   - Output is deterministic (run multiple times, same output)

## Expected Test Results

All tests should pass:
- ✅ Basic parsing (sections, key-value pairs)
- ✅ Comment preservation (leading, trailing)
- ✅ Known vs unknown key distinction
- ✅ Round-trip stability
- ✅ Unknown key preservation
- ✅ Deterministic ordering
- ✅ Complex real-world INI files

## Troubleshooting

### Tests fail with "Cannot find module"

Ensure you've run `pnpm install` in the `packages/common` directory.

### Type errors

Ensure TypeScript configuration is correct. The package uses `tsconfig.base.json` from the root.

### Jest not found

Install Jest: `pnpm add -D jest ts-jest @types/jest`

## Next Steps

After verifying tests pass:

1. ✅ INI parser with comment preservation
2. ✅ Stable renderer with deterministic output
3. ✅ Data structures for known/unknown keys
4. ✅ Unit tests covering all requirements
5. ⏭️ Next: Registry schema design (requires DB schema changes - Change Request needed)

