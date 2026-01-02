# ARK ASA Desktop UI

Avalonia-based desktop application for managing ARK Survival Ascended server instances.

## Overview

This is a cross-platform desktop UI built with Avalonia UI that provides a modern interface for managing ARK server instances. The UI follows MVVM architecture and communicates with the control plane via REST API and WebSocket.

## Features

- **Instance Management**: View, create, update, and manage server instances
- **Real-time Updates**: WebSocket integration for live status updates
- **Job Tracking**: Monitor job progress and history
- **Responsive Design**: Scales from 1080p to ultrawide monitors
- **MVVM Architecture**: Clean separation of concerns

## Requirements

- .NET 8.0 SDK or later
- Windows 10+ or Windows Server 2019+
- Control plane API running (default: `http://localhost:3000/api`)

## Building

```bash
dotnet restore
dotnet build
```

## Running

```bash
dotnet run
```

## Project Structure

```
apps/desktop-ui/
├── Models/              # DTOs and enums matching contracts
├── Services/           # API client, WebSocket client, Navigation
├── ViewModels/         # MVVM view models
├── Views/              # Avalonia XAML views
├── App.axaml           # Application definition
├── MainWindow.axaml    # Main window with navigation
└── Program.cs          # Entry point
```

## Configuration

Currently, the API base URL is hardcoded in `Services/ApiClient.cs`. To change it:

```csharp
public string BaseUrl { get; set; } = "http://your-api-url/api";
```

Future versions will support configuration files.

## Architecture

- **MVVM Pattern**: Using CommunityToolkit.Mvvm for view models
- **Dependency Injection**: Microsoft.Extensions.DependencyInjection
- **Navigation**: Custom NavigationService for route-based navigation
- **API Client**: Typed HTTP client matching contracts
- **WebSocket Client**: Real-time event streaming

## See Also

- [HANDOFF.md](./HANDOFF.md) - Detailed handoff documentation
- [Change Requests](../../ai-taskboards/docs/change_requests.md) - API change requests

