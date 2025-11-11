/**
 * TDD: 분석 결과 저장 훅 테스트
 * 
 * 테스트 시나리오:
 * 1. 결과 저장 성공
 * 2. 저장 에러 처리
 * 3. 쿼리 무효화 확인
 */

import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAnalysisSave } from '../hooks/useAnalysisSave'
import { QUERY_KEYS } from '../../../lib/data'

const mockCreateEdgeFunctionClient = jest.fn()
jest.mock('../../../lib/api', () => ({
  createEdgeFunctionClient: () => mockCreateEdgeFunctionClient(),
}))

describe('useAnalysisSave', () => {
  let queryClient: QueryClient
  const mockEdgeClient = {
    save: jest.fn(),
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    jest.clearAllMocks()
    mockCreateEdgeFunctionClient.mockReturnValue(mockEdgeClient)
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  it('결과를 올바르게 저장해야 함', async () => {
    const mockSaveResponse = {
      status: 'success',
      id: '456',
    }

    mockEdgeClient.save.mockResolvedValue(mockSaveResponse)

    const { result } = renderHook(() => useAnalysisSave(), { wrapper })

    await waitFor(async () => {
      const saveResult = await result.current.saveAnalysis({
        userId: 'user123',
        imageUrl: 'https://example.com/image.jpg',
        result: {
          result_id: '123',
          analysis: {},
          mapping: {},
          nlg: {},
        },
        accessToken: 'token123',
      })

      expect(saveResult).toEqual(mockSaveResponse)
      expect(mockEdgeClient.save).toHaveBeenCalled()
    })
  })

  it('저장 실패 시 에러를 던져야 함', async () => {
    mockEdgeClient.save.mockRejectedValue(new Error('저장 실패'))

    const { result } = renderHook(() => useAnalysisSave(), { wrapper })

    await waitFor(async () => {
      await expect(
        result.current.saveAnalysis({
          userId: 'user123',
          imageUrl: 'https://example.com/image.jpg',
          result: {
            result_id: '123',
            analysis: {},
            mapping: {},
            nlg: {},
          },
          accessToken: 'token123',
        })
      ).rejects.toThrow('저장 실패')
    })
  })

  it('저장 성공 시 히스토리 쿼리를 무효화해야 함', async () => {
    const mockSaveResponse = {
      status: 'success',
      id: '456',
    }

    mockEdgeClient.save.mockResolvedValue(mockSaveResponse)
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useAnalysisSave(), { wrapper })

    await waitFor(async () => {
      await result.current.saveAnalysis({
        userId: 'user123',
        imageUrl: 'https://example.com/image.jpg',
        result: {
          result_id: '123',
          analysis: {},
          mapping: {},
          nlg: {},
        },
        accessToken: 'token123',
      })

      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.analysis.history(),
      })
    })
  })
})

