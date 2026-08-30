---
id: swift
title: Swift
---

# Swift

A Swift SDK for Flagpole feature flags — one package for iOS, macOS, tvOS,
watchOS, and visionOS, with a SwiftUI-native API and a zero-dependency core.

:::warning Updates are by polling, not streaming

Unlike the React, React Native, and Flutter SDKs, the Swift SDK does **not** hold
a WebSocket. It refreshes the flag set by calling the REST API on an interval
(`FlagpoleConfiguration.pollInterval`, **default 30 seconds**), and — on iOS,
tvOS, and visionOS — whenever the app returns to the foreground. A flag change
therefore takes up to one poll interval to take effect.

Lower the interval for faster propagation, or call `client.refresh()` after a
known change:

```swift
var config = FlagpoleConfiguration()
config.pollInterval = 5   // seconds
```

Setting the interval to `0` disables polling entirely — the flag set is then only
what `start()` loaded plus any manual `refresh()` (and foreground refreshes).

:::

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [SwiftUI](#swiftui)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

- 🍏 **One package, every Apple platform**: iOS, macOS, tvOS, watchOS, visionOS
- 🧩 **SwiftUI-native**: `FlagpoleClient` is an `ObservableObject`; `FeatureGate`
  gates a view on a flag
- ⚡ **Non-blocking reads**: after `start()`, `isEnabled(_:)` is a synchronous
  in-memory lookup with no I/O
- 🔁 **Polling**: configurable-interval REST refresh, plus a foreground refresh on
  iOS
- 🌍 **Environment Targeting**: load and evaluate flags per environment
- 📦 **Zero dependencies**: `Foundation` + `Combine` only
- 🔐 **Fail-safe**: unknown or unreachable flags return your configured fallback

## Installation

### Swift Package Manager

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/flagpole-corp/flagpole-sdks.git", from: "0.0.1")
]
```

```swift
.target(name: "MyApp", dependencies: [
    .product(name: "Flagpole", package: "flagpole-sdks")
])
```

In Xcode: **File ▸ Add Package Dependencies…**, paste
`https://github.com/flagpole-corp/flagpole-sdks.git`, and add the **Flagpole**
library.

### Requirements

- Swift 5.9+
- iOS 15+ / macOS 12+ / tvOS 15+ / watchOS 8+ / visionOS 1+

## Quick Start

### 1. Create and start the client

```swift
import Flagpole

var config = FlagpoleConfiguration()
config.environments = ["production"]
config.fallbacks = ["new-checkout": false]

let client = FlagpoleClient(apiKey: "fp_live_your_api_key", configuration: config)
try await client.start()
```

`start()` performs the first fetch (bounded by `requestTimeout`) and then polls in
the background. It throws if that first fetch fails, but the client stays usable
and keeps polling — reads fall back until a later fetch succeeds.

### 2. Check flags

```swift
if client.isEnabled("new-checkout") {
    // ...
}

let flag = client.flag("new-checkout")   // the full FeatureFlag?
let all = client.allFlags                 // [String: FeatureFlag]
```

### 3. Stop the client

```swift
client.stop()   // ends polling; loaded flags stay readable
```

## API Reference

### `FlagpoleClient(apiKey:configuration:)`

An `@MainActor` `ObservableObject`. Constructing it performs no I/O.

| Method / Property | Description |
| --- | --- |
| `start() async throws` | Initial fetch, then start polling. Re-fetches if called again. |
| `refresh() async throws` | Re-fetch every flag now |
| `isEnabled(_:) -> Bool` | Fallback for unknown / disabled / non-matching flags. Never throws. |
| `flag(_:) -> FeatureFlag?` | The full flag, or `nil` |
| `allFlags: [String: FeatureFlag]` | A snapshot of every loaded flag |
| `flags: [String: FeatureFlag]` | `@Published` — drives SwiftUI updates |
| `isLoading: Bool` | `@Published` — a fetch is in flight |
| `lastError: FlagpoleError?` | `@Published` — the most recent fetch error |
| `isStarted: Bool` | `@Published` — `start()` has completed once |
| `stop()` | Stop polling and remove the foreground observer |

### `FlagpoleConfiguration`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `environment` | `FlagpoleEnvironment` | `.production` | Which backend to talk to |
| `environments` | `[String]?` | `nil` (all) | Flag environments to load and evaluate against |
| `pollInterval` | `TimeInterval` | `30` | Seconds between refreshes. `0` disables polling. |
| `requestTimeout` | `TimeInterval` | `10` | Per-request timeout |
| `fallbacks` | `[String: Bool]` | `[:]` | Value for a flag that isn't loaded |
| `refreshOnForeground` | `Bool` | `true` | Refresh on `willEnterForeground` (iOS / tvOS / visionOS) |
| `baseURLOverride` | `URL?` | `nil` | Replace the host derived from `environment` |

### `FeatureFlag`

```swift
public struct FeatureFlag: Sendable, Equatable {
    public let id: String
    public let name: String
    public let description: String
    public let isEnabled: Bool              // raw switch — prefer client.isEnabled(_:)
    public let project: String
    public let organization: String
    public let conditions: [String: JSONValue]
    public let environments: [String]       // empty means "all"
    public let createdAt: Date?
    public let updatedAt: Date?
}
```

`JSONValue` is a small enum for walking loosely-typed `conditions`:

```swift
let variant = flag.conditions["experiment"]?["variant"]?.stringValue ?? "control"
```

## SwiftUI

Inject the client with the `.flagpole(_:)` modifier — it puts the client in the
environment and starts it while the view is on screen:

```swift
import Flagpole
import SwiftUI

@main
struct MyApp: App {
    @StateObject private var flagpole = FlagpoleClient(
        apiKey: "fp_live_your_api_key",
        configuration: {
            var config = FlagpoleConfiguration()
            config.environments = ["production"]
            return config
        }()
    )

    var body: some Scene {
        WindowGroup {
            ContentView().flagpole(flagpole)
        }
    }
}
```

Read flags in any child view:

```swift
struct ContentView: View {
    @EnvironmentObject private var flagpole: FlagpoleClient

    var body: some View {
        VStack {
            // Declarative — re-renders when the flag changes
            FeatureGate("new-checkout") {
                NewCheckoutView()
            } fallback: {
                LegacyCheckoutView()
            }

            // No fallback — renders nothing when off
            FeatureGate("beta-banner") {
                BetaBanner()
            }

            // Imperative
            if flagpole.isEnabled("promo-2026") {
                PromoBanner()
            }
        }
    }
}
```

Because `FlagpoleClient` is an `ObservableObject`, any view that reads it via
`@EnvironmentObject` re-renders when a poll changes the flag set.

## Configuration

### Environments

`environments` is a **filter** — it controls which flags are loaded and how
`isEnabled` evaluates targeting. A flag with no environments always applies.

### Backend host

| `FlagpoleEnvironment` | REST |
| --- | --- |
| `.development` | `http://localhost:5000` |
| `.staging` | `https://api.staging.useflagpole.dev` |
| `.production` | `https://useflagpole-api.onrender.com` |

```swift
var config = FlagpoleConfiguration()
config.environment = .staging
```

On the iOS Simulator, `.development` (`localhost`) reaches your Mac. On a physical
device, point `baseURLOverride` at your machine's LAN address.

## Error Handling

`isEnabled(_:)` returns the configured fallback (default `false`) for any flag it
can't resolve and never throws.

`start()` and `refresh()` **do** throw a `FlagpoleError` if the fetch fails:

```swift
do {
    try await client.start()
} catch FlagpoleError.api(let statusCode, _) {
    print("Flagpole rejected the request: \(statusCode)")
    // carry on — isEnabled will use fallbacks
} catch {
    print("Flagpole unreachable: \(error)")
}
```

`FlagpoleError` is `.api(statusCode:body:)`, `.invalidResponse`, or
`.transport(String)`. A failed poll is recorded on `lastError` and retried on the
next tick; it does not stop the client.

## Best Practices

### 1. One client per process

Create it once — a `@StateObject` on your `App`, or a shared instance — and
`stop()` it on teardown.

### 2. Start before showing flag-dependent UI

`await client.start()` in your launch path (or let `.flagpole(_:)` do it) so the
first screen already has flags.

### 3. Tune the poll interval

30s suits most rollouts. Drop it to a few seconds for kill-switch flags, or call
`refresh()` from a push-notification handler.

### 4. Always set fallbacks for critical flags

```swift
config.fallbacks = ["payments-v2": false]
```

## Troubleshooting

### Flags are stale

Expected up to one poll interval. Lower `pollInterval` or call `refresh()`. The
app also refreshes on foreground (iOS / tvOS / visionOS).

### Flags are always the fallback value

- Wrong or expired API key
- The flag targets environments not in your `environments` list
- The first fetch failed — check the error from `start()` or `client.lastError`

### `FeatureGate` always shows the fallback

`FeatureGate` reads the client from the environment. Make sure an ancestor calls
`.flagpole(client)` or `.environmentObject(client)`.

### `start()` throws on launch

Often transient network at launch. The client keeps polling and recovers on its
own; your UI just sees fallbacks until then.

## Contributing

The SDK lives in the
[`flagpole-sdks`](https://github.com/flagpole-corp/flagpole-sdks) monorepo under
`packages/client/swift`.

```bash
git clone https://github.com/flagpole-corp/flagpole-sdks.git
cd flagpole-sdks/packages/client/swift

swift build
swift test
```

## License

MIT

## Support

- 📧 Email: support@useflagpole.dev
- 📚 Documentation: https://docs.useflagpole.dev
- 🐛 Issues: https://github.com/flagpole-corp/flagpole-sdks/issues
- 💬 Discord: https://discord.gg/flagpole
