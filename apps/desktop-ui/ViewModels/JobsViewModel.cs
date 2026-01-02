using ArkAsaDesktopUi.Models;
using ArkAsaDesktopUi.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;

namespace ArkAsaDesktopUi.ViewModels;

public partial class JobsViewModel : ViewModelBase
{
    private readonly IApiClient _apiClient;
    private readonly IWebSocketClient _webSocketClient;
    private bool _isLoading;
    private string? _errorMessage;

    public JobsViewModel(IApiClient apiClient, IWebSocketClient webSocketClient)
    {
        _apiClient = apiClient;
        _webSocketClient = webSocketClient;
        Jobs = new ObservableCollection<JobResponseDto>();

        // Subscribe to job progress updates
        _webSocketClient.JobProgressReceived += OnJobProgressReceived;
        _webSocketClient.JobCompletedReceived += OnJobCompletedReceived;
        _webSocketClient.JobFailedReceived += OnJobFailedReceived;
        
        // Load jobs on initialization
        _ = LoadJobsAsync();
    }

    public ObservableCollection<JobResponseDto> Jobs { get; }

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

    [RelayCommand]
    public async Task LoadJobsAsync()
    {
        try
        {
            IsLoading = true;
            ErrorMessage = null;

            var jobs = await _apiClient.GetJobsAsync();
            
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
        finally
        {
            IsLoading = false;
        }
    }

    private void OnJobProgressReceived(object? sender, JobProgressDto e)
    {
        var job = Jobs.FirstOrDefault(j => j.JobId == e.JobId);
        if (job != null)
        {
            // Update job status and progress
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

    private void OnJobCompletedReceived(object? sender, JobCompletedDto e)
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

    private void OnJobFailedReceived(object? sender, JobFailedDto e)
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

    public string GetStatusDisplayText(JobStatus status) => status switch
    {
        JobStatus.CREATED => "Created",
        JobStatus.QUEUED => "Queued",
        JobStatus.RUNNING => "Running",
        JobStatus.COMPLETED => "Completed",
        JobStatus.FAILED => "Failed",
        JobStatus.CANCELLED => "Cancelled",
        _ => status.ToString()
    };
}

