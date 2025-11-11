/**
 * 분석 관련 뮤테이션
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '../../../lib/supabaseClient'
import { QUERY_KEYS } from '../constants'

/**
 * 분석 결과 삭제 뮤테이션
 */
export function useDeleteAnalysis() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('skin_analysis')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id }
    },
    onSuccess: () => {
      // 히스토리 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.analysis.history(),
      })
    },
  })

  return {
    deleteAnalysis: mutation.mutateAsync,
    ...mutation,
  }
}

