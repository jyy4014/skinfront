/**
 * 사용자 관련 쿼리
 */

'use client'

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { createClient } from '../../../lib/supabaseClient'
import { QUERY_KEYS } from '../constants'

/**
 * 사용자 프로필 조회 쿼리
 */
export function useUserProfile(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  const supabase = createClient()

  return useQuery({
    queryKey: QUERY_KEYS.user.profile(),
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) throw error
      if (!user) return null

      // 프로필 추가 정보가 필요한 경우 users 테이블에서 조회
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116은 "not found" 에러이므로 무시
        throw profileError
      }

      return {
        ...user,
        profile: profile || null,
      }
    },
    ...options,
  })
}

