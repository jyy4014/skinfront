import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 빌드 시 환경 변수가 없으면 placeholder 사용 (빌드 에러 방지)
  // 런타임에 실제 환경 변수가 없으면 에러 발생
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
      // 서버 사이드 (빌드 시): placeholder 사용
      return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
      )
    }
    // 클라이언트 사이드: 에러 발생
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

