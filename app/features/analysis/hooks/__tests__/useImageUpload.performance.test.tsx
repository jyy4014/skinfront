/**
 * useImageUpload 성능 최적화 테스트 (엄격한 TDD)
 * 
 * 요구사항:
 * 1. AI 분석에는 원본 이미지 사용 (정확도 보장)
 * 2. 저장 시에만 리사이즈된 이미지 저장 (스토리지 절약)
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useImageUpload } from '../useImageUpload'
import { createClient } from '@/app/lib/supabaseClient'

jest.mock('@/app/lib/supabaseClient', () => ({
  createClient: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('useImageUpload - 성능 최적화 (TDD)', () => {
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
      data: { publicUrl: 'https://example.com/image.jpg' },
    })
    mockFrom = jest.fn(() => ({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    }))

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
        }),
      },
      storage: {
        from: mockFrom,
      },
    }

    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase as any)
  })

  describe('원본 이미지 업로드 검증 (UPDATE 방식)', () => {
    it('AI 분석을 위해 원본 이미지를 업로드해야 함', async () => {
      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      result.current.uploadImages([file], {
        angles: ['front'],
      })

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('skin-images')
        expect(mockUpload).toHaveBeenCalled()
      })

      const uploadCall = mockUpload.mock.calls[0]
      expect(uploadCall[1]).toBe(file) // 원본 파일이 업로드되어야 함
    })

    it('원본 이미지는 original 폴더에 고정 경로로 저장되어야 함 (UPDATE 방식)', async () => {
      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      result.current.uploadImages([file], {
        angles: ['front'],
      })

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled()
      })

      const uploadCall = mockUpload.mock.calls[0]
      const filePath = uploadCall[0]
      expect(filePath).toContain('/original/') // original 폴더에 저장
      expect(filePath).toMatch(/\/original\/front\.(jpg|jpeg|png|webp)$/i) // 고정 경로 (UPDATE 방식)
    })

    it('여러 이미지를 병렬로 업로드해야 함', async () => {
      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
        new File(['test3'], 'test3.jpg', { type: 'image/jpeg' }),
      ]

      result.current.uploadImages(files, {
        angles: ['front', 'left', 'right'],
      })

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledTimes(3)
      })

      // 각도별 고정 경로 확인
      const uploadCalls = mockUpload.mock.calls
      expect(uploadCalls[0][0]).toMatch(/\/original\/front\.(jpg|jpeg|png|webp)$/i)
      expect(uploadCalls[1][0]).toMatch(/\/original\/left\.(jpg|jpeg|png|webp)$/i)
      expect(uploadCalls[2][0]).toMatch(/\/original\/right\.(jpg|jpeg|png|webp)$/i)
    })

    it('upsert: true로 설정되어 UPDATE 방식으로 동작해야 함', async () => {
      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      result.current.uploadImages([file], {
        angles: ['front'],
      })

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled()
      })

      const uploadCall = mockUpload.mock.calls[0]
      const uploadOptions = uploadCall[2] // 세 번째 인자: options
      expect(uploadOptions.upsert).toBe(true) // UPDATE 방식
    })
  })
})

