'use client'

import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseUrl, getSupabaseAnonKey } from './config'

export function createClient() {
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  // Supabase SSR은 기본적으로 쿠키를 사용하여 세션을 유지합니다
  // 자동 로그인은 Supabase가 기본적으로 지원합니다
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

