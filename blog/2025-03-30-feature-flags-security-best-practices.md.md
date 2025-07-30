---
slug: feature-flags-security-best-practices
title: Security - Protecting Your Applications and Data
authors: [vitor]
tags:
  [
    security,
    feature-flags,
    api-keys,
    authentication,
    authorization,
    react,
    nodejs,
    angular,
    vue,
  ]
---

### Feature Flags Security - Protecting Your Applications and Data

Feature flags are powerful tools that can significantly enhance your development workflow, but they also introduce new security considerations. Whether you're implementing feature flags in **React**, **Node.js**, **Angular**, **Vue**, or **React Native** applications, understanding and implementing proper security measures is crucial for protecting your applications and user data.

### Understanding Feature Flag Security Risks

Feature flags create new attack surfaces and potential vulnerabilities that developers must address:

#### 1. **API Key Exposure**

Exposing your feature flag API keys can allow attackers to manipulate your application's behavior.

#### 2. **Privilege Escalation**

Improperly configured flags might grant unauthorized access to premium features or administrative functions.

#### 3. **Data Leakage**

Feature flags that control data access could inadvertently expose sensitive information.

#### 4. **Logic Bypass**

Attackers might exploit flag logic to bypass security controls or business rules.

```javascript
// ❌ NEVER expose API keys in frontend code
const badExample = {
  apiKey: "fp_live_secret_key_12345", // This will be visible to users!
};

// ✅ Use environment variables and proper key types
const goodExample = {
  apiKey: process.env.FLAGPOLE_PUBLIC_KEY, // Public key for frontend
};
```

<!-- truncate -->

### API Key Security Best Practices

#### Different Key Types for Different Environments

FlagPole provides different types of API keys for different use cases:

```javascript
// Frontend applications (React, Angular, Vue, React Native)
const frontendConfig = {
  apiKey: process.env.REACT_APP_FLAGPOLE_PUBLIC_KEY, // Public key
  environments: ["production"],
};

// Backend applications (Node.js, Python)
const backendConfig = {
  apiKey: process.env.FLAGPOLE_PRIVATE_KEY, // Private key with more permissions
  environments: ["production"],
};
```

#### Environment-Specific Keys

```javascript
// config/flagpole.js
const getApiKey = () => {
  switch (process.env.NODE_ENV) {
    case "production":
      return process.env.FLAGPOLE_PROD_KEY;
    case "staging":
      return process.env.FLAGPOLE_STAGING_KEY;
    case "development":
      return process.env.FLAGPOLE_DEV_KEY;
    default:
      throw new Error("Invalid environment for Flagpole API key");
  }
};

const flagpoleClient = new FlagpoleClient({
  apiKey: getApiKey(),
  environments: [process.env.NODE_ENV],
});
```

#### Key Rotation Strategy

```javascript
// Implement graceful key rotation
class SecureFlagpoleClient {
  constructor(primaryKey, fallbackKey) {
    this.primaryClient = new FlagpoleClient({ apiKey: primaryKey });
    this.fallbackClient = fallbackKey
      ? new FlagpoleClient({ apiKey: fallbackKey })
      : null;
  }

  async isFeatureEnabled(flagName, context) {
    try {
      return await this.primaryClient.isFeatureEnabled(flagName, context);
    } catch (error) {
      if (this.fallbackClient && error.status === 401) {
        console.warn("Primary API key failed, using fallback");
        return await this.fallbackClient.isFeatureEnabled(flagName, context);
      }
      throw error;
    }
  }
}
```

### Frontend Security Considerations

#### React Security Implementation

```jsx
import { FeatureFlagProvider } from "@flagpole/react";

// ✅ Secure React implementation
function App() {
  // Only use public keys in frontend
  const apiKey = process.env.REACT_APP_FLAGPOLE_PUBLIC_KEY;

  if (!apiKey) {
    console.error("Flagpole API key not configured");
    return <ErrorBoundary />;
  }

  return (
    <FeatureFlagProvider
      apiKey={apiKey}
      // Never send sensitive user data in context
      userContext={{
        id: user.id, // Safe: non-sensitive identifier
        plan: user.planType, // Safe: plan information
        // ❌ Don't include: email, phone, address, payment info
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<ProtectedAdminRoute />} />
        </Routes>
      </Router>
    </FeatureFlagProvider>
  );
}

// Secure admin route protection
function ProtectedAdminRoute() {
  const showAdminFeatures = useFeatureFlag("admin-panel-access");
  const user = useAuth();

  // Double-check permissions on backend AND frontend
  if (!user.isAdmin || !showAdminFeatures) {
    return <Navigate to="/unauthorized" />;
  }

  return <AdminPanel />;
}
```

#### Angular Security Patterns

```typescript
// Angular secure service implementation
@Injectable({
  providedIn: "root",
})
export class SecureFeatureFlagService {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = environment.flagpolePublicKey;

    if (!this.apiKey || this.apiKey.includes("private")) {
      throw new Error("Invalid or missing public API key");
    }
  }

  // Sanitize context data before sending
  createSafeContext(user: User): EvaluationContext {
    return {
      userId: user.id,
      userType: user.type,
      // ❌ Never include sensitive data
      // email: user.email,
      // creditCard: user.paymentInfo
    };
  }
}

// Secure route guard
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private featureFlags: FeatureFlagService,
    private auth: AuthService
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const flagName = route.data["featureFlag"];
    const requiredRole = route.data["requiredRole"];

    const user = this.auth.getCurrentUser();

    // Check both feature flag AND user permissions
    const flagEnabled = await this.featureFlags.isFeatureEnabled(flagName);
    const hasPermission = user && user.roles.includes(requiredRole);

    return flagEnabled && hasPermission;
  }
}
```

#### Vue.js Security Implementation

```vue
<!-- Secure Vue component -->
<template>
  <div>
    <div v-if="canShowAdminTools">
      <AdminToolbar />
    </div>
    <div v-feature-flag="'public-feature'">
      <PublicContent />
    </div>
  </div>
</template>

<script>
import { useFeatureFlags } from "@flagpole/vue";
import { useAuth } from "@/composables/auth";

export default {
  setup() {
    const { isFeatureEnabled } = useFeatureFlags();
    const { user, hasRole } = useAuth();

    const canShowAdminTools = computed(() => {
      // Combine feature flag with proper authorization
      return isFeatureEnabled("admin-tools") && hasRole("administrator");
    });

    // Safe context creation
    const createUserContext = () => ({
      userId: user.value?.id,
      plan: user.value?.subscription?.plan,
      // Only include non-sensitive data
    });

    return {
      canShowAdminTools,
      createUserContext,
    };
  },
};
</script>
```

### Backend Security Implementation

#### Node.js Security Patterns

```javascript
const { FlagpoleClient, flagpoleMiddleware } = require('@flagpole/node');
const rateLimit = require('express-rate-limit');

// Secure client configuration
const flagpoleClient = new FlagpoleClient({
  apiKey: process.env.FLAGPOLE_PRIVATE_KEY, // Use private key for backend
  environments: [process.env.NODE_ENV],
  fallbacks: {
    // Secure defaults - fail closed for security features
    'admin-access': false,
    'data-export': false,
    'debug-mode': false
  }
});

// Rate limiting for feature flag endpoints
const flagRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many feature flag requests'
});

app.
```
