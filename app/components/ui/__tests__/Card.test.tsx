/**
 * Card 컴포넌트 테스트
 * 디자인 토큰 적용 검증
 */

import { render } from '@testing-library/react'
import Card from '../Card'

describe('Card', () => {
  describe('디자인 토큰 적용', () => {
    it('default variant는 디자인 토큰의 surface elevated 색상을 사용해야 함', () => {
      const { container } = render(<Card variant="default">내용</Card>)
      const card = container.firstChild as HTMLElement
      
      expect(card).toHaveClass('bg-[color:var(--color-surface-elevated)]')
      expect(card).toHaveClass('rounded-[var(--radius-2xl)]')
      expect(card).toHaveClass('shadow-[var(--shadow-soft)]')
    })

    it('elevated variant는 더 강한 shadow를 사용해야 함', () => {
      const { container } = render(<Card variant="elevated">내용</Card>)
      const card = container.firstChild as HTMLElement
      
      expect(card).toHaveClass('shadow-[var(--shadow-elevated)]')
    })

    it('outlined variant는 border를 사용해야 함', () => {
      const { container } = render(<Card variant="outlined">내용</Card>)
      const card = container.firstChild as HTMLElement
      
      expect(card).toHaveClass('border-2')
      expect(card).toHaveClass('border-[color:var(--color-border-strong)]')
      // designTokens.colors.surface.base는 var(--color-surface)를 반환
      expect(card.className).toContain('bg-[color:var(--color-surface)]')
    })

    it('모든 variant는 디자인 토큰의 radius를 사용해야 함', () => {
      const variants: Array<'default' | 'elevated' | 'outlined'> = [
        'default',
        'elevated',
        'outlined',
      ]

      variants.forEach((variant) => {
        const { container } = render(<Card variant={variant}>내용</Card>)
        const card = container.firstChild as HTMLElement
        expect(card).toHaveClass('rounded-[var(--radius-2xl)]')
      })
    })
  })

  describe('기본 기능', () => {
    it('children이 렌더링되어야 함', () => {
      const { getByText } = render(<Card>카드 내용</Card>)
      expect(getByText('카드 내용')).toBeInTheDocument()
    })

    it('className prop이 적용되어야 함', () => {
      const { container } = render(<Card className="custom-class">내용</Card>)
      const card = container.firstChild as HTMLElement
      
      expect(card).toHaveClass('custom-class')
    })

    it('기본 variant는 default여야 함', () => {
      const { container } = render(<Card>내용</Card>)
      const card = container.firstChild as HTMLElement
      
      expect(card).toHaveClass('bg-[color:var(--color-surface-elevated)]')
    })
  })
})

