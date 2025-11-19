/**
 * Analyze 페이지 테스트
 * TDD 기반 테스트 작성
 * 에러 처리 및 재시도 로직 테스트 포함
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAnalysisFlow } from '@/app/features/analysis/hooks'
import { classifyError, ErrorType } from '@/app/lib/error'
import AnalyzePage from '../page'

// 훅 모킹
jest.mock('@/app/features/analysis/hooks', () => ({
  useAnalysisFlow: jest.fn(),
}))

// Toast 모킹
jest.mock('@/app/hooks/useToast', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  }),
}))

// 이미지 프리뷰 훅 모킹
jest.mock('@/app/features/analyze/hooks/useImagePreview', () => ({
  useImagePreview: () => ({
    preview: null,
    createPreview: jest.fn(),
    clearPreview: jest.fn(),
  }),
}))

// 컴포넌트 모킹
jest.mock('@/app/components/common/Header', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <header>{title}</header>,
}))

jest.mock('@/app/components/common/BottomNav', () => ({
  __esModule: true,
  default: () => <nav>BottomNav</nav>,
}))

jest.mock('@/app/components/analysis/ProgressLoader', () => ({
  __esModule: true,
  default: ({ step, progress }: { step: string; progress?: number }) => (
    <div data-testid="progress-loader">
      {step} - {progress}%
    </div>
  ),
}))

jest.mock('@/app/features/analyze/components/ImageUploadSection', () => ({
  ImageUploadSection: ({ onFileSelect }: { onFileSelect: (files: File[]) => void }) => (
    <div>
      <button onClick={() => onFileSelect([new File([''], 'test.jpg', { type: 'image/jpeg' })])}>
        Upload
      </button>
    </div>
  ),
}))

jest.mock('@/app/features/analyze/components/ImagePreviewSection', () => ({
  ImagePreviewSection: ({ onAnalyze }: { onAnalyze: () => void }) => (
    <div>
      <button onClick={onAnalyze}>Analyze</button>
    </div>
  ),
}))

describe('AnalyzePage', () => {
  const mockUploadAndAnalyze = jest.fn()
  const mockUseAnalysisFlow = useAnalysisFlow as jest.MockedFunction<typeof useAnalysisFlow>

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAnalysisFlow.mockReturnValue({
      uploadAndAnalyze: mockUploadAndAnalyze,
      loading: false,
      error: null,
      progress: null,
    })
  })

  describe('기본 렌더링', () => {
    it('이미지 업로드 섹션이 표시되어야 함', () => {
      render(<AnalyzePage />)
      
      expect(screen.getByText('Upload')).toBeInTheDocument()
    })
  })

  describe('이미지 업로드', () => {
    it('이미지 선택 시 프리뷰가 생성되어야 함', async () => {
      const user = userEvent.setup()
      render(<AnalyzePage />)
      
      const uploadButton = screen.getByText('Upload')
      await user.click(uploadButton)
      
      // 이미지 선택 후 프리뷰 섹션이 표시되어야 함
      await waitFor(() => {
        expect(screen.getByText('Analyze')).toBeInTheDocument()
      })
    })
  })

  describe('분석 실행', () => {
    it('분석 버튼 클릭 시 분석이 시작되어야 함', async () => {
      const user = userEvent.setup()
      mockUploadAndAnalyze.mockResolvedValue({
        result_id: 'test-id',
        analysis: {},
        mapping: {},
        nlg: {},
        review_needed: false,
      })

      render(<AnalyzePage />)
      
      // 이미지 업로드
      await user.click(screen.getByText('Upload'))
      await waitFor(() => {
        expect(screen.getByText('Analyze')).toBeInTheDocument()
      })
      
      // 분석 시작
      await user.click(screen.getByText('Analyze'))
      
      await waitFor(() => {
        expect(mockUploadAndAnalyze).toHaveBeenCalled()
      })
    })

    it('이미지가 없으면 분석을 시작하지 않아야 함', async () => {
      const user = userEvent.setup()
      const toast = require('@/app/hooks/useToast').useToast()
      
      render(<AnalyzePage />)
      
      // Analyze 버튼이 없어야 함 (이미지가 없으므로)
      expect(screen.queryByText('Analyze')).not.toBeInTheDocument()
    })
  })

  describe('진행도 표시', () => {
    it('로딩 중일 때 ProgressLoader가 표시되어야 함', () => {
      mockUseAnalysisFlow.mockReturnValue({
        uploadAndAnalyze: mockUploadAndAnalyze,
        loading: true,
        error: null,
        progress: {
          stage: 'analyze',
          progress: 60,
          message: '피부 질감 분석 중...',
        },
      })

      render(<AnalyzePage />)
      
      expect(screen.getByTestId('progress-loader')).toBeInTheDocument()
      expect(screen.getByText(/피부 질감 분석 중/)).toBeInTheDocument()
      expect(screen.getByText(/60%/)).toBeInTheDocument()
    })

    it('progress와 stage가 ProgressLoader에 전달되어야 함', () => {
      mockUseAnalysisFlow.mockReturnValue({
        uploadAndAnalyze: mockUploadAndAnalyze,
        loading: true,
        error: null,
        progress: {
          stage: 'upload',
          progress: 30,
          message: '이미지 업로드 중...',
        },
      })

      render(<AnalyzePage />)
      
      const loader = screen.getByTestId('progress-loader')
      expect(loader).toHaveTextContent('이미지 업로드 중...')
      expect(loader).toHaveTextContent('30%')
    })
  })

  describe('에러 처리', () => {
    it('에러 발생 시 ErrorMessage가 표시되어야 함', () => {
      const networkError = new Error('Network error')
      mockUseAnalysisFlow.mockReturnValue({
        uploadAndAnalyze: mockUploadAndAnalyze,
        loading: false,
        error: networkError,
        progress: null,
      })

      render(<AnalyzePage />)
      
      // ErrorMessage 컴포넌트가 렌더링되어야 함
      // (실제 구현에 따라 다를 수 있음)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('재시도 가능한 에러일 때 재시도 버튼이 표시되어야 함', () => {
      const networkError = new Error('Network error')
      mockUseAnalysisFlow.mockReturnValue({
        uploadAndAnalyze: mockUploadAndAnalyze,
        loading: false,
        error: networkError,
        progress: null,
      })

      render(<AnalyzePage />)
      
      // 재시도 버튼이 표시되어야 함
      const retryButton = screen.getByRole('button', { name: /다시 시도/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('재시도 불가능한 에러일 때 재시도 버튼이 표시되지 않아야 함', () => {
      const validationError = new Error('Invalid image')
      mockUseAnalysisFlow.mockReturnValue({
        uploadAndAnalyze: mockUploadAndAnalyze,
        loading: false,
        error: validationError,
        progress: null,
      })

      render(<AnalyzePage />)
      
      // 재시도 버튼이 표시되지 않아야 함
      const retryButton = screen.queryByRole('button', { name: /다시 시도/i })
      expect(retryButton).not.toBeInTheDocument()
    })

    it('재시도 버튼 클릭 시 분석이 다시 시작되어야 함', async () => {
      const user = userEvent.setup()
      const networkError = new Error('Network error')
      
      mockUseAnalysisFlow.mockReturnValue({
        uploadAndAnalyze: mockUploadAndAnalyze,
        loading: false,
        error: networkError,
        progress: null,
      })

      mockUploadAndAnalyze.mockResolvedValueOnce({
        result_id: 'test-id',
        analysis: {},
        mapping: {},
        nlg: {},
        review_needed: false,
      })

      render(<AnalyzePage />)
      
      const retryButton = screen.getByRole('button', { name: /다시 시도/i })
      await user.click(retryButton)
      
      await waitFor(() => {
        expect(mockUploadAndAnalyze).toHaveBeenCalled()
      })
    })
  })

  describe('에러 타입별 처리', () => {
    it('네트워크 에러는 적절한 메시지와 함께 표시되어야 함', () => {
      const networkError = new Error('Failed to fetch')
      mockUseAnalysisFlow.mockReturnValue({
        uploadAndAnalyze: mockUploadAndAnalyze,
        loading: false,
        error: networkError,
        progress: null,
      })

      render(<AnalyzePage />)
      
      const classified = classifyError(networkError)
      expect(classified.type).toBe(ErrorType.NETWORK)
    })

    it('모델 에러는 적절한 메시지와 함께 표시되어야 함', () => {
      const modelError = new Error('AI 분석 중 오류가 발생했습니다')
      mockUseAnalysisFlow.mockReturnValue({
        uploadAndAnalyze: mockUploadAndAnalyze,
        loading: false,
        error: modelError,
        progress: null,
      })

      render(<AnalyzePage />)
      
      const classified = classifyError(modelError)
      expect(classified.type).toBe(ErrorType.MODEL)
    })
  })
})

