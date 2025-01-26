---
id: nodejs
title: Node.js SDK
---

# Node.js SDK Integration

## Installation

```bash
npm install @your-org/feature-flags-node

import { FeatureFlags } from '@your-org/feature-flags-node';

const featureFlags = new FeatureFlags({
  apiKey: 'your-api-key'
});

if (await featureFlags.isEnabled('my-feature')) {
  // New feature code
} else {
  // Old feature code
}
```
