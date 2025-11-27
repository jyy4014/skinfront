'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallbackPage() {
    const router = useRouter()
    const supabase = createClientComponentClient()

    useEffect(() => {
        const handleCallback = async () => {
            console.log('[Auth Callback Client] Starting client-side callback handler')
            console.log('[Auth Callback Client] Hash:', window.location.hash)

            try {
                // Supabase automatically exchanges the hash params for a session
                const { data: { session }, error } = await supabase.auth.getSession()

                console.log('[Auth Callback Client] Session check:', {
                    hasSession: !!session,
                    error: error?.message,
                    userId: session?.user?.id
                })

                if (error) {
                    console.error('[Auth Callback Client] Error:', error)
                    router.push('/login?error=auth_failed')
                    return
                }

                if (session) {
                    console.log('[Auth Callback Client] Session established, redirecting to home')
                    router.push('/')
                } else {
                    console.log('[Auth Callback Client] No session, redirecting to login')
                    router.push('/login')
                }
            } catch (err) {
                console.error('[Auth Callback Client] Unexpected error:', err)
                router.push('/login')
            }
        }

        handleCallback()
    }, [router, supabase.auth])

    return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00FFC2]"></div>
                <p className="mt-4 text-gray-400">로그인 처리 중...</p>
            </div>
        </div>
    )
}
