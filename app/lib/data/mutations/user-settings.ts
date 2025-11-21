/**
 * 사용자 설정 관련 뮤테이션
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '../../../lib/supabaseClient'
import { QUERY_KEYS } from '../constants'

export interface UserSettings {
  notification_enabled?: boolean
  auto_delete_images?: boolean
  language?: string
}

/**
 * 사용자 설정 업데이트 뮤테이션
 */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const mutation = useMutation({
    mutationFn: async (settings: UserSettings) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      // users 테이블에 설정 저장
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }
      
      if (settings.notification_enabled !== undefined) {
        updateData.notification_enabled = settings.notification_enabled
      }
      if (settings.auto_delete_images !== undefined) {
        updateData.auto_delete_images = settings.auto_delete_images
      }
      if (settings.language !== undefined) {
        updateData.language = settings.language
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error
      return settings
    },
    onSuccess: () => {
      // 프로필 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.user.profile(),
      })
    },
  })

  return {
    updateSettings: mutation.mutateAsync,
    ...mutation,
  }
}

