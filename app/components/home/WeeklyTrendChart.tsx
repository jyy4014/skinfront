'use client'

import { useMemo } from 'react'
import { designTokens } from '@/app/styles/design-tokens'
import { calculateAverageScoreFromAnalysis } from '@/app/lib/utils/skinScores'

interface WeeklyTrendChartProps {
  analyses?: Array<{
    id: string
    created_at: string
    skin_condition_scores?: Record<string, number>
  }>
}

export default function WeeklyTrendChart({ analyses = [] }: WeeklyTrendChartProps) {
  const chartData = useMemo(() => {
    if (!analyses || analyses.length === 0) return []

    // 최근 7일 데이터 추출
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const recentAnalyses = analyses
      .filter((analysis) => {
        const analysisDate = new Date(analysis.created_at)
        return analysisDate >= sevenDaysAgo
      })
      .slice(0, 7)
      .map((analysis) => {
        const score = calculateAverageScoreFromAnalysis(analysis)
        return {
          date: new Date(analysis.created_at),
          score: score !== null && Number.isFinite(score) ? Math.round(score * 100) : null,
        }
      })
      .filter((item) => item.score !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    return recentAnalyses
  }, [analyses])

  if (chartData.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center">
        <p 
          className="text-xs"
          style={{ color: designTokens.colors.text.tertiary }}
        >
          최근 7일 데이터가 없습니다
        </p>
      </div>
    )
  }

  const maxScore = Math.max(...chartData.map((d) => d.score || 0))
  const minScore = Math.min(...chartData.map((d) => d.score || 0))
  const range = maxScore - minScore || 1

  const points = chartData.map((item, index) => {
    const x = (index / (chartData.length - 1 || 1)) * 100
    const normalizedScore = item.score !== null ? (item.score - minScore) / range : 0
    const y = 100 - normalizedScore * 80 - 10 // 상하 여백 10%
    return { x, y, score: item.score }
  })

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  return (
    <div className="h-24 relative">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* 배경 그리드 */}
        <defs>
          <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={designTokens.colors.primary[500]} stopOpacity="0.2" />
            <stop offset="100%" stopColor={designTokens.colors.primary[500]} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 영역 채우기 */}
        <path
          d={`${pathData} L ${points[points.length - 1].x} 100 L 0 100 Z`}
          fill="url(#trendGradient)"
        />

        {/* 라인 */}
        <path
          d={pathData}
          fill="none"
          stroke={designTokens.colors.primary[500]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 포인트 */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="2"
            fill={designTokens.colors.primary[500]}
            className="transition-all duration-300"
          />
        ))}
      </svg>

      {/* 최소/최대 점수 표시 */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs" style={{ color: designTokens.colors.text.tertiary }}>
        <span>{minScore}</span>
        <span>{maxScore}</span>
      </div>
    </div>
  )
}

