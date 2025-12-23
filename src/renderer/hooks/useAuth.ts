import { useState, useCallback, useEffect, useMemo } from 'react'
import type { OAuthFlowConfig } from '../../main/services/auth'
import { getReviewApi } from '@/lib/mockApi'

interface AuthState {
  isLoggedIn: boolean
  statusMessage: string
}

const defaultAuthConfig: OAuthFlowConfig = {
  mallId: import.meta.env.VITE_CAFE24_MALL_ID ?? '',
  clientId: import.meta.env.VITE_CAFE24_CLIENT_ID ?? '',
  clientSecret: import.meta.env.VITE_CAFE24_CLIENT_SECRET ?? '',
  redirectUri: import.meta.env.VITE_CAFE24_REDIRECT_URI ?? '',
  scope: import.meta.env.VITE_CAFE24_SCOPE ?? '',
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    statusMessage: '로그아웃 상태',
  })
  const [config] = useState<OAuthFlowConfig>(defaultAuthConfig)

  // Mock 또는 실제 API 선택
  const api = useMemo(() => getReviewApi(), [])

  const hasValidConfig = useCallback(() => {
    return Boolean(
      config.mallId && config.clientId && config.clientSecret && config.redirectUri && config.scope
    )
  }, [config])

  /**
   * Initiates the OAuth login flow.
   *
   * EDGE CASES HANDLED:
   * - Missing OAuth configuration (env variables not set)
   * - Browser fails to open
   * - User cancels authorization
   * - Network errors during token exchange
   * - Callback server fails to start (port in use)
   * - State validation failure (CSRF attack)
   * - Timeout (user takes too long to authorize)
   *
   * USER FEEDBACK:
   * - Clear status messages at each step
   * - Specific error messages for different failure modes
   * - Actionable guidance (e.g., "check network", "close other apps")
   */
  const login = useCallback(async () => {
    // Edge Case 1: Configuration validation
    if (!hasValidConfig()) {
      // Provide specific guidance on what's missing
      const missing = []
      if (!config.mallId) missing.push('VITE_CAFE24_MALL_ID')
      if (!config.clientId) missing.push('VITE_CAFE24_CLIENT_ID')
      if (!config.clientSecret) missing.push('VITE_CAFE24_CLIENT_SECRET')
      if (!config.redirectUri) missing.push('VITE_CAFE24_REDIRECT_URI')
      if (!config.scope) missing.push('VITE_CAFE24_SCOPE')

      setAuthState({
        isLoggedIn: false,
        statusMessage: `환경 변수 설정 필요: ${missing.join(', ')}`,
      })
      return
    }

    setAuthState(prev => ({ ...prev, statusMessage: '브라우저 열기 중…' }))

    try {
      const oauthConfig: OAuthFlowConfig = {
        ...config,
      }

      const result = await window.reviewApi.startOAuthFlow(oauthConfig)

      if (result.success) {
        setAuthState({
          isLoggedIn: true,
          statusMessage: '로그인 완료!',
        })
      } else {
        // Edge Case 2-7: Handle specific error codes with actionable feedback
        let userMessage = result.message

        // Enhance message based on error code
        if (result.errorCode === 'timeout' || result.errorCode === 'user_cancelled') {
          userMessage = '인증이 취소되었습니다. 다시 시도하려면 로그인 버튼을 클릭하세요.'
        } else if (result.errorCode === 'state_mismatch') {
          userMessage = '보안 검증 실패. 다시 시도해주세요. (CSRF 보호 활성화됨)'
        } else if (result.errorCode === 'network_error') {
          userMessage = result.message + ' 인터넷 연결 상태를 확인하고 다시 시도하세요.'
        } else if (result.errorCode === 'auth_error') {
          // Could be invalid credentials, wrong mall ID, etc.
          userMessage = result.message + ' Client ID와 Mall ID가 올바른지 확인하세요.'
        }

        setAuthState({
          isLoggedIn: false,
          statusMessage: userMessage,
        })

        // Log for debugging
        console.error('[useAuth] Login failed:', {
          errorCode: result.errorCode,
          message: result.message,
        })
      }
    } catch (error) {
      // Edge Case 8: Unexpected errors (should rarely happen)
      console.error('[useAuth] Unexpected error in login:', error)

      setAuthState({
        isLoggedIn: false,
        statusMessage: '로그인 중 예기치 않은 오류가 발생했습니다. 앱을 재시작해보세요.',
      })
    }
  }, [config, hasValidConfig])

  /**
   * Restores authentication state from stored tokens on app startup.
   *
   * EDGE CASES HANDLED:
   * - No token file exists (first-time user)
   * - Token file is corrupted or invalid
   * - Decryption failure (wrong encryption key)
   * - Token is expired (will trigger refresh on first API call)
   *
   * USER FEEDBACK:
   * - Silent success (user doesn't need to know tokens were restored)
   * - Clear message if restoration fails (logout state)
   */
  const restoreAuthState = useCallback(async () => {
    try {
      const stored = await api.loadStoredTokens()

      if (stored.success) {
        // Success - tokens loaded from disk
        setAuthState({
          isLoggedIn: true,
          statusMessage: '로그인 완료 (저장된 토큰)',
        })
        console.log('[useAuth] Tokens restored successfully from disk')
      } else {
        // Edge cases: no file, corrupted file, decryption failure
        // User will need to login
        setAuthState({
          isLoggedIn: false,
          statusMessage: '로그아웃 상태',
        })

        // Log reason for debugging
        if (stored.reason === 'missing_tokens') {
          console.log('[useAuth] No stored tokens found (first-time user or token deleted)')
        } else if (stored.reason === 'storage_error') {
          console.warn('[useAuth] Failed to read token file:', stored.message)
        }
      }
    } catch (error) {
      // Edge Case: Unexpected error (IPC failure, etc.)
      console.error('[useAuth] Unexpected error restoring auth state:', error)
      setAuthState({
        isLoggedIn: false,
        statusMessage: '로그아웃 상태',
      })
    }
  }, [api])

  const handleTokenExpired = useCallback(() => {
    setAuthState({
      isLoggedIn: false,
      statusMessage: '토큰이 만료되어 로그아웃되었습니다. 다시 로그인하세요.',
    })
  }, [])

  useEffect(() => {
    void restoreAuthState()
  }, [restoreAuthState])

  return {
    ...authState,
    config,
    login,
    handleTokenExpired,
  }
}
