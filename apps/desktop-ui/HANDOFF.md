# Desktop UI Handoff — First Milestone

**Agent D: Avalonia Desktop UI**

---

## ✅ Completed Deliverables

### 1. Avalonia App Skeleton (MVVM)
- ✅ Project structure with `.csproj` file
- ✅ MVVM pattern using CommunityToolkit.Mvvm
- ✅ Dependency injection setup with Microsoft.Extensions.DependencyInjection
- ✅ App.axaml and MainWindow.axaml with proper initialization

### 2. App Shell
- ✅ Left navigation panel (250px width, responsive)
- ✅ Main content region
- ✅ Connection status indicator (WebSocket)
- ✅ Navigation menu with icons
- ✅ Responsive layout (min 1280x720, default 1920x1080)

### 3. Navigation & Routing
- ✅ `NavigationService` implementation
- ✅ Route-based navigation
- ✅ Instance detail navigation with parameter passing

### 4. Pages Implemented
- ✅ **Instances List Page**: DataGrid with instance listing, refresh button
- ✅ **Instance Detail Page**: Tabbed interface with:
  - Overview tab (instance details)
  - Logs tab (placeholder with DataGrid)
  - Jobs tab (job history for instance)
- ✅ **Jobs Page**: Global jobs view with progress tracking

### 5. API Client Scaffolding
- ✅ Typed `ApiClient` implementing `IApiClient`
- ✅ All instance endpoints (GET, POST, PUT, DELETE)
- ✅ All job endpoints (GET, POST, CANCEL)
- ✅ Proper error handling and async/await patterns
- ✅ JSON serialization with camelCase naming

### 6. WebSocket Client Scaffolding
- ✅ `WebSocketClient` implementing `IWebSocketClient`
- ✅ Connection status tracking
- ✅ Event parsing and routing
- ✅ Reconnect logic (basic - 5 second delay)
- ✅ Event handlers for:
  - `job:progress`
  - `instance:status_changed`
  - Generic event handler

### 7. ViewModels
- ✅ `MainWindowViewModel`: Navigation and connection status
- ✅ `InstancesListViewModel`: Instance listing with auto-load
- ✅ `InstanceDetailViewModel`: Instance details with action commands
- ✅ `JobsViewModel`: Global jobs view with WebSocket updates

### 8. Models
- ✅ C# DTOs matching TypeScript contracts:
  - Instance DTOs (Create, Response, Update)
  - Job DTOs (Create, Response, Progress)
  - WebSocket Event DTOs
- ✅ Enums matching contracts (GameType, JobStatus, InstanceStatus, etc.)

---

## 🚀 How to Run

### Prerequisites
- .NET 8.0 SDK or later
- Windows 10+ or Windows Server 2019+
- Control plane API running (default: `http://localhost:3000/api`)

### Build & Run
```bash
cd apps/desktop-ui
dotnet restore
dotnet build
dotnet run
```

### Configuration
The API base URL is hardcoded in `ApiClient.cs`:
```csharp
public string BaseUrl { get; set; } = "http://localhost:3000/api";
```

To change it, modify the `BaseUrl` property or add configuration support.

### WebSocket Connection
The WebSocket URL is not yet configured. You'll need to:
1. Set the WebSocket URL in `MainWindowViewModel` or `App.axaml.cs`
2. Call `_webSocketClient.ConnectAsync("ws://localhost:3000/ws")` on startup

---

## 📡 Expected API Endpoints

The UI expects the following REST endpoints:

### Instances
- `GET /api/instances` - List instances (query params: `agentId`, `gameType`, `status`)
- `GET /api/instances/{instanceId}` - Get instance details
- `POST /api/instances` - Create instance (body: `InstanceCreateDto`)
- `PUT /api/instances/{instanceId}` - Update instance (body: `InstanceUpdateDto`)
- `DELETE /api/instances/{instanceId}` - Delete instance

### Jobs
- `GET /api/jobs` - List jobs (query params: `instanceId`, `status`)
- `GET /api/jobs/{jobId}` - Get job details
- `POST /api/jobs` - Create job (body: `JobCreateDto`)
- `POST /api/jobs/{jobId}/cancel` - Cancel job

### WebSocket Events
The UI subscribes to these WebSocket events:
- `job:progress` - Job progress updates
- `instance:status_changed` - Instance status changes
- `job:created`, `job:completed`, `job:failed`, `job:cancelled`
- `instance:created`, `instance:updated`, `instance:deleted`

---

## ⚠️ Missing API Shapes / Change Requests

### CR-002: Instance Logs Endpoint

**Requested by:** Agent D (Avalonia Desktop UI)

**Date:** 2024-01-XX

**Type:** API Endpoint

**Description:**
The instance detail page has a Logs tab, but there's no endpoint to fetch instance logs. The UI needs to display live logs for server instances.

**Required Endpoint:**

1. **GET /instances/{instanceId}/logs**
   - Purpose: Fetch log entries for an instance
   - Query Parameters:
     - `limit` (optional, default: 100) - Number of log entries to return
     - `since` (optional) - ISO 8601 timestamp to fetch logs since
     - `level` (optional) - Filter by log level (INFO, WARN, ERROR, etc.)
   - Response: Array of log entries
   ```typescript
   interface LogEntryDto {
     timestamp: string; // ISO 8601
     level: string;
     message: string;
   }
   ```

2. **WebSocket Event: `instance:log`**
   - Purpose: Stream new log entries in real-time
   - Payload:
   ```typescript
   {
     event: "instance:log",
     data: {
       instanceId: string;
       timestamp: string;
       level: string;
       message: string;
     }
   }
   ```

**Contract References:**
- Should be added to `packages/contracts/src/dto/instance.dto.ts`

**Implementation Notes:**
- Endpoint should be added to `apps/control-plane/src/instances/instances.controller.ts`
- WebSocket event should be emitted when new log entries are available
- Logs should be stored/retrieved from the database or log aggregation system

**Status:** Pending approval from Integration Lead / Agent A

---

### CR-003: WebSocket Connection Endpoint

**Requested by:** Agent D (Avalonia Desktop UI)

**Date:** 2024-01-XX

**Type:** WebSocket Protocol

**Description:**
The UI needs to connect to a WebSocket endpoint to receive real-time updates. The endpoint and connection protocol need to be defined.

**Required:**

1. **WebSocket Endpoint: `ws://{host}:{port}/ws`**
   - Purpose: Real-time event streaming
   - Authentication: TBD (may need auth token in query string or header)
   - Protocol: JSON messages

2. **Connection Flow:**
   - Client connects to `/ws`
   - Server sends welcome message (optional)
   - Client can subscribe to specific event types (optional - currently receives all)
   - Server streams events as they occur

3. **Message Format:**
   ```json
   {
     "event": "event:name",
     "data": { ... }
   }
   ```

**Contract References:**
- WebSocket events are already defined in `packages/contracts/src/ws-events.ts`
- Need to document the connection protocol in a new doc or update existing docs

**Implementation Notes:**
- Should be implemented in `apps/control-plane/src/` (WebSocket gateway)
- Need to handle reconnection gracefully
- Should support multiple concurrent clients

**Status:** Pending approval from Integration Lead / Agent A

---

### CR-004: Job Progress Details

**Requested by:** Agent D (Avalonia Desktop UI)

**Date:** 2024-01-XX

**Type:** API Response Enhancement

**Description:**
The UI displays job progress, but the `JobResponseDto` doesn't include progress percentage or current status message. These are available in `JobProgressDto` but only via WebSocket events.

**Required:**

1. **Enhance `JobResponseDto`** to include:
   ```typescript
   interface JobResponseDto {
     // ... existing fields ...
     progressPercent?: number; // 0-100, current progress
     progressMessage?: string; // Current status message
   }
   ```

**Contract References:**
- ✅ Updated in `packages/contracts/src/dto/job.dto.ts`
- ✅ UI updated to support these fields in `JobResponseDto` model
- ✅ UI displays progress percentage and message in job lists

**Implementation Notes:**
- Control plane should populate these fields from the latest `JobProgressDto` when returning job details
- Should be optional fields to maintain backward compatibility
- UI will display progress percentage and message when available

**Status:** ✅ **APPROVED** - Contract updated, UI ready, pending control plane implementation

---

## 🎨 UI Features Implemented

### Responsive Design
- ✅ Minimum window size: 1280x720
- ✅ Default window size: 1920x1080
- ✅ Left nav: Fixed 250px width (min 200px)
- ✅ Main content: Flexible width

### Error Handling
- ✅ Error message display in all pages
- ✅ Loading indicators
- ✅ Empty states for lists

### Real-time Updates
- ✅ WebSocket connection status indicator
- ✅ Job progress updates via WebSocket
- ✅ Instance status changes via WebSocket

### Data Display
- ✅ Virtualized DataGrids for long lists (Avalonia DataGrid handles virtualization)
- ✅ Formatted timestamps
- ✅ Status indicators

---

## 🔧 Known Limitations

1. **Logs Tab**: Currently shows empty DataGrid. Needs CR-002 to be implemented.
2. **WebSocket Reconnect**: Basic 5-second delay reconnect. Should implement exponential backoff.
3. **Configuration**: API URL is hardcoded. Should use appsettings.json or environment variables.
4. **Authentication**: Not implemented. Will need auth tokens when auth is added.
5. **Theming**: Uses default Fluent theme. Dark/light theme switching not yet implemented.
6. **Telemetry**: Telemetry snapshot events not yet handled (defined in contracts but not subscribed).

---

## 📝 Next Steps

1. **Implement missing endpoints** (CR-002, CR-003, CR-004)
2. **Add configuration file** for API/WebSocket URLs
3. **Implement authentication** when auth system is ready
4. **Add dark/light theme switching**
5. **Enhance WebSocket reconnect** with exponential backoff
6. **Add telemetry display** (CPU, memory, disk usage)
7. **Implement remaining pages** (Clusters, Hosts, Settings, Mods, Backups)

---

## 📦 Dependencies

- Avalonia 11.0.5
- Avalonia.ReactiveUI 11.0.5
- CommunityToolkit.Mvvm 8.2.2
- System.Text.Json 8.0.0
- System.Net.WebSockets.Client 4.3.2
- Microsoft.Extensions.DependencyInjection (built-in)

---

## 🐛 Troubleshooting

### UI doesn't connect to API
- Check that control plane is running on `http://localhost:3000`
- Check API base URL in `ApiClient.cs`
- Check firewall/network settings

### WebSocket connection fails
- Ensure WebSocket endpoint is available
- Check WebSocket URL configuration
- Check CORS settings if applicable

### Build errors
- Ensure .NET 8.0 SDK is installed
- Run `dotnet restore` to restore packages
- Check that all NuGet packages are compatible

---

**Status:** ✅ First milestone complete. Ready for API integration testing.

