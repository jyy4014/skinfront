/**
 * History 페이지 테스트
 */

import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/auth'
import { useAnalysisHistory } from '@/app/lib/data'
import HistoryPage from '../page'

// 모킹
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/history'),
}))

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(),
}))

const mockUseAnalysisHistory = jest.fn()
jest.mock('@/lib/data', () => ({
  useAnalysisHistory: (...args: any[]) => mockUseAnalysisHistory(...args),
}))

jest.mock('@/components/history/AnalysisTrendChart', () => ({
  AnalysisTrendChart: () => <div data-testid="trend-chart">Trend Chart</div>,
}))

jest.mock('@/components/history/ImprovementSummary', () => ({
  ImprovementSummary: () => <div data-testid="improvement-summary">Improvement Summary</div>,
}))

jest.mock('@/components/history/BeforeAfterComparison', () => ({
  BeforeAfterComparison: () => <div data-testid="before-after">Before After</div>,
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
})

