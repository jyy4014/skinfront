/**
 * 분석 결과 타입 정의
 */
export interface AnalysisResult {
  id: string
  image_urls: string[] // 3개 이미지 URL 배열 (정면, 좌측, 우측)
  image_angles: FaceCaptureAngle[] // 각 이미지의 각도 정보
  analysis: {
    skin_condition_scores: Record<string, number>
    masks?: Array<{
      label: string
      x: number
      y: number
      w: number
      h: number
    }>
    metrics?: {
      area_pct_by_label: Record<string, number>
      color_deltaE?: number
    }
    confidence: number
    uncertainty: number
    model_version?: string
  }
  mapping: {
    treatment_candidates: Array<{
      id: string
      name: string
      score: number
      expected_improvement_pct?: number
      notes?: string[]
    }>
    mapping_version?: string
    applied_rules?: string[]
  }
  nlg: {
    headline: string
    paragraphs: string[]
    cta?: {
      label: string
      url: string
    }
  }
  review_needed?: boolean
}

/**
 * 얼굴 촬영 각도 타입
 */
export type FaceCaptureAngle = 'front' | 'left' | 'right'

/**
 * 얼굴 촬영 단계
 */
export interface FaceCaptureStep {
  angle: FaceCaptureAngle
  label: string
  instruction: string
  completed: boolean
  image?: File
  preview?: string
}
