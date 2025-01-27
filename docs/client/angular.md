---
id: angular
title: Angular SDK
---

# Angular SDK Integration

## Installation

```bash
npm install @flagpole/client-angular
```

## Set up the module

```
import { FeatureFlagsModule } from '@flagpole/client-angular';

@NgModule({
  imports: [
    FeatureFlagsModule.forRoot({
      apiKey: 'fp_live_your_key',
      environment: 'development'
    })
  ]
})
export class AppModule { }
```

## Usage in Components

```
import { FeatureFlagsService } from '@flagpole/client-angular';

@Component({
  selector: 'app-my-component',
  template: `
    <div *ngIf="isNewFeatureEnabled$ | async">
      New Feature is Enabled
    </div>
  `
})
export class MyComponent {
  isNewFeatureEnabled$ = this.featureFlags.isEnabled('newFeature');
  allFlags$ = this.featureFlags.getAllFlags();

  constructor(private featureFlags: FeatureFlagsService) {}
}
```
