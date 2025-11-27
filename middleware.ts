import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // 미들웨어용 Supabase 클라이언트 생성
  const supabase = createMiddlewareClient({ req, res });

  // (핵심) 현재 유효한 세션이 있는지 확인 (쿠키를 새로고침 해줌)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = req.nextUrl.clone();

  // 1. 로그인 상태인데 -> 인트로/로그인 페이지 접근 시 -> 홈으로 보냄
  if (session && (url.pathname.startsWith('/login') || url.pathname === '/intro')) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 2. 비로그인 상태인데 -> 보호된 페이지 접근 시 -> 인트로(또는 로그인)로 보냄
  // (보호할 경로들을 배열로 관리)
  const protectedPaths = ['/', '/mypage', '/report', '/hospital', '/community'];
  const isProtected = protectedPaths.some(path => url.pathname.startsWith(path));

  if (!session && isProtected) {
    // 단, 콜백 경로는 제외해야 무한루프 안 빠짐
    if (!url.pathname.startsWith('/auth/callback')) {
       url.pathname = '/intro'; // 또는 /login
       return NextResponse.redirect(url);
    }
  }

  // 위 경우가 아니면 원래 가려던 곳으로 통과
  return res;
}

// 미들웨어가 적용될 경로 설정 (정적 파일, 이미지 등 제외)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

