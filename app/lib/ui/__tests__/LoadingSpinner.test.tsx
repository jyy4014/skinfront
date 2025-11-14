import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '../components/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('기본 렌더링', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByLabelText('로딩 중')).toBeInTheDocument()
  })

  it('메시지 표시', () => {
    render(<LoadingSpinner message="처리 중..." />)
    expect(screen.getByText('처리 중...')).toBeInTheDocument()
  })

  it('크기 변형', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />)
    let spinner = screen.getByRole('status')
    expect(spinner.querySelector('.w-4')).toBeInTheDocument()

    rerender(<LoadingSpinner size="lg" />)
    spinner = screen.getByRole('status')
    expect(spinner.querySelector('.w-12')).toBeInTheDocument()
  })

  it('전체 화면 모드', () => {
    render(<LoadingSpinner fullScreen />)
    const container = screen.getByRole('status').closest('.fixed')
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass('inset-0')
  })

  it('커스텀 aria-label', () => {
    render(<LoadingSpinner aria-label="분석 중" />)
    expect(screen.getByLabelText('분석 중')).toBeInTheDocument()
  })

  it('커스텀 className 적용', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />)
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })
})



