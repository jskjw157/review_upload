# Phase 2.6 Implementation Guide

## Overview

This guide helps you implement edge case handling and test the OAuth 2.0 authentication flow comprehensively.

## Implementation Order

Follow this order to ensure dependencies are met:

### Phase 1: Setup Test Utilities (Optional but Recommended)

**Files:** `src/main/services/auth-test-utils.ts`

This phase is optional but highly recommended for efficient testing. Test utilities allow you to simulate edge cases without manual file manipulation.

**When to do:**
- Do this FIRST if you want to automate edge case testing
- Skip if you prefer manual testing only

**Steps:**
1. Test utilities are already created
2. Optionally expose via IPC for development (see comments in file)
3. Add to `.gitignore` or remove before production build

### Phase 2: Enhanced Error Handling (Core Implementation)

**Priority: HIGH - Must be done**

#### 2a. oauth-server.ts Edge Case Handling

**What was enhanced:**
- State validation with 10 edge cases covered
- Server error handling (port conflicts, permissions)
- Detailed console logging for debugging

**Verify:**
```bash
# Check that enhanced validateState() function exists
grep -A 20 "EDGE CASES HANDLED" src/main/services/oauth-server.ts
```

**Test after implementation:**
- Run Test Scenario 4: State Parameter Validation (see auth-flow-testing.md)
- Run Edge Case Test 6: Port Already in Use

#### 2b. auth.ts Token Management

**What was enhanced:**
- `readTokenFile()`: 10 edge cases (corrupted file, decryption failure, etc.)
- `exchangeAuthCode()`: 5 edge cases (network errors, invalid codes)
- `refreshAccessToken()`: 8 edge cases (expired refresh tokens, network errors)

**Verify:**
```bash
# Check enhanced functions exist
grep -A 5 "EDGE CASES HANDLED" src/main/services/auth.ts
```

**Test after implementation:**
- Run Test Scenario 2: App Restart with Stored Tokens
- Run Test Scenario 3: Token Expiration and Auto-Refresh
- Run Test Scenario 4: Refresh Token Expiration
- Run Edge Case Test 3: Corrupted Token File

#### 2c. useAuth.ts User Feedback

**What was enhanced:**
- `login()`: Detailed error messages based on errorCode
- `restoreAuthState()`: Clear logging for debugging

**Verify:**
```bash
# Check enhanced login function
grep -A 10 "USER FEEDBACK" src/renderer/hooks/useAuth.ts
```

**Test after implementation:**
- Run all Test Scenarios from auth-flow-testing.md
- Verify UI shows clear, actionable error messages

### Phase 3: Manual Testing

**Priority: HIGH - Required before production**

**Location:** `tests/manual/auth-flow-testing.md`

**Test in this order:**
1. Test Scenario 1: Initial Login (Happy Path) - Verify basic flow works
2. Test Scenario 2: App Restart - Verify token restoration
3. Test Scenario 3: Token Expiration - Verify auto-refresh
4. Test Scenario 4: Refresh Token Expiration - Verify re-login prompt
5. Edge Case Tests 1-7 - Verify all edge cases are handled gracefully

**Success Criteria:**
- All test scenarios pass
- No uncaught exceptions
- Clear error messages for all failure modes
- App remains stable after any error

## Implementation Checklist

### Setup Phase

- [x] Test utilities created (`src/main/services/auth-test-utils.ts`)
- [ ] Test utilities exposed via IPC (optional, for automated testing)
- [ ] Environment variables configured (`.env` file)
- [ ] Cafe24 app registered with valid Client ID/Secret

### Core Implementation

- [x] Enhanced `validateState()` in `oauth-server.ts`
- [x] Enhanced server error handling in `oauth-server.ts`
- [x] Enhanced `readTokenFile()` in `auth.ts`
- [x] Enhanced `exchangeAuthCode()` in `auth.ts`
- [x] Enhanced `refreshAccessToken()` in `auth.ts`
- [x] Enhanced `login()` in `useAuth.ts`
- [x] Enhanced `restoreAuthState()` in `useAuth.ts`

### Testing Phase

- [ ] Manual test checklist completed (see `auth-flow-testing.md`)
- [ ] All happy path scenarios pass
- [ ] All edge case scenarios handled gracefully
- [ ] Error messages are clear and actionable
- [ ] Console logs reviewed for debugging information

### Documentation

- [x] Manual testing guide created (`auth-flow-testing.md`)
- [x] Implementation guide created (this file)
- [x] Test utilities documented (`auth-test-utils.ts`)
- [ ] Issues/bugs discovered during testing documented

## How to Test Each Enhancement

### Testing State Validation

**File:** `src/main/services/oauth-server.ts`

**Test cases:**
1. Missing state parameter → Should reject with security warning
2. State length mismatch → Should reject immediately
3. State content mismatch → Should use timing-safe comparison
4. State expiration (> 10 minutes) → Should reject with age info
5. State reuse (replay attack) → Should reject (one-time use)

**How to test:**
- Use test utilities to manipulate callback URLs
- Check console for detailed security warnings
- Verify timing-safe comparison is used

### Testing Token File Reading

**File:** `src/main/services/auth.ts` - `readTokenFile()`

**Test cases:**
1. File doesn't exist → Silent failure, returns null
2. Empty file → Returns null with warning
3. Invalid JSON → Returns null with clear error
4. Missing required fields → Returns null with field list
5. Invalid field types → Returns null with type errors
6. Decryption failure → Returns null with detailed cause
7. Future timestamp → Warning but continues
8. Permission denied → Clear error with file path

**How to test:**
```bash
# Use test utilities (if IPC exposed)
await window.testUtils.corruptTokenFile()
await window.testUtils.expireAccessToken()

# OR manually edit token file
nano ~/Library/Application\ Support/review_upload/cafe24-oauth.json
```

### Testing Token Exchange

**File:** `src/main/services/auth.ts` - `exchangeAuthCode()`

**Test cases:**
1. HTTP 400 (bad request) → Clear message about invalid code
2. HTTP 401 (unauthorized) → Message about wrong credentials
3. HTTP 5xx (server error) → Message about Cafe24 issues
4. Malformed JSON response → Clear parsing error
5. Missing access_token → Clear field missing error
6. Network errors (DNS, timeout, connection refused) → Specific guidance

**How to test:**
- Disconnect network during token exchange
- Use expired authorization code
- Use wrong Client ID/Secret
- Check console for detailed error messages

### Testing Token Refresh

**File:** `src/main/services/auth.ts` - `refreshAccessToken()`

**Test cases:**
1. No stored refresh token → Clear re-login message
2. HTTP 400/401 (expired/revoked) → Re-authentication required
3. HTTP 5xx (server error) → Retry guidance
4. Malformed response → Parsing error
5. Missing access_token → Field missing error
6. Network errors → Specific guidance
7. Token save failure → Storage error with retry prompt

**How to test:**
```bash
# Expire access token to trigger refresh
await window.testUtils.expireAccessToken()

# Invalidate refresh token to test failure
await window.testUtils.invalidateRefreshToken()
```

### Testing User Feedback

**File:** `src/renderer/hooks/useAuth.ts`

**Test cases:**
1. Missing env variables → Lists specific variables needed
2. Timeout error → Clear retry instructions
3. State mismatch → Security message with explanation
4. Network error → Check connection guidance
5. Auth error → Check credentials guidance

**How to test:**
- Unset environment variables
- Let OAuth flow timeout (5 minutes)
- Tamper with state parameter
- Disconnect network during flow
- Use wrong Client ID

**Verify:**
- UI shows clear, user-friendly messages
- Technical details are in console logs
- Users know what action to take next

## Debugging Tips

### Console Log Prefixes

All auth-related logs use consistent prefixes:

- `[auth]` - Main auth service operations
- `[oauth]` - OAuth server and flow operations
- `[useAuth]` - React hook operations
- `[test-utils]` - Test utility operations

### Key Log Messages

**Success flow:**
```
[auth] Initiating OAuth flow for {mallId}
[oauth] State generated and stored: {state}...
[oauth] Callback server started on http://localhost:3000/callback
[oauth] State validation successful
[auth] Token exchange successful. Expires at: {timestamp}
[useAuth] Tokens restored successfully from disk
```

**Failure flow:**
```
[oauth] Callback validation failed: state mismatch
[auth] Refresh token is invalid, expired, or revoked
[auth] Failed to decrypt refresh token: ...
[useAuth] Login failed: { errorCode: '...', message: '...' }
```

### Common Issues and Solutions

#### Issue: "State validation failed: no stored state found"

**Causes:**
- App restarted during OAuth flow
- Multiple OAuth flows running simultaneously
- State already used (one-time token)

**Solution:**
- Restart OAuth flow
- Ensure only one login attempt at a time
- Check for app crashes during flow

#### Issue: "Failed to decrypt refresh token"

**Causes:**
- OS keychain changed (password reset, system migration)
- Token encrypted on different machine
- Corrupted encrypted data

**Solution:**
- Delete token file and re-login
- Check if safeStorage is available
- Consider using unencrypted tokens (less secure)

#### Issue: "Port 3000 is already in use"

**Causes:**
- Another app using port 3000
- Previous OAuth server didn't shut down
- Multiple OAuth flows started

**Solution:**
- Change redirect URI to use different port
- Kill process on port 3000: `lsof -ti:3000 | xargs kill -9`
- Wait a moment and retry

#### Issue: Token refresh always fails

**Causes:**
- Refresh token expired (30+ days)
- App revoked in Cafe24 admin panel
- Cafe24 API changes

**Solution:**
- Re-authenticate (click login button)
- Check app status in Cafe24 partner center
- Verify API endpoint URLs

## Security Considerations

### Critical Security Measures Implemented

1. **CSRF Protection**
   - State parameter with timing-safe comparison
   - One-time use (state cleared after validation)
   - 10-minute expiration window

2. **Timing Attack Prevention**
   - `crypto.timingSafeEqual()` for state comparison
   - No early returns that reveal information

3. **Token Encryption**
   - Refresh tokens encrypted with `safeStorage` when available
   - Fallback to plaintext if encryption unavailable
   - Clear logging when encryption not used

4. **Token Storage**
   - Stored in app.getPath('userData') (per-user, not shared)
   - File permissions should restrict to current user
   - No tokens in localStorage (XSS protection)

5. **Error Message Safety**
   - Don't expose sensitive details to UI
   - Technical details only in console logs
   - User-friendly, actionable messages

### Security Testing Checklist

- [ ] State parameter cannot be reused (Test Scenario 4)
- [ ] State parameter expires after 10 minutes
- [ ] Timing attack on state comparison is prevented (code review)
- [ ] Refresh tokens are encrypted (check token file)
- [ ] Token file has correct permissions (not world-readable)
- [ ] Error messages don't expose tokens or secrets
- [ ] HTTPS is used for all Cafe24 API calls
- [ ] No tokens logged to console in production

## Performance Considerations

### Expected Timings

- OAuth flow start to browser open: < 1 second
- Token exchange after authorization: < 2 seconds
- Token file read/write: < 500ms
- Token refresh: < 2 seconds
- App startup to token restoration: < 500ms

### Performance Testing

Run the performance tests in `auth-flow-testing.md`:
- Test 1: OAuth Flow Completion Time
- Test 2: Token Restoration Time

If timings are slower than expected:
- Check network latency to Cafe24 API
- Check disk I/O speed (token file reads)
- Check for blocking operations in main process
- Consider adding timeout to fetch calls

## Next Steps After Testing

Once all tests pass:

1. **Mark Phase 2.6 as complete** in `tasks.md`:
   ```markdown
   - [x] 인증 플로우 테스트
     - [x] 수동 테스트 (모든 시나리오 통과)
     - [x] 엣지 케이스 처리 (네트워크 오류, 토큰 만료 등)
   ```

2. **Document any issues found**:
   - Create GitHub issues for bugs
   - Add TODOs for improvements
   - Update CLAUDE.md if patterns changed

3. **Remove test utilities** (if not needed for automated testing):
   ```bash
   # Remove test utilities from production build
   rm src/main/services/auth-test-utils.ts
   # Or add to .gitignore if keeping for development
   ```

4. **Move to Phase 3**: Review Registration Feature
   - Auth is now complete and tested
   - Ready to build on top of it

5. **Consider automated testing** (optional):
   - Set up Jest/Vitest for unit tests
   - Mock IPC for testing hooks
   - Add CI/CD pipeline for regression testing

## Resources

- **Main Testing Guide**: `tests/manual/auth-flow-testing.md`
- **Test Utilities**: `src/main/services/auth-test-utils.ts`
- **Cafe24 OAuth Docs**: https://developers.cafe24.com/docs/api/admin/#oauth-2-0
- **Electron Security**: https://www.electronjs.org/docs/latest/tutorial/security
- **OAuth 2.0 Security**: https://tools.ietf.org/html/rfc6749#section-10

## Conclusion

You now have:
- Comprehensive edge case handling for all auth scenarios
- Detailed manual test procedures
- Test utilities for simulating failures
- Clear user feedback for all error conditions
- Security best practices implemented

Follow the implementation checklist and testing guide to complete Phase 2.6!
