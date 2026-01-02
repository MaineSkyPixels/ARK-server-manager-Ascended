using ArkAsaDesktopUi.Models;
using System;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace ArkAsaDesktopUi.Services;

public class WebSocketClient : IWebSocketClient
{
    private ClientWebSocket? _webSocket;
    private CancellationTokenSource? _cancellationTokenSource;
    private readonly JsonSerializerOptions _jsonOptions;
    private bool _isConnected;

    public bool IsConnected
    {
        get => _isConnected;
        private set
        {
            if (_isConnected != value)
            {
                _isConnected = value;
                ConnectionStatusChanged?.Invoke(this, value);
            }
        }
    }

    public event EventHandler<bool>? ConnectionStatusChanged;
    public event EventHandler<WSEvent>? EventReceived;
    public event EventHandler<JobProgressDto>? JobProgressReceived;
    public event EventHandler<InstanceStatusChangedData>? InstanceStatusChanged;
    public event EventHandler<InstanceLogData>? InstanceLogReceived;

    public WebSocketClient()
    {
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    public async Task ConnectAsync(string url)
    {
        if (_webSocket?.State == WebSocketState.Open)
        {
            return;
        }

        try
        {
            _webSocket?.Dispose();
            _cancellationTokenSource?.Cancel();
            _cancellationTokenSource?.Dispose();

            _webSocket = new ClientWebSocket();
            _cancellationTokenSource = new CancellationTokenSource();

            await _webSocket.ConnectAsync(new Uri(url), _cancellationTokenSource.Token);
            IsConnected = true;

            // Start receiving messages
            _ = Task.Run(ReceiveLoop, _cancellationTokenSource.Token);
        }
        catch (Exception)
        {
            IsConnected = false;
            throw;
        }
    }

    public async Task DisconnectAsync()
    {
        if (_webSocket?.State == WebSocketState.Open)
        {
            await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
        }

        _cancellationTokenSource?.Cancel();
        _webSocket?.Dispose();
        _cancellationTokenSource?.Dispose();
        IsConnected = false;
    }

    public Task SubscribeAsync(string eventType)
    {
        // For now, we'll receive all events. In the future, we can implement subscription filtering.
        // This would require a protocol change, so we'll note it in change requests if needed.
        return Task.CompletedTask;
    }

    private async Task ReceiveLoop()
    {
        var buffer = new byte[4096];
        var cancellationToken = _cancellationTokenSource?.Token ?? CancellationToken.None;

        while (_webSocket?.State == WebSocketState.Open && !cancellationToken.IsCancellationRequested)
        {
            try
            {
                var result = await _webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), cancellationToken);

                if (result.MessageType == WebSocketMessageType.Text)
                {
                    var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    ProcessMessage(message);
                }
                else if (result.MessageType == WebSocketMessageType.Close)
                {
                    IsConnected = false;
                    break;
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception)
            {
                IsConnected = false;
                // Attempt to reconnect after a delay
                await Task.Delay(5000, cancellationToken);
                // Note: In a production app, you'd want to implement exponential backoff
                // and a max retry limit
            }
        }
    }

    private void ProcessMessage(string message)
    {
        try
        {
            var jsonDoc = JsonDocument.Parse(message);
            if (!jsonDoc.RootElement.TryGetProperty("event", out var eventElement))
                return;

            var eventName = eventElement.GetString();
            if (string.IsNullOrEmpty(eventName))
                return;

            // Parse event based on type
            switch (eventName)
            {
                case "job:progress":
                    var jobProgress = JsonSerializer.Deserialize<JobProgressDto>(message, _jsonOptions);
                    if (jobProgress != null)
                    {
                        JobProgressReceived?.Invoke(this, jobProgress);
                    }
                    break;

                case "instance:status_changed":
                    var statusChanged = JsonSerializer.Deserialize<WSInstanceStatusChangedEvent>(message, _jsonOptions);
                    if (statusChanged?.Data != null)
                    {
                        InstanceStatusChanged?.Invoke(this, statusChanged.Data);
                    }
                    break;

                case "instance:log":
                    var logEvent = JsonSerializer.Deserialize<WSInstanceLogEvent>(message, _jsonOptions);
                    if (logEvent?.Data != null)
                    {
                        InstanceLogReceived?.Invoke(this, logEvent.Data);
                    }
                    break;
            }

            // Emit generic event
            var wsEvent = JsonSerializer.Deserialize<WSEvent>(message, _jsonOptions);
            if (wsEvent != null)
            {
                EventReceived?.Invoke(this, wsEvent);
            }
        }
        catch (Exception)
        {
            // Log error in production
        }
    }
}

