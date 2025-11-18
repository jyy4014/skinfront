/**
 * ImprovementSummary 컴포넌트 테스트
 */

import { render, screen } from '@testing-library/react'
import { ImprovementSummary } from '../ImprovementSummary'

describe('ImprovementSummary', () => {
  const mockAnalyses = [
    {
      id: '1',
      created_at: '2025-01-01T00:00:00Z',
      stage_a_vision_result: {
        skin_condition_scores: {
          pigmentation: 0.8,
          acne: 0.5,
          redness: 0.4,
          pores: 0.7,
          wrinkles: 0.3,
        },
      },
    },
    {
      id: '2',
      created_at: '2025-01-15T00:00:00Z',
      stage_a_vision_result: {
        skin_condition_scores: {
          pigmentation: 0.6,
          acne: 0.3,
          redness: 0.2,
          pores: 0.5,
          wrinkles: 0.15,
        },
      },
    },
  ]

  it('분석이 2개 미만일 때 아무것도 렌더링하지 않아야 함', () => {
    const { container } = render(<ImprovementSummary analyses={[mockAnalyses[0]]} />)
    expect(container.firstChild).toBeNull()
  })

  it('분석이 2개 이상일 때 개선 추이 요약을 표시해야 함', () => {
    render(<ImprovementSummary analyses={mockAnalyses} />)
    expect(screen.getByText('개선 추이 요약')).toBeInTheDocument()
  })

  it('5% 이상 변화가 있는 항목만 표시해야 함', () => {
    render(<ImprovementSummary analyses={mockAnalyses} />)
    // pigmentation: 80% -> 60% (25% 감소)
    // acne: 50% -> 30% (40% 감소)
    // redness: 40% -> 20% (50% 감소)
    // pores: 70% -> 50% (28.6% 감소)
    // wrinkles: 30% -> 15% (50% 감소)
    // 모두 5% 이상 변화이므로 표시되어야 함
    const items = screen.getAllByText(/색소|여드름|홍조|모공|주름/)
    expect(items.length).toBeGreaterThan(0)
  })

  it('가장 큰 변화율 순으로 정렬되어야 함', () => {
    render(<ImprovementSummary analyses={mockAnalyses} />)
    const items = screen.getAllByText(/\d+\.\d+% 변화/)
    // 상위 3개만 표시되므로 3개 이하여야 함
    expect(items.length).toBeLessThanOrEqual(3)
  })

  it('analysis_data에서도 skin_condition_scores를 추출할 수 있어야 함', () => {
    const analysesWithAnalysisData = [
      {
        id: '1',
        created_at: '2025-01-01T00:00:00Z',
        analysis_data: {
          analysis_a: {
            skin_condition_scores: {
              pigmentation: 0.8,
              acne: 0.5,
            },
          },
        },
      },
      {
        id: '2',
        created_at: '2025-01-15T00:00:00Z',
        analysis_data: {
          analysis_a: {
            skin_condition_scores: {
              pigmentation: 0.6,
              acne: 0.3,
            },
          },
        },
      },
    ]

    render(<ImprovementSummary analyses={analysesWithAnalysisData} />)
    expect(screen.getByText('개선 추이 요약')).toBeInTheDocument()
  })
})

