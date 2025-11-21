export type SkinScoreMap = Record<string, number>

export function normalizeScoreValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (
    value &&
    typeof value === 'object' &&
    'score' in (value as Record<string, unknown>)
  ) {
    return normalizeScoreValue((value as Record<string, unknown>).score)
  }

  if (typeof value === 'string') {
    const sanitized = value.replace(/[^\d.-]/g, '')
    if (!sanitized) return null
    const parsed = Number(sanitized)
    return Number.isFinite(parsed) ? parsed : null
  }

  // null이나 undefined는 명시적으로 null 반환
  if (value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function normalizeSkinScores(
  scores?: Record<string, unknown> | null
): SkinScoreMap {
  if (!scores) return {}

  return Object.entries(scores).reduce<SkinScoreMap>((acc, [key, value]) => {
    const normalized = normalizeScoreValue(value)
    if (normalized !== null) {
      acc[key] = normalized
    }
    return acc
  }, {})
}

export function getSkinScoresFromAnalysis(analysis: any): SkinScoreMap {
  const source =
    analysis?.skin_condition_scores ||
    analysis?.stage_a_vision_result?.skin_condition_scores ||
    analysis?.analysis_data?.analysis_a?.skin_condition_scores ||
    null

  return normalizeSkinScores(source)
}

export function calculateAverageScore(
  scores?: Record<string, unknown> | null
): number | null {
  const normalized = normalizeSkinScores(scores)
  const values = Object.values(normalized)
  if (values.length === 0) return null
  const total = values.reduce((sum, value) => sum + value, 0)
  return total / values.length
}

export function calculateAverageScoreFromAnalysis(analysis: any): number | null {
  const normalized = getSkinScoresFromAnalysis(analysis)
  const values = Object.values(normalized)
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

