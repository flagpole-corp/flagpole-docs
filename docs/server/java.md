---
id: java
title: Java
---

# Java

A server-side Java SDK for Flagpole feature flags — a polling client on the JDK
`HttpClient`, with Servlet and Spring Boot glue.

:::warning Updates are by polling, not streaming

Unlike the Node SDK, the Java SDK does **not** hold a WebSocket. It refreshes the
flag set by calling the REST API on an interval (`FlagpoleConfig.pollInterval`,
**default 30 seconds**). A flag change therefore takes up to one poll interval to
take effect.

Lower the interval for faster propagation, or call `client.refresh()` after a
known change:

```java
FlagpoleConfig.builder().pollInterval(Duration.ofSeconds(5)).build();
```

Setting the interval to `Duration.ZERO` disables polling entirely — the flag set
is then only what `start()` loaded plus any manual `refresh()`.

:::

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Spring Boot](#spring-boot)
- [Plain Servlet](#plain-servlet)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

- ☕ **JDK-native transport**: built on `java.net.http.HttpClient` — no OkHttp/Apache
- ⚡ **Non-blocking reads**: after `start()`, `isEnabled(...)` is a lock-free
  in-memory lookup
- 🔁 **Polling**: configurable-interval REST refresh on a daemon thread
- 🌱 **Spring Boot**: auto-configuration, `@RequireFeatureFlag`, a request filter
- 🧩 **Plain Servlet**: `FlagpoleFilter` / `RequireFlagFilter` for any container
- 🌍 **Environment Targeting**: load and evaluate flags per environment
- 🔐 **Fail-safe**: unknown or unreachable flags return your configured fallback

## Installation

```kotlin
// build.gradle.kts
dependencies {
    implementation("dev.useflagpole:flagpole-java:0.0.1")
}
```

```xml
<dependency>
  <groupId>dev.useflagpole</groupId>
  <artifactId>flagpole-java</artifactId>
  <version>0.0.1</version>
</dependency>
```

### Requirements

- Java 17+
- `jackson-databind` (transitive). Servlet / Spring glue activates only if those
  APIs are already on your classpath.

## Quick Start

### 1. Create and start the client

```java
import dev.useflagpole.FlagpoleClient;
import dev.useflagpole.FlagpoleConfig;
import java.util.List;

FlagpoleClient client = new FlagpoleClient(
    "fp_live_your_api_key",
    FlagpoleConfig.builder()
        .environments(List.of("production"))
        .fallback("new-checkout", false)
        .build());

client.start();
```

`start()` performs the first fetch and then polls in the background. It throws a
`FlagpoleException` if that first fetch fails, but the client stays usable and
keeps polling — reads fall back until a later fetch succeeds.

### 2. Check flags

```java
if (client.isEnabled("new-checkout")) {
    // ...
}

Optional<FeatureFlag> flag = client.flag("new-checkout");
Map<String, FeatureFlag> all = client.allFlags();
```

### 3. Shut down

```java
client.close();   // stops polling; FlagpoleClient is AutoCloseable
```

## API Reference

### `FlagpoleClient`

| Member | Description |
| --- | --- |
| `new FlagpoleClient(apiKey)` / `(apiKey, config)` | Construct. Performs no I/O. |
| `void start()` | Initial fetch, then start polling. Re-fetches if called again. |
| `void refresh()` | Re-fetch every flag now |
| `boolean isEnabled(String)` | Fallback for unknown / disabled / non-matching flags. Never throws. |
| `Optional<FeatureFlag> flag(String)` | The full flag |
| `Map<String, FeatureFlag> allFlags()` | A snapshot of every loaded flag |
| `boolean isStarted()` | Whether `start()` has completed once |
| `void close()` | Stop polling (`AutoCloseable`) |

### `FlagpoleConfig.builder()`

| Method | Default | Description |
| --- | --- | --- |
| `environment(FlagpoleEnvironment)` | `PRODUCTION` | Which backend to talk to |
| `environments(List<String>)` | `null` (all) | Flag environments to load and evaluate against |
| `pollInterval(Duration)` | 30s | Refresh frequency. `Duration.ZERO` disables polling. |
| `requestTimeout(Duration)` | 10s | Per-request timeout |
| `fallback(String, boolean)` / `fallbacks(Map)` | – | Value for a flag that isn't loaded |
| `baseUrlOverride(String)` | – | Replace the host derived from `environment` |

### `FeatureFlag`

A record: `id()`, `name()`, `description()`, `isEnabled()` (raw switch — prefer
`client.isEnabled(name)`), `project()`, `organization()`,
`conditions()` (`Map<String, Object>`), `environments()` (`List<String>`, empty
means "all"), `createdAt()` / `updatedAt()` (raw ISO-8601 strings).

### `FlagpoleException`

A sealed unchecked exception: `FlagpoleException.Api` (has `statusCode()`,
`body()`), `FlagpoleException.InvalidResponse`, `FlagpoleException.Transport`.

## Spring Boot

Add the dependency, set your key, and the auto-configuration wires a
`FlagpoleClient` bean (calling `start()` for you — a failed first fetch just logs
and the app still boots), a `FlagpoleFilter`, and enforcement of
`@RequireFeatureFlag`.

```yaml
flagpole:
  api-key: fp_live_your_api_key
  environments: [production]
  poll-interval: 30s
  request-timeout: 10s
  fallbacks:
    new-checkout: false
```

```java
@RestController
class CheckoutController {

  private final FlagpoleClient flagpole;

  CheckoutController(FlagpoleClient flagpole) {
    this.flagpole = flagpole;
  }

  @GetMapping("/checkout")
  String checkout() {
    return flagpole.isEnabled("new-checkout") ? "new" : "legacy";
  }

  @GetMapping("/beta")
  @RequireFeatureFlag("beta-access")            // 404 when off
  String beta() {
    return "welcome";
  }

  @GetMapping("/early")
  @RequireFeatureFlag(value = "early-access", disabledStatus = 403)
  String early() {
    return "welcome";
  }
}
```

`@RequireFeatureFlag` also works on a `@RestController` class to gate every method.

## Plain Servlet

```java
FlagpoleClient client = new FlagpoleClient("fp_live_your_api_key");
client.start();

// attach the client to every request
context.addFilter("flagpole", new FlagpoleFilter(client))
    .addMappingForUrlPatterns(null, false, "/*");

// gate a path
context.addFilter("beta-gate", new RequireFlagFilter(client, "beta-access", 404))
    .addMappingForUrlPatterns(null, false, "/beta/*");
```

Downstream:

```java
FlagpoleClient flagpole = FlagpoleFilter.fromRequest(request).orElseThrow();
boolean on = flagpole.isEnabled("new-checkout");
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

### Logging

The SDK logs through `System.Logger` under the name `dev.useflagpole`, so it
routes to whatever logging backend your app configures (SLF4J, Log4j2, JUL).

## Error Handling

`isEnabled(...)` returns the configured fallback (default `false`) for any flag it
can't resolve and never throws.

`start()` and `refresh()` throw an unchecked `FlagpoleException`:

```java
try {
    client.start();
} catch (FlagpoleException.Api e) {
    log.warn("Flagpole rejected the request: {} {}", e.statusCode(), e.body());
    // carry on — isEnabled will use fallbacks
}
```

A failed poll is logged and retried on the next tick; it does not stop the client.

## Best Practices

### 1. One client per process

Create it at startup (or let Spring do it), share it, `close()` on shutdown.

### 2. Start before serving traffic

Call `start()` in your bootstrap so the first request already has flags.

### 3. Tune the poll interval

30s suits most rollouts. Drop it to a few seconds for kill-switch flags, or call
`refresh()` from an admin webhook.

### 4. Always set fallbacks for critical flags

```java
FlagpoleConfig.builder().fallback("payments-v2", false).build();
```

## Troubleshooting

### Flags are stale

Expected up to one poll interval. Lower `pollInterval` or call `refresh()`.

### Flags are always the fallback value

- Wrong or expired API key
- The flag targets environments not in your `environments` list
- The first fetch failed — check the logs / catch the `FlagpoleException` from `start()`

### The Spring auto-configuration didn't kick in

It is gated on `flagpole.api-key` being set and Spring MVC (`DispatcherServlet`)
being on the classpath.

## Contributing

The SDK lives in the
[`flagpole-sdks`](https://github.com/flagpole-corp/flagpole-sdks) monorepo under
`packages/server/java`.

```bash
git clone https://github.com/flagpole-corp/flagpole-sdks.git
cd flagpole-sdks/packages/server/java

gradle assemble
gradle test
gradle spotlessCheck
```

## License

MIT

## Support

- 📧 Email: support@useflagpole.dev
- 📚 Documentation: https://docs.useflagpole.dev
- 🐛 Issues: https://github.com/flagpole-corp/flagpole-sdks/issues
- 💬 Discord: https://discord.gg/flagpole
