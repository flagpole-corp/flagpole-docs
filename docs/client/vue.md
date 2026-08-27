---
id: vue
title: Vue
---

# Vue

A Vue 3 SDK for integrating feature flags into your application with real-time updates, composables, a directive, and a plugin for global usage.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Advanced Usage](#advanced-usage)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

- 🚀 **Real-time Updates**: WebSocket integration for instant feature flag changes
- 🧩 **Composition API**: `useFeatureFlag` and `useFeatureFlags` composables built for Vue 3
- 🎯 **Directive**: `v-feature-flag` for declarative show/hide, with a `:not` modifier
- 🔌 **Plugin**: `createFlagpole` for global `$isFeatureEnabled` access
- 🌍 **Environment Support**: Filter flags by environment (development, staging, production)
- 📊 **TypeScript**: Full type safety with computed refs
- 🖥️ **SSR Compatible**: Works with Nuxt.js and other SSR frameworks

## Installation

### NPM

```bash
npm install @flagpole/client-vue socket.io-client
```

### Yarn

```bash
yarn add @flagpole/client-vue socket.io-client
```

### Requirements

- Vue >= 3.3.0
- Node.js >= 16
- socket.io-client >= 4.7.2
- A modern browser with WebSocket support

## Quick Start

### 1. Install the Plugin

Register the plugin in your app entry point with your project's API key (available from the FlagPole dashboard):

```typescript
// main.ts
import { createApp } from "vue";
import { createFlagpole } from "@flagpole/client-vue";
import App from "./App.vue";

const app = createApp(App);

app.use(
  createFlagpole({
    apiKey: "fp_live_your_api_key",
    environments: ["development"], // optional, if nothing is passed, then all environments will be shown (production, staging and development)
  })
);

app.mount("#app");
```

Alternatively, wrap your app with the `FeatureFlagProvider` component:

```vue
<!-- App.vue -->
<template>
  <FeatureFlagProvider
    api-key="fp_live_your_api_key"
    :environments="['development']"
  >
    <FeatureComponent />
  </FeatureFlagProvider>
</template>

<script setup lang="ts">
import { FeatureFlagProvider } from "@flagpole/client-vue";
import FeatureComponent from "./components/FeatureComponent.vue";
</script>
```

### 2. Use Feature Flags

#### Composition API Usage

```vue
<template>
  <div>
    <h2>Feature Flags Test</h2>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading">Loading flags...</div>

    <!-- Error state -->
    <div v-if="error" class="error">Error: {{ error.message }}</div>

    <!-- Using individual flag composable -->
    <div v-if="isNewFeatureEnabled">
      <NewFeature />
    </div>

    <!-- Using directive -->
    <div v-feature-flag="'premiumFeature'">
      <PremiumContent />
    </div>

    <!-- Display all available flags -->
    <h3>All Flags:</h3>
    <div v-for="(flag, name) in flags" :key="name" class="flag-item">
      <strong>{{ name }}:</strong>
      <span :class="flag.isEnabled ? 'enabled' : 'disabled'">
        {{ flag.isEnabled ? "Enabled" : "Disabled" }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFeatureFlag, useFeatureFlags } from "@flagpole/client-vue";
import NewFeature from "./NewFeature.vue";
import PremiumContent from "./PremiumContent.vue";

// Get all feature flags
const { flags, isLoading, error, isFeatureEnabled } = useFeatureFlags();

// Get a specific feature flag
const isNewFeatureEnabled = useFeatureFlag("newFeature");

// Use the function from useFeatureFlags for programmatic checks
const handleButtonClick = () => {
  if (isFeatureEnabled("buttonFeature")) {
    console.log("Button feature is enabled");
  }
};
</script>

<style scoped>
.loading {
  color: #666;
}
.error {
  color: red;
}
.enabled {
  color: green;
}
.disabled {
  color: gray;
}
.flag-item {
  margin: 5px 0;
}
</style>
```

#### Directive Usage

```vue
<template>
  <div>
    <!-- Basic directive usage -->
    <div v-feature-flag="'newFeature'">
      <h3>New Feature Content</h3>
    </div>

    <!-- Inverted logic with :not modifier -->
    <div v-feature-flag:not="'maintenanceMode'">
      <p>Application is running normally</p>
    </div>

    <!-- Multiple flags with computed properties -->
    <div v-if="showAdvancedUI">
      <AdvancedDashboard />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useFeatureFlag } from "@flagpole/client-vue";

const isAdvancedUIEnabled = useFeatureFlag("advancedUI");
const isPremiumUser = useFeatureFlag("premiumAccess");

const showAdvancedUI = computed(
  () => isAdvancedUIEnabled.value && isPremiumUser.value
);
</script>
```

#### Global Method Usage (Plugin Only)

```vue
<template>
  <div>
    <!-- Using global method when plugin is installed -->
    <button
      v-if="$isFeatureEnabled('globalFeature')"
      @click="handleGlobalAction"
    >
      Global Feature Action
    </button>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance } from "vue";

const instance = getCurrentInstance();

const handleGlobalAction = () => {
  // Access via global properties
  if (
    instance?.appContext.app.config.globalProperties.$isFeatureEnabled(
      "advancedMode"
    )
  ) {
    console.log("Advanced mode is enabled");
  }
};
</script>
```

### 3. Handle Loading & Error States

Gate feature content on `isLoading` and `error` from `useFeatureFlags`:

```vue
<template>
  <div v-if="isLoading" class="loading">Loading feature flags...</div>
  <div v-else-if="error" class="error">Error loading flags: {{ error.message }}</div>
  <div v-else>
    <NewCheckout v-if="isFeatureEnabled('new-checkout')" />
    <LegacyCheckout v-else />
  </div>
</template>

<script setup lang="ts">
import { useFeatureFlags } from "@flagpole/client-vue";

const { isLoading, error, isFeatureEnabled } = useFeatureFlags();
</script>
```

## API Reference

### Composables

#### useFeatureFlags

Returns all feature flags and service state:

```typescript
const {
  flags, // ComputedRef<Record<string, FeatureFlag>>
  isLoading, // ComputedRef<boolean>
  error, // ComputedRef<Error | null>
  isFeatureEnabled, // (flagName: string) => boolean
} = useFeatureFlags();
```

#### useFeatureFlag

Returns the state of a specific feature flag:

```typescript
const isEnabled = useFeatureFlag("flagName"); // ComputedRef<boolean>
```

### Directive

Use the `v-feature-flag` directive to conditionally show/hide elements:

```html
<!-- Basic usage -->
<div v-feature-flag="'featureName'">Content</div>

<!-- Inverted logic -->
<div v-feature-flag:not="'maintenanceMode'">
  Content when not in maintenance
</div>
```

### Plugin

Install globally with the plugin to enable `$isFeatureEnabled` in every component:

```typescript
import { createFlagpole } from "@flagpole/client-vue";

app.use(
  createFlagpole({
    apiKey: "your-api-key",
    environments: ["development"],
  })
);
```

### Provider Component

Alternative setup using the provider component:

```vue
<FeatureFlagProvider api-key="your-api-key" :environments="['development']">
  <YourApp />
</FeatureFlagProvider>
```

## Advanced Usage

### Custom Composable for Complex Logic

```typescript
// composables/useNavigation.ts
import { computed } from "vue";
import { useFeatureFlag } from "@flagpole/client-vue";

export function useNavigation() {
  const newNavEnabled = useFeatureFlag("newNavigation");
  const adminPanelEnabled = useFeatureFlag("adminPanel");
  const betaFeaturesEnabled = useFeatureFlag("betaFeatures");

  const navigationItems = computed(() => {
    const items = [
      { label: "Home", path: "/" },
      { label: "About", path: "/about" },
    ];

    if (newNavEnabled.value) {
      items.push({ label: "Dashboard", path: "/dashboard" });
    }

    if (adminPanelEnabled.value) {
      items.push({ label: "Admin", path: "/admin" });
    }

    if (betaFeaturesEnabled.value) {
      items.push({ label: "Beta", path: "/beta" });
    }

    return items;
  });

  return {
    navigationItems,
    hasAdvancedFeatures: computed(
      () => adminPanelEnabled.value || betaFeaturesEnabled.value
    ),
  };
}
```

### Vue Router Integration

```typescript
// router/index.ts
import { createRouter, createWebHistory } from "vue-router";

// Feature flag guard
function featureFlagGuard(flagName: string, redirectTo: string = "/") {
  return (to: any, from: any, next: any) => {
    const app = to.matched[0]?.instances?.default?.$parent?.$root;
    const isEnabled = app?.$isFeatureEnabled?.(flagName);

    if (isEnabled !== false) {
      next();
    } else {
      next(redirectTo);
    }
  };
}

const routes = [
  {
    path: "/beta-feature",
    component: () => import("./views/BetaFeature.vue"),
    beforeEnter: featureFlagGuard("betaAccess", "/coming-soon"),
  },
  {
    path: "/admin",
    component: () => import("./views/AdminPanel.vue"),
    beforeEnter: featureFlagGuard("adminPanel", "/unauthorized"),
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
```

### A/B Testing Implementation

```vue
<template>
  <div>
    <component :is="checkoutComponent" @purchase="handlePurchase" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useFeatureFlags } from "@flagpole/client-vue";
import CheckoutV1 from "./CheckoutV1.vue";
import CheckoutV2 from "./CheckoutV2.vue";
import CheckoutV3 from "./CheckoutV3.vue";

const { flags } = useFeatureFlags();

const checkoutComponent = computed(() => {
  const experimentFlag = flags.value["checkoutExperiment"];
  const variant = experimentFlag?.conditions?.variant || "control";

  switch (variant) {
    case "variantA":
      return CheckoutV2;
    case "variantB":
      return CheckoutV3;
    default:
      return CheckoutV1;
  }
});

const handlePurchase = (data: any) => {
  // Track A/B test results
  console.log("Purchase completed with variant:", checkoutComponent.value.name);
};
</script>
```

### Conditional Component Registration

```typescript
// plugins/conditionalComponents.ts
import type { App } from "vue";
import type { FeatureFlagService } from "@flagpole/client-vue";

export function registerConditionalComponents(
  app: App,
  service: FeatureFlagService
) {
  // Register components based on feature flags
  if (service.isFeatureEnabled("advancedCharts")) {
    app.component(
      "AdvancedChart",
      () => import("./components/AdvancedChart.vue")
    );
  }

  if (service.isFeatureEnabled("betaWidgets")) {
    app.component("BetaWidget", () => import("./components/BetaWidget.vue"));
  }
}
```

### Reactive Theme Switching

```vue
<template>
  <div :class="themeClasses">
    <h1>Dynamic Theming</h1>
    <p>Theme changes based on feature flags</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useFeatureFlag } from "@flagpole/client-vue";

const isDarkTheme = useFeatureFlag("darkTheme");
const isPremiumTheme = useFeatureFlag("premiumTheme");
const isHighContrast = useFeatureFlag("highContrast");

const themeClasses = computed(() => ({
  "dark-theme": isDarkTheme.value,
  "premium-theme": isPremiumTheme.value,
  "high-contrast": isHighContrast.value,
}));
</script>

<style scoped>
.dark-theme {
  background: #1a1a1a;
  color: #ffffff;
}

.premium-theme {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.high-contrast {
  filter: contrast(1.5);
}
</style>
```

### SSR Support (Nuxt.js)

```typescript
// plugins/flagpole.client.ts
import { createFlagpole } from "@flagpole/client-vue";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(
    createFlagpole({
      apiKey: useRuntimeConfig().public.flagpoleApiKey,
      environments: [useRuntimeConfig().public.environment],
    })
  );
});
```

## Configuration

### FlagpoleConfig

```typescript
interface FlagpoleConfig {
  apiKey: string;
  environments?: string[]; // 'development' | 'staging' | 'production'
}
```

If `environments` is omitted, flags from all environments are loaded.

### Environment Variables

Keep API keys out of source control by reading them from Vite's environment variables:

```typescript
// .env
VITE_FLAGPOLE_API_KEY=fp_live_your_api_key_here
VITE_ENVIRONMENT=development

// main.ts
app.use(
  createFlagpole({
    apiKey: import.meta.env.VITE_FLAGPOLE_API_KEY,
    environments: import.meta.env.VITE_ENVIRONMENT
      ? [import.meta.env.VITE_ENVIRONMENT]
      : undefined,
  })
);
```

### Type-Safe Feature Flags

```typescript
// types/flags.ts
import type { ComputedRef } from "vue";
import { useFeatureFlag } from "@flagpole/client-vue";

export interface AppFeatureFlags {
  newDashboard: boolean;
  premiumFeatures: boolean;
  betaAccess: boolean;
}

// Custom typed composable
export function useTypedFeatureFlag<K extends keyof AppFeatureFlags>(
  flagKey: K
): ComputedRef<boolean> {
  return useFeatureFlag(flagKey);
}
```

## Error Handling

### Loading and Error States

Always render loading and error states from `useFeatureFlags`:

```vue
<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error" class="error">
    Feature flags unavailable: {{ error.message }}
  </div>
  <OnlineFeatures v-else />
</template>

<script setup lang="ts">
import { useFeatureFlags } from "@flagpole/client-vue";

const { isLoading, error } = useFeatureFlags();
</script>
```

### Flag Not Found

`useFeatureFlag` returns a computed ref that resolves to `false` for flags that don't exist — no additional error handling is needed. The SDK also fails safe (all flags `false`) when the connection drops or the API key is invalid.

## Best Practices

### 1. Secure Your API Key

- Store API keys in environment variables, never in source control
- Use different keys for development, staging, and production
- Rotate keys if they're ever exposed

### 2. Always Handle Loading and Error States

Branch on `isLoading` and `error` so components react to connection changes rather than assuming flags are ready.

### 3. Use Descriptive Flag Names

Use consistent, specific camelCase names:

- ✅ `newDashboard`, `betaUserProfile`, `experimentalSearch`
- ❌ `flag1`, `test`

### 4. Prefer Composables Over Global Methods

`useFeatureFlag` / `useFeatureFlags` are reactive and tree-shakeable. Reserve `$isFeatureEnabled` for cases where you can't use the Composition API (e.g. router guards).

### 5. Default to the Safe Path

Always provide a fallback so a disabled or missing flag degrades gracefully:

```vue
<template>
  <PremiumUI v-if="isPremiumEnabled" />
  <StandardUI v-else />
</template>
```

## Troubleshooting

### Common Issues

#### 1. "useFeatureFlags must be used within a FeatureFlagProvider"

**Solution**: Register the SDK before using any composable — either `app.use(createFlagpole({ ... }))` in `main.ts`, or wrap your tree in `<FeatureFlagProvider>`.

#### 2. Flags Always Return False

**Possible causes:**

- Invalid API key
- Wrong environment configuration
- Network connectivity issues

**Solution**: Log the service state to confirm what the SDK received:

```vue
<script setup lang="ts">
import { watchEffect } from "vue";
import { useFeatureFlags } from "@flagpole/client-vue";

const { flags, error, isLoading } = useFeatureFlags();

watchEffect(() => {
  console.log("Flags:", flags.value);
  console.log("Error:", error.value);
  console.log("Loading:", isLoading.value);
});
</script>
```

#### 3. WebSocket Connection Issues

Ensure the WebSocket endpoints are reachable from your environment:

```text
Development: ws://localhost:5000
Production:  wss://useflagpole-api.onrender.com
```

#### 4. Flags Not Reactive in Templates

Access `useFeatureFlag` results with `.value` in `<script>`, and bind the ref directly (not `.value`) in `<template>`. Don't destructure `flags.value` outside a `computed`.

## Contributing

We welcome contributions! To set up the SDK locally:

```bash
# Clone the repository
git clone https://github.com/flagpole-corp/flagpole-client-sdk-vue.git
cd flagpole-client-sdk-vue

# Install dependencies
npm install

# Build the SDK
npm run build
```

### Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Support

- 📧 Email: support@useflagpole.dev
- 📚 Documentation: https://docs.useflagpole.dev
- 🐛 Issues: https://github.com/flagpole-corp/flagpole-client-sdk-vue/issues
- 💬 Discord: https://discord.gg/flagpole
