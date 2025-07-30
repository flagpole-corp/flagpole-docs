---
slug: react-feature-flags-complete-guide
title: Mastering Feature Flags in React Applications - A Developer's Guide
authors: [vitor]
tags: [react, feature-flags, javascript, frontend, hooks, components, jsx]
---

# Mastering Feature Flags in React Applications - A Developer's Guide

**React** applications require dynamic, responsive user experiences. Feature flags provide the perfect solution for controlling features, conducting A/B tests, and rolling out updates safely in **React** apps. This comprehensive guide covers everything you need to know about implementing feature flags in **React** applications.

## Why React Developers Need Feature Flags

**React**'s component-based architecture makes it ideal for feature flag implementation. You can conditionally render components, modify props, or change application behavior without touching your deployment pipeline.

```jsx
import { useFeatureFlag } from "@flagpole/react";

function Dashboard() {
  const showNewChart = useFeatureFlag("enhanced-analytics");
  const enableDarkMode = useFeatureFlag("dark-mode-ui");

  return (
    <div className={enableDarkMode ? "dark-theme" : "light-theme"}>
      <h1>Analytics Dashboard</h1>
      {showNewChart ? <NewChartComponent /> : <LegacyChart />}
    </div>
  );
}
```

<!-- truncate -->

## Setting Up Feature Flags in React

### Installation and Basic Setup

```bash
npm install @flagpole/react
# or
yarn add @flagpole/react
```

### Provider Configuration

```jsx
// App.jsx
import { FeatureFlagProvider } from "@flagpole/react";

function App() {
  return (
    <FeatureFlagProvider
      apiKey="fp_live_your_api_key"
      environments={["development"]}
    >
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </FeatureFlagProvider>
  );
}

export default App;
```

## React Hooks for Feature Flags

### useFeatureFlag Hook

The most common pattern in **React** applications:

```jsx
import { useFeatureFlag } from "@flagpole/react";

function ProductCard({ product }) {
  const showPriceComparison = useFeatureFlag("price-comparison");
  const enableWishlist = useFeatureFlag("wishlist-feature");

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>${product.price}</p>

      {showPriceComparison && <PriceComparisonWidget productId={product.id} />}

      {enableWishlist && (
        <button onClick={() => addToWishlist(product.id)}>
          Add to Wishlist
        </button>
      )}
    </div>
  );
}
```

### useFeatureFlags Hook

For multiple flags or complex logic:

```jsx
import { useFeatureFlags } from "@flagpole/react";

function UserProfile() {
  const { flags, isLoading, error, isFeatureEnabled } = useFeatureFlags();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorBoundary error={error} />;

  const showProfileV2 = isFeatureEnabled("profile-redesign");
  const enableSocialLogin = isFeatureEnabled("social-authentication");
  const showAdvancedSettings = isFeatureEnabled("advanced-user-settings");

  return (
    <div className="user-profile">
      {showProfileV2 ? <ProfileV2 /> : <ProfileV1 />}

      <LoginSection socialLogin={enableSocialLogin} />

      {showAdvancedSettings && <AdvancedSettings />}
    </div>
  );
}
```

## Advanced React Patterns

### Higher-Order Components (HOCs)

Create reusable flag-based components:

```jsx
import { withFeatureFlag } from "@flagpole/react";

// Component that only renders when flag is enabled
const BetaFeature = ({ children }) => (
  <div className="beta-badge">
    <span>BETA</span>
    {children}
  </div>
);

const ConditionalBetaFeature = withFeatureFlag(
  BetaFeature,
  "beta-features-enabled"
);

// Usage
function App() {
  return (
    <div>
      <ConditionalBetaFeature>
        <NewChatWidget />
      </ConditionalBetaFeature>
    </div>
  );
}
```

### Custom Hook Patterns

Build domain-specific feature flag hooks:

```jsx
// hooks/useNavigationFlags.js
import { useFeatureFlag } from "@flagpole/react";

export function useNavigationFlags() {
  const showNewNavbar = useFeatureFlag("redesigned-navigation");
  const enableSearch = useFeatureFlag("global-search");
  const showUserMenu = useFeatureFlag("enhanced-user-menu");

  return {
    showNewNavbar,
    enableSearch,
    showUserMenu,
    navigationConfig: {
      type: showNewNavbar ? "v2" : "v1",
      features: {
        search: enableSearch,
        userMenu: showUserMenu,
      },
    },
  };
}

// components/Navigation.jsx
function Navigation() {
  const { navigationConfig } = useNavigationFlags();

  return navigationConfig.type === "v2" ? (
    <NavigationV2 config={navigationConfig} />
  ) : (
    <NavigationV1 config={navigationConfig} />
  );
}
```

## React Router Integration

Control routes with feature flags:

```jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useFeatureFlag } from "@flagpole/react";

function AppRoutes() {
  const enableBetaRoutes = useFeatureFlag("beta-routes");
  const showAdminPanel = useFeatureFlag("admin-panel-access");

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />

      {enableBetaRoutes && (
        <>
          <Route path="/beta/new-checkout" element={<NewCheckout />} />
          <Route path="/beta/analytics" element={<BetaAnalytics />} />
        </>
      )}

      {showAdminPanel ? (
        <Route path="/admin/*" element={<AdminPanel />} />
      ) : (
        <Route path="/admin/*" element={<Navigate to="/unauthorized" />} />
      )}
    </Routes>
  );
}
```

## State Management Integration

### Redux Integration

```jsx
// store/flagsSlice.js
import { createSlice } from "@reduxjs/toolkit";

const flagsSlice = createSlice({
  name: "flags",
  initialState: {
    flags: {},
    isLoading: false,
  },
  reducers: {
    setFlags: (state, action) => {
      state.flags = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

// Custom hook combining Redux and feature flags
function useReduxFeatureFlags() {
  const dispatch = useDispatch();
  const { flags } = useFeatureFlags();

  useEffect(() => {
    dispatch(setFlags(flags));
  }, [flags, dispatch]);

  return useSelector((state) => state.flags);
}
```

### Context API Pattern

```jsx
// contexts/FeatureContext.js
import { createContext, useContext } from "react";
import { useFeatureFlags } from "@flagpole/react";

const FeatureContext = createContext();

export function FeatureProvider({ children }) {
  const flagData = useFeatureFlags();

  const features = {
    ...flagData,
    // Computed feature states
    isModernUI: flagData.isFeatureEnabled("modern-ui-redesign"),
    hasAdvancedFeatures: flagData.isFeatureEnabled("advanced-features"),
    // Feature combinations
    showPremiumContent:
      flagData.isFeatureEnabled("premium-content") &&
      flagData.isFeatureEnabled("user-subscriptions"),
  };

  return (
    <FeatureContext.Provider value={features}>
      {children}
    </FeatureContext.Provider>
  );
}

export const useFeatures = () => useContext(FeatureContext);
```

## Performance Optimization

### Memoization with Feature Flags

```jsx
import { useMemo } from "react";
import { useFeatureFlag } from "@flagpole/react";

function ExpensiveComponent({ data }) {
  const enableOptimization = useFeatureFlag("performance-optimization");

  const processedData = useMemo(() => {
    return enableOptimization
      ? optimizedDataProcessing(data)
      : standardDataProcessing(data);
  }, [data, enableOptimization]);

  return <DataVisualization data={processedData} />;
}
```

### Lazy Loading with Feature Flags

```jsx
import { lazy, Suspense } from "react";
import { useFeatureFlag } from "@flagpole/react";

// Conditionally load components based on flags
const AdvancedChart = lazy(() => import("./AdvancedChart"));
const BasicChart = lazy(() => import("./BasicChart"));

function ChartContainer() {
  const useAdvancedCharts = useFeatureFlag("advanced-charts");

  const ChartComponent = useAdvancedCharts ? AdvancedChart : BasicChart;

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ChartComponent />
    </Suspense>
  );
}
```

## A/B Testing in React

```jsx
import { useFeatureFlags } from "@flagpole/react";

function CheckoutPage() {
  const { flags } = useFeatureFlags();
  const checkoutVariant =
    flags["checkout-experiment"]?.conditions?.variant || "control";

  const renderCheckoutFlow = () => {
    switch (checkoutVariant) {
      case "single-page":
        return <SinglePageCheckout />;
      case "multi-step":
        return <MultiStepCheckout />;
      case "progressive":
        return <ProgressiveCheckout />;
      default:
        return <StandardCheckout />;
    }
  };

  // Track experiment exposure
  useEffect(() => {
    analytics.track("checkout_experiment_viewed", {
      variant: checkoutVariant,
      userId: user.id,
    });
  }, [checkoutVariant]);

  return <div className="checkout-container">{renderCheckoutFlow()}</div>;
}
```

## Testing React Components with Feature Flags

### Jest and React Testing Library

```jsx
// __tests__/ProductCard.test.jsx
import { render, screen } from "@testing-library/react";
import { FeatureFlagProvider } from "@flagpole/react";
import ProductCard from "../ProductCard";

// Mock the feature flag provider
const MockFeatureFlagProvider = ({ flags, children }) => (
  <FeatureFlagProvider apiKey="test-key" mockFlags={flags}>
    {children}
  </FeatureFlagProvider>
);

describe("ProductCard", () => {
  const mockProduct = {
    id: 1,
    name: "Test Product",
    price: 99.99,
  };

  it("shows wishlist button when flag is enabled", () => {
    render(
      <MockFeatureFlagProvider flags={{ "wishlist-feature": true }}>
        <ProductCard product={mockProduct} />
      </MockFeatureFlagProvider>
    );

    expect(screen.getByText("Add to Wishlist")).toBeInTheDocument();
  });

  it("hides wishlist button when flag is disabled", () => {
    render(
      <MockFeatureFlagProvider flags={{ "wishlist-feature": false }}>
        <ProductCard product={mockProduct} />
      </MockFeatureFlagProvider>
    );

    expect(screen.queryByText("Add to Wishlist")).not.toBeInTheDocument();
  });
});
```

### Storybook Integration

```jsx
// stories/ProductCard.stories.jsx
import ProductCard from "../ProductCard";
import { FeatureFlagProvider } from "@flagpole/react";

export default {
  title: "Components/ProductCard",
  component: ProductCard,
  decorators: [
    (Story, context) => (
      <FeatureFlagProvider
        apiKey="storybook-key"
        mockFlags={context.args.flags}
      >
        <Story />
      </FeatureFlagProvider>
    ),
  ],
};

export const WithWishlist = {
  args: {
    product: { id: 1, name: "Sample Product", price: 29.99 },
    flags: { "wishlist-feature": true },
  },
};

export const WithoutWishlist = {
  args: {
    product: { id: 1, name: "Sample Product", price: 29.99 },
    flags: { "wishlist-feature": false },
  },
};
```

## Error Handling and Fallbacks

```jsx
import { useFeatureFlags } from "@flagpole/react";

function RobustComponent() {
  const { flags, isLoading, error } = useFeatureFlags();

  // Loading state
  if (isLoading) {
    return <ComponentSkeleton />;
  }

  // Error state with graceful fallback
  if (error) {
    console.warn("Feature flags unavailable, using defaults:", error);
    return <DefaultComponent />;
  }

  // Feature flag evaluation with fallbacks
  const showNewFeature = flags?.["new-feature"]?.isEnabled ?? false;

  return <div>{showNewFeature ? <NewFeature /> : <LegacyFeature />}</div>;
}
```

## Best Practices for React Feature Flags

### 1. Component Organization

```jsx
// features/UserDashboard/index.jsx
import { useFeatureFlag } from "@flagpole/react";
import DashboardV1 from "./DashboardV1";
import DashboardV2 from "./DashboardV2";

export default function UserDashboard() {
  const useNewDashboard = useFeatureFlag("dashboard-redesign");

  return useNewDashboard ? <DashboardV2 /> : <DashboardV1 />;
}
```

### 2. Flag Naming Conventions

```jsx
// Good flag names for React components
const enableModal = useFeatureFlag("enhanced-modal-component");
const showTooltips = useFeatureFlag("ui-helpful-tooltips");
const useNewRouter = useFeatureFlag("react-router-v7-migration");
```

### 3. TypeScript Integration

```typescript
// types/flags.ts
export interface FeatureFlags {
  "new-checkout-flow": boolean;
  "dark-mode-toggle": boolean;
  "advanced-search": boolean;
}

// Custom typed hook
export const useTypedFeatureFlag = <K extends keyof FeatureFlags>(
  flagKey: K
): boolean => {
  return useFeatureFlag(flagKey);
};

// Usage with full type safety
const isDarkMode = useTypedFeatureFlag("dark-mode-toggle");
```

## Real-World React Examples

### E-commerce Product Page

```jsx
function ProductPage({ productId }) {
  const showReviews = useFeatureFlag("product-reviews");
  const enableRecommendations = useFeatureFlag("product-recommendations");
  const showARPreview = useFeatureFlag("ar-product-preview");

  return (
    <div className="product-page">
      <ProductImages productId={productId} />
      <ProductDetails productId={productId} />

      {showARPreview && <ARPreviewButton productId={productId} />}
      {showReviews && <ProductReviews productId={productId} />}
      {enableRecommendations && <RecommendedProducts productId={productId} />}
    </div>
  );
}
```

### Social Media Feed

```jsx
function SocialFeed() {
  const showStories = useFeatureFlag("instagram-stories");
  const enableLiveVideo = useFeatureFlag("live-video-streaming");
  const useInfiniteScroll = useFeatureFlag("infinite-scroll-feed");

  return (
    <div className="social-feed">
      {showStories && <StoriesBar />}

      <FeedContainer infiniteScroll={useInfiniteScroll}>
        <FeedPosts />
        {enableLiveVideo && <LiveVideoSection />}
      </FeedContainer>
    </div>
  );
}
```

## Getting Started

Ready to implement feature flags in your **React** application?

```bash
npm install @flagpole/react
```

```jsx
import { FeatureFlagProvider, useFeatureFlag } from "@flagpole/react";

function App() {
  return (
    <FeatureFlagProvider apiKey="fp_live_your_key">
      <YourReactApp />
    </FeatureFlagProvider>
  );
}

function YourReactApp() {
  const newFeature = useFeatureFlag("amazing-new-feature");
  return newFeature ? <NewComponent /> : <OldComponent />;
}
```

## Conclusion

Feature flags transform how you build **React** applications by providing:

- **Safe deployments** with instant rollback capabilities
- **A/B testing** for data-driven UI decisions
- **Gradual rollouts** for new **React** components
- **Better user experiences** through personalization
- **Faster development** with parallel feature development

Start implementing feature flags in your **React** app today with FlagPole. Your **React** components will become more flexible, your deployments safer, and your users happier.

[Get started with FlagPole for React →](https://app.useflagpole.dev)

---

_Keywords: React, feature flags, React hooks, JSX, JavaScript, frontend, components, React Router, Redux, state management, A/B testing, conditional rendering_
