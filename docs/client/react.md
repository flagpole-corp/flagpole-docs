---
id: react
title: React SDK
---

# React SDK Integration

## Installation

```bash
npm install @flagpole/client-react
```

## Wrapping up main component the SDK

```
import { FeatureFlagProvider } from "@flagpole/client-react";

function Main() {
  <FeatureFlagProvider
    apiKey="fp_live_your_key"
    environment="development"
  >
    <App />
  </FeatureFlagProvider>
}

```

and on your component, you can use one of our hooks to check the status of each feature flag

```
import { useFeatureFlag, useFeatureFlags } from "@flagpole/client-react-sdk";

function ChildComponent() {
  const { flags, isLoading, error } = useFeatureFlags();
  const isNewFeatureEnabled = useFeatureFlag("newFeature");

  <p>New Feature is: {isNewFeatureEnabled ? "Enabled" : "Disabled"}</p>
}
```
