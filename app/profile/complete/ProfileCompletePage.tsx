'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserProfile, useUpdateProfile } from '@/app/lib/data'
import { LoadingSpinner } from '@/app/lib/ui'
import { Check, Droplet, Zap, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

const SKIN_TYPES = [
  { value: '건성', label: '건성', icon: Droplet, description: '수분이 부족한 피부' },
  { value: '지성', label: '지성', icon: Zap, description: '유분이 많은 피부' },
  { value: '복합성', label: '복합성', icon: RefreshCw, description: 'T존은 지성, 볼은 건성' },
  { value: '민감성', label: '민감성', icon: AlertCircle, description: '자극에 민감한 피부' },
  { value: '정상', label: '정상', icon: CheckCircle, description: '균형잡힌 피부' },
]

const SKIN_CONCERNS = [
  { value: '잡티', label: '잡티' },
  { value: '주름', label: '주름' },
  { value: '모공', label: '모공' },
  { value: '색소', label: '색소' },
  { value: '홍조', label: '홍조' },
  { value: '트러블', label: '트러블' },
  { value: '탄력', label: '탄력' },
  { value: '수분', label: '수분' },
]

export default function ProfileCompletePage() {
  const router = useRouter()
  const { data: userProfile, isLoading: profileLoading } = useUserProfile()
  const { updateProfile, isPending: isUpdating } = useUpdateProfile()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [skinType, setSkinType] = useState<string>('')
  const [concerns, setConcerns] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // 기존 프로필 데이터 로드 - useEffect로 이동하여 렌더링 중 setState 방지
  const profile = userProfile?.profile
  const profileId = profile?.id
  const profileSkinType = profile?.skin_type
  const profileMainConcerns = profile?.main_concerns
  
  useEffect(() => {
    if (profileId && !isInitialized) {
      if (profileSkinType) {
        setSkinType(profileSkinType)
      }
      if (Array.isArray(profileMainConcerns) && profileMainConcerns.length > 0) {
        setConcerns(profileMainConcerns)
      }
      setIsInitialized(true)
    }
  }, [profileId, profileSkinType, profileMainConcerns, isInitialized])

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner fullScreen message="로딩 중..." />
      </div>
    )
  }

  const handleSkinTypeSelect = (type: string) => {
    setSkinType(type)
    setError(null)
  }

  const handleConcernToggle = (concern: string) => {
    setConcerns((prev) => {
      if (prev.includes(concern)) {
        return prev.filter((c) => c !== concern)
      } else {
        return [...prev, concern]
      }
    })
    setError(null)
  }

  const handleStep1Next = () => {
    if (!skinType) {
      setError('피부 타입을 선택해주세요.')
      return
    }
    setStep(2)
    setError(null)
  }

  const handleStep2Next = async () => {
    if (concerns.length === 0) {
      setError('최소 1개 이상의 피부 고민을 선택해주세요.')
      return
    }

    try {
      setError(null)
      await updateProfile({
        skin_type: skinType,
        main_concerns: concerns.length > 0 ? concerns : null,
      })

      setStep(3)
    } catch (err: any) {
      setError(err.message || '프로필 저장 중 오류가 발생했습니다.')
    }
  }

  const handleComplete = () => {
    // 로컬 스토리지에서 "나중에" 플래그 제거
    if (typeof window !== 'undefined') {
      localStorage.removeItem('profile_completion_postponed')
    }
    router.push('/home')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 safe-area-top border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">프로필 완성</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* 진행률 표시 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Step {step}/3</span>
            <span className="text-sm text-gray-600">{step === 1 ? '33%' : step === 2 ? '67%' : '100%'}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: step === 1 ? '33%' : step === 2 ? '67%' : '100%' }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: 피부 타입 선택 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">피부 타입을 선택해주세요</h2>
            <p className="text-gray-600 mb-6 text-sm">
              더 정확한 분석과 맞춤형 시술 추천을 위해 필요합니다
            </p>

            <div className="grid grid-cols-2 gap-3">
              {SKIN_TYPES.map((type) => {
                const Icon = type.icon
                const isSelected = skinType === type.value

                return (
                  <button
                    key={type.value}
                    onClick={() => handleSkinTypeSelect(type.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon
                      className={`w-8 h-8 mx-auto mb-2 ${
                        isSelected ? 'text-pink-600' : 'text-gray-400'
                      }`}
                    />
                    <div className="font-semibold text-gray-900 mb-1">{type.label}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                    {isSelected && (
                      <div className="mt-2 flex justify-center">
                        <Check className="w-5 h-5 text-pink-600" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <button
              onClick={handleStep1Next}
              disabled={!skinType}
              className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음 단계
            </button>
          </div>
        )}

        {/* Step 2: 주요 피부 고민 선택 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">주요 피부 고민을 선택해주세요</h2>
            <p className="text-gray-600 mb-6 text-sm">
              여러 개 선택 가능합니다 (최소 1개)
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {SKIN_CONCERNS.map((concern) => {
                const isSelected = concerns.includes(concern.value)

                return (
                  <button
                    key={concern.value}
                    onClick={() => handleConcernToggle(concern.value)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{concern.label}</span>
                      {isSelected && <Check className="w-5 h-5 text-pink-600" />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                이전
              </button>
              <button
                onClick={handleStep2Next}
                disabled={concerns.length === 0 || isUpdating}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? '저장 중...' : '완료'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 완료 */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">프로필 완성! 🎉</h2>
            <p className="text-gray-600 mb-6">
              이제 더 정확한 분석과 맞춤형 시술 추천을 받을 수 있습니다
            </p>
            <button
              onClick={handleComplete}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              홈으로 가기
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

