namespace ArkAsaDesktopUi.Models;

/// <summary>
/// Game Type Enum - CRITICAL: Every instance MUST specify gameType = ASA | ASE
/// </summary>
public enum GameType
{
    ASA,
    ASE
}

/// <summary>
/// Job Status Enum - Represents the lifecycle state of a job
/// </summary>
public enum JobStatus
{
    CREATED,
    QUEUED,
    RUNNING,
    COMPLETED,
    FAILED,
    CANCELLED
}

/// <summary>
/// Standard Job Types - All job types must be idempotent and retryable
/// </summary>
public enum JobType
{
    INSTALL_SERVER,
    UPDATE_SERVER,
    START_INSTANCE,
    STOP_INSTANCE,
    RESTART_INSTANCE,
    BACKUP_INSTANCE,
    VERIFY_BACKUP,
    RESTORE_BACKUP,
    PRUNE_BACKUPS,
    SYNC_MODS,
    ACTIVATE_BUILD
}

/// <summary>
/// Agent Status Enum - Represents the registration and health state of an agent
/// </summary>
public enum AgentStatus
{
    OFFLINE,
    REGISTERING,
    ONLINE,
    DEGRADED
}

/// <summary>
/// Instance Status Enum - Represents the runtime state of a server instance
/// </summary>
public enum InstanceStatus
{
    STOPPED,
    STARTING,
    RUNNING,
    STOPPING,
    ERROR
}

