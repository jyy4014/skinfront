import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  console.log('[Auth Callback Server] Starting server-side callback handler')

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('[Auth Callback Server] Full URL:', request.url)
  console.log('[Auth Callback Server] Code present:', !!code)
  console.log('[Auth Callback Server] Next URL:', next)

  if (!code) {
    console.error('[Auth Callback Server] No code found in URL')
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    console.log('[Auth Callback Server] Exchanging code for session...')

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('[Auth Callback Server] Exchange result:', {
      hasSession: !!data.session,
      hasUser: !!data.user,
      error: error?.message
    })

    if (error) {
      console.error('[Auth Callback Server] Exchange error:', error)
      return NextResponse.redirect(new URL('/login?error=exchange_failed', request.url))
    }

    if (data.session) {
      console.log('[Auth Callback Server] Session established, redirecting to:', next)
      return NextResponse.redirect(new URL(next, request.url))
    } else {
      console.log('[Auth Callback Server] No session created, redirecting to login')
      return NextResponse.redirect(new URL('/login?error=no_session', request.url))
    }
  } catch (err) {
    console.error('[Auth Callback Server] Unexpected error:', err)
    return NextResponse.redirect(new URL('/login?error=server_error', request.url))
  }
}
