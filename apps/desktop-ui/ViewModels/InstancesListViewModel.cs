using ArkAsaDesktopUi.Models;
using ArkAsaDesktopUi.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;

namespace ArkAsaDesktopUi.ViewModels;

public partial class InstancesListViewModel : ViewModelBase
{
    private readonly IApiClient _apiClient;
    private readonly INavigationService _navigationService;
    private bool _isLoading;
    private string? _errorMessage;
    private InstanceResponseDto? _selectedInstance;

    public InstancesListViewModel(IApiClient apiClient, INavigationService navigationService)
    {
        _apiClient = apiClient;
        _navigationService = navigationService;
        Instances = new ObservableCollection<InstanceResponseDto>();
    }

    public ObservableCollection<InstanceResponseDto> Instances { get; }

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

    public InstanceResponseDto? SelectedInstance
    {
        get => _selectedInstance;
        set
        {
            if (SetProperty(ref _selectedInstance, value) && value != null)
            {
                NavigateToDetail(value.InstanceId);
            }
        }
    }

    [RelayCommand]
    public async Task LoadInstancesAsync()
    {
        try
        {
            IsLoading = true;
            ErrorMessage = null;

            var instances = await _apiClient.GetInstancesAsync();
            
            Instances.Clear();
            foreach (var instance in instances)
            {
                Instances.Add(instance);
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to load instances: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    public void NavigateToDetail(string instanceId)
    {
        _navigationService.NavigateToInstanceDetail(instanceId);
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

