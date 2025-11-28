import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { checkClientSession, refreshSession, clearStoredSession } from '@/lib/auth/sessionUtils'

interface AuthState {
  isAuthenticated: boolean
  userId: string | null
  isLoading: boolean
  error: string | null
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userId: null,
    isLoading: true,
    error: null
  })

  // 세션 검증
  const validateSession = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

      const clientSession = checkClientSession()

      if (clientSession.isValid && clientSession.userId) {
        setAuthState({
          isAuthenticated: true,
          userId: clientSession.userId,
          isLoading: false,
          error: null
        })
        return { isValid: true, userId: clientSession.userId }
      }

      // 클라이언트 세션이 유효하지 않으면 서버 세션 체크
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        throw error
      }

      if (session) {
        // 서버 세션 존재 - localStorage 업데이트
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userId', session.user.id)
        const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + (24 * 60 * 60 * 1000)
        localStorage.setItem('sessionExpiresAt', expiresAt.toString())

        setAuthState({
          isAuthenticated: true,
          userId: session.user.id,
          isLoading: false,
          error: null
        })
        return { isValid: true, userId: session.user.id }
      }

      // 세션 없음
      setAuthState({
        isAuthenticated: false,
        userId: null,
        isLoading: false,
        error: null
      })
      return { isValid: false }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '세션 검증 실패'
      console.error('Session validation error:', error)
      setAuthState({
        isAuthenticated: false,
        userId: null,
        isLoading: false,
        error: errorMessage
      })
      return { isValid: false, error: errorMessage }
    }
  }, [])

  // 세션 갱신
  const refreshUserSession = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

      const result = await refreshSession()

      if (result.isValid && result.userId) {
        setAuthState({
          isAuthenticated: true,
          userId: result.userId,
          isLoading: false,
          error: null
        })
        return { success: true, userId: result.userId }
      }

      setAuthState({
        isAuthenticated: false,
        userId: null,
        isLoading: false,
        error: result.error || '세션 갱신 실패'
      })
      return { success: false, error: result.error }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '세션 갱신 중 오류 발생'
      console.error('Session refresh error:', error)
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [])

  // 로그아웃
  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      clearStoredSession()

      setAuthState({
        isAuthenticated: false,
        userId: null,
        isLoading: false,
        error: null
      })

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그아웃 실패'
      console.error('Sign out error:', error)
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [])

  // 초기화 및 세션 모니터링
  useEffect(() => {
    let sessionCheckInterval: NodeJS.Timeout | null = null

    const initializeAuth = async () => {
      await validateSession()

      // 세션 만료 모니터링 (10분마다)
      sessionCheckInterval = setInterval(async () => {
        if (authState.isAuthenticated) {
          const clientSession = checkClientSession()
          if (!clientSession.isValid) {
            console.log('Session expired, attempting refresh...')
            await refreshUserSession()
          }
        }
      }, 10 * 60 * 1000) // 10분
    }

    initializeAuth()

    // Supabase 인증 상태 변경 리스너
    const supabase = createClient()
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed in hook:', event, !!session)

      if (event === 'SIGNED_IN' && session) {
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userId', session.user.id)
        const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + (24 * 60 * 60 * 1000)
        localStorage.setItem('sessionExpiresAt', expiresAt.toString())

        setAuthState({
          isAuthenticated: true,
          userId: session.user.id,
          isLoading: false,
          error: null
        })

      } else if (event === 'SIGNED_OUT') {
        clearStoredSession()
        setAuthState({
          isAuthenticated: false,
          userId: null,
          isLoading: false,
          error: null
        })

      } else if (event === 'TOKEN_REFRESHED' && session) {
        // 토큰 갱신 성공
        const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + (24 * 60 * 60 * 1000)
        localStorage.setItem('sessionExpiresAt', expiresAt.toString())
        console.log('Token refreshed successfully')
      }
    })

    return () => {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval)
      }
      authListener?.subscription.unsubscribe()
    }
  }, [validateSession, refreshUserSession])

  return {
    ...authState,
    validateSession,
    refreshSession: refreshUserSession,
    signOut
  }
}
