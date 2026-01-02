using ArkAsaDesktopUi.Models;
using ArkAsaDesktopUi.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using Avalonia.Media;

namespace ArkAsaDesktopUi.ViewModels;

public partial class MainWindowViewModel : ViewModelBase
{
    private readonly INavigationService _navigationService;
    private readonly IWebSocketClient _webSocketClient;
    private object? _currentPage;
    private NavigationItem? _selectedNavigationItem;

    public MainWindowViewModel(INavigationService navigationService, IWebSocketClient webSocketClient)
    {
        _navigationService = navigationService;
        _webSocketClient = webSocketClient;

        // Initialize navigation items
        NavigationItems = new ObservableCollection<NavigationItem>
        {
            new NavigationItem { Title = "Instances", Route = "instances", Icon = "🖥️" },
            new NavigationItem { Title = "Jobs", Route = "jobs", Icon = "⚙️" },
            new NavigationItem { Title = "Clusters", Route = "clusters", Icon = "🌐" },
            new NavigationItem { Title = "Hosts", Route = "hosts", Icon = "🖥️" },
            new NavigationItem { Title = "Settings", Route = "settings", Icon = "⚙️" },
            new NavigationItem { Title = "Mods", Route = "mods", Icon = "📦" },
            new NavigationItem { Title = "Backups", Route = "backups", Icon = "💾" },
            new NavigationItem { Title = "Logs", Route = "logs", Icon = "📋" }
        };

        // Subscribe to navigation changes
        _navigationService.CurrentPageChanged += (s, page) => CurrentPage = page;

        // Subscribe to WebSocket connection status
        _webSocketClient.ConnectionStatusChanged += (s, connected) => 
        {
            OnPropertyChanged(nameof(ConnectionStatusText));
            OnPropertyChanged(nameof(ConnectionStatusColor));
        };

        // Navigate to instances by default
        SelectedNavigationItem = NavigationItems.First();
    }

    public ObservableCollection<NavigationItem> NavigationItems { get; }

    public NavigationItem? SelectedNavigationItem
    {
        get => _selectedNavigationItem;
        set
        {
            if (SetProperty(ref _selectedNavigationItem, value) && value != null)
            {
                _navigationService.NavigateTo(value.Route);
            }
        }
    }

    public object? CurrentPage
    {
        get => _currentPage;
        set => SetProperty(ref _currentPage, value);
    }

    public string ConnectionStatusText => _webSocketClient.IsConnected ? "Connected" : "Disconnected";

    public IBrush ConnectionStatusColor => _webSocketClient.IsConnected 
        ? Brushes.Green 
        : Brushes.Red;
}

public class NavigationItem
{
    public string Title { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
}

