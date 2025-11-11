/**
 * 사용자 관련 뮤테이션
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '../../../lib/supabaseClient'
import { QUERY_KEYS } from '../constants'

export interface UpdateProfileData {
  name?: string
  birth_date?: string
  gender?: string
}

/**
 * 사용자 프로필 업데이트 뮤테이션
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const mutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error('사용자를 찾을 수 없습니다.')

      // users 테이블 업데이트
      const { error } = await supabase
        .from('users')
        .upsert(
          {
            id: user.id,
            ...data,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )

      if (error) throw error
      return { ...data }
    },
    onSuccess: () => {
      // 프로필 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.user.profile(),
      })
    },
  })

  return {
    updateProfile: mutation.mutateAsync,
    ...mutation,
  }
}

