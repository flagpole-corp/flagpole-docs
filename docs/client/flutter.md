---
id: flutter
title: Flutter
---

# Flutter

A Flutter SDK for integrating feature flags into your app with real-time updates over WebSocket, environment targeting, and widgets for conditional UI.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Advanced Usage](#advanced-usage)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

- 🚀 **Real-time Updates**: socket.io WebSocket for instant flag changes
- 🧩 **Widgets**: `FeatureFlagBuilder` and `FeatureGate` for declarative conditional UI
- 🎯 **`BuildContext` extension**: `context.isFeatureEnabled('…')` for imperative checks
- 🌍 **Environment Targeting**: load and evaluate flags per environment
- 📦 **State-management agnostic**: `FlagpoleClient` is a plain `ChangeNotifier` — use it with `ListenableBuilder`, `provider`, Riverpod, or on its own
- ⚡ **Zero Config**: works out of the box with sensible defaults

## Installation

```bash
flutter pub add flagpole
```

Or add it to `pubspec.yaml`:

```yaml
dependencies:
  flagpole: ^0.0.1
```

### Requirements

- Flutter >= 3.16.0
- Dart >= 3.2.0

## Quick Start

### 1. Wrap Your App

Wrap your app (or the relevant subtree) in a `FlagpoleScope` with your project's API key (available from the FlagPole dashboard):

```dart
import 'package:flagpole/flagpole.dart';
import 'package:flutter/material.dart';

void main() {
  runApp(
    FlagpoleScope(
      apiKey: 'fp_live_your_api_key',
      environments: const ['production'],
      child: const MyApp(),
    ),
  );
}
```

`FlagpoleScope` creates a `FlagpoleClient`, fetches the flag set, opens the
live-updates socket, and disposes everything when it leaves the tree.

### 2. Read Feature Flags

```dart
// Rebuilds this subtree whenever the flag changes
FeatureFlagBuilder(
  flag: 'new-checkout',
  builder: (context, isEnabled, _) =>
      isEnabled ? const NewCheckout() : const LegacyCheckout(),
);

// Show a widget only when a flag is on (optional `fallback:`)
const FeatureGate(
  flag: 'beta-banner',
  child: BetaBanner(),
);

// Imperative check — also subscribes the calling widget to changes
if (context.isFeatureEnabled('promo-2026')) {
  showPromo();
}
```

### 3. Handle Loading & Error States

`FlagpoleScope` exposes its client through `context.flagpole`. Because it's a
`ChangeNotifier`, drive your UI from it with a `ListenableBuilder`:

```dart
class Home extends StatelessWidget {
  const Home({super.key});

  @override
  Widget build(BuildContext context) {
    final flagpole = context.flagpole;

    return ListenableBuilder(
      listenable: flagpole,
      builder: (context, _) {
        if (flagpole.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (flagpole.error != null && flagpole.flags.isEmpty) {
          return Center(child: Text('Could not load flags: ${flagpole.error}'));
        }
        return const HomeContent();
      },
    );
  }
}
```

## API Reference

### FlagpoleScope

Provides a `FlagpoleClient` to the widget subtree.

#### Constructors

| | Description |
| --- | --- |
| `FlagpoleScope({ apiKey, environments, environment, autoInitialize, child })` | Creates and **owns** a client — initializes it on mount, disposes on unmount |
| `FlagpoleScope.value({ client, child })` | Wraps a client **you** create and dispose |

#### Props

| Prop | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `apiKey` | `String` | ✅ | – | Your FlagPole API key |
| `environments` | `List<String>?` | ❌ | all | Flag environments to load |
| `environment` | `FlagpoleEnvironment?` | ❌ | `production` in release, `development` otherwise | Which backend to talk to |
| `autoInitialize` | `bool` | ❌ | `true` | Call `initialize()` on mount |
| `child` | `Widget` | ✅ | – | Your app |

#### Static methods

```dart
FlagpoleClient client = FlagpoleScope.of(context);       // throws if no scope
FlagpoleClient? maybe = FlagpoleScope.maybeOf(context);  // null if no scope
```

### FlagpoleClient

A `ChangeNotifier` that loads, tracks, and evaluates flags.

```dart
final flagpole = FlagpoleClient(
  apiKey: 'fp_live_your_api_key',
  environments: const ['production'],   // filter; defaults to all
  environment: FlagpoleEnvironment.production, // host; defaults by build mode
  requestTimeout: const Duration(seconds: 10),
  enableRealtime: true,                 // open the WebSocket
);

await flagpole.initialize();            // fetch + connect
```

| Member | Type | Description |
| --- | --- | --- |
| `initialize()` | `Future<void>` | Fetch flags, then connect the socket if `enableRealtime` |
| `refresh()` | `Future<void>` | Re-fetch over REST only |
| `isEnabled(name)` | `bool` | `false` for unknown flags, disabled flags, or a non-matching environment |
| `flag(name)` | `FeatureFlag?` | The full flag, or `null` |
| `flags` | `Map<String, FeatureFlag>` | All loaded flags (unmodifiable) |
| `isLoading` | `bool` | `true` until the first fetch resolves |
| `isConnected` | `bool` | WebSocket connection state |
| `error` | `Object?` | Last fetch/socket error |
| `connect()` / `disconnect()` | `void` | Manage the socket |
| `replaceFlags(list)` / `applyFlagUpdate(flag)` / `applyFlagDelete(id)` | `void` | Push updates from another source (cache, push notification) |
| `dispose()` | `void` | Close the socket and HTTP client |

### FeatureFlagBuilder

```dart
FeatureFlagBuilder(
  flag: 'flag-name',
  builder: (context, isEnabled, child) => /* … */,
  child: /* optional, passed straight through to `builder` */,
);
```

### FeatureGate

```dart
FeatureGate(
  flag: 'flag-name',
  child: EnabledWidget(),
  fallback: DisabledWidget(),   // optional; defaults to SizedBox.shrink()
);
```

### BuildContext extension

```dart
context.flagpole                      // the nearest FlagpoleClient
context.isFeatureEnabled('flag-name') // bool
context.featureFlag('flag-name')      // FeatureFlag?
```

### FeatureFlag

```dart
class FeatureFlag {
  final String id;
  final String name;
  final String description;
  final bool isEnabled;              // raw switch — prefer client.isEnabled()
  final String project;
  final String organization;
  final Map<String, dynamic> conditions;
  final List<String> environments;  // empty means "all"
  final DateTime? createdAt;
  final DateTime? updatedAt;
}
```

## Advanced Usage

### Managing the client yourself

For background work, tests, or integration with your own state management, create
the client directly and share it with `FlagpoleScope.value`:

```dart
final flagpole = FlagpoleClient(apiKey: 'fp_live_your_api_key');
await flagpole.initialize();

runApp(
  FlagpoleScope.value(
    client: flagpole,
    child: const MyApp(),
  ),
);

// on shutdown
flagpole.dispose();
```

### With the `provider` package

```dart
ChangeNotifierProvider<FlagpoleClient>(
  create: (_) => FlagpoleClient(apiKey: 'fp_live_your_api_key')..initialize(),
  child: const MyApp(),
);

// in a widget
final enabled = context.watch<FlagpoleClient>().isEnabled('new-checkout');
```

### A/B testing with conditions

```dart
final flag = context.featureFlag('checkout-experiment');
final variant = flag?.conditions['variant'] as String? ?? 'control';

switch (variant) {
  case 'a':
    return const CheckoutA();
  case 'b':
    return const CheckoutB();
  default:
    return const CheckoutControl();
}
```

### Seeding flags from a cache

```dart
final cached = await loadFlagsFromDisk(); // List<FeatureFlag>
flagpole.replaceFlags(cached);            // instant UI, refreshed on initialize()
```

## Configuration

### Environments

`environments:` is a **filter** — it controls which flags are loaded and how
`isEnabled` evaluates targeting. A flag with an empty `environments` list always
applies.

```dart
FlagpoleScope(
  apiKey: 'fp_live_your_api_key',
  environments: const ['production', 'staging'],
  child: const MyApp(),
);
```

### Backend host

`environment:` selects which Flagpole backend the SDK talks to. It defaults to
`FlagpoleEnvironment.production` in release builds and
`FlagpoleEnvironment.development` otherwise.

| `FlagpoleEnvironment` | REST | WebSocket |
| --- | --- | --- |
| `development` | `http://localhost:5000` | `ws://localhost:5000` |
| `staging` | `https://api.staging.useflagpole.dev` | `wss://api.staging.useflagpole.dev` |
| `production` | `https://useflagpole-api.onrender.com` | `wss://useflagpole-api.onrender.com` |

```dart
FlagpoleScope(
  apiKey: 'fp_live_your_api_key',
  environment: FlagpoleEnvironment.staging,
  child: const MyApp(),
);
```

## Error Handling

The SDK fails safe: `isEnabled` returns `false` whenever a flag is missing, the
fetch failed, or the API key is invalid. Inspect `client.error` for details:

```dart
if (flagpole.error is FlagpoleApiException) {
  final e = flagpole.error as FlagpoleApiException;
  debugPrint('Flagpole API ${e.statusCode}: ${e.body}');
}
```

A failed initial fetch does **not** throw from `initialize()` — it sets `error`
and leaves `flags` empty. Real-time updates keep retrying in the background.

## Best Practices

### 1. Keep one client

Create a single `FlagpoleScope` (or one long-lived `FlagpoleClient`) near the root
of your app. Multiple scopes mean multiple sockets.

### 2. Always provide a safe default

```dart
// disabled path is the safe one
FeatureGate(flag: 'risky-feature', child: RiskyFeature());
```

### 3. Use descriptive flag names

`onboarding-redesign-v2`, not `flag1`.

### 4. Scope rebuilds

Prefer `FeatureFlagBuilder` / `FeatureGate` over `context.isFeatureEnabled` in a
large `build` method — the extension rebuilds the whole widget on any flag change.

### 5. Dispose clients you own

Anything created with `FlagpoleClient(...)` directly (not through the default
`FlagpoleScope`) must be `dispose()`d.

## Troubleshooting

### `FlagpoleScope.of() was called with a context that does not contain a FlagpoleScope`

The widget calling `FlagpoleScope.of` / `context.isFeatureEnabled` /
`FeatureFlagBuilder` is not below a `FlagpoleScope`. Move the scope higher, or
check you're not reading it from the same `build` that creates it.

### Flags are always `false`

- Wrong or expired API key
- The flag targets environments not in your `environments:` list
- No network on first load — check `client.error`

### WebSocket never connects

Make sure the host is reachable from the device/emulator:

```text
development: ws://localhost:5000   (use 10.0.2.2 on the Android emulator)
production:  wss://useflagpole-api.onrender.com
```

On the Android emulator, `localhost` refers to the emulator itself — point
`environment` at a custom host or use `10.0.2.2`.

### Updates don't arrive

`enableRealtime` must be `true` (the default) and `connect()` must have run
(`initialize()` does this). Check `client.isConnected`.

## Contributing

```bash
git clone https://github.com/flagpole-corp/flagpole-client-sdk-flutter.git
cd flagpole-client-sdk-flutter

flutter pub get
dart format .
flutter analyze
flutter test
```

## License

MIT

## Support

- 📧 Email: support@useflagpole.dev
- 📚 Documentation: https://docs.useflagpole.dev
- 🐛 Issues: https://github.com/flagpole-corp/flagpole-client-sdk-flutter/issues
- 💬 Discord: https://discord.gg/flagpole
