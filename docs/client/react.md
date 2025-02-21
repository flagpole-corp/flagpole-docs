---
id: react
title: React
---

# React SDK Integration

### 3. Install the SDK

```bash
# Using npm
npm install @flagpole/client-react-sdk

# Using yarn
yarn add @flagpole/client-react-sdk
```

### 4. Initialize in Your Application

```typescript
// App.tsx
import { FeatureFlagProvider } from "@flagpole/client-react-sdk";

function App() {
  return (
    <FeatureFlagProvider
      apiKey="fp_live_your_api_key"
      environment={["development"]} // optional, if nothing is passed, then all environments will be shown (production, staging and development)
    >
      <FeatureComponent />
    </FeatureFlagProvider>
  );
}

export default App;
```

### 5. Use Feature Flags

```typescript
import { useFeatureFlag, useFeatureFlags } from "@flagpole/client-react-sdk";

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

## Available Hooks

### useFeatureFlags

Returns all feature flags for the current project:

```typescript
const {
  flags, // Object containing all flags
  isLoading, // Boolean indicating loading state
  error, // Error object if something went wrong
} = useFeatureFlags();
```

### useFeatureFlag

Returns the state of a specific feature flag:

```typescript
const isEnabled = useFeatureFlag("flagKey");
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
  environment={import.meta.env.VITE_ENVIRONMENT}
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
  return <ErrorMessage message={error.message} />;
}
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
