# Agent D (Desktop UI) - Implementation Guidance

## Overview
This document provides implementation guidance for Agent D based on code review recommendations and architectural requirements.

## Priority 1: WebSocket Integration

### Current Status
- ✅ API client implemented (`Services/ApiClient.cs`)
- ❌ No WebSocket client implementation
- ❌ No real-time updates for jobs/instances

### Required Implementation

#### 1. WebSocket Client Service
**Location**: `Services/WebSocketClient.cs`

**Requirements**:
- Connect to control plane WebSocket endpoint (`ws://localhost:3000/ws`)
- Handle connection lifecycle (connect, disconnect, reconnect)
- Subscribe to events:
  - `job:progress` - Job progress updates
  - `job:completed` - Job completion
  - `job:failed` - Job failure
  - `job:cancelled` - Job cancellation
  - `instance:log` - Instance log entries
  - `instance:status` - Instance status changes
- Parse WebSocket messages (JSON format)
- Emit events to UI components via C# events or reactive streams

**Example Structure**:
```csharp
public class WebSocketClient : IDisposable
{
    public event EventHandler<JobProgressEventArgs> JobProgress;
    public event EventHandler<InstanceLogEventArgs> InstanceLog;
    
    public async Task ConnectAsync(string url);
    public async Task DisconnectAsync();
    private void HandleMessage(string message);
}
```

#### 2. Real-Time Updates in UI
**Location**: Update ViewModels to subscribe to WebSocket events

**Requirements**:
- Update job progress bars in real-time
- Show instance logs as they arrive
- Update instance status indicators
- Show toast notifications for job completion/failure

### Implementation Notes

1. **Reconnection Logic**:
   - Auto-reconnect on disconnect (exponential backoff)
   - Show connection status indicator in UI
   - Queue messages during disconnection

2. **Message Parsing**:
   - Use `System.Text.Json` for JSON parsing
   - Map WebSocket event types to C# event types
   - Handle unknown event types gracefully

3. **Threading**:
   - WebSocket operations on background thread
   - UI updates on main thread (use dispatcher)

## Priority 2: Instance Management UI

### Current Status
- ✅ Basic instance list view
- ❌ No instance creation form
- ❌ No instance details view
- ❌ No instance logs view

### Required Implementation

#### 1. Instance Creation Form
**Location**: `Views/InstanceCreateView.axaml` / `ViewModels/InstanceCreateViewModel.cs`

**Requirements**:
- Form fields:
  - Instance name (required, validated)
  - Game type (ASA/ASE dropdown)
  - Agent selection (dropdown of available agents)
  - Optional: Initial configuration
- Validation:
  - Name must be unique
  - Agent must be online
- Submit creates instance via API
- Show loading state during creation
- Navigate to instance details on success

#### 2. Instance Details View
**Location**: `Views/InstanceDetailsView.axaml` / `ViewModels/InstanceDetailsViewModel.cs`

**Requirements**:
- Display instance information:
  - Name, game type, status
  - Agent assignment
  - Created/updated timestamps
- Action buttons:
  - Start instance
  - Stop instance
  - Restart instance
  - Create backup
  - Restore backup
  - Delete instance
- Real-time status updates via WebSocket
- Show active jobs for this instance

#### 3. Instance Logs View
**Location**: `Views/InstanceLogsView.axaml` / `ViewModels/InstanceLogsViewModel.cs`

**Requirements**:
- Display log entries in scrollable list
- Filter by log level (INFO, WARN, ERROR, DEBUG)
- Auto-refresh via WebSocket (`instance:log` events)
- Color-code by log level
- Timestamp formatting
- Search/filter functionality

### Implementation Notes

1. **MVVM Pattern**:
   - ViewModels should use `INotifyPropertyChanged`
   - Use commands for button actions (`ICommand`)
   - Bind UI to ViewModel properties

2. **Error Handling**:
   - Show error dialogs for API failures
   - Display validation errors inline
   - Handle network errors gracefully

3. **Loading States**:
   - Show loading indicators during API calls
   - Disable buttons during operations
   - Show progress for long-running operations

## Priority 3: Job Management UI

### Current Status
- ✅ Basic job list view
- ❌ No job details view
- ❌ No job creation UI

### Required Implementation

#### 1. Job Details View
**Location**: `Views/JobDetailsView.axaml` / `ViewModels/JobDetailsViewModel.cs`

**Requirements**:
- Display job information:
  - Job type, status, progress
  - Associated instance
  - Created/started/completed timestamps
  - Error details if failed
- Progress bar with percentage
- Progress message display
- Real-time updates via WebSocket
- Cancel button (if job is running)

#### 2. Job Creation UI
**Location**: Integrate into instance details view or separate dialog

**Requirements**:
- Create job from instance context:
  - Start/Stop/Restart instance jobs
  - Backup creation/restore jobs
- Show job parameters form
- Submit via API
- Show created job in job list

## Priority 4: UI/UX Improvements

### Current Status
- ⚠️ Basic UI, needs polish

### Required Improvements

1. **Visual Design**:
   - Consistent color scheme
   - Better spacing and layout
   - Icons for actions and statuses
   - Loading animations

2. **User Feedback**:
   - Toast notifications for job completion
   - Confirmation dialogs for destructive actions
   - Success/error messages
   - Tooltips for actions

3. **Navigation**:
   - Breadcrumb navigation
   - Back button support
   - Deep linking to instances/jobs

4. **Responsive Design**:
   - Handle window resizing
   - Responsive layouts for different screen sizes

## Priority 5: Error Handling

### Current Status
- ⚠️ Basic error handling

### Required Improvements

1. **Global Error Handler**:
   - Catch unhandled exceptions
   - Log errors
   - Show user-friendly error messages

2. **API Error Handling**:
   - Parse API error responses
   - Display validation errors
   - Handle network errors
   - Retry logic for transient failures

3. **WebSocket Error Handling**:
   - Handle connection failures
   - Handle message parsing errors
   - Show connection status

## File Structure

```
apps/desktop-ui/
├── Services/
│   ├── ApiClient.cs (update)
│   └── WebSocketClient.cs (NEW)
├── Views/
│   ├── InstanceCreateView.axaml (NEW)
│   ├── InstanceDetailsView.axaml (NEW)
│   ├── InstanceLogsView.axaml (NEW)
│   ├── JobDetailsView.axaml (NEW)
│   └── ... (existing views)
├── ViewModels/
│   ├── InstanceCreateViewModel.cs (NEW)
│   ├── InstanceDetailsViewModel.cs (NEW)
│   ├── InstanceLogsViewModel.cs (NEW)
│   ├── JobDetailsViewModel.cs (NEW)
│   └── ... (existing view models)
├── Models/
│   ├── JobProgressEventArgs.cs (NEW)
│   ├── InstanceLogEventArgs.cs (NEW)
│   └── ... (existing models)
└── Utils/
    └── ErrorHandler.cs (NEW)
```

## Dependencies

Add these NuGet packages if needed:
- `System.Net.WebSockets.Client` - WebSocket client
- `System.Text.Json` - JSON parsing
- `ReactiveUI` (optional) - Reactive programming

## Integration Points

1. **Control Plane API**:
   - Use `ApiClient` for all HTTP requests
   - Use `WebSocketClient` for real-time updates

2. **Contracts**:
   - Use DTOs from `@ark-asa/contracts` (generate C# types if needed)
   - Use enums: `JobType`, `JobStatus`, `InstanceStatus`, `GameType`

3. **WebSocket Protocol**:
   - Follow protocol defined in `docs/websocket_protocol.md`
   - Handle all event types defined in contracts

## Testing Checklist

- [ ] WebSocket connects successfully
- [ ] WebSocket receives job progress events
- [ ] WebSocket receives instance log events
- [ ] WebSocket reconnects on disconnect
- [ ] Instance creation form validates input
- [ ] Instance creation succeeds
- [ ] Instance details view displays correctly
- [ ] Instance logs view shows logs
- [ ] Job details view shows progress
- [ ] UI updates in real-time
- [ ] Error messages display correctly
- [ ] Loading states work correctly

## Next Steps

1. Implement WebSocket client service
2. Create instance creation form
3. Create instance details view
4. Create instance logs view
5. Integrate WebSocket events into UI
6. Add job details view
7. Improve error handling
8. Polish UI/UX

