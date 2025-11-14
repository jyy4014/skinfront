import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorMessage } from '../components/ErrorMessage'
import { ErrorType } from '@/app/lib/error'

describe('ErrorMessage', () => {
  it('기본 렌더링', () => {
    render(<ErrorMessage error="테스트 에러" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('테스트 에러')).toBeInTheDocument()
  })

  it('Error 객체 처리', () => {
    const error = new Error('네트워크 오류')
    render(<ErrorMessage error={error} />)
    expect(screen.getByText('네트워크 오류')).toBeInTheDocument()
  })

  it('닫기 버튼 표시', async () => {
    const user = userEvent.setup()
    const onDismiss = jest.fn()
    
    render(<ErrorMessage error="테스트" dismissible onDismiss={onDismiss} />)
    
    const closeButton = screen.getByLabelText('에러 메시지 닫기')
    expect(closeButton).toBeInTheDocument()
    
    await user.click(closeButton)
    expect(onDismiss).toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('자동 스타일링 - 네트워크 에러', () => {
    const error = new Error('network error')
    render(<ErrorMessage error={error} autoStyle />)
    
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-200')
  })

  it('자동 스타일링 - 검증 에러', () => {
    const error = new Error('invalid input')
    render(<ErrorMessage error={error} autoStyle />)
    
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-blue-50', 'border-blue-200')
  })

  it('크기 변형', () => {
    const { rerender } = render(<ErrorMessage error="테스트" size="sm" />)
    expect(screen.getByRole('alert')).toHaveClass('p-2', 'text-xs')

    rerender(<ErrorMessage error="테스트" size="lg" />)
    expect(screen.getByRole('alert')).toHaveClass('p-4', 'text-base')
  })

  it('자동 스타일링 비활성화', () => {
    render(<ErrorMessage error="테스트" autoStyle={false} />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-gray-50', 'border-gray-200')
  })
})



