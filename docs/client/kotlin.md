---
id: kotlin
title: Kotlin
---

# Kotlin

A Kotlin SDK for Flagpole feature flags — coroutines, `StateFlow`, and a
`HttpURLConnection`-based core with no HTTP dependency. Runs on the JVM and
Android.

:::warning Updates are by polling, not streaming

Unlike the React, React Native, and Flutter SDKs, the Kotlin SDK does **not** hold
a WebSocket. It refreshes the flag set by calling the REST API on an interval
(`FlagpoleConfig.pollInterval`, **default 30 seconds**). A flag change therefore
takes up to one poll interval to take effect.

Lower the interval for faster propagation, or call `client.refresh()` after a
known change:

```kotlin
FlagpoleConfig(pollInterval = 5.seconds)
```

Setting the interval to `Duration.ZERO` disables polling entirely — the flag set
is then only what `start()` loaded plus any manual `refresh()`.

:::

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Jetpack Compose](#jetpack-compose)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

- 🧵 **Coroutines-native**: `suspend` fetches, state as `StateFlow`
- 🤖 **JVM & Android**: `HttpURLConnection` core — no OkHttp/Ktor
- ⚡ **Non-blocking reads**: after `start()`, `isEnabled(...)` is a synchronous
  in-memory lookup
- 🔁 **Polling**: configurable-interval REST refresh
- 🌍 **Environment Targeting**: load and evaluate flags per environment
- 🧩 **Compose-ready**: `featureFlagFlow(name)` collects straight into `collectAsState`
- 🔐 **Fail-safe**: unknown or unreachable flags return your configured fallback

## Installation

```kotlin
// build.gradle.kts
dependencies {
    implementation("dev.useflagpole:flagpole:0.0.1")
}
```

### Requirements

- Kotlin 1.9+
- JVM 17+, or Android with AGP 8.1+

`kotlinx-coroutines-core` comes in transitively.

## Quick Start

### 1. Create and start the client

```kotlin
import dev.useflagpole.FlagpoleClient
import dev.useflagpole.FlagpoleConfig

val client = FlagpoleClient(
    apiKey = "fp_live_your_api_key",
    config = FlagpoleConfig(
        environments = listOf("production"),
        fallbacks = mapOf("new-checkout" to false),
    ),
)

client.start()   // suspend: initial fetch, then background polling
```

`start()` throws if the first fetch fails, but the client stays usable and keeps
polling — reads fall back until a later fetch succeeds.

### 2. Check flags

```kotlin
if (client.isEnabled("new-checkout")) {
    // ...
}

val flag = client.flag("new-checkout")   // FeatureFlag?
val all = client.allFlags()               // Map<String, FeatureFlag>
```

### 3. Shut down

```kotlin
client.close()   // stops polling, cancels the internal scope
```

## API Reference

### `FlagpoleClient(apiKey, config)`

| Member | Description |
| --- | --- |
| `suspend start()` | Initial fetch, then start polling. Re-fetches if called again. |
| `suspend refresh()` | Re-fetch every flag now |
| `isEnabled(name): Boolean` | Fallback for unknown / disabled / non-matching flags. Never throws. |
| `flag(name): FeatureFlag?` | The full flag, or `null` |
| `allFlags(): Map<String, FeatureFlag>` | A snapshot of every loaded flag |
| `featureFlagFlow(name): Flow<Boolean>` | Enabled state as a flow, updates on each poll |
| `flags: StateFlow<Map<String, FeatureFlag>>` | The whole set |
| `isLoading: StateFlow<Boolean>` | A fetch is in flight |
| `lastError: StateFlow<FlagpoleException?>` | The most recent fetch error |
| `isStarted: StateFlow<Boolean>` | `start()` has completed once |
| `close()` | Stop polling, cancel the scope |

### `FlagpoleConfig`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `environment` | `FlagpoleEnvironment` | `PRODUCTION` | Which backend to talk to |
| `environments` | `List<String>?` | `null` (all) | Flag environments to load and evaluate against |
| `pollInterval` | `Duration` | `30.seconds` | Refresh frequency. `Duration.ZERO` disables polling. |
| `requestTimeout` | `Duration` | `10.seconds` | Per-request timeout |
| `fallbacks` | `Map<String, Boolean>` | `{}` | Value for a flag that isn't loaded |
| `baseUrlOverride` | `String?` | `null` | Replace the host derived from `environment` |

### `FeatureFlag`

```kotlin
data class FeatureFlag(
    val id: String,               // "_id" in the payload
    val name: String,
    val description: String,
    val isEnabled: Boolean,       // raw switch — prefer client.isEnabled(name)
    val project: String,
    val organization: String,
    val conditions: JsonObject,   // loosely-typed targeting rules
    val environments: List<String>,   // empty means "all"
    val createdAt: String?,       // raw ISO-8601
    val updatedAt: String?,
)
```

## Jetpack Compose

`FlagpoleClient` exposes `StateFlow`s, so the SDK needs no Compose dependency:

```kotlin
@Composable
fun Checkout(client: FlagpoleClient) {
    val enabled by client
        .featureFlagFlow("new-checkout")
        .collectAsState(initial = false)

    if (enabled) NewCheckout() else LegacyCheckout()
}
```

Create the client once — in your `Application`, a DI singleton, or a
`ViewModel` — call `start()` from a coroutine scope, and share it.

```kotlin
class FlagpoleHolder(application: Application) {
    val client = FlagpoleClient(apiKey = BuildConfig.FLAGPOLE_KEY)

    init {
        CoroutineScope(Dispatchers.Main).launch { runCatching { client.start() } }
    }
}
```

## Configuration

### Environments

`environments` is a **filter** — it controls which flags are loaded and how
`isEnabled` evaluates targeting. A flag with no environments always applies.

### Backend host

| `FlagpoleEnvironment` | REST |
| --- | --- |
| `DEVELOPMENT` | `http://localhost:5000` |
| `STAGING` | `https://api.staging.useflagpole.dev` |
| `PRODUCTION` | `https://useflagpole-api.onrender.com` |

On the Android emulator, `DEVELOPMENT` (`localhost`) points at the emulator
itself — use `baseUrlOverride = "http://10.0.2.2:5000"` to reach your machine.

## Error Handling

`isEnabled(...)` returns the configured fallback (default `false`) for any flag it
can't resolve and never throws.

`start()` and `refresh()` throw a `FlagpoleException`:

```kotlin
try {
    client.start()
} catch (e: FlagpoleException.Api) {
    println("Flagpole rejected the request: ${e.statusCode} ${e.body}")
    // carry on — isEnabled will use fallbacks
} catch (e: FlagpoleException.Transport) {
    println("Flagpole unreachable: ${e.message}")
}
```

`FlagpoleException` is a sealed class: `Api(statusCode, body)`,
`InvalidResponse`, or `Transport`. A failed poll is recorded on `lastError` and
retried on the next tick; it does not stop the client.

## Best Practices

### 1. One client per process

Create it once, share it, `close()` it on shutdown.

### 2. Start before showing flag-dependent UI

Call `start()` in your app's startup path so the first screen already has flags.

### 3. Tune the poll interval

30s suits most rollouts. Drop it to a few seconds for kill-switch flags, or call
`refresh()` from a push handler.

### 4. Always set fallbacks for critical flags

```kotlin
FlagpoleConfig(fallbacks = mapOf("payments-v2" to false))
```

## Troubleshooting

### Flags are stale

Expected up to one poll interval. Lower `pollInterval` or call `refresh()`.

### Flags are always the fallback value

- Wrong or expired API key
- The flag targets environments not in your `environments` list
- The first fetch failed — check `client.lastError.value`

### `start()` throws on launch

Often transient network. The client keeps polling and recovers; your UI sees
fallbacks until then.

## Contributing

The SDK lives in the
[`flagpole-sdks`](https://github.com/flagpole-corp/flagpole-sdks) monorepo under
`packages/client/kotlin`.

```bash
git clone https://github.com/flagpole-corp/flagpole-sdks.git
cd flagpole-sdks/packages/client/kotlin

gradle assemble
gradle test
gradle ktlintCheck
```

## License

MIT

## Support

- 📧 Email: support@useflagpole.dev
- 📚 Documentation: https://docs.useflagpole.dev
- 🐛 Issues: https://github.com/flagpole-corp/flagpole-sdks/issues
- 💬 Discord: https://discord.gg/flagpole
