using ArkAsaDesktopUi.Models;
using System;
using System.Threading.Tasks;

namespace ArkAsaDesktopUi.Services;

public interface IWebSocketClient
{
    bool IsConnected { get; }
    event EventHandler<bool> ConnectionStatusChanged;
    event EventHandler<WSEvent> EventReceived;
    event EventHandler<JobProgressDto> JobProgressReceived;
    event EventHandler<InstanceStatusChangedData> InstanceStatusChanged;
    event EventHandler<InstanceLogData> InstanceLogReceived;

    Task ConnectAsync(string url);
    Task DisconnectAsync();
    Task SubscribeAsync(string eventType);
}

