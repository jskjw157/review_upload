# Edge Case Quick Reference

Quick lookup for edge cases and their handling in the authentication flow.

## OAuth Flow Edge Cases

| Edge Case | Detection | Handling | User Message | Recovery |
|-----------|-----------|----------|--------------|----------|
| **Browser fails to open** | `shell.openExternal()` throws error | Catch error, return network_error | "브라우저를 열 수 없습니다. 시스템 설정을 확인해주세요." | Check system permissions, try again |
| **User cancels authorization** | Callback receives `error=access_denied` | Detect error param, close server | "인증이 취소되었습니다. 다시 시도하려면 로그인 버튼을 클릭하세요." | User clicks login again |
| **Callback timeout (5 min)** | setTimeout triggers | Close server, resolve with timeout | "Authorization request timed out. Please try again." | User clicks login again |
| **State parameter missing** | `!receivedState` in validateState | Reject, log security warning | "Security validation failed. Please try again." | User clicks login again |
| **State parameter mismatch** | `timingSafeEqual()` returns false | Reject, clear state | "보안 검증 실패. 다시 시도해주세요." | User clicks login again, generates new state |
| **State expired (>10 min)** | Check `age > 10 * 60 * 1000` | Reject with age info | "User took too long to authorize. Please try again." | User clicks login again |
| **Port already in use** | Server error `EADDRINUSE` | Catch error, suggest solutions | "Port 3000 is already in use. Please close other applications..." | Close other apps, or change redirect URI port |
| **Permission denied (port)** | Server error `EACCES` | Catch error, suggest port change | "Permission denied to bind port 3000. Try using a port >= 1024." | Change redirect URI to use port >=1024 |

## Token Exchange Edge Cases

| Edge Case | Detection | Handling | User Message | Recovery |
|-----------|-----------|----------|--------------|----------|
| **Network error** | `fetch()` throws (ECONNREFUSED, ETIMEDOUT, ENOTFOUND) | Catch, parse error type | "네트워크 오류로 코드 교환에 실패했습니다. DNS 오류: 인터넷 연결을 확인하세요." | Check network, retry login |
| **HTTP 400 (Bad Request)** | `response.status === 400` | Parse Cafe24 error | "인증 코드가 유효하지 않습니다. 다시 로그인해주세요." | Login again (code is single-use) |
| **HTTP 401 (Unauthorized)** | `response.status === 401` | Parse Cafe24 error | "클라이언트 인증에 실패했습니다. Client ID/Secret을 확인하세요." | Check env variables, restart app |
| **HTTP 5xx (Server Error)** | `response.status >= 500` | Suggest retry | "카페24 서버 오류입니다. 잠시 후 다시 시도해주세요." | Wait, retry login |
| **Malformed JSON response** | `response.json()` throws | Catch parse error | "카페24 응답 형식이 올바르지 않습니다." | Check Cafe24 API status, retry |
| **Missing access_token** | `!payload.access_token` | Check required field | "액세스 토큰을 받지 못했습니다." | Check Cafe24 app config, retry |
| **Token save failure** | `persistTokens()` throws | Catch fs error | "토큰 저장에 실패했습니다. 다시 로그인해주세요." | Check disk space/permissions, retry |

## Token File Edge Cases

| Edge Case | Detection | Handling | User Message | Recovery |
|-----------|-----------|----------|--------------|----------|
| **File doesn't exist** | `fs.readFile()` throws ENOENT | Return null (normal for first-time) | "로그아웃 상태" | User logs in normally |
| **File is empty** | `raw.trim().length === 0` | Return null with warning | "로그아웃 상태" | Delete file, login again |
| **Invalid JSON** | `JSON.parse()` throws | Catch, return null | "로그아웃 상태" | Delete corrupted file, login again |
| **Not an object** | `typeof parsed !== 'object'` | Return null | "로그아웃 상태" | Delete file, login again |
| **Missing required fields** | Check field presence | List missing fields, return null | "로그아웃 상태" | Delete file, login again |
| **Invalid field types** | Type checks for each field | Return null with field name | "로그아웃 상태" | Delete file, login again |
| **Decryption failure** | `safeStorage.decryptString()` throws | Catch, explain causes | "로그아웃 상태" | Delete file (keychain changed), login again |
| **Future timestamp** | `issuedAt > Date.now() + 60000` | Warn but continue | (Warning only) | Continue, may cause issues |
| **Permission denied** | `fs.readFile()` throws EACCES | Log file path, return null | "로그아웃 상태" | Fix file permissions: `chmod 600 <file>` |

## Token Refresh Edge Cases

| Edge Case | Detection | Handling | User Message | Recovery |
|-----------|-----------|----------|--------------|----------|
| **No stored refresh token** | `!stored?.refreshToken` | Return missing_tokens | "저장된 갱신 토큰이 없습니다. 다시 로그인하세요." | User clicks login |
| **Refresh token expired** | HTTP 400/401 from Cafe24 | Parse error, require re-auth | "토큰이 만료되었습니다. 다시 로그인하세요." | User clicks login (30+ days expired) |
| **Refresh token revoked** | HTTP 401 from Cafe24 | Parse error, require re-auth | "토큰이 만료되었습니다. 다시 로그인하세요." | User revoked app in Cafe24 admin |
| **Network error** | `fetch()` throws | Catch, parse error type | "네트워크 오류로 토큰 갱신에 실패했습니다. DNS 오류..." | Check network, app will retry on next API call |
| **HTTP 5xx** | `response.status >= 500` | Suggest retry | "카페24 서버 오류입니다. 잠시 후 다시 시도해주세요." | Wait, automatic retry on next API call |
| **Malformed JSON** | `response.json()` throws | Catch parse error | "카페24 응답 형식이 올바르지 않습니다." | Check Cafe24 API status |
| **Missing access_token** | `!payload.access_token` | Check required field | "새 액세스 토큰을 받지 못했습니다." | Retry or re-login |
| **Token save failure** | `persistTokens()` throws | Catch fs error | "토큰 저장에 실패했습니다. 다시 시도해주세요." | Check disk space, retry API call |

## User Feedback Edge Cases

| Edge Case | Detection | Handling | User Message | Recovery |
|-----------|-----------|----------|--------------|----------|
| **Missing env variables** | Check config fields | List missing vars | "환경 변수 설정 필요: VITE_CAFE24_MALL_ID, ..." | Set env vars in .env file, restart |
| **Timeout error code** | `errorCode === 'timeout'` | Clear retry message | "인증이 취소되었습니다. 다시 시도하려면 로그인 버튼을 클릭하세요." | User clicks login, completes faster |
| **State mismatch code** | `errorCode === 'state_mismatch'` | Security explanation | "보안 검증 실패. 다시 시도해주세요. (CSRF 보호 활성화됨)" | User clicks login again |
| **Network error code** | `errorCode === 'network_error'` | Connection guidance | "{message} 인터넷 연결 상태를 확인하고 다시 시도하세요." | Check network, retry |
| **Auth error code** | `errorCode === 'auth_error'` | Credentials guidance | "{message} Client ID와 Mall ID가 올바른지 확인하세요." | Check env vars, verify Cafe24 app config |

## Security Edge Cases

| Edge Case | Detection | Handling | User Message | Recovery |
|-----------|-----------|----------|--------------|----------|
| **CSRF attack (state mismatch)** | `timingSafeEqual()` fails | Reject, log security warning | "Security validation failed. Please try again." | Legitimate user retries, attacker fails |
| **Replay attack (reused state)** | State already used (null currentState) | Reject, explain causes | "Security validation failed." | User retries with new state |
| **Replay attack (old state)** | State expired (>10 min) | Reject with age info | "User took too long." | User retries with fresh state |
| **Timing attack on state** | (Prevention) | Use `timingSafeEqual()` | N/A | Attacker cannot guess state via timing |
| **Token exposed in logs** | (Prevention) | Only log truncated versions | N/A | Tokens not logged in production |
| **Token exposed in UI** | (Prevention) | Only show status, not tokens | N/A | User sees "logged in", not actual tokens |

## Performance Edge Cases

| Edge Case | Detection | Handling | User Message | Recovery |
|-----------|-----------|----------|--------------|----------|
| **Slow network** | Long fetch time | Let fetch timeout naturally | "연결 시간 초과..." (if timeout) | Wait or retry with better connection |
| **Slow disk I/O** | Long fs operation time | Await operations | (Spinner in UI) | Check disk health, free space |
| **Concurrent OAuth flows** | Multiple login() calls | State overwritten | "Security validation failed." | Prevent UI from calling login() multiple times |
| **Token file locked** | `fs.writeFile()` throws EBUSY | Retry or fail | "토큰 저장에 실패했습니다." | Close other apps accessing file, retry |

## Testing Simulation

| Edge Case | How to Simulate | Expected Result |
|-----------|----------------|-----------------|
| **Network error** | Turn off Wi-Fi during token exchange | Clear network error message |
| **Invalid auth code** | Modify code param in callback URL | "인증 코드가 유효하지 않습니다." |
| **Corrupted token file** | `echo "{ invalid" > token_file` | File ignored, user must login |
| **Expired access token** | Edit `expiresAt` to past date | Auto-refresh on next API call |
| **Expired refresh token** | Replace with invalid token | Re-login required |
| **State mismatch** | Modify state param in callback URL | Security validation failure |
| **Callback timeout** | Wait 5+ minutes without authorizing | Timeout message, server closes |
| **Port in use** | Start another server on port 3000 | Port conflict error with suggestions |
| **Missing env vars** | Unset env variable | Lists missing variables |

## Quick Debugging Commands

```bash
# View token file
cat ~/Library/Application\ Support/review_upload/cafe24-oauth.json

# Delete token file (start fresh)
rm ~/Library/Application\ Support/review_upload/cafe24-oauth.json

# Check if port 3000 is in use
lsof -i :3000

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Check file permissions
ls -la ~/Library/Application\ Support/review_upload/

# Watch console logs for auth messages
# (In DevTools, filter by "[auth]" or "[oauth]")
```

## Error Code Reference

| Error Code | Meaning | User Action | System Action |
|------------|---------|-------------|---------------|
| `user_cancelled` | User didn't complete authorization | Retry login | Clear state, allow new attempt |
| `timeout` | OAuth flow took >5 minutes | Retry login faster | Close callback server |
| `state_mismatch` | CSRF protection triggered | Retry login | Generate new state |
| `auth_error` | Generic authorization error | Check credentials | Log details |
| `network_error` | Connection/fetch failed | Check network | Log network error type |
| `invalid_code` | Authorization code rejected | Login again | Code is single-use |
| `refresh_failed` | Refresh token expired/invalid | Re-authenticate | Clear tokens |
| `missing_tokens` | No tokens in storage | Login | Normal first-time state |
| `storage_error` | File read/write failed | Check disk | Log fs error |
| `server_error` | Callback server failed | Change port or retry | Log server error |

## Priority Edge Cases (Must Test)

1. **Network error during token exchange** - Very common
2. **Refresh token expiration** - Happens after 30 days
3. **Corrupted token file** - Can happen after crash
4. **Port already in use** - Common in development
5. **State validation failure** - Security critical
6. **Token file decryption failure** - OS keychain issues

## Low Priority Edge Cases (Nice to Handle)

1. Future timestamp in token file - Rare (clock skew)
2. Permission denied on port < 1024 - Uncommon
3. localhost not available - Very rare
4. Token file locked by another process - Rare
5. Malformed JSON from Cafe24 - Should never happen

## When to Re-authenticate vs Retry

**Re-authenticate (click login button):**
- Refresh token expired (400/401)
- Refresh token revoked
- No stored tokens
- Token file corrupted beyond repair
- Decryption failed (keychain changed)

**Retry automatically:**
- Network timeout (may succeed next time)
- Cafe24 server error (5xx)
- Access token expired (auto-refresh)

**User decides (provide option):**
- Port conflict (can change port or close other apps)
- Permission denied (can fix permissions or use different port)

## Console Log Levels

- `console.log()` - Normal operation (success, info)
- `console.warn()` - Recoverable issues (expired token, missing file)
- `console.error()` - Serious issues (network error, validation failure)

## Related Files

- **Test Guide**: `tests/manual/auth-flow-testing.md`
- **Implementation Guide**: `tests/manual/IMPLEMENTATION_GUIDE.md`
- **Test Utils**: `src/main/services/auth-test-utils.ts`
- **Auth Service**: `src/main/services/auth.ts`
- **OAuth Server**: `src/main/services/oauth-server.ts`
- **Auth Hook**: `src/renderer/hooks/useAuth.ts`
