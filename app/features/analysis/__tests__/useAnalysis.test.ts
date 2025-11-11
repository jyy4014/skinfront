/**
 * TDD: AI 분석 훅 테스트
 * 
 * 테스트 시나리오:
 * 1. 분석 요청 성공
 * 2. 분석 진행도 추적
 * 3. 분석 에러 처리
 * 4. 낮은 신뢰도 처리
 */

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { useAnalysis } from '../hooks/useAnalysis'

const mockCreateEdgeFunctionClient = jest.fn()
jest.mock('../../../lib/api', () => ({
  createEdgeFunctionClient: () => mockCreateEdgeFunctionClient(),
}))

describe('useAnalysis', () => {
  let queryClient: QueryClient
  const mockEdgeClient = {
    analyze: jest.fn(),
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

  it('분석을 올바르게 실행해야 함', async () => {
    const mockResponse = {
      status: 'success',
      result_id: '123',
      analysis: { confidence: 0.85 },
      mapping: {},
      nlg: {},
    }

    mockEdgeClient.analyze.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useAnalysis(), { wrapper })

    await waitFor(async () => {
      const analysisResult = await result.current.analyze(
        {
          imageUrl: 'https://example.com/image.jpg',
          userId: 'user123',
          accessToken: 'token123',
        },
        {}
      )

      expect(analysisResult).toEqual(mockResponse)
      expect(mockEdgeClient.analyze).toHaveBeenCalledWith({
        image_url: 'https://example.com/image.jpg',
        user_id: 'user123',
        accessToken: 'token123',
        user_profile: undefined,
        meta: undefined,
      })
    }, { timeout: 10000 })
  })

  it('분석 진행도를 추적해야 함', async () => {
    const mockResponse = {
      status: 'success',
      result_id: '123',
      analysis: {},
      mapping: {},
      nlg: {},
    }

    mockEdgeClient.analyze.mockResolvedValue(mockResponse)
    const onProgress = jest.fn()

    const { result } = renderHook(() => useAnalysis(), { wrapper })

    await waitFor(async () => {
      await result.current.analyze(
        {
          imageUrl: 'https://example.com/image.jpg',
          userId: 'user123',
          accessToken: 'token123',
        },
        { onProgress }
      )

      expect(onProgress).toHaveBeenCalled()
      expect(onProgress).toHaveBeenCalledWith(60, '피부 질감 분석 중...')
    }, { timeout: 10000 })
  })

  it('에러 응답을 올바르게 처리해야 함', async () => {
    const mockErrorResponse = {
      status: 'error',
      error: 'AI 분석 실패',
    }

    mockEdgeClient.analyze.mockResolvedValue(mockErrorResponse)

    const { result } = renderHook(() => useAnalysis(), { wrapper })

    await waitFor(async () => {
      await expect(
        result.current.analyze(
          {
            imageUrl: 'https://example.com/image.jpg',
            userId: 'user123',
            accessToken: 'token123',
          },
          {}
        )
      ).rejects.toThrow('AI 분석 실패')
    })
  })
})

