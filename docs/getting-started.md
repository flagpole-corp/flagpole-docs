---
id: getting-started
title: Getting Started
sidebar_position: 2
---

# Getting Started with Flagpole

Welcome to Flagpole! This guide will walk you through the core concepts and help you get started with implementing feature flags in your application.

## Core Concepts

### Organizations

Organizations are the top-level entity in Flagpole. They help you:

- Manage multiple projects under one account
- Control user access and permissions
- Share feature flags across teams
- Manage billing and usage

### Projects

Projects represent individual applications or services. Each project:

- Has its own set of feature flags
- Gets a unique API key for authentication
- Can have multiple environments (development, staging, production)
- Contains its own analytics and metrics

### Feature Flags

Feature flags (also known as feature toggles) let you:

- Control feature rollouts without deploying code
- A/B test new features
- Enable/disable features for specific users
- Roll back problematic features instantly

### API Keys

API keys are essential for connecting your application to Flagpole:

- Format: `fp_live_` followed by a unique identifier
- Must be kept secure and never exposed publicly
- Different keys for different environments
- Can be rotated if compromised

## Implementation Guide

### 1. Set Up Your Organization

1. Sign up for a Flagpole account
2. Create your organization
3. Invite team members (optional)

### 2. Create Your First Project

1. Navigate to the dashboard
2. Click "Create Project"
3. Set project name and description
4. Select environments (e.g., development, staging, production)
5. Copy your API key for future use

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
      <YourApp />
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

## Troubleshooting

### Common Issues

1. **API Key Invalid**

   - Verify the key format starts with `fp_live_`
   - Check environment variables are properly set
   - Ensure the key matches your environment

2. **Flags Not Updating**

   - Check your connection status
   - Verify the flag exists in your project
   - Confirm targeting rules are properly set

3. **Provider Missing**
   - Ensure FeatureFlagProvider wraps your application
   - Check for multiple provider instances

## Next Steps

1. Create your first feature flag in the dashboard
2. Set up targeting rules
3. Test the flag in your application
4. Monitor flag usage and metrics
5. Explore A/B testing capabilities

## Need Help?

- Contact support at support@useflagpole.dev
