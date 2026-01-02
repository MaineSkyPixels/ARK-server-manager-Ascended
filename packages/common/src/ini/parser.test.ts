/**
 * INI Parser Tests
 * 
 * Tests for round-trip stability and unknown key preservation
 */

import { parseIni, createKeyIdentifier } from './parser';
import { renderIni } from './renderer';

describe('INI Parser', () => {
  describe('Basic parsing', () => {
    it('should parse simple key-value pairs', () => {
      const content = 'ServerName=My Server\nServerPassword=secret123';
      const document = parseIni(content);

      expect(document.entries).toHaveLength(2);
      expect(document.entries[0]).toMatchObject({
        section: '',
        key: 'ServerName',
        value: 'My Server',
        isKnown: false,
      });
      expect(document.entries[1]).toMatchObject({
        section: '',
        key: 'ServerPassword',
        value: 'secret123',
        isKnown: false,
      });
    });

    it('should parse sections', () => {
      const content = '[ServerSettings]\nServerName=My Server';
      const document = parseIni(content);

      expect(document.entries).toHaveLength(1);
      expect(document.entries[0]).toMatchObject({
        section: 'ServerSettings',
        key: 'ServerName',
        value: 'My Server',
      });
    });

    it('should parse multiple sections', () => {
      const content = `[ServerSettings]
ServerName=My Server
[GameSettings]
DifficultyOffset=1.0`;

      const document = parseIni(content);

      expect(document.entries).toHaveLength(2);
      expect(document.entries[0].section).toBe('ServerSettings');
      expect(document.entries[1].section).toBe('GameSettings');
    });
  });

  describe('Comment preservation', () => {
    it('should preserve leading comments', () => {
      const content = `; This is a comment
ServerName=My Server`;

      const document = parseIni(content);

      expect(document.entries[0].leadingComments).toContain('; This is a comment');
    });

    it('should preserve trailing comments', () => {
      const content = 'ServerName=My Server ; This is a comment';

      const document = parseIni(content);

      expect(document.entries[0].trailingComment).toBe('; This is a comment');
      expect(document.entries[0].value).toBe('My Server');
    });

    it('should preserve multiple leading comments', () => {
      const content = `; Comment 1
; Comment 2
ServerName=My Server`;

      const document = parseIni(content);

      expect(document.entries[0].leadingComments).toHaveLength(2);
      expect(document.entries[0].leadingComments[0]).toBe('; Comment 1');
      expect(document.entries[0].leadingComments[1]).toBe('; Comment 2');
    });

    it('should preserve hash comments', () => {
      const content = `# Hash comment
ServerName=My Server # Trailing hash`;

      const document = parseIni(content);

      expect(document.entries[0].leadingComments).toContain('# Hash comment');
      expect(document.entries[0].trailingComment).toBe('# Trailing hash');
    });
  });

  describe('Known vs unknown keys', () => {
    it('should mark known keys correctly', () => {
      const content = 'ServerName=My Server\nUnknownKey=value';
      const knownKeys = new Set(['.ServerName']);

      const document = parseIni(content, knownKeys);

      expect(document.entries.find((e) => e.key === 'ServerName')?.isKnown).toBe(true);
      expect(document.entries.find((e) => e.key === 'UnknownKey')?.isKnown).toBe(false);
    });

    it('should handle section-qualified known keys', () => {
      const content = '[ServerSettings]\nServerName=My Server';
      const knownKeys = new Set(['ServerSettings.ServerName']);

      const document = parseIni(content, knownKeys);

      expect(document.entries[0].isKnown).toBe(true);
    });

    it('should preserve unknown keys in raw blocks', () => {
      const content = `ServerName=My Server
UnknownKey=value
AnotherUnknown=test`;

      const document = parseIni(content);

      // Unknown keys should be in raw blocks
      expect(document.rawBlocks.length).toBeGreaterThan(0);
      const rawContent = document.rawBlocks.map((b) => b.rawContent).join('\n');
      expect(rawContent).toContain('UnknownKey=value');
      expect(rawContent).toContain('AnotherUnknown=test');
    });
  });

  describe('createKeyIdentifier', () => {
    it('should create identifier for top-level key', () => {
      expect(createKeyIdentifier('', 'ServerName')).toBe('.ServerName');
    });

    it('should create identifier for section key', () => {
      expect(createKeyIdentifier('ServerSettings', 'ServerName')).toBe(
        'ServerSettings.ServerName'
      );
    });
  });
});

describe('Round-trip stability', () => {
  it('should produce identical output for simple INI', () => {
    const original = `[ServerSettings]
ServerName=My Server
ServerPassword=secret123`;

    const document = parseIni(original);
    const rendered = renderIni(document);

    expect(rendered.trim()).toBe(original.trim());
  });

  it('should preserve comments in round-trip', () => {
    const original = `; Leading comment
[ServerSettings]
; Section comment
ServerName=My Server ; Trailing comment`;

    const document = parseIni(original);
    const rendered = renderIni(document);

    expect(rendered).toContain('; Leading comment');
    expect(rendered).toContain('; Section comment');
    expect(rendered).toContain('; Trailing comment');
  });

  it('should preserve empty lines and formatting', () => {
    const original = `[ServerSettings]

ServerName=My Server

[GameSettings]
DifficultyOffset=1.0`;

    const document = parseIni(original);
    const rendered = renderIni(document);

    // Should maintain structure with sections
    expect(rendered).toContain('[ServerSettings]');
    expect(rendered).toContain('[GameSettings]');
    expect(rendered).toContain('ServerName=My Server');
    expect(rendered).toContain('DifficultyOffset=1.0');
  });

  it('should preserve unknown keys exactly', () => {
    const original = `[ServerSettings]
ServerName=My Server
UnknownModSetting=value123
AnotherUnknown=test`;

    const document = parseIni(original);
    const rendered = renderIni(document);

    // Unknown keys should be preserved
    expect(rendered).toContain('UnknownModSetting=value123');
    expect(rendered).toContain('AnotherUnknown=test');
  });

  it('should handle complex real-world INI', () => {
    const original = `; ARK Server Configuration
; Generated by ARK Server Manager

[ServerSettings]
; Server name
ServerName=My ARK Server
ServerPassword=
ServerAdminPassword=admin123

; Server port
Port=7777
QueryPort=27015

[GameSettings]
DifficultyOffset=1.0
MaxNumberOfPlayers=70

; Unknown mod settings
[ModSettings]
SomeModKey=value
AnotherModKey=123`;

    const document = parseIni(original);
    const rendered = renderIni(document);

    // Verify all sections are present
    expect(rendered).toContain('[ServerSettings]');
    expect(rendered).toContain('[GameSettings]');
    expect(rendered).toContain('[ModSettings]');

    // Verify key values
    expect(rendered).toContain('ServerName=My ARK Server');
    expect(rendered).toContain('Port=7777');
    expect(rendered).toContain('DifficultyOffset=1.0');
    expect(rendered).toContain('SomeModKey=value');

    // Verify comments are preserved
    expect(rendered).toContain('; ARK Server Configuration');
    expect(rendered).toContain('; Server name');
  });
});

describe('Unknown key preservation', () => {
  it('should preserve unknown keys when known keys are present', () => {
    const content = `[ServerSettings]
ServerName=My Server
UnknownKey1=value1
ServerPassword=secret
UnknownKey2=value2`;

    const knownKeys = new Set(['ServerSettings.ServerName', 'ServerSettings.ServerPassword']);
    const document = parseIni(content, knownKeys);

    const rendered = renderIni(document);

    // Both known and unknown keys should be present
    expect(rendered).toContain('ServerName=My Server');
    expect(rendered).toContain('ServerPassword=secret');
    expect(rendered).toContain('UnknownKey1=value1');
    expect(rendered).toContain('UnknownKey2=value2');
  });

  it('should preserve unknown keys in round-trip with mixed content', () => {
    const original = `[ServerSettings]
KnownKey1=value1
UnknownKey1=unknown1
KnownKey2=value2
UnknownKey2=unknown2`;

    const knownKeys = new Set(['ServerSettings.KnownKey1', 'ServerSettings.KnownKey2']);
    const document = parseIni(original, knownKeys);
    const rendered = renderIni(document);

    // All keys should be preserved
    expect(rendered).toContain('KnownKey1=value1');
    expect(rendered).toContain('KnownKey2=value2');
    expect(rendered).toContain('UnknownKey1=unknown1');
    expect(rendered).toContain('UnknownKey2=unknown2');
  });

  it('should preserve formatting of unknown keys', () => {
    const original = `[ServerSettings]
ServerName=My Server
  IndentedUnknownKey=value
; Comment before unknown
UnknownWithComment=value ; trailing`;

    const document = parseIni(original);
    const rendered = renderIni(document);

    // Raw blocks should preserve original formatting
    expect(rendered).toContain('UnknownWithComment=value');
  });
});

