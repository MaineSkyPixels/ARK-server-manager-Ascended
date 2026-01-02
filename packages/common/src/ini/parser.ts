/**
 * INI Parser
 * 
 * Parses INI files while preserving:
 * - Comments (both leading and trailing)
 * - Whitespace
 * - Unknown keys (as raw blocks)
 * - Section ordering
 */

import { IniDocument, IniEntry, RawIniBlock } from './types';

/**
 * Parse an INI file into a structured document
 * 
 * @param content - Raw INI file content
 * @param knownKeys - Set of known keys in format "section.key" (empty section = "")
 * @returns Parsed INI document
 */
export function parseIni(
  content: string,
  knownKeys?: Set<string>
): IniDocument {
  const lines = content.split(/\r?\n/);
  const document: IniDocument = {
    entries: [],
    rawBlocks: [],
    leadingComments: [],
  };

  let currentSection = '';
  let currentRawBlock: string[] = [];
  let currentRawBlockStartLine = 0;
  let inRawBlock = false;
  let leadingCommentBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (trimmed === '') {
      if (inRawBlock) {
        currentRawBlock.push(line);
      } else {
        leadingCommentBuffer.push(line);
      }
      continue;
    }

    // Section header: [SectionName]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      // Flush any pending raw block
      if (inRawBlock && currentRawBlock.length > 0) {
        document.rawBlocks.push({
          section: currentSection,
          rawContent: currentRawBlock.join('\n'),
          lineNumber: currentRawBlockStartLine,
        });
        currentRawBlock = [];
        inRawBlock = false;
      }

      // Extract section name
      const sectionName = trimmed.slice(1, -1).trim();
      
      // If this section will have entries, we don't need to store the header in raw blocks
      // If it only has raw content, we'll include the header in the raw block
      // For now, start a new raw block that may include the header if no entries follow
      if (leadingCommentBuffer.length > 0) {
        currentRawBlock.push(...leadingCommentBuffer);
        leadingCommentBuffer = [];
      }
      currentRawBlock.push(line); // Include section header in raw block
      currentSection = sectionName;
      currentRawBlockStartLine = i + 1;
      inRawBlock = true;
      continue;
    }

    // Comment line
    if (trimmed.startsWith(';') || trimmed.startsWith('#')) {
      if (inRawBlock) {
        currentRawBlock.push(line);
      } else {
        leadingCommentBuffer.push(line);
      }
      continue;
    }

    // Key-value pair
    const kvMatch = line.match(/^([^=]+?)(\s*=\s*)(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      const valuePart = kvMatch[3];
      
      // Check for trailing comment
      let value = valuePart;
      let trailingComment: string | undefined;
      
      // Look for comment after value (; or #)
      const commentMatch = valuePart.match(/^(.+?)(\s*[;#].*)$/);
      if (commentMatch) {
        value = commentMatch[1].trim();
        trailingComment = commentMatch[2].trim();
      } else {
        value = valuePart.trim();
      }

      // Check if this is a known key
      const keyIdentifier = currentSection ? `${currentSection}.${key}` : `.${key}`;
      const isKnown = knownKeys?.has(keyIdentifier) ?? false;

      // Flush raw block if we're switching to a known key
      if (isKnown && inRawBlock) {
        if (currentRawBlock.length > 0) {
          document.rawBlocks.push({
            section: currentSection,
            rawContent: currentRawBlock.join('\n'),
            lineNumber: currentRawBlockStartLine,
          });
        }
        currentRawBlock = [];
        inRawBlock = false;
      }

      // Add leading comments if we have them
      const leadingComments = [...leadingCommentBuffer];
      leadingCommentBuffer = [];

      if (isKnown) {
        // Known key - add as structured entry
        // If we were in a raw block, flush it
        // The renderer will handle section header deduplication
        if (inRawBlock && currentRawBlock.length > 0) {
          document.rawBlocks.push({
            section: currentSection,
            rawContent: currentRawBlock.join('\n'),
            lineNumber: currentRawBlockStartLine,
          });
          currentRawBlock = [];
          inRawBlock = false;
        }
        
        document.entries.push({
          section: currentSection,
          key,
          value,
          isKnown: true,
          leadingComments,
          trailingComment,
        });
      } else {
        // Unknown key - add to raw block
        if (!inRawBlock) {
          currentRawBlockStartLine = i + 1;
          inRawBlock = true;
        }
        if (leadingComments.length > 0) {
          currentRawBlock.push(...leadingComments);
        }
        currentRawBlock.push(line);
      }
      continue;
    }

    // Unrecognized line - add to raw block
    if (!inRawBlock) {
      currentRawBlockStartLine = i + 1;
      inRawBlock = true;
    }
    if (leadingCommentBuffer.length > 0) {
      currentRawBlock.push(...leadingCommentBuffer);
      leadingCommentBuffer = [];
    }
    currentRawBlock.push(line);
  }

  // Flush any remaining raw block
  if (inRawBlock && currentRawBlock.length > 0) {
    document.rawBlocks.push({
      section: currentSection,
      rawContent: currentRawBlock.join('\n'),
      lineNumber: currentRawBlockStartLine,
    });
  }

  // Leading comments at the start of the file
  if (leadingCommentBuffer.length > 0) {
    document.leadingComments = leadingCommentBuffer;
  }

  return document;
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

