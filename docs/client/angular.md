---
id: angular
title: Angular
---

# Angular

An Angular SDK for integrating feature flags into your application with real-time updates, structural directives, pipes, and route guards.

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
- 🧩 **Structural Directive**: `*flagpoleFeature` for declarative show/hide with fallback templates
- 🔧 **Pipe**: `featureFlag` pipe for inline checks and conditional classes
- 🛡️ **Route Guards**: `FeatureFlagGuard` to protect routes behind flags
- 🌍 **Environment Support**: Filter flags by environment (development, staging, production)
- 📊 **TypeScript**: Full type safety with RxJS observables
- ⚡ **Zero Config**: Works out of the box with sensible defaults

## Installation

### NPM

```bash
npm install @flagpole/angular socket.io-client
```

### Yarn

```bash
yarn add @flagpole/angular socket.io-client
```

### Requirements

- Angular >= 15.0.0
- RxJS >= 7.5.0
- TypeScript >= 4.8.0
- socket.io-client >= 4.7.2

## Quick Start

### 1. Register the Module

Import `FeatureFlagModule.forRoot()` in your root module with your project's API key (available from the FlagPole dashboard):

```typescript
// app.module.ts
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FeatureFlagModule } from "@flagpole/angular";

import { AppComponent } from "./app.component";

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    FeatureFlagModule.forRoot({
      apiKey: "fp_live_your_api_key",
      environments: ["development"], // optional, if nothing is passed, then all environments will be shown (production, staging and development)
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

### 2. Use Feature Flags

#### Template Usage

```html
<!-- feature.component.html -->
<div>
  <h2>Feature Flags Test</h2>

  <!-- Loading state -->
  <div *ngIf="isLoading$ | async">Loading flags...</div>

  <!-- Error state -->
  <div *ngIf="error$ | async as error" class="error">
    Error: {{ error.message }}
  </div>

  <!-- Use structural directive for specific flag -->
  <div *flagpoleFeature="'newFeature'">
    <app-new-feature></app-new-feature>
  </div>

  <!-- Use directive with fallback -->
  <div *flagpoleFeature="'betaFeature'; else oldFeature">
    <h3>Beta Feature Content</h3>
  </div>
  <ng-template #oldFeature>
    <h3>Old Feature Content</h3>
  </ng-template>

  <!-- Use pipe for inline checks -->
  <button *ngIf="'premiumFeature' | featureFlag" class="premium-btn">
    Premium Action
  </button>

  <!-- Display all available flags -->
  <h3>All Flags:</h3>
  <div *ngFor="let flag of (flags$ | async) | keyvalue" class="flag-item">
    <strong>{{ flag.key }}:</strong>
    <span [class]="flag.value.isEnabled ? 'enabled' : 'disabled'">
      {{ flag.value.isEnabled ? 'Enabled' : 'Disabled' }}
    </span>
  </div>
</div>
```

#### Component Usage

```typescript
// feature.component.ts
import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import { FeatureFlagService, FeatureFlag } from "@flagpole/angular";

@Component({
  selector: "app-feature",
  templateUrl: "./feature.component.html",
  styleUrls: ["./feature.component.css"],
})
export class FeatureComponent implements OnInit {
  flags$: Observable<Record<string, FeatureFlag>>;
  isLoading$: Observable<boolean>;
  error$: Observable<Error | null>;

  constructor(private featureFlagService: FeatureFlagService) {
    this.flags$ = this.featureFlagService.flags$;
    this.isLoading$ = this.featureFlagService.isLoading$;
    this.error$ = this.featureFlagService.error$;
  }

  ngOnInit(): void {
    // Check if a specific feature is enabled
    if (this.featureFlagService.isFeatureEnabled("newDashboard")) {
      console.log("New dashboard is enabled");
    }

    // Get complete flag details
    const flag = this.featureFlagService.getFlag("betaFeature");
    if (flag) {
      console.log("Flag details:", flag);
    }
  }

  onButtonClick(): void {
    const isEnabled = this.featureFlagService.isFeatureEnabled("buttonFeature");
    if (isEnabled) {
      console.log("Button feature is enabled - executing action");
      // Your feature logic here
    }
  }
}
```

### 3. Handle Loading & Error States

Subscribe to the service observables and gate your feature content until flags are ready:

```html
<!-- Loading state -->
<div *ngIf="isLoading$ | async" class="loading">
  <mat-spinner></mat-spinner>
  Loading feature flags...
</div>

<!-- Error state -->
<div *ngIf="error$ | async as error" class="error-banner">
  <mat-icon>error</mat-icon>
  Failed to load feature flags: {{ error.message }}
</div>

<!-- Content when loaded -->
<div *ngIf="!(isLoading$ | async) && !(error$ | async)">
  <div *flagpoleFeature="'newFeature'">
    <app-new-feature></app-new-feature>
  </div>
</div>
```

## API Reference

### FeatureFlagService

#### Methods

```typescript
// Check if a feature flag is enabled
isFeatureEnabled(flagName: string): boolean

// Get complete flag details
getFlag(flagName: string): FeatureFlag | null

// Get all flags
getAllFlags(): Record<string, FeatureFlag>
```

#### Observables

```typescript
// All feature flags
flags$: Observable<Record<string, FeatureFlag>>;

// Loading state
isLoading$: Observable<boolean>;

// Error state
error$: Observable<Error | null>;
```

### Structural Directive

Use the `*flagpoleFeature` directive to conditionally show/hide content:

```html
<!-- Basic usage -->
<div *flagpoleFeature="'featureName'">Feature content here</div>

<!-- With else template -->
<div *flagpoleFeature="'featureName'; else fallback">New feature content</div>
<ng-template #fallback> Old feature content </ng-template>
```

### Pipe

Use the `featureFlag` pipe for inline flag checks:

```html
<!-- Show element if flag is enabled -->
<button *ngIf="'featureName' | featureFlag">Action</button>

<!-- Conditional classes -->
<div [class.premium]="'premiumFeature' | featureFlag">
  Content with conditional styling
</div>
```

### Route Guards

Protect routes based on feature flags with `FeatureFlagGuard`:

```typescript
// app-routing.module.ts
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FeatureFlagGuard } from "@flagpole/angular";

const routes: Routes = [
  {
    path: "beta-feature",
    component: BetaComponent,
    canActivate: [FeatureFlagGuard],
    data: {
      featureFlag: "betaAccess",
      redirectTo: "/home", // Optional: redirect if flag is disabled
    },
  },
  {
    path: "admin",
    loadChildren: () =>
      import("./admin/admin.module").then((m) => m.AdminModule),
    canActivate: [FeatureFlagGuard],
    data: {
      featureFlag: "adminPanel",
      redirectTo: "/unauthorized",
    },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
```

## Advanced Usage

### Reactive Patterns

Combine feature flags with other observables using RxJS:

```typescript
import { Component } from "@angular/core";
import { combineLatest, map } from "rxjs";

@Component({
  selector: "app-dashboard",
  template: `
    <div *ngIf="showAdvancedDashboard$ | async; else basicDashboard">
      <app-advanced-dashboard></app-advanced-dashboard>
    </div>
    <ng-template #basicDashboard>
      <app-basic-dashboard></app-basic-dashboard>
    </ng-template>
  `,
})
export class DashboardComponent {
  showAdvancedDashboard$ = combineLatest([
    this.featureFlagService.flags$,
    this.userService.currentUser$,
  ]).pipe(
    map(
      ([flags, user]) =>
        flags["advancedDashboard"]?.isEnabled && user?.isPremium
    )
  );

  constructor(
    private featureFlagService: FeatureFlagService,
    private userService: UserService
  ) {}
}
```

### A/B Testing Implementation

Read the flag's conditions to branch between experiment variants:

```typescript
import { Component } from "@angular/core";
import { map } from "rxjs";

@Component({
  selector: "app-checkout",
  template: `<ng-container [ngSwitch]="variant$ | async">
    <app-checkout-v2 *ngSwitchCase="'variantA'"></app-checkout-v2>
    <app-checkout-v3 *ngSwitchCase="'variantB'"></app-checkout-v3>
    <app-checkout-v1 *ngSwitchDefault></app-checkout-v1>
  </ng-container>`,
})
export class CheckoutComponent {
  variant$ = this.featureFlagService.flags$.pipe(
    map((flags) => flags["checkoutExperiment"]?.conditions?.variant ?? "control")
  );

  constructor(private featureFlagService: FeatureFlagService) {}
}
```

### Real-time Updates

The SDK keeps a WebSocket connection open and pushes flag changes into `flags$` automatically — any component using the `async` pipe or the `*flagpoleFeature` directive re-renders without a page reload.

## Configuration

### FeatureFlagConfig

```typescript
interface FeatureFlagConfig {
  apiKey: string;
  environments?: Environment[]; // 'development' | 'staging' | 'production'
}
```

If `environments` is omitted, flags from all environments are loaded.

### Environment Variables

Keep API keys out of source control by reading them from the Angular environment files:

```typescript
// environment.ts
export const environment = {
  production: false,
  flagpoleApiKey: "fp_dev_your_dev_api_key",
};

// app.module.ts
import { environment } from "../environments/environment";

@NgModule({
  imports: [
    FeatureFlagModule.forRoot({
      apiKey: environment.flagpoleApiKey,
      environments: ["development"],
    }),
  ],
})
export class AppModule {}
```

## Error Handling

### Loading and Error States

Always render loading and error states from the service observables:

```html
<!-- Loading state -->
<div *ngIf="isLoading$ | async" class="loading">
  <mat-spinner></mat-spinner>
  Loading feature flags...
</div>

<!-- Error state -->
<div *ngIf="error$ | async as error" class="error-banner">
  <mat-icon>error</mat-icon>
  Failed to load feature flags: {{ error.message }}
</div>

<!-- Content when loaded -->
<div *ngIf="!(isLoading$ | async) && !(error$ | async)">
  <!-- Your feature content here -->
</div>
```

### Flag Not Found

`isFeatureEnabled` returns `false` for flags that don't exist, and `getFlag` returns `null` — no extra error handling is required for missing flags. The SDK also fails safe (all flags `false`) when the connection drops or the API key is invalid.

## Best Practices

### 1. Secure Your API Key

- Store API keys in environment variables, never in source control
- Use different keys for development, staging, and production
- Rotate keys if they're ever exposed

### 2. Always Handle Loading and Error States

Use the `async` pipe with `isLoading$` and `error$` so components react to connection changes instead of assuming flags are ready.

### 3. Use Descriptive Flag Names

Use consistent, specific camelCase names:

- ✅ `newDashboard`, `betaUserProfile`, `experimentalSearch`
- ❌ `flag1`, `test`

### 4. Optimize Change Detection

- Use the `OnPush` change detection strategy where possible
- Prefer the `async` pipe for automatic subscription management
- Unsubscribe from manual subscriptions to prevent memory leaks

```typescript
@Component({
  selector: "app-feature",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *flagpoleFeature="'newFeature'">
      <!-- Content automatically updates when flag changes -->
    </div>
  `,
})
export class FeatureComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private featureFlagService: FeatureFlagService) {
    this.featureFlagService.flags$
      .pipe(takeUntil(this.destroy$))
      .subscribe((flags) => {
        // Handle flags update
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 5. Test Both Flag States

Test enabled and disabled paths by mocking `FeatureFlagService`:

```typescript
// feature.component.spec.ts
describe("FeatureComponent", () => {
  let component: FeatureComponent;
  let featureFlagService: jasmine.SpyObj<FeatureFlagService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj("FeatureFlagService", [
      "isFeatureEnabled",
    ]);

    TestBed.configureTestingModule({
      declarations: [FeatureComponent],
      providers: [{ provide: FeatureFlagService, useValue: spy }],
    });

    featureFlagService = TestBed.inject(
      FeatureFlagService
    ) as jasmine.SpyObj<FeatureFlagService>;
  });

  it("should show new feature when flag is enabled", () => {
    featureFlagService.isFeatureEnabled.and.returnValue(true);
    // Test enabled state
  });

  it("should hide new feature when flag is disabled", () => {
    featureFlagService.isFeatureEnabled.and.returnValue(false);
    // Test disabled state
  });
});
```

## Troubleshooting

### Common Issues

#### 1. `*flagpoleFeature` or `featureFlag` pipe is not recognized

**Solution**: Ensure `FeatureFlagModule.forRoot({ ... })` is imported in your root module, and `FeatureFlagModule` is imported in any feature module that uses the directive or pipe.

#### 2. Flags Always Return False

**Possible causes:**

- Invalid API key
- Wrong environment configuration
- Network connectivity issues

**Solution**: Log the service state to confirm what the SDK received:

```typescript
this.featureFlagService.flags$.subscribe((flags) => console.log("Flags:", flags));
this.featureFlagService.error$.subscribe((error) => console.log("Error:", error));
```

#### 3. WebSocket Connection Issues

Ensure the WebSocket endpoints are reachable from your environment:

```text
Development: ws://localhost:5000
Production:  wss://useflagpole-api.onrender.com
```

#### 4. Memory Leaks / Stale Subscriptions

Use the `async` pipe, or `takeUntil(this.destroy$)` with `ngOnDestroy`, for every manual subscription to `flags$`, `isLoading$`, or `error$`.

## Contributing

We welcome contributions! To set up the SDK locally:

```bash
# Clone the repository
git clone https://github.com/flagpole-corp/flagpole-client-sdk-angular.git
cd flagpole-client-sdk-angular

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
- 🐛 Issues: https://github.com/flagpole-corp/flagpole-client-sdk-angular/issues
- 💬 Discord: https://discord.gg/flagpole
