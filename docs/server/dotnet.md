---
id: dotnet
title: .NET
---

# .NET

A server-side .NET SDK for Flagpole feature flags — a polling client on
`HttpClient` with zero dependencies, plus an ASP.NET Core integration package.

:::warning Updates are by polling, not streaming

Unlike the Node SDK, the .NET SDK does **not** hold a WebSocket. It refreshes the
flag set by calling the REST API on an interval (`FlagpoleOptions.PollInterval`,
**default 30 seconds**). A flag change therefore takes up to one poll interval to
take effect.

Lower the interval for faster propagation, or call `client.RefreshAsync()` after
a known change:

```csharp
new FlagpoleOptions { PollInterval = TimeSpan.FromSeconds(5) };
```

Setting the interval to `TimeSpan.Zero` disables polling entirely — the flag set
is then only what `StartAsync()` loaded plus any manual `RefreshAsync()`.

:::

## Table of Contents

- [Features](#features)
- [Packages](#packages)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [ASP.NET Core](#aspnet-core)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

- 🟣 **Zero dependencies** in the core — `HttpClient` + `System.Text.Json`
- ⚡ **Non-blocking reads**: after `StartAsync()`, `IsEnabled(...)` is a lock-free
  in-memory lookup
- 🔁 **Polling**: configurable-interval REST refresh on a background task
- 🌱 **ASP.NET Core**: DI registration, hosted startup, `[RequireFeatureFlag]`,
  minimal-API endpoint filter
- 🌍 **Environment Targeting**: load and evaluate flags per environment
- 🔐 **Fail-safe**: unknown or unreachable flags return your configured fallback

## Packages

| Package | |
| --- | --- |
| `Flagpole` | the core client — usable from any .NET app (console, worker, …) |
| `Flagpole.AspNetCore` | DI, hosted startup, `[RequireFeatureFlag]`, endpoint filter |

## Installation

```bash
dotnet add package Flagpole              # core only
dotnet add package Flagpole.AspNetCore   # + ASP.NET Core glue (pulls in Flagpole)
```

### Requirements

- .NET 8+

## Quick Start

### 1. Create and start the client

```csharp
using Flagpole;

await using var client = new FlagpoleClient(new FlagpoleOptions
{
    ApiKey = "fp_live_your_api_key",
    Environments = ["production"],
    Fallbacks = { ["new-checkout"] = false },
});

await client.StartAsync();
```

`StartAsync` performs the first fetch and then polls in the background. It throws
a `FlagpoleException` if that first fetch fails, but the client stays usable and
keeps polling — reads fall back until a later fetch succeeds.

### 2. Check flags

```csharp
if (client.IsEnabled("new-checkout"))
{
    // ...
}

FeatureFlag? flag = client.Flag("new-checkout");
IReadOnlyDictionary<string, FeatureFlag> all = client.AllFlags;
```

### 3. Shut down

```csharp
await client.DisposeAsync();   // or `await using`, as above
```

## API Reference

### `FlagpoleClient`

| Member | Description |
| --- | --- |
| `new FlagpoleClient(FlagpoleOptions)` / `(string apiKey, Action<FlagpoleOptions>?)` | Construct. Performs no I/O. |
| `Task StartAsync(CancellationToken)` | Initial fetch, then start polling. Re-fetches if called again. |
| `Task RefreshAsync(CancellationToken)` | Re-fetch every flag now |
| `bool IsEnabled(string)` | Fallback for unknown / disabled / non-matching flags. Never throws. |
| `FeatureFlag? Flag(string)` | The full flag, or `null` |
| `IReadOnlyDictionary<string, FeatureFlag> AllFlags` | A snapshot of every loaded flag |
| `bool IsStarted` | Whether `StartAsync` has completed once |
| `Task StopAsync()` | Stop polling |
| `DisposeAsync()` / `Dispose()` | Stop polling and release the `HttpClient` |

### `FlagpoleOptions`

| Property | Default | Description |
| --- | --- | --- |
| `ApiKey` | `""` | API key from the dashboard |
| `Environment` | `Production` | Which backend to talk to |
| `Environments` | `null` (all) | Flag environments to load and evaluate against |
| `PollInterval` | `30s` | Refresh frequency. `TimeSpan.Zero` disables polling. |
| `RequestTimeout` | `10s` | Per-request timeout |
| `Fallbacks` | `{}` | Value for a flag that isn't loaded |
| `BaseUrlOverride` | `null` | Replace the host derived from `Environment` |
| `OnError` | `null` | Callback for background poll failures |

### `FeatureFlag`

A record: `Id`, `Name`, `Description`, `IsEnabled` (raw switch — prefer
`client.IsEnabled(name)`), `Project`, `Organization`, `Conditions`
(`JsonElement`), `Environments` (`IReadOnlyList<string>`, empty means "all"),
`CreatedAt` / `UpdatedAt` (raw ISO-8601 strings).

### `FlagpoleException`

An abstract exception with three sealed subtypes: `FlagpoleException.Api` (has
`StatusCode`, `Body`), `FlagpoleException.InvalidResponse`,
`FlagpoleException.Transport`.

## ASP.NET Core

```csharp
builder.Services.AddFlagpole(builder.Configuration.GetSection("Flagpole"));
// or: builder.Services.AddFlagpole(o => { o.ApiKey = "..."; o.Environments = ["production"]; });
```

```json
{
  "Flagpole": {
    "ApiKey": "fp_live_your_api_key",
    "Environments": ["production"],
    "PollInterval": "00:00:30",
    "RequestTimeout": "00:00:10",
    "Fallbacks": { "new-checkout": false }
  }
}
```

`AddFlagpole` registers a singleton `FlagpoleClient` (using `IHttpClientFactory`)
and a hosted service that calls `StartAsync` at boot — a failed first fetch logs a
warning and the app still starts.

### Reading flags

```csharp
app.MapGet("/checkout", (FlagpoleClient flagpole) =>
    flagpole.IsEnabled("new-checkout") ? "new" : "legacy");
```

### Gating endpoints

```csharp
// minimal API
app.MapGet("/beta", () => "welcome").RequireFeatureFlag("beta-access");
app.MapGet("/early", () => "welcome").RequireFeatureFlag("early-access", disabledStatusCode: 403);

// MVC / controllers
[HttpGet("/beta")]
[RequireFeatureFlag("beta-access")]                       // 404 when off
public IActionResult Beta() => Ok("welcome");

[RequireFeatureFlag("early-access", DisabledStatusCode = 403)]
public IActionResult Early() => Ok("welcome");
```

`[RequireFeatureFlag]` works on a controller class too, gating every action.

## Configuration

### Environments

`Environments` is a **filter** — it controls which flags are loaded and how
`IsEnabled` evaluates targeting. A flag with no environments always applies.

### Backend host

| `FlagpoleEnvironment` | REST |
| --- | --- |
| `Development` | `http://localhost:5000` |
| `Staging` | `https://api.staging.useflagpole.dev` |
| `Production` | `https://useflagpole-api.onrender.com` |

## Error Handling

`IsEnabled(...)` returns the configured fallback (default `false`) for any flag it
can't resolve and never throws.

`StartAsync` and `RefreshAsync` throw a `FlagpoleException`:

```csharp
try
{
    await client.StartAsync();
}
catch (FlagpoleException.Api ex)
{
    logger.LogWarning("Flagpole rejected the request: {Status} {Body}", ex.StatusCode, ex.Body);
    // carry on — IsEnabled will use fallbacks
}
```

A failed background poll is passed to `FlagpoleOptions.OnError` (the ASP.NET Core
package wires this to `ILogger`) and retried on the next tick.

## Best Practices

### 1. One client per process

Register it as a singleton (`AddFlagpole` does), or create one and share it.

### 2. Start before serving traffic

The hosted service does this. Outside ASP.NET Core, `await client.StartAsync()` in
your startup path.

### 3. Tune the poll interval

30s suits most rollouts. Drop it to a few seconds for kill-switch flags, or call
`RefreshAsync` from an admin webhook.

### 4. Always set fallbacks for critical flags

```csharp
new FlagpoleOptions { Fallbacks = { ["payments-v2"] = false } };
```

## Troubleshooting

### Flags are stale

Expected up to one poll interval. Lower `PollInterval` or call `RefreshAsync`.

### Flags are always the fallback value

- Wrong or expired API key
- The flag targets environments not in your `Environments` list
- The first fetch failed — check the logs / catch the `FlagpoleException`

### `AddFlagpole` didn't seem to do anything

Make sure something resolves `FlagpoleClient` (injecting it, or the hosted service
running). The hosted service only starts with the app host.

## Contributing

The SDK lives in the
[`flagpole-sdks`](https://github.com/flagpole-corp/flagpole-sdks) monorepo under
`packages/server/dotnet`.

```bash
git clone https://github.com/flagpole-corp/flagpole-sdks.git
cd flagpole-sdks/packages/server/dotnet

dotnet build
dotnet test
dotnet format --verify-no-changes
```

## License

MIT

## Support

- 📧 Email: support@useflagpole.dev
- 📚 Documentation: https://docs.useflagpole.dev
- 🐛 Issues: https://github.com/flagpole-corp/flagpole-sdks/issues
- 💬 Discord: https://discord.gg/flagpole
