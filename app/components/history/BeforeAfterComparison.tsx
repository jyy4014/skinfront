'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AnalysisData {
  id: string
  created_at: string
  image_url?: string
  image_urls?: string[]
  stage_a_vision_result?: {
    skin_condition_scores?: Record<string, number>
  }
  analysis_data?: {
    analysis_a?: {
      skin_condition_scores?: Record<string, number>
    }
  }
}

interface BeforeAfterComparisonProps {
  analyses: AnalysisData[]
}

export function BeforeAfterComparison({ analyses }: BeforeAfterComparisonProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (analyses.length < 2) return null

  // 가장 오래된 것과 최근 것 비교
  const before = analyses[analyses.length - 1]
  const after = analyses[0]

  const beforeImage = before.image_url || before.image_urls?.[0]
  const afterImage = after.image_url || after.image_urls?.[0]

  const beforeScores =
    before.stage_a_vision_result?.skin_condition_scores ||
    before.analysis_data?.analysis_a?.skin_condition_scores ||
    {}
  const afterScores =
    after.stage_a_vision_result?.skin_condition_scores ||
    after.analysis_data?.analysis_a?.skin_condition_scores ||
    {}

  const conditionLabels: Record<string, string> = {
    pigmentation: '색소',
    acne: '여드름',
    redness: '홍조',
    pores: '모공',
    wrinkles: '주름',
  }

  const conditions = ['pigmentation', 'acne', 'redness', 'pores', 'wrinkles']

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Before / After 비교</h2>

      {/* 이미지 비교 */}
      {beforeImage && afterImage && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs text-gray-500 mb-2 text-center">
              {new Date(before.created_at).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <div className="rounded-xl overflow-hidden bg-gray-100 aspect-square">
              <img
                src={beforeImage}
                alt="Before"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center font-medium">Before</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 text-center">
              {new Date(after.created_at).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <div className="rounded-xl overflow-hidden bg-gray-100 aspect-square">
              <img
                src={afterImage}
                alt="After"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center font-medium">After</p>
          </div>
        </div>
      )}

      {/* 점수 비교 */}
      <div className="space-y-3">
        {conditions.map((condition) => {
          const beforeValue = Math.round((beforeScores[condition] || 0) * 100)
          const afterValue = Math.round((afterScores[condition] || 0) * 100)
          const change = afterValue - beforeValue
          const isImprovement = change < 0 // 낮을수록 좋음

          return (
            <div key={condition} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">
                  {conditionLabels[condition] || condition}
                </span>
                <span
                  className={`text-sm font-bold ${
                    isImprovement ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {isImprovement ? '↓' : '↑'} {Math.abs(change)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full transition-all"
                    style={{ width: `${beforeValue}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 w-12 text-right">
                  {beforeValue}%
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isImprovement ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${afterValue}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 w-12 text-right">
                  {afterValue}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        {new Date(before.created_at).toLocaleDateString('ko-KR')} →{' '}
        {new Date(after.created_at).toLocaleDateString('ko-KR')}
      </p>
    </div>
  )
}

