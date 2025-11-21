'use client'

import { Activity, TrendingUp, AlertCircle } from 'lucide-react'
import { designTokens } from '@/app/styles/design-tokens'
import { useMemo } from 'react'
import Link from 'next/link'
import {
  calculateAverageScore,
  calculateAverageScoreFromAnalysis,
  getSkinScoresFromAnalysis,
} from '@/app/lib/utils/skinScores'

interface SkinSummaryCardProps {
  analyses?: Array<{
    id: string
    skin_condition_scores?: Record<string, number>
    created_at: string
  }>
}

export default function SkinSummaryCard({ analyses = [] }: SkinSummaryCardProps) {
  const summary = useMemo(() => {
    if (!analyses || analyses.length === 0) return null

    // 최근 분석의 평균 점수 계산
    const latest = analyses[0]
    const latestNormalized = getSkinScoresFromAnalysis(latest)
    if (Object.keys(latestNormalized).length === 0) return null

    const avgScore = calculateAverageScore(latestNormalized)
    if (avgScore === null) return null
    const overallScore = Math.round(avgScore * 100)

    // 주요 문제 영역 (점수가 높은 순)
    const topIssues = Object.entries(latestNormalized)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([key, value]) => ({
        label: key.replace('_', ' '),
        score: Math.round(value * 100),
      }))

    // 개선 추이 (최근 2개 분석 비교)
    let trend: 'up' | 'down' | 'stable' | null = null
    if (analyses.length >= 2) {
      const current = analyses[0]
      const previous = analyses[1]

      const currentAvg = calculateAverageScoreFromAnalysis(current)
      const previousAvg = calculateAverageScoreFromAnalysis(previous)

      if (currentAvg !== null && previousAvg !== null) {
        const diff = currentAvg - previousAvg
        if (Math.abs(diff) < 0.05) trend = 'stable'
        else if (diff > 0) trend = 'down' // 점수가 높을수록 나쁨
        else trend = 'up' // 점수가 낮을수록 좋음
      }
    }

    return {
      overallScore,
      topIssues,
      trend,
      status: overallScore >= 70 ? 'good' : overallScore >= 50 ? 'moderate' : 'needs_attention',
    }
  }, [analyses])

  if (!summary) {
    return (
      <div 
        className="rounded-2xl p-5 shadow-lg"
        style={{
          backgroundColor: designTokens.colors.surface.base,
          border: `1px solid ${designTokens.colors.border.subtle}`,
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5" style={{ color: designTokens.colors.gray[600] }} />
          <h3 className="text-lg font-semibold" style={{ color: designTokens.colors.text.primary }}>
            피부 상태 요약
          </h3>
        </div>
        <p 
          className="text-sm text-center py-8"
          style={{ color: designTokens.colors.text.secondary }}
        >
          분석 기록이 없습니다. 첫 분석을 시작해보세요!
        </p>
      </div>
    )
  }

  const statusConfig: Record<'good' | 'moderate' | 'needs_attention', {
    color: string
    bgColor: string
    label: string
    icon: typeof TrendingUp
  }> = {
    good: {
      color: designTokens.colors.success[500],
      bgColor: designTokens.colors.success[50],
      label: '양호',
      icon: TrendingUp,
    },
    moderate: {
      color: designTokens.colors.warning[500],
      bgColor: designTokens.colors.warning[50],
      label: '보통',
      icon: Activity,
    },
    needs_attention: {
      color: designTokens.colors.danger[500],
      bgColor: designTokens.colors.danger[50],
      label: '주의',
      icon: AlertCircle,
    },
  }

  const config = statusConfig[summary.status as keyof typeof statusConfig]
  const TrendIcon = config.icon

  return (
    <div 
      className="rounded-2xl p-5 shadow-lg"
      style={{
        backgroundColor: designTokens.colors.surface.base,
        border: `1px solid ${designTokens.colors.border.subtle}`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" style={{ color: designTokens.colors.gray[600] }} />
          <h3 className="text-lg font-semibold" style={{ color: designTokens.colors.text.primary }}>
            피부 상태 요약
          </h3>
        </div>
        <Link
          href="/history"
          prefetch={false}
          className="text-sm font-medium"
          style={{ color: designTokens.colors.primary[600] }}
        >
          전체 보기 →
        </Link>
      </div>

      {/* 전체 점수 - 원형 표시와 함께 */}
      <div className="flex flex-col items-center mb-6">
        <h2 
          className="text-sm font-medium mb-4"
          style={{ color: designTokens.colors.text.secondary }}
        >
          전체 피부 점수
        </h2>
        <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
          {/* Circular score indicator */}
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke={designTokens.colors.gray[200]}
              strokeWidth="8"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke={summary.overallScore >= 70 ? designTokens.colors.success[500] : summary.overallScore >= 50 ? designTokens.colors.warning[500] : designTokens.colors.danger[500]}
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - summary.overallScore / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className="text-3xl font-bold"
              style={{ color: designTokens.colors.text.primary }}
            >
              {summary.overallScore}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <TrendIcon className="w-4 h-4" style={{ color: config.color }} />
          <span 
            className="text-sm font-semibold"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
        </div>
        {summary.trend && (
          <p 
            className="text-xs"
            style={{ color: designTokens.colors.text.tertiary }}
          >
            {summary.trend === 'up' && '개선 중'}
            {summary.trend === 'down' && '주의 필요'}
            {summary.trend === 'stable' && '안정적'}
          </p>
        )}
      </div>

      {/* 주요 문제 영역 */}
      {summary.topIssues.length > 0 && (
        <div className="space-y-2">
          <p 
            className="text-sm font-medium"
            style={{ color: designTokens.colors.text.secondary }}
          >
            주요 문제 영역
          </p>
          <div className="flex flex-wrap gap-2">
            {summary.topIssues.map((issue, idx) => (
              <div
                key={idx}
                className="px-3 py-2 rounded-lg"
                style={{
                  backgroundColor: designTokens.colors.gray[100],
                }}
              >
                <span 
                  className="text-sm font-medium"
                  style={{ color: designTokens.colors.text.primary }}
                >
                  {issue.label}
                </span>
                <span 
                  className="text-sm ml-2"
                  style={{ color: designTokens.colors.text.secondary }}
                >
                  {issue.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

