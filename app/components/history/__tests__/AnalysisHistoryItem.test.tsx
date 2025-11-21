/**
 * AnalysisHistoryItem 컴포넌트 테스트
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnalysisHistoryItem } from '../AnalysisHistoryItem'
import { useDeleteAnalysis } from '@/app/lib/data/mutations/analysis'
import { useToast } from '@/app/hooks/useToast'

// Mock dependencies
jest.mock('@/app/lib/data/mutations/analysis')
jest.mock('@/app/hooks/useToast')
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockDeleteAnalysis = jest.fn()
const mockUseDeleteAnalysis = useDeleteAnalysis as jest.MockedFunction<typeof useDeleteAnalysis>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
}

const mockAnalysis = {
  id: 'test-analysis-id',
  created_at: '2024-01-15T10:00:00Z',
  image_url: 'https://example.com/image.jpg',
  result_summary: '테스트 분석 결과',
  confidence: 0.85,
}

describe('AnalysisHistoryItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDeleteAnalysis.mockReturnValue({
      deleteAnalysis: mockDeleteAnalysis,
      isPending: false,
      isError: false,
      error: null,
      isSuccess: false,
      mutate: jest.fn(),
      mutateAsync: mockDeleteAnalysis,
      reset: jest.fn(),
      status: 'idle',
    } as any)
    mockUseToast.mockReturnValue(mockToast as any)
  })

  describe('기본 렌더링', () => {
    it('분석 기록이 올바르게 표시되어야 함', () => {
      render(<AnalysisHistoryItem analysis={mockAnalysis} />)

      expect(screen.getByText('테스트 분석 결과')).toBeInTheDocument()
      expect(screen.getByText(/2024년 1월 15일/)).toBeInTheDocument()
      expect(screen.getByText(/신뢰도 85%/)).toBeInTheDocument()
    })

    it('이미지가 표시되어야 함', () => {
      render(<AnalysisHistoryItem analysis={mockAnalysis} />)

      const image = screen.getByAltText('분석 이미지')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
    })

    it('image_urls 배열에서 첫 번째 이미지를 사용해야 함', () => {
      const analysisWithUrls = {
        ...mockAnalysis,
        image_url: undefined,
        image_urls: ['https://example.com/first.jpg', 'https://example.com/second.jpg'],
      }
      render(<AnalysisHistoryItem analysis={analysisWithUrls} />)

      const image = screen.getByAltText('분석 이미지')
      expect(image).toHaveAttribute('src', 'https://example.com/first.jpg')
    })

    it('이미지가 없을 때 플레이스홀더가 표시되어야 함', () => {
      const analysisWithoutImage = {
        ...mockAnalysis,
        image_url: undefined,
        image_urls: undefined,
      }
      render(<AnalysisHistoryItem analysis={analysisWithoutImage} />)

      expect(screen.queryByAltText('분석 이미지')).not.toBeInTheDocument()
      // BarChart3 아이콘이 플레이스홀더로 표시되어야 함
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument()
    })

    it('result_summary가 없을 때 기본 텍스트가 표시되어야 함', () => {
      const analysisWithoutSummary = {
        ...mockAnalysis,
        result_summary: undefined,
      }
      render(<AnalysisHistoryItem analysis={analysisWithoutSummary} />)

      expect(screen.getByText('분석 결과')).toBeInTheDocument()
    })

    it('신뢰도가 없을 때 신뢰도 표시가 없어야 함', () => {
      const analysisWithoutConfidence = {
        ...mockAnalysis,
        confidence: undefined,
      }
      render(<AnalysisHistoryItem analysis={analysisWithoutConfidence} />)

      expect(screen.queryByText(/신뢰도/)).not.toBeInTheDocument()
    })

    it('상세 페이지로 이동하는 링크가 있어야 함', () => {
      render(<AnalysisHistoryItem analysis={mockAnalysis} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/analysis/test-analysis-id')
    })
  })

  describe('삭제 기능', () => {
    it('호버 시 삭제 버튼이 표시되어야 함', () => {
      render(<AnalysisHistoryItem analysis={mockAnalysis} />)

      const deleteButton = screen.getByLabelText('분석 기록 삭제')
      expect(deleteButton).toBeInTheDocument()
      // 기본적으로 opacity-0이지만 접근 가능해야 함
      expect(deleteButton).toHaveClass('opacity-0')
    })

    it('삭제 버튼 클릭 시 확인 모달이 열려야 함', async () => {
      const user = userEvent.setup()
      render(<AnalysisHistoryItem analysis={mockAnalysis} />)

      const deleteButton = screen.getByLabelText('분석 기록 삭제')
      await user.click(deleteButton)

      expect(screen.getByText('분석 기록 삭제')).toBeInTheDocument()
      expect(screen.getByText(/이 분석 기록을 삭제하시겠습니까/)).toBeInTheDocument()
    })

    it('확인 모달에서 취소 클릭 시 모달이 닫혀야 함', async () => {
      const user = userEvent.setup()
      render(<AnalysisHistoryItem analysis={mockAnalysis} />)

      const deleteButton = screen.getByLabelText('분석 기록 삭제')
      await user.click(deleteButton)

      const cancelButton = screen.getByText('취소')
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('분석 기록 삭제')).not.toBeInTheDocument()
      })
    })

    it('확인 모달에서 삭제 확인 시 deleteAnalysis가 호출되어야 함', async () => {
      const user = userEvent.setup()
      mockDeleteAnalysis.mockResolvedValue({ id: 'test-analysis-id' })
      render(<AnalysisHistoryItem analysis={mockAnalysis} />)

      const deleteButton = screen.getByLabelText('분석 기록 삭제')
      await user.click(deleteButton)

      const confirmButton = screen.getByText('삭제')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockDeleteAnalysis).toHaveBeenCalledWith('test-analysis-id')
      })
    })

    it('삭제 성공 시 성공 토스트가 표시되어야 함', async () => {
      const user = userEvent.setup()
      mockDeleteAnalysis.mockResolvedValue({ id: 'test-analysis-id' })
      render(<AnalysisHistoryItem analysis={mockAnalysis} />)

      const deleteButton = screen.getByLabelText('분석 기록 삭제')
      await user.click(deleteButton)

      const confirmButton = screen.getByText('삭제')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('분석 기록이 삭제되었습니다.')
      })
    })

    it('삭제 실패 시 에러 토스트가 표시되어야 함', async () => {
      const user = userEvent.setup()
      const error = new Error('삭제 실패')
      mockDeleteAnalysis.mockRejectedValue(error)
      render(<AnalysisHistoryItem analysis={mockAnalysis} />)

      const deleteButton = screen.getByLabelText('분석 기록 삭제')
      await user.click(deleteButton)

      const confirmButton = screen.getByText('삭제')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('삭제 실패')
      })
    })

    it('삭제 중일 때 삭제 버튼이 비활성화되어야 함', () => {
      mockUseDeleteAnalysis.mockReturnValue({
        deleteAnalysis: mockDeleteAnalysis,
        isPending: true,
        isError: false,
        error: null,
        isSuccess: false,
        mutate: jest.fn(),
        mutateAsync: mockDeleteAnalysis,
        reset: jest.fn(),
        status: 'pending',
      } as any)

      render(<AnalysisHistoryItem analysis={mockAnalysis} />)

      const deleteButton = screen.getByLabelText('분석 기록 삭제')
      expect(deleteButton).toBeDisabled()
    })

    it('onDelete 콜백이 호출되어야 함', async () => {
      const user = userEvent.setup()
      const onDelete = jest.fn()
      mockDeleteAnalysis.mockResolvedValue({ id: 'test-analysis-id' })
      render(<AnalysisHistoryItem analysis={mockAnalysis} onDelete={onDelete} />)

      const deleteButton = screen.getByLabelText('분석 기록 삭제')
      await user.click(deleteButton)

      const confirmButton = screen.getByText('삭제')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled()
      })
    })
  })

  describe('접근성', () => {
    it('삭제 버튼에 aria-label이 있어야 함', () => {
      render(<AnalysisHistoryItem analysis={mockAnalysis} />)

      const deleteButton = screen.getByLabelText('분석 기록 삭제')
      expect(deleteButton).toBeInTheDocument()
    })

    it('링크가 키보드로 접근 가능해야 함', () => {
      render(<AnalysisHistoryItem analysis={mockAnalysis} />)

      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
    })
  })
})


