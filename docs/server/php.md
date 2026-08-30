---
id: php
title: PHP
---

# PHP

A server-side PHP SDK for Flagpole feature flags — a cache-backed client on cURL
with zero Composer dependencies, and a Laravel integration.

:::warning Updates are by polling, not streaming

PHP requests are short-lived, so the SDK does **not** hold a WebSocket or a
background poller. Instead it caches the flag set — pass a PSR-16 cache (the
Laravel integration wires one automatically) and one request per
`FlagpoleConfig::$cacheTtl` window (**default 30 seconds**) refetches from the
API; the rest read the cache.

Without a cache, every `initialize()` refetches. Call `refresh()` to force a
fetch and update the cache.

:::

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Laravel](#laravel)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

- 🐘 **Zero Composer dependencies** in the core — `ext-curl` + `ext-json`
- 🗄️ **PSR-16 cache-backed**: shares one flag fetch across requests
- ⚡ **Non-blocking reads**: `isEnabled()` is an in-memory lookup after the first load
- 🌍 **Environment Targeting**: load and evaluate flags per environment
- 🎨 **Laravel**: auto-discovered provider, `Flagpole` facade, `@feature` Blade
  directive, `feature:` route middleware
- 🔐 **Fail-safe**: unknown or unreachable flags return your configured fallback

## Installation

```bash
composer require flagpole/sdk
```

### Requirements

- PHP 8.2+, `ext-curl`, `ext-json`
- Optionally a PSR-16 (`psr/simple-cache`) implementation — strongly recommended
  outside Laravel

## Quick Start

```php
use Flagpole\FlagpoleClient;
use Flagpole\FlagpoleConfig;

$client = new FlagpoleClient(
    new FlagpoleConfig(
        apiKey: 'fp_live_your_api_key',
        environments: ['production'],
        fallbacks: ['new-checkout' => false],
    ),
    $psr16Cache,   // optional; without it every initialize() refetches
);

$client->initialize();

if ($client->isEnabled('new-checkout')) {
    // ...
}

$flag = $client->flag('new-checkout');   // ?FeatureFlag
$all  = $client->allFlags();              // array<string, FeatureFlag>
```

## API Reference

### `FlagpoleClient`

| Method | Description |
| --- | --- |
| `__construct(FlagpoleConfig $config, ?Psr\SimpleCache\CacheInterface $cache = null, ?Transport $transport = null)` | Construct. Performs no I/O. |
| `initialize(): void` | Load flags (from cache if fresh, else the API). Throws on a failed fetch. |
| `refresh(): void` | Force a fetch and refresh the cache. Throws on failure. |
| `isEnabled(string $name): bool` | Fallback for unknown / disabled / non-matching flags. Never throws. |
| `flag(string $name): ?FeatureFlag` | The full flag, or `null` |
| `allFlags(): array` | `array<string, FeatureFlag>` |
| `isInitialized(): bool` | Whether a load has completed |
| `lastError(): ?FlagpoleException` | The error from the most recent implicit load |

### `FlagpoleConfig`

Constructor (all named): `apiKey`, `environment` (`FlagpoleEnvironment`, default
`Production`), `environments` (`?array`, default all), `cacheTtl` (`int` seconds,
default 30), `requestTimeout` (`int` seconds, default 10), `fallbacks`
(`array<string, bool>`), `baseUrlOverride` (`?string`).

### `FeatureFlag`

Readonly: `id`, `name`, `description`, `isEnabled` (raw switch — prefer
`isEnabled()` on the client), `project`, `organization`, `conditions` (`array`),
`environments` (`list<string>`, empty means "all"), `createdAt`, `updatedAt`
(raw ISO-8601 strings).

### Exceptions

`Flagpole\Exception\FlagpoleException` (abstract) with `ApiException` (has
`->statusCode`, `->body`), `InvalidResponseException`, and `TransportException`.

## Laravel

The service provider is auto-discovered. Publish the config and set your key:

```bash
php artisan vendor:publish --tag=flagpole-config
```

```dotenv
FLAGPOLE_API_KEY=fp_live_your_api_key
FLAGPOLE_ENVIRONMENTS=production
FLAGPOLE_CACHE_TTL=30
```

### Reading flags

```php
use Flagpole\Laravel\Facades\Flagpole;
use Flagpole\FlagpoleClient;

// facade
if (Flagpole::isEnabled('new-checkout')) { /* … */ }

// injected (bound as a singleton, using Laravel's cache store)
Route::get('/checkout', fn (FlagpoleClient $flagpole) =>
    $flagpole->isEnabled('new-checkout') ? 'new' : 'legacy');
```

### Blade

```blade
@feature('new-checkout')
    <x-new-checkout />
@else
    <x-legacy-checkout />
@endfeature
```

### Route middleware

```php
// 404 when off; feature:beta-access,403 to pick the status
Route::get('/beta', BetaController::class)->middleware('feature:beta-access');
```

## Configuration

### Environments

`environments` is a **filter** — it controls which flags are loaded and how
`isEnabled` evaluates targeting. A flag with no environments always applies.

### Backend host

| `FlagpoleEnvironment` | REST |
| --- | --- |
| `Development` | `http://localhost:5000` |
| `Staging` | `https://api.staging.useflagpole.dev` |
| `Production` | `https://useflagpole-api.onrender.com` |

### Using your own HTTP client

The core uses cURL. To route requests through your app's client, implement
`Flagpole\Transport\Transport` and pass it as the third constructor argument (in
Laravel, bind it in the container — the provider picks it up).

## Error Handling

`isEnabled()` returns the configured fallback (default `false`) for any flag it
can't resolve and never throws.

`initialize()` and `refresh()` throw a `FlagpoleException`:

```php
use Flagpole\Exception\ApiException;

try {
    $client->initialize();
} catch (ApiException $e) {
    logger()->warning("Flagpole rejected the request: {$e->statusCode}");
    // carry on — isEnabled() will use fallbacks
}
```

## Best Practices

### 1. Always pass a cache

Outside Laravel, pass a PSR-16 cache (Symfony Cache, `symfony/cache`, APCu,
Redis…). Without one every request that touches a flag makes an HTTP call.

### 2. Initialize once per request

Call `initialize()` in a middleware or service-provider boot so the first check
already has flags. `isEnabled()` also loads lazily on first use.

### 3. Tune the cache TTL

30s suits most rollouts. Drop it for kill-switch flags, or call `refresh()` from
an admin action / webhook.

### 4. Always set fallbacks for critical flags

```php
new FlagpoleConfig(apiKey: '…', fallbacks: ['payments-v2' => false]);
```

## Troubleshooting

### Flags are stale

Expected up to one `cacheTtl` window. Lower it or call `refresh()`.

### Flags are always the fallback value

- Wrong or expired API key
- The flag targets environments not in your `environments` list
- The first fetch failed — check `$client->lastError()` or catch the exception
  from `initialize()`

### Every request is slow

You're running without a cache. Pass a PSR-16 cache (Laravel does this for you).

## Contributing

The SDK lives in the
[`flagpole-sdks`](https://github.com/flagpole-corp/flagpole-sdks) monorepo under
`packages/server/php`.

```bash
git clone https://github.com/flagpole-corp/flagpole-sdks.git
cd flagpole-sdks/packages/server/php

composer install
vendor/bin/phpunit
vendor/bin/phpstan analyse
```

## License

MIT

## Support

- 📧 Email: support@useflagpole.dev
- 📚 Documentation: https://docs.useflagpole.dev
- 🐛 Issues: https://github.com/flagpole-corp/flagpole-sdks/issues
- 💬 Discord: https://discord.gg/flagpole
