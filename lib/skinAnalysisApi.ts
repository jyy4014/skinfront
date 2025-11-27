/**
 * 피부 분석 API 클라이언트
 * Gemini API를 호출하여 피부 분석을 수행합니다.
 */

import type { RealSkinAnalysisResult } from '@/app/utils/realSkinAnalysis'

export interface GeminiAnalysisResponse {
  totalScore: number
  details: {
    pigmentation: { score: number; grade: '양호' | '주의' | '위험' }
    acne: { score: number; grade: '양호' | '주의' | '위험' }
    wrinkles: { score: number; grade: '양호' | '주의' | '위험' }
    pores: { score: number; grade: '양호' | '주의' | '위험' }
  }
  primaryConcern: string
  doctorComment?: string
  reportId?: string
  imageUrl?: string
  warning?: string
  error?: string
}

/**
 * Gemini API를 통한 피부 분석
 * @param imageBase64 - Base64 인코딩된 이미지
 * @param userId - 사용자 ID (선택)
 * @returns 분석 결과
 */
export async function analyzeWithGemini(
  imageBase64: string,
  userId?: string
): Promise<RealSkinAnalysisResult> {
  try {
    console.log('🤖 [Gemini API] Calling /api/analyze...')
    
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        userId: userId || null,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('🤖 [Gemini API] Error response:', errorData)
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data: GeminiAnalysisResponse = await response.json()
    console.log('🤖 [Gemini API] Response:', data)

    // 응답 검증
    if (data.error) {
      throw new Error(data.error)
    }

    // Gemini 응답을 RealSkinAnalysisResult 형식으로 변환
    const result: RealSkinAnalysisResult = {
      totalScore: data.totalScore,
      details: {
        pigmentation: {
          score: data.details.pigmentation.score,
          grade: data.details.pigmentation.grade,
        },
        pores: {
          score: data.details.pores.score,
          grade: data.details.pores.grade,
        },
        wrinkles: {
          score: data.details.wrinkles.score,
          grade: data.details.wrinkles.grade,
        },
        acne: {
          score: data.details.acne.score,
          grade: data.details.acne.grade,
        },
      },
      primaryConcern: data.primaryConcern,
    }

    console.log('✅ [Gemini API] Analysis complete:', result)
    return result
  } catch (error) {
    console.error('❌ [Gemini API] Failed:', error)
    throw error
  }
}

/**
 * 분석 결과 타입 가드
 */
export function isValidAnalysisResult(data: unknown): data is GeminiAnalysisResponse {
  if (!data || typeof data !== 'object') return false
  
  const obj = data as Record<string, unknown>
  
  return (
    typeof obj.totalScore === 'number' &&
    typeof obj.details === 'object' &&
    obj.details !== null &&
    typeof obj.primaryConcern === 'string'
  )
}




