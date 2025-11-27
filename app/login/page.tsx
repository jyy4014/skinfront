'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Sparkles, Mail, Loader2, ArrowRight, MessageCircle, Globe2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSent, setIsSent] = useState(false)
  const router = useRouter()

  const validateEmail = (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(value)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!validateEmail(email)) {
      setError('유효한 이메일 주소를 입력해주세요.')
      return
    }

    setIsLoading(true)

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    setIsLoading(false)

    if (authError) {
      setError(authError.message ?? '로그인 링크 전송 중 오류가 발생했습니다.')
      return
    }

    setIsSent(true)
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <motion.div
        className="absolute inset-0 opacity-40"
        animate={{
          background: [
            'radial-gradient(circle at 20% 20%, rgba(0,255,194,0.25), transparent 55%)',
            'radial-gradient(circle at 80% 60%, rgba(0,200,255,0.2), transparent 55%)',
          ],
        }}
        transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror' }}
      />

      <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 text-[#00FFC2] text-sm font-semibold tracking-widest uppercase">
            <Sparkles className="w-4 h-4" />
            Derma AI
          </div>
          <h1 className="text-3xl font-bold">피부 고민, 이제 AI와 해결하세요</h1>
          <p className="text-gray-400 text-sm">Magic Link 로그인으로 빠르고 안전하게 시작해요.</p>
        </div>

        {/* Auth Form */}
        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-gray-300">
                이메일 주소
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  placeholder="이메일을 입력해주세요"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#00FFC2] focus:ring-1 focus:ring-[#00FFC2]"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] text-black font-bold py-4 rounded-2xl shadow-lg shadow-[#00FFC2]/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  전송 중...
                </>
              ) : (
                <>
                  로그인 링크 받기
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3 text-center">
            <div className="text-4xl">📩</div>
            <h2 className="text-xl font-semibold">인증 메일이 발송되었습니다!</h2>
            <p className="text-sm text-gray-400">
              메일함의 링크를 클릭하면 로그인이 완료됩니다.
              <br />
              메일을 확인한 후 다시 앱으로 돌아와주세요.
            </p>
            <button
              onClick={() => router.push('/')}
              className="text-xs text-[#00FFC2] hover:text-white transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="relative text-center">
          <span className="px-4 text-xs text-gray-500 bg-[#0D0D0F] relative z-10">
            또는 SNS로 3초 만에 시작
          </span>
          <div className="absolute left-0 top-1/2 w-full border-t border-white/10" />
        </div>

        {/* Social buttons (UI only) */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#FEE500]/10 border border-[#FEE500]/30 text-[#FEE500] text-sm font-semibold">
            <MessageCircle className="w-4 h-4" />
            카카오
          </button>
          <button className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/20 text-white text-sm font-semibold">
            <Globe2 className="w-4 h-4" />
            구글
          </button>
        </div>
      </div>
    </div>
  )
}


