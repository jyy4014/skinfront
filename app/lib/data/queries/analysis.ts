/**
 * 분석 관련 쿼리
 */

'use client'

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { createClient } from '../../../lib/supabaseClient'
import { QUERY_KEYS } from '../constants'

export interface AnalysisHistoryFilters {
  page?: number
  limit?: number
  userId?: string
}

export interface AnalysisHistoryQueryOptions
  extends Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'> {
  filters?: AnalysisHistoryFilters
}

/**
 * 분석 히스토리 조회 쿼리
 */
export function useAnalysisHistory(
  options: AnalysisHistoryQueryOptions = {}
) {
  const { filters = {}, ...queryOptions } = options
  const supabase = createClient()

  return useQuery({
    queryKey: QUERY_KEYS.analysis.history(filters),
    queryFn: async () => {
      const { page = 1, limit = 10, userId } = filters

      let query = supabase
        .from('skin_analysis')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      // userId가 없으면 현재 사용자 ID 사용
      if (!userId) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          query = query.eq('user_id', user.id)
        }
      } else {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
    ...queryOptions,
  })
}

/**
 * 단일 분석 결과 조회 쿼리
 */
export function useAnalysisById(
  id: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  const supabase = createClient()

  return useQuery({
    queryKey: QUERY_KEYS.analysis.byId(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skin_analysis')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
    ...options,
  })
}

/**
 * 사용자별 분석 결과 조회 쿼리
 */
export function useAnalysisByUserId(
  userId: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  const supabase = createClient()

  return useQuery({
    queryKey: QUERY_KEYS.analysis.byUserId(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skin_analysis')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!userId,
    ...options,
  })
}

