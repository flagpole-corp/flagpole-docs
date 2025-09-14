---
id: react
title: React
---

# React SDK Integration

The FlagPole React SDK provides seamless integration of feature flags into your React applications with real-time updates, TypeScript support, and developer-friendly APIs.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Advanced Usage](#advanced-usage)
- [Best Practices](#best-practices)
- [TypeScript Support](#typescript-support)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Installation

### Using npm

```bash
npm install @flagpole/react
```

### Using yarn

```bash
yarn add @flagpole/react
```

### Requirements

- React >= 16.8.0 (hooks support required)
- socket.io-client >= 4.0.0

## Quick Start

### 1. Wrap Your Application

Initialize the SDK by wrapping your root component with `FeatureFlagProvider`:

```typescript
// App.tsx
import React from "react";
import { FeatureFlagProvider } from "@flagpole/react";
import MainApp from "./MainApp";

function App() {
  return (
    <FeatureFlagProvider
      apiKey="fp_live_your_api_key"
      environments={["development"]} // Optional: defaults to all environments
    >
      <MainApp />
    </FeatureFlagProvider>
  );
}

export default App;
```

### 2. Use Feature Flags in Components

```typescript
import React from "react";
import { useFeatureFlag, useFeatureFlags } from "@flagpole/react";

export const FeatureComponent = () => {
  // Get all feature flags and metadata
  const { flags, isLoading, error } = useFeatureFlags();

  // Get a specific feature flag
  const isNewFeatureEnabled = useFeatureFlag("newFeature");
  const showBetaUI = useFeatureFlag("betaUserInterface");

  if (isLoading) return <div>Loading flags...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>My Application</h2>

      {/* Conditional rendering based on flags */}
      {isNewFeatureEnabled && (
        <div className="new-feature">
          <h3>🎉 New Feature Available!</h3>
          <NewFeatureComponent />
        </div>
      )}

      {showBetaUI ? <BetaUserInterface /> : <StandardUserInterface />}

      {/* Debug panel for development */}
      {process.env.NODE_ENV === "development" && (
        <details>
          <summary>Feature Flags Debug</summary>
          <pre>{JSON.stringify(flags, null, 2)}</pre>
        </details>
      )}
    </div>
  );
};
```

## API Reference

### FeatureFlagProvider

The main provider component that manages feature flag state and WebSocket connections.

#### Props

| Prop           | Type      | Required | Default          | Description                              |
| -------------- | --------- | -------- | ---------------- | ---------------------------------------- |
| `apiKey`       | string    | ✅       | -                | Your FlagPole API key                    |
| `environments` | string[]  | ❌       | All environments | Array of environments to load flags from |
| `children`     | ReactNode | ✅       | -                | Your application components              |

#### Example

```typescript
<FeatureFlagProvider
  apiKey="fp_live_abc123..."
  environments={["production", "staging"]}
>
  <App />
</FeatureFlagProvider>
```

### useFeatureFlag

Hook to check if a specific feature flag is enabled.

#### Parameters

- `flagName` (string): The name of the feature flag

#### Returns

- `boolean`: True if enabled, false otherwise

#### Example

```typescript
function MyComponent() {
  const isEnabled = useFeatureFlag("my-awesome-feature");

  return <div>{isEnabled ? <NewFeature /> : <LegacyFeature />}</div>;
}
```

### useFeatureFlags

Hook to access all feature flags and metadata.

#### Returns

```typescript
{
  flags: Record<string, FeatureFlag>;
  isLoading: boolean;
  error: Error | null;
  isFeatureEnabled: (flagName: string) => boolean;
}
```

#### Example

```typescript
function DebugPanel() {
  const { flags, isLoading, error, isFeatureEnabled } = useFeatureFlags();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Feature Flags Status</h3>
      {Object.entries(flags).map(([name, flag]) => (
        <div key={name}>
          <strong>{name}:</strong> {flag.isEnabled ? "✅" : "❌"}
          <br />
          <small>Environments: {flag.environments?.join(", ")}</small>
        </div>
      ))}
    </div>
  );
}
```

### withFeatureFlag

Higher-order component for conditional rendering based on feature flags.

#### Parameters

- `WrappedComponent`: React component to conditionally render
- `flagName`: Feature flag name to check
- `FallbackComponent` (optional): Component to render when flag is disabled

#### Example

```typescript
import { withFeatureFlag } from "@flagpole/react";

const PremiumDashboard = () => (
  <div>
    <h2>Premium Dashboard</h2>
    <PremiumFeatures />
  </div>
);

const StandardDashboard = () => (
  <div>
    <h2>Standard Dashboard</h2>
    <BasicFeatures />
  </div>
);

// Only show PremiumDashboard when 'premium-features' flag is enabled
export const ConditionalDashboard = withFeatureFlag(
  PremiumDashboard,
  "premium-features",
  StandardDashboard // Fallback component
);

// Usage
function App() {
  return (
    <div>
      <ConditionalDashboard />
    </div>
  );
}
```

## Advanced Usage

### Environment-Specific Configuration

Configure different environments for development, staging, and production:

```typescript
// config/flagpole.ts
export const getFlagpoleConfig = () => {
  const environment = process.env.NODE_ENV;

  switch (environment) {
    case "development":
      return {
        apiKey: process.env.REACT_APP_FLAGPOLE_DEV_KEY!,
        environments: ["development"],
      };
    case "staging":
      return {
        apiKey: process.env.REACT_APP_FLAGPOLE_STAGING_KEY!,
        environments: ["staging"],
      };
    case "production":
      return {
        apiKey: process.env.REACT_APP_FLAGPOLE_PROD_KEY!,
        environments: ["production"],
      };
    default:
      throw new Error(`Unknown environment: ${environment}`);
  }
};

// App.tsx
import { getFlagpoleConfig } from "./config/flagpole";

function App() {
  const config = getFlagpoleConfig();

  return (
    <FeatureFlagProvider {...config}>
      <MainApp />
    </FeatureFlagProvider>
  );
}
```

### Feature Wrapper Component

Create reusable wrapper for conditional rendering:

```typescript
interface FeatureWrapperProps {
  flagKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

const FeatureWrapper: React.FC<FeatureWrapperProps> = ({
  flagKey,
  children,
  fallback = null,
  loading = null,
}) => {
  const { isLoading } = useFeatureFlags();
  const isEnabled = useFeatureFlag(flagKey);

  if (isLoading) return <>{loading}</>;
  return isEnabled ? <>{children}</> : <>{fallback}</>;
};

// Usage
const MyComponent = () => {
  return (
    <div>
      <FeatureWrapper
        flagKey="premiumFeature"
        fallback={<div>Upgrade to premium to access this feature</div>}
        loading={<div>Loading feature...</div>}
      >
        <PremiumContent />
      </FeatureWrapper>
    </div>
  );
};
```

### Complex Conditional Logic

Handle multiple flags with complex logic:

```typescript
import { useFeatureFlags } from "@flagpole/react";

const AdvancedFeatureComponent = () => {
  const { isFeatureEnabled } = useFeatureFlags();

  const showAdvancedUI = isFeatureEnabled("advancedUI");
  const showBetaFeatures = isFeatureEnabled("betaFeatures");
  const showPremiumContent = isFeatureEnabled("premiumContent");
  const isUserPremium = isFeatureEnabled("userPremiumStatus");

  // Complex conditional logic
  const shouldShowPremiumBeta =
    showBetaFeatures && showPremiumContent && isUserPremium;
  const uiVariant = showAdvancedUI ? "advanced" : "standard";

  return (
    <div className={`ui-${uiVariant}`}>
      {shouldShowPremiumBeta && <PremiumBetaFeature />}

      {showAdvancedUI ? <AdvancedUIComponent /> : <StandardUIComponent />}

      {showBetaFeatures && !isUserPremium && <BetaFeaturePreview />}
    </div>
  );
};
```

### Custom Hook for Navigation

Create domain-specific hooks:

```typescript
import { useMemo } from "react";
import { useFeatureFlags, useFeatureFlag } from "@flagpole/react";

interface NavigationItem {
  label: string;
  path: string;
  icon?: string;
  badge?: string;
}

const useNavigation = () => {
  const newNavEnabled = useFeatureFlag("newNavigation");
  const adminPanelEnabled = useFeatureFlag("adminPanel");
  const betaFeaturesEnabled = useFeatureFlag("betaFeatures");
  const { isLoading } = useFeatureFlags();

  const navigationItems: NavigationItem[] = useMemo(() => {
    const items: NavigationItem[] = [
      { label: "Home", path: "/", icon: "home" },
      { label: "About", path: "/about", icon: "info" },
    ];

    if (newNavEnabled) {
      items.push({
        label: "Dashboard",
        path: "/dashboard",
        icon: "dashboard",
      });
    }

    if (adminPanelEnabled) {
      items.push({
        label: "Admin",
        path: "/admin",
        icon: "admin",
      });
    }

    if (betaFeaturesEnabled) {
      items.push({
        label: "Beta",
        path: "/beta",
        icon: "lab",
        badge: "NEW",
      });
    }

    return items;
  }, [newNavEnabled, adminPanelEnabled, betaFeaturesEnabled]);

  return { navigationItems, isLoading };
};

// Usage
const Navigation = () => {
  const { navigationItems, isLoading } = useNavigation();

  if (isLoading) return <div>Loading navigation...</div>;

  return (
    <nav>
      {navigationItems.map((item) => (
        <a key={item.path} href={item.path} className="nav-item">
          <span className={`icon-${item.icon}`} />
          {item.label}
          {item.badge && <span className="badge">{item.badge}</span>}
        </a>
      ))}
    </nav>
  );
};
```

### React Router Integration

Protect routes with feature flags:

```typescript
import { Routes, Route, Navigate } from "react-router-dom";
import { useFeatureFlag } from "@flagpole/react";

const ProtectedRoute = ({
  children,
  flagKey,
  fallbackPath = "/",
  fallbackComponent,
}) => {
  const isEnabled = useFeatureFlag(flagKey);

  if (!isEnabled) {
    if (fallbackComponent) return fallbackComponent;
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        path="/beta/*"
        element={
          <ProtectedRoute
            flagKey="betaAccess"
            fallbackComponent={<ComingSoonPage />}
          >
            <BetaFeatures />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute flagKey="adminPanel" fallbackPath="/unauthorized">
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/premium/*"
        element={
          <ProtectedRoute flagKey="premiumFeatures">
            <PremiumSection />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
```

### A/B Testing Implementation

Handle A/B testing scenarios:

```typescript
import { useFeatureFlags } from "@flagpole/react";

const ABTestComponent = () => {
  const { flags } = useFeatureFlags();

  // Access full flag data for A/B testing
  const experimentFlag = flags["checkoutExperiment"];
  const variant = experimentFlag?.conditions?.variant || "control";
  const percentage = experimentFlag?.conditions?.percentage || 0;

  // Log experiment exposure for analytics
  useEffect(() => {
    if (experimentFlag?.isEnabled) {
      analytics.track("experiment_exposure", {
        experiment: "checkoutExperiment",
        variant,
        percentage,
      });
    }
  }, [variant, percentage, experimentFlag?.isEnabled]);

  switch (variant) {
    case "variantA":
      return <CheckoutVariantA />;
    case "variantB":
      return <CheckoutVariantB />;
    case "control":
    default:
      return <CheckoutControl />;
  }
};
```

### Real-time Updates Handling

React to real-time flag changes:

```typescript
function LiveConfigPanel() {
  const { flags } = useFeatureFlags();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Track when flags change
  useEffect(() => {
    setLastUpdate(new Date());
  }, [flags]);

  // Show notification when flags update
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  useEffect(() => {
    setShowUpdateNotification(true);
    const timer = setTimeout(() => setShowUpdateNotification(false), 3000);
    return () => clearTimeout(timer);
  }, [flags]);

  return (
    <div>
      {showUpdateNotification && (
        <div className="notification">Feature flags updated! 🎉</div>
      )}

      <div>
        <small>Last updated: {lastUpdate.toLocaleTimeString()}</small>
        <div>Active flags: {Object.keys(flags).length}</div>
      </div>
    </div>
  );
}
```

## Best Practices

### 1. API Key Security

**Environment Variables**

```typescript
// .env.development
REACT_APP_FLAGPOLE_API_KEY=fp_dev_your_dev_key

// .env.production
REACT_APP_FLAGPOLE_API_KEY=fp_live_your_prod_key

// App.tsx
<FeatureFlagProvider
  apiKey={process.env.REACT_APP_FLAGPOLE_API_KEY!}
  environments={process.env.NODE_ENV === 'development' ? ['development'] : ['production']}
>
```

**Security Checklist**

- ✅ Store API keys in environment variables
- ✅ Use different keys for different environments
- ✅ Never commit API keys to source control
- ✅ Rotate keys if they're ever exposed
- ✅ Use read-only client keys (not admin keys)

### 2. Error Handling

Always handle loading and error states:

```typescript
const RobustFeatureComponent = () => {
  const { flags, isLoading, error } = useFeatureFlags();

  // Loading state
  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Loading features...</span>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="error">
        <p>Failed to load feature flags: {error.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Success state
  return <YourFeatureContent />;
};
```

### 3. Performance Optimization

**Memoization**

```typescript
import React, { memo, useMemo } from "react";
import { useFeatureFlag, useFeatureFlags } from "@flagpole/react";

const ExpensiveFeatureComponent = memo(() => {
  const isEnabled = useFeatureFlag("expensiveFeature");

  const expensiveCalculation = useMemo(() => {
    if (!isEnabled) return null;

    // Only run expensive calculation when feature is enabled
    return performExpensiveCalculation();
  }, [isEnabled]);

  if (!isEnabled) return null;

  return <div>{expensiveCalculation}</div>;
});
```

**Lazy Loading**

```typescript
import { lazy, Suspense } from "react";
import { useFeatureFlag } from "@flagpole/react";

// Lazy load components behind feature flags
const ExpensiveFeature = lazy(() => import("./ExpensiveFeature"));
const BetaFeature = lazy(() => import("./BetaFeature"));

const OptimizedApp = () => {
  const showExpensiveFeature = useFeatureFlag("expensiveFeature");
  const showBetaFeature = useFeatureFlag("betaFeature");

  return (
    <div>
      <StandardFeatures />

      {showExpensiveFeature && (
        <Suspense fallback={<div>Loading feature...</div>}>
          <ExpensiveFeature />
        </Suspense>
      )}

      {showBetaFeature && (
        <Suspense fallback={<div>Loading beta...</div>}>
          <BetaFeature />
        </Suspense>
      )}
    </div>
  );
};
```

### 4. Flag Naming Conventions

Use consistent, descriptive names:

```typescript
// ✅ Good naming
const isNewDashboardEnabled = useFeatureFlag("newDashboard");
const showBetaUserProfile = useFeatureFlag("betaUserProfile");
const enableExperimentalSearch = useFeatureFlag("experimentalSearch");
const allowPremiumFeatures = useFeatureFlag("premiumFeatures");

// ❌ Bad naming
const flag1 = useFeatureFlag("f1");
const test = useFeatureFlag("test");
const thing = useFeatureFlag("new_thing");
```

**Naming Guidelines:**

- Use camelCase
- Be specific and descriptive
- Include feature context
- Avoid abbreviations
- Use verbs for actions: `enableX`, `showY`, `allowZ`

### 5. Error Boundaries

Wrap feature components in error boundaries:

```typescript
class FeatureFlagErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Feature flag error:", error, errorInfo);

    // Log to your error reporting service
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-fallback">
            Something went wrong with this feature.
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Usage
const App = () => {
  return (
    <FeatureFlagProvider apiKey="your-api-key">
      <FeatureFlagErrorBoundary>
        <MainApp />
      </FeatureFlagErrorBoundary>
    </FeatureFlagProvider>
  );
};
```

## TypeScript Support

### Type-Safe Feature Flags

Define flag types for better development experience:

```typescript
// types/flags.ts
export interface FeatureFlags {
  newDashboard: boolean;
  betaFeatures: boolean;
  premiumContent: boolean;
  experimentalSearch: boolean;
  adminPanel: boolean;
  darkMode: boolean;
}

export type FeatureFlagName = keyof FeatureFlags;

// Custom typed hook
export const useTypedFeatureFlag = <K extends FeatureFlagName>(
  flagKey: K
): FeatureFlags[K] => {
  return useFeatureFlag(flagKey);
};

// Usage with full type safety
const Component = () => {
  const isNewDashboardEnabled = useTypedFeatureFlag("newDashboard"); // boolean
  const showBetaFeatures = useTypedFeatureFlag("betaFeatures"); // boolean

  // TypeScript will error on invalid flag names
  // const invalid = useTypedFeatureFlag('invalidFlag'); // ❌ TypeScript error

  return (
    <div>
      {isNewDashboardEnabled && <NewDashboard />}
      {showBetaFeatures && <BetaFeatures />}
    </div>
  );
};
```

### Typed Feature Flag Context

Create a strongly typed context:

```typescript
// contexts/FeatureFlags.tsx
import { createContext, useContext } from "react";
import { FeatureFlags, FeatureFlagName } from "../types/flags";

interface TypedFeatureFlagContext {
  flags: Partial<FeatureFlags>;
  isFeatureEnabled: <K extends FeatureFlagName>(flagName: K) => boolean;
  isLoading: boolean;
  error: Error | null;
}

const TypedFeatureFlagContext = createContext<TypedFeatureFlagContext | null>(
  null
);

export const useTypedFeatureFlags = () => {
  const context = useContext(TypedFeatureFlagContext);
  if (!context) {
    throw new Error(
      "useTypedFeatureFlags must be used within TypedFeatureFlagProvider"
    );
  }
  return context;
};
```

## Testing

### Unit Testing with Jest

```typescript
// __tests__/FeatureComponent.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { FeatureFlagProvider } from "@flagpole/react";
import { FeatureComponent } from "../FeatureComponent";

// Mock the provider for testing
const MockFeatureFlagProvider = ({
  children,
  mockFlags = {},
  mockLoading = false,
  mockError = null,
}) => {
  // In a real implementation, you'd mock the provider
  // This is a simplified example
  return (
    <FeatureFlagProvider apiKey="test-key">{children}</FeatureFlagProvider>
  );
};

describe("FeatureComponent", () => {
  it("shows new feature when flag is enabled", () => {
    render(
      <MockFeatureFlagProvider mockFlags={{ newFeature: true }}>
        <FeatureComponent />
      </MockFeatureFlagProvider>
    );

    expect(screen.getByText("New Feature")).toBeInTheDocument();
  });

  it("hides new feature when flag is disabled", () => {
    render(
      <MockFeatureFlagProvider mockFlags={{ newFeature: false }}>
        <FeatureComponent />
      </MockFeatureFlagProvider>
    );

    expect(screen.queryByText("New Feature")).not.toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <MockFeatureFlagProvider mockLoading={true}>
        <FeatureComponent />
      </MockFeatureFlagProvider>
    );

    expect(screen.getByText("Loading flags...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    const error = new Error("Connection failed");

    render(
      <MockFeatureFlagProvider mockError={error}>
        <FeatureComponent />
      </MockFeatureFlagProvider>
    );

    expect(screen.getByText("Error: Connection failed")).toBeInTheDocument();
  });
});
```

### Integration Testing

```typescript
// __tests__/integration.test.tsx
import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import { FeatureFlagProvider } from "@flagpole/react";
import { App } from "../App";

// Mock the WebSocket and API calls
jest.mock("socket.io-client");
jest.mock("axios");

describe("App Integration", () => {
  beforeEach(() => {
    // Setup mocks
    fetchMock.resetMocks();
  });

  it("loads and displays features based on flags", async () => {
    // Mock API response
    fetchMock.mockResponseOnce(
      JSON.stringify([
        {
          name: "newDashboard",
          isEnabled: true,
          environments: ["development"],
        },
      ])
    );

    render(
      <FeatureFlagProvider apiKey="test-key" environments={["development"]}>
        <App />
      </FeatureFlagProvider>
    );

    // Wait for flags to load
    await waitFor(() => {
      expect(screen.getByText("New Dashboard")).toBeInTheDocument();
    });
  });
});
```

### Testing Custom Hooks

```typescript
// __tests__/useFeatureFlag.test.tsx
import { renderHook } from "@testing-library/react";
import { useFeatureFlag } from "@flagpole/react";
import { MockFeatureFlagProvider } from "./test-utils";

describe("useFeatureFlag", () => {
  it("returns true when flag is enabled", () => {
    const wrapper = ({ children }) => (
      <MockFeatureFlagProvider mockFlags={{ testFlag: true }}>
        {children}
      </MockFeatureFlagProvider>
    );

    const { result } = renderHook(() => useFeatureFlag("testFlag"), {
      wrapper,
    });

    expect(result.current).toBe(true);
  });

  it("returns false when flag is disabled", () => {
    const wrapper = ({ children }) => (
      <MockFeatureFlagProvider mockFlags={{ testFlag: false }}>
        {children}
      </MockFeatureFlagProvider>
    );

    const { result } = renderHook(() => useFeatureFlag("testFlag"), {
      wrapper,
    });

    expect(result.current).toBe(false);
  });
});
```

## Troubleshooting

### Common Issues

#### 1. "useFeatureFlag must be used within a FeatureFlagProvider"

**Problem**: Hook is used outside of provider context.

**Solution**: Ensure your component is wrapped in `FeatureFlagProvider`:

```typescript
// ❌ Incorrect - no provider
function App() {
  return <MyComponent />; // Will throw error
}

// ✅ Correct - wrapped in provider
function App() {
  return (
    <FeatureFlagProvider apiKey="your-key">
      <MyComponent />
    </FeatureFlagProvider>
  );
}
```

#### 2. Flags Always Return False

**Possible causes:**

- Invalid API key
- Wrong environment configuration
- Network connectivity issues
- Flag doesn't exist in the specified environment

**Debug steps:**

```typescript
function DebugComponent() {
  const { flags, error, isLoading } = useFeatureFlags();

  console.log("Debug info:", {
    flags,
    error,
    isLoading,
    flagCount: Object.keys(flags).length,
  });

  return (
    <div>
      <h3>Debug Information</h3>
      <pre>{JSON.stringify({ flags, error, isLoading }, null, 2)}</pre>
    </div>
  );
}
```

#### 3. WebSocket Connection Issues

**Check network configuration:**

```typescript
// Add connection monitoring
function ConnectionMonitor() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Monitor WebSocket connection status
    // This would depend on your specific implementation
  }, []);

  return (
    <div
      className={`connection-status ${
        connected ? "connected" : "disconnected"
      }`}
    >
      {connected ? "🟢 Connected" : "🔴 Disconnected"}
    </div>
  );
}
```

#### 4. Performance Issues

**Solution**: Use React.memo and useMemo for expensive operations:

```typescript
const OptimizedComponent = React.memo(() => {
  const isEnabled = useFeatureFlag("expensiveFeature");

  const expensiveValue = useMemo(() => {
    if (!isEnabled) return null;
    return computeExpensiveValue();
  }, [isEnabled]);

  return isEnabled ? <ExpensiveFeature value={expensiveValue} /> : null;
});
```

### Debug Mode

Enable debug mode in development:

```typescript
// Add to your main App component
function App() {
  const { flags, error, isLoading } = useFeatureFlags();

  // Log flag changes in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.group("[FlagPole Debug]");
      console.log("Flags loaded:", flags);
      console.log("Loading:", isLoading);
      console.log("Error:", error);
      console.groupEnd();
    }
  }, [flags, isLoading, error]);

  return <YourApp />;
}
```

### Network Monitoring

```typescript
function NetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!online) {
    return (
      <div className="offline-banner">
        ⚠️ You're offline. Feature flags may not update in real-time.
      </div>
    );
  }

  return null;
}
```

## Migration from Other Solutions

### From LaunchDarkly

```typescript
// LaunchDarkly
import { useFlags, useLDClient } from "launchdarkly-react-client-sdk";

const { featureFlag } = useFlags();

// FlagPole equivalent
import { useFeatureFlag } from "@flagpole/react";

const featureFlag = useFeatureFlag("featureFlagName");
```

### From Split

```typescript
// Split
import {
  useSplitClient,
  useSplitTreatments,
} from "@splitsoftware/splitio-react";

const client = useSplitClient();
const treatments = useSplitTreatments(["feature1", "feature2"]);

// FlagPole equivalent
import { useFeatureFlag, useFeatureFlags } from "@flagpole/react";

const feature1Enabled = useFeatureFlag("feature1");
const feature2Enabled = useFeatureFlag("feature2");
// Or get all at once
const { isFeatureEnabled } = useFeatureFlags();
```

### From Custom Solutions

```typescript
// Custom feature flag hook
const useCustomFeatureFlag = (flagName) => {
  return window.featureFlags?.[flagName] || false;
};

// Migrate to FlagPole
import { useFeatureFlag } from "@flagpole/react";

const useFeatureFlag = (flagName) => {
  return useFeatureFlag(flagName);
};
```

## Advanced Patterns

### Feature Flag Middleware

Create middleware to log flag usage:

```typescript
import { useFeatureFlag as originalUseFeatureFlag } from "@flagpole/react";

// Wrapper hook with analytics
export const useFeatureFlag = (flagName: string) => {
  const isEnabled = originalUseFeatureFlag(flagName);

  useEffect(() => {
    // Log flag usage for analytics
    analytics.track("feature_flag_checked", {
      flagName,
      isEnabled,
      timestamp: new Date().toISOString(),
    });
  }, [flagName, isEnabled]);

  return isEnabled;
};
```

### Progressive Enhancement

Gracefully enhance features:

```typescript
const ProgressiveFeature = () => {
  const hasAdvancedFeature = useFeatureFlag("advancedFeature");
  const hasBetaUI = useFeatureFlag("betaUI");

  // Start with basic feature
  let FeatureComponent = BasicFeature;

  // Progressively enhance
  if (hasAdvancedFeature) {
    FeatureComponent = AdvancedFeature;
  }

  if (hasBetaUI) {
    FeatureComponent = BetaUIFeature;
  }

  return <FeatureComponent />;
};
```

### Feature Flag Composition

Compose complex feature logic:

```typescript
interface FeatureConfig {
  showNewUI: boolean;
  enableBetaFeatures: boolean;
  allowPremiumContent: boolean;
  experimentVariant: "A" | "B" | "control";
}

const useFeatureConfig = (): FeatureConfig => {
  const { flags } = useFeatureFlags();

  return useMemo(
    () => ({
      showNewUI: flags.newUI?.isEnabled || false,
      enableBetaFeatures: flags.betaFeatures?.isEnabled || false,
      allowPremiumContent: flags.premiumContent?.isEnabled || false,
      experimentVariant: flags.experiment?.conditions?.variant || "control",
    }),
    [flags]
  );
};

// Usage
const MyComponent = () => {
  const config = useFeatureConfig();

  return (
    <div>
      {config.showNewUI && <NewUIComponent />}
      {config.enableBetaFeatures && <BetaFeatures />}
      {config.allowPremiumContent && <PremiumContent />}
      <ExperimentComponent variant={config.experimentVariant} />
    </div>
  );
};
```

### Server-Side Rendering (SSR)

Handle SSR with Next.js:

```typescript
// pages/_app.tsx
import { FeatureFlagProvider } from "@flagpole/react";

function MyApp({ Component, pageProps, featureFlags }) {
  return (
    <FeatureFlagProvider
      apiKey={process.env.NEXT_PUBLIC_FLAGPOLE_API_KEY}
      initialFlags={featureFlags} // Prevent hydration mismatch
    >
      <Component {...pageProps} />
    </FeatureFlagProvider>
  );
}

// Pre-fetch flags on server
MyApp.getInitialProps = async (ctx) => {
  const featureFlags = await fetchFeatureFlags({
    apiKey: process.env.FLAGPOLE_API_KEY,
    environments: [process.env.NODE_ENV],
  });

  return { featureFlags };
};

export default MyApp;
```

### Micro-frontend Integration

Share flags across micro-frontends:

```typescript
// shared-flags.ts
class SharedFeatureFlags {
  private static instance: SharedFeatureFlags;
  private flags: Record<string, boolean> = {};

  static getInstance() {
    if (!SharedFeatureFlags.instance) {
      SharedFeatureFlags.instance = new SharedFeatureFlags();
    }
    return SharedFeatureFlags.instance;
  }

  setFlags(flags: Record<string, boolean>) {
    this.flags = { ...this.flags, ...flags };
    window.dispatchEvent(
      new CustomEvent("flagsUpdated", { detail: this.flags })
    );
  }

  getFlag(name: string): boolean {
    return this.flags[name] || false;
  }
}

// In each micro-frontend
const sharedFlags = SharedFeatureFlags.getInstance();

const useMicroFrontendFlag = (flagName: string) => {
  const [isEnabled, setIsEnabled] = useState(sharedFlags.getFlag(flagName));

  useEffect(() => {
    const handleFlagsUpdate = (event: CustomEvent) => {
      setIsEnabled(event.detail[flagName] || false);
    };

    window.addEventListener("flagsUpdated", handleFlagsUpdate);
    return () => window.removeEventListener("flagsUpdated", handleFlagsUpdate);
  }, [flagName]);

  return isEnabled;
};
```

## Resources

### Documentation Links

- [FlagPole Dashboard](https://useflagpole.dev)
- [API Documentation](https://docs.flagpole.dev/api)
- [SDK Source Code](https://github.com/flagpole-corp/flagpole-client-sdk-react)

### Community

- [Discord Community](https://discord.gg/flagpole)
- [GitHub Discussions](https://github.com/flagpole-corp/flagpole-client-sdk-react/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/flagpole)

### Examples

- [React Example App](https://github.com/flagpole-corp/examples/tree/main/react)
- [Next.js Integration](https://github.com/flagpole-corp/examples/tree/main/nextjs)
- [TypeScript Examples](https://github.com/flagpole-corp/examples/tree/main/typescript)

## Contributing

We welcome contributions to the React SDK! Here's how you can help:

### Development Setup

```bash
git clone https://github.com/flagpole-corp/flagpole-client-sdk-react.git
cd flagpole-client-sdk-react
npm install
npm run build:watch
```

### Testing Your Changes

```bash
# Run tests
npm test

# Test with example app
cd examples/react-example
npm install
npm start
```

### Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Support

Need help? We're here for you:

- 📧 **Email**: support@flagpole.dev
- 💬 **Discord**: [Join our community](https://discord.gg/flagpole)
- 📖 **Documentation**: [docs.flagpole.dev](https://docs.flagpole.dev)
- 🐛 **Issues**: [GitHub Issues](https://github.com/flagpole-corp/flagpole-client-sdk-react/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/flagpole-corp/flagpole-client-sdk-react/discussions)

---

Built with ❤️ by the FlagPole team. Happy feature flagging! 🚀
