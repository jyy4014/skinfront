import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// 보호된 경로 (로그인 필요)
const protectedPaths = ['/', '/mypage', '/report', '/hospital', '/community']

// 퍼블릭 경로 (로그인 시 리다이렉트)
const publicPaths = ['/intro', '/login', '/auth/callback']

// Supabase 세션 확인
async function hasSession(request: NextRequest): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase 환경 변수가 설정되지 않았습니다.')
      return false
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // middleware에서는 응답 객체가 없으므로 쿠키를 설정하지 않습니다.
          },
        },
      }
    )

    const {
      data: { session },
    } = await supabase.auth.getSession()

    return !!session
  } catch (error) {
    console.error('Session check error:', error)
    return false
  }
}

// 경로가 보호된 경로인지 확인
function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some((path) => pathname === path || pathname.startsWith(path + '/'))
}

// 경로가 퍼블릭 경로인지 확인
function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(path + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasAuthSession = await hasSession(request)

  // 정적 파일이나 API 경로는 통과
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 비로그인 유저가 보호된 경로 접근 시
  if (!hasAuthSession && isProtectedPath(pathname)) {
    // intro를 본 적이 있는지 확인
    const hasSeenIntro = request.cookies.get('has_seen_intro')?.value === 'true'

    if (hasSeenIntro) {
      // 이미 intro를 봤으면 login으로
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    } else {
      // intro를 안 봤으면 intro로
      const introUrl = new URL('/intro', request.url)
      introUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(introUrl)
    }
  }

  // 로그인 유저가 퍼블릭 경로 접근 시
  if (hasAuthSession && isPublicPath(pathname)) {
    // 홈으로 리다이렉트
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

