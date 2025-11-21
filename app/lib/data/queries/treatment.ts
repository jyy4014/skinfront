/**
 * 시술 관련 쿼리
 */

'use client'

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { createClient } from '../../../lib/supabaseClient'
import { QUERY_KEYS } from '../constants'

/**
 * 시술 상세 정보 조회 쿼리
 */
export function useTreatmentById(
  id: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  const supabase = createClient()

  return useQuery({
    queryKey: QUERY_KEYS.treatment.byId(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatments')
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
 * 추천 시술 목록 조회 (트렌드/인기도 기반)
 */
export function useRecommendedTreatments(
  options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>
) {
  const supabase = createClient()

  return useQuery({
    queryKey: QUERY_KEYS.treatment.recommended(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatments')
        .select('id, name, description, trend_score, popularity_score, cost')
        .order('trend_score', { ascending: false })
        .order('popularity_score', { ascending: false })
        .limit(3)

      if (error) throw error

      if (data && data.length > 0) {
        return data
      }

      // 데이터가 없으면 빈 배열 반환 (fallback 제거)
      return []
    },
    staleTime: 10 * 60 * 1000, // 10분간 캐시 유지
    ...options,
  })
}

/**
 * 사용자의 관심 시술 목록 조회
 */
export function useFavoriteTreatments(
  options?: Omit<UseQueryOptions<string[], Error>, 'queryKey' | 'queryFn'>
) {
  const supabase = createClient()

  return useQuery({
    queryKey: QUERY_KEYS.user.profile(),
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return []

      const { data, error } = await supabase
        .from('users')
        .select('preferred_treatments')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return (data?.preferred_treatments as string[]) || []
    },
    ...options,
  })
}

/**
 * 사용자의 최근 분석 결과에서 특정 시술 정보 조회
 */
export function useTreatmentFromRecentAnalysis(treatmentId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: QUERY_KEYS.treatment.fromAnalysis(treatmentId),
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return null

      // 최근 분석 결과 조회 (stage_b_mapping_result와 stage_c_nlg_result 포함)
      const { data: analyses, error: analysisError } = await supabase
        .from('skin_analysis')
        .select('stage_b_mapping_result, stage_c_nlg_result, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (analysisError) throw analysisError

      // stage_b_mapping_result에서 해당 시술 찾기
      const mappingResult = analyses?.stage_b_mapping_result as any
      const treatmentCandidate = mappingResult?.treatment_candidates?.find(
        (t: any) => t.id === treatmentId
      )

      if (!treatmentCandidate) return null

      // NLG 결과 가져오기
      const nlgResult = analyses?.stage_c_nlg_result as any

      return {
        treatment: treatmentCandidate,
        nlg: nlgResult || null,
      }
    },
    enabled: !!treatmentId,
  })
}
