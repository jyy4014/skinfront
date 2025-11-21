'use client'

import { useState } from 'react'
import { useRequireAuth } from '@/app/lib/auth/hooks/useRequireAuth'
import { useAnalysisHistory } from '@/app/lib/data'
import { ArrowLeft, TrendingUp, Calendar, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/app/components/common/BottomNav'
import { LoadingSpinner, EmptyState } from '@/app/lib/ui'
import { AnalysisTrendChart } from '@/app/components/history/AnalysisTrendChart'
import { ImprovementSummary } from '@/app/components/history/ImprovementSummary'
import { BeforeAfterComparison } from '@/app/components/history/BeforeAfterComparison'
import { AnalysisHistoryItem } from '@/app/components/history/AnalysisHistoryItem'
import { HistoryFilters, SortOption, FilterOption } from '@/app/components/history/HistoryFilters'

type TimeRange = 'week' | 'month' | 'all'

export default function HistoryPage() {
  const auth = useRequireAuth()
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')

  const { data: analyses, isLoading } = useAnalysisHistory({
    filters: { limit: 100 }, // 충분한 데이터 가져오기
    user: auth.user,
    enabled: !!auth.user && !auth.loading,
  })

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner fullScreen message="로딩 중..." />
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
        <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 safe-area-top border-b border-gray-100">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <Link
              href="/home"
              prefetch={false}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">분석 히스토리</h1>
          </div>
        </header>
        <main className="max-w-md mx-auto px-4 py-12 space-y-4 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            로그인 후 분석 기록을 확인하세요
          </h2>
          <p className="text-gray-600">
            피부 분석 기록은 개인정보 보호를 위해 로그인한 사용자만 확인할 수 있습니다.
          </p>
          <Link
            href="/auth/login"
            prefetch={false}
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            로그인하기
          </Link>
        </main>
        <BottomNav />
      </div>
    )
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
  let filteredAnalyses = analyses.filter((analysis: any) => {
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

  // 신뢰도 필터링
  if (filterBy === 'high_confidence') {
    filteredAnalyses = filteredAnalyses.filter(
      (analysis: any) => (analysis.confidence || 0) >= 0.8
    )
  } else if (filterBy === 'low_confidence') {
    filteredAnalyses = filteredAnalyses.filter(
      (analysis: any) => (analysis.confidence || 0) < 0.8
    )
  }

  // 정렬
  filteredAnalyses = [...filteredAnalyses].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'confidence_high':
        return (b.confidence || 0) - (a.confidence || 0)
      case 'confidence_low':
        return (a.confidence || 0) - (b.confidence || 0)
      default:
        return 0
    }
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

        {/* 필터 및 정렬 */}
        <HistoryFilters
          sortBy={sortBy}
          onSortChange={setSortBy}
          filterBy={filterBy}
          onFilterChange={setFilterBy}
        />

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
              <AnalysisHistoryItem
                key={analysis.id}
                analysis={analysis}
              />
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

