import { render, screen } from '@testing-library/react'
import { ProgressBar } from '../components/ProgressBar'

describe('ProgressBar', () => {
  it('기본 렌더링', () => {
    render(<ProgressBar progress={50} />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toBeInTheDocument()
    expect(progressbar).toHaveAttribute('aria-valuenow', '50')
  })

  it('진행률 표시', () => {
    render(<ProgressBar progress={75} showLabel />)
    expect(screen.getByText('진행률')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('진행률 범위 제한 - 최대값', () => {
    render(<ProgressBar progress={150} />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '100')
  })

  it('진행률 범위 제한 - 최소값', () => {
    render(<ProgressBar progress={-10} />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '0')
  })

  it('색상 변형 - pink', () => {
    render(<ProgressBar progress={50} variant="pink" />)
    expect(screen.getByRole('progressbar').querySelector('.bg-pink-500')).toBeInTheDocument()
  })

  it('색상 변형 - blue', () => {
    render(<ProgressBar progress={50} variant="blue" />)
    expect(screen.getByRole('progressbar').querySelector('.bg-blue-500')).toBeInTheDocument()
  })

  it('크기 변형 - sm', () => {
    render(<ProgressBar progress={50} size="sm" />)
    expect(screen.getByRole('progressbar').querySelector('.h-1')).toBeInTheDocument()
  })

  it('크기 변형 - lg', () => {
    render(<ProgressBar progress={50} size="lg" />)
    expect(screen.getByRole('progressbar').querySelector('.h-3')).toBeInTheDocument()
  })

  it('애니메이션 비활성화', () => {
    render(<ProgressBar progress={50} animated={false} />)
    const progressbar = screen.getByRole('progressbar')
    // framer-motion이 없으면 일반 div로 렌더링됨
    expect(progressbar.querySelector('.h-full')).toBeInTheDocument()
  })
})

