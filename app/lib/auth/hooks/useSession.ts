/**
 * 세션 관리 훅
 */

import { useState, useEffect } from 'react'
import { createClient } from '../../supabaseClient'
import type { Session } from '@supabase/supabase-js'

export interface UseSessionReturn {
  session: Session | null
  accessToken: string | null
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

/**
 * 현재 세션 정보를 관리하는 훅
 */
export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  const fetchSession = async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      setSession(currentSession)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()

    // 세션 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return {
    session,
    accessToken: session?.access_token ?? null,
    loading,
    error,
    refresh: fetchSession,
  }
}

