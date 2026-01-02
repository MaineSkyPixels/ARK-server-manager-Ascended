using ArkAsaDesktopUi.ViewModels;
using ArkAsaDesktopUi.Views;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace ArkAsaDesktopUi.Services;

public class NavigationService : INavigationService
{
    private readonly IServiceProvider _serviceProvider;
    private object? _currentPage;

    public object? CurrentPage
    {
        get => _currentPage;
        private set
        {
            _currentPage = value;
            CurrentPageChanged?.Invoke(this, value);
        }
    }

    public event EventHandler<object?>? CurrentPageChanged;

    public NavigationService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public void NavigateTo(string route)
    {
        CurrentPage = route switch
        {
            "instances" => new InstancesListPage
            {
                DataContext = _serviceProvider.GetRequiredService<InstancesListViewModel>()
            },
            "jobs" => new JobsPage
            {
                DataContext = _serviceProvider.GetRequiredService<JobsViewModel>()
            },
            _ => null
        };
    }

    public void NavigateToInstanceDetail(string instanceId)
    {
        var viewModel = _serviceProvider.GetRequiredService<InstanceDetailViewModel>();
        viewModel.InstanceId = instanceId;
        CurrentPage = new InstanceDetailPage
        {
            DataContext = viewModel
        };
    }
}

