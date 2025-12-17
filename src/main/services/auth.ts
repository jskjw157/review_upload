import { app, safeStorage } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface OAuthConfig {
  mallId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
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

async function readTokenFile(): Promise<OAuthTokenSet | null> {
  try {
    const raw = await fs.readFile(TOKEN_FILE, 'utf8');
    const parsed = JSON.parse(raw) as {
      accessToken: string;
      refreshToken: string;
      scope?: string;
      expiresAt: number;
      issuedAt: number;
      encrypted?: boolean;
    };

    const refreshToken = parsed.encrypted
      ? safeStorage.decryptString(Buffer.from(parsed.refreshToken, 'base64'))
      : parsed.refreshToken;

    return {
      accessToken: parsed.accessToken,
      refreshToken,
      scope: parsed.scope,
      expiresAt: parsed.expiresAt,
      issuedAt: parsed.issuedAt,
    };
  } catch (error) {
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

export async function exchangeAuthCode(code: string, config: OAuthConfig): Promise<AuthResult> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
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

    if (!response.ok) {
      return {
        success: false,
        message: `인증 코드 교환 실패 (${response.status} ${response.statusText})`,
        reason: 'invalid_code',
      };
    }

    const payload = (await response.json()) as TokenResponsePayload;
    const tokens = mapTokenResponse(payload);
    await persistTokens(tokens);

    return { success: true, tokens, message: '인증 코드 교환 완료: 토큰이 저장되었습니다.' };
  } catch (error) {
    console.error('[auth] exchangeAuthCode error', error);
    return { success: false, message: '네트워크 오류로 코드 교환에 실패했습니다.', reason: 'network_error' };
  }
}

export async function refreshAccessToken(config: OAuthConfig): Promise<AuthResult> {
  const stored = await readTokenFile();

  if (!stored?.refreshToken) {
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

    if (!response.ok) {
      return {
        success: false,
        message: `토큰 갱신 실패 (${response.status} ${response.statusText})`,
        reason: 'refresh_failed',
      };
    }

    const payload = (await response.json()) as TokenResponsePayload;
    const tokens = mapTokenResponse(payload, stored.refreshToken);
    await persistTokens(tokens);

    return { success: true, tokens, message: '액세스 토큰을 갱신했습니다.' };
  } catch (error) {
    console.error('[auth] refreshAccessToken error', error);
    return { success: false, message: '네트워크 오류로 토큰 갱신에 실패했습니다.', reason: 'network_error' };
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
