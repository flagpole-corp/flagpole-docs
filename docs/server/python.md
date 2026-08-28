---
id: python
title: Python
---

# Python

A server-side Python SDK for Flagpole feature flags — real-time updates over
WebSocket, an in-memory cache, environment targeting, and optional Flask /
FastAPI / Django helpers.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Framework Integrations](#framework-integrations)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

- 🚀 **Real-time Updates**: a `python-socketio` background thread applies flag
  changes as they happen — no polling
- ⚡ **Non-blocking reads**: after `initialize()`, `is_feature_enabled()` is a
  pure in-memory lookup, safe on hot paths and from async code
- 🗄️ **In-memory cache**: TTL cache in front of the flag map
- 🌍 **Environment Targeting**: load and evaluate flags per environment
- 🧩 **Framework helpers**: Flask, FastAPI, Django — installed on demand
- 🔐 **Fail-safe**: unknown or unreachable flags return your configured fallback

## Installation

```bash
pip install flagpole-sdk
```

For a framework helper, add the matching extra:

```bash
pip install "flagpole-sdk[flask]"
pip install "flagpole-sdk[fastapi]"
pip install "flagpole-sdk[django]"
```

The package imports as **`flagpole_sdk`** (`flagpole` was already taken on PyPI).

### Requirements

- Python >= 3.9

## Quick Start

### 1. Create and initialize the client

```python
from flagpole_sdk import FlagpoleClient

client = FlagpoleClient(
    "fp_live_your_api_key",
    environments=["production"],
    fallbacks={"new-checkout": False},
)
client.initialize()
```

`initialize()` fetches the flag set once (blocking) and opens the live-updates
socket on a background thread.

### 2. Check flags

```python
if client.is_feature_enabled("new-checkout"):
    ...

# The full flag, including targeting conditions
flag = client.get_flag("new-checkout")

# Everything currently loaded
all_flags = client.get_all_flags()
```

### 3. Shut down

```python
client.close()
```

Or let a `with` block manage it:

```python
with FlagpoleClient("fp_live_your_api_key") as client:
    client.is_feature_enabled("new-checkout")
```

## API Reference

### `FlagpoleClient(api_key, **options)`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `api_key` | `str` | – | Your FlagPole API key (positional, required) |
| `environments` | `list[str] \| None` | all | Flag environments to load and evaluate against |
| `environment` | `FlagpoleEnvironment \| str` | `production` | Which backend to talk to |
| `cache_enabled` | `bool` | `True` | Keep a TTL cache in front of the flag map |
| `cache_ttl` | `float` | `300` | Cache entry lifetime, seconds |
| `fallbacks` | `dict[str, bool] \| None` | `{}` | Value returned for a flag that can't be resolved |
| `timeout` | `float` | `10` | REST request timeout, seconds |
| `enable_realtime` | `bool` | `True` | Open the WebSocket |
| `logger` | `logging.Logger \| None` | SDK logger | Where the SDK logs |
| `session` | `requests.Session \| None` | new session | Bring your own HTTP session |

### Methods

| Method | Description |
| --- | --- |
| `initialize()` | Fetch flags, then connect the socket if `enable_realtime`. Idempotent. |
| `refresh()` | Re-fetch every flag over REST |
| `is_feature_enabled(name, context=None)` | `bool` — fallback for unknown / disabled / non-matching flags. Never raises. |
| `get_flag(name)` | `FeatureFlag \| None` |
| `get_all_flags()` | `dict[str, FeatureFlag]` (a copy) |
| `close()` | Disconnect the socket, release the session and cache |
| `replace_flags(list)` / `apply_flag_update(flag)` / `apply_flag_delete(id)` | Push updates from another source |

### Properties

| Property | Description |
| --- | --- |
| `is_connected` | `bool` — WebSocket state |
| `status` | `dict` — `initialized`, `flag_count`, `cache_size`, `connected`, `environment` |

### `FeatureFlag`

```python
@dataclass(frozen=True)
class FeatureFlag:
    id: str
    name: str
    is_enabled: bool          # raw switch — prefer client.is_feature_enabled()
    description: str
    project: str
    organization: str
    conditions: dict[str, Any]
    environments: list[str]    # empty means "all"
    created_at: datetime | None
    updated_at: datetime | None
```

### Framework-agnostic decorator

```python
from flagpole_sdk import require_feature_flag

@require_feature_flag(client, "beta-export")
def export_report():
    ...
```

When the flag is off it calls `on_disabled` (if given) or raises
`FeatureDisabledError`.

## Framework Integrations

### Flask

```python
from flask import Flask, g
from flagpole_sdk import FlagpoleClient
from flagpole_sdk.integrations.flask import Flagpole, require_feature_flag

app = Flask(__name__)
Flagpole(app, client=FlagpoleClient("fp_live_your_api_key"))
# or: app.config["FLAGPOLE_API_KEY"] = "..."; Flagpole(app)

@app.get("/beta")
@require_feature_flag("beta-access")      # 404 when off (status_code=...)
def beta():
    return {"ok": True}

@app.get("/dashboard")
def dashboard():
    return {"advanced": g.flagpole.is_feature_enabled("advanced-dashboard")}
```

### FastAPI

```python
from fastapi import Depends, FastAPI
from flagpole_sdk import FlagpoleClient
from flagpole_sdk.integrations.fastapi import FlagpoleDep

client = FlagpoleClient("fp_live_your_api_key")
app = FastAPI(on_startup=[client.initialize], on_shutdown=[client.close])
flagpole = FlagpoleDep(client)

@app.get("/dashboard")
def dashboard(fp: FlagpoleClient = Depends(flagpole)):
    return {"advanced": fp.is_feature_enabled("advanced-dashboard")}

@app.get("/new-ui")
def new_ui(on: bool = Depends(flagpole.flag("new-ui"))):
    return {"new_ui": on}

@app.get("/beta", dependencies=[Depends(flagpole.require("beta-access"))])
def beta():
    return {"ok": True}
```

### Django

`settings.py`:

```python
INSTALLED_APPS = [..., "flagpole_sdk.integrations.django"]
MIDDLEWARE = [..., "flagpole_sdk.integrations.django.FlagpoleMiddleware"]

FLAGPOLE_API_KEY = "fp_live_your_api_key"
FLAGPOLE_ENVIRONMENTS = ["production"]
```

`views.py`:

```python
from django.http import JsonResponse
from flagpole_sdk.integrations.django import require_feature_flag

@require_feature_flag("beta-access")     # raises Http404 when off
def beta(request):
    return JsonResponse({"ok": True})

def dashboard(request):
    return JsonResponse(
        {"advanced": request.flagpole.is_feature_enabled("advanced-dashboard")}
    )
```

## Configuration

### Environments

`environments=` is a **filter** — it controls which flags are loaded and how
`is_feature_enabled` evaluates targeting. A flag with an empty `environments`
list always applies.

### Backend host

`environment=` selects which Flagpole backend the SDK talks to.

| `FlagpoleEnvironment` | REST |
| --- | --- |
| `DEVELOPMENT` | `http://localhost:5000` |
| `STAGING` | `https://api.staging.useflagpole.dev` |
| `PRODUCTION` | `https://useflagpole-api.onrender.com` |

```python
from flagpole_sdk import FlagpoleClient, FlagpoleEnvironment

FlagpoleClient("fp_live_your_api_key", environment=FlagpoleEnvironment.STAGING)
```

### Logging

The SDK logs under the `flagpole_sdk` logger with a `NullHandler` attached, so it
stays silent until you configure it:

```python
import logging
logging.getLogger("flagpole_sdk").setLevel(logging.INFO)
```

## Error Handling

The SDK fails safe: `is_feature_enabled` returns the configured fallback (default
`False`) for any flag it can't resolve and never raises.

`initialize()` **does** raise if the first fetch fails:

```python
from flagpole_sdk import FlagpoleAPIError

try:
    client.initialize()
except FlagpoleAPIError as exc:
    log.error("Flagpole unavailable: %s %s", exc.status_code, exc.body)
    # carry on — is_feature_enabled will use fallbacks
```

WebSocket failures are logged and retried in the background; they never raise.

## Best Practices

### 1. One client per process

Create the client at startup, share it everywhere, `close()` on shutdown. Each
client holds a WebSocket.

### 2. Initialize before serving traffic

Call `initialize()` in your app's startup hook (`FastAPI(on_startup=...)`, Flask
extension, Django `AppConfig.ready`) so the first request already has flags.

### 3. Always set fallbacks for critical flags

```python
FlagpoleClient(api_key, fallbacks={"payments-v2": False})
```

### 4. Reads are cheap — call them inline

After `initialize()`, `is_feature_enabled()` does no I/O. There's no need to
cache its result in your own code.

## Troubleshooting

### `get_flag(...) called before initialize()`

Call `client.initialize()` (or use the `with` block / a framework startup hook)
before reading flags.

### Flags are always the fallback value

- Wrong or expired API key
- The flag targets environments not in your `environments=` list
- No network on first load — check for a `FlagpoleAPIError` from `initialize()`

### `is_connected` stays `False`

`enable_realtime` must be `True` (default). The socket connects on a background
thread shortly after `initialize()`; transient failures retry automatically.
Check that the WebSocket host is reachable from your environment.

### Blocking in an async app

Only `initialize()` and `refresh()` block (they do HTTP). Call them from a
startup hook or a thread executor, not inside a request handler. Everything else
is non-blocking.

## Contributing

The SDK lives in the
[`flagpole-sdks`](https://github.com/flagpole-corp/flagpole-sdks) monorepo under
`packages/server/python`.

```bash
git clone https://github.com/flagpole-corp/flagpole-sdks.git
cd flagpole-sdks/packages/server/python

pip install -e ".[dev]"
ruff check .
mypy
pytest
```

## License

MIT

## Support

- 📧 Email: support@useflagpole.dev
- 📚 Documentation: https://docs.useflagpole.dev
- 🐛 Issues: https://github.com/flagpole-corp/flagpole-sdks/issues
- 💬 Discord: https://discord.gg/flagpole
