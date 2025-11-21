/**
 * 프리미엄 페이지 테스트
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PremiumPage from '../page'
import { useAuth } from '@/app/lib/auth'
import { useToast } from '@/app/hooks/useToast'

// Mock dependencies
jest.mock('@/app/lib/auth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/app/hooks/useToast', () => ({
  useToast: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

jest.mock('@/app/components/common/BottomNav', () => ({
  __esModule: true,
  default: () => <nav>BottomNav</nav>,
}))

jest.mock('@/app/components/ui/Card', () => ({
  __esModule: true,
  default: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>

describe('PremiumPage', () => {
  let queryClient: QueryClient
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    jest.clearAllMocks()

    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      loading: false,
    } as any)

    mockUseToast.mockReturnValue(mockToast as any)
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('기본 렌더링', () => {
    it('프리미엄 페이지가 렌더링되어야 함', () => {
      render(<PremiumPage />, { wrapper })

      expect(screen.getByText('프리미엄')).toBeInTheDocument()
      expect(screen.getByText('프리미엄 멤버십')).toBeInTheDocument()
      expect(screen.getByText('프리미엄 혜택')).toBeInTheDocument()
      expect(screen.getByText('무료 vs 프리미엄')).toBeInTheDocument()
    })

    it('사용자가 없으면 로그인 페이지로 리다이렉트되어야 함', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      } as any)

      const { useRouter } = require('next/navigation')
      const mockPush = jest.fn()
      useRouter.mockReturnValue({ push: mockPush })

      render(<PremiumPage />, { wrapper })

      // router.push는 컴포넌트가 렌더링되기 전에 호출되므로 waitFor 사용
      waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('가격 정보가 표시되어야 함', () => {
      render(<PremiumPage />, { wrapper })

      expect(screen.getByText('월 ₩9,900')).toBeInTheDocument()
      expect(screen.getByText(/또는 연간 ₩99,000/)).toBeInTheDocument()
    })
  })

  describe('프리미엄 기능', () => {
    it('모든 프리미엄 기능이 표시되어야 함', () => {
      render(<PremiumPage />, { wrapper })

      expect(screen.getByText('무제한 분석')).toBeInTheDocument()
      expect(screen.getByText('고급 리포트')).toBeInTheDocument()
      expect(screen.getByText('우선 지원')).toBeInTheDocument()
      expect(screen.getByText('특별 혜택')).toBeInTheDocument()
    })

    it('각 기능의 설명이 표시되어야 함', () => {
      render(<PremiumPage />, { wrapper })

      expect(screen.getByText(/하루에 원하는 만큼 피부를 분석할 수 있습니다/)).toBeInTheDocument()
      expect(screen.getByText(/더 상세한 분석 결과와 개선 추천을 받을 수 있습니다/)).toBeInTheDocument()
      expect(screen.getByText(/프리미엄 고객 전용 고객 지원을 받을 수 있습니다/)).toBeInTheDocument()
      expect(screen.getByText(/제휴 병원 할인 및 특별 이벤트에 우선 참여/)).toBeInTheDocument()
    })
  })

  describe('비교표', () => {
    it('무료 vs 프리미엄 비교표가 표시되어야 함', () => {
      render(<PremiumPage />, { wrapper })

      expect(screen.getByText('일일 분석 횟수')).toBeInTheDocument()
      expect(screen.getByText('분석 리포트')).toBeInTheDocument()
      expect(screen.getByText('고객 지원')).toBeInTheDocument()
      expect(screen.getByText('제휴 혜택')).toBeInTheDocument()
    })

    it('무료와 프리미엄 기능이 모두 표시되어야 함', () => {
      render(<PremiumPage />, { wrapper })

      expect(screen.getByText('3회')).toBeInTheDocument()
      expect(screen.getByText('무제한')).toBeInTheDocument()
      expect(screen.getByText('기본')).toBeInTheDocument()
      expect(screen.getByText('고급')).toBeInTheDocument()
      expect(screen.getByText('일반')).toBeInTheDocument()
      expect(screen.getByText('우선 지원')).toBeInTheDocument()
      expect(screen.getByText('없음')).toBeInTheDocument()
      expect(screen.getByText('할인 및 이벤트')).toBeInTheDocument()
    })
  })

  describe('구독 버튼', () => {
    it('구독 버튼이 표시되어야 함', () => {
      render(<PremiumPage />, { wrapper })

      expect(screen.getByText('프리미엄 구독하기')).toBeInTheDocument()
    })

    it('구독 버튼 클릭 시 정보 메시지가 표시되어야 함', async () => {
      const user = userEvent.setup()
      render(<PremiumPage />, { wrapper })

      const subscribeButton = screen.getByText('프리미엄 구독하기')
      await user.click(subscribeButton)

      await waitFor(() => {
        expect(mockToast.info).toHaveBeenCalledWith('프리미엄 기능은 곧 출시될 예정입니다.')
      })
    })
  })

  describe('법적 고려 문구', () => {
    it('법적 고려 문구가 표시되어야 함', () => {
      render(<PremiumPage />, { wrapper })

      expect(screen.getByText(/참고용 안내/)).toBeInTheDocument()
      expect(screen.getByText(/프리미엄 멤버십은 추가 기능을 제공하며/)).toBeInTheDocument()
      expect(screen.getByText(/의료 진단 서비스가 아닙니다/)).toBeInTheDocument()
    })
  })
})


