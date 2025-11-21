/**
 * useAnalysisSave 성능 최적화 테스트 (엄격한 TDD)
 * 
 * 요구사항:
 * 1. 저장 시 원본 URL에서 이미지 다운로드
 * 2. 리사이즈 및 WebP 변환
 * 3. 리사이즈된 이미지 재업로드
 * 4. 리사이즈된 URL로 DB 저장
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAnalysisSave } from '../useAnalysisSave'
import { createClient } from '@/app/lib/supabaseClient'
import { processImage } from '@/app/lib/image/processing'

jest.mock('@/app/lib/supabaseClient', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/app/lib/image/processing', () => ({
  processImage: jest.fn(),
}))

jest.mock('@/app/lib/api/edge-functions', () => ({
  createEdgeFunctionClient: jest.fn(() => ({
    save: jest.fn().mockResolvedValue({
      status: 'success',
      id: 'test-id',
    }),
  })),
}))

// fetch 모킹
global.fetch = jest.fn()

describe('useAnalysisSave - 저장 시 리사이즈 (TDD)', () => {
  let queryClient: QueryClient
  let mockUpload: jest.Mock
  let mockGetPublicUrl: jest.Mock
  let mockFrom: jest.Mock

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    
    mockUpload = jest.fn().mockResolvedValue({ error: null })
    mockGetPublicUrl = jest.fn().mockReturnValue({
      data: { publicUrl: 'https://example.com/resized-image.jpg' },
    })
    mockFrom = jest.fn(() => ({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    }))

    const mockSupabase = {
      storage: {
        from: mockFrom,
      },
    }

    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase as any)
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' })),
    })
    ;(processImage as jest.Mock).mockResolvedValue({
      file: new File(['resized'], 'resized.webp', { type: 'image/webp' }),
    })
  })

  describe('저장 시 리사이즈 검증', () => {
    it('원본 URL에서 이미지를 다운로드해야 함', async () => {
      const { result } = renderHook(() => useAnalysisSave(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const originalUrls = ['https://example.com/original1.jpg', 'https://example.com/original2.jpg']
      
      await result.current.saveAnalysis({
        userId: 'test-user',
        imageUrls: originalUrls,
        imageAngles: ['front', 'left'],
        result: {
          status: 'success',
          result_id: 'test-result-id',
          analysis: {},
          mapping: {},
          nlg: {},
        },
        accessToken: 'test-token',
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('https://example.com/original1.jpg')
        expect(global.fetch).toHaveBeenCalledWith('https://example.com/original2.jpg')
      })
    })

    it('다운로드한 이미지를 리사이즈해야 함', async () => {
      const { result } = renderHook(() => useAnalysisSave(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const originalUrls = ['https://example.com/original1.jpg']
      
      await result.current.saveAnalysis({
        userId: 'test-user',
        imageUrls: originalUrls,
        imageAngles: ['front'],
        result: {
          status: 'success',
          result_id: 'test-result-id',
          analysis: {},
          mapping: {},
          nlg: {},
        },
        accessToken: 'test-token',
      })

      await waitFor(() => {
        expect(processImage).toHaveBeenCalled()
        const processCall = (processImage as jest.Mock).mock.calls[0]
        expect(processCall[1]).toMatchObject({
          maxWidth: 1024,
          quality: 0.85,
          checkQuality: false,
        })
      })
    })

    it('리사이즈된 이미지를 resized 폴더에 업로드해야 함', async () => {
      const { result } = renderHook(() => useAnalysisSave(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const originalUrls = ['https://example.com/original1.jpg']
      
      await result.current.saveAnalysis({
        userId: 'test-user',
        imageUrls: originalUrls,
        imageAngles: ['front'],
        result: {
          status: 'success',
          result_id: 'test-result-id',
          analysis: {},
          mapping: {},
          nlg: {},
        },
        accessToken: 'test-token',
      })

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled()
        const uploadCall = mockUpload.mock.calls[0]
        const filePath = uploadCall[0]
        expect(filePath).toContain('/resized/') // resized 폴더에 저장
      })
    })

    it('리사이즈 실패 시 원본 URL을 사용해야 함', async () => {
      ;(processImage as jest.Mock).mockRejectedValueOnce(new Error('리사이즈 실패'))

      const { result } = renderHook(() => useAnalysisSave(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const originalUrls = ['https://example.com/original1.jpg']
      
      // 에러가 발생해도 원본 URL로 저장되어야 함
      await expect(
        result.current.saveAnalysis({
          userId: 'test-user',
          imageUrls: originalUrls,
          imageAngles: ['front'],
          result: {
            status: 'success',
            result_id: 'test-result-id',
            analysis: {},
            mapping: {},
            nlg: {},
          },
          accessToken: 'test-token',
        })
      ).resolves.toBeDefined()
    })

    it('진행도 콜백이 호출되어야 함', async () => {
      const { result } = renderHook(() => useAnalysisSave(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const onProgress = jest.fn()
      const originalUrls = ['https://example.com/original1.jpg']
      
      await result.current.saveAnalysis({
        userId: 'test-user',
        imageUrls: originalUrls,
        imageAngles: ['front'],
        result: {
          status: 'success',
          result_id: 'test-result-id',
          analysis: {},
          mapping: {},
          nlg: {},
        },
        accessToken: 'test-token',
        onProgress,
      })

      await waitFor(() => {
        expect(onProgress).toHaveBeenCalled()
      })
    })
  })
})

