/**
 * 분석 결과 저장 전용 훅
 * Edge Function을 호출하여 결과 저장만 담당
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEdgeFunctionClient } from '../../../lib/api/edge-functions'
import type { SaveAnalysisResponse, AnalyzeResponse } from '../../../lib/api/edge-functions'
import { QUERY_KEYS } from '../../../lib/data'
import { createClient } from '../../../lib/supabaseClient'
import { processImage } from '../../../lib/image/processing'

export interface SaveAnalysisRequest {
  userId: string
  imageUrls: string[] // 3개 이미지 URL 배열 (원본)
  imageAngles: ('front' | 'left' | 'right')[] // 각 이미지의 각도
  result: AnalyzeResponse
  accessToken: string
  onProgress?: (progress: number, message: string) => void // 저장 진행도 콜백
}

/**
 * 분석 결과 저장 훅
 */
export function useAnalysisSave() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const saveMutation = useMutation({
    mutationFn: async (
      request: SaveAnalysisRequest
    ): Promise<SaveAnalysisResponse> => {
      // P0-1: result_id 검증
      if (!request.result.result_id) {
        throw new Error('분석 결과 ID가 없습니다.')
      }

      // 성능 최적화: 저장 시에만 리사이즈된 이미지 생성 및 업로드
      // 원본 URL에서 이미지 다운로드 → 리사이즈 → 재업로드 → 리사이즈된 URL로 저장
      request.onProgress?.(10, '이미지 리사이즈 중...')
      
      const resizedImageUrls = await Promise.all(
        request.imageUrls.map(async (originalUrl, index) => {
          try {
            request.onProgress?.(
              Math.round(10 + (index / request.imageUrls.length) * 70),
              `${index + 1}/${request.imageUrls.length}개 이미지 리사이즈 중...`
            )

            // 원본 이미지 다운로드
            const response = await fetch(originalUrl)
            if (!response.ok) {
              throw new Error(`이미지 다운로드 실패: ${response.statusText}`)
            }
            const blob = await response.blob()
            const file = new File([blob], `image-${index}.jpg`, { type: blob.type })

            // 리사이즈 및 WebP 변환 (스토리지 절약)
            const processed = await processImage(file, {
              maxWidth: 1024,
              quality: 0.85, // 저장용은 약간 낮은 품질로 충분
              checkQuality: false,
            })

            // 리사이즈된 이미지 업로드
            const angle = request.imageAngles[index] || 'front'
            const fileExt = processed.file.type === 'image/webp' ? 'webp' : 'jpg'
            const timestamp = Date.now()
            const randomSuffix = Math.random().toString(36).substring(2, 9)
            const fileName = `${request.userId}/resized/${timestamp}-${index}-${randomSuffix}-${angle}.${fileExt}`
            
            const { error: uploadError } = await supabase.storage
              .from('skin-images')
              .upload(fileName, processed.file, {
                cacheControl: '3600',
                upsert: false,
              })

            if (uploadError) {
              console.warn(`리사이즈 이미지 업로드 실패, 원본 사용: ${uploadError.message}`)
              return originalUrl // 실패 시 원본 URL 반환
            }

            // 리사이즈된 이미지 URL 가져오기
            const { data: { publicUrl } } = supabase.storage
              .from('skin-images')
              .getPublicUrl(fileName)

            return publicUrl
          } catch (error) {
            console.error(`이미지 리사이즈 실패 (${index}), 원본 사용:`, error)
            return originalUrl // 실패 시 원본 URL 반환
          }
        })
      )
      
      request.onProgress?.(80, '분석 결과 저장 중...')

      // 원본 이미지는 UPDATE 방식으로 덮어쓰기되므로 삭제 불필요
      // 다음 분석 시 자동으로 덮어쓰기됨

      const edgeClient = createEdgeFunctionClient()
      return edgeClient.save({
        userId: request.userId,
        imageUrls: resizedImageUrls, // 리사이즈된 URL 배열로 저장
        imageAngles: request.imageAngles, // 각 이미지의 각도
        result: {
          result_id: request.result.result_id,
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

