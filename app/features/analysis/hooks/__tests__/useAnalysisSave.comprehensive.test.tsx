/**
 * useAnalysisSave 엄격한 TDD 테스트
 * 
 * 모든 엣지 케이스와 에러 시나리오를 포함한 포괄적인 테스트
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
    save: jest.fn(),
  })),
}))

// fetch 모킹
global.fetch = jest.fn()

describe('useAnalysisSave - 엄격한 TDD (모든 엣지 케이스)', () => {
  let queryClient: QueryClient
  let mockUpload: jest.Mock
  let mockGetPublicUrl: jest.Mock
  let mockFrom: jest.Mock
  let mockEdgeSave: jest.Mock

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
    mockEdgeSave = jest.fn().mockResolvedValue({
      status: 'success',
      id: 'test-id',
    })

    const mockSupabase = {
      storage: {
        from: mockFrom,
      },
    }

    const { createEdgeFunctionClient } = require('@/app/lib/api/edge-functions')
    createEdgeFunctionClient.mockReturnValue({
      save: mockEdgeSave,
    })

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

  describe('정상 플로우', () => {
    it('원본 이미지 다운로드 → 리사이즈 → 업로드 → 저장 성공', async () => {
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
        expect(global.fetch).toHaveBeenCalledWith('https://example.com/original1.jpg')
        expect(processImage).toHaveBeenCalled()
        expect(mockUpload).toHaveBeenCalled()
        expect(mockEdgeSave).toHaveBeenCalled()
      })

      // 리사이즈된 URL로 저장되었는지 확인
      const saveCall = mockEdgeSave.mock.calls[0]
      expect(saveCall[0].imageUrls[0]).toBe('https://example.com/resized-image.jpg')
    })

    it('여러 이미지 순차 처리 성공', async () => {
      const { result } = renderHook(() => useAnalysisSave(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const originalUrls = [
        'https://example.com/original1.jpg',
        'https://example.com/original2.jpg',
        'https://example.com/original3.jpg',
      ]
      
      await result.current.saveAnalysis({
        userId: 'test-user',
        imageUrls: originalUrls,
        imageAngles: ['front', 'left', 'right'],
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
        expect(global.fetch).toHaveBeenCalledTimes(3)
        expect(processImage).toHaveBeenCalledTimes(3)
        expect(mockUpload).toHaveBeenCalledTimes(3)
      })
    })

    it('진행도 콜백이 올바른 순서로 호출됨', async () => {
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

      // 진행도는 증가하는 순서여야 함
      const progressValues = onProgress.mock.calls.map(call => call[0])
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1])
      }
    })

    it('리사이즈된 이미지가 resized 폴더에 저장됨', async () => {
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
      })

      const uploadCall = mockUpload.mock.calls[0]
      const filePath = uploadCall[0]
      expect(filePath).toContain('/resized/')
      expect(filePath).toContain('test-user')
    })
  })

  describe('에러 처리', () => {
    it('result_id가 없으면 에러 발생', async () => {
      const { result } = renderHook(() => useAnalysisSave(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      await expect(
        result.current.saveAnalysis({
          userId: 'test-user',
          imageUrls: ['https://example.com/original1.jpg'],
          imageAngles: ['front'],
          result: {
            status: 'success',
            result_id: '', // 빈 문자열
            analysis: {},
            mapping: {},
            nlg: {},
          },
          accessToken: 'test-token',
        })
      ).rejects.toThrow('분석 결과 ID가 없습니다.')
    })

    it('원본 이미지 다운로드 실패 시 원본 URL 사용', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      })

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

      // 원본 URL이 그대로 저장되었는지 확인
      await waitFor(() => {
        expect(mockEdgeSave).toHaveBeenCalled()
      })

      const saveCall = mockEdgeSave.mock.calls[0]
      expect(saveCall[0].imageUrls[0]).toBe(originalUrls[0])
    })

    it('리사이즈 실패 시 원본 URL 사용', async () => {
      ;(processImage as jest.Mock).mockRejectedValueOnce(new Error('리사이즈 실패'))

      const { result } = renderHook(() => useAnalysisSave(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const originalUrls = ['https://example.com/original1.jpg']
      
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

      // 원본 URL이 그대로 저장되었는지 확인
      await waitFor(() => {
        expect(mockEdgeSave).toHaveBeenCalled()
      })

      const saveCall = mockEdgeSave.mock.calls[0]
      expect(saveCall[0].imageUrls[0]).toBe(originalUrls[0])
    })

    it('리사이즈된 이미지 업로드 실패 시 원본 URL 사용', async () => {
      mockUpload.mockResolvedValueOnce({
        error: { message: 'Upload failed', statusCode: 500 },
      })

      const { result } = renderHook(() => useAnalysisSave(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const originalUrls = ['https://example.com/original1.jpg']
      
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

      // 원본 URL이 그대로 저장되었는지 확인
      await waitFor(() => {
        expect(mockEdgeSave).toHaveBeenCalled()
      })

      const saveCall = mockEdgeSave.mock.calls[0]
      expect(saveCall[0].imageUrls[0]).toBe(originalUrls[0])
    })

    it('일부 이미지만 실패해도 나머지는 처리됨', async () => {
      // 두 번째 이미지만 실패
      ;(processImage as jest.Mock)
        .mockResolvedValueOnce({
          file: new File(['resized1'], 'resized1.webp', { type: 'image/webp' }),
        })
        .mockRejectedValueOnce(new Error('리사이즈 실패'))
        .mockResolvedValueOnce({
          file: new File(['resized3'], 'resized3.webp', { type: 'image/webp' }),
        })

      const { result } = renderHook(() => useAnalysisSave(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const originalUrls = [
        'https://example.com/original1.jpg',
        'https://example.com/original2.jpg',
        'https://example.com/original3.jpg',
      ]
      
      await expect(
        result.current.saveAnalysis({
          userId: 'test-user',
          imageUrls: originalUrls,
          imageAngles: ['front', 'left', 'right'],
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

      // 저장 호출 확인
      await waitFor(() => {
        expect(mockEdgeSave).toHaveBeenCalled()
      })

      const saveCall = mockEdgeSave.mock.calls[0]
      // 첫 번째와 세 번째는 리사이즈된 URL, 두 번째는 원본 URL
      expect(saveCall[0].imageUrls[0]).toContain('resized')
      expect(saveCall[0].imageUrls[1]).toBe(originalUrls[1]) // 원본 URL
      expect(saveCall[0].imageUrls[2]).toContain('resized')
    })
  })

  describe('경계값 테스트', () => {
    it('빈 이미지 URL 배열 처리', async () => {
      const { result } = renderHook(() => useAnalysisSave(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      await expect(
        result.current.saveAnalysis({
          userId: 'test-user',
          imageUrls: [],
          imageAngles: [],
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

      // 빈 배열이 그대로 전달되어야 함
      await waitFor(() => {
        expect(mockEdgeSave).toHaveBeenCalled()
      })

      const saveCall = mockEdgeSave.mock.calls[0]
      expect(saveCall[0].imageUrls).toEqual([])
    })

    it('1개 이미지 처리', async () => {
      const { result } = renderHook(() => useAnalysisSave(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const originalUrls = ['https://example.com/original1.jpg']
      
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

    it('3개 이미지 처리 (최대 권장)', async () => {
      const { result } = renderHook(() => useAnalysisSave(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const originalUrls = Array.from({ length: 3 }, (_, i) =>
        `https://example.com/original${i + 1}.jpg`
      )
      
      await expect(
        result.current.saveAnalysis({
          userId: 'test-user',
          imageUrls: originalUrls,
          imageAngles: ['front', 'left', 'right'],
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
  })

  describe('데이터 검증', () => {
    it('리사이즈 옵션이 올바르게 전달됨', async () => {
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
      })

      const processCall = (processImage as jest.Mock).mock.calls[0]
      expect(processCall[1]).toMatchObject({
        maxWidth: 1024,
        quality: 0.85,
        checkQuality: false,
      })
    })

    it('Edge Function에 올바른 데이터 전달', async () => {
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
          analysis: { test: 'data' },
          mapping: { test: 'mapping' },
          nlg: { test: 'nlg' },
          review_needed: true,
        },
        accessToken: 'test-token',
      })

      await waitFor(() => {
        expect(mockEdgeSave).toHaveBeenCalled()
      })

      const saveCall = mockEdgeSave.mock.calls[0]
      expect(saveCall[0]).toMatchObject({
        userId: 'test-user',
        imageAngles: ['front'],
        result: {
          result_id: 'test-result-id',
          analysis: { test: 'data' },
          mapping: { test: 'mapping' },
          nlg: { test: 'nlg' },
          review_needed: true,
        },
        accessToken: 'test-token',
      })
    })
  })
})

