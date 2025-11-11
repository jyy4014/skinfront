/**
 * AI 분석 전용 훅
 * Edge Function을 호출하여 분석만 담당
 */

'use client'

import { useMutation } from '@tanstack/react-query'
import { createEdgeFunctionClient } from '../../../lib/api'
import type { AnalyzeResponse } from '../../../lib/api'

export interface AnalyzeOptions {
  onProgress?: (progress: number, message: string) => void
}

export interface AnalyzeRequest {
  imageUrl: string
  userId: string
  accessToken: string
  userProfile?: Record<string, any>
  meta?: { camera?: string; orientation?: number }
}

/**
 * AI 분석 훅
 */
export function useAnalysis() {
  const analyzeMutation = useMutation({
    mutationFn: async ({
      request,
      options = {},
    }: {
      request: AnalyzeRequest
      options?: AnalyzeOptions
    }): Promise<AnalyzeResponse> => {
      const { onProgress } = options
      onProgress?.(60, '피부 질감 분석 중...')

      const edgeClient = createEdgeFunctionClient()
      const result = await edgeClient.analyze({
        image_url: request.imageUrl,
        user_id: request.userId,
        accessToken: request.accessToken,
        user_profile: request.userProfile,
        meta: request.meta,
      })

      onProgress?.(80, '색소 분석 중...')

      // 응답에 에러가 있는지 확인
      if (result.status === 'error') {
        throw new Error(result.error || 'AI 분석 중 오류가 발생했습니다.')
      }

      onProgress?.(90, '트러블 예측 중...')

      return result
    },
  })

  return {
    analyze: (request: AnalyzeRequest, options?: AnalyzeOptions) =>
      analyzeMutation.mutateAsync({ request, options }),
    loading: analyzeMutation.isPending,
    error: analyzeMutation.error,
  }
}

