'use client'

import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Link from 'next/link'
import { designTokens } from '@/app/styles/design-tokens'
import { useMemo } from 'react'
import {
  calculateAverageScore,
  getSkinScoresFromAnalysis,
  normalizeSkinScores,
} from '@/app/lib/utils/skinScores'

interface RecentAnalysisCardProps {
  analysis: {
    id: string
    image_url: string
    result_summary: string
    created_at: string
    skin_condition_scores?: Record<string, unknown>
    previousScores?: Record<string, number>
  }
}

export default function RecentAnalysisCard({ analysis }: RecentAnalysisCardProps) {
  const normalizedScores = useMemo(
    () => getSkinScoresFromAnalysis(analysis),
    [analysis]
  )

  const mainScore = useMemo(() => {
    const avg = calculateAverageScore(normalizedScores)
    return avg !== null ? Math.round(avg * 100) : null
  }, [normalizedScores])

  const trend = useMemo(() => {
    if (!Object.keys(normalizedScores).length || !analysis.previousScores)
      return null

    const previousValues = normalizeSkinScores(analysis.previousScores)
    const currentAvg = calculateAverageScore(normalizedScores)
    const previousAvg = calculateAverageScore(previousValues)
    if (currentAvg === null || previousAvg === null) return null

    const diff = currentAvg - previousAvg
    if (!Number.isFinite(diff)) return null
    if (Math.abs(diff) < 0.05) return { type: 'neutral', value: 0 }
    if (diff > 0) return { type: 'up', value: Math.round(diff * 100) }
    return { type: 'down', value: Math.round(Math.abs(diff) * 100) }
  }, [normalizedScores, analysis.previousScores])

  const topIssues = useMemo(() => {
    const entries = Object.entries(normalizedScores)
    return entries
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([label, score]) => ({
        label: label.replace('_', ' '),
        score: Math.round(score * 100),
      }))
  }, [normalizedScores])

  // 7-day trend 계산 (최근 7일간의 데이터가 있다면)
  const sevenDayTrend = useMemo(() => {
    // 이 컴포넌트는 단일 분석만 받으므로, 추세는 상위 컴포넌트에서 계산되어 전달되어야 함
    // 여기서는 null 반환 (실제 구현은 상위 컴포넌트에서)
    return null
  }, [])

  return (
    <div 
      className="rounded-2xl p-5 shadow-lg"
      style={{
        backgroundColor: designTokens.colors.surface.base,
        border: `1px solid ${designTokens.colors.border.subtle}`,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5" style={{ color: designTokens.colors.gray[600] }} />
        <h3 className="text-lg font-semibold" style={{ color: designTokens.colors.text.primary }}>
          최근 분석 결과
        </h3>
      </div>

      <Link 
        href={`/analysis/${analysis.id}`}
        prefetch={false}
        className="focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 rounded-xl block"
        aria-label={`최근 분석 결과 보기: ${analysis.result_summary}`}
      >
        <div className="flex gap-4 active:scale-[0.98] transition-transform">
          {/* 이미지 썸네일 */}
          <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
            <img
              src={analysis.image_url}
              alt="분석 이미지"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.image-placeholder')) {
                  const placeholder = document.createElement('div');
                  placeholder.className = 'image-placeholder flex items-center justify-center h-full bg-gray-100';
                  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                  icon.setAttribute('class', 'w-8 h-8 text-gray-400');
                  icon.setAttribute('fill', 'none');
                  icon.setAttribute('viewBox', '0 0 24 24');
                  icon.setAttribute('stroke', 'currentColor');
                  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                  path.setAttribute('d', 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z');
                  path.setAttribute('stroke-linecap', 'round');
                  path.setAttribute('stroke-linejoin', 'round');
                  path.setAttribute('stroke-width', '2');
                  icon.appendChild(path);
                  placeholder.appendChild(icon);
                  parent.appendChild(placeholder);
                }
              }}
              loading="lazy"
            />
            {mainScore !== null && (
              <div 
                className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold text-white shadow-lg"
                style={{
                  backgroundColor: mainScore >= 70 ? designTokens.colors.success[500] : 
                                  mainScore >= 50 ? designTokens.colors.warning[500] : 
                                  designTokens.colors.danger[500],
                }}
              >
                {mainScore}점
              </div>
            )}
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <p 
              className="mb-2 line-clamp-2 text-sm leading-relaxed"
              style={{ color: designTokens.colors.text.primary }}
            >
              {analysis.result_summary}
            </p>
            
            {/* 주요 지표 */}
            {topIssues.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {topIssues.map((issue, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: designTokens.colors.gray[100],
                      color: designTokens.colors.text.secondary,
                    }}
                  >
                    {issue.label} {issue.score}%
                  </span>
                ))}
              </div>
            )}

            {/* 트렌드 */}
            {trend && (
              <div className="flex items-center gap-1 mb-2">
                {trend.type === 'up' && (
                  <>
                    <TrendingUp className="w-4 h-4" style={{ color: designTokens.colors.success[500] }} />
                    <span className="text-xs" style={{ color: designTokens.colors.success[600] }}>
                      {trend.value}% 개선
                    </span>
                  </>
                )}
                {trend.type === 'down' && (
                  <>
                    <TrendingDown className="w-4 h-4" style={{ color: designTokens.colors.danger[500] }} />
                    <span className="text-xs" style={{ color: designTokens.colors.danger[600] }}>
                      {trend.value}% 악화
                    </span>
                  </>
                )}
                {trend.type === 'neutral' && (
                  <>
                    <Minus className="w-4 h-4" style={{ color: designTokens.colors.gray[500] }} />
                    <span className="text-xs" style={{ color: designTokens.colors.text.secondary }}>
                      변화 없음
                    </span>
                  </>
                )}
              </div>
            )}

            <p 
              className="text-xs mb-2"
              style={{ color: designTokens.colors.text.tertiary }}
            >
              {new Date(analysis.created_at).toLocaleDateString('ko-KR')}
            </p>
            
            <span 
              className="text-sm font-medium inline-block"
              style={{ color: designTokens.colors.primary[600] }}
              aria-hidden="true"
            >
              자세히 보기 →
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}


