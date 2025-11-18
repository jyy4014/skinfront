/**
 * 사용자 관련 뮤테이션
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '../../../lib/supabaseClient'
import { QUERY_KEYS } from '../constants'

export interface UpdateProfileData {
  name?: string
  nickname?: string
  birth_date?: string | null
  gender?: string | null
  phone_number?: string | null
  nationality?: string | null
  skin_type?: string | null
  main_concerns?: string[] | null
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
      // main_concerns는 JSONB 배열이므로 그대로 전달
      const updateData: any = {
        id: user.id,
        ...data,
        updated_at: new Date().toISOString(),
      }

      // main_concerns가 배열인 경우 JSONB로 변환
      if (data.main_concerns !== undefined) {
        updateData.main_concerns = Array.isArray(data.main_concerns) ? data.main_concerns : null
      }

      const { error } = await supabase
        .from('users')
        .upsert(updateData, { onConflict: 'id' })

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

