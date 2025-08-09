# Feature Flags Analytics

This document describes the analytics implementation for tracking feature flag usage and scope analytics.

## Overview

The analytics system tracks feature flag usage when clients retrieve flags through the public endpoint. It provides insights into:

- Top 10 most called scopes
- Individual scope analytics
- Usage statistics over time

## Database Schema

### FeatureFlagUsage
Tracks scope-level requests (one entry per scope request):
- `flagKey`: The feature flag key (optional, null for scope-level tracking)
- `platformKey`: Platform identifier
- `environmentKey`: Environment identifier
- `scopeSlug`: Scope identifier
- `enabled`: Whether the scope request was successful
- `requestedAt`: Timestamp of the request
- `userAgent`: Client user agent (optional)
- `ipAddress`: Client IP address (optional)
- `clientId`: Client identifier (optional)

### ScopeAnalytics
Aggregated analytics per scope:
- `scopeSlug`: Unique scope identifier
- `scopeName`: Human-readable scope name
- `totalRequests`: Total number of requests for this scope
- `lastUpdated`: Last update timestamp

## API Endpoints

### Public Feature Flags Endpoint
```
GET /feature-flags/{environmentKey}/{platformKey}/{scopeSlug}
```

This endpoint:
1. Retrieves feature flags for the specified platform/environment/scope
2. Returns flags as a JSON object: `{ "flag-key": true/false }`
3. Asynchronously tracks scope-level analytics (one entry per scope request)

### Analytics Endpoints (Protected)
```
GET /analytics/scopes/top?limit=10
GET /analytics/scopes/{scopeSlug}
GET /analytics/scopes/{scopeSlug}/stats?days=30
```

## Implementation Details

### Async Analytics Tracking
Analytics tracking is performed asynchronously to avoid impacting feature flag response times:

1. Client requests feature flags for a specific scope
2. Flags are retrieved from cache or database
3. Response is sent immediately
4. Scope-level analytics tracking happens in the background (one entry per scope request)

### Caching
Feature flags are cached using the existing cache service to improve performance.

### Error Handling
Analytics tracking errors are logged but don't affect the main feature flag request.

## Usage Examples

### Client-Side Usage
```javascript
// Fetch feature flags
const flags = await fetch('/feature-flags/production/web/user-experience');

// Use flags in your application
if (flags['new-ui-feature']) {
  // Enable new UI
}
```

### Viewing Analytics
The dashboard displays the top 10 most called scopes with request counts and last updated timestamps.

## Testing

Use the provided test script to simulate client requests:

```bash
node test-client.js
```

Make sure to update the API_BASE_URL and test parameters to match your setup.

## Performance Considerations

- Analytics tracking is asynchronous and non-blocking
- Database indexes are optimized for analytics queries
- Caching reduces database load for feature flag retrieval
- Analytics data is aggregated to minimize storage requirements
