/**
 * useAnalysisFlow 엄격한 TDD 테스트
 * 
 * 전체 분석 플로우 통합 테스트 (업로드 → 분석 → 저장)
 * 가장 중요한 메인 기능 테스트
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAnalysisFlow } from '../useAnalysisFlow'
import { useImageUpload } from '../useImageUpload'
import { useAnalysis } from '../useAnalysis'
import { useAnalysisSave } from '../useAnalysisSave'
import { createClient } from '@/app/lib/supabaseClient'
import { useSession } from '@/app/lib/auth'

jest.mock('../useImageUpload')
jest.mock('../useAnalysis')
jest.mock('../useAnalysisSave')
jest.mock('@/app/lib/supabaseClient')
jest.mock('@/app/lib/auth')

describe('useAnalysisFlow - 엄격한 TDD (전체 플로우 통합)', () => {
  let queryClient: QueryClient
  let mockUploadImages: jest.Mock
  let mockAnalyze: jest.Mock
  let mockSaveAnalysis: jest.Mock
  let mockGetSession: jest.Mock

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    mockUploadImages = jest.fn()
    mockAnalyze = jest.fn()
    mockSaveAnalysis = jest.fn()
    mockGetSession = jest.fn().mockResolvedValue({
      data: {
        session: {
          access_token: 'test-access-token',
        },
      },
    })

    ;(useImageUpload as jest.Mock).mockReturnValue({
      uploadImages: mockUploadImages,
      loading: false,
      error: null,
    })

    ;(useAnalysis as jest.Mock).mockReturnValue({
      analyze: mockAnalyze,
      loading: false,
      error: null,
    })

    ;(useAnalysisSave as jest.Mock).mockReturnValue({
      saveAnalysis: mockSaveAnalysis,
      loading: false,
      error: null,
    })

    ;(useSession as jest.Mock).mockReturnValue({
      accessToken: 'test-access-token',
    })

    const mockSupabase = {
      auth: {
        getSession: mockGetSession,
      },
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase as any)

    jest.clearAllMocks()
  })

  describe('정상 플로우', () => {
    it('전체 플로우 성공: 업로드 → 분석 → 저장', async () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
        new File(['test3'], 'test3.jpg', { type: 'image/jpeg' }),
      ]

      const uploadResults = {
        userId: 'test-user-id',
        results: [
          {
            publicUrl: 'https://example.com/original1.jpg',
            filePath: 'test-user-id/original/front.jpg',
            userId: 'test-user-id',
            angle: 'front' as const,
          },
          {
            publicUrl: 'https://example.com/original2.jpg',
            filePath: 'test-user-id/original/left.jpg',
            userId: 'test-user-id',
            angle: 'left' as const,
          },
          {
            publicUrl: 'https://example.com/original3.jpg',
            filePath: 'test-user-id/original/right.jpg',
            userId: 'test-user-id',
            angle: 'right' as const,
          },
        ],
      }

      const analysisResult = {
        status: 'success' as const,
        result_id: 'test-result-id',
        analysis: { confidence: 0.85 },
        mapping: { treatment_candidates: [] },
        nlg: { headline: '테스트 결과' },
        review_needed: false,
      }

      const saveResult = {
        status: 'success' as const,
        id: 'saved-analysis-id',
      }

      mockUploadImages.mockResolvedValue(uploadResults)
      mockAnalyze.mockResolvedValue(analysisResult)
      mockSaveAnalysis.mockResolvedValue(saveResult)

      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      let flowResult: any
      await act(async () => {
        flowResult = await result.current.uploadAndAnalyze(files)
      })

      await waitFor(() => {
        expect(mockUploadImages).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(mockAnalyze).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(mockSaveAnalysis).toHaveBeenCalled()
      })

      expect(flowResult).toMatchObject({
        result_id: 'test-result-id',
        analysis: { confidence: 0.85 },
        mapping: { treatment_candidates: [] },
        nlg: { headline: '테스트 결과' },
        review_needed: false,
        id: 'saved-analysis-id',
        image_urls: [
          'https://example.com/original1.jpg',
          'https://example.com/original2.jpg',
          'https://example.com/original3.jpg',
        ],
        image_angles: ['front', 'left', 'right'],
      })

      // 각 단계가 올바른 순서로 호출되었는지 확인
      const uploadCallOrder = mockUploadImages.mock.invocationCallOrder[0]
      const analyzeCallOrder = (mockAnalyze as jest.Mock).mock.invocationCallOrder[0]
      const saveCallOrder = (mockSaveAnalysis as jest.Mock).mock.invocationCallOrder[0]
      
      expect(uploadCallOrder).toBeLessThan(analyzeCallOrder)
      expect(analyzeCallOrder).toBeLessThan(saveCallOrder)
    })

    it('1개 이미지 업로드 및 분석', async () => {
      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]

      const uploadResults = {
        userId: 'test-user-id',
        results: [
          {
            publicUrl: 'https://example.com/original1.jpg',
            filePath: 'test-user-id/original/front.jpg',
            userId: 'test-user-id',
            angle: 'front' as const,
          },
        ],
      }

      const analysisResult = {
        status: 'success' as const,
        result_id: 'test-result-id',
        analysis: {},
        mapping: {},
        nlg: {},
      }

      const saveResult = {
        status: 'success' as const,
        id: 'saved-id',
      }

      mockUploadImages.mockResolvedValue(uploadResults)
      mockAnalyze.mockResolvedValue(analysisResult)
      mockSaveAnalysis.mockResolvedValue(saveResult)

      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      await expect(result.current.uploadAndAnalyze(files)).resolves.toBeDefined()

      // 각도 배열이 올바르게 생성되었는지 확인
      expect(mockAnalyze).toHaveBeenCalledWith(
        expect.objectContaining({
          imageAngles: ['front'],
        }),
        expect.any(Object)
      )
    })

    it('2개 이미지 업로드 및 분석', async () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ]

      const uploadResults = {
        userId: 'test-user-id',
        results: [
          {
            publicUrl: 'https://example.com/original1.jpg',
            filePath: 'test-user-id/original/front.jpg',
            userId: 'test-user-id',
            angle: 'front' as const,
          },
          {
            publicUrl: 'https://example.com/original2.jpg',
            filePath: 'test-user-id/original/left.jpg',
            userId: 'test-user-id',
            angle: 'left' as const,
          },
        ],
      }

      mockUploadImages.mockResolvedValue(uploadResults)
      mockAnalyze.mockResolvedValue({
        status: 'success' as const,
        result_id: 'test-result-id',
        analysis: {},
        mapping: {},
        nlg: {},
      })
      mockSaveAnalysis.mockResolvedValue({
        status: 'success' as const,
        id: 'saved-id',
      })

      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      await result.current.uploadAndAnalyze(files)

      expect(mockAnalyze).toHaveBeenCalledWith(
        expect.objectContaining({
          imageAngles: ['front', 'left'],
        }),
        expect.any(Object)
      )
    })

    it('진행도 업데이트가 올바르게 호출됨', async () => {
      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]

      mockUploadImages.mockImplementation(async (files, options) => {
        options?.onProgress?.(50)
        return {
          userId: 'test-user-id',
          results: [
            {
              publicUrl: 'https://example.com/original1.jpg',
              filePath: 'test-user-id/original/front.jpg',
              userId: 'test-user-id',
              angle: 'front' as const,
            },
          ],
        }
      })

      mockAnalyze.mockImplementation(async (request, options) => {
        options?.onProgress?.(50, '분석 중...')
        return {
          status: 'success' as const,
          result_id: 'test-result-id',
          analysis: {},
          mapping: {},
          nlg: {},
        }
      })

      mockSaveAnalysis.mockImplementation(async (request) => {
        request.onProgress?.(50, '저장 중...')
        return {
          status: 'success' as const,
          id: 'saved-id',
        }
      })

      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      await act(async () => {
        result.current.uploadAndAnalyze(files)
      })

      await waitFor(() => {
        expect(result.current.progress).toBeTruthy()
      })

      // 진행도가 업데이트되었는지 확인
      expect(result.current.progress?.progress).toBeGreaterThanOrEqual(0)
      expect(result.current.progress?.progress).toBeLessThanOrEqual(100)
    })
  })

  describe('에러 처리', () => {
    it('빈 파일 배열 시 에러 발생', async () => {
      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      await expect(result.current.uploadAndAnalyze([])).rejects.toThrow(
        '최소 1개 이상의 이미지가 필요합니다.'
      )
    })

    it('업로드 실패 시 에러 전파', async () => {
      mockUploadImages.mockRejectedValue(new Error('업로드 실패'))

      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]

      await expect(result.current.uploadAndAnalyze(files)).rejects.toThrow('업로드 실패')
    })

    it('인증 토큰 없음 시 에러 발생', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
      })

      ;(useSession as jest.Mock).mockReturnValue({
        accessToken: null, // 토큰 없음
      })

      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: [
          {
            publicUrl: 'https://example.com/original1.jpg',
            filePath: 'test-user-id/original/front.jpg',
            userId: 'test-user-id',
            angle: 'front' as const,
          },
        ],
      })

      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]

      await expect(result.current.uploadAndAnalyze(files)).rejects.toThrow(
        '인증 토큰을 가져올 수 없습니다.'
      )
    })

    it('분석 실패 시 에러 전파', async () => {
      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: [
          {
            publicUrl: 'https://example.com/original1.jpg',
            filePath: 'test-user-id/original/front.jpg',
            userId: 'test-user-id',
            angle: 'front' as const,
          },
        ],
      })

      mockAnalyze.mockRejectedValue(new Error('분석 실패'))

      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]

      await expect(result.current.uploadAndAnalyze(files)).rejects.toThrow('분석 실패')
    })

    it('result_id 없음 시 에러 발생', async () => {
      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: [
          {
            publicUrl: 'https://example.com/original1.jpg',
            filePath: 'test-user-id/original/front.jpg',
            userId: 'test-user-id',
            angle: 'front' as const,
          },
        ],
      })

      mockAnalyze.mockResolvedValue({
        status: 'success' as const,
        result_id: '', // 빈 문자열
        analysis: {},
        mapping: {},
        nlg: {},
      })

      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]

      await expect(result.current.uploadAndAnalyze(files)).rejects.toThrow(
        '분석 결과 ID가 없습니다.'
      )
    })

    it('저장 실패 시 에러 전파', async () => {
      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: [
          {
            publicUrl: 'https://example.com/original1.jpg',
            filePath: 'test-user-id/original/front.jpg',
            userId: 'test-user-id',
            angle: 'front' as const,
          },
        ],
      })

      mockAnalyze.mockResolvedValue({
        status: 'success' as const,
        result_id: 'test-result-id',
        analysis: {},
        mapping: {},
        nlg: {},
      })

      mockSaveAnalysis.mockRejectedValue(new Error('저장 실패'))

      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]

      await expect(result.current.uploadAndAnalyze(files)).rejects.toThrow('저장 실패')
    })

    it('이미지 URL과 각도 배열 길이 일치 검증', async () => {
      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: [
          {
            publicUrl: 'https://example.com/original1.jpg',
            filePath: 'test-user-id/original/front.jpg',
            userId: 'test-user-id',
            angle: 'front' as const,
          },
        ],
      })

      mockAnalyze.mockResolvedValue({
        status: 'success' as const,
        result_id: 'test-result-id',
        analysis: {},
        mapping: {},
        nlg: {},
      })

      mockSaveAnalysis.mockResolvedValue({
        status: 'success' as const,
        id: 'saved-id',
      })

      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]

      // 실제로는 uploadResults에서 각도 배열을 생성하므로 길이가 항상 일치해야 함
      await expect(result.current.uploadAndAnalyze(files)).resolves.toBeDefined()

      // analyze 호출 시 imageUrls와 imageAngles 길이가 일치하는지 확인
      const analyzeCall = (mockAnalyze as jest.Mock).mock.calls[0]
      expect(analyzeCall[0].imageUrls.length).toBe(analyzeCall[0].imageAngles.length)
    })
  })

  describe('각도 배열 생성 로직', () => {
    it('3개 파일 → [front, left, right]', async () => {
      const files = Array.from({ length: 3 }, (_, i) =>
        new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' })
      )

      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: files.map((_, i) => ({
          publicUrl: `https://example.com/original${i + 1}.jpg`,
          filePath: `test-user-id/original/${['front', 'left', 'right'][i]}.jpg`,
          userId: 'test-user-id',
          angle: (['front', 'left', 'right'] as const)[i],
        })),
      })

      mockAnalyze.mockResolvedValue({
        status: 'success' as const,
        result_id: 'test-result-id',
        analysis: {},
        mapping: {},
        nlg: {},
      })

      mockSaveAnalysis.mockResolvedValue({
        status: 'success' as const,
        id: 'saved-id',
      })

      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      await result.current.uploadAndAnalyze(files)

      expect(mockAnalyze).toHaveBeenCalledWith(
        expect.objectContaining({
          imageAngles: ['front', 'left', 'right'],
        }),
        expect.any(Object)
      )
    })

    it('1개 파일 → [front]', async () => {
      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]

      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: [
          {
            publicUrl: 'https://example.com/original1.jpg',
            filePath: 'test-user-id/original/front.jpg',
            userId: 'test-user-id',
            angle: 'front' as const,
          },
        ],
      })

      mockAnalyze.mockResolvedValue({
        status: 'success' as const,
        result_id: 'test-result-id',
        analysis: {},
        mapping: {},
        nlg: {},
      })

      mockSaveAnalysis.mockResolvedValue({
        status: 'success' as const,
        id: 'saved-id',
      })

      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      await result.current.uploadAndAnalyze(files)

      expect(mockAnalyze).toHaveBeenCalledWith(
        expect.objectContaining({
          imageAngles: ['front'],
        }),
        expect.any(Object)
      )
    })

    it('2개 파일 → [front, left]', async () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ]

      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: [
          {
            publicUrl: 'https://example.com/original1.jpg',
            filePath: 'test-user-id/original/front.jpg',
            userId: 'test-user-id',
            angle: 'front' as const,
          },
          {
            publicUrl: 'https://example.com/original2.jpg',
            filePath: 'test-user-id/original/left.jpg',
            userId: 'test-user-id',
            angle: 'left' as const,
          },
        ],
      })

      mockAnalyze.mockResolvedValue({
        status: 'success' as const,
        result_id: 'test-result-id',
        analysis: {},
        mapping: {},
        nlg: {},
      })

      mockSaveAnalysis.mockResolvedValue({
        status: 'success' as const,
        id: 'saved-id',
      })

      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      await result.current.uploadAndAnalyze(files)

      expect(mockAnalyze).toHaveBeenCalledWith(
        expect.objectContaining({
          imageAngles: ['front', 'left'],
        }),
        expect.any(Object)
      )
    })
  })

  describe('진행도 및 상태 관리', () => {
    it('로딩 상태가 올바르게 관리됨', async () => {
      ;(useImageUpload as jest.Mock).mockReturnValue({
        uploadImages: mockUploadImages,
        loading: true,
        error: null,
      })

      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      expect(result.current.loading).toBe(true)
    })

    it('에러 상태가 올바르게 관리됨', async () => {
      const testError = new Error('테스트 에러')

      ;(useImageUpload as jest.Mock).mockReturnValue({
        uploadImages: mockUploadImages,
        loading: false,
        error: testError,
      })

      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      expect(result.current.error).toBe(testError)
    })

    it('진행도가 단계별로 업데이트됨', async () => {
      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]

      mockUploadImages.mockImplementation(async (files, options) => {
        options?.onProgress?.(100)
        return {
          userId: 'test-user-id',
          results: [
            {
              publicUrl: 'https://example.com/original1.jpg',
              filePath: 'test-user-id/original/front.jpg',
              userId: 'test-user-id',
              angle: 'front' as const,
            },
          ],
        }
      })

      mockAnalyze.mockImplementation(async (request, options) => {
        options?.onProgress?.(100, '분석 완료')
        return {
          status: 'success' as const,
          result_id: 'test-result-id',
          analysis: {},
          mapping: {},
          nlg: {},
        }
      })

      mockSaveAnalysis.mockResolvedValue({
        status: 'success' as const,
        id: 'saved-id',
      })

      const { result } = renderHook(() => useAnalysisFlow(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.uploadAndAnalyze(files)
      })

      await waitFor(() => {
        expect(result.current.progress?.stage).toBe('complete')
        expect(result.current.progress?.progress).toBe(100)
      })
    })
  })
})

