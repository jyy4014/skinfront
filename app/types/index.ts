// 공통 타입 정의

export type User = {
  id: string
  email: string
  name?: string
  birth_date?: string
  gender?: string
  created_at?: string
}

export type AnalysisMask = {
  label: string
  x: number
  y: number
  w: number
  h: number
}

export type AnalysisMetrics = {
  area_pct_by_label: Record<string, number>
  color_deltaE?: number
  redness_index?: number
}

export type AnalysisResult = {
  id: string
  user_id: string
  image_id?: string
  storage_path: string
  skin_condition_scores: Record<string, number>
  masks?: AnalysisMask[]
  metrics?: AnalysisMetrics
  confidence: number
  uncertainty: number
  model_version?: string
  created_at: string
  signed_thumbnail_url?: string
}

export type TreatmentCandidate = {
  id: string
  name: string
  score: number // 0-1 (증상 기반 적합도 점수)
  expected_improvement_pct?: number
  notes?: string[]
}

export type Treatment = {
  id: string
  name: string
  description: string
  benefits?: string
  cost?: number
  recovery_time?: string
  risk_level?: string
  duration_minutes?: number
  trend_score?: number
  popularity_score?: number
  search_count?: number
  click_count?: number
  last_trend_update?: string
}

export type SkinAnalysis = {
  id: string
  user_id: string
  image_url: string
  result_summary: string
  analysis_data?: {
    analysis_a?: any
    analysis_b?: {
      treatment_candidates?: TreatmentCandidate[]
    }
    analysis_c?: any
    confidence?: number
    uncertainty_estimate?: number
    review_needed?: boolean
    model_version?: string
    mapping_version?: string
  }
  recommended_treatments?: TreatmentCandidate[]
  created_at: string
  updated_at?: string
}

