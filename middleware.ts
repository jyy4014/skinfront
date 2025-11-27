import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  // 세션 확인 (쿠키 갱신)
  const { data: { session } } = await supabase.auth.getSession();

  const url = req.nextUrl.clone();
  const { pathname } = url;

  // ==================================================================
  // 1. [공통 프리패스]: 로그인 여부와 상관없이 무조건 통과시켜야 하는 경로들
  // ==================================================================
  // - /_next, /static, 이미지 파일 등: 정적 리소스
  // - /auth/callback: 소셜 로그인 인증 처리 경로 (절대 막으면 안 됨)
  // - /intro: 온보딩 페이지 (비로그인 유저의 진입점)
  // - /login: 로그인 페이지
  const publicPaths = ['/intro', '/login', '/auth/callback'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  const isStaticAsset = pathname.startsWith('/_next') || pathname.includes('.');

  if (isPublicPath || isStaticAsset) {
    // 1-1. [예외] 로그인 유저가 굳이 intro나 login에 오면 홈으로 보냄
    if (session && (pathname === '/intro' || pathname === '/login')) {
        url.pathname = '/';
        return NextResponse.redirect(url);
    }
    // 그 외(비로그인 유저의 intro, login 접근 등)는 통과
    return res;
  }

  // ==================================================================
  // 2. [보호 구역 검사]: 위에서 통과 안 된 모든 경로는 '로그인 필수' 구역임
  // ==================================================================
  // - 세션이 없으면 (비로그인) -> 무조건 납치
  if (!session) {
    // 인트로 봤는지 쿠키 확인
    const hasSeenIntro = req.cookies.get('has_seen_intro')?.value === 'true';

    if (hasSeenIntro) {
      // 봤으면 -> 로그인으로
      url.pathname = '/login';
    } else {
      // 안 봤으면 -> 온보딩으로
      url.pathname = '/intro';
    }
    return NextResponse.redirect(url);
  }

  // ==================================================================
  // 3. [통과]: 로그인한 유저가 보호 구역에 접근한 경우 -> OK
  // ==================================================================
  return res;
}

export const config = {
  // favicon 빼고 모든 경로 감시
  matcher: '/((?!favicon.ico).*)',
};

