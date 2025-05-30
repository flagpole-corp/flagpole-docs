---
id: angular
title: Angular
---

# Angular SDK Integration

### 3. Install the SDK

```bash
# Using npm
npm install @flagpole/client-angular socket.io-client

# Using yarn
yarn add @flagpole/client-angular socket.io-client
```

### 4. Initialize in Your Application

```typescript
// app.module.ts
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FeatureFlagModule } from "@flagpole/client-angular";

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

### 5. Use Feature Flags

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
import { FeatureFlagService, FeatureFlag } from "@flagpole/client-angular";

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

## Available APIs

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

Protect routes based on feature flags:

```typescript
// app-routing.module.ts
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FeatureFlagGuard } from "@flagpole/client-angular";

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

## Best Practices

### API Key Security

- Store API keys in environment variables
- Use different keys for different environments
- Never commit API keys to source control
- Rotate keys if they're ever exposed

```typescript
// Example using environment variables
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

### Error Handling

Always handle loading and error states in your templates:

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

### Reactive Patterns

Leverage RxJS for reactive programming:

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

### Performance Considerations

- Use `OnPush` change detection strategy when possible
- Unsubscribe from observables to prevent memory leaks
- Use the `async` pipe for automatic subscription management

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
    // Manual subscription example
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
