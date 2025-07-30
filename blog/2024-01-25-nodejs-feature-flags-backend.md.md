---
slug: nodejs-feature-flags-backend-guide
title: Server-Side Feature Flags with Node.js - Complete Backend Implementation Guide
authors: [vitor]
tags: [nodejs, backend, server-side, express, api, microservices, feature-flags]
---

# Server-Side Feature Flags with Node.js - Complete Backend Implementation Guide

**Node.js** backend applications require robust feature management for APIs, microservices, and server-side logic. Feature flags provide the perfect solution for controlling backend functionality, managing database migrations, and enabling safe deployments in **Node.js** environments.

## Why Node.js Backends Need Feature Flags

**Node.js** applications power millions of APIs and microservices worldwide. Feature flags in **Node.js** enable:

- **Zero-downtime deployments** of new API endpoints
- **Database migration safety** with gradual rollouts
- **API versioning** without maintaining multiple codebases
- **Kill switches** for problematic features
- **A/B testing** at the API level

```javascript
const { FlagpoleClient } = require("@flagpole/node");

const client = new FlagpoleClient({
  apiKey: "fp_live_your_api_key",
  environments: ["production"],
  fallbacks: {
    "new-payment-gateway": false,
    "enhanced-analytics": false,
  },
});

await client.initialize();

// Safe feature rollout
if (await client.isFeatureEnabled("new-payment-gateway")) {
  return await processPaymentV2(paymentData);
} else {
  return await processPaymentV1(paymentData);
}
```

<!-- truncate -->

## Setting Up Feature Flags in Node.js

### Installation

```bash
npm install @flagpole/node socket.io-client
# or
yarn add @flagpole/node socket.io-client
```

### Basic Client Setup

```javascript
// config/flagpole.js
const { FlagpoleClient } = require("@flagpole/node");

const flagpoleClient = new FlagpoleClient({
  apiKey: process.env.FLAGPOLE_API_KEY,
  environments: [process.env.NODE_ENV || "development"],
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
  },
  fallbacks: {
    "database-migration-v2": false,
    "new-user-endpoint": false,
    "enhanced-logging": true,
  },
  timeout: 5000,
  retries: 3,
});

module.exports = flagpoleClient;
```

### Application Initialization

```javascript
// app.js
const express = require("express");
const flagpoleClient = require("./config/flagpole");

const app = express();

async function startServer() {
  try {
    // Initialize feature flags before starting server
    await flagpoleClient.initialize();
    console.log("Feature flags initialized successfully");

    // Setup routes and middleware
    setupRoutes(app);

    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  } catch (error) {
    console.error("Failed to initialize feature flags:", error);
    // Decide whether to continue with fallbacks or exit
    process.exit(1);
  }
}

startServer();
```

## Express.js Integration

### Middleware Setup

```javascript
const { flagpoleMiddleware,
```
