/**
 * 사용자 관련 쿼리
 */

'use client'

import { useMemo } from 'react'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { createClient } from '../../../lib/supabaseClient'
import { QUERY_KEYS } from '../constants'
import type { User } from '@supabase/supabase-js'

/**
 * 사용자 프로필 조회 쿼리
 * @param user - useAuth에서 가져온 user 객체 (중복 호출 방지)
 */
export function useUserProfile(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'> & {
    user?: User | null
  }
) {
  // supabase 클라이언트를 useMemo로 메모이제이션하여 무한 루프 방지
  const supabase = useMemo(() => createClient(), [])
  const { user, ...queryOptions } = options || {}

  return useQuery({
    queryKey: QUERY_KEYS.user.profile(),
    queryFn: async () => {
      // user가 전달되면 재사용, 없으면 새로 가져오기
      let currentUser = user
      
      if (!currentUser) {
        const {
          data: { user: fetchedUser },
          error,
        } = await supabase.auth.getUser()

        if (error) throw error
        if (!fetchedUser) return null
        
        currentUser = fetchedUser
      }

      // 프로필 추가 정보가 필요한 경우 users 테이블에서 조회
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116은 "not found" 에러이므로 무시
        throw profileError
      }

      return {
        ...currentUser,
        profile: profile || null,
      }
    },
    enabled: queryOptions.enabled !== false && (!!user || queryOptions.enabled === undefined),
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    ...queryOptions,
  })
}

