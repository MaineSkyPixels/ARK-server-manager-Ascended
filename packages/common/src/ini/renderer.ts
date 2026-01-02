/**
 * INI Renderer
 * 
 * Renders INI documents to strings with deterministic formatting:
 * - Stable section ordering
 * - Consistent key ordering within sections
 * - Preserved comments and whitespace
 * - Minimal diff churn
 */

import { IniDocument, IniEntry, RawIniBlock } from './types';

/**
 * Render an INI document to a string
 * 
 * @param document - Parsed INI document
 * @returns Rendered INI content
 */
export function renderIni(document: IniDocument): string {
  const lines: string[] = [];

  // Add leading comments at the start of the file
  if (document.leadingComments.length > 0) {
    lines.push(...document.leadingComments);
  }

  // Group entries by section
  const entriesBySection = new Map<string, IniEntry[]>();
  for (const entry of document.entries) {
    const section = entry.section;
    if (!entriesBySection.has(section)) {
      entriesBySection.set(section, []);
    }
    entriesBySection.get(section)!.push(entry);
  }

  // Sort sections: empty section first, then alphabetically
  const sections = Array.from(entriesBySection.keys()).sort((a, b) => {
    if (a === '') return -1;
    if (b === '') return 1;
    return a.localeCompare(b);
  });

  // Sort raw blocks by line number to maintain original order
  const sortedRawBlocks = [...document.rawBlocks].sort(
    (a, b) => a.lineNumber - b.lineNumber
  );

  // Track which sections we've rendered
  const renderedSections = new Set<string>();
  let currentSection = '';

  // Render entries and raw blocks in order
  for (const rawBlock of sortedRawBlocks) {
    const blockSection = rawBlock.section;
    const hasEntries = entriesBySection.has(blockSection);

    // If we haven't rendered this section's entries yet, do so now
    if (!renderedSections.has(blockSection) && hasEntries) {
      // Render section header
      if (blockSection !== currentSection) {
        if (currentSection !== '') {
          lines.push('');
        }
        if (blockSection !== '') {
          lines.push(`[${blockSection}]`);
        }
        currentSection = blockSection;
      }

      // Render entries for this section
      const entries = entriesBySection.get(blockSection)!;
      // Sort entries by key for stability
      const sortedEntries = [...entries].sort((a, b) =>
        a.key.localeCompare(b.key)
      );

      for (const entry of sortedEntries) {
        // Add leading comments
        if (entry.leadingComments.length > 0) {
          lines.push(...entry.leadingComments);
        }

        // Render key-value pair
        let line = `${entry.key}=${entry.value}`;
        if (entry.trailingComment) {
          line += ` ${entry.trailingComment}`;
        }
        lines.push(line);
      }

      renderedSections.add(blockSection);
    }

    // Render raw block
    // If this section has entries, the section header was already rendered above
    // So we need to strip the section header from raw content to avoid duplication
    let rawContent = rawBlock.rawContent;
    if (hasEntries && blockSection !== '') {
      // Remove section header from raw content if present
      const sectionHeaderPattern = new RegExp(`^\\[${blockSection.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\s*$`, 'm');
      rawContent = rawContent.replace(sectionHeaderPattern, '').trim();
    }

    // Only render raw block if it has content (after potentially removing header)
    if (rawContent) {
      if (blockSection !== currentSection) {
        if (currentSection !== '') {
          lines.push('');
        }
        currentSection = blockSection;
      }
      lines.push(rawContent);
    }
  }

  // Render any remaining sections that weren't in raw blocks
  for (const section of sections) {
    if (!renderedSections.has(section)) {
      if (currentSection !== '') {
        lines.push('');
      }
      if (section !== '') {
        lines.push(`[${section}]`);
      }
      currentSection = section;

      const entries = entriesBySection.get(section)!;
      const sortedEntries = [...entries].sort((a, b) =>
        a.key.localeCompare(b.key)
      );

      for (const entry of sortedEntries) {
        if (entry.leadingComments.length > 0) {
          lines.push(...entry.leadingComments);
        }

        let line = `${entry.key}=${entry.value}`;
        if (entry.trailingComment) {
          line += ` ${entry.trailingComment}`;
        }
        lines.push(line);
      }

      renderedSections.add(section);
    }
  }

  return lines.join('\n');
}

/**
 * Render a simple key-value map to INI format
 * (Helper for testing and simple cases)
 * 
 * @param data - Map of section -> key -> value
 * @returns Rendered INI content
 */
export function renderSimpleIni(data: Map<string, Map<string, string>>): string {
  const lines: string[] = [];

  const sections = Array.from(data.keys()).sort((a, b) => {
    if (a === '') return -1;
    if (b === '') return 1;
    return a.localeCompare(b);
  });

  for (const section of sections) {
    if (section !== '') {
      lines.push(`[${section}]`);
    }

    const keys = Array.from(data.get(section)!.keys()).sort();
    for (const key of keys) {
      const value = data.get(section)!.get(key)!;
      lines.push(`${key}=${value}`);
    }

    if (section !== sections[sections.length - 1]) {
      lines.push('');
    }
  }

  return lines.join('\n');
}

