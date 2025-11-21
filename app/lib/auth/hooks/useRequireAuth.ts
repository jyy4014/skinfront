/**
 * 인증 필수 페이지용 훅
 * 인증되지 않은 경우 자동으로 로그인 페이지로 리다이렉트
 */

import { useEffect, useRef, startTransition } from 'react'
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
  const hasRedirected = useRef(false)
  const optionsRef = useRef({ redirectTo, redirectIfAuthenticated, redirectToIfAuthenticated })

  // options가 변경되면 ref 업데이트
  useEffect(() => {
    optionsRef.current = { redirectTo, redirectIfAuthenticated, redirectToIfAuthenticated }
  }, [redirectTo, redirectIfAuthenticated, redirectToIfAuthenticated])

  useEffect(() => {
    // 로딩 중이거나 이미 리다이렉트한 경우 무시
    if (auth.loading || hasRedirected.current) return

    // 인증되지 않은 경우 리다이렉트
    if (!auth.isAuthenticated) {
      hasRedirected.current = true
      // startTransition을 사용하여 리다이렉트를 트랜지션으로 처리
      // 이렇게 하면 렌더링 중 상태 업데이트 경고를 방지할 수 있습니다
      startTransition(() => {
        router.replace(optionsRef.current.redirectTo)
      })
      return
    }

    // 이미 인증된 경우 다른 페이지로 리다이렉트 (예: 로그인 페이지에서 홈으로)
    if (optionsRef.current.redirectIfAuthenticated && optionsRef.current.redirectToIfAuthenticated) {
      hasRedirected.current = true
      startTransition(() => {
        router.replace(optionsRef.current.redirectToIfAuthenticated!)
      })
    }
  }, [auth.isAuthenticated, auth.loading, router])

  // 인증 상태가 변경되면 리다이렉트 플래그 리셋
  useEffect(() => {
    if (auth.loading) {
      hasRedirected.current = false
    }
  }, [auth.loading])

  return auth
}

