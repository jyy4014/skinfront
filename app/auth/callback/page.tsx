'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const handleCallback = async () => {
            console.log('[Auth Callback Client] Starting client-side callback handler')
            console.log('[Auth Callback Client] Current URL:', window.location.href)
            console.log('[Auth Callback Client] Search params:', window.location.search)
            console.log('[Auth Callback Client] Hash:', window.location.hash)

            try {
                const code = searchParams.get('code')
                const errorParam = searchParams.get('error')

                // 에러가 있으면 처리
                if (errorParam) {
                    console.error('[Auth Callback Client] OAuth error:', errorParam)
                    router.push('/login?error=oauth_failed')
                    return
                }

                // Code 플로우 (PKCE/Google OAuth): code 파라미터가 있으면 교환
                if (code) {
                    console.log('[Auth Callback Client] Code flow detected, exchanging code...')
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

                    if (error) {
                        console.error('[Auth Callback Client] Code exchange error:', error)
                        router.push('/login?error=exchange_failed')
                        return
                    }

                    console.log('[Auth Callback Client] Code exchange successful')
                }

                // 세션 확인 (양쪽 플로우 모두)
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                console.log('[Auth Callback Client] Session check:', {
                    hasSession: !!session,
                    error: sessionError?.message,
                    userId: session?.user?.id,
                    accessToken: session?.access_token ? 'present' : 'missing'
                })

                if (sessionError) {
                    console.error('[Auth Callback Client] Session error:', sessionError)
                    router.push('/login?error=session_error')
                    return
                }

                if (session && session.access_token) {
                    console.log('[Auth Callback Client] Session established successfully')
                    router.push('/')
                } else {
                    console.log('[Auth Callback Client] No valid session found')
                    // 잠시 기다렸다가 다시 확인 (비동기 처리 시간 고려)
                    setTimeout(() => {
                        supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
                            if (retrySession) {
                                router.push('/')
                            } else {
                                router.push('/login?error=no_session')
                            }
                        })
                    }, 1000)
                }
            } catch (err) {
                console.error('[Auth Callback Client] Unexpected error:', err)
                router.push('/login?error=client_error')
            }
        }

        // 페이지 로드 후 바로 실행하되 약간의 지연을 줌
        const timer = setTimeout(handleCallback, 500)
        return () => clearTimeout(timer)
    }, [router, searchParams])

    return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00FFC2]"></div>
                <p className="mt-4 text-gray-400">로그인 처리 중...</p>
            </div>
        </div>
    )
}
