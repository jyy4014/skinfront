/**
 * ProfileCompletionBanner 디자인 토큰 적용 테스트 (엄격한 TDD)
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileCompletionBanner from '../ProfileCompletionBanner'
import { useUserProfile } from '@/app/lib/data'

jest.mock('@/app/lib/data', () => ({
  useUserProfile: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('ProfileCompletionBanner - 디자인 토큰 적용 (TDD)', () => {
  const mockProfile = {
    name: '테스트',
    nickname: '테스트유저',
    birth_date: '1990-01-01',
    gender: '여성',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useUserProfile as jest.Mock).mockReturnValue({
      data: { profile: mockProfile },
    })
  })

  describe('디자인 토큰 적용 검증', () => {
    it('배너 배경은 디자인 토큰을 사용해야 함', () => {
      const { container } = render(<ProfileCompletionBanner />)
      
      const banner = container.firstChild as HTMLElement
      
      // 디자인 토큰 사용 확인
      expect(banner.className).toContain('bg-[color:var(--color-surface-muted)]')
      expect(banner.className).toContain('border-[color:var(--color-border-subtle)]')
      expect(banner.className).toContain('rounded-[var(--radius-2xl)]')
    })

    it('아이콘 배경은 디자인 토큰의 gradient를 사용해야 함', () => {
      const { container } = render(<ProfileCompletionBanner />)
      
      const iconContainer = container.querySelector('.rounded-full')
      
      // 디자인 토큰 사용 확인 (style 속성으로 gradient 적용)
      expect(iconContainer?.style.backgroundImage).toBeTruthy()
    })

    it('진행률 바는 디자인 토큰의 gradient를 사용해야 함', () => {
      const { container } = render(<ProfileCompletionBanner />)
      
      const progressBar = container.querySelector('.h-2')
      
      // 하드코딩된 그라디언트 대신 디자인 토큰 사용
      expect(progressBar?.className).not.toContain('bg-gradient-to-r from-pink-500 to-purple-500')
    })

    it('완성하기 버튼은 디자인 토큰을 사용해야 함', () => {
      render(<ProfileCompletionBanner />)
      
      const completeButton = screen.getByRole('button', { name: '지금 완성하기' })
      
      // 디자인 토큰 사용 확인
      expect(completeButton.style.backgroundImage).toBeTruthy()
      expect(completeButton.className).toContain('text-[color:var(--color-on-primary)]')
    })

    it('radius는 디자인 토큰을 사용해야 함', () => {
      const { container } = render(<ProfileCompletionBanner />)
      
      const banner = container.firstChild as HTMLElement
      
      // 디자인 토큰 사용 확인
      expect(banner.className).toContain('rounded-[var(--radius-2xl)]')
    })
  })
})

