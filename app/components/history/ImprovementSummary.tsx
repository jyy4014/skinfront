'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface AnalysisData {
  id: string
  created_at: string
  stage_a_vision_result?: {
    skin_condition_scores?: Record<string, number>
  }
  analysis_data?: {
    analysis_a?: {
      skin_condition_scores?: Record<string, number>
    }
  }
}

interface ImprovementSummaryProps {
  analyses: AnalysisData[]
}

interface ImprovementItem {
  label: string
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'same'
}

export function ImprovementSummary({ analyses }: ImprovementSummaryProps) {
  const improvements = useMemo(() => {
    if (analyses.length < 2) return []

    const conditionLabels: Record<string, string> = {
      pigmentation: '색소',
      acne: '여드름',
      redness: '홍조',
      pores: '모공',
      wrinkles: '주름',
    }

    // 첫 번째와 마지막 분석 비교
    const first = analyses[analyses.length - 1] // 가장 오래된 것
    const last = analyses[0] // 가장 최근 것

    const firstScores =
      first.stage_a_vision_result?.skin_condition_scores ||
      first.analysis_data?.analysis_a?.skin_condition_scores ||
      {}
    const lastScores =
      last.stage_a_vision_result?.skin_condition_scores ||
      last.analysis_data?.analysis_a?.skin_condition_scores ||
      {}

    const conditions = ['pigmentation', 'acne', 'redness', 'pores', 'wrinkles']
    const items: ImprovementItem[] = []

    conditions.forEach((condition) => {
      const firstValue = (firstScores[condition] || 0) * 100
      const lastValue = (lastScores[condition] || 0) * 100
      const change = lastValue - firstValue
      const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0

      // 점수가 낮을수록 좋은 것 (acne, redness, pores, wrinkles)
      // 점수가 높을수록 좋은 것 (pigmentation은 제외, 실제로는 낮을수록 좋음)
      // 일반적으로 모든 항목이 낮을수록 좋다고 가정
      const isImprovement = change < 0

      items.push({
        label: conditionLabels[condition] || condition,
        change: Math.abs(change),
        changePercent: Math.abs(changePercent),
        trend: changePercent > 5 ? 'down' : changePercent < -5 ? 'up' : 'same',
      })
    })

    return items
      .filter((item) => item.changePercent > 5) // 5% 이상 변화만 표시
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 3) // 상위 3개만
  }, [analyses])

  if (improvements.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">개선 추이 요약</h2>
      <div className="space-y-3">
        {improvements.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              {item.trend === 'down' ? (
                <TrendingDown className="w-5 h-5 text-green-600" />
              ) : item.trend === 'up' ? (
                <TrendingUp className="w-5 h-5 text-red-600" />
              ) : (
                <Minus className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">
                  {item.changePercent.toFixed(1)}% 변화
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-lg font-bold ${
                  item.trend === 'down' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {item.trend === 'down' ? '↓' : item.trend === 'up' ? '↑' : '→'}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-4 text-center">
        가장 오래된 분석과 최근 분석을 비교한 결과입니다.
      </p>
    </div>
  )
}

