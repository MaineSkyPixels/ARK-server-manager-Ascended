using ArkAsaDesktopUi.Models;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;

namespace ArkAsaDesktopUi.Services;

public class ApiClient : IApiClient
{
    private readonly HttpClient _httpClient;
    private readonly JsonSerializerOptions _jsonOptions;

    public string BaseUrl { get; set; }

    public ApiClient(AppConfiguration? config = null)
    {
        BaseUrl = config?.ApiBaseUrl ?? "http://localhost:3000/api";
        _httpClient = new HttpClient();
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    #region Instance Endpoints

    public async Task<List<InstanceResponseDto>> GetInstancesAsync(string? agentId = null, GameType? gameType = null, InstanceStatus? status = null)
    {
        var queryParams = new List<string>();
        if (!string.IsNullOrEmpty(agentId))
            queryParams.Add($"agentId={Uri.EscapeDataString(agentId)}");
        if (gameType.HasValue)
            queryParams.Add($"gameType={gameType.Value}");
        if (status.HasValue)
            queryParams.Add($"status={status.Value}");

        var query = queryParams.Count > 0 ? "?" + string.Join("&", queryParams) : "";
        var response = await _httpClient.GetAsync($"{BaseUrl}/instances{query}");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<InstanceResponseDto>>(_jsonOptions) ?? new List<InstanceResponseDto>();
    }

    public async Task<InstanceResponseDto> GetInstanceAsync(string instanceId)
    {
        var response = await _httpClient.GetAsync($"{BaseUrl}/instances/{Uri.EscapeDataString(instanceId)}");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<InstanceResponseDto>(_jsonOptions) 
            ?? throw new InvalidOperationException("Failed to deserialize instance response");
    }

    public async Task<InstanceResponseDto> CreateInstanceAsync(InstanceCreateDto dto)
    {
        var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/instances", dto, _jsonOptions);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<InstanceResponseDto>(_jsonOptions)
            ?? throw new InvalidOperationException("Failed to deserialize instance response");
    }

    public async Task<InstanceResponseDto> UpdateInstanceAsync(string instanceId, InstanceUpdateDto dto)
    {
        var response = await _httpClient.PutAsJsonAsync($"{BaseUrl}/instances/{Uri.EscapeDataString(instanceId)}", dto, _jsonOptions);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<InstanceResponseDto>(_jsonOptions)
            ?? throw new InvalidOperationException("Failed to deserialize instance response");
    }

    public async Task DeleteInstanceAsync(string instanceId)
    {
        var response = await _httpClient.DeleteAsync($"{BaseUrl}/instances/{Uri.EscapeDataString(instanceId)}");
        response.EnsureSuccessStatusCode();
    }

    public async Task<List<LogEntryDto>> GetInstanceLogsAsync(string instanceId, int? limit = null, DateTime? since = null, string? level = null)
    {
        var queryParams = new List<string>();
        if (limit.HasValue)
            queryParams.Add($"limit={limit.Value}");
        if (since.HasValue)
            queryParams.Add($"since={Uri.EscapeDataString(since.Value.ToString("O"))}");
        if (!string.IsNullOrEmpty(level))
            queryParams.Add($"level={Uri.EscapeDataString(level)}");

        var query = queryParams.Count > 0 ? "?" + string.Join("&", queryParams) : "";
        var response = await _httpClient.GetAsync($"{BaseUrl}/instances/{Uri.EscapeDataString(instanceId)}/logs{query}");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<LogEntryDto>>(_jsonOptions) ?? new List<LogEntryDto>();
    }

    #endregion

    #region Job Endpoints

    public async Task<List<JobResponseDto>> GetJobsAsync(string? instanceId = null, JobStatus? status = null)
    {
        var queryParams = new List<string>();
        if (!string.IsNullOrEmpty(instanceId))
            queryParams.Add($"instanceId={Uri.EscapeDataString(instanceId)}");
        if (status.HasValue)
            queryParams.Add($"status={status.Value}");

        var query = queryParams.Count > 0 ? "?" + string.Join("&", queryParams) : "";
        var response = await _httpClient.GetAsync($"{BaseUrl}/jobs{query}");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<JobResponseDto>>(_jsonOptions) ?? new List<JobResponseDto>();
    }

    public async Task<JobResponseDto> GetJobAsync(string jobId)
    {
        var response = await _httpClient.GetAsync($"{BaseUrl}/jobs/{Uri.EscapeDataString(jobId)}");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<JobResponseDto>(_jsonOptions)
            ?? throw new InvalidOperationException("Failed to deserialize job response");
    }

    public async Task<JobResponseDto> CreateJobAsync(JobCreateDto dto)
    {
        var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/jobs", dto, _jsonOptions);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<JobResponseDto>(_jsonOptions)
            ?? throw new InvalidOperationException("Failed to deserialize job response");
    }

    public async Task CancelJobAsync(string jobId)
    {
        var response = await _httpClient.PostAsync($"{BaseUrl}/jobs/{Uri.EscapeDataString(jobId)}/cancel", null);
        response.EnsureSuccessStatusCode();
    }

    #endregion
}

