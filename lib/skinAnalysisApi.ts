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
 * 실시간 분석 진행 상태 타입
 */
export interface AnalysisProgress {
  stage: string
  progress: number
  message: string
  timestamp: number
}

/**
 * Gemini API를 통한 피부 분석 (실시간 진행 상태 지원)
 * @param imageBase64 - Base64 인코딩된 이미지
 * @param userId - 사용자 ID (선택)
 * @param onProgress - 진행 상태 콜백 함수 (선택)
 * @returns 분석 결과
 */
export async function analyzeWithGemini(
  imageBase64: string,
  userId?: string,
  onProgress?: (progress: AnalysisProgress) => void
): Promise<RealSkinAnalysisResult> {
  // 실시간 진행 상태 수신을 위한 EventSource 설정
  let eventSource: EventSource | null = null

  try {
    console.log('🤖 [Gemini API] Starting analysis with real-time progress...')
    const analysisBody = onProgress ? {
      image: imageBase64,
      userId: userId || null,
      analysisId: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // 진행 상태 추적용 ID
    } : {
      image: imageBase64,
      userId: userId || null,
    }

    if (onProgress && 'analysisId' in analysisBody) {
      console.log('🤖 [Gemini API] Setting up progress streaming:', analysisBody.analysisId)

      eventSource = new EventSource(`/api/analyze/progress?id=${analysisBody.analysisId}`)

      eventSource.onmessage = (event) => {
        try {
          const progress: AnalysisProgress = JSON.parse(event.data)
          console.log('🤖 [Gemini API] Progress update:', progress)
          onProgress(progress)
        } catch (error) {
          console.warn('🤖 [Gemini API] Failed to parse progress:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.warn('🤖 [Gemini API] Progress stream error:', error)
      }

      eventSource.addEventListener('complete', () => {
        console.log('🤖 [Gemini API] Progress streaming complete')
        eventSource?.close()
      })
    }

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('🤖 [Gemini API] Error response:', errorData)
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data: GeminiAnalysisResponse = await response.json()
    console.log('🤖 [Gemini API] Response:', data)

    // EventSource 정리
    if (eventSource) {
      eventSource.close()
      console.log('🤖 [Gemini API] EventSource closed')
    }

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

    // 에러 발생 시 EventSource 정리
    if (eventSource) {
      eventSource.close()
      console.log('🤖 [Gemini API] EventSource closed due to error')
    }

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




