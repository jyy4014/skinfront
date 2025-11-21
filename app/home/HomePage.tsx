'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Camera, History, Sparkles, TrendingUp, ArrowRight } from 'lucide-react'
import RecommendedTreatments from '@/app/components/home/RecommendedTreatments'
import BottomNav from '@/app/components/common/BottomNav'
import { PermissionChecker } from '@/app/components/common/PermissionChecker'
import ProfileCompletionBanner from '@/app/components/profile/ProfileCompletionBanner'
import GreetingHeader from '@/app/components/home/GreetingHeader'
import DailyAnalysisCTA from '@/app/components/home/DailyAnalysisCTA'
import SkinSummaryCard from '@/app/components/home/SkinSummaryCard'
import WeeklyTrendChart from '@/app/components/home/WeeklyTrendChart'
import { useAnalysisHistory, useUserProfile } from '@/app/lib/data'
import { useAuth } from '@/app/lib/auth'
import { LoadingSpinner, EmptyState } from '@/app/lib/ui'
import { designTokens } from '@/app/styles/design-tokens'
import {
  calculateAverageScore,
  calculateAverageScoreFromAnalysis,
  getSkinScoresFromAnalysis,
} from '@/app/lib/utils/skinScores'

export default function HomePage() {
  // 사용자 정보 조회 (통합 인증 모듈 사용)
  const { user, loading: authLoading } = useAuth()
  
  // 사용자 프로필 조회 (별명 포함) - user를 전달하여 중복 호출 방지
  const { data: userProfile, isLoading: profileLoading } = useUserProfile({
    user, // useAuth의 user를 전달하여 중복 getUser() 호출 방지
    enabled: !!user && !authLoading,
  })

  // 최근 분석 결과 조회 - 최근 7개 (트렌드용) - user를 전달하여 중복 호출 방지
  const { data: analyses, isLoading } = useAnalysisHistory({
    user, // useAuth의 user를 전달하여 중복 getUser() 호출 방지
    filters: { limit: 7 },
    enabled: !!user && !authLoading,
  })

  // 최근 분석 결과 (1개)
  const recentAnalysis = analyses && analyses.length > 0 ? analyses[0] : null

  // 별명 우선, 없으면 이름 사용
  const displayName = 
    userProfile?.profile?.nickname || 
    userProfile?.profile?.name || 
    userProfile?.user_metadata?.nickname || 
    userProfile?.user_metadata?.name || 
    null

  // 오늘의 분석 횟수 계산
  const todayAnalysisCount = useMemo(() => {
    if (!analyses) return 0
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return analyses.filter((analysis: any) => {
      const analysisDate = new Date(analysis.created_at)
      analysisDate.setHours(0, 0, 0, 0)
      return analysisDate.getTime() === today.getTime()
    }).length
  }, [analyses])

  // 인증 로딩 중일 때만 로딩 표시
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner fullScreen message="로딩 중..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
      {/* 권한 확인 컴포넌트 - 앱 시작 시 카메라 권한 확인 */}
      <PermissionChecker />
      
      {/* Header - 모바일 앱 스타일 */}
      <header 
        className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 safe-area-top border-b"
        style={{
          borderColor: designTokens.colors.border.subtle,
        }}
      >
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-gray-900">Today's Skin Report</h1>
          </div>
          <GreetingHeader displayName={displayName} />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 프로필 완성 배너 - userProfile을 props로 전달하여 중복 호출 방지 */}
        <ProfileCompletionBanner userProfile={userProfile} />

        {/* 오늘의 분석 CTA - 최상단에 배치 */}
        <DailyAnalysisCTA 
          lastAnalysisDate={recentAnalysis?.created_at}
          todayAnalysisCount={todayAnalysisCount}
        />

        {/* 피부 상태 요약 - Overall Score 포함 (분석이 있을 때만) */}
        {analyses && analyses.length > 0 && (
          <SkinSummaryCard analyses={analyses} />
        )}

        {/* 7일 트렌드 그래프 */}
        {analyses && analyses.length > 0 && (
          <div 
            className="rounded-2xl p-5 shadow-lg"
            style={{
              backgroundColor: designTokens.colors.surface.base,
              border: `1px solid ${designTokens.colors.border.subtle}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" style={{ color: designTokens.colors.primary[500] }} />
                <h3 
                  className="text-lg font-semibold"
                  style={{ color: designTokens.colors.text.primary }}
                >
                  최근 7일 추세
                </h3>
              </div>
              <Link
                href="/history"
                prefetch={false}
                className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: designTokens.colors.primary[600] }}
              >
                전체 보기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <WeeklyTrendChart analyses={analyses} />
          </div>
        )}

        {/* 최근 분석 요약 - 썸네일 그리드 */}
        {analyses && analyses.length > 0 && (
          <div 
            className="rounded-2xl p-5 shadow-lg"
            style={{
              backgroundColor: designTokens.colors.surface.base,
              border: `1px solid ${designTokens.colors.border.subtle}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 
                className="text-lg font-semibold"
                style={{ color: designTokens.colors.text.primary }}
              >
                최근 분석
              </h3>
              <Link
                href="/history"
                prefetch={false}
                className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: designTokens.colors.primary[600] }}
              >
                전체 보기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {analyses.slice(0, 3).map((analysis: any, index: number) => {
                const imageUrl = analysis.image_url || analysis.image_urls?.[0]
                const normalizedScores = getSkinScoresFromAnalysis(analysis)
                const avgScoreValue = calculateAverageScore(normalizedScores)
                const avgScore =
                  avgScoreValue !== null && Number.isFinite(avgScoreValue)
                    ? Math.max(0, Math.min(100, Math.round(avgScoreValue * 100)))
                    : null
                
                return (
                  <Link
                    key={analysis.id}
                    href={`/analysis/${analysis.id}`}
                    prefetch={false}
                    className="group flex flex-col items-center gap-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 rounded-xl p-2 hover:bg-gray-50 transition-all active:scale-95"
                  >
                    {imageUrl ? (
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 group-hover:shadow-md transition-shadow">
                        <img
                          src={imageUrl}
                          alt={`Analysis ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.image-placeholder')) {
                              const placeholder = document.createElement('div');
                              placeholder.className = 'image-placeholder flex items-center justify-center h-full text-gray-400 text-xs';
                              placeholder.textContent = '이미지 없음';
                              parent.appendChild(placeholder);
                            }
                          }}
                          loading="lazy"
                        />
                        {avgScore !== null && (
                          <div 
                            className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold text-white shadow-sm"
                            style={{
                              backgroundColor: avgScore >= 70 ? designTokens.colors.success[500] : 
                                              avgScore >= 50 ? designTokens.colors.warning[500] : 
                                              designTokens.colors.danger[500],
                            }}
                          >
                            {avgScore}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                    <p 
                      className="text-xs text-center font-medium"
                      style={{ color: designTokens.colors.text.secondary }}
                    >
                      {new Date(analysis.created_at).toLocaleDateString('ko-KR', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Actions - 보조 메뉴 (분석 버튼 제외) */}
        <div 
          className="rounded-2xl p-5 shadow-lg"
          style={{
            backgroundColor: designTokens.colors.surface.base,
            border: `1px solid ${designTokens.colors.border.subtle}`,
          }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: designTokens.colors.text.primary }}
          >
            빠른 메뉴
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/history"
              prefetch={false}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl hover:shadow-lg transition-all active:scale-95"
              style={{
                backgroundColor: designTokens.colors.surface.muted,
              }}
            >
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{
                  background: designTokens.gradients.accent,
                }}
              >
                <History className="w-6 h-6 text-white" />
              </div>
              <span 
                className="text-xs font-semibold text-center"
                style={{ color: designTokens.colors.text.primary }}
              >
                분석 기록
              </span>
              <span 
                className="text-[10px] text-center leading-tight"
                style={{ color: designTokens.colors.text.secondary }}
              >
                히스토리 보기
              </span>
            </Link>
            <Link
              href="/treatments"
              className="group flex flex-col items-center gap-2 p-4 rounded-xl hover:shadow-lg transition-all active:scale-95"
              style={{
                backgroundColor: designTokens.colors.surface.muted,
              }}
            >
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{
                  background: designTokens.gradients.primary,
                }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span 
                className="text-xs font-semibold text-center"
                style={{ color: designTokens.colors.text.primary }}
              >
                시술 추천
              </span>
              <span 
                className="text-[10px] text-center leading-tight"
                style={{ color: designTokens.colors.text.secondary }}
              >
                맞춤 시술
              </span>
            </Link>
          </div>
        </div>

        {/* Recommended Treatments - 개선된 버전 */}
        <div 
          className="rounded-2xl p-5 shadow-lg"
          style={{
            backgroundColor: designTokens.colors.surface.base,
            border: `1px solid ${designTokens.colors.border.subtle}`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: designTokens.colors.primary[500] }} />
              <h3 
                className="text-lg font-semibold"
                style={{ color: designTokens.colors.text.primary }}
              >
                오늘의 추천 시술
              </h3>
            </div>
            <Link
              href="/treatments"
              prefetch={false}
              className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
              style={{ color: designTokens.colors.primary[600] }}
            >
              전체 보기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <RecommendedTreatments />
        </div>

        {/* 빈 상태 처리 - 분석이 없을 때 */}
        {!isLoading && (!analyses || analyses.length === 0) && (
          <div 
            className="rounded-2xl p-8 shadow-lg text-center"
            style={{
              backgroundColor: designTokens.colors.surface.base,
              border: `1px solid ${designTokens.colors.border.subtle}`,
            }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: designTokens.colors.primary[50] }}>
              <Camera className="w-10 h-10" style={{ color: designTokens.colors.primary[500] }} />
            </div>
            <h3 
              className="text-xl font-bold mb-2"
              style={{ color: designTokens.colors.text.primary }}
            >
              첫 분석을 시작해보세요! ✨
            </h3>
            <p 
              className="text-sm mb-6 leading-relaxed"
              style={{ color: designTokens.colors.text.secondary }}
            >
              AI가 당신의 피부 상태를 분석하고<br />
              맞춤형 시술을 추천해드립니다
            </p>
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all active:scale-95"
              style={{
                background: designTokens.gradients.primary,
              }}
            >
              <Camera className="w-5 h-5" />
              지금 분석하기
            </Link>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

