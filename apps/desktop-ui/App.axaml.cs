using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using ArkAsaDesktopUi.Services;
using ArkAsaDesktopUi.ViewModels;
using ArkAsaDesktopUi.Views;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading.Tasks;

namespace ArkAsaDesktopUi;

public partial class App : Application
{
    public static IServiceProvider? ServiceProvider { get; private set; }

    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
    }

    public override void OnFrameworkInitializationCompleted()
    {
        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            // Setup dependency injection
            var services = new ServiceCollection();
            ConfigureServices(services);
            ServiceProvider = services.BuildServiceProvider();

            // Create main window with view model
            var mainWindow = new MainWindow
            {
                DataContext = ServiceProvider.GetRequiredService<MainWindowViewModel>()
            };

            desktop.MainWindow = mainWindow;
        }

        base.OnFrameworkInitializationCompleted();
    }

    private void ConfigureServices(IServiceCollection services)
    {
        // Load configuration
        var config = AppConfiguration.Load();
        services.AddSingleton(config);

        // Services
        services.AddSingleton<IApiClient>(sp => new ApiClient(sp.GetRequiredService<AppConfiguration>()));
        services.AddSingleton<IWebSocketClient>(sp =>
        {
            var wsClient = new WebSocketClient();
            // Initialize WebSocket connection with configured URL (async, don't block startup)
            Task.Run(async () =>
            {
                try
                {
                    await wsClient.ConnectAsync(config.WebSocketUrl);
                }
                catch (Exception)
                {
                    // Connection failed - will show disconnected status
                    // Reconnection can be handled by the client if needed
                }
            });
            return wsClient;
        });
        
        // ViewModels - must be registered before NavigationService
        services.AddTransient<MainWindowViewModel>();
        services.AddTransient<InstancesListViewModel>();
        services.AddTransient<InstanceDetailViewModel>();
        services.AddTransient<JobsViewModel>();
        
        // NavigationService needs IServiceProvider, so register it after ViewModels
        services.AddSingleton<INavigationService>(sp => new NavigationService(sp));
    }
}

