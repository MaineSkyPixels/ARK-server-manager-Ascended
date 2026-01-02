using System;

namespace ArkAsaDesktopUi.Services;

public interface INavigationService
{
    object? CurrentPage { get; }
    event EventHandler<object?>? CurrentPageChanged;

    void NavigateTo(string route);
    void NavigateToInstanceDetail(string instanceId);
}

