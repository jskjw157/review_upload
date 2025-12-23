/**
 * 브라우저 환경에서 테스트를 위한 Mock API
 * Electron 환경에서는 preload.ts의 실제 API가 사용됨
 */

import type { 
  AuthChannelResponse, 
  BulkChannelResponse, 
  ReviewChannelResponse 
} from '../../types/ipc'
import type { OAuthConfig } from '../../main/services/auth'
import type { ReviewInput } from '../../types/review'

// 가짜 토큰 저장소
let mockTokens: { accessToken: string; refreshToken: string } | null = null

const mockApi = {
  exchangeAuthCode: async (payload: { code: string; config: OAuthConfig }): Promise<AuthChannelResponse> => {
    // 시뮬레이션 딜레이
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (!payload.code || payload.code.length < 4) {
      return {
        success: false,
        message: '[Mock] 유효하지 않은 인증 코드입니다. (4자 이상 입력)',
      }
    }

    // 성공 시뮬레이션
    mockTokens = {
      accessToken: `mock_access_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
    }

    return {
      success: true,
      message: '[Mock] 로그인 성공! (테스트 모드)',
    }
  },

  refreshTokens: async (_config: OAuthConfig): Promise<AuthChannelResponse> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (!mockTokens) {
      return {
        success: false,
        message: '[Mock] 저장된 토큰이 없습니다.',
      }
    }

    return {
      success: true,
      message: '[Mock] 토큰 갱신 완료',
    }
  },

  loadStoredTokens: async (): Promise<AuthChannelResponse> => {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (!mockTokens) {
      return {
        success: false,
        message: '[Mock] 저장된 토큰이 없습니다.',
      }
    }

    return {
      success: true,
      message: '[Mock] 저장된 토큰 로드 완료',
    }
  },

  submitReview: async (payload: { input: ReviewInput; config: OAuthConfig }): Promise<ReviewChannelResponse> => {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (!mockTokens) {
      return {
        success: false,
        message: '[Mock] 로그인이 필요합니다.',
        needsReauth: true,
      }
    }

    return {
      success: true,
      message: `[Mock] 리뷰 등록 완료! (상품: ${payload.input.productId}, 별점: ${payload.input.score})`,
      historyEntry: {
        type: '단건 리뷰',
        status: 'success',
        timestamp: new Date().toLocaleString('ko-KR'),
      },
    }
  },

  uploadBulk: async (payload: { fileName: string; fileBuffer: ArrayBuffer; config: OAuthConfig }): Promise<BulkChannelResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    if (!mockTokens) {
      return {
        success: false,
        message: '[Mock] 로그인이 필요합니다.',
        needsReauth: true,
      }
    }

    return {
      success: true,
      message: `[Mock] ${payload.fileName} 일괄 업로드 완료!`,
      historyEntry: {
        type: `일괄 업로드 (${payload.fileName})`,
        status: 'success',
        timestamp: new Date().toLocaleString('ko-KR'),
      },
    }
  },
}

/**
 * Electron 환경이면 실제 API, 브라우저면 Mock API 반환
 */
export function getReviewApi() {
  // Electron preload가 주입한 API가 있으면 사용
  if (typeof window !== 'undefined' && window.reviewApi) {
    console.log('[API] Using Electron IPC API')
    return window.reviewApi
  }

  // 브라우저 환경 - Mock API 사용
  console.log('[API] Using Mock API (Browser mode)')
  return mockApi
}


