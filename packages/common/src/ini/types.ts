/**
 * INI Engine Types
 * 
 * Core data structures for representing INI files with support for:
 * - Registry-known keys (with metadata)
 * - Raw/unclassified keys (preserved as-is)
 * - Comments and whitespace preservation
 */

/**
 * Represents a single INI entry (key-value pair)
 */
export interface IniEntry {
  /** Section name (empty string for top-level) */
  section: string;
  /** Key name */
  key: string;
  /** Value (as string, preserving original format) */
  value: string;
  /** Whether this key is known in the registry */
  isKnown: boolean;
  /** Leading comment lines before this entry */
  leadingComments: string[];
  /** Trailing comment on the same line */
  trailingComment?: string;
}

/**
 * Represents a raw/unclassified INI block
 * These are preserved exactly as parsed, including comments and formatting
 */
export interface RawIniBlock {
  /** Section name (empty string for top-level) */
  section: string;
  /** Raw content including comments, whitespace, and unknown keys */
  rawContent: string;
  /** Line number where this block starts (for stable ordering) */
  lineNumber: number;
}

/**
 * Complete INI document representation
 */
export interface IniDocument {
  /** Registry-known entries */
  entries: IniEntry[];
  /** Raw/unclassified blocks */
  rawBlocks: RawIniBlock[];
  /** Leading comments at the start of the file */
  leadingComments: string[];
}

/**
 * Registry metadata for a known INI key
 */
export interface RegistryKeyMetadata {
  /** Game type (ASA/ASE) */
  gameType: 'ASA' | 'ASE';
  /** File type (Game.ini, GameUserSettings.ini, etc.) */
  fileType: string;
  /** Section name */
  section: string;
  /** Key name */
  key: string;
  /** Value type (string, int, float, bool, etc.) */
  valueType: string;
  /** Default value */
  defaultValue?: string;
  /** UI category */
  category?: string;
  /** Whether this is an advanced setting */
  advanced?: boolean;
  /** Control type for UI */
  controlType?: string;
  /** Version when introduced */
  introducedVersion?: string;
  /** Version when deprecated */
  deprecatedVersion?: string;
}

