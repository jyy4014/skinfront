'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[Auth Callback Client] Starting OAuth callback handler');

        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          console.error('[Auth Callback Client] OAuth error:', error);
          router.push('/login?error=oauth_failed');
          return;
        }

        if (code) {
          console.log('[Auth Callback Client] Exchanging code for session...');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('[Auth Callback Client] Code exchange error:', exchangeError);
            router.push('/login?error=exchange_failed');
            return;
          }

          console.log('[Auth Callback Client] Code exchange successful');
        }

        // 세션 확인 및 리다이렉트
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[Auth Callback Client] Session error:', sessionError);
          router.push('/login?error=session_error');
          return;
        }

        if (session) {
          console.log('[Auth Callback Client] Session established, redirecting to home');
          router.push('/');
        } else {
          console.log('[Auth Callback Client] No session found, redirecting to login');
          router.push('/login?error=no_session');
        }

      } catch (err) {
        console.error('[Auth Callback Client] Unexpected error:', err);
        router.push('/login?error=client_error');
      }
    };

    handleCallback();
  }, [router, searchParams, supabase.auth]);

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00FFC2] mb-4"></div>
        <p className="text-gray-400">로그인 처리 중...</p>
      </div>
    </div>
  );
}