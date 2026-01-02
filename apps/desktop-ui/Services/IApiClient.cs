using ArkAsaDesktopUi.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ArkAsaDesktopUi.Services;

public interface IApiClient
{
    string BaseUrl { get; set; }

    // Instance endpoints
    Task<List<InstanceResponseDto>> GetInstancesAsync(string? agentId = null, GameType? gameType = null, InstanceStatus? status = null);
    Task<InstanceResponseDto> GetInstanceAsync(string instanceId);
    Task<InstanceResponseDto> CreateInstanceAsync(InstanceCreateDto dto);
    Task<InstanceResponseDto> UpdateInstanceAsync(string instanceId, InstanceUpdateDto dto);
    Task DeleteInstanceAsync(string instanceId);
    Task<List<LogEntryDto>> GetInstanceLogsAsync(string instanceId, int? limit = null, DateTime? since = null, string? level = null);

    // Job endpoints
    Task<List<JobResponseDto>> GetJobsAsync(string? instanceId = null, JobStatus? status = null);
    Task<JobResponseDto> GetJobAsync(string jobId);
    Task<JobResponseDto> CreateJobAsync(JobCreateDto dto);
    Task CancelJobAsync(string jobId);
}

