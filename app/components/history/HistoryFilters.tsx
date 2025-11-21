/**
 * 히스토리 필터링 및 정렬 컴포넌트
 */

'use client'

import { Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { designTokens } from '@/app/styles/design-tokens'

export type SortOption = 'newest' | 'oldest' | 'confidence_high' | 'confidence_low'
export type FilterOption = 'all' | 'high_confidence' | 'low_confidence'

interface HistoryFiltersProps {
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  filterBy: FilterOption
  onFilterChange: (filter: FilterOption) => void
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'confidence_high', label: '신뢰도 높은순' },
  { value: 'confidence_low', label: '신뢰도 낮은순' },
]

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'high_confidence', label: '신뢰도 높음 (80% 이상)' },
  { value: 'low_confidence', label: '신뢰도 낮음 (80% 미만)' },
]

export function HistoryFilters({
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange,
}: HistoryFiltersProps) {
  return (
    <div className={`bg-[color:var(--color-surface-elevated)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-soft)] p-4 space-y-4`}>
      {/* 필터 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-[color:var(--color-text-secondary)]" />
          <label className="text-sm font-semibold text-[color:var(--color-text-primary)]">필터</label>
        </div>
        <div className="flex gap-2 flex-wrap">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={`px-3 py-1.5 rounded-[var(--radius-lg)] text-sm font-medium transition-all ${
                filterBy === option.value
                  ? 'text-[color:var(--color-on-primary)] shadow-[var(--shadow-soft)]'
                  : 'bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface)]'
              }`}
              style={filterBy === option.value ? { backgroundImage: designTokens.gradients.primary } : undefined}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 정렬 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ArrowUpDown className="w-4 h-4 text-[color:var(--color-text-secondary)]" />
          <label className="text-sm font-semibold text-[color:var(--color-text-primary)]">정렬</label>
        </div>
        <div className="flex gap-2 flex-wrap">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={`px-3 py-1.5 rounded-[var(--radius-lg)] text-sm font-medium transition-all flex items-center gap-1 ${
                sortBy === option.value
                  ? 'text-[color:var(--color-on-primary)] shadow-[var(--shadow-soft)]'
                  : 'bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface)]'
              }`}
              style={sortBy === option.value ? { backgroundImage: designTokens.gradients.primary } : undefined}
            >
              {option.value === 'newest' && <ArrowDown className="w-3 h-3" />}
              {option.value === 'oldest' && <ArrowUp className="w-3 h-3" />}
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


