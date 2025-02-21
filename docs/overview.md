---
slug: /
title: Overview
sidebar_position: 1
---

# Welcome to FlagPole Docs

Flagpole is a powerful, developer-friendly feature flag management system that makes feature rollouts, A/B testing, and real-time updates a breeze. It's designed to solve the common challenges of feature management while keeping your git history clean and your deployment process smooth.

## Overview

Flagpole provides a comprehensive feature flag management solution that includes:

- Real-time feature flag updates
- A/B testing capabilities
- Timezone-based rollouts
- Simple SDK integration
- Affordable pricing for teams of all sizes

## Motivation

Many development teams struggle with feature rollouts, often resorting to creating multiple branches to control feature releases. This approach leads to:

- Messy git histories
- Complicated merge conflicts
- Difficult rollbacks
- Increased deployment complexity
- Poor visibility into feature status

Flagpole solves these challenges by providing a centralized, easy-to-use feature flag management system that decouples feature releases from code deployments.

## Core Features

### Targeting Rules

Flagpole provides powerful targeting capabilities through multiple condition types that can be combined using AND/OR operators:

#### Percentage Rollouts

- Gradually roll out features to a specified percentage of users
- Maintain consistent targeting for individual users
- Adjust rollout percentage in real-time

#### User Targeting

- Target by email addresses or email domains
- User ID targeting for specific users
- User type segmentation for different user categories

#### Time-based Rules

- Schedule by start and end dates
- Timezone-specific deployments
- Day of week targeting (0-6)
- Hour-based activation
- Supports all standard timezone formats

#### Geographic Rules

- Country-based targeting
- Regional targeting within countries
- Allow/deny list functionality for geographic regions

#### Device Targeting

- Browser-specific deployments
- Operating system targeting
- Version-specific rules
- Mobile device targeting

Example targeting configuration:

```typescript
interface TargetingRules {
  operator: "AND" | "OR";
  conditions: Array<{
    type: "percentage" | "user" | "time" | "geo" | "device";
    value?: number; // For percentage type
    rules?: {
      // User targeting
      email?: string[];
      emailDomain?: string[];
      userId?: string[];
      userType?: string[];

      // Time targeting
      startDate?: Date;
      endDate?: Date;
      timeZone?: string;
      daysOfWeek?: number[]; // 0-6
      hours?: number[]; // 0-23

      // Geographic targeting
      countries?: string[];
      regions?: string[];
      allowList?: boolean;

      // Device targeting
      browsers?: string[];
      os?: string[];
      versions?: string[];
      mobile?: boolean;
    };
  }>;
}
```

## Pricing

Flagpole offers competitive pricing to make feature flag management accessible to teams of all sizes:

- **Individual Contributor**: $0.99/month (annual plan)

  - Perfect for indie developers and small projects
  - Includes all core features
  - Up to 100,000 flag evaluations/month

- **Team**: Contact for pricing
  - Unlimited flag evaluations
  - Advanced targeting rules
  - Priority support
  - Custom integrations

## Coming Soon

- AI-powered feature optimization
- Enhanced analytics
- More SDK language support
- Advanced targeting rules
- Custom workflows

## Support

Need help? Our support team is available through:

- Documentation
- GitHub Issues
- Email Support
- Community Discord

Join our growing community of developers who are making feature management simpler and more efficient with Flagpole.
