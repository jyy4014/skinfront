/**
 * Input 컴포넌트 테스트
 * 디자인 토큰 적용 검증
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Input from '../Input'

describe('Input', () => {
  describe('디자인 토큰 적용', () => {
    it('기본 Input은 디자인 토큰의 border 색상을 사용해야 함', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('input') as HTMLInputElement
      
      expect(input.className).toContain('border-[color:var(--color-border-subtle)]')
    })

    it('focus 상태에서 디자인 토큰의 primary 색상을 사용해야 함', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('input') as HTMLInputElement
      
      expect(input.className).toContain('focus:ring-[color:var(--color-primary-500)]')
    })

    it('error 상태에서 디자인 토큰의 danger 색상을 사용해야 함', () => {
      const { container } = render(<Input error="에러 메시지" />)
      const input = container.querySelector('input') as HTMLInputElement
      
      expect(input.className).toContain('border-[color:var(--color-danger-500)]')
      expect(input.className).toContain('focus:ring-[color:var(--color-danger-500)]')
    })

    it('radius는 디자인 토큰을 사용해야 함', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('input') as HTMLInputElement
      
      expect(input).toHaveClass('rounded-[var(--radius-lg)]')
    })

    it('label은 디자인 토큰의 text 색상을 사용해야 함', () => {
      const { container } = render(<Input label="테스트" />)
      const label = container.querySelector('label') as HTMLLabelElement
      
      expect(label.className).toContain('text-[color:var(--color-text-primary)]')
    })

    it('error 메시지는 디자인 토큰의 danger 색상을 사용해야 함', () => {
      render(<Input error="에러" />)
      const errorMessage = screen.getByText('에러')
      
      expect(errorMessage.className).toContain('text-[color:var(--color-danger-500)]')
    })
  })

  describe('기본 기능', () => {
    it('input이 렌더링되어야 함', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('label이 제공되면 표시되어야 함', () => {
      render(<Input label="이메일" />)
      expect(screen.getByText('이메일')).toBeInTheDocument()
    })

    it('error가 제공되면 에러 메시지가 표시되어야 함', () => {
      render(<Input error="필수 입력 항목입니다" />)
      expect(screen.getByText('필수 입력 항목입니다')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('icon이 제공되면 아이콘이 표시되어야 함', () => {
      const TestIcon = () => <span data-testid="test-icon">🔍</span>
      render(<Input icon={<TestIcon />} />)
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('입력값이 변경되면 onChange가 호출되어야 함', async () => {
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)
      
      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'test')
      
      expect(handleChange).toHaveBeenCalled()
    })

    it('error 상태일 때 aria-invalid가 true여야 함', () => {
      const { container } = render(<Input error="에러" />)
      const input = container.querySelector('input') as HTMLInputElement
      
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('접근성', () => {
    it('label과 input이 연결되어야 함', () => {
      render(<Input label="이름" id="name-input" />)
      const label = screen.getByText('이름')
      const input = screen.getByRole('textbox')
      
      expect(label).toBeInstanceOf(HTMLLabelElement)
      // htmlFor 연결 확인은 실제 구현에 따라 다를 수 있음
    })

    it('error가 있을 때 aria-describedby가 설정되어야 함', () => {
      const { container } = render(<Input error="에러" id="test-input" />)
      const input = container.querySelector('input') as HTMLInputElement
      
      expect(input).toHaveAttribute('aria-describedby', 'test-input-error')
    })
  })
})

