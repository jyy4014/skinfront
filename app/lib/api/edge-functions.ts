/**
 * Supabase Edge Functions 전용 클라이언트
 */

import { callEdgeFunction } from './client'
import { EDGE_FUNCTIONS } from '../config'
import type { AnalysisResult, SkinAnalysis } from '@/app/types'

export interface AnalyzeRequest {
  image_urls: string[] // 3개 이미지 URL 배열 (정면, 좌측, 우측)
  image_angles: ('front' | 'left' | 'right')[] // 각 이미지의 각도 정보
  user_id: string
  accessToken: string
  user_profile?: Record<string, any>
  meta?: { camera?: string; orientation?: number }
}

export interface AnalyzeResponse {
  status: 'success' | 'error'
  result_id?: string
  analysis?: any
  mapping?: any
  nlg?: any
  review_needed?: boolean
  heatmap_signed_url?: string
  error?: string
  error_type?: string
}

export interface SaveAnalysisRequest {
  userId: string
  imageUrls: string[] // 3개 이미지 URL 배열
  imageAngles: ('front' | 'left' | 'right')[] // 각 이미지의 각도
  result: {
    result_id: string
    analysis: any
    mapping: any
    nlg: any
    review_needed?: boolean
    stage_metadata?: any
  }
  accessToken: string
}

export interface SaveAnalysisResponse {
  status: 'success' | 'error'
  id?: string
  error?: string
}

export interface EdgeFunctionClient {
  analyze(request: AnalyzeRequest): Promise<AnalyzeResponse>
  save(request: SaveAnalysisRequest): Promise<SaveAnalysisResponse>
}

/**
 * Edge Function 클라이언트 생성
 */
export function createEdgeFunctionClient(): EdgeFunctionClient {
  return {
    async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
      return callEdgeFunction<AnalyzeResponse>(EDGE_FUNCTIONS.ANALYZE, {
        method: 'POST',
        body: {
          image_urls: request.image_urls, // 배열로 전송
          image_angles: request.image_angles, // 각 이미지의 각도
          user_id: request.user_id,
          access_token: request.accessToken,
          user_profile: request.user_profile,
          meta: request.meta,
        },
        accessToken: request.accessToken,
        retry: {
          enabled: true,
          maxRetries: 3,
          initialDelay: 1000,
        },
      })
    },

    async save(request: SaveAnalysisRequest): Promise<SaveAnalysisResponse> {
      return callEdgeFunction<SaveAnalysisResponse>(EDGE_FUNCTIONS.ANALYZE_SAVE, {
        method: 'POST',
        body: {
          user_id: request.userId,
          image_urls: request.imageUrls, // 배열로 전송
          image_angles: request.imageAngles, // 각 이미지의 각도
          result_id: request.result.result_id,
          analysis_a: request.result.analysis,
          analysis_b: request.result.mapping,
          analysis_c: request.result.nlg,
          confidence: request.result.analysis?.confidence || 0.8,
          uncertainty_estimate:
            request.result.analysis?.uncertainty_estimate || 0.2,
          review_needed: request.result.review_needed || false,
          stage_metadata: request.result.stage_metadata || {},
          access_token: request.accessToken,
        },
        accessToken: request.accessToken,
      })
    },
  }
}

