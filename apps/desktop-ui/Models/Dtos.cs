using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ArkAsaDesktopUi.Models;

#region Instance DTOs

public class InstanceCreateDto
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("gameType")]
    public GameType GameType { get; set; }

    [JsonPropertyName("agentId")]
    public string AgentId { get; set; } = string.Empty;

    [JsonPropertyName("config")]
    public Dictionary<string, object>? Config { get; set; }
}

public class InstanceResponseDto
{
    [JsonPropertyName("instanceId")]
    public string InstanceId { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("gameType")]
    public GameType GameType { get; set; }

    [JsonPropertyName("status")]
    public InstanceStatus Status { get; set; }

    [JsonPropertyName("agentId")]
    public string AgentId { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; }

    [JsonPropertyName("config")]
    public Dictionary<string, object>? Config { get; set; }
}

public class InstanceUpdateDto
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("config")]
    public Dictionary<string, object>? Config { get; set; }
}

public class LogEntryDto
{
    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }

    [JsonPropertyName("level")]
    public string Level { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

#endregion

#region Job DTOs

public class JobCreateDto
{
    [JsonPropertyName("jobType")]
    public JobType JobType { get; set; }

    [JsonPropertyName("instanceId")]
    public string? InstanceId { get; set; }

    [JsonPropertyName("parameters")]
    public Dictionary<string, object> Parameters { get; set; } = new();

    [JsonPropertyName("priority")]
    public int? Priority { get; set; }
}

public class JobResponseDto
{
    [JsonPropertyName("jobId")]
    public string JobId { get; set; } = string.Empty;

    [JsonPropertyName("jobRunId")]
    public string JobRunId { get; set; } = string.Empty;

    [JsonPropertyName("jobType")]
    public JobType JobType { get; set; }

    [JsonPropertyName("status")]
    public JobStatus Status { get; set; }

    [JsonPropertyName("instanceId")]
    public string? InstanceId { get; set; }

    [JsonPropertyName("agentId")]
    public string? AgentId { get; set; }

    [JsonPropertyName("parameters")]
    public Dictionary<string, object> Parameters { get; set; } = new();

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("startedAt")]
    public DateTime? StartedAt { get; set; }

    [JsonPropertyName("completedAt")]
    public DateTime? CompletedAt { get; set; }

    [JsonPropertyName("error")]
    public string? Error { get; set; }

    [JsonPropertyName("retryCount")]
    public int RetryCount { get; set; }

    [JsonPropertyName("progressPercent")]
    public int? ProgressPercent { get; set; }

    [JsonPropertyName("progressMessage")]
    public string? ProgressMessage { get; set; }
}

public class JobProgressDto
{
    [JsonPropertyName("jobId")]
    public string JobId { get; set; } = string.Empty;

    [JsonPropertyName("jobRunId")]
    public string JobRunId { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public JobStatus Status { get; set; }

    [JsonPropertyName("percent")]
    public int? Percent { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }
}

#endregion

#region WebSocket Event DTOs

public class WSEvent
{
    [JsonPropertyName("event")]
    public string Event { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public Dictionary<string, object> Data { get; set; } = new();
}

public class WSJobProgressEvent
{
    [JsonPropertyName("event")]
    public string Event { get; set; } = "job:progress";

    [JsonPropertyName("data")]
    public JobProgressDto Data { get; set; } = new();
}

public class WSInstanceStatusChangedEvent
{
    [JsonPropertyName("event")]
    public string Event { get; set; } = "instance:status_changed";

    [JsonPropertyName("data")]
    public InstanceStatusChangedData Data { get; set; } = new();
}

public class InstanceStatusChangedData
{
    [JsonPropertyName("instanceId")]
    public string InstanceId { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public InstanceStatus Status { get; set; }

    [JsonPropertyName("changedAt")]
    public DateTime ChangedAt { get; set; }
}

public class WSInstanceLogEvent
{
    [JsonPropertyName("event")]
    public string Event { get; set; } = "instance:log";

    [JsonPropertyName("data")]
    public InstanceLogData Data { get; set; } = new();
}

public class InstanceLogData
{
    [JsonPropertyName("instanceId")]
    public string InstanceId { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }

    [JsonPropertyName("level")]
    public string Level { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

#endregion

