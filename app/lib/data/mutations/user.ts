/**
 * 사용자 관련 뮤테이션
 */

'use client'

import { useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '../../../lib/supabaseClient'
import { QUERY_KEYS } from '../constants'

export interface UpdateProfileData {
  name?: string
  nickname?: string
  birth_date?: string | null
  gender?: string | null
  phone_number?: string | null
  country?: string | null
  skin_type?: string | null
  main_concerns?: string[] | null
  preferred_treatments?: string[] | null
}

/**
 * 사용자 프로필 업데이트 뮤테이션
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  // supabase 클라이언트를 useMemo로 메모이제이션하여 무한 루프 방지
  const supabase = useMemo(() => createClient(), [])

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
      // NOT NULL 제약 조건이 있는 필드들은 항상 포함해야 함
      const updateData: any = {
        id: user.id,
        email: user.email, // NOT NULL, 기본값 없음
        country: data.country || 'KR', // NOT NULL, 기본값 'KR'
        gender: data.gender || 'prefer_not_to_say', // NOT NULL, 기본값 'prefer_not_to_say'
        phone_number: data.phone_number || '', // NOT NULL, 기본값 ''
        ...data,
        updated_at: new Date().toISOString(), // NOT NULL, 기본값 있지만 명시적으로 제공
      }

      // main_concerns가 배열인 경우 JSONB로 변환
      if (data.main_concerns !== undefined) {
        updateData.main_concerns = Array.isArray(data.main_concerns) ? data.main_concerns : null
      }

      // preferred_treatments가 배열인 경우 JSONB로 변환
      if (data.preferred_treatments !== undefined) {
        updateData.preferred_treatments = Array.isArray(data.preferred_treatments) ? data.preferred_treatments : null
      }

      const { error } = await supabase
        .from('users')
        .upsert(updateData, { onConflict: 'id' })

      if (error) throw error
      return { ...data }
    },
    onSuccess: () => {
      // 프로필 쿼리 무효화는 컴포넌트에서 리다이렉트 후 처리하도록 변경
      // 무한 루프 방지를 위해 여기서는 무효화하지 않음
    },
  })

  return {
    updateProfile: mutation.mutateAsync,
    ...mutation,
  }
}

