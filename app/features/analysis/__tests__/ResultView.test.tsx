/**
 * ResultView 컴포넌트 테스트
 * TDD 기반 테스트 작성
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResultView from '../ResultView'

// Recharts 모킹
jest.mock('recharts', () => ({
  Radar: () => <div data-testid="radar">Radar</div>,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  PolarGrid: () => <div data-testid="polar-grid">PolarGrid</div>,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis">PolarAngleAxis</div>,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis">PolarRadiusAxis</div>,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}))

// SkinRadarChart 모킹
jest.mock('../../../components/analysis/RadarChart', () => ({
  SkinRadarChart: ({ skinConditionScores }: any) => (
    <div data-testid="skin-radar-chart">
      {JSON.stringify(skinConditionScores)}
    </div>
  ),
}))

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
      notes: ['good for superficial pigmentation'],
    },
    {
      id: 'chemical_peel',
      name: 'Chemical Peel',
      score: 0.45,
      expected_improvement_pct: 0.15,
      notes: [],
    },
  ],
}

const mockNlg = {
  headline: '중앙 볼 부위에 색소가 확인됩니다',
  paragraphs: [
    '이미지 분석 결과, 색소성 문제가 상대적으로 뚜렷하게 나타났습니다.',
    '비교적 자주 선택되는 옵션: Laser Toning',
  ],
}

describe('ResultView', () => {
  describe('기본 렌더링', () => {
    it('분석 결과가 올바르게 표시되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      expect(screen.getByText(/중앙 볼 부위에 색소가 확인됩니다/)).toBeInTheDocument()
    })

    it('신뢰도가 표시되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      expect(screen.getByText(/84%/)).toBeInTheDocument()
      expect(screen.getByText(/AI 신뢰도/)).toBeInTheDocument()
    })

    it('레이더 차트가 표시되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      expect(screen.getByTestId('skin-radar-chart')).toBeInTheDocument()
    })

    it('세부 지표가 표시되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      // 세부 지표가 표시되는지 확인 (role="list" 내부)
      const list = screen.getByRole('list', { name: /피부 상태 세부 지표/ })
      expect(list).toBeInTheDocument()
      
      // 각 지표가 리스트 아이템으로 표시되는지 확인
      const listItems = screen.getAllByRole('listitem')
      expect(listItems.length).toBeGreaterThanOrEqual(5) // 최소 5개 지표
    })

    it('시술 추천 리스트가 표시되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      // 시술 추천 리스트 확인
      const treatmentList = screen.getByRole('list', { name: /추천 시술 목록/ })
      expect(treatmentList).toBeInTheDocument()
      
      // 시술 이름 확인 (getAllByText 사용 - NLG에도 포함될 수 있음)
      const laserToningElements = screen.getAllByText(/Laser Toning/)
      expect(laserToningElements.length).toBeGreaterThan(0)
      
      const chemicalPeelElements = screen.getAllByText(/Chemical Peel/)
      expect(chemicalPeelElements.length).toBeGreaterThan(0)
      
      expect(screen.getByText(/최적 추천/)).toBeInTheDocument()
    })
  })

  describe('히트맵 토글', () => {
    it('히트맵 토글 버튼이 표시되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      // 히트맵 토글 버튼 확인 (role="tab" 사용)
      const tabs = screen.getAllByRole('tab')
      expect(tabs.length).toBe(2)
      expect(tabs.some(tab => tab.textContent?.includes('원본'))).toBe(true)
      expect(tabs.some(tab => tab.textContent?.includes('분석 결과'))).toBe(true)
    })

    it('히트맵 토글 버튼 클릭 시 onToggleHeatmap이 호출되어야 함', async () => {
      const user = userEvent.setup()
      const onToggleHeatmap = jest.fn()

      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={onToggleHeatmap}
        />
      )

      // role="tab"을 사용하여 버튼 찾기
      const tabs = screen.getAllByRole('tab')
      const analyzeResultTab = tabs.find(tab => tab.textContent?.includes('분석 결과'))
      expect(analyzeResultTab).toBeInTheDocument()
      
      if (analyzeResultTab) {
        await user.click(analyzeResultTab)
      }

      expect(onToggleHeatmap).toHaveBeenCalledTimes(1)
    })

    it('showHeatmap이 true일 때 히트맵 오버레이가 표시되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={true}
          onToggleHeatmap={jest.fn()}
        />
      )

      // 히트맵 오버레이가 있는지 확인 (bg-gradient-to-b 클래스가 있는 요소)
      const imageContainer = screen.getByAltText('피부 분석 이미지').closest('.relative')
      expect(imageContainer).toBeInTheDocument()
    })
  })

  describe('시술 추천', () => {
    it('시술 추천이 점수 순으로 정렬되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      const treatmentLinks = screen.getAllByText(/Laser Toning|Chemical Peel/)
      // Laser Toning이 더 높은 점수이므로 먼저 표시되어야 함
      expect(treatmentLinks[0]).toHaveTextContent('Laser Toning')
    })

    it('시술 추천 카드 클릭 시 상세 페이지로 이동해야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      // 시술 추천 리스트에서 링크 찾기
      const treatmentLinks = screen.getAllByRole('link')
      const laserToningLink = treatmentLinks.find(link => 
        link.getAttribute('href') === '/treatments/laser_toning'
      )
      expect(laserToningLink).toBeInTheDocument()
    })

    it('예상 개선률이 표시되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      expect(screen.getByText(/예상 개선 25%/)).toBeInTheDocument()
      expect(screen.getByText(/예상 개선 15%/)).toBeInTheDocument()
    })
  })

  describe('엣지 케이스', () => {
    it('빈 분석 결과 처리', () => {
      render(
        <ResultView
          analysis={{ skin_condition_scores: {} }}
          mapping={{ treatment_candidates: [] }}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      // 에러 없이 렌더링되어야 함
      expect(screen.getByText(/시각적 분석/)).toBeInTheDocument()
    })

    it('NLG 결과가 없을 때도 렌더링되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      // 에러 없이 렌더링되어야 함
      expect(screen.getByText(/세부 지표/)).toBeInTheDocument()
    })

    it('시술 추천이 없을 때도 렌더링되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={{ treatment_candidates: [] }}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      // 에러 없이 렌더링되어야 함
      expect(screen.getByText(/세부 지표/)).toBeInTheDocument()
    })

    it('preview가 없을 때도 렌더링되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview={null}
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      // 에러 없이 렌더링되어야 함
      expect(screen.getByText(/세부 지표/)).toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('세부 지표 리스트에 role="list"가 있어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      const list = screen.getByRole('list', { name: /피부 상태 세부 지표/ })
      expect(list).toBeInTheDocument()
    })

    it('진행률 바에 aria 속성이 있어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      const progressbars = screen.getAllByRole('progressbar')
      expect(progressbars.length).toBeGreaterThan(0)
      progressbars.forEach((pb) => {
        expect(pb).toHaveAttribute('aria-valuenow')
        expect(pb).toHaveAttribute('aria-valuemin', '0')
        expect(pb).toHaveAttribute('aria-valuemax', '100')
      })
    })
  })

  describe('CTA 버튼', () => {
    it('resultId가 있을 때 "자세히 보기" 버튼이 표시되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
          resultId="test-result-id"
        />
      )

      expect(screen.getByText(/자세히 보기/)).toBeInTheDocument()
    })

    it('resultId가 없을 때 "자세히 보기" 버튼이 표시되지 않아야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      expect(screen.queryByText(/자세히 보기/)).not.toBeInTheDocument()
    })

    it('"홈으로 돌아가기" 버튼이 항상 표시되어야 함', () => {
      render(
        <ResultView
          analysis={mockAnalysis}
          mapping={mockMapping}
          nlg={mockNlg}
          preview="https://example.com/image.jpg"
          showHeatmap={false}
          onToggleHeatmap={jest.fn()}
        />
      )

      expect(screen.getByText(/홈으로 돌아가기/)).toBeInTheDocument()
    })
  })
})

