'use client'

import { Camera, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { designTokens } from '@/app/styles/design-tokens'
import { useMemo } from 'react'

interface DailyAnalysisCTAProps {
  lastAnalysisDate?: string | null
  todayAnalysisCount?: number
}

export default function DailyAnalysisCTA({ 
  lastAnalysisDate, 
  todayAnalysisCount = 0 
}: DailyAnalysisCTAProps) {
  const timeSinceLastAnalysis = useMemo(() => {
    if (!lastAnalysisDate) return null
    
    const lastDate = new Date(lastAnalysisDate)
    const now = new Date()
    const diffMs = now.getTime() - lastDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '어제'
    if (diffDays < 7) return `${diffDays}일 전`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
    return `${Math.floor(diffDays / 30)}개월 전`
  }, [lastAnalysisDate])

  return (
    <div 
      className="rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden"
      style={{
        background: designTokens.gradients.primary,
      }}
    >
      {/* 배경 장식 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white blur-2xl"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <h2 className="text-2xl font-bold">오늘의 피부 분석하기</h2>
        </div>
        
        <p className="text-pink-100 mb-6 text-sm leading-relaxed">
          사진 한 장으로 당신의 피부 상태를 분석하고 맞춤형 시술을 추천받으세요
        </p>

        {/* 분석 정보 */}
        {(todayAnalysisCount > 0 || timeSinceLastAnalysis) && (
          <div className="mb-4 flex items-center gap-4 text-sm text-pink-100">
            {todayAnalysisCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-300"></span>
                오늘 {todayAnalysisCount}회 분석
              </span>
            )}
            {timeSinceLastAnalysis && (
              <span>{timeSinceLastAnalysis} 분석</span>
            )}
          </div>
        )}

        <Link
          href="/analyze"
          className="flex items-center justify-center gap-2 bg-white text-pink-600 px-6 py-4 rounded-2xl font-semibold shadow-lg active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-pink-500"
          aria-label="피부 분석을 위해 사진 업로드하기"
        >
          <Camera className="w-5 h-5" aria-hidden="true" />
          사진 업로드하기
        </Link>

        <p className="text-xs text-pink-100 mt-4 opacity-90 leading-relaxed">
          본 서비스는 의료행위 또는 전문적 진단을 대체하지 않습니다. AI 분석 결과는 참고용 정보이며, 정확한 진단이나 치료를 위해서는 반드시 전문 의료인의 상담이 필요합니다.
        </p>
      </div>
    </div>
  )
}





