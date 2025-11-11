/**
 * TDD: API 클라이언트 통합 모듈 테스트
 * 
 * 테스트 시나리오:
 * 1. 기본 HTTP 요청 성공
 * 2. 에러 응답 처리 (4xx, 5xx)
 * 3. 인증 토큰 포함 요청
 * 4. Edge Function 호출
 * 5. 재시도 로직
 */

import { createApiClient, callEdgeFunction } from '../client'
import { createEdgeFunctionClient } from '../edge-functions'

// fetch 모킹
global.fetch = jest.fn()

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createApiClient', () => {
    it('기본 HTTP GET 요청이 성공해야 함', async () => {
      const mockResponse = { data: 'test' }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const client = createApiClient()
      const result = await client.get('/test')

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('POST 요청이 성공해야 함', async () => {
      const mockResponse = { success: true }
      const requestBody = { name: 'test' }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const client = createApiClient()
      const result = await client.post('/test', requestBody)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      )
    })

    it('4xx 에러 응답을 올바르게 처리해야 함', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid request' }),
      })

      const client = createApiClient()

      await expect(client.get('/test')).rejects.toThrow('Invalid request')
    })

    it('5xx 에러 응답을 올바르게 처리해야 함', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      })

      const client = createApiClient()

      await expect(client.get('/test')).rejects.toThrow('Server error')
    })

    it('인증 토큰이 포함된 요청을 보낼 수 있어야 함', async () => {
      const mockResponse = { data: 'authenticated' }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const client = createApiClient()
      const result = await client.get('/test', {
        headers: {
          Authorization: 'Bearer token123',
        },
      })

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token123',
          }),
        })
      )
    })
  })

  describe('callEdgeFunction', () => {
    it('Edge Function을 올바르게 호출해야 함', async () => {
      const mockResponse = { status: 'success', data: 'test' }
      const supabaseUrl = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await callEdgeFunction('analyze', {
        method: 'POST',
        body: { image_url: 'test.jpg' },
        accessToken: 'token123',
      })

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        `${supabaseUrl}/functions/v1/analyze`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer token123',
          }),
          body: JSON.stringify({ image_url: 'test.jpg' }),
        })
      )
    })

    it('Edge Function 에러 응답을 올바르게 처리해야 함', async () => {
      const supabaseUrl = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'AI 분석 파이프라인 실패',
          error_type: 'AI_PIPELINE_ERROR',
        }),
      })

      await expect(
        callEdgeFunction('analyze', {
          method: 'POST',
          body: { image_url: 'test.jpg' },
          accessToken: 'token123',
        })
      ).rejects.toThrow('AI 분석 파이프라인 실패')
    })
  })
})

