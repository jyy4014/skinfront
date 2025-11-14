'use client'

import { Camera, History } from 'lucide-react'
import Link from 'next/link'
import RecommendedTreatments from '@/app/components/home/RecommendedTreatments'
import BottomNav from '@/app/components/common/BottomNav'
import { PermissionChecker } from '@/app/components/common/PermissionChecker'
import { useAnalysisHistory, useUserProfile } from '@/app/lib/data'
import { useAuth } from '@/app/lib/auth'
import { LoadingSpinner } from '@/app/lib/ui'

export default function HomePage() {
  // 사용자 정보 조회 (통합 인증 모듈 사용)
  const { user, loading: authLoading } = useAuth()
  
  // 사용자 프로필 조회 (별명 포함)
  const { data: userProfile, isLoading: profileLoading } = useUserProfile()

  // 최근 분석 결과 조회
  const { data: analyses, isLoading } = useAnalysisHistory({
    filters: { limit: 1 },
  })
  const recentAnalysis = analyses && analyses.length > 0 ? analyses[0] : null

  // 별명 우선, 없으면 이름 사용
  const displayName = 
    userProfile?.profile?.nickname || 
    userProfile?.profile?.name || 
    userProfile?.user_metadata?.nickname || 
    userProfile?.user_metadata?.name || 
    null

  if (!user || authLoading || profileLoading || isLoading) {
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
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 safe-area-top border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">
            {displayName ? `안녕하세요, ${displayName}님! 👋` : '피부 분석'}
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Main CTA - 모바일 앱 스타일 */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl p-6 text-white shadow-2xl">
          <h2 className="text-2xl font-bold mb-3">오늘의 피부 분석하기</h2>
          <p className="text-pink-100 mb-6 text-sm leading-relaxed">
            사진 한 장으로 당신의 피부 상태를 분석하고 맞춤형 시술을 추천받으세요
          </p>
          <Link
            href="/analyze"
            className="flex items-center justify-center gap-2 bg-white text-pink-600 px-6 py-4 rounded-2xl font-semibold shadow-lg active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            aria-label="피부 분석을 위해 사진 업로드하기"
          >
            <Camera className="w-5 h-5" aria-hidden="true" />
            사진 업로드하기
          </Link>
          <p className="text-xs text-pink-100 mt-4 opacity-90 leading-relaxed">
            본 서비스는 의료행위 또는 전문적 진단을 대체하지 않습니다. AI 분석 결과는 참고용 정보이며, 정확한 진단이나 치료를 위해서는 반드시 전문 의료인의 상담이 필요합니다.
          </p>
        </div>

        {/* Recent Analysis - 모바일 앱 스타일 */}
        {recentAnalysis && (
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                최근 분석 결과
              </h3>
            </div>
            <Link 
              href={`/analysis/${recentAnalysis.id}`}
              className="focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 rounded-xl"
              aria-label={`최근 분석 결과 보기: ${recentAnalysis.result_summary}`}
            >
              <div className="flex gap-4 active:scale-[0.98] transition-transform">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={recentAnalysis.image_url}
                    alt="분석 이미지"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 mb-2 line-clamp-2 text-sm leading-relaxed">
                    {recentAnalysis.result_summary}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(recentAnalysis.created_at).toLocaleDateString(
                      'ko-KR'
                    )}
                  </p>
                  <span className="text-pink-600 text-sm font-medium mt-2 inline-block" aria-hidden="true">
                    자세히 보기 →
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Recommended Treatments */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            추천 시술
          </h3>
          <RecommendedTreatments />
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

