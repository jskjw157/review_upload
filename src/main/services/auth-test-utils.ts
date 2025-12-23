/**
 * Test utilities for simulating edge cases in auth flow.
 *
 * USAGE: These functions are meant for MANUAL TESTING ONLY.
 * Do NOT import these in production code.
 *
 * To use:
 * 1. Import into src/main/main.ts temporarily
 * 2. Expose via IPC for testing
 * 3. Call from renderer during manual tests
 * 4. Remove before production build
 */

import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

const TOKEN_FILE = path.join(app.getPath('userData'), 'cafe24-oauth.json');

/**
 * Corrupts the token file to simulate storage failure.
 *
 * This simulates scenarios like:
 * - Disk corruption
 * - Manual file editing gone wrong
 * - Interrupted write operation
 *
 * @example
 * // In manual test:
 * await window.reviewApi.testUtils.corruptTokenFile();
 * // Then restart app and verify error handling
 */
export async function corruptTokenFile(): Promise<void> {
  try {
    await fs.writeFile(TOKEN_FILE, '{ invalid json syntax', 'utf8');
    console.log('[test-utils] Token file corrupted successfully');
  } catch (error) {
    console.error('[test-utils] Failed to corrupt token file:', error);
  }
}

/**
 * Sets the access token expiration to a past date.
 *
 * Forces the next API call to trigger token refresh logic.
 * Useful for testing auto-refresh without waiting 2 hours.
 *
 * @example
 * await window.reviewApi.testUtils.expireAccessToken();
 * // Next review submission will trigger refresh
 */
export async function expireAccessToken(): Promise<void> {
  try {
    const content = await fs.readFile(TOKEN_FILE, 'utf8');
    const tokenData = JSON.parse(content);

    // Set expiration to 1 hour ago
    tokenData.expiresAt = Date.now() - 60 * 60 * 1000;

    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2), 'utf8');
    console.log('[test-utils] Access token expired (set to 1 hour ago)');
  } catch (error) {
    console.error('[test-utils] Failed to expire token:', error);
  }
}

/**
 * Invalidates the refresh token to simulate refresh failure.
 *
 * Simulates scenarios like:
 * - Refresh token revoked in Cafe24 admin
 * - Refresh token expired (30+ days old)
 * - Token corrupted in storage
 *
 * @example
 * await window.reviewApi.testUtils.invalidateRefreshToken();
 * await window.reviewApi.testUtils.expireAccessToken();
 * // Next API call will try to refresh, fail, and require re-login
 */
export async function invalidateRefreshToken(): Promise<void> {
  try {
    const content = await fs.readFile(TOKEN_FILE, 'utf8');
    const tokenData = JSON.parse(content);

    // Replace with invalid token
    tokenData.refreshToken = 'INVALID_REFRESH_TOKEN_FOR_TESTING_12345';
    tokenData.encrypted = false; // Don't encrypt invalid token

    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2), 'utf8');
    console.log('[test-utils] Refresh token invalidated');
  } catch (error) {
    console.error('[test-utils] Failed to invalidate refresh token:', error);
  }
}

/**
 * Deletes the token file completely.
 *
 * Resets auth state to simulate first-time user experience.
 *
 * @example
 * await window.reviewApi.testUtils.deleteTokenFile();
 * // App should show logged-out state on restart
 */
export async function deleteTokenFile(): Promise<void> {
  try {
    await fs.unlink(TOKEN_FILE);
    console.log('[test-utils] Token file deleted');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('[test-utils] Token file does not exist (already deleted)');
    } else {
      console.error('[test-utils] Failed to delete token file:', error);
    }
  }
}

/**
 * Reads the current token file for inspection.
 *
 * Useful for debugging and verifying test setup.
 *
 * @returns Token file contents or null if not found
 */
export async function readTokenFile(): Promise<Record<string, unknown> | null> {
  try {
    const content = await fs.readFile(TOKEN_FILE, 'utf8');
    const tokenData = JSON.parse(content);

    // Don't log sensitive data
    console.log('[test-utils] Token file read successfully:', {
      hasAccessToken: !!tokenData.accessToken,
      hasRefreshToken: !!tokenData.refreshToken,
      expiresAt: new Date(tokenData.expiresAt).toISOString(),
      isExpired: Date.now() >= tokenData.expiresAt,
      encrypted: tokenData.encrypted,
    });

    return tokenData;
  } catch (error) {
    console.error('[test-utils] Failed to read token file:', error);
    return null;
  }
}

/**
 * Simulates network failure by overriding fetch temporarily.
 *
 * WARNING: This is a global override and affects ALL fetch calls.
 * Use carefully and restore original fetch after test.
 *
 * @returns Function to restore original fetch
 *
 * @example
 * const restore = simulateNetworkFailure();
 * // Try to login or submit review - will fail with network error
 * restore(); // Restore normal fetch behavior
 */
export function simulateNetworkFailure(): () => void {
  const originalFetch = global.fetch;

  // Override with function that always rejects
  (global as unknown as { fetch: typeof fetch }).fetch = async () => {
    throw new Error('Simulated network failure');
  };

  console.log('[test-utils] Network failure simulation enabled');

  // Return restore function
  return () => {
    (global as unknown as { fetch: typeof fetch }).fetch = originalFetch;
    console.log('[test-utils] Network failure simulation disabled');
  };
}

/**
 * Creates a token file with specific values for testing.
 *
 * Useful for setting up specific test scenarios without going through OAuth.
 *
 * @param overrides - Fields to override in token data
 *
 * @example
 * await createTestTokenFile({
 *   accessToken: 'test_access_token',
 *   refreshToken: 'test_refresh_token',
 *   expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour from now
 * });
 */
export async function createTestTokenFile(overrides: {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  issuedAt?: number;
  scope?: string;
  encrypted?: boolean;
}): Promise<void> {
  const defaultTokenData = {
    accessToken: 'test_access_token_12345',
    refreshToken: 'test_refresh_token_67890',
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour from now
    issuedAt: Date.now(),
    scope: 'mall.read_product mall.write_product',
    encrypted: false,
    ...overrides,
  };

  try {
    await fs.mkdir(path.dirname(TOKEN_FILE), { recursive: true });
    await fs.writeFile(TOKEN_FILE, JSON.stringify(defaultTokenData, null, 2), 'utf8');
    console.log('[test-utils] Test token file created:', {
      expiresAt: new Date(defaultTokenData.expiresAt).toISOString(),
      encrypted: defaultTokenData.encrypted,
    });
  } catch (error) {
    console.error('[test-utils] Failed to create test token file:', error);
  }
}

/**
 * Checks if port is available for callback server.
 *
 * Useful for testing port-already-in-use scenario.
 *
 * @param port - Port number to check
 * @returns True if port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  const net = await import('node:net');

  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port, 'localhost');
  });
}

/**
 * Starts a dummy server on specified port to simulate port conflict.
 *
 * @param port - Port to occupy
 * @returns Function to close the dummy server
 *
 * @example
 * const closeServer = await occupyPort(3000);
 * // Try to start OAuth flow - callback server will fail
 * closeServer(); // Free the port
 */
export async function occupyPort(port: number): Promise<() => void> {
  const net = await import('node:net');
  const server = net.createServer();

  return new Promise((resolve, reject) => {
    server.once('error', (error) => {
      reject(error);
    });

    server.once('listening', () => {
      console.log(`[test-utils] Dummy server occupying port ${port}`);
      resolve(() => {
        server.close();
        console.log(`[test-utils] Dummy server on port ${port} closed`);
      });
    });

    server.listen(port, 'localhost');
  });
}

/**
 * Gets the token file path for manual inspection.
 *
 * @returns Absolute path to token file
 */
export function getTokenFilePath(): string {
  return TOKEN_FILE;
}

/**
 * Example IPC registration for test utilities.
 *
 * Add this to src/main/main.ts during testing:
 *
 * ```typescript
 * import * as authTestUtils from './services/auth-test-utils';
 *
 * if (process.env.NODE_ENV === 'development') {
 *   ipcMain.handle('test:corrupt-token', () => authTestUtils.corruptTokenFile());
 *   ipcMain.handle('test:expire-token', () => authTestUtils.expireAccessToken());
 *   ipcMain.handle('test:invalidate-refresh', () => authTestUtils.invalidateRefreshToken());
 *   ipcMain.handle('test:delete-token', () => authTestUtils.deleteTokenFile());
 *   ipcMain.handle('test:read-token', () => authTestUtils.readTokenFile());
 * }
 * ```
 *
 * Then expose in preload.ts:
 *
 * ```typescript
 * if (process.env.NODE_ENV === 'development') {
 *   contextBridge.exposeInMainWorld('testUtils', {
 *     corruptTokenFile: () => ipcRenderer.invoke('test:corrupt-token'),
 *     expireAccessToken: () => ipcRenderer.invoke('test:expire-token'),
 *     invalidateRefreshToken: () => ipcRenderer.invoke('test:invalidate-refresh'),
 *     deleteTokenFile: () => ipcRenderer.invoke('test:delete-token'),
 *     readTokenFile: () => ipcRenderer.invoke('test:read-token'),
 *   });
 * }
 * ```
 */
