'use client'

import { useAnalysisHistory } from '@/app/lib/data'
import { BarChart3, Calendar, TrendingUp, Sparkles } from 'lucide-react'
import { designTokens } from '@/app/styles/design-tokens'
import Link from 'next/link'
import { calculateAverageScoreFromAnalysis } from '@/app/lib/utils/skinScores'

interface ProfileStatsProps {
  userId: string
}

export default function ProfileStats({ userId }: ProfileStatsProps) {
  const { data: analyses, isLoading } = useAnalysisHistory({
    filters: { limit: 100 }, // 최근 100개 분석 가져오기
    user: { id: userId },
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[color:var(--color-surface-muted)] rounded-[var(--radius-xl)] p-4 animate-pulse"
          >
            <div className="h-4 bg-[color:var(--color-gray-300)] rounded w-1/2 mb-2" />
            <div className="h-8 bg-[color:var(--color-gray-300)] rounded w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  const totalAnalyses = analyses?.length || 0
  const thisMonthAnalyses =
    analyses?.filter((analysis: any) => {
      const analysisDate = new Date(analysis.created_at)
      const now = new Date()
      return (
        analysisDate.getMonth() === now.getMonth() &&
        analysisDate.getFullYear() === now.getFullYear()
      )
    }).length || 0

  const lastAnalysisDate = analyses?.[0]?.created_at
    ? new Date(analyses[0].created_at)
    : null

  const formatDate = (date: Date) => {
    const today = new Date()
    const diffTime = today.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '어제'
    if (diffDays < 7) return `${diffDays}일 전`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  }

  const stats = [
    {
      icon: BarChart3,
      label: '총 분석 횟수',
      value: totalAnalyses,
      unit: '회',
      color: 'primary',
      link: '/history',
    },
    {
      icon: Calendar,
      label: '이번 달',
      value: thisMonthAnalyses,
      unit: '회',
      color: 'secondary',
      link: '/history',
    },
    {
      icon: TrendingUp,
      label: '마지막 분석',
      value: lastAnalysisDate ? formatDate(lastAnalysisDate) : '없음',
      unit: '',
      color: 'success',
      link: lastAnalysisDate ? `/analysis/${analyses?.[0]?.id}` : '/analyze',
    },
    {
      icon: Sparkles,
      label: '평균 점수',
      value:
        analyses && analyses.length > 0
          ? Math.round(
              (analyses.reduce((acc: number, analysis: any) => {
                const avg =
                  calculateAverageScoreFromAnalysis(analysis) ?? 0
                return acc + avg
              }, 0) /
                analyses.length) *
                100
            )
          : 0,
      unit: '%',
      color: 'warning',
      link: '/history',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const colorMap = {
          primary: designTokens.colors.primary[600],
          secondary: designTokens.colors.accent[600],
          success: designTokens.colors.success[600],
          warning: designTokens.colors.warning[600],
        }

        const content = (
          <div
            className={`bg-[color:var(--color-surface)] border border-[color:var(--color-border-subtle)] rounded-[var(--radius-xl)] p-4 hover:shadow-[var(--shadow-elevated)] transition-all`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="p-2 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: `${colorMap[stat.color as keyof typeof colorMap]}20` }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: colorMap[stat.color as keyof typeof colorMap] }}
                />
              </div>
              <span className={`text-xs text-[color:var(--color-text-tertiary)]`}>
                {stat.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-2xl font-bold text-[color:var(--color-text-primary)]`}
              >
                {stat.value}
              </span>
              {stat.unit && (
                <span className={`text-sm text-[color:var(--color-text-secondary)]`}>
                  {stat.unit}
                </span>
              )}
            </div>
          </div>
        )

        if (stat.link) {
          return (
            <Link
              key={index}
              href={stat.link}
              prefetch={stat.link === '/history' ? false : undefined}
            >
              {content}
            </Link>
          )
        }

        return <div key={index}>{content}</div>
      })}
    </div>
  )
}

