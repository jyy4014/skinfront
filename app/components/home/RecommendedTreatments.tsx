'use client'

import Link from 'next/link'
import { designTokens } from '@/app/styles/design-tokens'
import { useRecommendedTreatments } from '@/app/lib/data/queries/treatment'

interface Treatment {
  id: string
  name: string
  description: string
  cost?: number | null
}

const formatCurrency = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  return `₩${value.toLocaleString('ko-KR')}`
}

export default function RecommendedTreatments() {
  const { data: treatments = [], isLoading: loading } = useRecommendedTreatments()

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`p-4 border-2 border-[color:var(--color-border-strong)] rounded-[var(--radius-lg)] animate-pulse`}>
            <div className={`h-4 bg-[color:var(--color-gray-200)] rounded-[var(--radius-sm)] mb-2`}></div>
            <div className={`h-3 bg-[color:var(--color-gray-200)] rounded-[var(--radius-sm)]`}></div>
          </div>
        ))}
      </div>
    )
  }

  if (treatments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm" style={{ color: designTokens.colors.text.secondary }}>
          추천 시술이 없습니다. 피부 분석을 시작해보세요!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {treatments.map((treatment) => (
          <Link
            key={treatment.id}
            href={`/treatments/${treatment.id}`}
            className="group p-4 rounded-xl border-2 transition-all hover:shadow-lg active:scale-[0.98]"
            style={{
              borderColor: designTokens.colors.border.strong,
              backgroundColor: designTokens.colors.surface.base,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = designTokens.colors.primary[500]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = designTokens.colors.border.strong
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 
                  className="font-semibold mb-1 group-hover:text-pink-600 transition-colors"
                  style={{ color: designTokens.colors.text.primary }}
                >
                  {treatment.name}
                </h4>
                <p 
                  className="text-sm mb-2 line-clamp-2"
                  style={{ color: designTokens.colors.text.secondary }}
                >
                  {treatment.description || '피부 개선에 도움이 됩니다'}
                </p>
                {formatCurrency(treatment.cost) && (
                  <p 
                    className="text-xs font-medium"
                    style={{ color: designTokens.colors.primary[600] }}
                  >
                    예상 비용: {formatCurrency(treatment.cost)}
                  </p>
                )}
              </div>
              <div 
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform"
                style={{ backgroundColor: designTokens.colors.primary[50] }}
              >
                <span className="text-lg">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

