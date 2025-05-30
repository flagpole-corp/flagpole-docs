---
id: vue
title: Vue
---

# Vue SDK Integration

### 3. Install the SDK

```bash
# Using npm
npm install @flagpole/client-vue socket.io-client

# Using yarn
yarn add @flagpole/client-vue socket.io-client
```

### 4. Initialize in Your Application

#### Method 1: Using the Plugin (Recommended)

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

#### Method 2: Using the Provider Component

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

### 5. Use Feature Flags

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

## Available APIs

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

Install globally with the plugin:

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

## Advanced Usage Patterns

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

## Best Practices

### API Key Security

Store API keys in environment variables:

```typescript
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

### Error Handling

Implement comprehensive error handling:
