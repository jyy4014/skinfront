'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabaseClient'
import { Mail, Lock, KeyRound } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [authMode, setAuthMode] = useState<'password' | 'code'>('password') // 기본값을 비밀번호 방식으로 (인증코드는 이메일 발송 비용 발생)
  const [codeSent, setCodeSent] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // 이메일 인증코드 발송
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('Send code error:', error)
        // 이메일 도메인 차단 에러 처리
        if (error.message.includes('Email address') && error.message.includes('invalid')) {
          setError('이메일 주소가 유효하지 않습니다. 실제 이메일 주소를 사용해주세요. (예: test@gmail.com)')
        } else {
          throw error
        }
        return
      }

      setCodeSent(true)
      setMessage('인증코드가 이메일로 발송되었습니다. 이메일을 확인해주세요.')
    } catch (err: any) {
      console.error('Send code error:', err)
      setError(err.message || '인증코드 발송 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 인증코드로 로그인
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      })

      if (error) {
        console.error('Verify code error:', error)
        throw error
      }

      if (data.session) {
        router.push('/home')
      } else {
        setError('인증에 실패했습니다. 인증코드를 다시 확인해주세요.')
      }
    } catch (err: any) {
      console.error('Verify code error:', err)
      setError(err.message || '인증코드 확인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 비밀번호 방식 로그인/회원가입
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        
        if (error) {
          console.error('Sign up error:', error)
          // 이메일 도메인 차단 에러 처리
          if (error.message.includes('Email address') && error.message.includes('invalid')) {
            setError('이메일 주소가 유효하지 않습니다. 실제 이메일 주소를 사용해주세요. (예: test@gmail.com)')
          } else {
            throw error
          }
          return
        }
        
        // 회원가입 성공 시
        if (data.user) {
          // 이메일 확인이 필요한 경우
          if (!data.session) {
            setMessage('회원가입이 완료되었습니다! 이메일을 확인해주세요. 이메일 확인 후 로그인할 수 있습니다.')
          } else {
            // 즉시 로그인된 경우
            router.push('/home')
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          console.error('Sign in error:', error)
          // 이메일 확인이 필요한 경우 - 에러가 아닌 안내 메시지
          if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
            setMessage('이메일 확인이 필요합니다. 회원가입 시 발송된 이메일을 확인해주세요.')
            setError(null)
          } else if (error.message.includes('Invalid login credentials')) {
            setError('이메일 또는 비밀번호가 올바르지 않습니다.')
          } else if (error.message.includes('Email address') && error.message.includes('invalid')) {
            setError('이메일 주소가 유효하지 않습니다. 실제 이메일 주소를 사용해주세요.')
          } else {
            throw error
          }
        } else {
          router.push('/home')
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            {isSignUp ? '회원가입' : '로그인'}
          </h1>
          <p className="text-center text-gray-600 mb-8">
            피부 분석 서비스를 시작하세요
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
              {message}
            </div>
          )}

          {/* 인증 방식 선택 */}
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setAuthMode('code')
                setCodeSent(false)
                setCode('')
                setError(null)
                setMessage(null)
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                authMode === 'code'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              인증코드
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('password')
                setCodeSent(false)
                setCode('')
                setError(null)
                setMessage(null)
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                authMode === 'password'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              비밀번호
            </button>
          </div>

          {/* 인증코드 방식 */}
          {authMode === 'code' ? (
            !codeSent ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? '발송 중...' : '인증코드 발송'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    인증코드
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      maxLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-center text-2xl tracking-widest"
                      placeholder="000000"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {email}로 발송된 인증코드를 입력해주세요
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCodeSent(false)
                      setCode('')
                      setMessage(null)
                    }}
                    className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                  >
                    다시 발송
                  </button>
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? '확인 중...' : '확인'}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* 비밀번호 방식 */
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
              </button>
            </form>
          )}

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">또는</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full border-2 border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 로그인
          </button>

          {authMode === 'password' && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-gray-600 hover:text-pink-500"
              >
                {isSignUp
                  ? '이미 계정이 있으신가요? 로그인'
                  : '계정이 없으신가요? 회원가입'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-center text-xs text-gray-500">
            본 서비스는 인공지능을 활용한 피부 분석 보조 도구이며, 의료 행위 또는 진단 서비스를 제공하지 않습니다.
          </p>
          <p className="text-center text-xs text-gray-500">
            서비스 이용자는 본 앱의 결과를 의료적 판단의 근거로 사용하지 않아야 합니다.
          </p>
        </div>
      </div>
    </div>
  )
}

