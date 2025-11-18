/**
 * AnalysisTrendChart 컴포넌트 테스트
 */

import { render, screen } from '@testing-library/react'
import { AnalysisTrendChart } from '../AnalysisTrendChart'

// Recharts를 모킹
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}))

describe('AnalysisTrendChart', () => {
  const mockAnalyses = [
    {
      id: '1',
      created_at: '2025-01-01T00:00:00Z',
      stage_a_vision_result: {
        skin_condition_scores: {
          pigmentation: 0.7,
          acne: 0.3,
          redness: 0.2,
          pores: 0.5,
          wrinkles: 0.1,
        },
      },
    },
    {
      id: '2',
      created_at: '2025-01-15T00:00:00Z',
      stage_a_vision_result: {
        skin_condition_scores: {
          pigmentation: 0.6,
          acne: 0.2,
          redness: 0.15,
          pores: 0.4,
          wrinkles: 0.08,
        },
      },
    },
  ]

  it('빈 배열일 때 "그래프를 표시할 데이터가 없습니다" 메시지를 표시해야 함', () => {
    render(<AnalysisTrendChart analyses={[]} />)
    expect(screen.getByText('그래프를 표시할 데이터가 없습니다.')).toBeInTheDocument()
  })

  it('분석 데이터가 있을 때 그래프를 렌더링해야 함', () => {
    render(<AnalysisTrendChart analyses={mockAnalyses} />)
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
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
              acne: 0.4,
            },
          },
        },
      },
    ]

    render(<AnalysisTrendChart analyses={analysesWithAnalysisData} />)
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })
})

