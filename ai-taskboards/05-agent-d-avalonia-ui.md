# AGENT D — AVALONIA DESKTOP UI

## Scope
You build the **primary user experience**.
UI must scale from 1 server → 50+ servers.

---

## Responsibilities

### 1. App Shell
- Avalonia
- Responsive layout
- Multi-monitor friendly
- Dark/light theme ready

---

### 2. Navigation
Sections:
- Clusters
- Hosts
- Server Instances
- Settings
- Mods
- Backups
- Jobs
- Logs

---

### 3. Instance View (Tabs)
- Overview
- Console
- Logs (live)
- Settings (registry + raw)
- Mods
- Backups
- Job history

---

### 4. Live Data
- WebSocket subscriptions
- Real-time updates
- Graceful reconnect

---

## Constraints
- UI consumes API only
- NO business logic
- NO direct filesystem access

---

## Acceptance Criteria
- Usable on 1080p → ultrawide
- No blocking UI operations
- Can manage dozens of servers without clutter
