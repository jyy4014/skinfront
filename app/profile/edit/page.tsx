'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/auth'
import { useUserProfile, useUpdateProfile } from '@/app/lib/data'
import { ArrowLeft, Save, X } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/app/components/common/BottomNav'
import { LoadingSpinner, ErrorMessage } from '@/app/lib/ui'
import { PasswordChangeForm } from './components/PasswordChangeForm'
import { useToast } from '@/app/hooks/useToast'

export default function ProfileEditPage() {
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToast()
  const { data: userProfileData, isLoading: profileLoading } = useUserProfile()
  const { updateProfile, isPending: isUpdating, isSuccess } = useUpdateProfile()

  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    birth_date: '',
    gender: '',
    phone_number: '',
    nationality: 'KR',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (userProfileData?.profile) {
      const profile = userProfileData.profile
      setFormData({
        name: profile.name || '',
        nickname: profile.nickname || '',
        birth_date: profile.birth_date || '',
        gender: profile.gender || '',
        phone_number: profile.phone_number || '',
        nationality: profile.nationality || 'KR',
      })
    }
  }, [userProfileData])

  useEffect(() => {
    if (isSuccess) {
      toast.success('프로필 정보가 성공적으로 수정되었습니다.')
      router.back()
    }
  }, [isSuccess, router, toast])

  if (!user) {
    router.push('/auth/login')
    return null
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner fullScreen message="로딩 중..." />
      </div>
    )
  }

  const handleChange = (field: string, value: string) => {
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

  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    handleChange('phone_number', formatted)
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
        nationality: formData.nationality || null,
      })
    } catch (error: any) {
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
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 safe-area-top border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">프로필 수정</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="이름을 입력하세요"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* 별명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              별명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => handleChange('nickname', e.target.value)}
              maxLength={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="별명을 입력하세요 (20자 이내)"
            />
            {errors.nickname && (
              <p className="mt-1 text-sm text-red-600">{errors.nickname}</p>
            )}
          </div>

          {/* 생년월일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              생년월일
            </label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => handleChange('birth_date', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              성별
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">선택하지 않음</option>
              <option value="남성">남성</option>
              <option value="여성">여성</option>
              <option value="기타">기타</option>
            </select>
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전화번호
            </label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => handlePhoneChange(e.target.value)}
              maxLength={13}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="010-1234-5678"
            />
            {errors.phone_number && (
              <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
            )}
          </div>

          {/* 국적 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              국적
            </label>
            <select
              value={formData.nationality}
              onChange={(e) => handleChange('nationality', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <X className="w-5 h-5" />
              취소
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isUpdating ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>

        {/* 비밀번호 변경 섹션 */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">비밀번호 변경</h2>
          <PasswordChangeForm
            onSuccess={() => {
              toast.success('비밀번호가 성공적으로 변경되었습니다.')
            }}
            onError={(error) => {
              toast.error(error.message || '비밀번호 변경 중 오류가 발생했습니다.')
            }}
          />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

