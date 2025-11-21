/**
 * ResultView 시각화 개선 테스트 (엄격한 TDD)
 * 
 * TDD 순서:
 * 1. Red: 테스트 작성 → 실패 확인
 * 2. Green: 기능 구현 → 테스트 통과
 * 3. Refactor: 코드 개선
 */

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResultView from '../ResultView'
import { TreatmentCandidate } from '@/app/types'

// RadarChart 모킹
jest.mock('@/app/components/analysis/RadarChart', () => ({
  SkinRadarChart: ({ skinConditionScores }: { skinConditionScores: Record<string, number> }) => (
    <div data-testid="radar-chart">
      {JSON.stringify(skinConditionScores)}
    </div>
  ),
}))

describe('ResultView - 시각화 개선 (TDD)', () => {
  const mockAnalysis = {
    skin_condition_scores: {
      pigmentation: 0.72,
      acne: 0.12,
      redness: 0.08,
      pores: 0.45,
      wrinkles: 0.05,
    },
    confidence: 0.84,
  }

  const mockMapping = {
    treatment_candidates: [
      {
        id: 'laser_toning',
        name: 'Laser Toning',
        score: 0.62,
        expected_improvement_pct: 0.25,
        notes: ['good for superficial pigmentation', 'safe for all skin types'],
      },
      {
        id: 'chemical_peel',
        name: 'Chemical Peel',
        score: 0.45,
        expected_improvement_pct: 0.15,
        notes: ['effective for texture improvement'],
      },
    ] as TreatmentCandidate[],
  }

  const mockNlg = {
    headline: '중앙 볼 부위에 색소가 확인됩니다',
    paragraphs: [
      '이미지 분석 결과, 색소성 문제가 상대적으로 뚜렷하게 나타났습니다.',
      '비교적 자주 선택되는 옵션: Laser Toning',
    ],
  }

  const mockOnToggleHeatmap = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('디자인 토큰 적용 검증', () => {
    it('상단 신뢰도 카드는 디자인 토큰의 gradient를 사용해야 함', () => {
      const { container } = render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      const confidenceCard = container.querySelector('[style*="background-image"]')
      expect(confidenceCard).toBeInTheDocument()
      expect(confidenceCard?.getAttribute('style')).toContain('var(--gradient-primary)')
    })

    it('상태 배지는 디자인 토큰 색상을 사용해야 함', () => {
      const { container } = render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      // 양호 상태 배지 (confidence >= 0.7)
      const statusBadge = container.querySelector('.rounded-full')
      expect(statusBadge?.className).toContain('bg-[color:var(--color-success-500)]/20')
      expect(statusBadge?.className).toContain('text-[color:var(--color-success-200)]')
    })

    it('세부 지표 카드는 디자인 토큰을 사용해야 함', () => {
      const { container } = render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      const indicatorCard = container.querySelector('.bg-\\[color\\:var\\(--color-surface-muted\\)\\]')
      expect(indicatorCard).toBeInTheDocument()
      expect(indicatorCard?.className).toContain('rounded-[var(--radius-xl)]')
    })

    it('상태 배지는 점수에 따라 올바른 색상을 사용해야 함', () => {
      // 개선 필요 상태 (confidence < 0.5)
      const lowConfidenceAnalysis = { ...mockAnalysis, confidence: 0.4 }
      const { container } = render(
        <ResultView
          analysis={lowConfidenceAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      const statusBadge = container.querySelector('.rounded-full')
      expect(statusBadge?.className).toContain('bg-[color:var(--color-danger-500)]/20')
    })
  })

  describe('히트맵 오버레이 개선', () => {
    it('히트맵 오버레이 투명도 슬라이더가 표시되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={true}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      const opacitySlider = screen.getByLabelText('히트맵 오버레이 투명도 조절')
      expect(opacitySlider).toBeInTheDocument()
      expect(opacitySlider).toHaveAttribute('type', 'range')
      expect(opacitySlider).toHaveAttribute('min', '0')
      expect(opacitySlider).toHaveAttribute('max', '1')
      expect(opacitySlider).toHaveAttribute('step', '0.1')
    })

    it('히트맵 오버레이 투명도를 조절할 수 있어야 함', async () => {
      const user = userEvent.setup()
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={true}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      const opacitySlider = screen.getByLabelText('히트맵 오버레이 투명도 조절') as HTMLInputElement
      
      // 초기값 확인
      expect(opacitySlider.value).toBe('0.5')
      
      // 값 변경 (range input은 직접 value 설정)
      fireEvent.change(opacitySlider, { target: { value: '0.8' } })
      
      expect(opacitySlider.value).toBe('0.8')
    })

    it('히트맵 오버레이가 투명도에 따라 표시되어야 함', () => {
      const { container } = render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={true}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      const overlay = container.querySelector('[aria-label="히트맵 오버레이: 색소, 모공, 여드름 영역 강조"]')
      expect(overlay).toBeInTheDocument()
      expect(overlay?.getAttribute('style')).toContain('opacity')
    })

    it('히트맵 오버레이 색상은 디자인 토큰을 사용해야 함', () => {
      const { container } = render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={true}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      // 색소 오버레이 (pigmentation > 0.5) - className에 디자인 토큰 포함 확인
      const overlay = container.querySelector('[aria-label="히트맵 오버레이: 색소, 모공, 여드름 영역 강조"]')
      expect(overlay).toBeInTheDocument()
      
      // 디자인 토큰 사용 확인 (via-[color:var(--color-primary-500)])
      const overlayDivs = overlay?.querySelectorAll('div')
      const hasDesignToken = Array.from(overlayDivs || []).some(div => 
        div.className.includes('var(--color-primary-500)') || 
        div.className.includes('var(--color-accent-500)') || 
        div.className.includes('var(--color-danger-500)')
      )
      expect(hasDesignToken).toBe(true)
    })
  })

  describe('색상 코딩된 배지 개선', () => {
    it('세부 지표에 상태 배지가 표시되어야 함', () => {
      const { container } = render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      // 색소 72% -> "주의 필요"
      const statusBadges = container.querySelectorAll('.rounded-full')
      const indicatorBadges = Array.from(statusBadges).filter(badge => 
        badge.textContent?.includes('주의 필요') || 
        badge.textContent?.includes('개선 필요') || 
        badge.textContent?.includes('보통') || 
        badge.textContent?.includes('양호')
      )
      
      expect(indicatorBadges.length).toBeGreaterThan(0)
    })

    it('높은 점수(>=70%)는 "주의 필요" 배지를 표시해야 함', () => {
      const { container } = render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      // 색소 72% -> "주의 필요"
      const dangerBadge = Array.from(container.querySelectorAll('.rounded-full')).find(badge =>
        badge.className.includes('bg-[color:var(--color-danger-500)]/10')
      )
      expect(dangerBadge).toBeInTheDocument()
    })

    it('중간 점수(40-69%)는 "개선 필요" 또는 "보통" 배지를 표시해야 함', () => {
      const { container } = render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      // 모공 45% -> "보통"
      const warningBadge = Array.from(container.querySelectorAll('.rounded-full')).find(badge =>
        badge.className.includes('bg-[color:var(--color-warning-500)]/10')
      )
      expect(warningBadge).toBeInTheDocument()
    })

    it('낮은 점수(<40%)는 "양호" 배지를 표시해야 함', () => {
      const { container } = render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      // 여드름 12%, 홍조 8%, 주름 5% -> "양호"
      const successBadge = Array.from(container.querySelectorAll('.rounded-full')).find(badge =>
        badge.className.includes('bg-[color:var(--color-success-500)]/10')
      )
      expect(successBadge).toBeInTheDocument()
    })
  })

  describe('시술 추천 이유 설명', () => {
    it('시술 추천 이유가 표시되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      // 여러 개가 있을 수 있으므로 getAllByText 사용
      const reasonLabels = screen.getAllByText('추천 이유:')
      expect(reasonLabels.length).toBeGreaterThan(0)
      expect(screen.getByText('good for superficial pigmentation')).toBeInTheDocument()
      expect(screen.getByText('safe for all skin types')).toBeInTheDocument()
    })

    it('시술 추천 이유는 리스트 형식으로 표시되어야 함', () => {
      const { container } = render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      const reasonList = container.querySelector('ul')
      expect(reasonList).toBeInTheDocument()
      
      const listItems = reasonList?.querySelectorAll('li')
      expect(listItems?.length).toBeGreaterThan(0)
    })

    it('시술 추천 이유 텍스트는 디자인 토큰 색상을 사용해야 함', () => {
      const { container } = render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      const reasonText = container.querySelector('.text-\\[color\\:var\\(--color-text-secondary\\)\\]')
      expect(reasonText).toBeInTheDocument()
    })
  })

  describe('레이더 차트 개선', () => {
    it('레이더 차트가 표시되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      expect(screen.getByTestId('radar-chart')).toBeInTheDocument()
    })
  })

  describe('히트맵 토글 버튼 디자인 토큰', () => {
    it('히트맵 토글 버튼은 디자인 토큰을 사용해야 함', () => {
      const { container } = render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      const toggleButtons = container.querySelectorAll('[role="tab"]')
      expect(toggleButtons.length).toBe(2)
      
      toggleButtons.forEach(button => {
        expect(button.className).toContain('rounded-[var(--radius-md)]')
      })
    })

    it('선택된 토글 버튼은 디자인 토큰 shadow를 사용해야 함', () => {
      const { container } = render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={mockOnToggleHeatmap}
        />
      )

      const selectedButton = container.querySelector('[aria-selected="true"]')
      expect(selectedButton?.className).toContain('shadow-[var(--shadow-soft)]')
    })
  })
})

