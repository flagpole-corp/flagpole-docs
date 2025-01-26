---
id: react
title: React SDK
---

# React SDK Integration

## Installation

```bash
npm install @your-org/feature-flags-react

import { useFeatureFlag } from '@your-org/feature-flags-react';

function MyComponent() {
  const { isEnabled } = useFeatureFlag('my-feature');

  return isEnabled ? <NewFeature /> : <OldFeature />;
}

```
