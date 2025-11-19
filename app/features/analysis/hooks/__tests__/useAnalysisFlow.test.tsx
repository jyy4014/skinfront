/**
 * useAnalysisFlow 훅 테스트
 * TDD 기반 테스트 작성
 * 전체 분석 플로우 오케스트레이션 테스트
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useAnalysisFlow } from '../useAnalysisFlow'
import { useImageUpload } from '../useImageUpload'
import { useAnalysis } from '../useAnalysis'
import { useAnalysisSave } from '../useAnalysisSave'
import { useSession } from '../../../../lib/auth'
import { createClient } from '../../../../lib/supabaseClient'

// 훅 모킹
jest.mock('../useImageUpload')
jest.mock('../useAnalysis')
jest.mock('../useAnalysisSave')
jest.mock('../../../../lib/auth')
jest.mock('../../../../lib/supabaseClient')

const mockUseImageUpload = useImageUpload as jest.MockedFunction<typeof useImageUpload>
const mockUseAnalysis = useAnalysis as jest.MockedFunction<typeof useAnalysis>
const mockUseAnalysisSave = useAnalysisSave as jest.MockedFunction<typeof useAnalysisSave>
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('useAnalysisFlow', () => {
  const mockUploadImages = jest.fn()
  const mockAnalyze = jest.fn()
  const mockSaveAnalysis = jest.fn()
  const mockSupabase = {
    auth: {
      getSession: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // 기본 모킹 설정
    mockUseImageUpload.mockReturnValue({
      uploadImages: mockUploadImages,
      loading: false,
      error: null,
    })

    mockUseAnalysis.mockReturnValue({
      analyze: mockAnalyze,
      loading: false,
      error: null,
    })

    mockUseAnalysisSave.mockReturnValue({
      saveAnalysis: mockSaveAnalysis,
      loading: false,
      error: null,
    })

    mockUseSession.mockReturnValue({
      user: { id: 'test-user-id' },
      accessToken: 'test-token',
      isLoading: false,
    })

    mockCreateClient.mockReturnValue(mockSupabase as any)
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
        },
      },
      error: null,
    })
  })

  describe('정상 플로우', () => {
    it('이미지 업로드 → 분석 → 저장이 순차적으로 실행되어야 함', async () => {
      const files = [
        new File([''], 'front.jpg', { type: 'image/jpeg' }),
        new File([''], 'left.jpg', { type: 'image/jpeg' }),
        new File([''], 'right.jpg', { type: 'image/jpeg' }),
      ]

      const uploadResult = {
        userId: 'test-user-id',
        results: [
          { publicUrl: 'https://example.com/front.jpg', angle: 'front' },
          { publicUrl: 'https://example.com/left.jpg', angle: 'left' },
          { publicUrl: 'https://example.com/right.jpg', angle: 'right' },
        ],
      }

      const analysisResult = {
        result_id: 'test-result-id',
        analysis: { skin_condition_scores: {} },
        mapping: { treatment_candidates: [] },
        nlg: { headline: 'Test' },
        review_needed: false,
      }

      const saveResult = { id: 'saved-id' }

      mockUploadImages.mockResolvedValue(uploadResult)
      mockAnalyze.mockResolvedValue(analysisResult)
      mockSaveAnalysis.mockResolvedValue(saveResult as any)

      const { result } = renderHook(() => useAnalysisFlow())

      let flowResult: any
      await act(async () => {
        flowResult = await result.current.uploadAndAnalyze(files)
      })

      // 순차 실행 확인 (호출 순서 확인)
      expect(mockUploadImages).toHaveBeenCalled()
      expect(mockAnalyze).toHaveBeenCalled()
      expect(mockSaveAnalysis).toHaveBeenCalled()
      
      // 호출 순서 확인
      const uploadCallOrder = mockUploadImages.mock.invocationCallOrder[0]
      const analyzeCallOrder = mockAnalyze.mock.invocationCallOrder[0]
      const saveCallOrder = mockSaveAnalysis.mock.invocationCallOrder[0]
      
      expect(uploadCallOrder).toBeLessThan(analyzeCallOrder!)
      expect(analyzeCallOrder).toBeLessThan(saveCallOrder!)

      // 결과 확인
      expect(flowResult.result_id).toBe('test-result-id')
      expect(flowResult.image_urls).toEqual([
        'https://example.com/front.jpg',
        'https://example.com/left.jpg',
        'https://example.com/right.jpg',
      ])
      expect(flowResult.image_angles).toEqual(['front', 'left', 'right'])
    })

    it('각 단계별로 진행도가 업데이트되어야 함', async () => {
      const files = [new File([''], 'test.jpg', { type: 'image/jpeg' })]

      mockUploadImages.mockImplementation((files, options) => {
        // 진행도 콜백 호출
        options?.onProgress?.(50)
        return Promise.resolve({
          userId: 'test-user-id',
          results: [{ publicUrl: 'https://example.com/test.jpg', angle: 'front' }],
        })
      })

      mockAnalyze.mockImplementation((request, options) => {
        options?.onProgress?.(50, '분석 중...')
        return Promise.resolve({
          result_id: 'test-result-id',
          analysis: {},
          mapping: {},
          nlg: {},
          review_needed: false,
        })
      })

      mockSaveAnalysis.mockResolvedValue({ id: 'saved-id' } as any)

      const { result } = renderHook(() => useAnalysisFlow())

      const progressUpdates: any[] = []
      const originalProgress = result.current.progress

      // 진행도 업데이트 모니터링
      const checkProgress = () => {
        if (result.current.progress) {
          progressUpdates.push(result.current.progress)
        }
      }

      await result.current.uploadAndAnalyze(files)

      // 진행도가 업데이트되었는지 확인
      await waitFor(() => {
        expect(result.current.progress).toBeTruthy()
      })
    })
  })

  describe('파일 검증', () => {
    it('빈 파일 배열일 때 에러를 발생시켜야 함', async () => {
      const { result } = renderHook(() => useAnalysisFlow())

      await expect(result.current.uploadAndAnalyze([])).rejects.toThrow(
        '최소 1개 이상의 이미지가 필요합니다.'
      )
    })

    it('null 파일 배열일 때 에러를 발생시켜야 함', async () => {
      const { result } = renderHook(() => useAnalysisFlow())

      await expect(result.current.uploadAndAnalyze(null as any)).rejects.toThrow(
        '최소 1개 이상의 이미지가 필요합니다.'
      )
    })
  })

  describe('여러 이미지 처리', () => {
    it('1개 이미지 처리 시 각도 배열이 올바르게 생성되어야 함', async () => {
      const files = [new File([''], 'front.jpg', { type: 'image/jpeg' })]

      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: [{ publicUrl: 'https://example.com/front.jpg', angle: 'front' }],
      })

      mockAnalyze.mockResolvedValue({
        result_id: 'test-result-id',
        analysis: {},
        mapping: {},
        nlg: {},
        review_needed: false,
      })

      mockSaveAnalysis.mockResolvedValue({ id: 'saved-id' } as any)

      const { result } = renderHook(() => useAnalysisFlow())

      await result.current.uploadAndAnalyze(files)

      expect(mockUploadImages).toHaveBeenCalledWith(
        files,
        expect.objectContaining({
          angles: ['front'],
        })
      )
    })

    it('2개 이미지 처리 시 각도 배열이 올바르게 생성되어야 함', async () => {
      const files = [
        new File([''], 'front.jpg', { type: 'image/jpeg' }),
        new File([''], 'left.jpg', { type: 'image/jpeg' }),
      ]

      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: [
          { publicUrl: 'https://example.com/front.jpg', angle: 'front' },
          { publicUrl: 'https://example.com/left.jpg', angle: 'left' },
        ],
      })

      mockAnalyze.mockResolvedValue({
        result_id: 'test-result-id',
        analysis: {},
        mapping: {},
        nlg: {},
        review_needed: false,
      })

      mockSaveAnalysis.mockResolvedValue({ id: 'saved-id' } as any)

      const { result } = renderHook(() => useAnalysisFlow())

      await result.current.uploadAndAnalyze(files)

      expect(mockUploadImages).toHaveBeenCalledWith(
        files,
        expect.objectContaining({
          angles: ['front', 'left'],
        })
      )
    })

    it('3개 이미지 처리 시 각도 배열이 올바르게 생성되어야 함', async () => {
      const files = [
        new File([''], 'front.jpg', { type: 'image/jpeg' }),
        new File([''], 'left.jpg', { type: 'image/jpeg' }),
        new File([''], 'right.jpg', { type: 'image/jpeg' }),
      ]

      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: [
          { publicUrl: 'https://example.com/front.jpg', angle: 'front' },
          { publicUrl: 'https://example.com/left.jpg', angle: 'left' },
          { publicUrl: 'https://example.com/right.jpg', angle: 'right' },
        ],
      })

      mockAnalyze.mockResolvedValue({
        result_id: 'test-result-id',
        analysis: {},
        mapping: {},
        nlg: {},
        review_needed: false,
      })

      mockSaveAnalysis.mockResolvedValue({ id: 'saved-id' } as any)

      const { result } = renderHook(() => useAnalysisFlow())

      await result.current.uploadAndAnalyze(files)

      expect(mockUploadImages).toHaveBeenCalledWith(
        files,
        expect.objectContaining({
          angles: ['front', 'left', 'right'],
        })
      )
    })

    it('4개 이상 이미지 처리 시 처음 3개만 사용해야 함', async () => {
      const files = [
        new File([''], 'front.jpg', { type: 'image/jpeg' }),
        new File([''], 'left.jpg', { type: 'image/jpeg' }),
        new File([''], 'right.jpg', { type: 'image/jpeg' }),
        new File([''], 'extra.jpg', { type: 'image/jpeg' }),
      ]

      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: [
          { publicUrl: 'https://example.com/front.jpg', angle: 'front' },
          { publicUrl: 'https://example.com/left.jpg', angle: 'left' },
          { publicUrl: 'https://example.com/right.jpg', angle: 'right' },
        ],
      })

      mockAnalyze.mockResolvedValue({
        result_id: 'test-result-id',
        analysis: {},
        mapping: {},
        nlg: {},
        review_needed: false,
      })

      mockSaveAnalysis.mockResolvedValue({ id: 'saved-id' } as any)

      const { result } = renderHook(() => useAnalysisFlow())

      await result.current.uploadAndAnalyze(files)

      // 처음 3개만 사용
      expect(mockUploadImages).toHaveBeenCalledWith(
        files,
        expect.objectContaining({
          angles: ['front', 'left', 'right'],
        })
      )
    })
  })

  describe('에러 처리', () => {
    it('업로드 실패 시 에러를 반환해야 함', async () => {
      const files = [new File([''], 'test.jpg', { type: 'image/jpeg' })]

      mockUploadImages.mockRejectedValue(new Error('업로드 실패'))

      const { result } = renderHook(() => useAnalysisFlow())

      await expect(result.current.uploadAndAnalyze(files)).rejects.toThrow('업로드 실패')
    })

    it('분석 실패 시 에러를 반환해야 함', async () => {
      const files = [new File([''], 'test.jpg', { type: 'image/jpeg' })]

      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: [{ publicUrl: 'https://example.com/test.jpg', angle: 'front' }],
      })

      mockAnalyze.mockRejectedValue(new Error('분석 실패'))

      const { result } = renderHook(() => useAnalysisFlow())

      await expect(result.current.uploadAndAnalyze(files)).rejects.toThrow('분석 실패')
    })

    it('저장 실패 시 에러를 반환해야 함', async () => {
      const files = [new File([''], 'test.jpg', { type: 'image/jpeg' })]

      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: [{ publicUrl: 'https://example.com/test.jpg', angle: 'front' }],
      })

      mockAnalyze.mockResolvedValue({
        result_id: 'test-result-id',
        analysis: {},
        mapping: {},
        nlg: {},
        review_needed: false,
      })

      mockSaveAnalysis.mockRejectedValue(new Error('저장 실패'))

      const { result } = renderHook(() => useAnalysisFlow())

      await expect(result.current.uploadAndAnalyze(files)).rejects.toThrow('저장 실패')
    })

    it('인증 토큰이 없을 때 에러를 발생시켜야 함', async () => {
      const files = [new File([''], 'test.jpg', { type: 'image/jpeg' })]

      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: [{ publicUrl: 'https://example.com/test.jpg', angle: 'front' }],
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      mockUseSession.mockReturnValue({
        user: { id: 'test-user-id' },
        accessToken: null,
        isLoading: false,
      })

      const { result } = renderHook(() => useAnalysisFlow())

      await expect(result.current.uploadAndAnalyze(files)).rejects.toThrow(
        '인증 토큰을 가져올 수 없습니다.'
      )
    })

    it('이미지 URL과 각도 배열 길이가 다를 때 에러를 발생시켜야 함', async () => {
      const files = [new File([''], 'test.jpg', { type: 'image/jpeg' })]

      // 1개 파일이지만 2개 결과 반환 (불일치)
      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: [
          { publicUrl: 'https://example.com/test1.jpg', angle: 'front' },
          { publicUrl: 'https://example.com/test2.jpg', angle: 'left' },
        ],
      })

      const { result } = renderHook(() => useAnalysisFlow())

      await expect(result.current.uploadAndAnalyze(files)).rejects.toThrow(
        '이미지 URL과 각도 정보의 개수가 일치하지 않습니다.'
      )
    })

    it('분석 결과에 result_id가 없을 때 에러를 발생시켜야 함', async () => {
      const files = [new File([''], 'test.jpg', { type: 'image/jpeg' })]

      mockUploadImages.mockResolvedValue({
        userId: 'test-user-id',
        results: [{ publicUrl: 'https://example.com/test.jpg', angle: 'front' }],
      })

      mockAnalyze.mockResolvedValue({
        result_id: '',
        analysis: {},
        mapping: {},
        nlg: {},
        review_needed: false,
      })

      const { result } = renderHook(() => useAnalysisFlow())

      await expect(result.current.uploadAndAnalyze(files)).rejects.toThrow(
        '분석 결과 ID가 없습니다.'
      )
    })
  })

  describe('진행도 초기화', () => {
    it('에러 발생 시 진행도가 null로 초기화되어야 함', async () => {
      const files = [new File([''], 'test.jpg', { type: 'image/jpeg' })]

      mockUploadImages.mockRejectedValue(new Error('업로드 실패'))

      const { result } = renderHook(() => useAnalysisFlow())

      try {
        await result.current.uploadAndAnalyze(files)
      } catch (error) {
        // 에러 발생 후 진행도 확인
        expect(result.current.progress).toBeNull()
      }
    })
  })

  describe('로딩 상태', () => {
    it('업로드 중일 때 loading이 true여야 함', () => {
      mockUseImageUpload.mockReturnValue({
        uploadImages: mockUploadImages,
        loading: true,
        error: null,
      })

      const { result } = renderHook(() => useAnalysisFlow())

      expect(result.current.loading).toBe(true)
    })

    it('분석 중일 때 loading이 true여야 함', () => {
      mockUseAnalysis.mockReturnValue({
        analyze: mockAnalyze,
        loading: true,
        error: null,
      })

      const { result } = renderHook(() => useAnalysisFlow())

      expect(result.current.loading).toBe(true)
    })

    it('저장 중일 때 loading이 true여야 함', () => {
      mockUseAnalysisSave.mockReturnValue({
        saveAnalysis: mockSaveAnalysis,
        loading: true,
        error: null,
      })

      const { result } = renderHook(() => useAnalysisFlow())

      expect(result.current.loading).toBe(true)
    })
  })

  describe('에러 상태', () => {
    it('업로드 에러가 있을 때 error가 설정되어야 함', () => {
      const uploadError = new Error('업로드 에러')
      mockUseImageUpload.mockReturnValue({
        uploadImages: mockUploadImages,
        loading: false,
        error: uploadError,
      })

      const { result } = renderHook(() => useAnalysisFlow())

      expect(result.current.error).toBe(uploadError)
    })

    it('분석 에러가 있을 때 error가 설정되어야 함', () => {
      const analyzeError = new Error('분석 에러')
      mockUseAnalysis.mockReturnValue({
        analyze: mockAnalyze,
        loading: false,
        error: analyzeError,
      })

      const { result } = renderHook(() => useAnalysisFlow())

      expect(result.current.error).toBe(analyzeError)
    })
  })
})

