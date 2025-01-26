---
id: angular
title: Angular SDK
---

# Angular SDK Integration

## Installation

```bash
npm install @your-org/feature-flags-angular

import { FeatureFlagService } from '@your-org/feature-flags-angular';

@Component({
  selector: 'app-my-component',
  template: `
    <new-feature *ngIf="isEnabled$ | async; else oldFeature">
    </new-feature>
    <ng-template #oldFeature>
      <old-feature></old-feature>
    </ng-template>
  `
})
export class MyComponent {
  isEnabled$ = this.featureFlags.isEnabled('my-feature');

  constructor(private featureFlags: FeatureFlagService) {}
}
```
