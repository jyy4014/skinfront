import { createClient } from '@/lib/supabase/route-handler';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    // 환경변수가 없으면 기본값으로 localhost 사용 (안전장치)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectTo = '/';

    if (code) {
      const supabase = createClient();

      // 인증 코드 교환
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Session exchange error:', error);
        // 에러 발생 시 에러 페이지로 리다이렉트 (선택사항)
        // return NextResponse.redirect(new URL('/error?message=session_exchange_failed', siteUrl));
      }
    }

    // 홈으로 리다이렉트
    return NextResponse.redirect(new URL(redirectTo, siteUrl));

  } catch (error) {
    // 예상치 못한 심각한 서버 에러 잡기
    console.error('CRITICAL CALLBACK ERROR:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}