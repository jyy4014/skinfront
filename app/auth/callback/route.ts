import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 이 설정이 중요합니다. 캐시를 방지합니다.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // 로그인 후 원래 가려던 페이지가 있다면 가져옵니다. 없으면 홈('/')
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    // 1. 쿠키를 다루는 Supabase 클라이언트 생성
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 2. (핵심) 인증 코드를 세션으로 교환하고, *쿠키에 저장될 때까지 기다립니다(await).*
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 3. 세션이 쿠키에 저장된 후, 홈(또는 원래 가려던 곳)으로 이동합니다.
  // requestUrl.origin은 현재 환경(localhost 또는 배포 주소)을 자동으로 감지합니다.
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}