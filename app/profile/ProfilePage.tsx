'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabaseClient'
import { useRequireAuth } from '@/app/lib/auth/hooks/useRequireAuth'
import { useUserProfile, useAnalysisHistory } from '@/app/lib/data'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Mail, 
  LogOut, 
  Edit, 
  Settings, 
  ChevronRight,
  Camera,
  Heart,
  Sparkles,
  Bell,
  Shield,
  Globe,
  Trash2,
  Crown,
  Image as ImageIcon,
  TrendingUp,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/app/components/common/BottomNav'
import { LoadingSpinner, EmptyState } from '@/app/lib/ui'
import { designTokens } from '@/app/styles/design-tokens'
import { useState } from 'react'
import { useToast } from '@/app/hooks/useToast'

const SKIN_TYPES = [
  { value: '건성', label: '건성', emoji: '🌵' },
  { value: '지성', label: '지성', emoji: '💧' },
  { value: '복합성', label: '복합성', emoji: '🌓' },
  { value: '민감성', label: '민감성', emoji: '🌿' },
  { value: '정상', label: '정상', emoji: '✨' },
]

const MAIN_CONCERNS = [
  { value: '잡티', label: '잡티', emoji: '🔴' },
  { value: '주름', label: '주름', emoji: '📏' },
  { value: '모공', label: '모공', emoji: '⚫' },
  { value: '색소', label: '색소', emoji: '🎨' },
  { value: '홍조', label: '홍조', emoji: '🌹' },
  { value: '트러블', label: '트러블', emoji: '⚠️' },
]

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, loading: authLoading } = useRequireAuth()
  const toast = useToast()
  const { data: userProfileData, isLoading: profileLoading } = useUserProfile({
    enabled: !!user && !authLoading,
  })
  const { data: analyses, isLoading: analysesLoading } = useAnalysisHistory({
    filters: { limit: 5 },
    user,
    enabled: !!user && !authLoading,
  })

  const loading = authLoading || profileLoading || analysesLoading
  const userProfile = userProfileData?.profile || {
    id: user?.id,
    email: user?.email,
    name: userProfileData?.user_metadata?.name || '',
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner fullScreen message="로딩 중..." />
      </div>
    )
  }

  const skinType = userProfile?.skin_type
  const mainConcerns = (userProfile?.main_concerns as string[]) || []
  const preferredTreatments = (userProfile?.preferred_treatments as string[]) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
      {/* Header - 모바일 앱 스타일 */}
      <header 
        className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 safe-area-top border-b"
        style={{
          borderColor: designTokens.colors.border.subtle,
        }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="p-2 -ml-2 rounded-lg transition-colors"
              style={{ color: designTokens.colors.gray[600] }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = designTokens.colors.gray[100]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 
              className="text-xl font-bold"
              style={{ color: designTokens.colors.text.primary }}
            >
              프로필
            </h1>
          </div>
          <Link
            href="/settings"
            className="p-2 rounded-lg transition-colors"
            style={{ color: designTokens.colors.gray[600] }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = designTokens.colors.gray[100]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 프로필 헤더 카드 - 뷰티 앱 스타일 */}
        <div 
          className="rounded-3xl shadow-lg p-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${designTokens.colors.primary[500]}15 0%, ${designTokens.colors.accent[500]}15 100%)`,
            border: `1px solid ${designTokens.colors.border.subtle}`,
          }}
        >
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
            style={{
              background: designTokens.gradients.primary,
              transform: 'translate(30%, -30%)',
            }}
          />
          
          <div className="relative flex items-center gap-4">
            {/* 프로필 사진 */}
            <div className="relative">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white flex-shrink-0 shadow-lg"
                style={{
                  background: designTokens.gradients.primary,
                }}
              >
                {userProfile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <button
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                style={{
                  background: designTokens.colors.surface.base,
                  border: `2px solid ${designTokens.colors.primary[500]}`,
                }}
                onClick={() => {
                  toast.info('프로필 사진 업로드 기능은 준비 중입니다.')
                }}
              >
                <Camera className="w-4 h-4" style={{ color: designTokens.colors.primary[600] }} />
              </button>
            </div>

            {/* 프로필 정보 */}
            <div className="flex-1 min-w-0">
              <h2 
                className="text-2xl font-bold mb-1"
                style={{ color: designTokens.colors.text.primary }}
              >
                {userProfile?.name || userProfile?.nickname || '사용자'}
              </h2>
              {userProfile?.nickname && userProfile.nickname !== userProfile.name && (
                <p 
                  className="text-sm mb-1"
                  style={{ color: designTokens.colors.text.secondary }}
                >
                  @{userProfile.nickname}
                </p>
              )}
              <p 
                className="text-sm truncate"
                style={{ color: designTokens.colors.text.tertiary }}
              >
                {userProfile?.email || user?.email}
              </p>
              {skinType && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-lg">
                    {SKIN_TYPES.find(t => t.value === skinType)?.emoji || '✨'}
                  </span>
                  <span 
                    className="text-xs font-medium"
                    style={{ color: designTokens.colors.primary[600] }}
                  >
                    {skinType}
                  </span>
                </div>
              )}
            </div>

            {/* 편집 버튼 */}
            <Link
              href="/profile/edit"
              className="p-2 rounded-lg transition-colors"
              style={{ 
                backgroundColor: designTokens.colors.surface.muted,
                color: designTokens.colors.primary[600],
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = designTokens.colors.primary[50]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = designTokens.colors.surface.muted
              }}
            >
              <Edit className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* 통계 카드 */}
        <div 
          className="rounded-2xl shadow-lg p-4"
          style={{
            backgroundColor: designTokens.colors.surface.base,
            border: `1px solid ${designTokens.colors.border.subtle}`,
          }}
        >
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div 
                className="text-2xl font-bold mb-1"
                style={{ color: designTokens.colors.primary[600] }}
              >
                {analyses?.length || 0}
              </div>
              <div 
                className="text-xs"
                style={{ color: designTokens.colors.text.secondary }}
              >
                분석 기록
              </div>
            </div>
            <div className="text-center border-x"
              style={{ borderColor: designTokens.colors.border.subtle }}
            >
              <div 
                className="text-2xl font-bold mb-1"
                style={{ color: designTokens.colors.accent[600] }}
              >
                {preferredTreatments.length}
              </div>
              <div 
                className="text-xs"
                style={{ color: designTokens.colors.text.secondary }}
              >
                관심 시술
              </div>
            </div>
            <div className="text-center">
              <div 
                className="text-2xl font-bold mb-1"
                style={{ color: designTokens.colors.warning[600] }}
              >
                {mainConcerns.length}
              </div>
              <div 
                className="text-xs"
                style={{ color: designTokens.colors.text.secondary }}
              >
                피부 고민
              </div>
            </div>
          </div>
        </div>

        {/* 피부 정보 섹션 */}
        <div 
          className="rounded-2xl shadow-lg p-6 space-y-4"
          style={{
            backgroundColor: designTokens.colors.surface.base,
            border: `1px solid ${designTokens.colors.border.subtle}`,
          }}
        >
          <div className="flex items-center justify-between">
            <h3 
              className="text-lg font-semibold flex items-center gap-2"
              style={{ color: designTokens.colors.text.primary }}
            >
              <Sparkles className="w-5 h-5" style={{ color: designTokens.colors.primary[600] }} />
              피부 정보
            </h3>
            <Link
              href="/profile/edit"
              className="text-sm font-medium flex items-center gap-1"
              style={{ color: designTokens.colors.primary[600] }}
            >
              수정
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 피부 타입 */}
          <div>
            <div 
              className="text-sm font-medium mb-2"
              style={{ color: designTokens.colors.text.secondary }}
            >
              피부 타입
            </div>
            {skinType ? (
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: designTokens.colors.primary[50],
                  color: designTokens.colors.primary[700],
                }}
              >
                <span className="text-lg">
                  {SKIN_TYPES.find(t => t.value === skinType)?.emoji || '✨'}
                </span>
                <span className="font-medium">{skinType}</span>
              </div>
            ) : (
              <div 
                className="text-sm"
                style={{ color: designTokens.colors.text.tertiary }}
              >
                설정되지 않음
              </div>
            )}
          </div>

          {/* 주요 피부 고민 */}
          <div>
            <div 
              className="text-sm font-medium mb-2"
              style={{ color: designTokens.colors.text.secondary }}
            >
              주요 피부 고민
            </div>
            {mainConcerns.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mainConcerns.map((concern) => {
                  const concernData = MAIN_CONCERNS.find(c => c.value === concern)
                  return (
                    <div
                      key={concern}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                      style={{
                        backgroundColor: designTokens.colors.accent[50],
                        color: designTokens.colors.accent[700],
                      }}
                    >
                      <span>{concernData?.emoji || '🔴'}</span>
                      <span>{concernData?.label || concern}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div 
                className="text-sm"
                style={{ color: designTokens.colors.text.tertiary }}
              >
                설정되지 않음
              </div>
            )}
          </div>
        </div>

        {/* 설정 메뉴 */}
        <div 
          className="rounded-2xl shadow-lg overflow-hidden"
          style={{
            backgroundColor: designTokens.colors.surface.base,
            border: `1px solid ${designTokens.colors.border.subtle}`,
          }}
        >
          <Link
            href="/profile/edit"
            className="flex items-center justify-between p-4 border-b transition-colors"
            style={{
              borderColor: designTokens.colors.border.subtle,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = designTokens.colors.surface.muted
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: designTokens.colors.primary[50] }}
              >
                <User className="w-5 h-5" style={{ color: designTokens.colors.primary[600] }} />
              </div>
              <div>
                <div 
                  className="font-medium"
                  style={{ color: designTokens.colors.text.primary }}
                >
                  프로필 수정
                </div>
                <div 
                  className="text-xs mt-0.5"
                  style={{ color: designTokens.colors.text.secondary }}
                >
                  이름, 생년월일, 성별 등
                </div>
              </div>
            </div>
            <ChevronRight 
              className="w-5 h-5"
              style={{ color: designTokens.colors.gray[400] }}
            />
          </Link>

          <Link
            href="/settings"
            className="flex items-center justify-between p-4 border-b transition-colors"
            style={{
              borderColor: designTokens.colors.border.subtle,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = designTokens.colors.surface.muted
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: designTokens.colors.accent[50] }}
              >
                <Settings className="w-5 h-5" style={{ color: designTokens.colors.accent[600] }} />
              </div>
              <div>
                <div 
                  className="font-medium"
                  style={{ color: designTokens.colors.text.primary }}
                >
                  설정
                </div>
                <div 
                  className="text-xs mt-0.5"
                  style={{ color: designTokens.colors.text.secondary }}
                >
                  알림, 언어, 개인정보 등
                </div>
              </div>
            </div>
            <ChevronRight 
              className="w-5 h-5"
              style={{ color: designTokens.colors.gray[400] }}
            />
          </Link>

          <Link
            href="/premium"
            className="flex items-center justify-between p-4 border-b transition-colors"
            style={{
              borderColor: designTokens.colors.border.subtle,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = designTokens.colors.surface.muted
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${designTokens.colors.warning[500]}, ${designTokens.colors.warning[600]})`,
                }}
              >
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <div 
                  className="font-medium"
                  style={{ color: designTokens.colors.text.primary }}
                >
                  프리미엄
                </div>
                <div 
                  className="text-xs mt-0.5"
                  style={{ color: designTokens.colors.text.secondary }}
                >
                  고급 기능과 무제한 분석
                </div>
              </div>
            </div>
            <ChevronRight 
              className="w-5 h-5"
              style={{ color: designTokens.colors.gray[400] }}
            />
          </Link>

          <Link
            href="/history"
            className="flex items-center justify-between p-4 transition-colors"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = designTokens.colors.surface.muted
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: designTokens.colors.primary[50] }}
              >
                <Clock className="w-5 h-5" style={{ color: designTokens.colors.primary[600] }} />
              </div>
              <div>
                <div 
                  className="font-medium"
                  style={{ color: designTokens.colors.text.primary }}
                >
                  분석 기록
                </div>
                <div 
                  className="text-xs mt-0.5"
                  style={{ color: designTokens.colors.text.secondary }}
                >
                  전체 분석 이력 보기
                </div>
              </div>
            </div>
            <ChevronRight 
              className="w-5 h-5"
              style={{ color: designTokens.colors.gray[400] }}
            />
          </Link>
        </div>

        {/* 최근 분석 기록 */}
        {analyses && analyses.length > 0 && (
          <div 
            className="rounded-2xl shadow-lg p-6 space-y-4"
            style={{
              backgroundColor: designTokens.colors.surface.base,
              border: `1px solid ${designTokens.colors.border.subtle}`,
            }}
          >
            <div className="flex items-center justify-between">
              <h3 
                className="text-lg font-semibold flex items-center gap-2"
                style={{ color: designTokens.colors.text.primary }}
              >
                <TrendingUp className="w-5 h-5" style={{ color: designTokens.colors.primary[600] }} />
                최근 분석
              </h3>
              <Link
                href="/history"
                className="text-sm font-medium"
                style={{ color: designTokens.colors.primary[600] }}
              >
                전체 보기 →
              </Link>
            </div>
            <div className="space-y-3">
              {analyses.slice(0, 3).map((analysis: any) => (
                <Link
                  key={analysis.id}
                  href={`/analysis/${analysis.id}`}
                  prefetch={false}
                  className="block rounded-xl p-3 transition-colors"
                  style={{
                    backgroundColor: designTokens.colors.surface.muted,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = designTokens.colors.gray[100]
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = designTokens.colors.surface.muted
                  }}
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
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
                            placeholder.className = 'image-placeholder flex items-center justify-center h-full text-gray-400 text-xs';
                            placeholder.textContent = '이미지 없음';
                            parent.appendChild(placeholder);
                          }
                        }}
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p 
                        className="text-sm font-medium mb-1 line-clamp-2"
                        style={{ color: designTokens.colors.text.primary }}
                      >
                        {analysis.result_summary || '분석 결과'}
                      </p>
                      <p 
                        className="text-xs"
                        style={{ color: designTokens.colors.text.tertiary }}
                      >
                        {new Date(analysis.created_at).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 rounded-xl font-semibold transition-colors"
          style={{
            borderColor: designTokens.colors.danger[200],
            color: designTokens.colors.danger[600],
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = designTokens.colors.danger[50]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <LogOut className="w-5 h-5" />
          로그아웃
        </button>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

