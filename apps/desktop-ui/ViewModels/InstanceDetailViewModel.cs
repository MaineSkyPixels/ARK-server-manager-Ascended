using ArkAsaDesktopUi.Models;
using ArkAsaDesktopUi.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;

namespace ArkAsaDesktopUi.ViewModels;

public partial class InstanceDetailViewModel : ViewModelBase
{
    private readonly IApiClient _apiClient;
    private readonly IWebSocketClient _webSocketClient;
    private InstanceResponseDto? _instance;
    private bool _isLoading;
    private string? _errorMessage;
    private int _selectedTabIndex;
    private readonly ObservableCollection<LogEntry> _logs = new();
    private readonly ObservableCollection<JobResponseDto> _jobs = new();

    private readonly INavigationService _navigationService;

    public InstanceDetailViewModel(IApiClient apiClient, IWebSocketClient webSocketClient, INavigationService navigationService)
    {
        _apiClient = apiClient;
        _webSocketClient = webSocketClient;
        _navigationService = navigationService;

        // Subscribe to instance status changes and logs
        _webSocketClient.InstanceStatusChanged += OnInstanceStatusChanged;
        _webSocketClient.InstanceLogReceived += OnInstanceLogReceived;
        
        // Subscribe to job events for this instance
        SubscribeToJobEvents();
    }

    private string _instanceId = string.Empty;
    public string InstanceId
    {
        get => _instanceId;
        set
        {
            if (SetProperty(ref _instanceId, value) && !string.IsNullOrEmpty(value))
            {
                _ = LoadInstanceAsync();
            }
        }
    }

    public InstanceResponseDto? Instance
    {
        get => _instance;
        set => SetProperty(ref _instance, value);
    }

    public bool IsLoading
    {
        get => _isLoading;
        set => SetProperty(ref _isLoading, value);
    }

    public string? ErrorMessage
    {
        get => _errorMessage;
        set => SetProperty(ref _errorMessage, value);
    }

    public int SelectedTabIndex
    {
        get => _selectedTabIndex;
        set
        {
            if (SetProperty(ref _selectedTabIndex, value))
            {
                // Load logs when Logs tab (index 1) is selected
                if (value == 1 && !string.IsNullOrEmpty(InstanceId) && Logs.Count == 0)
                {
                    _ = LoadLogsAsync();
                }
            }
        }
    }

    public ObservableCollection<LogEntry> Logs => _logs;

    public ObservableCollection<JobResponseDto> Jobs => _jobs;

    public async Task LoadInstanceAsync()
    {
        if (string.IsNullOrEmpty(InstanceId))
            return;

        try
        {
            IsLoading = true;
            ErrorMessage = null;

            Instance = await _apiClient.GetInstanceAsync(InstanceId);
            await LoadJobsAsync();
            await LoadLogsAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to load instance: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task RefreshInstanceAsync()
    {
        await LoadInstanceAsync();
    }

    [RelayCommand]
    public async Task LoadJobsAsync()
    {
        if (string.IsNullOrEmpty(InstanceId))
            return;

        try
        {
            var jobs = await _apiClient.GetJobsAsync(instanceId: InstanceId);
            
            Jobs.Clear();
            foreach (var job in jobs.OrderByDescending(j => j.CreatedAt))
            {
                Jobs.Add(job);
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to load jobs: {ex.Message}";
        }
    }

    [RelayCommand]
    public async Task LoadLogsAsync()
    {
        if (string.IsNullOrEmpty(InstanceId))
            return;

        try
        {
            var logs = await _apiClient.GetInstanceLogsAsync(InstanceId, limit: 1000);
            
            Logs.Clear();
            foreach (var log in logs.OrderBy(l => l.Timestamp))
            {
                Logs.Add(new LogEntry
                {
                    Timestamp = log.Timestamp,
                    Level = log.Level,
                    Message = log.Message
                });
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to load logs: {ex.Message}";
        }
    }

    [RelayCommand]
    public async Task StartInstanceAsync()
    {
        if (Instance == null) return;

        try
        {
            var job = await _apiClient.CreateJobAsync(new JobCreateDto
            {
                JobType = JobType.START_INSTANCE,
                InstanceId = Instance.InstanceId,
                Parameters = new()
            });
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to start instance: {ex.Message}";
        }
    }

    [RelayCommand]
    public async Task StopInstanceAsync()
    {
        if (Instance == null) return;

        try
        {
            var job = await _apiClient.CreateJobAsync(new JobCreateDto
            {
                JobType = JobType.STOP_INSTANCE,
                InstanceId = Instance.InstanceId,
                Parameters = new()
            });
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to stop instance: {ex.Message}";
        }
    }

    [RelayCommand]
    public async Task RestartInstanceAsync()
    {
        if (Instance == null) return;

        try
        {
            var job = await _apiClient.CreateJobAsync(new JobCreateDto
            {
                JobType = JobType.RESTART_INSTANCE,
                InstanceId = Instance.InstanceId,
                Parameters = new()
            });
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to restart instance: {ex.Message}";
        }
    }

    private void OnInstanceStatusChanged(object? sender, InstanceStatusChangedData e)
    {
        if (Instance != null && e.InstanceId == Instance.InstanceId)
        {
            Instance = new InstanceResponseDto
            {
                InstanceId = Instance.InstanceId,
                Name = Instance.Name,
                GameType = Instance.GameType,
                Status = e.Status,
                AgentId = Instance.AgentId,
                CreatedAt = Instance.CreatedAt,
                UpdatedAt = e.ChangedAt,
                Config = Instance.Config
            };
        }
    }

    private void OnInstanceLogReceived(object? sender, InstanceLogData e)
    {
        if (Instance != null && e.InstanceId == Instance.InstanceId)
        {
            // Add log entry to the collection
            Logs.Add(new LogEntry
            {
                Timestamp = e.Timestamp,
                Level = e.Level,
                Message = e.Message
            });

            // Limit log entries to prevent memory issues (keep last 10000 entries)
            if (Logs.Count > 10000)
            {
                var toRemove = Logs.Count - 10000;
                for (int i = 0; i < toRemove; i++)
                {
                    Logs.RemoveAt(0);
                }
            }
        }
    }

    // Subscribe to job events for this instance
    private void SubscribeToJobEvents()
    {
        _webSocketClient.JobProgressReceived += OnJobProgressReceived;
        _webSocketClient.JobCompletedReceived += OnJobCompletedReceived;
        _webSocketClient.JobFailedReceived += OnJobFailedReceived;
    }

    private void OnJobProgressReceived(object? sender, JobProgressDto e)
    {
        if (Instance != null && e.JobId != null)
        {
            var job = Jobs.FirstOrDefault(j => j.JobId == e.JobId);
            if (job != null)
            {
                var index = Jobs.IndexOf(job);
                Jobs[index] = new JobResponseDto
                {
                    JobId = job.JobId,
                    JobRunId = e.JobRunId,
                    JobType = job.JobType,
                    Status = e.Status,
                    InstanceId = job.InstanceId,
                    AgentId = job.AgentId,
                    Parameters = job.Parameters,
                    CreatedAt = job.CreatedAt,
                    StartedAt = job.StartedAt,
                    CompletedAt = job.CompletedAt,
                    Error = job.Error,
                    RetryCount = job.RetryCount,
                    ProgressPercent = e.Percent,
                    ProgressMessage = e.Message
                };
            }
        }
    }

    private void OnJobCompletedReceived(object? sender, JobCompletedDto e)
    {
        if (Instance != null && e.JobId != null)
        {
            var job = Jobs.FirstOrDefault(j => j.JobId == e.JobId);
            if (job != null)
            {
                var index = Jobs.IndexOf(job);
                Jobs[index] = new JobResponseDto
                {
                    JobId = job.JobId,
                    JobRunId = e.JobRunId,
                    JobType = job.JobType,
                    Status = JobStatus.COMPLETED,
                    InstanceId = job.InstanceId,
                    AgentId = job.AgentId,
                    Parameters = job.Parameters,
                    CreatedAt = job.CreatedAt,
                    StartedAt = job.StartedAt,
                    CompletedAt = e.CompletedAt,
                    Error = null,
                    RetryCount = job.RetryCount,
                    ProgressPercent = 100,
                    ProgressMessage = "Completed"
                };
            }
        }
    }

    private void OnJobFailedReceived(object? sender, JobFailedDto e)
    {
        if (Instance != null && e.JobId != null)
        {
            var job = Jobs.FirstOrDefault(j => j.JobId == e.JobId);
            if (job != null)
            {
                var index = Jobs.IndexOf(job);
                Jobs[index] = new JobResponseDto
                {
                    JobId = job.JobId,
                    JobRunId = e.JobRunId,
                    JobType = job.JobType,
                    Status = JobStatus.FAILED,
                    InstanceId = job.InstanceId,
                    AgentId = job.AgentId,
                    Parameters = job.Parameters,
                    CreatedAt = job.CreatedAt,
                    StartedAt = job.StartedAt,
                    CompletedAt = e.FailedAt,
                    Error = e.Error,
                    RetryCount = job.RetryCount,
                    ProgressPercent = job.ProgressPercent,
                    ProgressMessage = $"Failed: {e.Error}"
                };
            }
        }
    }

    [RelayCommand]
    public void GoBack()
    {
        _navigationService.NavigateTo("instances");
    }

    public string GetStatusDisplayText(InstanceStatus status) => status switch
    {
        InstanceStatus.STOPPED => "Stopped",
        InstanceStatus.STARTING => "Starting",
        InstanceStatus.RUNNING => "Running",
        InstanceStatus.STOPPING => "Stopping",
        InstanceStatus.ERROR => "Error",
        _ => status.ToString()
    };
}

public class LogEntry
{
    public DateTime Timestamp { get; set; }
    public string Level { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

