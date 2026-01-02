/**
 * Registry Loader
 * 
 * Provides interfaces and utilities for loading registry data from the database
 * and converting it to formats usable by the INI parser.
 * 
 * NOTE: This is a design/interface file for Milestone 2.
 * Actual implementation will require Prisma client after migration.
 */

import { RegistryKeyMetadata } from './types';

/**
 * Registry loader interface
 * 
 * This interface defines how the INI parser will interact with the registry.
 * Implementation will use Prisma client to query the SettingRegistry table.
 */
export interface IRegistryLoader {
  /**
   * Load all known keys for a specific game type and file type
   * 
   * @param gameType - 'ASA' or 'ASE'
   * @param fileType - File type (e.g., 'Game.ini', 'GameUserSettings.ini')
   * @returns Set of key identifiers in format "section.key" (empty section = ".key")
   */
  getKnownKeys(gameType: string, fileType: string): Promise<Set<string>>;

  /**
   * Get metadata for a specific key
   * 
   * @param gameType - 'ASA' or 'ASE'
   * @param fileType - File type
   * @param section - Section name (empty for top-level)
   * @param key - Key name
   * @returns Registry metadata or null if not found
   */
  getMetadata(
    gameType: string,
    fileType: string,
    section: string,
    key: string
  ): Promise<RegistryKeyMetadata | null>;

  /**
   * Get all registry entries for a game type and file type
   * 
   * @param gameType - 'ASA' or 'ASE'
   * @param fileType - File type
   * @returns Array of registry metadata entries
   */
  getAllEntries(
    gameType: string,
    fileType: string
  ): Promise<RegistryKeyMetadata[]>;

  /**
   * Check if a key is deprecated
   * 
   * @param gameType - 'ASA' or 'ASE'
   * @param fileType - File type
   * @param section - Section name
   * @param key - Key name
   * @returns True if key is deprecated
   */
  isDeprecated(
    gameType: string,
    fileType: string,
    section: string,
    key: string
  ): Promise<boolean>;
}

/**
 * Create a key identifier for registry lookup
 * 
 * @param section - Section name (empty for top-level)
 * @param key - Key name
 * @returns Identifier string
 */
export function createKeyIdentifier(section: string, key: string): string {
  return section ? `${section}.${key}` : `.${key}`;
}

/**
 * Parse a key identifier into section and key
 * 
 * @param identifier - Key identifier (format: "section.key" or ".key")
 * @returns Object with section and key
 */
export function parseKeyIdentifier(identifier: string): {
  section: string;
  key: string;
} {
  if (identifier.startsWith('.')) {
    return { section: '', key: identifier.slice(1) };
  }
  const lastDot = identifier.lastIndexOf('.');
  if (lastDot === -1) {
    return { section: '', key: identifier };
  }
  return {
    section: identifier.slice(0, lastDot),
    key: identifier.slice(lastDot + 1),
  };
}

/**
 * Convert registry entry from database to RegistryKeyMetadata
 * 
 * This is a helper type for the implementation.
 * The actual conversion will happen in the Prisma-based implementation.
 */
export interface RegistryDbEntry {
  gameType: string;
  fileType: string;
  section: string;
  key: string;
  valueType: string;
  defaultValue: string | null;
  constraints: Record<string, unknown> | null;
  category: string | null;
  advanced: boolean;
  controlType: string | null;
  introducedVersion: string | null;
  deprecatedVersion: string | null;
  description: string | null;
}

/**
 * Convert database entry to RegistryKeyMetadata
 */
export function dbEntryToMetadata(
  entry: RegistryDbEntry
): RegistryKeyMetadata {
  return {
    gameType: entry.gameType as 'ASA' | 'ASE',
    fileType: entry.fileType,
    section: entry.section,
    key: entry.key,
    valueType: entry.valueType,
    defaultValue: entry.defaultValue ?? undefined,
    category: entry.category ?? undefined,
    advanced: entry.advanced,
    controlType: entry.controlType ?? undefined,
    introducedVersion: entry.introducedVersion ?? undefined,
    deprecatedVersion: entry.deprecatedVersion ?? undefined,
  };
}

