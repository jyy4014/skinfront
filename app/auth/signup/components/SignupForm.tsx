'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabaseClient'
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
  const supabase = createClient()
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

  // 핸드폰번호 포맷팅 (010-1234-5678)
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  // 비밀번호 확인 실시간 검증
  const validatePasswordMatch = (password: string, passwordConfirm: string) => {
    if (passwordConfirm && password !== passwordConfirm) {
      setPasswordError('비밀번호가 일치하지 않습니다.')
    } else {
      setPasswordError(null)
    }
  }

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    if (field === 'phoneNumber') {
      setFormData((prev) => ({ ...prev, [field]: formatPhoneNumber(value) }))
    } else {
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
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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
      // 생년월일 검증
      if (!validateBirthDate(formData.birthDate)) {
        setError('만 13세 이상만 가입할 수 있습니다.')
        setLoading(false)
        return
      }

      // 성별 검증 (필수)
      if (!formData.gender) {
        setError('성별을 선택해주세요.')
        setLoading(false)
        return
      }

      // 핸드폰번호 검증 (필수, 최소 10자리)
      const phoneNumbers = formData.phoneNumber.replace(/\D/g, '')
      if (phoneNumbers.length < 10) {
        setError('올바른 핸드폰번호를 입력해주세요.')
        setLoading(false)
        return
      }

      // 국적 검증 (필수)
      if (!formData.country) {
        setError('국적을 선택해주세요.')
        setLoading(false)
        return
      }

      // 별명 검증
      if (!formData.nickname.trim()) {
        setError('별명을 입력해주세요.')
        setLoading(false)
        return
      }

      // 1. Supabase Auth 회원가입
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            nickname: formData.nickname,
            birth_date: formData.birthDate,
            gender: formData.gender,
            phone_number: phoneNumbers,
            country: formData.country,
          },
        },
      })

      if (authError) {
        console.error('Sign up error:', authError)
        if (authError.message.includes('Email address') && authError.message.includes('invalid')) {
          setError('이메일 주소가 유효하지 않습니다. 실제 이메일 주소를 사용해주세요.')
        } else if (authError.message.includes('already registered')) {
          setError('이미 가입된 이메일입니다.')
        } else {
          setError(authError.message || '회원가입 중 오류가 발생했습니다.')
        }
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('회원가입에 실패했습니다.')
        setLoading(false)
        return
      }

      // 2. users 테이블에 프로필 정보 저장
      const { error: profileError } = await supabase
        .from('users')
        .upsert(
          {
            id: authData.user.id,
            email: formData.email,
            nickname: formData.nickname,
            birth_date: formData.birthDate,
            gender: formData.gender,
            phone_number: phoneNumbers,
            country: formData.country,
            signup_source: 'web',
            first_visit_at: new Date().toISOString(),
            last_visit_at: new Date().toISOString(),
            language: 'ko',
            is_active: true,
          },
          { onConflict: 'id' }
        )

      if (profileError) {
        console.error('Profile save error:', profileError)
        setError('프로필 정보 저장 중 오류가 발생했습니다.')
        setLoading(false)
        return
      }

      // 3. 이메일 확인이 필요한 경우
      if (!authData.session) {
        alert('회원가입이 완료되었습니다! 이메일을 확인해주세요. 이메일 확인 후 로그인할 수 있습니다.')
        router.push('/auth/login')
      } else {
        // 즉시 로그인된 경우
        router.push('/home')
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                    passwordError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">선택해주세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                  <option value="prefer_not_to_say">선택 안 함</option>
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="010-1234-5678"
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.value} value={country.value}>
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="홈화면에서 사용될 별명을 입력해주세요"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">최대 20자</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                이전
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
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
          className="text-sm text-gray-600 hover:text-pink-500"
        >
          이미 계정이 있으신가요? 로그인
        </button>
      </div>
    </div>
  )
}

