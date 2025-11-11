/**
 * 인증 필수 페이지용 훅
 * 인증되지 않은 경우 자동으로 로그인 페이지로 리다이렉트
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './useAuth'

export interface UseRequireAuthOptions {
  redirectTo?: string
  redirectIfAuthenticated?: boolean
  redirectToIfAuthenticated?: string
}

/**
 * 인증이 필요한 페이지에서 사용하는 훅
 * 인증되지 않은 경우 자동으로 리다이렉트
 */
export function useRequireAuth(
  options: UseRequireAuthOptions = {}
): ReturnType<typeof useAuth> {
  const { redirectTo = '/auth/login', redirectIfAuthenticated = false, redirectToIfAuthenticated } = options
  const router = useRouter()
  const auth = useAuth()

  useEffect(() => {
    if (auth.loading) return

    // 인증되지 않은 경우 리다이렉트
    if (!auth.isAuthenticated) {
      router.push(redirectTo)
      return
    }

    // 이미 인증된 경우 다른 페이지로 리다이렉트 (예: 로그인 페이지에서 홈으로)
    if (redirectIfAuthenticated && redirectToIfAuthenticated) {
      router.push(redirectToIfAuthenticated)
    }
  }, [auth.isAuthenticated, auth.loading, redirectTo, redirectIfAuthenticated, redirectToIfAuthenticated, router])

  return auth
}

