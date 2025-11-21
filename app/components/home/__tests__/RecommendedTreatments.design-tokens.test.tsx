/**
 * RecommendedTreatments 디자인 토큰 적용 테스트 (엄격한 TDD)
 */

import { render, screen, waitFor } from '@testing-library/react'
import RecommendedTreatments from '../RecommendedTreatments'
import { createClient } from '@/app/lib/supabaseClient'

jest.mock('@/app/lib/supabaseClient', () => ({
  createClient: jest.fn(),
}))

describe('RecommendedTreatments - 디자인 토큰 적용 (TDD)', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
    })),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase as any)
  })

  describe('디자인 토큰 적용 검증', () => {
    it('로딩 스켈레톤은 디자인 토큰을 사용해야 함', () => {
      const { container } = render(<RecommendedTreatments />)

      const skeleton = container.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()
      
      // 하드코딩된 border-gray-200, bg-gray-200 대신 디자인 토큰 사용
      expect(skeleton?.className).not.toContain('border-gray-200')
      expect(skeleton?.className).not.toContain('bg-gray-200')
    })

    it('시술 카드는 디자인 토큰을 사용해야 함', async () => {
      render(<RecommendedTreatments />)

      await waitFor(() => {
        const treatmentLinks = screen.getAllByRole('link')
        expect(treatmentLinks.length).toBeGreaterThan(0)
      })

      const { container } = render(<RecommendedTreatments />)
      await waitFor(() => {
        const link = container.querySelector('a')
        expect(link).toBeInTheDocument()
      })

      const link = container.querySelector('a')
      
      // 하드코딩된 border-gray-200, hover:border-pink-500 대신 디자인 토큰 사용
      expect(link?.className).not.toContain('border-gray-200')
      expect(link?.className).not.toContain('hover:border-pink-500')
    })

    it('텍스트 색상은 디자인 토큰을 사용해야 함', async () => {
      const { container } = render(<RecommendedTreatments />)

      await waitFor(() => {
        const heading = container.querySelector('h4')
        expect(heading).toBeInTheDocument()
      })

      const heading = container.querySelector('h4')
      const description = container.querySelector('p')
      
      // 하드코딩된 text-gray-900, text-gray-600 대신 디자인 토큰 사용
      expect(heading?.className).not.toContain('text-gray-900')
      expect(description?.className).not.toContain('text-gray-600')
    })

    it('radius는 디자인 토큰을 사용해야 함', async () => {
      const { container } = render(<RecommendedTreatments />)

      await waitFor(() => {
        const link = container.querySelector('a')
        expect(link).toBeInTheDocument()
      })

      const link = container.querySelector('a')
      
      // 하드코딩된 rounded-lg 대신 디자인 토큰 사용
      expect(link?.className).not.toContain('rounded-lg')
    })
  })
})

