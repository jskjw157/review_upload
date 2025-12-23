# Phase 2.6: Authentication Flow Manual Testing Guide

This document provides step-by-step instructions for manually testing the OAuth 2.0 authentication flow and validating edge case handling.

## Prerequisites

Before testing, ensure:
- [ ] Cafe24 app is registered with valid Client ID/Secret
- [ ] Environment variables are set in `.env` file:
  ```
  VITE_CAFE24_MALL_ID=your_mall_id
  VITE_CAFE24_CLIENT_ID=your_client_id
  VITE_CAFE24_CLIENT_SECRET=your_client_secret
  VITE_CAFE24_REDIRECT_URI=http://localhost:3000/callback
  ```
- [ ] App is running in development mode (`npm run dev`)
- [ ] DevTools are open for console monitoring

---

## Test Scenario 1: Initial Login (Happy Path)

**Purpose:** Verify complete OAuth flow works end-to-end with no errors.

### Steps:

1. **Start fresh**
   - Delete token file: `rm ~/Library/Application\ Support/review_upload/cafe24-oauth.json` (macOS)
   - Or: `del %APPDATA%\review_upload\cafe24-oauth.json` (Windows)
   - Restart the app

2. **Click "로그인" button**
   - Expected: Status message changes to "브라우저 열기 중…"
   - Expected: Browser opens to Cafe24 authorization page

3. **Authorize in browser**
   - Log in to Cafe24 (if not already logged in)
   - Click "권한 승인" (Approve permissions)
   - Expected: Browser redirects to `http://localhost:3000/callback?code=...&state=...`

4. **Verify callback response**
   - Expected: Browser shows green success page: "✓ 성공 - Authentication successful!"
   - Expected: Page auto-closes after 3 seconds
   - Expected: App status changes to "로그인 완료!"

5. **Verify token storage**
   - Check token file exists: `cat ~/Library/Application\ Support/review_upload/cafe24-oauth.json`
   - Expected: JSON file with `accessToken`, `refreshToken` (encrypted), `expiresAt`, `issuedAt`
   - Expected: `encrypted: true` if `safeStorage` is available

6. **Verify console logs**
   - Expected logs (in order):
     ```
     [auth] Initiating OAuth flow for {mallId}
     [oauth] State generated and stored: {state}...
     [oauth] Authorization URL built: https://...
     [oauth] Callback server started on http://localhost:3000/callback
     [auth] Opening browser to authorization URL
     [auth] Waiting for authorization code from callback server
     [oauth] Callback received on /callback
     [oauth] State validation successful
     [oauth] Authorization successful. Code: {code}...
     [auth] Exchanging authorization code for tokens
     [auth] OAuth flow completed successfully
     ```

### Success Criteria:
- [ ] Browser opens without errors
- [ ] User sees Cafe24 authorization page
- [ ] Callback server receives code and state
- [ ] State validation passes
- [ ] Token exchange succeeds
- [ ] Tokens are saved to disk (with encryption if available)
- [ ] UI updates to "로그인 완료!"
- [ ] No errors in console

---

## Test Scenario 2: App Restart with Stored Tokens

**Purpose:** Verify tokens are restored from disk on app restart.

### Steps:

1. **Complete Test Scenario 1 first**
   - Ensure tokens are saved and app shows "로그인 완료!"

2. **Restart the app**
   - Quit the app (`Cmd+Q` on macOS, `Alt+F4` on Windows)
   - Start again: `npm run dev`

3. **Wait for app to load**
   - Expected: `useAuth` hook calls `restoreAuthState()` on mount
   - Expected: App reads token file automatically

4. **Verify UI state**
   - Expected: Status message shows "로그인 완료 (저장된 토큰)"
   - Expected: "로그인" button is hidden or disabled
   - Expected: User can immediately submit reviews

5. **Verify console logs**
   - Expected logs:
     ```
     [auth] Failed to read token file (if no file exists)
     OR
     Token restoration successful (if file exists)
     ```

### Success Criteria:
- [ ] Tokens are loaded from disk automatically
- [ ] No re-authentication required
- [ ] UI reflects logged-in state immediately
- [ ] User can proceed to submit reviews

---

## Test Scenario 3: Token Expiration and Auto-Refresh

**Purpose:** Verify expired access tokens are automatically refreshed before API calls.

### Setup:

You need to simulate an expired token. Two methods:

**Method A: Wait for natural expiration**
- Tokens typically expire in 2 hours (depends on Cafe24 config)
- Complete Scenario 1, wait 2+ hours, then proceed

**Method B: Manually edit token file (faster)**
1. Complete Scenario 1
2. Edit token file:
   ```bash
   nano ~/Library/Application\ Support/review_upload/cafe24-oauth.json
   ```
3. Change `expiresAt` to a past timestamp:
   ```json
   {
     "expiresAt": 1609459200000,  // Some date in 2021
     ...
   }
   ```
4. Save and restart app

### Steps:

1. **Ensure token is expired**
   - Check `expiresAt` < current time

2. **Attempt to submit a review**
   - Fill out review form
   - Click "제출" button

3. **Observe token refresh**
   - Expected: `getValidAccessToken()` detects expiration
   - Expected: `refreshAccessToken()` is called automatically
   - Expected: New access token is fetched using refresh token
   - Expected: New tokens are saved to disk
   - Expected: Review submission proceeds with new token

4. **Verify console logs**
   - Expected logs:
     ```
     [auth] Token expired, refreshing...
     [auth] refreshAccessToken called
     [auth] Token refresh successful
     Review submission successful
     ```

5. **Check updated token file**
   - Expected: `expiresAt` is now in the future (2 hours from now)
   - Expected: `issuedAt` is updated to current time

### Success Criteria:
- [ ] Expired token is detected
- [ ] Refresh happens automatically (no user intervention)
- [ ] New tokens are saved
- [ ] API call proceeds successfully
- [ ] User sees no errors (transparent refresh)

---

## Test Scenario 4: Refresh Token Expiration (Requires Re-login)

**Purpose:** Verify app handles refresh token expiration gracefully and prompts re-authentication.

### Setup:

Refresh tokens typically expire after 30 days or when revoked in Cafe24 admin panel.

**Simulation method:**
1. Complete Scenario 1
2. Edit token file to use an invalid refresh token:
   ```json
   {
     "refreshToken": "invalid_refresh_token_12345",
     "encrypted": false,
     ...
   }
   ```
3. Set `expiresAt` to past time to force refresh attempt

### Steps:

1. **Attempt to submit a review**
   - Fill out review form
   - Click "제출"

2. **Observe refresh failure**
   - Expected: `refreshAccessToken()` is called
   - Expected: Cafe24 API returns 401 or 400 error
   - Expected: `reason: 'refresh_failed'` in AuthResult

3. **Verify user feedback**
   - Expected: UI shows error message: "토큰이 만료되어 로그아웃되었습니다. 다시 로그인하세요."
   - Expected: Status changes to "로그아웃 상태"
   - Expected: "로그인" button is enabled

4. **Re-login**
   - Click "로그인" button
   - Complete OAuth flow again
   - Expected: New tokens replace old ones

### Success Criteria:
- [ ] Refresh failure is detected
- [ ] Clear error message shown to user
- [ ] User is logged out gracefully
- [ ] Re-login flow works normally
- [ ] No app crashes or unhandled errors

---

## Edge Case Test 1: Network Error During Token Exchange

**Purpose:** Ensure app handles network failures gracefully.

### Simulation:

1. **Start OAuth flow**
   - Click "로그인"
   - Browser opens

2. **Disconnect network before authorization**
   - Turn off Wi-Fi
   - Or use firewall to block app

3. **Complete authorization in browser**
   - Approve permissions in Cafe24
   - Browser shows callback success page

4. **Token exchange fails**
   - Expected: `exchangeAuthCode()` fetch fails
   - Expected: Error caught and returned as `reason: 'network_error'`

5. **Verify user feedback**
   - Expected: Status message: "네트워크 오류로 코드 교환에 실패했습니다."
   - Expected: User remains logged out
   - Expected: Can retry by clicking "로그인" again

6. **Reconnect and retry**
   - Turn Wi-Fi back on
   - Click "로그인" again
   - Expected: Flow completes successfully

### Success Criteria:
- [ ] Network error is caught (not uncaught exception)
- [ ] Clear error message displayed
- [ ] App remains functional
- [ ] Retry works after network restoration

---

## Edge Case Test 2: Invalid Authorization Code

**Purpose:** Verify handling of expired or tampered authorization codes.

### Simulation:

1. **Intercept callback URL**
   - Start OAuth flow
   - When browser redirects to `http://localhost:3000/callback?code=XXX&state=YYY`
   - Copy the URL
   - Close the browser window before callback completes

2. **Manually modify the code parameter**
   - Change URL to: `http://localhost:3000/callback?code=INVALID_CODE&state=YYY`
   - Open in browser

3. **Token exchange fails**
   - Expected: Cafe24 API returns 401 or 400 error
   - Expected: `reason: 'invalid_code'`

4. **Verify error handling**
   - Expected: Browser shows error page: "✗ 오류"
   - Expected: UI shows "인증 코드 교환 실패"

### Success Criteria:
- [ ] Invalid code is rejected by Cafe24
- [ ] Error is caught and handled
- [ ] User-friendly error message displayed
- [ ] App remains stable

---

## Edge Case Test 3: Corrupted Token File

**Purpose:** Verify app handles malformed or corrupted token storage.

### Simulation:

1. **Complete initial login**
   - Ensure tokens are saved

2. **Corrupt the token file**
   ```bash
   echo "{ invalid json" > ~/Library/Application\ Support/review_upload/cafe24-oauth.json
   ```

3. **Restart the app**
   - Expected: `readTokenFile()` catches JSON parse error
   - Expected: Returns `null`
   - Expected: App treats user as logged out

4. **Verify UI state**
   - Expected: Status shows "로그아웃 상태"
   - Expected: "로그인" button is enabled

5. **Login again**
   - Click "로그인"
   - Complete OAuth flow
   - Expected: New valid tokens overwrite corrupted file

### Success Criteria:
- [ ] Corrupted file doesn't crash the app
- [ ] Error is logged to console
- [ ] User can re-authenticate
- [ ] New tokens are saved correctly

---

## Edge Case Test 4: State Parameter Validation Failure (CSRF Attack Simulation)

**Purpose:** Verify CSRF protection is working.

### Simulation:

1. **Start OAuth flow**
   - Click "로그인"
   - Note the state parameter in authorization URL

2. **Intercept callback**
   - When Cafe24 redirects to `http://localhost:3000/callback?code=XXX&state=YYY`
   - Manually change state parameter: `http://localhost:3000/callback?code=XXX&state=WRONG_STATE`

3. **State validation fails**
   - Expected: `validateState()` returns false
   - Expected: Callback server rejects the request

4. **Verify security response**
   - Expected: Browser shows error: "Security validation failed. Please try again."
   - Expected: Console log: `[oauth] Callback validation failed: state mismatch`
   - Expected: Token exchange does NOT proceed

5. **Retry with correct state**
   - Start flow again
   - Let it complete naturally
   - Expected: Validation passes

### Success Criteria:
- [ ] Mismatched state is rejected
- [ ] Security error message shown
- [ ] Token exchange is prevented
- [ ] App logs security warning
- [ ] Retry with correct flow works

---

## Edge Case Test 5: Callback Timeout

**Purpose:** Verify app handles user abandoning OAuth flow.

### Simulation:

1. **Start OAuth flow**
   - Click "로그인"
   - Browser opens to Cafe24 authorization page

2. **Wait without authorizing**
   - Do NOT click "권한 승인"
   - Do NOT close browser
   - Wait for 5 minutes

3. **Timeout occurs**
   - Expected: `startCallbackServer()` timeout triggers after 5 minutes
   - Expected: Server closes automatically
   - Expected: Promise resolves with `error: 'timeout'`

4. **Verify timeout handling**
   - Expected: Console log: `[oauth] Callback server timeout after 5 minutes`
   - Expected: UI shows error: "Authorization request timed out. Please try again."
   - Expected: Status changes to "로그아웃 상태"

5. **Retry**
   - Click "로그인" again
   - Complete flow within timeout
   - Expected: Works normally

### Success Criteria:
- [ ] Timeout occurs after 5 minutes
- [ ] Server shuts down gracefully
- [ ] Clear timeout message shown
- [ ] App remains functional
- [ ] Retry works

---

## Edge Case Test 6: Port Already in Use (Callback Server)

**Purpose:** Verify error handling when port 3000 is occupied.

### Simulation:

1. **Start another server on port 3000**
   ```bash
   python3 -m http.server 3000
   ```

2. **Attempt to login**
   - Click "로그인"
   - Expected: `startCallbackServer()` fails to bind port 3000

3. **Verify error handling**
   - Expected: `server.on('error')` catches `EADDRINUSE` error
   - Expected: UI shows error: "Failed to start callback server"

4. **Fix and retry**
   - Stop the Python server (`Ctrl+C`)
   - Click "로그인" again
   - Expected: Works normally

### Success Criteria:
- [ ] Port conflict is detected
- [ ] Clear error message shown
- [ ] App doesn't crash
- [ ] Retry works after port is freed

---

## Edge Case Test 7: User Denies Authorization

**Purpose:** Verify handling of user canceling OAuth flow.

### Simulation:

1. **Start OAuth flow**
   - Click "로그인"
   - Browser opens

2. **Deny permissions**
   - On Cafe24 authorization page, click "취소" or "거부" (Deny)
   - Expected: Cafe24 redirects to `http://localhost:3000/callback?error=access_denied&error_description=...`

3. **Error is handled**
   - Expected: Callback server detects `error` parameter
   - Expected: Browser shows error page: "Authorization failed: User denied access"
   - Expected: UI shows error message

4. **Verify console logs**
   - Expected: `[oauth] Cafe24 returned error: access_denied`

### Success Criteria:
- [ ] Error parameter is detected
- [ ] User-friendly error message shown
- [ ] App remains functional
- [ ] User can retry

---

## Security Validation Tests

### Test 1: Timing Attack on State Validation

**Purpose:** Verify constant-time comparison prevents timing attacks.

**Check in code:**
```typescript
// src/main/services/oauth-server.ts:95-98
const isStateValid = crypto.timingSafeEqual(
  Buffer.from(receivedState),
  Buffer.from(currentState.state)
)
```

**Validation:**
- [ ] `timingSafeEqual()` is used (not `===`)
- [ ] Buffer lengths are equal (padded if needed)

### Test 2: State Expiration (10-minute window)

**Purpose:** Verify old state tokens are rejected.

**Simulation:**
1. Start OAuth flow
2. Wait 11 minutes
3. Complete authorization
4. Expected: State validation fails with "state expired"

**Validation:**
- [ ] State expires after 10 minutes
- [ ] Expired state is rejected
- [ ] User must restart flow

### Test 3: Token Encryption with safeStorage

**Purpose:** Verify refresh tokens are encrypted on disk (when available).

**Check:**
1. Complete initial login
2. Open token file
3. If `encrypted: true`, refresh token should be base64-encoded
4. Decode to verify it's not plaintext

**Validation:**
- [ ] `safeStorage.isEncryptionAvailable()` is checked
- [ ] Refresh token is encrypted if available
- [ ] Decryption works on app restart

---

## Performance Tests

### Test 1: OAuth Flow Completion Time

**Measure:**
- Time from clicking "로그인" to seeing "로그인 완료!"

**Expected:**
- Total: < 10 seconds (with fast network)
- Browser open: < 1 second
- Cafe24 authorization: 2-5 seconds (user interaction)
- Token exchange: < 2 seconds
- Token save: < 500ms

### Test 2: Token Restoration Time

**Measure:**
- Time from app launch to "로그인 완료 (저장된 토큰)"

**Expected:**
- < 500ms (reading and decrypting token file)

---

## Test Results Summary

| Test Scenario | Status | Notes |
|---------------|--------|-------|
| Initial Login (Happy Path) | ⬜ | |
| App Restart with Tokens | ⬜ | |
| Token Expiration & Refresh | ⬜ | |
| Refresh Token Expiration | ⬜ | |
| Network Error | ⬜ | |
| Invalid Auth Code | ⬜ | |
| Corrupted Token File | ⬜ | |
| State Validation Failure | ⬜ | |
| Callback Timeout | ⬜ | |
| Port Already in Use | ⬜ | |
| User Denies Authorization | ⬜ | |
| Security: Timing Attack Prevention | ⬜ | |
| Security: State Expiration | ⬜ | |
| Security: Token Encryption | ⬜ | |
| Performance: OAuth Flow | ⬜ | ___ seconds |
| Performance: Token Restoration | ⬜ | ___ milliseconds |

---

## Troubleshooting Common Issues

### Issue: Browser doesn't open
**Cause:** `shell.openExternal()` failed
**Fix:** Check system permissions, ensure default browser is set

### Issue: Callback server never receives code
**Cause:** Firewall blocking localhost:3000
**Fix:** Allow Node.js through firewall, check antivirus settings

### Issue: State validation always fails
**Cause:** State store being cleared prematurely
**Fix:** Check if multiple OAuth flows are running simultaneously

### Issue: Token refresh always fails
**Cause:** Refresh token expired or revoked
**Fix:** Re-authenticate, check Cafe24 admin panel for app status

---

## Next Steps After Manual Testing

Once all tests pass:
- [ ] Document any failures or unexpected behavior
- [ ] Implement automated tests for critical flows
- [ ] Update error messages based on user feedback
- [ ] Add retry logic for transient network errors
- [ ] Implement rate limiting for repeated failures
- [ ] Consider adding telemetry/logging for production debugging
