import { render, screen } from '@testing-library/react'
import { EmptyState } from '../components/EmptyState'

describe('EmptyState', () => {
  it('기본 렌더링', () => {
    render(<EmptyState />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument()
  })

  it('커스텀 메시지', () => {
    render(<EmptyState message="분석 기록이 없습니다." />)
    expect(screen.getByText('분석 기록이 없습니다.')).toBeInTheDocument()
  })

  it('설명 추가', () => {
    render(
      <EmptyState
        message="기록 없음"
        description="첫 분석을 시작해보세요."
      />
    )
    expect(screen.getByText('기록 없음')).toBeInTheDocument()
    expect(screen.getByText('첫 분석을 시작해보세요.')).toBeInTheDocument()
  })

  it('아이콘 타입 변경', () => {
    const { rerender } = render(<EmptyState icon="default" />)
    expect(screen.getByRole('status')).toBeInTheDocument()

    rerender(<EmptyState icon="history" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('액션 버튼 표시', () => {
    render(
      <EmptyState
        message="기록 없음"
        action={<button>시작하기</button>}
      />
    )
    expect(screen.getByText('시작하기')).toBeInTheDocument()
  })
})

