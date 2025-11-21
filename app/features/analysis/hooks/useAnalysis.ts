/**
 * AI 분석 전용 훅
 * Edge Function을 호출하여 분석만 담당
 */

'use client'

import { useMutation } from '@tanstack/react-query'
import { createEdgeFunctionClient } from '../../../lib/api/edge-functions'
import type { AnalyzeResponse } from '../../../lib/api/edge-functions'

export interface AnalyzeOptions {
  onProgress?: (progress: number, message: string) => void
  onRetry?: (attempt: number, maxRetries: number, delay: number) => void
}

export interface AnalyzeRequest {
  imageUrls: string[] // 이미지 URL 배열 (최소 1개, 정면 필수, 좌/우 선택사항)
  imageAngles: ('front' | 'left' | 'right')[] // 각 이미지의 각도
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
      const { onProgress, onRetry } = options
      
      // Step 1: 피부 질감 분석 (0-33%)
      onProgress?.(0, 'Step 1: 피부 질감 분석 중...')
      await new Promise(resolve => setTimeout(resolve, 300)) // 시각적 피드백을 위한 짧은 지연

      const edgeClient = createEdgeFunctionClient()
      
      // Step 2: 색소 분석 (33-66%)
      onProgress?.(33, 'Step 2: 색소 분석 중...')
      
      const result = await edgeClient.analyze({
        image_urls: request.imageUrls, // 배열로 전송
        image_angles: request.imageAngles, // 각 이미지의 각도
        user_id: request.userId,
        accessToken: request.accessToken,
        user_profile: request.userProfile,
        meta: request.meta,
      }, onRetry)

      // Step 3: 트러블 예측 (66-100%)
      onProgress?.(66, 'Step 3: 트러블 예측 중...')

      // 응답에 에러가 있는지 확인
      if (result.status === 'error') {
        throw new Error(result.error || 'AI 분석 중 오류가 발생했습니다.')
      }

      onProgress?.(100, '분석 완료!')

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

