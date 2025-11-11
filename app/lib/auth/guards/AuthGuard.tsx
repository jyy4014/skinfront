/**
 * 인증 가드 컴포넌트
 * 인증되지 않은 사용자를 자동으로 리다이렉트
 */

'use client'

import { ReactNode } from 'react'
import { useRequireAuth } from '../hooks/useRequireAuth'

export interface AuthGuardProps {
  children: ReactNode
  redirectTo?: string
  fallback?: ReactNode
}

/**
 * 인증이 필요한 페이지를 감싸는 컴포넌트
 */
export function AuthGuard({
  children,
  redirectTo = '/auth/login',
  fallback,
}: AuthGuardProps) {
  const { loading, isAuthenticated } = useRequireAuth({ redirectTo })

  if (loading) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-600">로딩 중...</div>
        </div>
      )
    )
  }

  if (!isAuthenticated) {
    return null // 리다이렉트 중
  }

  return <>{children}</>
}

