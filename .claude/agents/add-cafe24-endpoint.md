---
name: add-cafe24-endpoint
description: Add a new Cafe24 API endpoint integration with OAuth and error handling. Use when integrating new Cafe24 API calls.
model: sonnet
---

Add a new Cafe24 API endpoint integration following project patterns.

## Your Process

### 1. Create or update service in src/main/services/

- Add new function in appropriate service file (auth.ts or review.ts)
- Use `getValidAccessToken(config)` to ensure valid token
- Build endpoint URL: `https://${mallId}.cafe24api.com/api/v2/admin/...`
- Use proper headers:

```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`
}
```

### 2. Implement 401 retry pattern

- If response status is 401, call `refreshAccessToken(config)`
- If refresh succeeds, retry the API call ONCE with new token
- If refresh fails, return `{ success: false, needsReauth: true }`

### 3. Return standardized response

```typescript
interface ServiceResponse {
  success: boolean
  message: string
  data?: any  // Specific to endpoint
  needsReauth?: boolean
  errorCode?: string
}
```

### 4. Error handling

- Parse Cafe24 error format: `{ error, error_description }`
- Handle network errors (try/catch)
- Map to user-friendly Korean messages
- Log errors with `console.error('[service-name]', ...)`

### 5. Rate limiting awareness

- Document that endpoint is subject to 5 req/sec limit
- Consider adding queue logic if needed

### 6. Create IPC channel (if needed)

- Use the add-ipc-channel agent or follow that pattern

## User Interaction

Before starting, ask the user:
- Cafe24 API endpoint path (e.g., `/admin/products/{id}`)
- HTTP method (GET, POST, PUT, DELETE)
- Request payload structure
- Expected response structure
- Service file to add to (auth.ts, review.ts, or new file)

## Output

After implementation:
- Show example API request/response
- Document any special requirements
- Update tasks.md if relevant
- Suggest testing steps
