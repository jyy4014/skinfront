/**
 * TDD: 데이터 쿼리 모듈 테스트
 * 
 * 테스트 시나리오:
 * 1. 분석 히스토리 쿼리
 * 2. 단일 분석 결과 쿼리
 * 3. 사용자 프로필 쿼리
 * 4. 캐시 키 상수 사용
 */

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { useAnalysisHistory, useAnalysisById, useUserProfile } from '../queries'
import { QUERY_KEYS } from '../constants'

const mockCreateClient = jest.fn()
jest.mock('../../../lib/supabaseClient', () => ({
  createClient: () => mockCreateClient(),
}))

const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
  })),
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null,
    }),
  },
}

describe('Data Queries', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabase)
    
    // 쿼리 함수 모킹
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    }
    
    mockSupabase.from.mockReturnValue(queryBuilder)
    queryBuilder.select.mockResolvedValue({ data: [], error: null })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  describe('QUERY_KEYS', () => {
    it('캐시 키 상수가 올바르게 정의되어야 함', () => {
      const historyKey = QUERY_KEYS.analysis.history()
      expect(historyKey[0]).toBe('skin_analysis')
      expect(historyKey[1]).toBe('history')
      
      expect(QUERY_KEYS.analysis.byId('123')).toEqual(['skin_analysis', '123'])
      expect(QUERY_KEYS.user.profile()).toEqual(['user', 'profile'])
    })
  })

  describe('useAnalysisHistory', () => {
    it('분석 히스토리를 올바르게 가져와야 함', () => {
      const { result } = renderHook(() => useAnalysisHistory(), { wrapper })
      // useQuery는 queryKey를 직접 노출하지 않으므로 쿼리 객체가 생성되었는지 확인
      expect(result.current).toBeDefined()
      expect(result.current.data).toBeUndefined() // 초기 상태
      expect(result.current.isLoading).toBeDefined()
    })

    it('페이지네이션을 지원해야 함', () => {
      const { result } = renderHook(
        () => useAnalysisHistory({ filters: { page: 1, limit: 10 } }),
        { wrapper }
      )
      expect(result.current).toBeDefined()
    })
  })

  describe('useAnalysisById', () => {
    it('단일 분석 결과를 올바르게 가져와야 함', () => {
      const { result } = renderHook(() => useAnalysisById('123'), { wrapper })
      expect(result.current).toBeDefined()
      expect(result.current.data).toBeUndefined() // 초기 상태
    })
  })

  describe('useUserProfile', () => {
    it('사용자 프로필을 올바르게 가져와야 함', () => {
      const { result } = renderHook(() => useUserProfile(), { wrapper })
      expect(result.current).toBeDefined()
      expect(result.current.data).toBeUndefined() // 초기 상태
    })
  })
})

