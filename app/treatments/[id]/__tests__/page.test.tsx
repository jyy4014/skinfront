/**
 * 시술 상세 페이지 테스트
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/auth'
import {
  useTreatmentById,
  useFavoriteTreatments,
  useTreatmentFromRecentAnalysis,
  useToggleFavoriteTreatment,
} from '@/app/lib/data'
import TreatmentDetailPage from '../page'
import { useToast } from '@/app/hooks/useToast'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}))

jest.mock('@/app/lib/auth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/app/lib/data', () => ({
  useTreatmentById: jest.fn(),
  useFavoriteTreatments: jest.fn(),
  useTreatmentFromRecentAnalysis: jest.fn(),
  useToggleFavoriteTreatment: jest.fn(),
}))

jest.mock('@/app/hooks/useToast', () => ({
  useToast: jest.fn(),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockTreatment = {
  id: 'treatment-123',
  name: '프락셀 레이저',
  description: '레이저를 이용한 모공 및 잡티 개선 시술',
  benefits: '모공 축소, 잡티 제거, 피부결 개선',
  cost: 200000,
  recovery_time: '3-7일',
  risk_level: '중',
  duration_minutes: 30,
}

const mockRouter = {
  push: jest.fn(),
}

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
}

describe('TreatmentDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useParams as jest.Mock).mockReturnValue({ id: 'treatment-123' })
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-123' } })
    ;(useTreatmentById as jest.Mock).mockReturnValue({
      data: mockTreatment,
      isLoading: false,
      isError: false,
    })
    ;(useFavoriteTreatments as jest.Mock).mockReturnValue({
      data: [],
    })
    ;(useTreatmentFromRecentAnalysis as jest.Mock).mockReturnValue({
      data: null,
    })
    ;(useToggleFavoriteTreatment as jest.Mock).mockReturnValue({
      toggleFavorite: jest.fn().mockResolvedValue({
        treatmentId: 'treatment-123',
        isFavorite: true,
        favorites: ['treatment-123'],
      }),
      isPending: false,
    })
    ;(useToast as jest.Mock).mockReturnValue(mockToast)
  })

  describe('기본 렌더링', () => {
    it('시술 정보가 올바르게 표시되어야 함', () => {
      render(<TreatmentDetailPage />)

      expect(screen.getByText('프락셀 레이저')).toBeInTheDocument()
      expect(screen.getByText(/레이저를 이용한 모공 및 잡티 개선 시술/)).toBeInTheDocument()
      expect(screen.getByText(/모공 축소, 잡티 제거, 피부결 개선/)).toBeInTheDocument()
    })

    it('시술 상세 정보가 표시되어야 함', () => {
      render(<TreatmentDetailPage />)

      expect(screen.getByText(/200,000원/)).toBeInTheDocument()
      expect(screen.getByText(/약 30분/)).toBeInTheDocument()
      expect(screen.getByText(/3-7일/)).toBeInTheDocument()
    })

    it('로딩 중일 때 로딩 스피너가 표시되어야 함', () => {
      ;(useTreatmentById as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
      })

      render(<TreatmentDetailPage />)

      expect(screen.getByText('로딩 중...')).toBeInTheDocument()
    })

    it('시술 정보가 없을 때 에러 메시지가 표시되어야 함', () => {
      ;(useTreatmentById as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
      })

      render(<TreatmentDetailPage />)

      expect(screen.getByText(/시술 정보를 찾을 수 없습니다/)).toBeInTheDocument()
    })
  })

  describe('AI 설명 표시', () => {
    it('AI 설명이 있을 때 표시되어야 함', () => {
      ;(useTreatmentFromRecentAnalysis as jest.Mock).mockReturnValue({
        data: {
          treatment: {
            id: 'treatment-123',
            score: 0.85,
            expected_improvement_pct: 0.75,
          },
          nlg: {
            headline: 'AI 맞춤 설명 제목',
            paragraphs: ['설명 1', '설명 2'],
          },
        },
      })

      render(<TreatmentDetailPage />)

      expect(screen.getByText('AI 맞춤 설명')).toBeInTheDocument()
      expect(screen.getByText('AI 맞춤 설명 제목')).toBeInTheDocument()
      expect(screen.getByText('설명 1')).toBeInTheDocument()
      expect(screen.getByText('설명 2')).toBeInTheDocument()
    })

    it('AI 추천 배지가 표시되어야 함', () => {
      ;(useTreatmentFromRecentAnalysis as jest.Mock).mockReturnValue({
        data: {
          treatment: {
            id: 'treatment-123',
            score: 0.85,
          },
          nlg: {},
        },
      })

      render(<TreatmentDetailPage />)

      expect(screen.getByText('AI 추천 시술')).toBeInTheDocument()
      expect(screen.getByText(/적합도 85%/)).toBeInTheDocument()
    })

    it('예상 개선률이 표시되어야 함', () => {
      ;(useTreatmentFromRecentAnalysis as jest.Mock).mockReturnValue({
        data: {
          treatment: {
            id: 'treatment-123',
            expected_improvement_pct: 0.75,
          },
          nlg: {},
        },
      })

      render(<TreatmentDetailPage />)

      expect(screen.getByText(/예상 개선률/)).toBeInTheDocument()
      expect(screen.getByText(/75%/)).toBeInTheDocument()
    })

    it('AI 설명이 없을 때 표시되지 않아야 함', () => {
      ;(useTreatmentFromRecentAnalysis as jest.Mock).mockReturnValue({
        data: null,
      })

      render(<TreatmentDetailPage />)

      expect(screen.queryByText('AI 맞춤 설명')).not.toBeInTheDocument()
    })
  })

  describe('관심 등록 기능', () => {
    it('관심 등록 버튼이 표시되어야 함', () => {
      render(<TreatmentDetailPage />)

      const favoriteButton = screen.getByLabelText('관심 시술 등록')
      expect(favoriteButton).toBeInTheDocument()
    })

    it('등록된 시술은 하트가 채워져야 함', () => {
      ;(useFavoriteTreatments as jest.Mock).mockReturnValue({
        data: ['treatment-123'],
      })

      render(<TreatmentDetailPage />)

      const favoriteButton = screen.getByLabelText('관심 시술 해제')
      expect(favoriteButton).toBeInTheDocument()
      // 클래스 확인은 실제 렌더링된 요소에서 확인
      expect(favoriteButton.className).toContain('bg-pink-100')
    })

    it('등록되지 않은 시술은 하트가 비어있어야 함', () => {
      ;(useFavoriteTreatments as jest.Mock).mockReturnValue({
        data: [],
      })

      render(<TreatmentDetailPage />)

      const favoriteButton = screen.getByLabelText('관심 시술 등록')
      expect(favoriteButton).toBeInTheDocument()
      // 클래스 확인은 실제 렌더링된 요소에서 확인
      expect(favoriteButton.className).toContain('bg-gray-100')
    })

    it('관심 등록 버튼 클릭 시 toggleFavorite가 호출되어야 함', async () => {
      const user = userEvent.setup()
      const toggleFavorite = jest.fn().mockResolvedValue({
        treatmentId: 'treatment-123',
        isFavorite: true,
        favorites: ['treatment-123'],
      })

      ;(useToggleFavoriteTreatment as jest.Mock).mockReturnValue({
        toggleFavorite,
        isPending: false,
      })

      render(<TreatmentDetailPage />)

      const favoriteButton = screen.getByLabelText('관심 시술 등록')
      await user.click(favoriteButton)

      await waitFor(() => {
        expect(toggleFavorite).toHaveBeenCalledWith('treatment-123')
      })
    })

    it('등록 성공 시 성공 토스트가 표시되어야 함', async () => {
      const user = userEvent.setup()
      const toggleFavorite = jest.fn().mockResolvedValue({
        treatmentId: 'treatment-123',
        isFavorite: true,
        favorites: ['treatment-123'],
      })

      ;(useToggleFavoriteTreatment as jest.Mock).mockReturnValue({
        toggleFavorite,
        isPending: false,
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
      const toggleFavorite = jest.fn().mockResolvedValue({
        treatmentId: 'treatment-123',
        isFavorite: false,
        favorites: [],
      })

      ;(useFavoriteTreatments as jest.Mock).mockReturnValue({
        data: ['treatment-123'],
      })
      ;(useToggleFavoriteTreatment as jest.Mock).mockReturnValue({
        toggleFavorite,
        isPending: false,
      })

      render(<TreatmentDetailPage />)

      const favoriteButton = screen.getByLabelText('관심 시술 해제')
      await user.click(favoriteButton)

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('관심 시술에서 제거되었습니다.')
      })
    })

    it('로그인하지 않은 사용자는 로그인 페이지로 리다이렉트되어야 함', async () => {
      const user = userEvent.setup()
      ;(useAuth as jest.Mock).mockReturnValue({ user: null })

      render(<TreatmentDetailPage />)

      const favoriteButton = screen.getByLabelText('관심 시술 등록')
      await user.click(favoriteButton)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/login')
        expect(mockToast.error).toHaveBeenCalledWith('로그인이 필요합니다.')
      })
    })

    it('로딩 중일 때 버튼이 비활성화되어야 함', () => {
      ;(useToggleFavoriteTreatment as jest.Mock).mockReturnValue({
        toggleFavorite: jest.fn(),
        isPending: true,
      })

      render(<TreatmentDetailPage />)

      const favoriteButton = screen.getByLabelText('관심 시술 등록')
      expect(favoriteButton).toBeDisabled()
    })
  })

  describe('CTA 버튼', () => {
    it('홈으로 버튼이 표시되어야 함', () => {
      render(<TreatmentDetailPage />)

      expect(screen.getByText('홈으로')).toBeInTheDocument()
    })

    it('내 피부 분석하기 버튼이 표시되어야 함', () => {
      render(<TreatmentDetailPage />)

      expect(screen.getByText('내 피부 분석하기')).toBeInTheDocument()
    })

    it('홈으로 버튼 클릭 시 홈으로 이동해야 함', async () => {
      const user = userEvent.setup()
      render(<TreatmentDetailPage />)

      const homeButton = screen.getByText('홈으로')
      await user.click(homeButton)

      expect(mockRouter.push).toHaveBeenCalledWith('/home')
    })

    it('내 피부 분석하기 버튼 클릭 시 분석 페이지로 이동해야 함', async () => {
      const user = userEvent.setup()
      render(<TreatmentDetailPage />)

      const analyzeButton = screen.getByText('내 피부 분석하기')
      await user.click(analyzeButton)

      expect(mockRouter.push).toHaveBeenCalledWith('/analyze')
    })
  })

  describe('주의사항', () => {
    it('주의사항 섹션이 표시되어야 함', () => {
      render(<TreatmentDetailPage />)

      expect(screen.getByText('주의사항')).toBeInTheDocument()
      expect(screen.getByText(/위험도: 중/)).toBeInTheDocument()
      expect(screen.getByText(/본 서비스는 의료행위/)).toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('관심 등록 버튼에 aria-label이 있어야 함', () => {
      render(<TreatmentDetailPage />)

      expect(screen.getByLabelText('관심 시술 등록')).toBeInTheDocument()
    })

    it('뒤로가기 링크가 있어야 함', () => {
      render(<TreatmentDetailPage />)

      const backLink = screen.getByText('뒤로가기')
      expect(backLink.closest('a')).toHaveAttribute('href', '/home')
    })
  })
})


