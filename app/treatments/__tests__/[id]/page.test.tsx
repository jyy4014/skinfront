/**
 * 시술 상세 페이지 테스트
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth'
import {
  useTreatmentById,
  useFavoriteTreatments,
  useTreatmentFromRecentAnalysis,
  useToggleFavoriteTreatment,
} from '../../../lib/data'
import TreatmentDetailPage from '../../[id]/page'
import { useToast } from '../../../hooks/useToast'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}))

jest.mock('../../../lib/auth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../../../lib/data', () => ({
  useTreatmentById: jest.fn(),
  useFavoriteTreatments: jest.fn(),
  useTreatmentFromRecentAnalysis: jest.fn(),
  useToggleFavoriteTreatment: jest.fn(),
}))

jest.mock('../../../hooks/useToast', () => ({
  useToast: jest.fn(),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseTreatmentById = useTreatmentById as jest.MockedFunction<typeof useTreatmentById>
const mockUseFavoriteTreatments = useFavoriteTreatments as jest.MockedFunction<
  typeof useFavoriteTreatments
>
const mockUseTreatmentFromRecentAnalysis =
  useTreatmentFromRecentAnalysis as jest.MockedFunction<
    typeof useTreatmentFromRecentAnalysis
  >
const mockUseToggleFavoriteTreatment =
  useToggleFavoriteTreatment as jest.MockedFunction<typeof useToggleFavoriteTreatment>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>

const mockTreatment = {
  id: 'treatment-1',
  name: '프락셀 레이저',
  description: '레이저를 이용한 모공 및 잡티 개선 시술',
  benefits: '모공 축소, 잡티 제거, 피부결 개선',
  cost: 200000,
  recovery_time: '3-7일',
  risk_level: '중',
  duration_minutes: 30,
}

describe('TreatmentDetailPage', () => {
  const mockPush = jest.fn()
  const mockToggleFavorite = jest.fn()
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseParams.mockReturnValue({ id: 'treatment-1' } as any)
    mockUseRouter.mockReturnValue({ push: mockPush } as any)
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } } as any)
    mockUseTreatmentById.mockReturnValue({
      data: mockTreatment,
      isLoading: false,
      isError: false,
      error: null,
    } as any)
    mockUseFavoriteTreatments.mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
    mockUseTreatmentFromRecentAnalysis.mockReturnValue({
      data: null,
      isLoading: false,
    } as any)
    mockUseToggleFavoriteTreatment.mockReturnValue({
      toggleFavorite: mockToggleFavorite,
      isPending: false,
    } as any)
    mockUseToast.mockReturnValue(mockToast as any)
  })

  describe('기본 렌더링', () => {
    it('시술 정보가 올바르게 표시되어야 함', () => {
      render(<TreatmentDetailPage />)

      expect(screen.getByText('프락셀 레이저')).toBeInTheDocument()
      expect(screen.getByText(/레이저를 이용한 모공 및 잡티 개선 시술/)).toBeInTheDocument()
      expect(screen.getByText(/모공 축소, 잡티 제거, 피부결 개선/)).toBeInTheDocument()
      expect(screen.getByText(/200,000원/)).toBeInTheDocument()
      expect(screen.getByText(/약 30분/)).toBeInTheDocument()
      expect(screen.getByText(/3-7일/)).toBeInTheDocument()
    })

    it('로딩 중일 때 로딩 스피너가 표시되어야 함', () => {
      mockUseTreatmentById.mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
      } as any)

      render(<TreatmentDetailPage />)

      expect(screen.getByText('로딩 중...')).toBeInTheDocument()
    })

    it('시술 정보가 없을 때 에러 메시지가 표시되어야 함', () => {
      mockUseTreatmentById.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      } as any)

      render(<TreatmentDetailPage />)

      expect(screen.getByText(/시술 정보를 찾을 수 없습니다/)).toBeInTheDocument()
    })
  })

  describe('AI 설명 표시', () => {
    it('AI 설명이 있을 때 AI 맞춤 설명 카드가 표시되어야 함', () => {
      const analysisInfo = {
        treatment: {
          id: 'treatment-1',
          name: '프락셀 레이저',
          score: 0.9,
          expected_improvement_pct: 0.8,
        },
        nlg: {
          headline: 'AI 추천 시술',
          paragraphs: ['이 시술은 당신의 피부 상태에 매우 적합합니다.'],
        },
        analysisDate: '2024-01-15T10:00:00Z',
      }

      mockUseTreatmentFromRecentAnalysis.mockReturnValue({
        data: analysisInfo,
        isLoading: false,
      } as any)

      render(<TreatmentDetailPage />)

      expect(screen.getByText('AI 맞춤 설명')).toBeInTheDocument()
      expect(screen.getByText('AI 추천 시술')).toBeInTheDocument()
      expect(screen.getByText(/이 시술은 당신의 피부 상태에 매우 적합합니다/)).toBeInTheDocument()
      expect(screen.getByText(/AI 추천 시술/)).toBeInTheDocument()
      expect(screen.getByText(/적합도 90%/)).toBeInTheDocument()
    })

    it('AI 설명이 없을 때 AI 맞춤 설명 카드가 표시되지 않아야 함', () => {
      mockUseTreatmentFromRecentAnalysis.mockReturnValue({
        data: null,
        isLoading: false,
      } as any)

      render(<TreatmentDetailPage />)

      expect(screen.queryByText('AI 맞춤 설명')).not.toBeInTheDocument()
    })

    it('예상 개선률이 표시되어야 함', () => {
      const analysisInfo = {
        treatment: {
          id: 'treatment-1',
          expected_improvement_pct: 0.8,
        },
        nlg: null,
        analysisDate: '2024-01-15T10:00:00Z',
      }

      mockUseTreatmentFromRecentAnalysis.mockReturnValue({
        data: analysisInfo,
        isLoading: false,
      } as any)

      render(<TreatmentDetailPage />)

      expect(screen.getByText(/예상 개선률/)).toBeInTheDocument()
      expect(screen.getByText(/80%/)).toBeInTheDocument()
    })
  })

  describe('관심 등록 기능', () => {
    it('관심 시술이 등록되지 않았을 때 빈 하트가 표시되어야 함', () => {
      mockUseFavoriteTreatments.mockReturnValue({
        data: [],
        isLoading: false,
      } as any)

      render(<TreatmentDetailPage />)

      const favoriteButton = screen.getByLabelText('관심 시술 등록')
      expect(favoriteButton).toBeInTheDocument()
      expect(favoriteButton).not.toHaveClass('bg-pink-100')
    })

    it('관심 시술이 등록되었을 때 채워진 하트가 표시되어야 함', () => {
      mockUseFavoriteTreatments.mockReturnValue({
        data: ['treatment-1'],
        isLoading: false,
      } as any)

      render(<TreatmentDetailPage />)

      const favoriteButton = screen.getByLabelText('관심 시술 해제')
      expect(favoriteButton).toBeInTheDocument()
      expect(favoriteButton).toHaveClass('bg-pink-100')
    })

    it('하트 버튼 클릭 시 toggleFavorite가 호출되어야 함', async () => {
      const user = userEvent.setup()
      mockToggleFavorite.mockResolvedValue({
        treatmentId: 'treatment-1',
        isFavorite: true,
        favorites: ['treatment-1'],
      })

      render(<TreatmentDetailPage />)

      const favoriteButton = screen.getByLabelText('관심 시술 등록')
      await user.click(favoriteButton)

      expect(mockToggleFavorite).toHaveBeenCalledWith('treatment-1')
    })

    it('등록 성공 시 성공 토스트가 표시되어야 함', async () => {
      const user = userEvent.setup()
      mockToggleFavorite.mockResolvedValue({
        treatmentId: 'treatment-1',
        isFavorite: true,
        favorites: ['treatment-1'],
      })

      render(<TreatmentDetailPage />)

      const favoriteButton = screen.getByLabelText('관심 시술 등록')
      await user.click(favoriteButton)

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('관심 시술로 등록되었습니다.')
      })
    })

    it('해제 성공 시 성공 토스트가 표시되어야 함', async () => {
      const user = userEvent.setup()
      mockUseFavoriteTreatments.mockReturnValue({
        data: ['treatment-1'],
        isLoading: false,
      } as any)
      mockToggleFavorite.mockResolvedValue({
        treatmentId: 'treatment-1',
        isFavorite: false,
        favorites: [],
      })

      render(<TreatmentDetailPage />)

      const favoriteButton = screen.getByLabelText('관심 시술 해제')
      await user.click(favoriteButton)

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('관심 시술에서 제거되었습니다.')
      })
    })

    it('로그인하지 않은 사용자가 클릭 시 로그인 페이지로 리다이렉트해야 함', async () => {
      const user = userEvent.setup()
      mockUseAuth.mockReturnValue({ user: null } as any)

      render(<TreatmentDetailPage />)

      const favoriteButton = screen.getByLabelText('관심 시술 등록')
      await user.click(favoriteButton)

      expect(mockToast.error).toHaveBeenCalledWith('로그인이 필요합니다.')
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })

    it('에러 발생 시 에러 토스트가 표시되어야 함', async () => {
      const user = userEvent.setup()
      const error = new Error('등록 실패')
      mockToggleFavorite.mockRejectedValue(error)

      render(<TreatmentDetailPage />)

      const favoriteButton = screen.getByLabelText('관심 시술 등록')
      await user.click(favoriteButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('등록 실패')
      })
    })

    it('로딩 중일 때 버튼이 비활성화되어야 함', () => {
      mockUseToggleFavoriteTreatment.mockReturnValue({
        toggleFavorite: mockToggleFavorite,
        isPending: true,
      } as any)

      render(<TreatmentDetailPage />)

      const favoriteButton = screen.getByLabelText('관심 시술 등록')
      expect(favoriteButton).toBeDisabled()
    })
  })

  describe('CTA 버튼', () => {
    it('홈으로 버튼 클릭 시 홈으로 이동해야 함', async () => {
      const user = userEvent.setup()
      render(<TreatmentDetailPage />)

      const homeButton = screen.getByText('홈으로')
      await user.click(homeButton)

      expect(mockPush).toHaveBeenCalledWith('/home')
    })

    it('내 피부 분석하기 버튼 클릭 시 분석 페이지로 이동해야 함', async () => {
      const user = userEvent.setup()
      render(<TreatmentDetailPage />)

      const analyzeButton = screen.getByText('내 피부 분석하기')
      await user.click(analyzeButton)

      expect(mockPush).toHaveBeenCalledWith('/analyze')
    })
  })

  describe('접근성', () => {
    it('관심 등록 버튼에 aria-label이 있어야 함', () => {
      render(<TreatmentDetailPage />)

      expect(screen.getByLabelText('관심 시술 등록')).toBeInTheDocument()
    })

    it('뒤로가기 링크가 있어야 함', () => {
      render(<TreatmentDetailPage />)

      const backLink = screen.getByText('뒤로가기').closest('a')
      expect(backLink).toHaveAttribute('href', '/home')
    })
  })
})

