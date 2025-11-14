/**
 * 분석 결과 저장 전용 훅
 * Edge Function을 호출하여 결과 저장만 담당
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEdgeFunctionClient } from '../../../lib/api/edge-functions'
import type { SaveAnalysisResponse, AnalyzeResponse } from '../../../lib/api/edge-functions'
import { QUERY_KEYS } from '../../../lib/data'

export interface SaveAnalysisRequest {
  userId: string
  imageUrls: string[] // 3개 이미지 URL 배열
  imageAngles: ('front' | 'left' | 'right')[] // 각 이미지의 각도
  result: AnalyzeResponse
  accessToken: string
}

/**
 * 분석 결과 저장 훅
 */
export function useAnalysisSave() {
  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: async (
      request: SaveAnalysisRequest
    ): Promise<SaveAnalysisResponse> => {
      const edgeClient = createEdgeFunctionClient()
      return edgeClient.save({
        userId: request.userId,
        imageUrls: request.imageUrls, // 배열로 전송
        imageAngles: request.imageAngles, // 각 이미지의 각도
        result: {
          result_id: request.result.result_id!,
          analysis: request.result.analysis,
          mapping: request.result.mapping,
          nlg: request.result.nlg,
          review_needed: request.result.review_needed,
          stage_metadata: (request.result as any).stage_metadata,
        },
        accessToken: request.accessToken,
      })
    },
    onSuccess: () => {
      // 히스토리 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.analysis.history(),
      })
    },
  })

  return {
    saveAnalysis: saveMutation.mutateAsync,
    loading: saveMutation.isPending,
    error: saveMutation.error,
  }
}

