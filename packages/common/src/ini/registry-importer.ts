/**
 * Registry Importer
 * 
 * Utilities for importing seed data into the SettingRegistry table.
 * 
 * NOTE: This is a design/interface file for Milestone 2.
 * Actual implementation will require Prisma client after migration.
 */

import { RegistryKeyMetadata } from './types';

/**
 * Seed data entry format (matches JSON schema)
 */
export interface SeedDataEntry {
  gameType: 'ASA' | 'ASE';
  fileType: string;
  section: string;
  key: string;
  valueType: string;
  defaultValue?: string | null;
  constraints?: {
    min?: number | null;
    max?: number | null;
    enum?: string[] | null;
    pattern?: string | null;
    required?: boolean | null;
  } | null;
  category?: string | null;
  advanced?: boolean;
  controlType?: string | null;
  introducedVersion?: string | null;
  deprecatedVersion?: string | null;
  description?: string | null;
}

/**
 * Seed data file format
 */
export interface SeedDataFile {
  version: string;
  entries: SeedDataEntry[];
}

/**
 * Registry importer interface
 * 
 * This interface defines how seed data will be imported into the database.
 * Implementation will use Prisma client to insert/update SettingRegistry records.
 */
export interface IRegistryImporter {
  /**
   * Import seed data from a file or object
   * 
   * @param seedData - Seed data to import
   * @param options - Import options
   * @returns Import result with counts
   */
  importSeedData(
    seedData: SeedDataFile,
    options?: ImportOptions
  ): Promise<ImportResult>;

  /**
   * Validate seed data before import
   * 
   * @param seedData - Seed data to validate
   * @returns Validation result
   */
  validateSeedData(seedData: SeedDataFile): ValidationResult;
}

/**
 * Import options
 */
export interface ImportOptions {
  /**
   * Whether to update existing entries (default: true)
   */
  updateExisting?: boolean;

  /**
   * Whether to skip entries that already exist (default: false)
   */
  skipExisting?: boolean;

  /**
   * Whether to mark existing entries as deprecated if not in seed data (default: false)
   */
  deprecateMissing?: boolean;

  /**
   * Dry run - validate but don't import (default: false)
   */
  dryRun?: boolean;
}

/**
 * Import result
 */
export interface ImportResult {
  /**
   * Number of entries imported
   */
  imported: number;

  /**
   * Number of entries updated
   */
  updated: number;

  /**
   * Number of entries skipped
   */
  skipped: number;

  /**
   * Number of errors
   */
  errors: number;

  /**
   * Error details
   */
  errorDetails?: Array<{
    entry: SeedDataEntry;
    error: string;
  }>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /**
   * Whether validation passed
   */
  valid: boolean;

  /**
   * Validation errors
   */
  errors: Array<{
    entry?: SeedDataEntry;
    field?: string;
    error: string;
  }>;
}

/**
 * Validate a single seed data entry
 */
export function validateSeedEntry(entry: SeedDataEntry): string[] {
  const errors: string[] = [];

  // Required fields
  if (!entry.gameType || !['ASA', 'ASE'].includes(entry.gameType)) {
    errors.push('gameType must be "ASA" or "ASE"');
  }
  if (!entry.fileType || entry.fileType.trim() === '') {
    errors.push('fileType is required');
  }
  if (entry.section === undefined) {
    errors.push('section is required (use empty string for top-level)');
  }
  if (!entry.key || entry.key.trim() === '') {
    errors.push('key is required');
  }
  if (!entry.valueType) {
    errors.push('valueType is required');
  }

  // Value type validation
  const validValueTypes = ['string', 'int', 'float', 'bool', 'array', 'enum'];
  if (!validValueTypes.includes(entry.valueType)) {
    errors.push(
      `valueType must be one of: ${validValueTypes.join(', ')}`
    );
  }

  // Constraints validation
  if (entry.constraints) {
    if (
      entry.valueType === 'int' ||
      entry.valueType === 'float'
    ) {
      if (
        entry.constraints.min !== null &&
        entry.constraints.min !== undefined &&
        typeof entry.constraints.min !== 'number'
      ) {
        errors.push('constraints.min must be a number for int/float types');
      }
      if (
        entry.constraints.max !== null &&
        entry.constraints.max !== undefined &&
        typeof entry.constraints.max !== 'number'
      ) {
        errors.push('constraints.max must be a number for int/float types');
      }
      if (
        entry.constraints.min !== null &&
        entry.constraints.max !== null &&
        entry.constraints.min > entry.constraints.max
      ) {
        errors.push('constraints.min must be <= constraints.max');
      }
    }

    if (entry.valueType === 'enum' && !entry.constraints.enum) {
      errors.push('constraints.enum is required for enum valueType');
    }
  }

  // Control type validation
  if (entry.controlType) {
    const validControlTypes = [
      'text',
      'number',
      'checkbox',
      'select',
      'textarea',
      'multiselect',
    ];
    if (!validControlTypes.includes(entry.controlType)) {
      errors.push(
        `controlType must be one of: ${validControlTypes.join(', ')}`
      );
    }
  }

  return errors;
}

/**
 * Validate entire seed data file
 */
export function validateSeedDataFile(
  seedData: SeedDataFile
): ValidationResult {
  const errors: Array<{
    entry?: SeedDataEntry;
    field?: string;
    error: string;
  }> = [];

  // Version check
  if (!seedData.version) {
    errors.push({ error: 'version is required' });
  }

  // Entries check
  if (!Array.isArray(seedData.entries)) {
    errors.push({ error: 'entries must be an array' });
    return { valid: false, errors };
  }

  // Validate each entry
  for (const entry of seedData.entries) {
    const entryErrors = validateSeedEntry(entry);
    for (const error of entryErrors) {
      errors.push({ entry, error });
    }
  }

  // Check for duplicate entries
  const seen = new Set<string>();
  for (const entry of seedData.entries) {
    const identifier = `${entry.gameType}:${entry.fileType}:${entry.section}:${entry.key}`;
    if (seen.has(identifier)) {
      errors.push({
        entry,
        error: `Duplicate entry: ${identifier}`,
      });
    }
    seen.add(identifier);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

