'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/auth'
import { useAnalysisHistory } from '@/app/lib/data'
import { ArrowLeft, TrendingUp, Calendar, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/app/components/common/BottomNav'
import { LoadingSpinner, EmptyState } from '@/app/lib/ui'
import { AnalysisTrendChart } from '@/app/components/history/AnalysisTrendChart'
import { ImprovementSummary } from '@/app/components/history/ImprovementSummary'
import { BeforeAfterComparison } from '@/app/components/history/BeforeAfterComparison'

type TimeRange = 'week' | 'month' | 'all'

export default function HistoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState<TimeRange>('month')

  const { data: analyses, isLoading } = useAnalysisHistory({
    filters: { limit: 100 }, // 충분한 데이터 가져오기
  })

  if (!user) {
    router.push('/auth/login')
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner fullScreen message="로딩 중..." />
      </div>
    )
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
        <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 safe-area-top border-b border-gray-100">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <Link
              href="/home"
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">분석 히스토리</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <EmptyState
            icon="history"
            message="아직 분석 기록이 없습니다."
            description="첫 분석을 시작해보세요."
            action={
              <Link
                href="/analyze"
                className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                첫 분석 시작하기
              </Link>
            }
          />
        </main>

        <BottomNav />
      </div>
    )
  }

  // 시간 범위 필터링
  const now = new Date()
  const filteredAnalyses = analyses.filter((analysis: any) => {
    const analysisDate = new Date(analysis.created_at)
    if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return analysisDate >= weekAgo
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return analysisDate >= monthAgo
    }
    return true // 'all'
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 safe-area-top border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/home"
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">분석 히스토리</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 시간 범위 선택 */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex gap-2">
            {(['week', 'month', 'all'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === 'week' ? '주간' : range === 'month' ? '월간' : '전체'}
              </button>
            ))}
          </div>
        </div>

        {/* 개선 추이 요약 */}
        {filteredAnalyses.length >= 2 && (
          <ImprovementSummary analyses={filteredAnalyses} />
        )}

        {/* 추이 그래프 */}
        {filteredAnalyses.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-pink-600" />
              <h2 className="text-lg font-semibold text-gray-900">피부 상태 추이</h2>
            </div>
            <AnalysisTrendChart analyses={filteredAnalyses} />
          </div>
        )}

        {/* Before/After 비교 */}
        {filteredAnalyses.length >= 2 && (
          <BeforeAfterComparison analyses={filteredAnalyses} />
        )}

        {/* 분석 기록 리스트 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">분석 기록</h2>
          </div>
          <div className="space-y-4">
            {filteredAnalyses.map((analysis: any, index: number) => (
              <Link
                key={analysis.id}
                href={`/analysis/${analysis.id}`}
                className="block bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    <img
                      src={analysis.image_url || (analysis.image_urls?.[0])}
                      alt="분석 이미지"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 mb-2 line-clamp-2 text-sm">
                      {analysis.result_summary || '분석 결과'}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      {new Date(analysis.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {analysis.confidence && (
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          신뢰도 {Math.round(analysis.confidence * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

