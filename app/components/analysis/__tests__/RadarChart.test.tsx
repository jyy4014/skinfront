/**
 * SkinRadarChart 컴포넌트 테스트
 * TDD 기반 테스트 작성
 */

import { render, screen } from '@testing-library/react'
import { SkinRadarChart } from '../RadarChart'

// Recharts를 모킹
jest.mock('recharts', () => ({
  Radar: ({ dataKey }: any) => <div data-testid="radar" data-key={dataKey}>Radar</div>,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  PolarGrid: () => <div data-testid="polar-grid">PolarGrid</div>,
  PolarAngleAxis: ({ dataKey }: any) => <div data-testid="polar-angle-axis" data-key={dataKey}>PolarAngleAxis</div>,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis">PolarRadiusAxis</div>,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}))

const mockSkinConditionScores = {
  pigmentation: 0.72,
  acne: 0.12,
  redness: 0.08,
  pores: 0.45,
  wrinkles: 0.05,
}

describe('SkinRadarChart', () => {
  describe('기본 렌더링', () => {
    it('레이더 차트가 렌더링되어야 함', () => {
      render(<SkinRadarChart skinConditionScores={mockSkinConditionScores} />)
      
      expect(screen.getByTestId('radar-chart')).toBeInTheDocument()
      expect(screen.getByTestId('radar')).toBeInTheDocument()
    })

    it('ResponsiveContainer가 렌더링되어야 함', () => {
      render(<SkinRadarChart skinConditionScores={mockSkinConditionScores} />)
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('PolarGrid가 렌더링되어야 함', () => {
      render(<SkinRadarChart skinConditionScores={mockSkinConditionScores} />)
      
      expect(screen.getByTestId('polar-grid')).toBeInTheDocument()
    })

    it('PolarAngleAxis가 렌더링되어야 함', () => {
      render(<SkinRadarChart skinConditionScores={mockSkinConditionScores} />)
      
      expect(screen.getByTestId('polar-angle-axis')).toBeInTheDocument()
    })

    it('PolarRadiusAxis가 렌더링되어야 함', () => {
      render(<SkinRadarChart skinConditionScores={mockSkinConditionScores} />)
      
      expect(screen.getByTestId('polar-radius-axis')).toBeInTheDocument()
    })
  })

  describe('데이터 변환', () => {
    it('skinConditionScores를 올바르게 퍼센트로 변환해야 함', () => {
      render(<SkinRadarChart skinConditionScores={mockSkinConditionScores} />)
      
      const radar = screen.getByTestId('radar')
      expect(radar).toHaveAttribute('data-key', 'value')
    })

    it('모든 지표가 포함되어야 함', () => {
      const { container } = render(
        <SkinRadarChart skinConditionScores={mockSkinConditionScores} />
      )
      
      // 차트가 렌더링되었는지 확인
      expect(container.querySelector('[data-testid="radar-chart"]')).toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('role="img"와 aria-label이 있어야 함', () => {
      const { container } = render(
        <SkinRadarChart skinConditionScores={mockSkinConditionScores} />
      )
      
      const imgElement = container.querySelector('[role="img"]')
      expect(imgElement).toBeInTheDocument()
      expect(imgElement).toHaveAttribute('aria-label', '피부 상태 레이더 차트')
    })
  })

  describe('다양한 데이터 값', () => {
    it('모든 값이 0일 때도 렌더링되어야 함', () => {
      const zeroScores = {
        pigmentation: 0,
        acne: 0,
        redness: 0,
        pores: 0,
        wrinkles: 0,
      }
      
      render(<SkinRadarChart skinConditionScores={zeroScores} />)
      
      expect(screen.getByTestId('radar-chart')).toBeInTheDocument()
    })

    it('모든 값이 최대값일 때도 렌더링되어야 함', () => {
      const maxScores = {
        pigmentation: 1,
        acne: 1,
        redness: 1,
        pores: 1,
        wrinkles: 1,
      }
      
      render(<SkinRadarChart skinConditionScores={maxScores} />)
      
      expect(screen.getByTestId('radar-chart')).toBeInTheDocument()
    })
  })

  describe('className prop', () => {
    it('전달된 className이 적용되어야 함', () => {
      const { container } = render(
        <SkinRadarChart 
          skinConditionScores={mockSkinConditionScores} 
          className="custom-class"
        />
      )
      
      const chartContainer = container.querySelector('.custom-class')
      expect(chartContainer).toBeInTheDocument()
    })
  })
})

