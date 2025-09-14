# React Native

A React Native SDK for integrating feature flags into your mobile application with real-time updates and seamless mobile optimization.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Advanced Usage](#advanced-usage)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

- 🚀 **Real-time Updates**: WebSocket integration for instant feature flag changes
- 📱 **Mobile Optimized**: Battery-conscious with app state management
- 🌍 **Environment Support**: Multiple environment configurations
- 🔐 **Secure**: Simple API key authentication
- 📊 **TypeScript**: Full TypeScript support with type safety
- 🔄 **Auto-reconnection**: Intelligent reconnection logic for mobile networks
- ⚡ **Zero Config**: Works out of the box with sensible defaults
- 🎯 **Cross Platform**: iOS and Android support

## Installation

### NPM

```bash
npm install @flagpole/react-native
```

### Yarn

```bash
yarn add @flagpole/react-native
```

### Requirements

- React Native >= 0.60.0
- React >= 16.8.0
- iOS 11.0+ / Android API 21+

## Quick Start

### 1. Wrap Your App

First, wrap your root component with the `FeatureFlagProvider`:

```tsx
import React from "react";
import { SafeAreaView } from "react-native";
import { FeatureFlagProvider } from "@flagpole/react-native";
import App from "./src/App";

export default function Root() {
  return (
    <FeatureFlagProvider
      apiKey="your_api_key_here"
      environments={["development"]}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <App />
      </SafeAreaView>
    </FeatureFlagProvider>
  );
}
```

### 2. Use Feature Flags

Use the `useFeatureFlag` hook in your components:

```tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useFeatureFlag } from "@flagpole/react-native";

export default function WelcomeScreen() {
  const showNewDesign = useFeatureFlag("new-welcome-design");
  const enablePremiumFeatures = useFeatureFlag("premium-features");

  return (
    <View style={styles.container}>
      {showNewDesign ? (
        <Text style={styles.newTitle}>Welcome to FlagPole 2.0!</Text>
      ) : (
        <Text style={styles.title}>Welcome to FlagPole</Text>
      )}

      {enablePremiumFeatures && (
        <Text style={styles.premium}>🌟 Premium features available</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold" },
  newTitle: { fontSize: 28, fontWeight: "bold", color: "#007AFF" },
  premium: { fontSize: 16, color: "#FF6B35", marginTop: 10 },
});
```

### 3. Handle Loading States

```tsx
import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useFeatureFlags } from "@flagpole/react-native";

export default function Dashboard() {
  const { isLoading, error, isFeatureEnabled } = useFeatureFlags();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Loading feature flags...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Error loading flags: {error.message}</Text>
      </View>
    );
  }

  return (
    <View>
      {isFeatureEnabled("dashboard-analytics") && <AnalyticsWidget />}
      {isFeatureEnabled("social-sharing") && <ShareButton />}
    </View>
  );
}
```

## API Reference

### FeatureFlagProvider

The main provider component that manages feature flag state and WebSocket connections.

#### Props

| Prop           | Type          | Required | Default          | Description                   |
| -------------- | ------------- | -------- | ---------------- | ----------------------------- |
| `apiKey`       | string        | ✅       | -                | Your FlagPole API key         |
| `environments` | Environment[] | ❌       | All environments | Array of environments to load |
| `children`     | ReactNode     | ✅       | -                | Your app components           |

#### Example

```tsx
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

```tsx
function MyComponent() {
  const isEnabled = useFeatureFlag("my-awesome-feature");

  return <View>{isEnabled ? <NewFeature /> : <LegacyFeature />}</View>;
}
```

### useFeatureFlags

Hook to access all feature flags and metadata.

#### Returns

```tsx
{
  flags: Record<string, FeatureFlag>;
  isLoading: boolean;
  error: Error | null;
  isFeatureEnabled: (flagName: string) => boolean;
}
```

#### Example

```tsx
function DebugPanel() {
  const { flags, isLoading, error } = useFeatureFlags();

  return (
    <ScrollView>
      <Text>Feature Flags Debug Panel</Text>
      {Object.entries(flags).map(([name, flag]) => (
        <Text key={name}>
          {name}: {flag.isEnabled ? "✅" : "❌"}
        </Text>
      ))}
    </ScrollView>
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

```tsx
import { withFeatureFlag } from "@flagpole/react-native";

const PremiumButton = ({ onPress, title }) => (
  <TouchableOpacity onPress={onPress} style={styles.premiumButton}>
    <Text style={styles.premiumText}>{title}</Text>
  </TouchableOpacity>
);

const StandardButton = ({ onPress, title }) => (
  <TouchableOpacity onPress={onPress} style={styles.standardButton}>
    <Text>{title}</Text>
  </TouchableOpacity>
);

// Only show PremiumButton when 'premium-ui' flag is enabled
export const ConditionalButton = withFeatureFlag(
  PremiumButton,
  "premium-ui",
  StandardButton // Fallback to StandardButton
);
```

## Advanced Usage

### Environment-Specific Flags

Configure different environments for development, staging, and production:

```tsx
// Development
<FeatureFlagProvider
  apiKey="fp_dev_abc123..."
  environments={['development']}
>

// Staging
<FeatureFlagProvider
  apiKey="fp_staging_abc123..."
  environments={['staging']}
>

// Production
<FeatureFlagProvider
  apiKey="fp_live_abc123..."
  environments={['production']}
>
```

### Feature Flag Gradual Rollouts

```tsx
function ExperimentalFeature() {
  const showExperiment = useFeatureFlag("ab-test-new-checkout");
  const { flags } = useFeatureFlags();

  // Access full flag data for percentage rollouts
  const experimentFlag = flags["ab-test-new-checkout"];

  return (
    <View>
      {showExperiment ? <NewCheckoutFlow /> : <LegacyCheckoutFlow />}

      {__DEV__ && (
        <Text>Rollout: {experimentFlag?.conditions?.percentage}%</Text>
      )}
    </View>
  );
}
```

### Complex Conditional Logic

```tsx
function PremiumFeatures() {
  const isPremiumUser = useFeatureFlag("premium-user");
  const enableBetaFeatures = useFeatureFlag("beta-features");
  const showAdvancedSettings = useFeatureFlag("advanced-settings");

  const shouldShowPremiumSection =
    isPremiumUser && (enableBetaFeatures || showAdvancedSettings);

  return (
    <ScrollView>
      <StandardFeatures />

      {shouldShowPremiumSection && (
        <View style={styles.premiumSection}>
          <Text style={styles.premiumTitle}>Premium Features</Text>

          {enableBetaFeatures && <BetaFeaturesList />}
          {showAdvancedSettings && <AdvancedSettingsPanel />}
        </View>
      )}
    </ScrollView>
  );
}
```

### Real-time Flag Updates

The SDK automatically receives real-time updates via WebSocket:

```tsx
function LiveConfigPanel() {
  const { flags, isLoading } = useFeatureFlags();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Flags automatically update when changed remotely
  useEffect(() => {
    setLastUpdate(new Date());
  }, [flags]);

  return (
    <View>
      <Text>Last updated: {lastUpdate.toLocaleTimeString()}</Text>
      <Text>Active flags: {Object.keys(flags).length}</Text>
    </View>
  );
}
```

## Configuration

### Environment Detection

The SDK automatically detects the environment:

```typescript
// Automatic detection based on __DEV__
const environment = __DEV__ ? "development" : "production";
```

### Custom Configuration

For advanced setups, you can customize the configuration:

```tsx
// Create a custom config file
// config/flagpole.js
export const flagpoleConfig = {
  development: {
    apiKey: "fp_dev_...",
    environments: ["development"],
  },
  staging: {
    apiKey: "fp_staging_...",
    environments: ["staging"],
  },
  production: {
    apiKey: "fp_live_...",
    environments: ["production"],
  },
};

// App.tsx
import { flagpoleConfig } from "./config/flagpole";

const config = __DEV__ ? flagpoleConfig.development : flagpoleConfig.production;

export default function App() {
  return (
    <FeatureFlagProvider {...config}>
      <YourApp />
    </FeatureFlagProvider>
  );
}
```

## Error Handling

### Network Errors

```tsx
function NetworkAwareComponent() {
  const { error, isLoading } = useFeatureFlags();

  if (error) {
    // Handle network errors gracefully
    console.warn("Feature flags unavailable:", error.message);

    // Provide fallback behavior
    return <OfflineModeFallback />;
  }

  return <OnlineFeatures />;
}
```

### Flag Not Found

```tsx
function SafeFeatureCheck() {
  const isEnabled = useFeatureFlag("might-not-exist");

  // useFeatureFlag returns false for non-existent flags
  // No need for additional error handling

  return isEnabled ? <FeatureComponent /> : <DefaultComponent />;
}
```

### Error Boundary Integration

```tsx
class FeatureFlagErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("FeatureFlag Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <FallbackUI />;
    }

    return this.props.children;
  }
}

// Usage
<FeatureFlagErrorBoundary>
  <FeatureFlagProvider apiKey="...">
    <App />
  </FeatureFlagProvider>
</FeatureFlagErrorBoundary>;
```

## Best Practices

### 1. Use Descriptive Flag Names

```tsx
// ✅ Good
const showNewOnboarding = useFeatureFlag("onboarding-redesign-v2");
const enablePushNotifications = useFeatureFlag("push-notifications-ios");

// ❌ Bad
const flag1 = useFeatureFlag("f1");
const test = useFeatureFlag("test");
```

### 2. Handle Loading States

```tsx
// ✅ Good - Always handle loading
function MyComponent() {
  const { isLoading } = useFeatureFlags();
  const isEnabled = useFeatureFlag("my-feature");

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isEnabled ? <NewFeature /> : <OldFeature />;
}
```

### 3. Use Environment-Specific Keys

```tsx
// ✅ Good - Different keys per environment
const getApiKey = () => {
  if (__DEV__) return 'fp_dev_...';
  return 'fp_live_...';
};

<FeatureFlagProvider apiKey={getApiKey()}>
```

### 4. Graceful Degradation

```tsx
// ✅ Good - Always provide fallback
function PremiumFeature() {
  const isPremiumEnabled = useFeatureFlag("premium-features");

  // Default to disabled state for safety
  return isPremiumEnabled ? <PremiumUI /> : <StandardUI />;
}
```

### 5. Performance Optimization

```tsx
// ✅ Good - Memoize expensive operations
const ExpensiveComponent = React.memo(() => {
  const isEnabled = useFeatureFlag("expensive-feature");

  if (!isEnabled) return null;

  return <ComplexCalculation />;
});
```

## Migration Guide

### From Web SDK

The React Native SDK maintains API compatibility with the web version:

```tsx
// Web SDK
import { FeatureFlagProvider, useFeatureFlag } from "@flagpole/react";

// React Native SDK - Same API!
import { FeatureFlagProvider, useFeatureFlag } from "@flagpole/react-native";
```

**Key Differences:**

1. **Networking**: Uses `fetch` instead of `axios`
2. **App State**: Automatically handles background/foreground
3. **Imports**: Use React Native components (`View`, `Text`) instead of HTML elements

### Migration Steps

1. **Update imports**:

   ```tsx
   // Before
   import { FeatureFlagProvider } from "@flagpole/react";

   // After
   import { FeatureFlagProvider } from "@flagpole/react-native";
   ```

2. **Update components**:

   ```tsx
   // Before (Web)
   <div>{isEnabled && <span>Feature</span>}</div>

   // After (React Native)
   <View>{isEnabled && <Text>Feature</Text>}</View>
   ```

3. **Update styling**:

   ```tsx
   // Before (Web)
   <div className="feature">Content</div>

   // After (React Native)
   <View style={styles.feature}>
     <Text>Content</Text>
   </View>
   ```

## Troubleshooting

### Common Issues

#### 1. "useFeatureFlag must be used within a FeatureFlagProvider"

**Solution**: Ensure your component is wrapped in `FeatureFlagProvider`:

```tsx
// ❌ Missing provider
function App() {
  return <MyComponent />; // Will throw error
}

// ✅ Correct setup
function App() {
  return (
    <FeatureFlagProvider apiKey="...">
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

**Solution**:

```tsx
function DebugFlags() {
  const { flags, error, isLoading } = useFeatureFlags();

  console.log("Flags:", flags);
  console.log("Error:", error);
  console.log("Loading:", isLoading);

  return null;
}
```

#### 3. WebSocket Connection Issues

**Check network configuration:**

```tsx
// Ensure WebSocket URLs are accessible
// Development: ws://localhost:5000
// Production: wss://useflagpole-api.onrender.com
```

#### 4. App State Issues

**Force reconnection:**

```tsx
import { AppState } from "react-native";

useEffect(() => {
  const handleAppStateChange = (nextAppState) => {
    console.log("App state:", nextAppState);
  };

  const subscription = AppState.addEventListener(
    "change",
    handleAppStateChange
  );
  return () => subscription?.remove();
}, []);
```

### Debug Mode

Enable debug logging in development:

```tsx
// Add to your App.tsx in development
if (__DEV__) {
  console.log("[FlagPole] Debug mode enabled");

  // Monitor flag changes
  const { flags } = useFeatureFlags();
  console.log("[FlagPole] Current flags:", flags);
}
```

### Performance Monitoring

```tsx
function PerformanceMonitor() {
  const { flags, isLoading } = useFeatureFlags();

  useEffect(() => {
    const startTime = Date.now();

    if (!isLoading) {
      const loadTime = Date.now() - startTime;
      console.log(`[FlagPole] Flags loaded in ${loadTime}ms`);
    }
  }, [isLoading]);

  return null;
}
```

## Platform Support

| Platform         | Support | Notes                       |
| ---------------- | ------- | --------------------------- |
| iOS              | ✅      | iOS 11.0+                   |
| Android          | ✅      | API 21+                     |
| Expo (Managed)   | ✅      | SDK 45+                     |
| Expo (Bare)      | ✅      | Full support                |
| React Native Web | ⚠️      | Use @flagpole/react instead |

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/flagpole-corp/flagpole-client-sdk-react-native.git

# Install dependencies
npm install

# Build the SDK
npm run build

# Watch for changes
npm run build:watch
```

### Testing

```bash
# Run tests
npm test

# Test with a local project
npm run build
npm pack
# Install in your test project
npm install /path/to/flagpole-react-native-0.0.2.tgz
```

## License

ISC

## Support

- 📧 Email: support@flagpole.dev
- 📚 Documentation: https://docs.flagpole.dev
- 🐛 Issues: https://github.com/flagpole-corp/flagpole-client-sdk-react-native/issues
- 💬 Discord: https://discord.gg/flagpole
