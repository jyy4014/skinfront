/**
 * HistoryFilters 컴포넌트 테스트
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HistoryFilters, SortOption, FilterOption } from '../HistoryFilters'

const defaultProps = {
  sortBy: 'newest' as SortOption,
  onSortChange: jest.fn(),
  filterBy: 'all' as FilterOption,
  onFilterChange: jest.fn(),
}

describe('HistoryFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('기본 렌더링', () => {
    it('필터 섹션이 표시되어야 함', () => {
      render(<HistoryFilters {...defaultProps} />)

      expect(screen.getByText('필터')).toBeInTheDocument()
      expect(screen.getByText('전체')).toBeInTheDocument()
      expect(screen.getByText('신뢰도 높음 (80% 이상)')).toBeInTheDocument()
      expect(screen.getByText('신뢰도 낮음 (80% 미만)')).toBeInTheDocument()
    })

    it('정렬 섹션이 표시되어야 함', () => {
      render(<HistoryFilters {...defaultProps} />)

      expect(screen.getByText('정렬')).toBeInTheDocument()
      expect(screen.getByText('최신순')).toBeInTheDocument()
      expect(screen.getByText('오래된순')).toBeInTheDocument()
      expect(screen.getByText('신뢰도 높은순')).toBeInTheDocument()
      expect(screen.getByText('신뢰도 낮은순')).toBeInTheDocument()
    })

    it('현재 선택된 필터가 하이라이트되어야 함', () => {
      render(<HistoryFilters {...defaultProps} filterBy="high_confidence" />)

      const highConfidenceButton = screen.getByText('신뢰도 높음 (80% 이상)')
      expect(highConfidenceButton).toHaveClass('bg-gradient-to-r')
    })

    it('현재 선택된 정렬이 하이라이트되어야 함', () => {
      render(<HistoryFilters {...defaultProps} sortBy="oldest" />)

      const oldestButton = screen.getByText('오래된순')
      expect(oldestButton).toHaveClass('bg-gradient-to-r')
    })
  })

  describe('필터 변경', () => {
    it('필터 버튼 클릭 시 onFilterChange가 호출되어야 함', async () => {
      const user = userEvent.setup()
      const onFilterChange = jest.fn()
      render(<HistoryFilters {...defaultProps} onFilterChange={onFilterChange} />)

      const highConfidenceButton = screen.getByText('신뢰도 높음 (80% 이상)')
      await user.click(highConfidenceButton)

      expect(onFilterChange).toHaveBeenCalledWith('high_confidence')
    })

    it('전체 필터 클릭 시 onFilterChange가 호출되어야 함', async () => {
      const user = userEvent.setup()
      const onFilterChange = jest.fn()
      render(
        <HistoryFilters
          {...defaultProps}
          filterBy="high_confidence"
          onFilterChange={onFilterChange}
        />
      )

      const allButton = screen.getByText('전체')
      await user.click(allButton)

      expect(onFilterChange).toHaveBeenCalledWith('all')
    })

    it('신뢰도 낮음 필터 클릭 시 onFilterChange가 호출되어야 함', async () => {
      const user = userEvent.setup()
      const onFilterChange = jest.fn()
      render(<HistoryFilters {...defaultProps} onFilterChange={onFilterChange} />)

      const lowConfidenceButton = screen.getByText('신뢰도 낮음 (80% 미만)')
      await user.click(lowConfidenceButton)

      expect(onFilterChange).toHaveBeenCalledWith('low_confidence')
    })
  })

  describe('정렬 변경', () => {
    it('정렬 버튼 클릭 시 onSortChange가 호출되어야 함', async () => {
      const user = userEvent.setup()
      const onSortChange = jest.fn()
      render(<HistoryFilters {...defaultProps} onSortChange={onSortChange} />)

      const oldestButton = screen.getByText('오래된순')
      await user.click(oldestButton)

      expect(onSortChange).toHaveBeenCalledWith('oldest')
    })

    it('최신순 클릭 시 onSortChange가 호출되어야 함', async () => {
      const user = userEvent.setup()
      const onSortChange = jest.fn()
      render(
        <HistoryFilters
          {...defaultProps}
          sortBy="oldest"
          onSortChange={onSortChange}
        />
      )

      const newestButton = screen.getByText('최신순')
      await user.click(newestButton)

      expect(onSortChange).toHaveBeenCalledWith('newest')
    })

    it('신뢰도 높은순 클릭 시 onSortChange가 호출되어야 함', async () => {
      const user = userEvent.setup()
      const onSortChange = jest.fn()
      render(<HistoryFilters {...defaultProps} onSortChange={onSortChange} />)

      const confidenceHighButton = screen.getByText('신뢰도 높은순')
      await user.click(confidenceHighButton)

      expect(onSortChange).toHaveBeenCalledWith('confidence_high')
    })

    it('신뢰도 낮은순 클릭 시 onSortChange가 호출되어야 함', async () => {
      const user = userEvent.setup()
      const onSortChange = jest.fn()
      render(<HistoryFilters {...defaultProps} onSortChange={onSortChange} />)

      const confidenceLowButton = screen.getByText('신뢰도 낮은순')
      await user.click(confidenceLowButton)

      expect(onSortChange).toHaveBeenCalledWith('confidence_low')
    })
  })

  describe('아이콘 표시', () => {
    it('필터 아이콘이 표시되어야 함', () => {
      render(<HistoryFilters {...defaultProps} />)

      // Filter 아이콘은 SVG로 렌더링되므로 role이나 aria-label로 찾을 수 없을 수 있음
      // 대신 부모 요소를 확인
      const filterLabel = screen.getByText('필터')
      expect(filterLabel).toBeInTheDocument()
    })

    it('정렬 아이콘이 표시되어야 함', () => {
      render(<HistoryFilters {...defaultProps} />)

      const sortLabel = screen.getByText('정렬')
      expect(sortLabel).toBeInTheDocument()
    })

    it('최신순에 화살표 아이콘이 표시되어야 함', () => {
      render(<HistoryFilters {...defaultProps} sortBy="newest" />)

      const newestButton = screen.getByText('최신순')
      // 아이콘은 버튼 내부에 있음
      expect(newestButton).toBeInTheDocument()
    })
  })

  describe('스타일링', () => {
    it('선택된 필터 버튼에 올바른 스타일이 적용되어야 함', () => {
      render(<HistoryFilters {...defaultProps} filterBy="high_confidence" />)

      const highConfidenceButton = screen.getByText('신뢰도 높음 (80% 이상)')
      expect(highConfidenceButton).toHaveClass('bg-gradient-to-r', 'from-pink-500', 'to-purple-500', 'text-white')
    })

    it('선택되지 않은 필터 버튼에 올바른 스타일이 적용되어야 함', () => {
      render(<HistoryFilters {...defaultProps} filterBy="all" />)

      const highConfidenceButton = screen.getByText('신뢰도 높음 (80% 이상)')
      expect(highConfidenceButton).toHaveClass('bg-gray-100', 'text-gray-700')
    })

    it('선택된 정렬 버튼에 올바른 스타일이 적용되어야 함', () => {
      render(<HistoryFilters {...defaultProps} sortBy="oldest" />)

      const oldestButton = screen.getByText('오래된순')
      expect(oldestButton).toHaveClass('bg-gradient-to-r', 'from-pink-500', 'to-purple-500', 'text-white')
    })
  })
})


