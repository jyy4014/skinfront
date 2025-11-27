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
            console.log('[Auth Callback Client] Hash:', window.location.hash)

            try {
                // Implicit 플로우: URL fragment에 세션 정보가 포함됨
                // Supabase가 자동으로 fragment를 처리하므로 getSession()으로 확인
                const { data: { session }, error } = await supabase.auth.getSession()

                console.log('[Auth Callback Client] Session check:', {
                    hasSession: !!session,
                    error: error?.message,
                    userId: session?.user?.id,
                    accessToken: session?.access_token ? 'present' : 'missing'
                })

                if (error) {
                    console.error('[Auth Callback Client] Auth error:', error)
                    router.push('/login?error=auth_failed')
                    return
                }

                if (session && session.access_token) {
                    console.log('[Auth Callback Client] Session established successfully')
                    router.push('/')
                } else {
                    console.log('[Auth Callback Client] No valid session found')
                    router.push('/login?error=no_session')
                }
            } catch (err) {
                console.error('[Auth Callback Client] Unexpected error:', err)
                router.push('/login?error=client_error')
            }
        }

        // 페이지 로드 후 바로 실행하되 약간의 지연을 줌
        const timer = setTimeout(handleCallback, 500)
        return () => clearTimeout(timer)
    }, [router])

    return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00FFC2]"></div>
                <p className="mt-4 text-gray-400">로그인 처리 중...</p>
            </div>
        </div>
    )
}
