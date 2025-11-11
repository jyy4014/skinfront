/**
 * TDD: 데이터 뮤테이션 모듈 테스트
 * 
 * 테스트 시나리오:
 * 1. 분석 결과 삭제 뮤테이션
 * 2. 사용자 프로필 업데이트 뮤테이션
 * 3. 쿼리 무효화 확인
 */

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { useDeleteAnalysis, useUpdateProfile } from '../mutations'
import { QUERY_KEYS } from '../constants'

const mockCreateClient = jest.fn()
jest.mock('../../../lib/supabaseClient', () => ({
  createClient: () => mockCreateClient(),
}))

const mockSupabase = {
  from: jest.fn(() => {
    const deleteBuilder = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    }
    const upsertBuilder = {
      upsert: jest.fn().mockResolvedValue({ error: null }),
    }
    
    // from() 호출 시 적절한 빌더 반환
    const builder = {
      delete: jest.fn(() => deleteBuilder),
      eq: jest.fn().mockReturnThis(),
      upsert: jest.fn(() => upsertBuilder),
    }
    return builder
  }),
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null,
    }),
  },
}

describe('Data Mutations', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabase)
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  describe('useDeleteAnalysis', () => {
    it('분석 결과를 올바르게 삭제해야 함', async () => {
      const { result } = renderHook(() => useDeleteAnalysis(), { wrapper })

      await waitFor(async () => {
        await result.current.deleteAnalysis('123')
        expect(result.current.isPending).toBe(false)
      })
    })

    it('삭제 성공 시 히스토리 쿼리를 무효화해야 함', async () => {
      const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries')
      const { result } = renderHook(() => useDeleteAnalysis(), { wrapper })

      await waitFor(async () => {
        await result.current.deleteAnalysis('123')
        expect(invalidateQueries).toHaveBeenCalledWith({
          queryKey: QUERY_KEYS.analysis.history(),
        })
      })
    })
  })

  describe('useUpdateProfile', () => {
    it('프로필을 올바르게 업데이트해야 함', async () => {
      const { result } = renderHook(() => useUpdateProfile(), { wrapper })

      await waitFor(async () => {
        await result.current.updateProfile({ name: 'Test User' })
        expect(result.current.isPending).toBe(false)
      })
    })

    it('업데이트 성공 시 프로필 쿼리를 무효화해야 함', async () => {
      const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries')
      const { result } = renderHook(() => useUpdateProfile(), { wrapper })

      await waitFor(async () => {
        await result.current.updateProfile({ name: 'Test User' })
        expect(invalidateQueries).toHaveBeenCalledWith({
          queryKey: QUERY_KEYS.user.profile(),
        })
      })
    })
  })
})

