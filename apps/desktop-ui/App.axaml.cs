using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using ArkAsaDesktopUi.Services;
using ArkAsaDesktopUi.ViewModels;
using ArkAsaDesktopUi.Views;
using Microsoft.Extensions.DependencyInjection;
using System;

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
        // Services
        services.AddSingleton<IApiClient, ApiClient>();
        services.AddSingleton<IWebSocketClient, WebSocketClient>();
        
        // ViewModels - must be registered before NavigationService
        services.AddTransient<MainWindowViewModel>();
        services.AddTransient<InstancesListViewModel>();
        services.AddTransient<InstanceDetailViewModel>();
        services.AddTransient<JobsViewModel>();
        
        // NavigationService needs IServiceProvider, so register it after ViewModels
        services.AddSingleton<INavigationService>(sp => new NavigationService(sp));
    }
}

