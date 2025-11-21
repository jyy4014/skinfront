'use client'

import { useState, useEffect, useRef, startTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useRequireAuth } from '@/app/lib/auth/hooks/useRequireAuth'
import { useUserProfile, useUpdateProfile } from '@/app/lib/data'
import { ArrowLeft, Save, X, Sparkles } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/app/components/common/BottomNav'
import { LoadingSpinner, ErrorMessage } from '@/app/lib/ui'
import { PasswordChangeForm } from './components/PasswordChangeForm'
import { useToast } from '@/app/hooks/useToast'
import { designTokens } from '@/app/styles/design-tokens'

const SKIN_TYPES = [
  { value: '건성', label: '건성', emoji: '🌵', description: '수분이 부족한 피부' },
  { value: '지성', label: '지성', emoji: '💧', description: '유분이 많은 피부' },
  { value: '복합성', label: '복합성', emoji: '🌓', description: 'T존은 지성, 볼은 건성' },
  { value: '민감성', label: '민감성', emoji: '🌿', description: '자극에 민감한 피부' },
  { value: '정상', label: '정상', emoji: '✨', description: '균형잡힌 피부' },
]

const MAIN_CONCERNS = [
  { value: '잡티', label: '잡티', emoji: '🔴' },
  { value: '주름', label: '주름', emoji: '📏' },
  { value: '모공', label: '모공', emoji: '⚫' },
  { value: '색소', label: '색소', emoji: '🎨' },
  { value: '홍조', label: '홍조', emoji: '🌹' },
  { value: '트러블', label: '트러블', emoji: '⚠️' },
]

export default function ProfileEditPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useRequireAuth()
  const toast = useToast()
  const { data: userProfileData, isLoading: profileLoading } = useUserProfile({
    enabled: !!user && !authLoading,
  })
  const { updateProfile, isPending: isUpdating } = useUpdateProfile()

  // 초기 formData 계산 함수
  const getInitialFormData = useMemo(() => {
    const profile = userProfileData?.profile
    if (!profile) {
      return {
        name: '',
        nickname: '',
        birth_date: '',
        gender: '',
        phone_number: '',
        country: 'KR',
        skin_type: '',
        main_concerns: [] as string[],
        preferred_treatments: [] as string[],
      }
    }
    return {
      name: profile.name || '',
      nickname: profile.nickname || '',
      birth_date: profile.birth_date || '',
      gender: profile.gender || '',
      phone_number: profile.phone_number || '',
      country: profile.country || 'KR',
      skin_type: profile.skin_type || '',
      main_concerns: (profile.main_concerns as string[]) || [],
      preferred_treatments: (profile.preferred_treatments as string[]) || [],
    }
  }, [userProfileData?.profile?.id]) // 프로필 ID가 변경될 때만 재계산

  // useState의 lazy initialization만 사용하여 무한 루프 방지
  // getInitialFormData는 useMemo로 계산되므로 안전하게 사용 가능
  const [formData, setFormData] = useState(() => getInitialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'basic' | 'skin' | 'password'>('basic')


  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner fullScreen message="로딩 중..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner fullScreen message="로딩 중..." />
      </div>
    )
  }

  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // 에러 초기화
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleToggleConcern = (concern: string) => {
    setFormData((prev) => {
      const concerns = prev.main_concerns || []
      const newConcerns = concerns.includes(concern)
        ? concerns.filter((c) => c !== concern)
        : [...concerns, concern]
      return { ...prev, main_concerns: newConcerns }
    })
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.'
    }

    if (!formData.nickname.trim()) {
      newErrors.nickname = '별명을 입력해주세요.'
    } else if (formData.nickname.length > 20) {
      newErrors.nickname = '별명은 20자 이내로 입력해주세요.'
    }

    if (formData.phone_number && formData.phone_number.replace(/\D/g, '').length < 10) {
      newErrors.phone_number = '올바른 전화번호를 입력해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await updateProfile({
        name: formData.name.trim(),
        nickname: formData.nickname.trim(),
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        phone_number: formData.phone_number.replace(/\D/g, '') || null,
        country: formData.country || null,
        skin_type: formData.skin_type || null,
        main_concerns: formData.main_concerns.length > 0 ? formData.main_concerns : null,
        preferred_treatments: formData.preferred_treatments.length > 0 ? formData.preferred_treatments : null,
      })
      // 성공 시 프로필 페이지로 이동
      toast.success('프로필 정보가 성공적으로 수정되었습니다.')
      router.push('/profile')
    } catch (error: any) {
      // 실패 시 토스트 메시지 표시
      toast.error(error.message || '프로필 수정 중 오류가 발생했습니다.')
    }
  }

  const countries = [
    { code: 'KR', name: '대한민국' },
    { code: 'US', name: '미국' },
    { code: 'CN', name: '중국' },
    { code: 'JP', name: '일본' },
    { code: 'GB', name: '영국' },
    { code: 'FR', name: '프랑스' },
    { code: 'DE', name: '독일' },
  ]

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
          <button
            onClick={() => router.back()}
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
          </button>
          <h1 
            className="text-xl font-bold"
            style={{ color: designTokens.colors.text.primary }}
          >
            프로필 수정
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 탭 메뉴 */}
        <div 
          className="flex gap-2 p-1 rounded-xl"
          style={{
            backgroundColor: designTokens.colors.surface.muted,
          }}
        >
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'basic' ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: activeTab === 'basic' ? designTokens.colors.surface.base : 'transparent',
              color: activeTab === 'basic' ? designTokens.colors.primary[600] : designTokens.colors.text.secondary,
            }}
          >
            기본 정보
          </button>
          <button
            onClick={() => setActiveTab('skin')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'skin' ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: activeTab === 'skin' ? designTokens.colors.surface.base : 'transparent',
              color: activeTab === 'skin' ? designTokens.colors.primary[600] : designTokens.colors.text.secondary,
            }}
          >
            <Sparkles className="w-4 h-4 inline mr-1" />
            피부 정보
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'password' ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: activeTab === 'password' ? designTokens.colors.surface.base : 'transparent',
              color: activeTab === 'password' ? designTokens.colors.primary[600] : designTokens.colors.text.secondary,
            }}
          >
            비밀번호
          </button>
        </div>

        {/* 기본 정보 탭 */}
        {activeTab === 'basic' && (
          <form onSubmit={handleSubmit} 
            className="rounded-2xl shadow-lg p-6 space-y-6"
            style={{
              backgroundColor: designTokens.colors.surface.base,
              border: `1px solid ${designTokens.colors.border.subtle}`,
            }}
          >
            {/* 이름 */}
            <div>
              <label htmlFor="name" 
                className="block text-sm font-medium mb-2"
                style={{ color: designTokens.colors.text.primary }}
              >
                이름 <span style={{ color: designTokens.colors.danger[500] }}>*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                style={{
                  borderColor: designTokens.colors.border.strong,
                  backgroundColor: designTokens.colors.surface.base,
                  color: designTokens.colors.text.primary,
                }}
                placeholder="이름을 입력하세요"
              />
              {errors.name && (
                <p className="mt-1 text-sm" style={{ color: designTokens.colors.danger[600] }}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* 별명 */}
            <div>
              <label htmlFor="nickname" 
                className="block text-sm font-medium mb-2"
                style={{ color: designTokens.colors.text.primary }}
              >
                별명 <span style={{ color: designTokens.colors.danger[500] }}>*</span>
              </label>
              <input
                id="nickname"
                type="text"
                value={formData.nickname}
                onChange={(e) => handleChange('nickname', e.target.value)}
                maxLength={20}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                style={{
                  borderColor: designTokens.colors.border.strong,
                  backgroundColor: designTokens.colors.surface.base,
                  color: designTokens.colors.text.primary,
                }}
                placeholder="별명을 입력하세요 (20자 이내)"
              />
              {errors.nickname && (
                <p className="mt-1 text-sm" style={{ color: designTokens.colors.danger[600] }}>
                  {errors.nickname}
                </p>
              )}
            </div>

            {/* 생년월일 */}
            <div>
              <label htmlFor="birth-date" 
                className="block text-sm font-medium mb-2"
                style={{ color: designTokens.colors.text.primary }}
              >
                생년월일
              </label>
              <input
                id="birth-date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange('birth_date', e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                style={{
                  borderColor: designTokens.colors.border.strong,
                  backgroundColor: designTokens.colors.surface.base,
                  color: designTokens.colors.text.primary,
                }}
              />
            </div>

            {/* 성별 */}
            <div>
              <label htmlFor="gender" 
                className="block text-sm font-medium mb-2"
                style={{ color: designTokens.colors.text.primary }}
              >
                성별
              </label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                style={{
                  borderColor: designTokens.colors.border.strong,
                  backgroundColor: designTokens.colors.surface.base,
                  color: designTokens.colors.text.primary,
                }}
              >
                <option value="">선택하지 않음</option>
                <option value="남성">남성</option>
                <option value="여성">여성</option>
                <option value="기타">기타</option>
              </select>
            </div>

            {/* 전화번호 */}
            <div>
              <label htmlFor="phone-number" 
                className="block text-sm font-medium mb-2"
                style={{ color: designTokens.colors.text.primary }}
              >
                전화번호
              </label>
              <input
                id="phone-number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleChange('phone_number', e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                style={{
                  borderColor: designTokens.colors.border.strong,
                  backgroundColor: designTokens.colors.surface.base,
                  color: designTokens.colors.text.primary,
                }}
                placeholder="01012345678"
              />
              {errors.phone_number && (
                <p className="mt-1 text-sm" style={{ color: designTokens.colors.danger[600] }}>
                  {errors.phone_number}
                </p>
              )}
            </div>

            {/* 국적 */}
            <div>
              <label htmlFor="country" 
                className="block text-sm font-medium mb-2"
                style={{ color: designTokens.colors.text.primary }}
              >
                국적
              </label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                style={{
                  borderColor: designTokens.colors.border.strong,
                  backgroundColor: designTokens.colors.surface.base,
                  color: designTokens.colors.text.primary,
                }}
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 저장 버튼 */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 flex items-center justify-center gap-2 py-3 border-2 rounded-lg font-semibold transition-colors"
                style={{
                  borderColor: designTokens.colors.border.strong,
                  color: designTokens.colors.text.secondary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = designTokens.colors.surface.muted
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <X className="w-5 h-5" />
                취소
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                style={{
                  background: designTokens.gradients.primary,
                  color: 'white',
                }}
              >
                <Save className="w-5 h-5" />
                {isUpdating ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        )}

        {/* 피부 정보 탭 */}
        {activeTab === 'skin' && (
          <form onSubmit={handleSubmit} 
            className="rounded-2xl shadow-lg p-6 space-y-6"
            style={{
              backgroundColor: designTokens.colors.surface.base,
              border: `1px solid ${designTokens.colors.border.subtle}`,
            }}
          >
            {/* 피부 타입 */}
            <div>
              <label 
                className="block text-sm font-medium mb-3"
                style={{ color: designTokens.colors.text.primary }}
              >
                피부 타입
              </label>
              <div className="grid grid-cols-2 gap-3">
                {SKIN_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleChange('skin_type', type.value)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.skin_type === type.value ? 'shadow-md' : ''
                    }`}
                    style={{
                      borderColor: formData.skin_type === type.value 
                        ? designTokens.colors.primary[500] 
                        : designTokens.colors.border.strong,
                      backgroundColor: formData.skin_type === type.value 
                        ? designTokens.colors.primary[50] 
                        : designTokens.colors.surface.muted,
                    }}
                  >
                    <div className="text-2xl mb-1">{type.emoji}</div>
                    <div 
                      className="font-semibold text-sm"
                      style={{ 
                        color: formData.skin_type === type.value 
                          ? designTokens.colors.primary[700] 
                          : designTokens.colors.text.primary 
                      }}
                    >
                      {type.label}
                    </div>
                    <div 
                      className="text-xs mt-1"
                      style={{ color: designTokens.colors.text.tertiary }}
                    >
                      {type.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 주요 피부 고민 */}
            <div>
              <label 
                className="block text-sm font-medium mb-3"
                style={{ color: designTokens.colors.text.primary }}
              >
                주요 피부 고민 (복수 선택 가능)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MAIN_CONCERNS.map((concern) => {
                  const isSelected = formData.main_concerns.includes(concern.value)
                  return (
                    <button
                      key={concern.value}
                      type="button"
                      onClick={() => handleToggleConcern(concern.value)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        isSelected ? 'shadow-md' : ''
                      }`}
                      style={{
                        borderColor: isSelected 
                          ? designTokens.colors.accent[500] 
                          : designTokens.colors.border.strong,
                        backgroundColor: isSelected 
                          ? designTokens.colors.accent[50] 
                          : designTokens.colors.surface.muted,
                      }}
                    >
                      <div className="text-xl mb-1">{concern.emoji}</div>
                      <div 
                        className="text-xs font-medium"
                        style={{ 
                          color: isSelected 
                            ? designTokens.colors.accent[700] 
                            : designTokens.colors.text.primary 
                        }}
                      >
                        {concern.label}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 flex items-center justify-center gap-2 py-3 border-2 rounded-lg font-semibold transition-colors"
                style={{
                  borderColor: designTokens.colors.border.strong,
                  color: designTokens.colors.text.secondary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = designTokens.colors.surface.muted
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <X className="w-5 h-5" />
                취소
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                style={{
                  background: designTokens.gradients.primary,
                  color: 'white',
                }}
              >
                <Save className="w-5 h-5" />
                {isUpdating ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        )}

        {/* 비밀번호 변경 탭 */}
        {activeTab === 'password' && (
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
              비밀번호 변경
            </h2>
            <PasswordChangeForm
              onSuccess={() => {
                toast.success('비밀번호가 성공적으로 변경되었습니다.')
              }}
              onError={(error) => {
                toast.error(error.message || '비밀번호 변경 중 오류가 발생했습니다.')
              }}
            />
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
