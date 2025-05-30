---
id: react
title: React
---

# React SDK Integration

### 3. Install the SDK

```bash
# Using npm
npm install @flagpole/react

# Using yarn
yarn add @flagpole/react
```

### 4. Initialize in Your Application

```typescript
// App.tsx
import { FeatureFlagProvider } from "@flagpole/react";

function App() {
  return (
    <FeatureFlagProvider
      apiKey="fp_live_your_api_key"
      environments={["development"]} // optional, if nothing is passed, then all environments will be shown (production, staging and development)
    >
      <FeatureComponent />
    </FeatureFlagProvider>
  );
}

export default App;
```

### 5. Use Feature Flags

#### Basic Hook Usage

```typescript
import { useFeatureFlag, useFeatureFlags } from "@flagpole/react";

export const FeatureComponent = () => {
  // Get all feature flags
  const { flags, isLoading, error } = useFeatureFlags();

  // Get a specific feature flag
  const isNewFeatureEnabled = useFeatureFlag("newFeature");

  if (isLoading) return <div>Loading flags...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Feature Flags Test</h2>

      {/* Use a specific flag */}
      {isNewFeatureEnabled && <NewFeature />}

      {/* Display all available flags */}
      <h3>All Flags:</h3>
      <pre>{JSON.stringify(flags, null, 2)}</pre>
    </div>
  );
};
```

#### Higher-Order Component (HOC) Usage

```typescript
import { withFeatureFlag } from "@flagpole/react";

// Component that should only render when flag is enabled
const NewDashboard = () => {
  return <div>New Dashboard Feature!</div>;
};

// Wrap component with feature flag
const ConditionalDashboard = withFeatureFlag(NewDashboard, "newDashboard");

// With fallback component
const OldDashboard = () => {
  return <div>Old Dashboard</div>;
};

const DashboardWithFallback = withFeatureFlag(
  NewDashboard,
  "newDashboard",
  OldDashboard
);

// Usage in your app
function App() {
  return (
    <div>
      <ConditionalDashboard />
      <DashboardWithFallback />
    </div>
  );
}
```

#### Feature Wrapper Component

```typescript
import { useFeatureFlag } from "@flagpole/react";

interface FeatureWrapperProps {
  flagKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const FeatureWrapper: React.FC<FeatureWrapperProps> = ({
  flagKey,
  children,
  fallback = null,
}) => {
  const isEnabled = useFeatureFlag(flagKey);

  return isEnabled ? <>{children}</> : <>{fallback}</>;
};

// Usage
const MyComponent = () => {
  return (
    <div>
      <FeatureWrapper
        flagKey="premiumFeature"
        fallback={<div>Premium feature not available</div>}
      >
        <PremiumContent />
      </FeatureWrapper>
    </div>
  );
};
```

## Available Hooks and Components

### useFeatureFlags

Returns all feature flags for the current project:

```typescript
const {
  flags, // Record<string, FeatureFlag> containing all flags
  isLoading, // Boolean indicating loading state
  error, // Error object if something went wrong
  isFeatureEnabled, // Function to check specific flag: (flagName: string) => boolean
} = useFeatureFlags();
```

### useFeatureFlag

Returns the state of a specific feature flag:

```typescript
const isEnabled = useFeatureFlag("flagKey"); // Returns boolean
```

### withFeatureFlag

Higher-order component that conditionally renders based on feature flag:

```typescript
const WrappedComponent = withFeatureFlag(
  YourComponent,
  "featureFlagName",
  OptionalFallbackComponent
);
```

## Advanced Usage Patterns

### Conditional Rendering with Multiple Flags

```typescript
import { useFeatureFlags } from "@flagpole/react";

const AdvancedFeatureComponent = () => {
  const { isFeatureEnabled } = useFeatureFlags();

  const showAdvancedUI = isFeatureEnabled("advancedUI");
  const showBetaFeatures = isFeatureEnabled("betaFeatures");
  const showPremiumContent = isFeatureEnabled("premiumContent");

  return (
    <div>
      {showAdvancedUI && <AdvancedUIComponent />}

      {showBetaFeatures && showPremiumContent && <PremiumBetaFeature />}

      {!showAdvancedUI && <StandardUIComponent />}
    </div>
  );
};
```

### Custom Hook for Complex Logic

```typescript
import { useFeatureFlags, useFeatureFlag } from "@flagpole/react";

const useNavigation = () => {
  const newNavEnabled = useFeatureFlag("newNavigation");
  const adminPanelEnabled = useFeatureFlag("adminPanel");
  const { isLoading } = useFeatureFlags();

  const navigationItems = useMemo(() => {
    const items = [
      { label: "Home", path: "/" },
      { label: "About", path: "/about" },
    ];

    if (newNavEnabled) {
      items.push({ label: "Dashboard", path: "/dashboard" });
    }

    if (adminPanelEnabled) {
      items.push({ label: "Admin", path: "/admin" });
    }

    return items;
  }, [newNavEnabled, adminPanelEnabled]);

  return { navigationItems, isLoading };
};

// Usage
const Navigation = () => {
  const { navigationItems, isLoading } = useNavigation();

  if (isLoading) return <div>Loading navigation...</div>;

  return (
    <nav>
      {navigationItems.map((item) => (
        <a key={item.path} href={item.path}>
          {item.label}
        </a>
      ))}
    </nav>
  );
};
```

### React Router Integration

```typescript
import { Routes, Route, Navigate } from "react-router-dom";
import { useFeatureFlag } from "@flagpole/react";

const ProtectedRoute = ({ children, flagKey, fallbackPath = "/" }) => {
  const isEnabled = useFeatureFlag(flagKey);

  return isEnabled ? children : <Navigate to={fallbackPath} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/beta"
        element={
          <ProtectedRoute flagKey="betaAccess" fallbackPath="/coming-soon">
            <BetaFeature />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute flagKey="adminPanel" fallbackPath="/unauthorized">
            <AdminPanel />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
```

### Performance Optimization with React.memo

```typescript
import React, { memo } from "react";
import { useFeatureFlag } from "@flagpole/react";

const ExpensiveFeatureComponent = memo(() => {
  const isEnabled = useFeatureFlag("expensiveFeature");

  if (!isEnabled) return null;

  return <div>{/* Expensive rendering logic */}</div>;
});

// Component only re-renders when flag state changes
```

### A/B Testing Implementation

```typescript
import { useFeatureFlags } from "@flagpole/react";

const ABTestComponent = () => {
  const { flags } = useFeatureFlags();

  const experimentFlag = flags["checkoutExperiment"];
  const variant = experimentFlag?.conditions?.variant || "control";

  switch (variant) {
    case "variantA":
      return <CheckoutVariantA />;
    case "variantB":
      return <CheckoutVariantB />;
    default:
      return <CheckoutControl />;
  }
};
```

## Best Practices

### API Key Security

- Store API keys in environment variables
- Use different keys for different environments
- Never commit API keys to source control
- Rotate keys if they're ever exposed

```typescript
// Example using environment variables
<FeatureFlagProvider
  apiKey={import.meta.env.VITE_FLAGPOLE_API_KEY}
  environments={import.meta.env.VITE_ENVIRONMENT ? [import.meta.env.VITE_ENVIRONMENT] : undefined}
>
```

### Error Handling

Always handle loading and error states:

```typescript
const { flags, isLoading, error } = useFeatureFlags();

if (isLoading) {
  return <LoadingSpinner />;
}

if (error) {
  return (
    <ErrorBoundary>
      <ErrorMessage
        message={error.message}
        onRetry={() => window.location.reload()}
      />
    </ErrorBoundary>
  );
}
```

### Loading States with Suspense

```typescript
import { Suspense } from "react";

const App = () => {
  return (
    <FeatureFlagProvider apiKey="your-api-key">
      <Suspense fallback={<div>Loading feature flags...</div>}>
        <MainApp />
      </Suspense>
    </FeatureFlagProvider>
  );
};
```

### Feature Flag Naming

Use descriptive, consistent names:

- Include feature context
- Use camelCase
- Be specific but concise

Examples:

- `newDashboard`
- `betaUserProfile`
- `experimentalSearch`

### Testing

Test both enabled and disabled states:

```typescript
// feature.test.tsx
import { render } from "@testing-library/react";
import { FeatureFlagProvider } from "@flagpole/react";

const MockFeatureFlagProvider = ({ children, flags = {} }) => {
  // Mock provider for testing
  return (
    <FeatureFlagProvider apiKey="test-key">{children}</FeatureFlagProvider>
  );
};

describe("FeatureComponent", () => {
  it("shows new feature when flag is enabled", () => {
    // Mock the flag as enabled
    const { getByText } = render(
      <MockFeatureFlagProvider>
        <FeatureComponent />
      </MockFeatureFlagProvider>
    );

    expect(getByText("New Feature")).toBeInTheDocument();
  });

  it("hides new feature when flag is disabled", () => {
    // Mock the flag as disabled
    const { queryByText } = render(
      <MockFeatureFlagProvider>
        <FeatureComponent />
      </MockFeatureFlagProvider>
    );

    expect(queryByText("New Feature")).not.toBeInTheDocument();
  });
});
```

### TypeScript Support

Define flag types for better type safety:

```typescript
// types/flags.ts
export interface FeatureFlags {
  newDashboard: boolean;
  betaFeatures: boolean;
  premiumContent: boolean;
  experimentalSearch: boolean;
}

// Custom hook with type safety
export const useTypedFeatureFlag = <K extends keyof FeatureFlags>(
  flagKey: K
): boolean => {
  return useFeatureFlag(flagKey);
};

// Usage
const isNewDashboardEnabled = useTypedFeatureFlag("newDashboard"); // Fully typed
```

### Performance Considerations

- Use React.memo for components that depend on feature flags
- Avoid creating new objects in render methods
- Consider lazy loading components behind feature flags

```typescript
import { lazy, Suspense } from "react";
import { useFeatureFlag } from "@flagpole/react";

// Lazy load expensive components
const ExpensiveFeature = lazy(() => import("./ExpensiveFeature"));

const OptimizedFeatureComponent = () => {
  const isEnabled = useFeatureFlag("expensiveFeature");

  if (!isEnabled) return null;

  return (
    <Suspense fallback={<div>Loading feature...</div>}>
      <ExpensiveFeature />
    </Suspense>
  );
};
```

### Error Boundaries

Wrap feature flag components in error boundaries:

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
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div>Something went wrong with feature flags.</div>
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
