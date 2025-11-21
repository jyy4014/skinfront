/**
 * 인증 상태 관리 훅
 */

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '../../supabaseClient'
import type { User } from '@supabase/supabase-js'

export interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

/**
 * 현재 사용자 정보 및 인증 상태를 관리하는 훅
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  // supabase 클라이언트를 useMemo로 메모이제이션하여 무한 루프 방지
  const supabase = useMemo(() => createClient(), [])

  const fetchUser = async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      setUser(currentUser)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 자동 로그인: 저장된 세션 복원
    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUser(session.user)
          setLoading(false)
        } else {
          fetchUser()
        }
      } catch (err) {
        console.error('Restore session error:', err)
        fetchUser()
      }
    }

    restoreSession()

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    refresh: fetchUser,
  }
}

