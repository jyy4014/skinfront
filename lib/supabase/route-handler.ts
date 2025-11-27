import { createServerClient } from '@supabase/ssr';

export const createClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get() {
          // Serverless 환경에서는 쿠키를 직접 처리하지 않음
          return undefined;
        },
        set() {
          // Serverless 환경에서는 쿠키 설정을 생략
        },
        remove() {
          // Serverless 환경에서는 쿠키 제거를 생략
        },
      },
    }
  );
};
