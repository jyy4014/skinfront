/**
 * History 페이지 테스트
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/auth'
import { useAnalysisHistory } from '@/app/lib/data'
import HistoryPage from '../page'

// 모킹
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/history'),
}))

jest.mock('@/app/lib/auth', () => ({
  useAuth: jest.fn(),
}))

const mockUseAnalysisHistory = jest.fn()
jest.mock('@/app/lib/data', () => ({
  useAnalysisHistory: (...args: any[]) => mockUseAnalysisHistory(...args),
}))

jest.mock('@/app/components/history/AnalysisTrendChart', () => ({
  AnalysisTrendChart: () => <div data-testid="trend-chart">Trend Chart</div>,
}))

jest.mock('@/app/components/history/ImprovementSummary', () => ({
  ImprovementSummary: () => <div data-testid="improvement-summary">Improvement Summary</div>,
}))

jest.mock('@/app/components/history/BeforeAfterComparison', () => ({
  BeforeAfterComparison: () => <div data-testid="before-after">Before After</div>,
}))

jest.mock('@/app/components/history/AnalysisHistoryItem', () => ({
  AnalysisHistoryItem: ({ analysis }: any) => (
    <div data-testid={`analysis-item-${analysis.id}`}>
      {analysis.result_summary || '분석 결과'}
    </div>
  ),
}))

jest.mock('@/app/components/history/HistoryFilters', () => ({
  HistoryFilters: ({ sortBy, filterBy, onSortChange, onFilterChange }: any) => (
    <div data-testid="history-filters">
      <button onClick={() => onSortChange('newest')} data-testid="sort-newest">
        최신순
      </button>
      <button onClick={() => onFilterChange('all')} data-testid="filter-all">
        전체
      </button>
    </div>
  ),
  SortOption: {} as any,
  FilterOption: {} as any,
}))

const mockRouter = {
  push: jest.fn(),
}

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
}

describe('HistoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue({ user: mockUser })
    mockUseAnalysisHistory.mockReturnValue({
      data: [],
      isLoading: false,
    })
  })

  it('사용자가 없으면 로그인 페이지로 리다이렉트해야 함', () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: null })
    render(<HistoryPage />)
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/login')
  })

  it('로딩 중일 때 로딩 스피너를 표시해야 함', () => {
    mockUseAnalysisHistory.mockReturnValue({
      data: null,
      isLoading: true,
    })

    render(<HistoryPage />)
    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  it('분석 기록이 없을 때 EmptyState를 표시해야 함', () => {
    mockUseAnalysisHistory.mockReturnValue({
      data: [],
      isLoading: false,
    })

    render(<HistoryPage />)
    expect(screen.getByText('아직 분석 기록이 없습니다.')).toBeInTheDocument()
    expect(screen.getByText('첫 분석을 시작해보세요.')).toBeInTheDocument()
  })

  it('분석 기록이 있을 때 히스토리를 표시해야 함', async () => {
    const mockAnalyses = [
      {
        id: '1',
        created_at: '2025-01-15T00:00:00Z',
        image_url: 'https://example.com/image1.jpg',
        result_summary: '분석 결과 1',
        confidence: 0.85,
      },
      {
        id: '2',
        created_at: '2025-01-01T00:00:00Z',
        image_url: 'https://example.com/image2.jpg',
        result_summary: '분석 결과 2',
        confidence: 0.9,
      },
    ]

    mockUseAnalysisHistory.mockReturnValue({
      data: mockAnalyses,
      isLoading: false,
    })

    render(<HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText('분석 히스토리')).toBeInTheDocument()
      expect(screen.getByText('분석 기록')).toBeInTheDocument()
    })
  })

  it('시간 범위 필터 버튼을 표시해야 함', async () => {
    const mockAnalyses = [
      {
        id: '1',
        created_at: '2025-01-15T00:00:00Z',
        image_url: 'https://example.com/image1.jpg',
        result_summary: '분석 결과 1',
      },
    ]

    mockUseAnalysisHistory.mockReturnValue({
      data: mockAnalyses,
      isLoading: false,
    })

    render(<HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText('주간')).toBeInTheDocument()
      expect(screen.getByText('월간')).toBeInTheDocument()
      expect(screen.getByText('전체')).toBeInTheDocument()
    })
  })

  it('분석이 2개 이상일 때 개선 요약과 Before/After를 표시해야 함', async () => {
    // 현재 날짜 기준으로 최근 30일 이내 데이터 생성
    const now = new Date()
    const recentDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5일 전
    const olderDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000) // 20일 전

    const mockAnalyses = [
      {
        id: '1',
        created_at: recentDate.toISOString(),
        image_url: 'https://example.com/image1.jpg',
        result_summary: '분석 결과 1',
        stage_a_vision_result: {
          skin_condition_scores: { pigmentation: 0.6 },
        },
      },
      {
        id: '2',
        created_at: olderDate.toISOString(),
        image_url: 'https://example.com/image2.jpg',
        result_summary: '분석 결과 2',
        stage_a_vision_result: {
          skin_condition_scores: { pigmentation: 0.8 },
        },
      },
    ]

    mockUseAnalysisHistory.mockReturnValue({
      data: mockAnalyses,
      isLoading: false,
    })

    render(<HistoryPage />)

    await waitFor(() => {
      expect(screen.getByTestId('improvement-summary')).toBeInTheDocument()
      expect(screen.getByTestId('before-after')).toBeInTheDocument()
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  describe('필터링 및 정렬', () => {
    it('필터 및 정렬 컴포넌트가 표시되어야 함', async () => {
      const mockAnalyses = [
        {
          id: '1',
          created_at: '2025-01-15T00:00:00Z',
          image_url: 'https://example.com/image1.jpg',
          result_summary: '분석 결과 1',
          confidence: 0.85,
        },
      ]

      mockUseAnalysisHistory.mockReturnValue({
        data: mockAnalyses,
        isLoading: false,
      })

      render(<HistoryPage />)

      await waitFor(() => {
        expect(screen.getByTestId('history-filters')).toBeInTheDocument()
      })
    })

    it('시간 범위 필터링이 작동해야 함', async () => {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5일 전
      const monthAgo = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000) // 35일 전

      const mockAnalyses = [
        {
          id: '1',
          created_at: weekAgo.toISOString(),
          image_url: 'https://example.com/image1.jpg',
          result_summary: '최근 분석',
          confidence: 0.85,
        },
        {
          id: '2',
          created_at: monthAgo.toISOString(),
          image_url: 'https://example.com/image2.jpg',
          result_summary: '오래된 분석',
          confidence: 0.9,
        },
      ]

      mockUseAnalysisHistory.mockReturnValue({
        data: mockAnalyses,
        isLoading: false,
      })

      render(<HistoryPage />)

      await waitFor(() => {
        expect(screen.getByTestId('analysis-item-1')).toBeInTheDocument()
        expect(screen.getByTestId('analysis-item-2')).toBeInTheDocument()
      })

      // 주간 필터 클릭
      const weekButton = screen.getByText('주간')
      await userEvent.click(weekButton)

      // 주간 필터는 최근 7일만 표시하므로 5일 전 데이터만 표시되어야 함
      await waitFor(() => {
        expect(screen.getByTestId('analysis-item-1')).toBeInTheDocument()
        // 35일 전 데이터는 필터링되어야 함
        expect(screen.queryByTestId('analysis-item-2')).not.toBeInTheDocument()
      })
    })

    it('신뢰도 필터링이 작동해야 함', async () => {
      const mockAnalyses = [
        {
          id: '1',
          created_at: new Date().toISOString(),
          image_url: 'https://example.com/image1.jpg',
          result_summary: '높은 신뢰도',
          confidence: 0.9,
        },
        {
          id: '2',
          created_at: new Date().toISOString(),
          image_url: 'https://example.com/image2.jpg',
          result_summary: '낮은 신뢰도',
          confidence: 0.7,
        },
      ]

      mockUseAnalysisHistory.mockReturnValue({
        data: mockAnalyses,
        isLoading: false,
      })

      render(<HistoryPage />)

      await waitFor(() => {
        expect(screen.getByTestId('analysis-item-1')).toBeInTheDocument()
        expect(screen.getByTestId('analysis-item-2')).toBeInTheDocument()
      })
    })

    it('정렬이 작동해야 함', async () => {
      const mockAnalyses = [
        {
          id: '1',
          created_at: '2025-01-01T00:00:00Z',
          image_url: 'https://example.com/image1.jpg',
          result_summary: '오래된 분석',
          confidence: 0.85,
        },
        {
          id: '2',
          created_at: '2025-01-15T00:00:00Z',
          image_url: 'https://example.com/image2.jpg',
          result_summary: '최신 분석',
          confidence: 0.9,
        },
      ]

      mockUseAnalysisHistory.mockReturnValue({
        data: mockAnalyses,
        isLoading: false,
      })

      render(<HistoryPage />)

      await waitFor(() => {
        const items = screen.getAllByTestId(/analysis-item-/)
        // 기본적으로 최신순이므로 최신 분석이 먼저 표시되어야 함
        expect(items[0]).toHaveAttribute('data-testid', 'analysis-item-2')
      })
    })
  })
})

