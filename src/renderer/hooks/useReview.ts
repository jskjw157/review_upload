import { useState, useCallback, useMemo } from 'react'
import type { OAuthConfig } from '../../main/services/auth'
import type { ReviewInput, HistoryEntry } from '../../types/review'
import { getReviewApi } from '@/lib/mockApi'

interface UseReviewOptions {
  config: OAuthConfig
  isLoggedIn: boolean
  onTokenExpired: () => void
}

export function useReview({ config, isLoggedIn, onTokenExpired }: UseReviewOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  
  // Mock 또는 실제 API 선택
  const api = useMemo(() => getReviewApi(), [])

  const addHistoryEntry = useCallback((entry: HistoryEntry) => {
    setHistory(prev => [entry, ...prev])
  }, [])

  const submitReview = useCallback(async (input: ReviewInput) => {
    if (!isLoggedIn) {
      setMessage('로그인이 필요합니다. OAuth 2.0 인증 후 다시 시도하세요.')
      return false
    }

    setIsSubmitting(true)
    setMessage('리뷰 등록 요청 중…')

    try {
      const response = await api.submitReview({ input, config })
      setMessage(response.message)

      if (response.historyEntry) {
        addHistoryEntry(response.historyEntry)
      }

      if (response.needsReauth) {
        onTokenExpired()
      }

      return response.success
    } finally {
      setIsSubmitting(false)
    }
  }, [config, isLoggedIn, onTokenExpired, addHistoryEntry, api])

  const uploadBulk = useCallback(async (file: File) => {
    if (!isLoggedIn) {
      setMessage('로그인이 필요합니다. OAuth 2.0 인증 후 다시 시도하세요.')
      return false
    }

    setIsSubmitting(true)
    setMessage(`${file.name} 처리 중…`)

    try {
      const response = await api.uploadBulk({
        fileName: file.name,
        fileBuffer: await file.arrayBuffer(),
        config,
      })

      setMessage(response.message)

      if (response.historyEntry) {
        addHistoryEntry(response.historyEntry)
      }

      if (response.needsReauth) {
        onTokenExpired()
      }

      return response.success
    } finally {
      setIsSubmitting(false)
    }
  }, [config, isLoggedIn, onTokenExpired, addHistoryEntry, api])

  const clearMessage = useCallback(() => {
    setMessage('')
  }, [])

  return {
    isSubmitting,
    message,
    history,
    submitReview,
    uploadBulk,
    clearMessage,
  }
}
