/**
 * 시술 관련 뮤테이션
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '../../../lib/supabaseClient'
import { QUERY_KEYS } from '../constants'

/**
 * 관심 시술 등록/해제 뮤테이션
 */
export function useToggleFavoriteTreatment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const mutation = useMutation({
    mutationFn: async (treatmentId: string) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error('사용자를 찾을 수 없습니다.')

      // 현재 사용자의 preferred_treatments 조회
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('preferred_treatments')
        .eq('id', user.id)
        .single()

      if (fetchError) throw fetchError

      const currentFavorites: string[] = (userData?.preferred_treatments as string[]) || []
      const isFavorite = currentFavorites.includes(treatmentId)

      // 등록/해제
      const newFavorites = isFavorite
        ? currentFavorites.filter((id) => id !== treatmentId)
        : [...currentFavorites, treatmentId]

      // 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({
          preferred_treatments: newFavorites,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      return {
        treatmentId,
        isFavorite: !isFavorite,
        favorites: newFavorites,
      }
    },
    onSuccess: () => {
      // 프로필 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.user.profile(),
      })
    },
  })

  return {
    toggleFavorite: mutation.mutateAsync,
    ...mutation,
  }
}


