# AGENT C — SETTINGS / INI / TEMPLATE ENGINE

## Scope
You build the **most critical subsystem**.
This must survive ASA updates for years.

---

## Responsibilities

### 1. Settings Registry
- Store known ASA settings
- Type validation
- UI metadata
- Version tracking

---

### 2. INI Engine
- Parse INI files
- Preserve unknown keys
- Stable round-trip rendering
- Minimal diffs

---

### 3. Mod Template System
- Paste full INI blocks
- Variable substitution
- Assign to mods / instances
- Human-readable diffs

---

### 4. Profiles & Inheritance
- Base → profile → instance override
- Predictable precedence
- Rollback support

---

## Constraints
- NO hardcoded settings
- NO assumptions about ASA versions
- Unknown keys must persist

---

## Acceptance Criteria
- New ASA setting works without code change
- Users can copy/paste entire INIs safely
- Rollback restores exact prior state
