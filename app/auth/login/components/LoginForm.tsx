'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabaseClient'
import { Mail, Lock } from 'lucide-react'

export default function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [identifier, setIdentifier] = useState('') // 이메일 또는 전화번호
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(true) // 자동 로그인 기본값 true

  // 입력값이 이메일인지 전화번호인지 감지
  const detectInputType = (value: string): 'email' | 'phone' => {
    // @가 있으면 이메일
    if (value.includes('@')) return 'email'
    
    // 숫자만 있거나 하이픈이 포함된 숫자면 전화번호
    const numbers = value.replace(/\D/g, '')
    if (numbers.length >= 10 && numbers.length <= 11) return 'phone'
    
    // 기본값은 이메일로 처리 (사용자가 입력 중일 수 있음)
    return 'email'
  }

  // 전화번호로 이메일 찾기
  const findEmailByPhone = async (phoneNumber: string): Promise<string | null> => {
    try {
      // 하이픈 제거
      const cleanPhone = phoneNumber.replace(/\D/g, '')
      
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('phone_number', cleanPhone)
        .single()

      if (error || !data) {
        return null
      }

      return data.email
    } catch (err) {
      console.error('Find email by phone error:', err)
      return null
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 입력값 타입 자동 감지
      const inputType = detectInputType(identifier)
      let emailToUse = identifier

      // 전화번호로 입력된 경우
      if (inputType === 'phone') {
        const phoneNumber = identifier.replace(/\D/g, '')
        
        if (phoneNumber.length < 10) {
          setError('올바른 핸드폰번호를 입력해주세요.')
          setLoading(false)
          return
        }

        // users 테이블에서 이메일 찾기
        const foundEmail = await findEmailByPhone(phoneNumber)
        
        if (!foundEmail) {
          setError('해당 전화번호로 가입된 계정을 찾을 수 없습니다.')
          setLoading(false)
          return
        }

        emailToUse = foundEmail
      } else {
        // 이메일 형식 검증
        if (!emailToUse.includes('@')) {
          // @가 없으면 전화번호인지 확인
          const phoneNumber = identifier.replace(/\D/g, '')
          // 전화번호도 아니면 (10-11자리가 아니면) 에러
          if (phoneNumber.length < 10 || phoneNumber.length > 11) {
            setError('올바른 이메일 주소 또는 전화번호를 입력해주세요.')
            setLoading(false)
            return
          }
        }
      }

      // 비밀번호 로그인
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      })

      if (loginError) {
        console.error('Login error:', loginError)
        
        if (loginError.message.includes('Email not confirmed') || loginError.message.includes('email_not_confirmed')) {
          setError('이메일 확인이 필요합니다. 회원가입 시 발송된 이메일을 확인해주세요.')
        } else         if (loginError.message.includes('Invalid login credentials')) {
          setError('이메일 또는 전화번호와 비밀번호가 일치하지 않습니다.')
        } else if (loginError.message.includes('Email address') && loginError.message.includes('invalid')) {
          setError('이메일 주소가 유효하지 않습니다.')
        } else {
          setError(loginError.message || '로그인 중 오류가 발생했습니다.')
        }
        setLoading(false)
        return
      }

      if (data.session) {
        // Supabase는 기본적으로 세션을 쿠키에 저장하여 자동 로그인을 지원합니다
        // rememberMe는 UI 표시용이며, 실제 세션 지속성은 Supabase가 관리합니다

        // 로그인 시 last_login_at, login_count 업데이트
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // 현재 login_count 조회
            const { data: currentUser } = await supabase
              .from('users')
              .select('login_count')
              .eq('id', user.id)
              .single()
            
            if (currentUser) {
              await supabase
                .from('users')
                .update({
                  last_login_at: new Date().toISOString(),
                  login_count: (currentUser.login_count || 0) + 1,
                })
                .eq('id', user.id)
            }
          }
        } catch (updateError) {
          console.error('Update login stats error:', updateError)
          // 로그인 통계 업데이트 실패해도 로그인은 성공
        }

        router.push('/home')
        router.refresh()
      } else {
        setError('로그인에 실패했습니다. 다시 시도해주세요.')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || '로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  // 입력값 타입에 따라 아이콘과 플레이스홀더 결정
  const inputType = detectInputType(identifier)
  const isPhone = inputType === 'phone' && identifier.replace(/\D/g, '').length >= 10

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {/* 이메일 또는 전화번호 입력 (자동 감지) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          이메일 또는 전화번호
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value)
            }}
            required
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="이메일 또는 전화번호 입력"
          />
        </div>
        {identifier && (
          <p className="mt-1 text-xs text-gray-500">
            {isPhone ? '전화번호로 로그인' : '이메일로 로그인'}
          </p>
        )}
      </div>

      {/* 비밀번호 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          비밀번호
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>
      </div>

      {/* 자동 로그인 체크박스 */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="rememberMe"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
        />
        <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
          자동 로그인 (세션 유지)
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  )
}

