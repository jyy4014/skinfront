/**
 * useImageUpload 엄격한 TDD 테스트
 * 
 * 모든 엣지 케이스와 에러 시나리오를 포함한 포괄적인 테스트
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useImageUpload } from '../useImageUpload'
import { createClient } from '@/app/lib/supabaseClient'
import { useRouter } from 'next/navigation'

jest.mock('@/app/lib/supabaseClient', () => ({
  createClient: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('useImageUpload - 엄격한 TDD (모든 엣지 케이스)', () => {
  let queryClient: QueryClient
  let mockUpload: jest.Mock
  let mockGetPublicUrl: jest.Mock
  let mockFrom: jest.Mock
  let mockGetUser: jest.Mock
  let mockPush: jest.Mock

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
    mockGetUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
    })
    mockPush = jest.fn()

    const mockSupabase = {
      auth: {
        getUser: mockGetUser,
      },
      storage: {
        from: mockFrom,
      },
    }

    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase as any)
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  })

  describe('정상 플로우', () => {
    it('단일 이미지 업로드 성공', async () => {
      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const uploadPromise = result.current.uploadImages([file], {
        angles: ['front'],
      })

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled()
      })

      await expect(uploadPromise).resolves.toMatchObject({
        userId: 'test-user-id',
        results: expect.arrayContaining([
          expect.objectContaining({
            publicUrl: 'https://example.com/image.jpg',
            angle: 'front',
          }),
        ]),
      })
    })

    it('여러 이미지 병렬 업로드 성공', async () => {
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

      const uploadPromise = result.current.uploadImages(files, {
        angles: ['front', 'left', 'right'],
      })

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledTimes(3)
      })

      await expect(uploadPromise).resolves.toMatchObject({
        userId: 'test-user-id',
        results: expect.arrayContaining([
          expect.objectContaining({ angle: 'front' }),
          expect.objectContaining({ angle: 'left' }),
          expect.objectContaining({ angle: 'right' }),
        ]),
      })
    })

    it('각도별 고정 경로 생성 확인', async () => {
      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
        new File(['test3'], 'test3.webp', { type: 'image/webp' }),
      ]

      result.current.uploadImages(files, {
        angles: ['front', 'left', 'right'],
      })

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledTimes(3)
      })

      const uploadCalls = mockUpload.mock.calls
      expect(uploadCalls[0][0]).toBe('test-user-id/original/front.jpg')
      expect(uploadCalls[1][0]).toBe('test-user-id/original/left.png')
      expect(uploadCalls[2][0]).toBe('test-user-id/original/right.webp')
    })

    it('upsert: true로 UPDATE 방식 확인', async () => {
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

      const uploadOptions = mockUpload.mock.calls[0][2]
      expect(uploadOptions.upsert).toBe(true)
      expect(uploadOptions.cacheControl).toBe('3600')
    })

    it('진행도 콜백 호출 확인', async () => {
      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const onProgress = jest.fn()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      result.current.uploadImages([file], {
        angles: ['front'],
        onProgress,
      })

      await waitFor(() => {
        expect(onProgress).toHaveBeenCalled()
      })

      // 진행도는 0-100 사이여야 함
      const progressCalls = onProgress.mock.calls.map(call => call[0])
      progressCalls.forEach(progress => {
        expect(progress).toBeGreaterThanOrEqual(0)
        expect(progress).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('에러 처리', () => {
    it('인증 실패 시 로그인 페이지로 리다이렉트', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
      })

      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      await expect(
        result.current.uploadImages([file], {
          angles: ['front'],
        })
      ).rejects.toThrow('인증이 필요합니다.')

      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })

    it('업로드 실패 시 에러 발생', async () => {
      mockUpload.mockResolvedValueOnce({
        error: { message: 'Storage error', statusCode: 500 },
      })

      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      await expect(
        result.current.uploadImages([file], {
          angles: ['front'],
        })
      ).rejects.toMatchObject({
        message: 'Storage error',
      })
    })

    it('빈 파일 배열 시 에러 발생', async () => {
      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      await expect(
        result.current.uploadImages([], {
          angles: [],
        })
      ).rejects.toThrow('최소 1개 이상의 파일이 필요합니다.')
    })

    it('파일명이 없는 파일 시 에러 발생', async () => {
      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const file = new File(['test'], '', { type: 'image/jpeg' })
      
      // 단일 업로드 테스트
      await expect(
        result.current.uploadImage(file, {
          angle: 'front',
        })
      ).rejects.toThrow('유효한 파일이 필요합니다.')
    })

    it('각도 배열 길이가 파일 개수와 다를 때 기본값 사용', async () => {
      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ]

      // 각도 배열이 1개만 제공됨
      const uploadPromise = result.current.uploadImages(files, {
        angles: ['front'], // 2개 파일인데 각도는 1개만
      })

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledTimes(2)
      })

      const uploadCalls = mockUpload.mock.calls
      // 첫 번째는 front, 두 번째는 기본값 front
      expect(uploadCalls[0][0]).toContain('/original/front.')
      expect(uploadCalls[1][0]).toContain('/original/front.')
    })

    it('네트워크 에러 시 적절한 에러 메시지', async () => {
      mockUpload.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      await expect(
        result.current.uploadImages([file], {
          angles: ['front'],
        })
      ).rejects.toThrow('Network error')
    })
  })

  describe('경계값 테스트', () => {
    it('1개 이미지 업로드', async () => {
      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      await expect(
        result.current.uploadImages([file], {
          angles: ['front'],
        })
      ).resolves.toBeDefined()
    })

    it('3개 이미지 업로드 (최대 권장)', async () => {
      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const files = Array.from({ length: 3 }, (_, i) =>
        new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' })
      )

      await expect(
        result.current.uploadImages(files, {
          angles: ['front', 'left', 'right'],
        })
      ).resolves.toBeDefined()
    })

    it('다양한 파일 확장자 처리', async () => {
      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
      
      for (const ext of extensions) {
        const file = new File(['test'], `test.${ext}`, { type: `image/${ext === 'jpg' ? 'jpeg' : ext}` })
        
        result.current.uploadImages([file], {
          angles: ['front'],
        })

        await waitFor(() => {
          expect(mockUpload).toHaveBeenCalled()
        })

        const filePath = mockUpload.mock.calls[mockUpload.mock.calls.length - 1][0]
        expect(filePath).toContain(`.${ext}`)
        
        jest.clearAllMocks()
      }
    })
  })

  describe('데이터 검증', () => {
    it('반환된 결과에 모든 필수 필드 포함', async () => {
      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const uploadResult = await result.current.uploadImages([file], {
        angles: ['front'],
      })

      expect(uploadResult).toHaveProperty('userId')
      expect(uploadResult).toHaveProperty('results')
      expect(uploadResult.results).toHaveLength(1)
      expect(uploadResult.results[0]).toHaveProperty('publicUrl')
      expect(uploadResult.results[0]).toHaveProperty('filePath')
      expect(uploadResult.results[0]).toHaveProperty('userId')
      expect(uploadResult.results[0]).toHaveProperty('angle')
    })

    it('filePath가 올바른 형식인지 확인', async () => {
      const { result } = renderHook(() => useImageUpload(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const uploadResult = await result.current.uploadImages([file], {
        angles: ['front'],
      })

      const filePath = uploadResult.results[0].filePath
      expect(filePath).toMatch(/^test-user-id\/original\/front\.(jpg|jpeg|png|webp|gif)$/i)
    })
  })
})

