'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/app/lib/auth/hooks/useRequireAuth'
import { useUserProfile, useUpdateProfile, useAnalysisHistory } from '@/app/lib/data'
import { 
  ArrowLeft, 
  User, 
  Droplet, 
  Trash2, 
  Bell, 
  Globe, 
  Crown, 
  Image, 
  LogOut,
  ChevronRight,
  Settings as SettingsIcon
} from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/app/components/common/BottomNav'
import { LoadingSpinner } from '@/app/lib/ui'
import { designTokens } from '@/app/styles/design-tokens'
import { createClient } from '@/app/lib/supabaseClient'
import { useToast } from '@/app/hooks/useToast'
import { ConfirmModal } from '@/app/components/ui/ConfirmModal'
import { useDeleteAnalysis } from '@/app/lib/data/mutations/analysis'
import { useUpdateUserSettings } from '@/app/lib/data/mutations/user-settings'

interface SettingItemProps {
  icon: React.ReactNode
  title: string
  description?: string
  onClick?: () => void
  href?: string
  rightContent?: React.ReactNode
  danger?: boolean
}

function SettingItem({ 
  icon, 
  title, 
  description, 
  onClick, 
  href, 
  rightContent,
  danger = false 
}: SettingItemProps) {
  const content = (
    <div 
      className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
        danger 
          ? 'hover:bg-red-50' 
          : 'hover:bg-gray-50'
      }`}
      style={{
        backgroundColor: danger ? 'transparent' : designTokens.colors.surface.muted,
      }}
    >
      <div 
        className={`p-2 rounded-lg ${
          danger 
            ? 'bg-red-100' 
            : 'bg-gray-100'
        }`}
      >
        <div 
          className={`w-5 h-5 ${
            danger 
              ? 'text-red-600' 
              : 'text-gray-600'
          }`}
        >
          {icon}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 
          className={`font-semibold ${
            danger 
              ? 'text-red-700' 
              : 'text-gray-900'
          }`}
        >
          {title}
        </h3>
        {description && (
          <p 
            className="text-sm mt-1"
            style={{ color: designTokens.colors.text.secondary }}
          >
            {description}
          </p>
        )}
      </div>
      {rightContent || (
        <ChevronRight 
          className="w-5 h-5"
          style={{ color: designTokens.colors.gray[400] }}
        />
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    )
  }

  return content
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useRequireAuth()
  const supabase = createClient()
  const toast = useToast()
  const { data: userProfile, isLoading: profileLoading } = useUserProfile()
  const { data: analyses } = useAnalysisHistory({ filters: { limit: 1000 } })
  const { deleteAnalysis, isPending: isDeleting } = useDeleteAnalysis()
  const { updateSettings, isPending: isUpdatingSettings } = useUpdateUserSettings()
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState('ko')
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0 })

  // 사용자 설정 불러오기
  useEffect(() => {
    if (userProfile?.profile) {
      const profile = userProfile.profile
      setNotificationsEnabled(profile.notification_enabled ?? true)
      setAutoDeleteEnabled(profile.auto_delete_images ?? false)
      setSelectedLanguage(profile.language || 'ko')
    }
  }, [userProfile])

  // 언어 표시명
  const languageNames: Record<string, string> = {
    ko: '한국어',
    en: 'English',
    ja: '日本語',
    zh: '中文',
  }

  // 알림 설정 저장
  const handleNotificationToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled)
    try {
      await updateSettings({ notification_enabled: enabled })
      toast.success(enabled ? '알림이 활성화되었습니다.' : '알림이 비활성화되었습니다.')
    } catch (error: any) {
      toast.error(error.message || '설정 저장에 실패했습니다.')
      setNotificationsEnabled(!enabled) // 롤백
    }
  }

  // 자동 삭제 설정 저장
  const handleAutoDeleteToggle = async (enabled: boolean) => {
    setAutoDeleteEnabled(enabled)
    try {
      await updateSettings({ auto_delete_images: enabled })
      toast.success(enabled ? '원본 사진 자동 삭제가 활성화되었습니다.' : '원본 사진 자동 삭제가 비활성화되었습니다.')
    } catch (error: any) {
      toast.error(error.message || '설정 저장에 실패했습니다.')
      setAutoDeleteEnabled(!enabled) // 롤백
    }
  }

  // 언어 설정 저장
  const handleLanguageChange = async (language: string) => {
    setSelectedLanguage(language)
    try {
      await updateSettings({ language })
      toast.success('언어 설정이 저장되었습니다.')
    } catch (error: any) {
      toast.error(error.message || '설정 저장에 실패했습니다.')
    }
  }

  if (authLoading || profileLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner fullScreen message="로딩 중..." />
      </div>
    )
  }

  const handleDeleteAllHistory = async () => {
    if (!analyses || analyses.length === 0) {
      toast.warning('삭제할 분석 이력이 없습니다.')
      return
    }

    setIsDeletingAll(true)
    setDeleteProgress({ current: 0, total: analyses.length })

    try {
      // 모든 분석 이력 삭제 (진행 상태 표시)
      for (let i = 0; i < analyses.length; i++) {
        await deleteAnalysis(analyses[i].id)
        setDeleteProgress({ current: i + 1, total: analyses.length })
      }
      toast.success('모든 분석 이력이 삭제되었습니다.')
      setShowDeleteAllModal(false)
    } catch (error: any) {
      toast.error(error.message || '삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeletingAll(false)
      setDeleteProgress({ current: 0, total: 0 })
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    toast.success('로그아웃되었습니다.')
  }

  const skinType = userProfile?.profile?.skin_type || '미설정'

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
      {/* Header */}
      <header 
        className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 safe-area-top border-b"
        style={{
          borderColor: designTokens.colors.border.subtle,
        }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/profile"
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
            설정
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 프로필 관리 */}
        <div 
          className="rounded-2xl shadow-lg p-6"
          style={{
            backgroundColor: designTokens.colors.surface.base,
            border: `1px solid ${designTokens.colors.border.subtle}`,
          }}
        >
          <h2 
            className="text-lg font-semibold mb-4 flex items-center gap-2"
            style={{ color: designTokens.colors.text.primary }}
          >
            <SettingsIcon className="w-5 h-5" style={{ color: designTokens.colors.primary[600] }} />
            프로필 관리
          </h2>
          <div className="space-y-2">
            <SettingItem
              icon={<User className="w-5 h-5" />}
              title="프로필 정보"
              description="이름, 이메일, 생년월일 등 기본 정보 관리"
              href="/profile/edit"
            />
            <SettingItem
              icon={<Droplet className="w-5 h-5" />}
              title="피부 타입 설정"
              description={`현재: ${skinType}`}
              href="/profile/complete"
            />
          </div>
        </div>

        {/* AI 분석 이력 */}
        <div 
          className="rounded-2xl shadow-lg p-6"
          style={{
            backgroundColor: designTokens.colors.surface.base,
            border: `1px solid ${designTokens.colors.border.subtle}`,
          }}
        >
          <h2 
            className="text-lg font-semibold mb-4"
            style={{ color: designTokens.colors.text.primary }}
          >
            AI 분석 이력
          </h2>
          <div className="space-y-2">
            <SettingItem
              icon={<Trash2 className="w-5 h-5" />}
              title="AI 분석 이력 삭제"
              description={`총 ${analyses?.length || 0}개의 분석 기록`}
              onClick={() => setShowDeleteAllModal(true)}
              danger
            />
          </div>
        </div>

        {/* 알림 설정 */}
        <div 
          className="rounded-2xl shadow-lg p-6"
          style={{
            backgroundColor: designTokens.colors.surface.base,
            border: `1px solid ${designTokens.colors.border.subtle}`,
          }}
        >
          <h2 
            className="text-lg font-semibold mb-4"
            style={{ color: designTokens.colors.text.primary }}
          >
            알림 설정
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 rounded-xl"
              style={{
                backgroundColor: designTokens.colors.surface.muted,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Bell className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">푸시 알림</h3>
                  <p 
                    className="text-sm mt-1"
                    style={{ color: designTokens.colors.text.secondary }}
                  >
                    분석 완료, 추천 시술 등 알림 받기
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => handleNotificationToggle(e.target.checked)}
                  disabled={isUpdatingSettings}
                  className="sr-only peer"
                />
                <div 
                  className={`w-11 h-6 rounded-full peer transition-colors ${
                    notificationsEnabled 
                      ? 'bg-pink-500' 
                      : 'bg-gray-300'
                  }`}
                >
                  <div 
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      notificationsEnabled 
                        ? 'translate-x-5' 
                        : 'translate-x-0.5'
                    } mt-0.5`}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 언어 설정 */}
        <div 
          className="rounded-2xl shadow-lg p-6"
          style={{
            backgroundColor: designTokens.colors.surface.base,
            border: `1px solid ${designTokens.colors.border.subtle}`,
          }}
        >
          <h2 
            className="text-lg font-semibold mb-4"
            style={{ color: designTokens.colors.text.primary }}
          >
            언어 설정
          </h2>
          <div className="space-y-2">
            <div className="p-4 rounded-xl"
              style={{
                backgroundColor: designTokens.colors.surface.muted,
              }}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Globe className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">언어</h3>
                  <p 
                    className="text-sm mt-1"
                    style={{ color: designTokens.colors.text.secondary }}
                  >
                    앱에서 사용할 언어를 선택하세요
                  </p>
                </div>
              </div>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={isUpdatingSettings}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
              </select>
              {isUpdatingSettings && (
                <p className="text-xs mt-2 text-gray-500">저장 중...</p>
              )}
            </div>
          </div>
        </div>

        {/* 프리미엄 */}
        <div 
          className="rounded-2xl shadow-lg p-6"
          style={{
            backgroundColor: designTokens.colors.surface.base,
            border: `1px solid ${designTokens.colors.border.subtle}`,
          }}
        >
          <h2 
            className="text-lg font-semibold mb-4"
            style={{ color: designTokens.colors.text.primary }}
          >
            프리미엄
          </h2>
          <div className="space-y-2">
            <SettingItem
              icon={<Crown className="w-5 h-5" />}
              title="프리미엄 결제"
              description="무제한 분석, 고급 리포트, 우선 지원"
              href="/premium"
            />
          </div>
        </div>

        {/* 개인정보 설정 */}
        <div 
          className="rounded-2xl shadow-lg p-6"
          style={{
            backgroundColor: designTokens.colors.surface.base,
            border: `1px solid ${designTokens.colors.border.subtle}`,
          }}
        >
          <h2 
            className="text-lg font-semibold mb-4"
            style={{ color: designTokens.colors.text.primary }}
          >
            개인정보 설정
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 rounded-xl"
              style={{
                backgroundColor: designTokens.colors.surface.muted,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Image className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">원본 사진 자동 삭제</h3>
                  <p 
                    className="text-sm mt-1"
                    style={{ color: designTokens.colors.text.secondary }}
                  >
                    분석 완료 후 원본 사진을 자동으로 삭제합니다
                  </p>
                  {isUpdatingSettings && (
                    <p className="text-xs mt-1 text-gray-500">저장 중...</p>
                  )}
                </div>
              </div>
              <label className={`relative inline-flex items-center cursor-pointer ${isUpdatingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={autoDeleteEnabled}
                  onChange={(e) => handleAutoDeleteToggle(e.target.checked)}
                  disabled={isUpdatingSettings}
                  className="sr-only peer"
                />
                <div 
                  className={`w-11 h-6 rounded-full peer transition-colors ${
                    autoDeleteEnabled 
                      ? 'bg-pink-500' 
                      : 'bg-gray-300'
                  }`}
                >
                  <div 
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      autoDeleteEnabled 
                        ? 'translate-x-5' 
                        : 'translate-x-0.5'
                    } mt-0.5`}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 로그아웃 */}
        <div 
          className="rounded-2xl shadow-lg p-6"
          style={{
            backgroundColor: designTokens.colors.surface.base,
            border: `1px solid ${designTokens.colors.border.subtle}`,
          }}
        >
          <SettingItem
            icon={<LogOut className="w-5 h-5" />}
            title="로그아웃"
            description="계정에서 로그아웃합니다"
            onClick={() => setShowLogoutModal(true)}
            danger
          />
        </div>
      </main>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={showDeleteAllModal}
        onClose={() => !isDeletingAll && setShowDeleteAllModal(false)}
        onConfirm={handleDeleteAllHistory}
        title="모든 분석 이력 삭제"
        message={
          isDeletingAll ? (
            <div className="space-y-3">
              <p className="text-gray-700">
                삭제 중... ({deleteProgress.current}/{deleteProgress.total})
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${(deleteProgress.current / deleteProgress.total) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            `정말로 모든 분석 이력(${analyses?.length || 0}개)을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
          )
        }
        confirmText={isDeletingAll ? '삭제 중...' : '삭제'}
        cancelText="취소"
        confirmVariant="danger"
        isLoading={isDeletingAll}
        disabled={isDeletingAll}
      />

      {/* 로그아웃 확인 모달 */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="로그아웃"
        message="정말로 로그아웃하시겠습니까?"
        confirmText="로그아웃"
        cancelText="취소"
        confirmVariant="danger"
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

