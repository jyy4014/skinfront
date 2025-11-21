'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/hooks/useToast'
import { createEdgeFunctionClient } from '@/app/lib/api/edge-functions'
import { Mail, Lock, Calendar, Phone, Globe, User, Users } from 'lucide-react'

interface SignupFormData {
  email: string
  password: string
  passwordConfirm: string
  birthDate: string
  gender: string
  phoneNumber: string
  country: string
  nickname: string
}

const COUNTRIES = [
  { value: 'KR', label: '대한민국' },
  { value: 'US', label: '미국' },
  { value: 'CN', label: '중국' },
  { value: 'JP', label: '일본' },
  { value: 'GB', label: '영국' },
  { value: 'FR', label: '프랑스' },
  { value: 'DE', label: '독일' },
  { value: 'CA', label: '캐나다' },
  { value: 'AU', label: '호주' },
  { value: 'OTHER', label: '기타' },
]

export default function SignupForm() {
  const router = useRouter()
  const edgeClient = createEdgeFunctionClient()
  const toast = useToast()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    passwordConfirm: '',
    birthDate: '',
    gender: '',
    phoneNumber: '',
    country: 'KR',
    nickname: '',
  })

  // 생년월일 검증 (만 13세 이상)
  const validateBirthDate = (date: string): boolean => {
    if (!date) return false
    const birthDate = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 13
    }
    return age >= 13
  }

  // 비밀번호 확인 실시간 검증
  const validatePasswordMatch = (password: string, passwordConfirm: string) => {
    if (!passwordConfirm) {
      // 비밀번호 확인이 비어있으면 에러 없음 (아직 입력 중)
      setPasswordError(null)
      return
    }
    if (password !== passwordConfirm) {
      setPasswordError('비밀번호가 일치하지 않습니다.')
    } else {
      setPasswordError(null)
    }
  }

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // 비밀번호 또는 비밀번호 확인이 변경되면 실시간 검증
      if (field === 'password' || field === 'passwordConfirm') {
        const password = field === 'password' ? value : newData.password
        const passwordConfirm = field === 'passwordConfirm' ? value : newData.passwordConfirm
        validatePasswordMatch(password, passwordConfirm)
      }

      return newData
    })
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 이메일 검증
    if (!formData.email || !formData.email.includes('@')) {
      setError('유효한 이메일 주소를 입력해주세요.')
      return
    }

    // 비밀번호 확인 검증 (실시간 검증 결과 확인)
    if (passwordError || formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    // 비밀번호 길이 검증
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setStep(2)
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 클라이언트 검증 (UX용 빠른 피드백)
      if (!validateBirthDate(formData.birthDate)) {
        setError('만 13세 이상만 가입할 수 있습니다.')
        setLoading(false)
        return
      }

      if (!formData.gender) {
        setError('성별을 선택해주세요.')
        setLoading(false)
        return
      }

      const phoneNumbers = formData.phoneNumber.replace(/\D/g, '')
      if (phoneNumbers.length < 10) {
        setError('올바른 핸드폰번호를 입력해주세요.')
        setLoading(false)
        return
      }

      if (!formData.country) {
        setError('국적을 선택해주세요.')
        setLoading(false)
        return
      }

      if (!formData.nickname.trim()) {
        setError('별명을 입력해주세요.')
        setLoading(false)
        return
      }

      // Edge Function 호출 (서버에서 검증 및 저장)
      const result = await edgeClient.signup({
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname.trim(),
        birth_date: formData.birthDate,
        gender: formData.gender,
        phone_number: phoneNumbers,
        country: formData.country,
      })

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (result.status === 'success' && result.user) {
        // 이메일 확인이 필요한 경우
        if (result.user.requires_email_confirmation) {
          toast.success('회원가입이 완료되었습니다! 이메일을 확인해주세요. 이메일 확인 후 로그인할 수 있습니다.')
          router.push('/auth/login')
        } else {
          // 즉시 로그인된 경우
          toast.success('회원가입이 완료되었습니다!')
          router.push('/home')
        }
      } else {
        setError('회원가입에 실패했습니다.')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || '회원가입 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          회원가입
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {step === 1 ? '기본 정보를 입력해주세요' : '추가 정보를 입력해주세요'}
        </p>

        {/* 진행률 표시 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Step {step}/2</span>
            <span className="text-sm text-gray-600">{step === 1 ? '50%' : '100%'}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {(error || passwordError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error || passwordError}
          </div>
        )}

        {/* Step 1: 기본 정보 */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  aria-label="이메일 주소 입력"
                  aria-required="true"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onBlur={() => validatePasswordMatch(formData.password, formData.passwordConfirm)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  aria-label="비밀번호 입력"
                  aria-required="true"
                  aria-invalid={passwordError ? 'true' : 'false'}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 bg-white ${
                    passwordError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">최소 6자 이상</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={formData.passwordConfirm}
                  onChange={(e) => handleInputChange('passwordConfirm', e.target.value)}
                  onBlur={() => validatePasswordMatch(formData.password, formData.passwordConfirm)}
                  required
                  autoComplete="new-password"
                  aria-label="비밀번호 확인 입력"
                  aria-required="true"
                  aria-invalid={passwordError ? 'true' : 'false'}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 bg-white ${
                    passwordError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-label="다음 단계로 진행"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            >
              다음 단계
            </button>
          </form>
        )}

        {/* Step 2: 개인 정보 */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                생년월일 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  required
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">만 13세 이상만 가입 가능합니다</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성별 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  required
                  aria-label="성별 선택"
                  aria-required="true"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white text-gray-900"
                >
                  <option value="" className="text-gray-900">선택해주세요</option>
                  <option value="male" className="text-gray-900">남성</option>
                  <option value="female" className="text-gray-900">여성</option>
                  <option value="other" className="text-gray-900">기타</option>
                  <option value="prefer_not_to_say" className="text-gray-900">선택 안 함</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                핸드폰번호 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  required
                  maxLength={13}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="01012345678"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                국적 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <select
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  required
                  aria-label="국적 선택"
                  aria-required="true"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white text-gray-900"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.value} value={country.value} className="text-gray-900">
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                별명 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value.trim())}
                  required
                  maxLength={20}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="홈화면에서 사용될 별명을 입력해주세요"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">최대 20자</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                aria-label="이전 단계로 돌아가기"
                className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                이전
              </button>
              <button
                type="submit"
                disabled={loading}
                aria-label={loading ? '회원가입 처리 중' : '회원가입 완료'}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
              >
                {loading ? '가입 중...' : '회원가입'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => router.push('/auth/login')}
          aria-label="로그인 페이지로 이동"
          className="text-sm text-gray-600 hover:text-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 rounded px-2 py-1"
        >
          이미 계정이 있으신가요? 로그인
        </button>
      </div>
    </div>
  )
}

