---
name: check-auth
description: Diagnose OAuth authentication issues and verify token status. Use when login fails or API calls return 401.
model: haiku
---

Diagnose OAuth authentication problems in the Cafe24 integration.

## Diagnostic Checks

### 1. Token file inspection

- Check if token file exists at `app.getPath('userData')/cafe24-oauth.json`
- On macOS: `~/Library/Application Support/review_upload/cafe24-oauth.json`
- Read and parse the token file (if exists)
- Verify structure: accessToken, refreshToken (encrypted?), expiresAt, issuedAt

### 2. Token expiry check

- Compare `expiresAt` timestamp with current time
- Check if within 60-second skew window (used by `isTokenExpired()`)
- Calculate remaining validity time

### 3. OAuth configuration verification

- Check if `OAuthConfig` is properly set:
  - mallId (e.g., 'myshop')
  - clientId
  - clientSecret
  - redirectUri
- Verify these match Cafe24 partner center settings
- Note: Don't show secrets in output, just confirm presence

### 4. Token encryption status

- Check if `encrypted: true` in token file
- Verify `safeStorage.isEncryptionAvailable()` matches
- If mismatch, explain potential issues

### 5. Service function review

- Verify `src/main/services/auth.ts` has:
  - `exchangeAuthCode()`
  - `refreshAccessToken()`
  - `getValidAccessToken()`
  - `loadStoredTokens()`
- Check for any obvious errors in implementation

### 6. IPC channel verification

- Confirm IPC handlers registered in main.ts:
  - `auth:exchange`
  - `auth:refresh`
  - `auth:load`
- Verify preload.ts exposes these functions

## Common Issues Checklist

- [ ] Token file missing → Need to login
- [ ] Token expired but refresh token valid → Should auto-refresh
- [ ] Refresh token expired → Need to re-login
- [ ] OAuth config missing → Need to set Mall ID, Client ID/Secret
- [ ] Token file corrupted → Delete and re-login
- [ ] Encryption mismatch → May need to re-generate tokens

## Output

After diagnosis:
- Provide clear summary of auth status
- List specific issues found
- Recommend concrete steps to fix
- Show example commands if needed (e.g., delete token file)

If tokens are valid:
- Confirm authentication is working
- Show token expiry time
- Suggest testing an API call
