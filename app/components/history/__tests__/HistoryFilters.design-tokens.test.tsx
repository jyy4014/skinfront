/**
 * HistoryFilters 디자인 토큰 적용 테스트 (엄격한 TDD)
 * 
 * TDD 순서:
 * 1. Red: 테스트 작성 → 실패 확인
 * 2. Green: 디자인 토큰 적용 → 테스트 통과
 * 3. Refactor: 코드 개선
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HistoryFilters, SortOption, FilterOption } from '../HistoryFilters'

describe('HistoryFilters - 디자인 토큰 적용 (TDD)', () => {
  const mockOnSortChange = jest.fn()
  const mockOnFilterChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('디자인 토큰 적용 검증', () => {
    it('선택된 필터 버튼은 디자인 토큰의 primary gradient를 사용해야 함', () => {
      const { container } = render(
        <HistoryFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          filterBy="all"
          onFilterChange={mockOnFilterChange}
        />
      )

      // "전체" 버튼이 선택된 상태
      const allButton = screen.getByRole('button', { name: '전체' })
      
      // 디자인 토큰 사용 확인 (style 속성으로 gradient 적용)
      expect(allButton.style.backgroundImage).toBeTruthy()
      expect(allButton.className).toContain('text-[color:var(--color-on-primary)]')
      expect(allButton.className).toContain('shadow-[var(--shadow-soft)]')
    })

    it('선택되지 않은 필터 버튼은 디자인 토큰의 surface 색상을 사용해야 함', () => {
      const { container } = render(
        <HistoryFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          filterBy="all"
          onFilterChange={mockOnFilterChange}
        />
      )

      // "신뢰도 높음" 버튼이 선택되지 않은 상태
      const highConfButton = screen.getByRole('button', { name: /신뢰도 높음/ })
      
      // 디자인 토큰 사용 확인
      expect(highConfButton.className).toContain('bg-[color:var(--color-surface-muted)]')
      expect(highConfButton.className).toContain('text-[color:var(--color-text-primary)]')
    })

    it('선택된 정렬 버튼은 디자인 토큰을 사용해야 함', () => {
      const { container } = render(
        <HistoryFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          filterBy="all"
          onFilterChange={mockOnFilterChange}
        />
      )

      const newestButton = screen.getByRole('button', { name: '최신순' })
      
      // 디자인 토큰 사용 확인
      expect(newestButton.style.backgroundImage).toBeTruthy()
      expect(newestButton.className).toContain('text-[color:var(--color-on-primary)]')
    })

    it('컨테이너는 디자인 토큰의 radius와 shadow를 사용해야 함', () => {
      const { container } = render(
        <HistoryFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          filterBy="all"
          onFilterChange={mockOnFilterChange}
        />
      )

      const containerDiv = container.firstChild as HTMLElement
      
      // 디자인 토큰 사용 확인
      expect(containerDiv.className).toContain('rounded-[var(--radius-2xl)]')
      expect(containerDiv.className).toContain('shadow-[var(--shadow-soft)]')
      expect(containerDiv.className).toContain('bg-[color:var(--color-surface-elevated)]')
    })
  })
})

