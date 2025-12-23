import { app, safeStorage, shell } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  generateState,
  storeState,
  buildAuthorizationUrl,
  startCallbackServer,
  type CallbackResult,
} from './oauth-server';

export interface OAuthConfig {
  mallId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Configuration for initiating OAuth flow
 */
export interface OAuthFlowConfig extends OAuthConfig {
  /** OAuth scopes to request (space-separated) */
  scope?: string;
  /** Port for local callback server (default: 3000) */
  callbackPort?: number;
  /** Path for callback endpoint (default: '/callback') */
  callbackPath?: string;
}

/**
 * Result of the complete OAuth flow
 */
export interface OAuthFlowResult {
  /** Whether the flow completed successfully */
  success: boolean;
  /** Token set if successful */
  tokens?: OAuthTokenSet;
  /** Human-readable message */
  message: string;
  /** Error code for programmatic handling */
  errorCode?: 'user_cancelled' | 'state_mismatch' | 'auth_error' | 'network_error' | 'timeout';
}

export interface OAuthTokenSet {
  accessToken: string;
  refreshToken: string;
  scope?: string;
  expiresAt: number;
  issuedAt: number;
}

export type AuthFailureReason = 'network_error' | 'invalid_code' | 'missing_tokens' | 'refresh_failed' | 'storage_error';

export interface AuthResult {
  success: boolean;
  tokens?: OAuthTokenSet;
  message: string;
  reason?: AuthFailureReason;
}

const TOKEN_FILE = path.join(app.getPath('userData'), 'cafe24-oauth.json');

interface TokenResponsePayload {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  expires_in?: number;
  expires_at?: number;
}

function getTokenEndpoint(mallId: string): string {
  return `https://${mallId}.cafe24api.com/api/v2/oauth/token`;
}

function serializeTokenSet(tokens: OAuthTokenSet): string {
  const payload: Record<string, unknown> = {
    accessToken: tokens.accessToken,
    scope: tokens.scope,
    expiresAt: tokens.expiresAt,
    issuedAt: tokens.issuedAt,
  };

  const canEncrypt = safeStorage.isEncryptionAvailable();
  payload.refreshToken = canEncrypt
    ? safeStorage.encryptString(tokens.refreshToken).toString('base64')
    : tokens.refreshToken;
  payload.encrypted = canEncrypt;

  return JSON.stringify(payload, null, 2);
}

/**
 * Reads and decrypts the token file from disk.
 *
 * EDGE CASES HANDLED:
 * - File doesn't exist (first-time user)
 * - File is corrupted or invalid JSON
 * - Required fields are missing
 * - Decryption fails (wrong encryption key or corrupted data)
 * - File permissions prevent reading
 *
 * @returns Token set if successful, null otherwise
 */
async function readTokenFile(): Promise<OAuthTokenSet | null> {
  try {
    const raw = await fs.readFile(TOKEN_FILE, 'utf8');

    // Edge Case 1: Empty file
    if (!raw || raw.trim().length === 0) {
      console.warn('[auth] Token file is empty');
      return null;
    }

    // Edge Case 2: Invalid JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (parseError) {
      console.error('[auth] Token file contains invalid JSON:', parseError);
      console.error('[auth] File will be ignored. Re-authentication required.');
      return null;
    }

    // Edge Case 3: Not an object
    if (typeof parsed !== 'object' || parsed === null) {
      console.error('[auth] Token file does not contain an object');
      return null;
    }

    const tokenData = parsed as Record<string, unknown>;

    // Edge Case 4: Missing required fields
    const requiredFields = ['accessToken', 'refreshToken', 'expiresAt', 'issuedAt'];
    const missingFields = requiredFields.filter(field => !(field in tokenData));
    if (missingFields.length > 0) {
      console.error('[auth] Token file missing required fields:', missingFields);
      console.error('[auth] File appears to be corrupted or from an older version');
      return null;
    }

    // Edge Case 5: Invalid field types
    if (typeof tokenData.accessToken !== 'string' || tokenData.accessToken.length === 0) {
      console.error('[auth] Invalid accessToken in token file');
      return null;
    }
    if (typeof tokenData.refreshToken !== 'string' || tokenData.refreshToken.length === 0) {
      console.error('[auth] Invalid refreshToken in token file');
      return null;
    }
    if (typeof tokenData.expiresAt !== 'number' || tokenData.expiresAt <= 0) {
      console.error('[auth] Invalid expiresAt in token file');
      return null;
    }
    if (typeof tokenData.issuedAt !== 'number' || tokenData.issuedAt <= 0) {
      console.error('[auth] Invalid issuedAt in token file');
      return null;
    }

    // Edge Case 6: Decryption failure
    let refreshToken: string;
    try {
      refreshToken = tokenData.encrypted === true
        ? safeStorage.decryptString(Buffer.from(tokenData.refreshToken as string, 'base64'))
        : tokenData.refreshToken as string;
    } catch (decryptError) {
      console.error('[auth] Failed to decrypt refresh token:', decryptError);
      console.error('[auth] This may indicate:');
      console.error('[auth] - Wrong encryption key (OS keychain changed)');
      console.error('[auth] - Corrupted encrypted data');
      console.error('[auth] - Token was encrypted on different machine');
      return null;
    }

    // Edge Case 7: Token is from the future (clock skew or manipulation)
    if (tokenData.issuedAt > Date.now() + 60000) { // 1 minute tolerance
      console.warn('[auth] Token issuedAt is in the future. Possible clock skew.');
      console.warn('[auth] Token will be used but may cause issues.');
    }

    return {
      accessToken: tokenData.accessToken as string,
      refreshToken,
      scope: tokenData.scope as string | undefined,
      expiresAt: tokenData.expiresAt as number,
      issuedAt: tokenData.issuedAt as number,
    };
  } catch (error) {
    // Edge Case 8: File doesn't exist (normal for first-time users)
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('[auth] Token file does not exist (first-time login)');
      return null;
    }

    // Edge Case 9: Permission denied
    if ((error as NodeJS.ErrnoException).code === 'EACCES') {
      console.error('[auth] Permission denied reading token file');
      console.error('[auth] Check file permissions on:', TOKEN_FILE);
      return null;
    }

    // Edge Case 10: Other file system errors
    console.error('[auth] Failed to read token file', error);
    return null;
  }
}

async function persistTokens(tokens: OAuthTokenSet): Promise<void> {
  try {
    await fs.mkdir(path.dirname(TOKEN_FILE), { recursive: true });
    await fs.writeFile(TOKEN_FILE, serializeTokenSet(tokens), 'utf8');
  } catch (error) {
    console.error('[auth] Failed to write token file', error);
    throw new Error('토큰 저장에 실패했습니다.');
  }
}

function mapTokenResponse(payload: TokenResponsePayload, previousRefreshToken?: string): OAuthTokenSet {
  const now = Date.now();
  const expiresInSeconds = payload.expires_in ?? 0;
  const expiresAt = payload.expires_at ? payload.expires_at * 1000 : now + expiresInSeconds * 1000;

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? previousRefreshToken ?? '',
    scope: payload.scope,
    expiresAt,
    issuedAt: now,
  };
}

function isTokenExpired(tokenSet: OAuthTokenSet, skewSeconds = 60): boolean {
  return Date.now() >= tokenSet.expiresAt - skewSeconds * 1000;
}

/**
 * Exchanges authorization code for access and refresh tokens.
 *
 * EDGE CASES HANDLED:
 * - Network errors (connection failed, timeout)
 * - Invalid or expired authorization code
 * - Malformed Cafe24 API response
 * - Token persistence failure
 * - HTTP error codes (400, 401, 500, etc.)
 *
 * SECURITY NOTES:
 * - Authorization codes are single-use only
 * - Codes expire quickly (usually 10 minutes)
 * - DO NOT retry with the same code if exchange fails
 *
 * @param code - Authorization code from OAuth callback
 * @param config - OAuth configuration
 * @returns AuthResult with tokens if successful
 */
export async function exchangeAuthCode(code: string, config: OAuthConfig): Promise<AuthResult> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
  });

  const endpoint = getTokenEndpoint(config.mallId);

  console.log('[auth] Exchanging authorization code for tokens');

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    // Edge Case 1: HTTP error responses
    if (!response.ok) {
      // Try to parse error details from Cafe24 response
      let errorDetails = '';
      try {
        const errorBody = await response.json() as { error?: string; error_description?: string };
        errorDetails = errorBody.error_description || errorBody.error || '';
        console.error('[auth] Cafe24 API error:', errorBody);
      } catch {
        // Response is not JSON
        errorDetails = await response.text();
      }

      // Specific error handling by status code
      if (response.status === 400) {
        console.error('[auth] Bad Request (400) - Authorization code may be invalid or expired');
        return {
          success: false,
          message: `인증 코드가 유효하지 않습니다. 다시 로그인해주세요. (${errorDetails})`,
          reason: 'invalid_code',
        };
      } else if (response.status === 401) {
        console.error('[auth] Unauthorized (401) - Client credentials may be wrong');
        return {
          success: false,
          message: `클라이언트 인증에 실패했습니다. Client ID/Secret을 확인하세요. (${errorDetails})`,
          reason: 'invalid_code',
        };
      } else if (response.status >= 500) {
        console.error('[auth] Server Error (5xx) - Cafe24 API is experiencing issues');
        return {
          success: false,
          message: `카페24 서버 오류입니다. 잠시 후 다시 시도해주세요. (${response.status})`,
          reason: 'network_error',
        };
      }

      return {
        success: false,
        message: `인증 코드 교환 실패 (${response.status} ${response.statusText}): ${errorDetails}`,
        reason: 'invalid_code',
      };
    }

    // Edge Case 2: Malformed JSON response
    let payload: TokenResponsePayload;
    try {
      payload = (await response.json()) as TokenResponsePayload;
    } catch (parseError) {
      console.error('[auth] Failed to parse token response as JSON:', parseError);
      return {
        success: false,
        message: '카페24 응답 형식이 올바르지 않습니다.',
        reason: 'network_error',
      };
    }

    // Edge Case 3: Missing required fields in response
    if (!payload.access_token) {
      console.error('[auth] Token response missing access_token');
      return {
        success: false,
        message: '액세스 토큰을 받지 못했습니다.',
        reason: 'missing_tokens',
      };
    }

    const tokens = mapTokenResponse(payload);

    // Edge Case 4: Token persistence failure
    try {
      await persistTokens(tokens);
    } catch (persistError) {
      console.error('[auth] Failed to save tokens:', persistError);
      // Tokens were received but not saved - still return success
      // User can retry by logging in again
      return {
        success: false,
        message: '토큰 저장에 실패했습니다. 다시 로그인해주세요.',
        reason: 'storage_error',
      };
    }

    console.log('[auth] Token exchange successful. Expires at:', new Date(tokens.expiresAt).toISOString());
    return { success: true, tokens, message: '인증 코드 교환 완료: 토큰이 저장되었습니다.' };
  } catch (error) {
    // Edge Case 5: Network errors (connection failed, timeout, DNS failure)
    console.error('[auth] exchangeAuthCode error', error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    let userMessage = '네트워크 오류로 코드 교환에 실패했습니다.';

    // Provide specific guidance based on error type
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('DNS')) {
      userMessage += ' DNS 오류: 인터넷 연결을 확인하세요.';
    } else if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
      userMessage += ' 연결 시간 초과: 네트워크 상태를 확인하세요.';
    } else if (errorMessage.includes('ECONNREFUSED')) {
      userMessage += ' 연결 거부: 카페24 API 서버에 접근할 수 없습니다.';
    }

    return { success: false, message: userMessage, reason: 'network_error' };
  }
}

/**
 * Refreshes the access token using the stored refresh token.
 *
 * EDGE CASES HANDLED:
 * - No stored refresh token (user never logged in or token file deleted)
 * - Refresh token expired (usually after 30 days)
 * - Refresh token revoked (user revoked app in Cafe24 admin)
 * - Network errors during refresh
 * - Malformed API response
 * - Token file read/write failures
 *
 * IMPORTANT:
 * - Refresh tokens are long-lived but CAN expire
 * - If refresh fails with 401, user MUST re-authenticate
 * - DO NOT retry refresh with the same token if 401/400
 *
 * @param config - OAuth configuration
 * @returns AuthResult with new tokens if successful
 */
export async function refreshAccessToken(config: OAuthConfig): Promise<AuthResult> {
  console.log('[auth] Attempting to refresh access token');

  const stored = await readTokenFile();

  // Edge Case 1: No token file or no refresh token
  if (!stored?.refreshToken) {
    console.error('[auth] No stored refresh token available');
    return {
      success: false,
      message: '저장된 갱신 토큰이 없습니다. 다시 로그인하세요.',
      reason: 'missing_tokens',
    };
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: stored.refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
  });

  const endpoint = getTokenEndpoint(config.mallId);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    // Edge Case 2: HTTP error responses
    if (!response.ok) {
      // Parse Cafe24 error details
      let errorDetails = '';
      try {
        const errorBody = await response.json() as { error?: string; error_description?: string };
        errorDetails = errorBody.error_description || errorBody.error || '';
        console.error('[auth] Cafe24 refresh error:', errorBody);
      } catch {
        errorDetails = await response.text();
      }

      // Edge Case 3: Refresh token expired or revoked (401/400)
      if (response.status === 400 || response.status === 401) {
        console.error('[auth] Refresh token is invalid, expired, or revoked');
        console.error('[auth] User must re-authenticate to obtain new tokens');
        return {
          success: false,
          message: `토큰이 만료되었습니다. 다시 로그인하세요. (${errorDetails})`,
          reason: 'refresh_failed',
        };
      }

      // Edge Case 4: Server errors (5xx)
      if (response.status >= 500) {
        console.error('[auth] Cafe24 server error during token refresh');
        return {
          success: false,
          message: `카페24 서버 오류입니다. 잠시 후 다시 시도해주세요. (${response.status})`,
          reason: 'network_error',
        };
      }

      return {
        success: false,
        message: `토큰 갱신 실패 (${response.status} ${response.statusText}): ${errorDetails}`,
        reason: 'refresh_failed',
      };
    }

    // Edge Case 5: Malformed JSON response
    let payload: TokenResponsePayload;
    try {
      payload = (await response.json()) as TokenResponsePayload;
    } catch (parseError) {
      console.error('[auth] Failed to parse refresh response as JSON:', parseError);
      return {
        success: false,
        message: '카페24 응답 형식이 올바르지 않습니다.',
        reason: 'network_error',
      };
    }

    // Edge Case 6: Missing access_token in response
    if (!payload.access_token) {
      console.error('[auth] Refresh response missing access_token');
      return {
        success: false,
        message: '새 액세스 토큰을 받지 못했습니다.',
        reason: 'missing_tokens',
      };
    }

    // Note: Cafe24 may or may not return a new refresh_token
    // If not returned, we reuse the existing one
    const tokens = mapTokenResponse(payload, stored.refreshToken);

    // Edge Case 7: Token persistence failure
    try {
      await persistTokens(tokens);
    } catch (persistError) {
      console.error('[auth] Failed to save refreshed tokens:', persistError);
      return {
        success: false,
        message: '토큰 저장에 실패했습니다. 다시 시도해주세요.',
        reason: 'storage_error',
      };
    }

    console.log('[auth] Token refresh successful. New expiry:', new Date(tokens.expiresAt).toISOString());
    return { success: true, tokens, message: '액세스 토큰을 갱신했습니다.' };
  } catch (error) {
    // Edge Case 8: Network errors
    console.error('[auth] refreshAccessToken error', error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    let userMessage = '네트워크 오류로 토큰 갱신에 실패했습니다.';

    // Provide specific guidance
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('DNS')) {
      userMessage += ' DNS 오류: 인터넷 연결을 확인하세요.';
    } else if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
      userMessage += ' 연결 시간 초과: 네트워크 상태를 확인하세요.';
    }

    return { success: false, message: userMessage, reason: 'network_error' };
  }
}

export async function getValidAccessToken(config: OAuthConfig): Promise<AuthResult> {
  const stored = await readTokenFile();

  if (stored && !isTokenExpired(stored)) {
    return { success: true, tokens: stored, message: '저장된 토큰을 사용합니다.' };
  }

  const refreshed = await refreshAccessToken(config);

  if (refreshed.success) {
    return refreshed;
  }

  return {
    success: false,
    message: '토큰이 만료되었거나 없습니다. 다시 인증하세요.',
    reason: refreshed.reason ?? 'refresh_failed',
  };
}

export async function loadStoredTokens(): Promise<AuthResult> {
  const stored = await readTokenFile();

  if (!stored) {
    return { success: false, message: '저장된 토큰이 없습니다.', reason: 'missing_tokens' };
  }

  return { success: true, tokens: stored, message: '저장된 토큰을 불러왔습니다.' };
}

/**
 * Initiates the complete OAuth 2.0 authorization code flow.
 *
 * This is the main entry point for logging in. It:
 * 1. Generates a CSRF-safe state parameter
 * 2. Builds the authorization URL
 * 3. Opens the user's browser to Cafe24 login
 * 4. Starts a local server to receive the callback
 * 5. Waits for the authorization code
 * 6. Exchanges the code for tokens
 * 7. Saves tokens to disk
 */
export async function initiateOAuthFlow(config: OAuthFlowConfig): Promise<OAuthFlowResult> {
  try {
    // Extract callback configuration
    const callbackPort = config.callbackPort ?? extractPortFromRedirectUri(config.redirectUri);
    const callbackPath = config.callbackPath ?? extractPathFromRedirectUri(config.redirectUri);

    console.log('[auth] Initiating OAuth flow for', config.mallId);

    // Step 1: Generate and store state parameter for CSRF protection
    const state = generateState();
    storeState(state, { mallId: config.mallId, clientId: config.clientId });

    // Step 2: Build authorization URL
    const authUrl = buildAuthorizationUrl(config, state, config.scope);

    // Step 3: Start callback server to receive the authorization code
    console.log('[auth] Starting callback server on port', callbackPort);
    const callbackPromise = startCallbackServer(callbackPort, callbackPath);

    // Step 4: Open browser to authorization URL
    console.log('[auth] Opening browser to authorization URL');
    try {
      await shell.openExternal(authUrl);
    } catch (error) {
      console.error('[auth] Failed to open external URL', error);
      return {
        success: false,
        message: '브라우저를 열 수 없습니다. 시스템 설정을 확인해주세요.',
        errorCode: 'network_error',
      };
    }

    // Step 5: Wait for callback with authorization code
    console.log('[auth] Waiting for authorization code from callback server');
    const callbackResult = await callbackPromise;

    if (!callbackResult.success) {
      console.error('[auth] Callback failed:', callbackResult.error);
      return {
        success: false,
        message: callbackResult.errorDescription || '인증이 취소되었습니다.',
        errorCode: callbackResult.error === 'timeout' ? 'user_cancelled' : 'auth_error',
      };
    }

    // Step 6: Exchange authorization code for tokens
    if (!callbackResult.code) {
      return {
        success: false,
        message: '인증 코드를 받지 못했습니다.',
        errorCode: 'auth_error',
      };
    }

    console.log('[auth] Exchanging authorization code for tokens');
    const exchangeResult = await exchangeAuthCode(callbackResult.code, config);

    if (!exchangeResult.success) {
      return {
        success: false,
        message: exchangeResult.message,
        errorCode: 'network_error',
      };
    }

    console.log('[auth] OAuth flow completed successfully');
    return {
      success: true,
      tokens: exchangeResult.tokens,
      message: '인증이 완료되었습니다!',
    };
  } catch (error) {
    console.error('[auth] Unexpected error in OAuth flow', error);
    return {
      success: false,
      message: '예기치 않은 오류가 발생했습니다: ' + String(error),
      errorCode: 'network_error',
    };
  }
}

/**
 * Extracts port number from redirect URI.
 *
 * Helper function to parse "http://localhost:3000/oauth/callback" -> 3000
 */
function extractPortFromRedirectUri(redirectUri: string): number {
  try {
    const url = new URL(redirectUri);
    const port = parseInt(url.port, 10);
    return isNaN(port) ? 3000 : port;
  } catch {
    return 3000;
  }
}

/**
 * Extracts path from redirect URI.
 *
 * Helper function to parse "http://localhost:3000/oauth/callback" -> "/callback"
 */
function extractPathFromRedirectUri(redirectUri: string): string {
  try {
    const url = new URL(redirectUri);
    return url.pathname || '/oauth/callback';
  } catch {
    return '/oauth/callback';
  }
}
