/**
 * 인증 유틸리티 함수
 */

import { createClient } from '../supabaseClient'

/**
 * 현재 사용자의 액세스 토큰 가져오기
 */
export async function getAccessToken(): Promise<string | null> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

/**
 * 현재 사용자 정보 가져오기
 */
export async function getCurrentUser() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

/**
 * 로그아웃
 */
export async function signOut(redirectTo?: string) {
  const supabase = createClient()
  await supabase.auth.signOut()
  if (redirectTo && typeof window !== 'undefined') {
    window.location.href = redirectTo
  }
}

