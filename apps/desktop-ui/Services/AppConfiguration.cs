using Microsoft.Extensions.Configuration;
using System;
using System.IO;

namespace ArkAsaDesktopUi.Services;

public class AppConfiguration
{
    public string ApiBaseUrl { get; set; } = "http://localhost:3000/api";
    public string WebSocketUrl { get; set; } = "ws://localhost:3000/ws";

    public static AppConfiguration Load()
    {
        var config = new AppConfiguration();

        try
        {
            var configuration = new ConfigurationBuilder()
                .SetBasePath(AppDomain.CurrentDomain.BaseDirectory)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
                .Build();

            config.ApiBaseUrl = configuration["ApiBaseUrl"] ?? config.ApiBaseUrl;
            config.WebSocketUrl = configuration["WebSocketUrl"] ?? config.WebSocketUrl;
        }
        catch (Exception)
        {
            // If config file doesn't exist or is invalid, use defaults
        }

        return config;
    }
}

