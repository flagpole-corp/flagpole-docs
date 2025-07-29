---
id: nodejs
title: Node.js SDK
---

# Node.js SDK Integration

The Flagpole Node.js SDK provides server-side feature flag management with real-time updates, caching, Express.js middleware, decorators, and comprehensive utilities for backend applications.

## Installation

```bash
npm install @flagpole/node socket.io-client
# or
yarn add @flagpole/node socket.io-client
```

## Quick Start

### Basic Usage

```typescript
import { FlagpoleClient } from "@flagpole/node";

const client = new FlagpoleClient({
  apiKey: "fp_live_your_api_key_here",
  environments: ["development"], // optional
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
  },
  fallbacks: {
    "new-feature": false,
    "premium-feature": false,
  },
});

// Initialize client
await client.initialize();

// Check feature flags
const isEnabled = await client.isFeatureEnabled("new-feature");
console.log("Feature enabled:", isEnabled);

// With evaluation context
const isPremium = await client.isFeatureEnabled("premium-feature", {
  userId: "user-123",
  userType: "premium",
  email: "user@example.com",
});
```

## Core Features

### FlagpoleClient

The main client class for interacting with feature flags.

#### Configuration Options

```typescript
interface FeatureFlagConfig {
  apiKey: string; // Your Flagpole API key
  environments?: Environment[]; // Target environments
  cache?: {
    enabled?: boolean; // Enable caching (default: true)
    ttl?: number; // Cache TTL in seconds (default: 300)
  };
  fallbacks?: Record<string, boolean>; // Fallback values
  timeout?: number; // Request timeout in ms (default: 5000)
  retries?: number; // Number of retries (default: 3)
  logger?: Logger; // Custom logger instance
}
```

#### Environment Types

```typescript
type Environment = "development" | "staging" | "production";
```

#### Methods

```typescript
// Initialize the client (must call before using)
await client.initialize(): Promise<void>

// Check if a feature flag is enabled
await client.isFeatureEnabled(flagName: string, context?: EvaluationContext): Promise<boolean>

// Get complete flag details
await client.getFlag(flagName: string): Promise<FeatureFlag | null>

// Get all flags
await client.getAllFlags(): Promise<Record<string, FeatureFlag>>

// Refresh flags from API
await client.refreshFlags(): Promise<void>

// Get client status
client.getStatus(): {
  isInitialized: boolean;
  flagCount: number;
  cacheSize: number;
  isConnected: boolean;
}

// Clean up resources
client.destroy(): void
```

## Express.js Integration

### Middleware Setup

```typescript
import express from "express";
import {
  FlagpoleClient,
  flagpoleMiddleware,
  requireFeatureFlag,
  conditionalMiddleware,
} from "@flagpole/node";

const app = express();
const client = new FlagpoleClient({
  apiKey: "fp_live_your_api_key",
});

// Initialize client before using middleware
await client.initialize();

// Add Flagpole middleware
app.use(flagpoleMiddleware(client));

// Now you can use feature flags in routes
app.get("/dashboard", async (req, res) => {
  const showAdvanced = await req.flagpole!.isFeatureEnabled(
    "advanced-dashboard"
  );

  res.json({
    advanced: showAdvanced,
    message: showAdvanced ? "Advanced dashboard" : "Basic dashboard",
  });
});
```

### Route Protection

```typescript
// Protect entire routes with feature flags
app.get("/beta", requireFeatureFlag("beta-access"), (req, res) => {
  res.json({ message: "Welcome to beta!" });
});

// With custom options
app.get(
  "/premium",
  requireFeatureFlag("premium-feature", {
    fallbackUrl: "/upgrade",
    fallbackStatus: 403,
    fallbackMessage: "Premium feature not available",
    context: { userType: "premium" },
  }),
  (req, res) => {
    res.json({ message: "Premium content" });
  }
);
```

### Conditional Middleware

```typescript
import rateLimit from "express-rate-limit";

// Only apply rate limiting if feature flag is enabled
app.use(
  conditionalMiddleware(
    "rate-limiting-enabled",
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    })
  )
);
```

### Request Context

The middleware automatically extracts context from request headers:

```typescript
// Headers used for evaluation context:
// x-user-id - User ID
// x-user-type - User type (premium, basic, etc.)
// x-user-email - User email
// x-user-country - User country
// user-agent - Browser/client info
// x-flagpole-* - Custom context headers

// Example request:
fetch("/api/feature", {
  headers: {
    "x-user-id": "user123",
    "x-user-type": "premium",
    "x-flagpole-segment": "beta-testers",
  },
});
```

## Decorators

### Setup Global Client

```typescript
import { setGlobalFlagpoleClient } from "@flagpole/node";

const client = new FlagpoleClient({ apiKey: "your-api-key" });
await client.initialize();

// Set global client for decorators
setGlobalFlagpoleClient(client);
```

### Method Decorator

```typescript
import { FeatureFlag } from "@flagpole/node";

class UserService {
  @FeatureFlag("new-user-flow", {
    fallbackValue: null,
    throwOnDisabled: false,
    context: { userType: "new" },
  })
  async createUserWithNewFlow(userData: any) {
    // This method only runs if 'new-user-flow' is enabled
    return this.createUserAdvanced(userData);
  }

  @FeatureFlag("premium-analytics", {
    throwOnDisabled: true,
  })
  async generatePremiumReport(userId: string) {
    // Throws error if flag is disabled
    return this.advancedAnalytics(userId);
  }
}
```

### Class Decorator

```typescript
import { FeatureFlagClass } from "@flagpole/node";

@FeatureFlagClass("new-payment-system", {
  fallbackClass: OldPaymentProcessor,
})
class NewPaymentProcessor {
  async processPayment(amount: number) {
    // Advanced payment processing
    return { success: true, processorVersion: "v2" };
  }
}

class OldPaymentProcessor {
  async processPayment(amount: number) {
    // Legacy payment processing
    return { success: true, processorVersion: "v1" };
  }
}
```

### Property Decorator

```typescript
import { FeatureFlagProperty } from "@flagpole/node";

class ConfigService {
  @FeatureFlagProperty("use-new-api-endpoint", {
    enabledValue: "https://api-v2.example.com",
    disabledValue: "https://api-v1.example.com",
  })
  apiEndpoint!: string;

  @FeatureFlagProperty("max-retry-attempts", {
    enabledValue: 5,
    disabledValue: 3,
  })
  maxRetries!: number;
}
```

## Utility Functions

### Higher-Order Function Wrapper

```typescript
import { withFeatureFlag } from "@flagpole/node";

const originalFunction = async (data: any) => {
  return processDataAdvanced(data);
};

const fallbackFunction = async (data: any) => {
  return processDataBasic(data);
};

const wrappedFunction = withFeatureFlag(
  client,
  "advanced-processing",
  originalFunction,
  {
    fallbackFn: fallbackFunction,
    context: { feature: "data-processing" },
  }
);

// Usage
const result = await wrappedFunction(userData);
```

### Batch Flag Checking

```typescript
import { checkMultipleFlags } from "@flagpole/node";

const flags = await checkMultipleFlags(
  client,
  ["feature-a", "feature-b", "feature-c"],
  { userId: "user123" }
);

console.log(flags);
// { 'feature-a': true, 'feature-b': false, 'feature-c': true }
```

### A/B Testing

```typescript
import { ABTest } from "@flagpole/node";

const checkoutTest = new ABTest(client, "checkout-experiment", [
  "control",
  "variant-a",
  "variant-b",
]);

const variant = await checkoutTest.getVariant();
console.log("User assigned to:", variant);

// Check specific variant
const isVariantA = await checkoutTest.isVariant("variant-a");
if (isVariantA) {
  // Show variant A UI
}
```

### Flag Polling for Long-Running Processes

```typescript
import { FlagPoller } from "@flagpole/node";

const poller = new FlagPoller(client, 30000); // Poll every 30 seconds

// Watch for flag changes
const unwatch = poller.watch("maintenance-mode", (isEnabled) => {
  if (isEnabled) {
    console.log("Entering maintenance mode");
    // Gracefully shut down services
  } else {
    console.log("Exiting maintenance mode");
    // Resume services
  }
});

// Stop watching
// unwatch();

// Clean up poller
// poller.destroy();
```

### Environment-Aware Client

```typescript
import { createEnvironmentAwareClient } from "@flagpole/node";

const client = createEnvironmentAwareClient(
  {
    apiKey: "base-api-key",
    environments: ["development"],
    cache: { enabled: true },
  },
  {
    production: {
      apiKey: "prod-api-key",
      environments: ["production"],
      cache: { ttl: 600 },
    },
    staging: {
      apiKey: "staging-api-key",
      environments: ["staging"],
    },
  }
);
```

## Advanced Features

### Custom Logger

```typescript
import { ConsoleLogger, NoOpLogger, createLogger } from "@flagpole/node";

// Use built-in console logger
const consoleLogger = new ConsoleLogger();

// Create silent logger
const noLogger = new NoOpLogger();

// Create conditional logger
const logger = createLogger(process.env.NODE_ENV === "development");

// Custom logger implementation
class CustomLogger {
  debug(message: string, meta?: any): void {
    // Custom debug implementation
  }

  info(message: string, meta?: any): void {
    // Custom info implementation
  }

  warn(message: string, meta?: any): void {
    // Custom warn implementation
  }

  error(message: string, meta?: any): void {
    // Custom error implementation
  }
}

const client = new FlagpoleClient({
  apiKey: "your-api-key",
  logger: new CustomLogger(),
});
```

### Memory Cache Management

```typescript
import { MemoryCache } from "@flagpole/node";

// Direct cache usage (usually not needed)
const cache = new MemoryCache(300, logger); // 5 minute TTL

// Cache operations
cache.set("flag-name", flagData, 600); // Custom TTL
const cached = cache.get("flag-name");
cache.delete("flag-name");
cache.clear();
console.log("Cache size:", cache.size());
```

### HTTP Client Configuration

```typescript
import { HttpClient } from "@flagpole/node";

const httpClient = new HttpClient({
  timeout: 10000, // 10 second timeout
  retries: 5, // 5 retry attempts
  logger: customLogger,
});

// The client handles retries with exponential backoff
const data = await httpClient.get("https://api.example.com/data", {
  Authorization: "Bearer token",
});
```

## Error Handling

### Basic Error Handling

```typescript
try {
  await client.initialize();
  const isEnabled = await client.isFeatureEnabled("my-feature");
} catch (error) {
  console.error("Feature flag error:", error);
  // Use fallback behavior
  const isEnabled = false;
}
```

### Graceful Degradation

```typescript
const client = new FlagpoleClient({
  apiKey: "your-api-key",
  fallbacks: {
    "critical-feature": true, // Safe default
    "experimental-feature": false, // Conservative default
  },
});

// Client automatically uses fallbacks on errors
const isEnabled = await client.isFeatureEnabled("critical-feature");
// Returns fallback value if API is unavailable
```

### Connection Status Monitoring

```typescript
const status = client.getStatus();
if (!status.isConnected) {
  console.warn(
    "Feature flag service unavailable, using cached/fallback values"
  );
}

if (!status.isInitialized) {
  console.error("Client not initialized");
}
```

## Best Practices

### 1. Initialize Early

```typescript
// Initialize client at application startup
async function startServer() {
  const client = new FlagpoleClient({ apiKey: process.env.FLAGPOLE_API_KEY });
  await client.initialize();

  const app = express();
  app.use(flagpoleMiddleware(client));

  app.listen(3000);
}
```

### 2. Use Environment Variables

```typescript
const client = new FlagpoleClient({
  apiKey: process.env.FLAGPOLE_API_KEY!,
  environments: process.env.NODE_ENV
    ? [process.env.NODE_ENV as Environment]
    : ["development"],
  cache: {
    enabled: process.env.FLAGPOLE_CACHE !== "false",
    ttl: parseInt(process.env.FLAGPOLE_CACHE_TTL || "300"),
  },
});
```

### 3. Provide Meaningful Fallbacks

```typescript
const client = new FlagpoleClient({
  apiKey: "your-api-key",
  fallbacks: {
    "new-checkout-flow": false, // Conservative: use old flow
    "enhanced-security": true, // Safe: enable security features
    "experimental-ai": false, // Conservative: disable experiments
    "maintenance-mode": false, // Safe: assume not in maintenance
  },
});
```

### 4. Use Descriptive Flag Names

```typescript
// ✅ Good
await client.isFeatureEnabled("show-beta-dashboard");
await client.isFeatureEnabled("enable-advanced-analytics");
await client.isFeatureEnabled("use-new-payment-gateway");

// ❌ Avoid
await client.isFeatureEnabled("flag1");
await client.isFeatureEnabled("test");
await client.isFeatureEnabled("new");
```

### 5. Clean Up Resources

```typescript
// In your application shutdown handler
process.on("SIGTERM", () => {
  client.destroy();
  poller?.destroy();
  process.exit(0);
});
```

### 6. Use Context for Targeting

```typescript
const context = {
  userId: user.id,
  userType: user.plan, // 'basic', 'premium', 'enterprise'
  email: user.email,
  country: user.country,
  // Custom attributes
  betaTester: user.betaTester,
  accountAge: user.accountAgeInDays,
};

const isEnabled = await client.isFeatureEnabled("premium-feature", context);
```

### 7. Test Feature Flags

```typescript
// In your tests
import { FlagpoleClient } from "@flagpole/node";

describe("Feature Flag Tests", () => {
  let mockClient: jest.Mocked<FlagpoleClient>;

  beforeEach(() => {
    mockClient = {
      isFeatureEnabled: jest.fn(),
      getFlag: jest.fn(),
      // ... other methods
    } as any;
  });

  it("should show new feature when flag is enabled", async () => {
    mockClient.isFeatureEnabled.mockResolvedValue(true);

    const result = await someFunction(mockClient);

    expect(result.newFeature).toBe(true);
  });

  it("should fallback when flag is disabled", async () => {
    mockClient.isFeatureEnabled.mockResolvedValue(false);

    const result = await someFunction(mockClient);

    expect(result.newFeature).toBe(false);
  });
});
```

## Performance Considerations

### 1. Caching Strategy

```typescript
const client = new FlagpoleClient({
  apiKey: "your-api-key",
  cache: {
    enabled: true,
    ttl: 300, // Balance between freshness and performance
  },
});
```

### 2. Batch Operations

```typescript
// ✅ Efficient: Check multiple flags at once
const flags = await checkMultipleFlags(client, [
  "feature-a",
  "feature-b",
  "feature-c",
]);

// ❌ Inefficient: Multiple individual calls
const flagA = await client.isFeatureEnabled("feature-a");
const flagB = await client.isFeatureEnabled("feature-b");
const flagC = await client.isFeatureEnabled("feature-c");
```

### 3. Connection Management

```typescript
// Client automatically handles:
// - WebSocket reconnections
// - Request retries with exponential backoff
// - Connection pooling
// - Circuit breaker patterns
```

## Troubleshooting

### Common Issues

#### 1. Client Not Initialized

```typescript
// ❌ Error: Using client before initialization
const client = new FlagpoleClient({ apiKey: "key" });
await client.isFeatureEnabled("flag"); // Error!

// ✅ Correct: Initialize first
const client = new FlagpoleClient({ apiKey: "key" });
await client.initialize();
await client.isFeatureEnabled("flag"); // Works!
```

#### 2. Invalid API Key

```typescript
// Check your API key format
console.log(process.env.FLAGPOLE_API_KEY); // Should start with 'fp_live_'
```

#### 3. Network Issues

```typescript
// Configure timeout and retries for poor network conditions
const client = new FlagpoleClient({
  apiKey: "your-api-key",
  timeout: 10000, // 10 seconds
  retries: 5, // 5 attempts
});
```

#### 4. Decorator Issues

```typescript
// Make sure to set global client before using decorators
setGlobalFlagpoleClient(client);

// Ensure client is initialized
await client.initialize();
```

### Debug Mode

```typescript
// Enable debug logging
const client = new FlagpoleClient({
  apiKey: "your-api-key",
  logger: createLogger(true), // Enable logging
});

// Or set environment variable
process.env.FLAGPOLE_DEBUG = "true";
```

### Health Checks

```typescript
app.get("/health", async (req, res) => {
  const status = client.getStatus();

  res.json({
    flagpole: {
      initialized: status.isInitialized,
      connected: status.isConnected,
      flagCount: status.flagCount,
      cacheSize: status.cacheSize,
    },
  });
});
```

## Migration Guide

### From Other Feature Flag Services

```typescript
// LaunchDarkly style
// Before: ldClient.variation('flag-key', user, false)
// After:
const isEnabled = await client.isFeatureEnabled("flag-key", {
  userId: user.id,
  email: user.email,
});

// Split.io style
// Before: splitClient.getTreatment('user-id', 'feature-flag')
// After:
const isEnabled = await client.isFeatureEnabled("feature-flag", {
  userId: "user-id",
});
```

### Version Updates

When updating the SDK:

1. Check the [changelog](https://github.com/your-org/flagpole-node/releases)
2. Update your package.json
3. Test in a staging environment
4. Deploy with monitoring

```bash
npm update @flagpole/node
```

## API Reference

### Types

```typescript
interface FeatureFlag {
  _id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  project: string;
  organization: string;
  conditions: Record<string, any>;
  environments: Environment[];
  createdAt: string;
  updatedAt: string;
}

interface EvaluationContext {
  userId?: string;
  userType?: string;
  email?: string;
  country?: string;
  browser?: string;
  os?: string;
  [key: string]: any; // Custom attributes
}

interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}
```

## Support

- **Documentation**: [https://docs.useflagpole.dev](https://docs.useflagpole.dev)
- **GitHub Issues**: [Report bugs](https://github.com/your-org/flagpole-node/issues)
- **Email Support**: support@useflagpole.dev
- **Community**: [Discord](https://discord.gg/flagpole)

## Examples

Check out our [example applications](https://github.com/your-org/flagpole-examples):

- Express.js REST API
- Next.js full-stack application
- Microservices architecture
- Background job processing
- Real-time applications with Socket.io

---

Ready to implement feature flags in your Node.js application? [Get your API key](https://app.useflagpole.dev) and start building!
