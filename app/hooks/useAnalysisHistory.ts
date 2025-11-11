'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/app/lib/supabaseClient'
import { SkinAnalysis } from '@/app/types'

export function useAnalysisHistory(limit: number = 10) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['skin_analysis', limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('인증이 필요합니다.')

      const { data, error } = await supabase
        .from('skin_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as SkinAnalysis[]
    },
    enabled: !!supabase,
  })
}

