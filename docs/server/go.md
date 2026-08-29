---
id: go
title: Go
---

# Go

A server-side Go SDK for Flagpole feature flags — environment targeting,
`net/http` middleware, and a zero-dependency core.

:::warning Updates are by polling, not streaming

Unlike the other Flagpole SDKs, the Go SDK does **not** hold a WebSocket. It
refreshes the flag set by calling the REST API on an interval
(`WithPollInterval`, **default 30 seconds**). A flag change therefore takes up to
one poll interval to take effect in your app.

Lower the interval for faster propagation, or call `client.Refresh(ctx)` after a
known change:

```go
flagpole.WithPollInterval(5 * time.Second)
```

Setting the interval to `0` disables polling entirely — the flag set is then only
what `Start` loaded plus any manual `Refresh`.

:::

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [net/http Middleware](#nethttp-middleware)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

- 🔁 **Polling**: configurable-interval REST refresh (see the note above)
- ⚡ **Non-blocking reads**: after `Start`, `IsEnabled` is a lock-guarded
  in-memory lookup with no network I/O
- 🌍 **Environment Targeting**: load and evaluate flags per environment
- 🧩 **`net/http` middleware**: works with chi, gorilla/mux, and the stdlib mux
- 📦 **Zero dependencies**: standard library only
- 🔐 **Fail-safe**: unknown or unreachable flags return your configured fallback

## Installation

```bash
go get github.com/flagpole-corp/flagpole-sdks/packages/server/go
```

```go
import flagpole "github.com/flagpole-corp/flagpole-sdks/packages/server/go"
```

### Requirements

- Go 1.21+

## Quick Start

### 1. Create and start the client

```go
client, err := flagpole.NewClient(
	"fp_live_your_api_key",
	flagpole.WithEnvironments("production"),
	flagpole.WithPollInterval(15*time.Second),
	flagpole.WithFallbacks(map[string]bool{"new-checkout": false}),
)
if err != nil {
	log.Fatal(err)
}
if err := client.Start(context.Background()); err != nil {
	log.Fatal(err)
}
defer client.Close()
```

`Start` blocks on the first fetch (bounded by the context) and then polls in the
background.

### 2. Check flags

```go
if client.IsEnabled("new-checkout") {
	// ...
}

flag, ok := client.Flag("new-checkout")   // the full flag + whether it was found
all := client.AllFlags()                  // map[string]FeatureFlag (a copy)
```

## API Reference

### `NewClient(apiKey string, opts ...Option) (*Client, error)`

Constructs a client. Performs no I/O.

### Methods

| Method | Description |
| --- | --- |
| `Start(ctx) error` | Initial fetch, then start polling. Re-fetches if called again. |
| `Refresh(ctx) error` | Re-fetch every flag now |
| `IsEnabled(name) bool` | Fallback for unknown / disabled / non-matching flags. Never panics. |
| `Flag(name) (FeatureFlag, bool)` | The full flag and whether it was found |
| `AllFlags() map[string]FeatureFlag` | A copy of every loaded flag |
| `Started() bool` | Whether `Start` has completed at least once |
| `Close() error` | Stop the poller (safe to call repeatedly) |

### Options

| Option | Description |
| --- | --- |
| `WithEnvironment(Environment)` | Which backend — `Development` / `Staging` / `Production` (default) |
| `WithEnvironments(...string)` | Flag environments to load. Default: all. |
| `WithPollInterval(time.Duration)` | Refresh frequency. Default 30s. `0` disables polling. |
| `WithTimeout(time.Duration)` | Per-request timeout. Default 10s. |
| `WithFallbacks(map[string]bool)` | Value for a flag that isn't loaded |
| `WithLogger(*slog.Logger)` | Where the SDK logs. Default: discard. |
| `WithHTTPClient(*http.Client)` | Bring your own HTTP client |

### `FeatureFlag`

```go
type FeatureFlag struct {
	ID           string
	Name         string
	Description  string
	IsEnabled    bool          // raw switch — prefer client.IsEnabled()
	Project      string
	Organization string
	Conditions   map[string]any
	Environments []string      // empty means "all"
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
```

## net/http Middleware

```go
mux := http.NewServeMux()

// 404 unless the flag is on (pass a status to override)
mux.Handle("/beta", client.RequireFlag("beta-access")(betaHandler))

// attach the client to the request context
mux.Handle("/dashboard", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	c, _ := flagpole.FromContext(r.Context())
	fmt.Fprintf(w, "advanced=%v", c.IsEnabled("advanced-dashboard"))
}))

http.ListenAndServe(":8080", client.Middleware(mux))
```

`Client.Middleware` and `Client.RequireFlag` return standard
`func(http.Handler) http.Handler` values, so they compose with chi, gorilla/mux,
alice, and the stdlib mux.

## Configuration

### Environments

`WithEnvironments` is a **filter** — it controls which flags are loaded and how
`IsEnabled` evaluates targeting. A flag with no environments always applies.

### Backend host

| `Environment` | REST |
| --- | --- |
| `flagpole.Development` | `http://localhost:5000` |
| `flagpole.Staging` | `https://api.staging.useflagpole.dev` |
| `flagpole.Production` | `https://useflagpole-api.onrender.com` |

```go
flagpole.NewClient(key, flagpole.WithEnvironment(flagpole.Staging))
```

### Logging

The SDK discards logs by default. Pass a `*slog.Logger` to see them:

```go
flagpole.WithLogger(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
```

## Error Handling

`IsEnabled` returns the configured fallback (default `false`) for any flag it
can't resolve and never panics.

`Start` and `Refresh` **do** return an error if the fetch fails:

```go
var apiErr *flagpole.APIError
if err := client.Start(ctx); errors.As(err, &apiErr) {
	log.Printf("Flagpole unavailable: %d %s", apiErr.StatusCode, apiErr.Body)
	// carry on — IsEnabled will use fallbacks
}
```

A failed poll is logged (via the configured logger) and retried on the next tick;
it does not stop the client.

## Best Practices

### 1. One client per process

Create the client at startup, share it, `Close()` on shutdown.

### 2. Start before serving traffic

Call `Start(ctx)` in your bootstrap so the first request already has flags.

### 3. Tune the poll interval to your needs

30s is fine for most rollouts. Drop it to a few seconds for kill-switch-style
flags, or call `Refresh` from an admin webhook.

### 4. Always set fallbacks for critical flags

```go
flagpole.WithFallbacks(map[string]bool{"payments-v2": false})
```

## Troubleshooting

### Flags are stale

That's expected up to one poll interval. Lower `WithPollInterval` or call
`Refresh`.

### Flags are always the fallback value

- Wrong or expired API key
- The flag targets environments not in your `WithEnvironments` list
- The first fetch failed — check the error from `Start`

### `Start` returns an `*APIError`

The API rejected the request (`StatusCode` 401 → bad key). The client is still
usable; reads fall back until the next successful fetch.

## Contributing

The SDK lives in the
[`flagpole-sdks`](https://github.com/flagpole-corp/flagpole-sdks) monorepo under
`packages/server/go`.

```bash
git clone https://github.com/flagpole-corp/flagpole-sdks.git
cd flagpole-sdks/packages/server/go

gofmt -l .
go vet ./...
go test ./...
```

## License

MIT

## Support

- 📧 Email: support@useflagpole.dev
- 📚 Documentation: https://docs.useflagpole.dev
- 🐛 Issues: https://github.com/flagpole-corp/flagpole-sdks/issues
- 💬 Discord: https://discord.gg/flagpole
