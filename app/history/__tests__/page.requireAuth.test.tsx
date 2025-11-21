/**
 * HistoryPage - useRequireAuth 테스트
 */

import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/app/lib/auth/hooks/useRequireAuth'
import { useAnalysisHistory } from '@/app/lib/data'
import HistoryPage from '../page'

// 모킹
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/history'),
}))

jest.mock('@/app/lib/auth/hooks/useRequireAuth', () => ({
  useRequireAuth: jest.fn(),
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
  replace: jest.fn(),
  push: jest.fn(),
}

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
}

describe('HistoryPage - useRequireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    mockUseAnalysisHistory.mockReturnValue({
      data: [],
      isLoading: false,
    })
  })

  it('인증되지 않은 사용자는 로그인 안내 화면을 표시해야 함', () => {
    ;(useRequireAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
    })

    render(<HistoryPage />)
    
    // 인증되지 않은 사용자에게 로그인 안내 화면 표시
    expect(screen.getByText('분석 히스토리')).toBeInTheDocument()
    expect(screen.getByText('로그인 후 분석 기록을 확인하세요')).toBeInTheDocument()
    expect(screen.getByText('로그인하기')).toBeInTheDocument()
  })

  it('로딩 중일 때 로딩 스피너를 표시해야 함', () => {
    ;(useRequireAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: true,
      isAuthenticated: false,
    })

    mockUseAnalysisHistory.mockReturnValue({
      data: null,
      isLoading: true,
    })

    render(<HistoryPage />)
    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  it('인증된 사용자는 정상적으로 페이지를 볼 수 있어야 함', () => {
    ;(useRequireAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
    })

    mockUseAnalysisHistory.mockReturnValue({
      data: [],
      isLoading: false,
    })

    render(<HistoryPage />)
    expect(screen.getByText('분석 히스토리')).toBeInTheDocument()
  })

  it('분석 기록이 없을 때 EmptyState를 표시해야 함', () => {
    ;(useRequireAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
    })

    mockUseAnalysisHistory.mockReturnValue({
      data: [],
      isLoading: false,
    })

    render(<HistoryPage />)
    expect(screen.getByText('아직 분석 기록이 없습니다.')).toBeInTheDocument()
  })

  it('분석 기록이 있을 때 리스트를 표시해야 함', () => {
    ;(useRequireAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
    })

    const mockAnalyses = [
      {
        id: '1',
        created_at: '2024-01-01',
        result_summary: '테스트 분석 1',
        skin_condition_scores: { pigmentation: 0.7 },
      },
      {
        id: '2',
        created_at: '2024-01-02',
        result_summary: '테스트 분석 2',
        skin_condition_scores: { acne: 0.5 },
      },
    ]

    mockUseAnalysisHistory.mockReturnValue({
      data: mockAnalyses,
      isLoading: false,
    })

    render(<HistoryPage />)
    
    // AnalysisHistoryItem이 렌더링되어야 함
    expect(screen.getByTestId('analysis-item-1')).toBeInTheDocument()
    expect(screen.getByTestId('analysis-item-2')).toBeInTheDocument()
    
    // result_summary가 표시되어야 함
    expect(screen.getByText('테스트 분석 1')).toBeInTheDocument()
    expect(screen.getByText('테스트 분석 2')).toBeInTheDocument()
  })
})

