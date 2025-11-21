/**
 * Button 컴포넌트 테스트
 * 디자인 토큰 적용 검증
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '../Button'

describe('Button', () => {
  describe('디자인 토큰 적용', () => {
    it('primary variant는 디자인 토큰의 primary gradient를 사용해야 함', () => {
      const { container } = render(<Button variant="primary">테스트</Button>)
      const button = container.firstChild as HTMLElement
      
      // CSS 변수 사용 확인
      expect(button).toHaveClass('text-[color:var(--color-on-primary)]')
      expect(button.style.backgroundImage).toBeTruthy()
    })

    it('secondary variant는 디자인 토큰의 surface 색상을 사용해야 함', () => {
      const { container } = render(<Button variant="secondary">테스트</Button>)
      const button = container.firstChild as HTMLElement
      
      expect(button).toHaveClass('bg-[color:var(--color-surface-muted)]')
      expect(button).toHaveClass('text-[color:var(--color-text-primary)]')
    })

    it('outline variant는 디자인 토큰의 border 색상을 사용해야 함', () => {
      const { container } = render(<Button variant="outline">테스트</Button>)
      const button = container.firstChild as HTMLElement
      
      expect(button).toHaveClass('border-2')
      expect(button).toHaveClass('border-[color:var(--color-border-strong)]')
    })

    it('danger variant는 디자인 토큰의 danger 색상을 사용해야 함', () => {
      const { container } = render(<Button variant="danger">테스트</Button>)
      const button = container.firstChild as HTMLElement
      
      expect(button.style.backgroundColor).toBeTruthy()
      expect(button).toHaveClass('text-white')
    })

    it('모든 variant는 디자인 토큰의 radius를 사용해야 함', () => {
      const variants: Array<'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'> = [
        'primary',
        'secondary',
        'outline',
        'ghost',
        'danger',
      ]

      variants.forEach((variant) => {
        const { container } = render(<Button variant={variant}>테스트</Button>)
        const button = container.firstChild as HTMLElement
        expect(button).toHaveClass('rounded-[var(--radius-xl)]')
      })
    })

    it('모든 variant는 디자인 토큰의 shadow를 사용해야 함', () => {
      const { container } = render(<Button variant="primary">테스트</Button>)
      const button = container.firstChild as HTMLElement
      
      expect(button).toHaveClass('shadow-[var(--shadow-soft)]')
    })
  })

  describe('기본 기능', () => {
    it('버튼이 렌더링되어야 함', () => {
      render(<Button>클릭</Button>)
      expect(screen.getByRole('button', { name: '클릭' })).toBeInTheDocument()
    })

    it('클릭 이벤트가 동작해야 함', async () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>클릭</Button>)
      
      const button = screen.getByRole('button', { name: '클릭' })
      await userEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('disabled 상태일 때 클릭되지 않아야 함', async () => {
      const handleClick = jest.fn()
      render(<Button disabled onClick={handleClick}>클릭</Button>)
      
      const button = screen.getByRole('button', { name: '클릭' })
      await userEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
      expect(button).toBeDisabled()
    })

    it('isLoading 상태일 때 로딩 스피너가 표시되어야 함', () => {
      render(<Button isLoading>로딩 중</Button>)
      
      const button = screen.getByRole('button', { name: '로딩 중' })
      expect(button).toBeDisabled()
      // Loader2 아이콘이 있는지 확인 (lucide-react)
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    it('size prop에 따라 크기가 달라져야 함', () => {
      const { container: smContainer } = render(<Button size="sm">작은 버튼</Button>)
      const { container: mdContainer } = render(<Button size="md">중간 버튼</Button>)
      const { container: lgContainer } = render(<Button size="lg">큰 버튼</Button>)
      
      const smButton = smContainer.firstChild as HTMLElement
      const mdButton = mdContainer.firstChild as HTMLElement
      const lgButton = lgContainer.firstChild as HTMLElement
      
      expect(smButton).toHaveClass('px-4', 'py-2', 'text-sm')
      expect(mdButton).toHaveClass('px-6', 'py-3', 'text-base')
      expect(lgButton).toHaveClass('px-8', 'py-4', 'text-lg')
    })
  })

  describe('접근성', () => {
    it('aria-label이 제공되면 사용해야 함', () => {
      render(<Button aria-label="저장 버튼">저장</Button>)
      
      const button = screen.getByRole('button', { name: '저장 버튼' })
      expect(button).toBeInTheDocument()
    })

    it('focus-visible 상태에서 ring이 표시되어야 함', () => {
      const { container } = render(<Button>포커스</Button>)
      const button = container.firstChild as HTMLElement
      
      expect(button).toHaveClass('focus-visible:ring-2')
      expect(button).toHaveClass('focus-visible:ring-[color:var(--color-accent-200)]')
    })
  })
})

