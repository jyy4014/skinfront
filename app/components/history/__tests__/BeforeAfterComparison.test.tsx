/**
 * BeforeAfterComparison 컴포넌트 테스트
 */

import { render, screen } from '@testing-library/react'
import { BeforeAfterComparison } from '../BeforeAfterComparison'

describe('BeforeAfterComparison', () => {
  const mockAnalyses = [
    {
      id: '1',
      created_at: '2025-01-15T00:00:00Z',
      image_url: 'https://example.com/after.jpg',
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
    {
      id: '2',
      created_at: '2025-01-01T00:00:00Z',
      image_url: 'https://example.com/before.jpg',
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
  ]

  it('분석이 2개 미만일 때 아무것도 렌더링하지 않아야 함', () => {
    const { container } = render(<BeforeAfterComparison analyses={[mockAnalyses[0]]} />)
    expect(container.firstChild).toBeNull()
  })

  it('분석이 2개 이상일 때 Before/After 비교를 표시해야 함', () => {
    render(<BeforeAfterComparison analyses={mockAnalyses} />)
    expect(screen.getByText('Before / After 비교')).toBeInTheDocument()
  })

  it('Before와 After 이미지를 표시해야 함', () => {
    render(<BeforeAfterComparison analyses={mockAnalyses} />)
    const images = screen.getAllByAltText(/Before|After/)
    expect(images).toHaveLength(2)
  })

  it('각 피부 상태별 점수 비교를 표시해야 함', () => {
    render(<BeforeAfterComparison analyses={mockAnalyses} />)
    expect(screen.getByText('색소')).toBeInTheDocument()
    expect(screen.getByText('여드름')).toBeInTheDocument()
    expect(screen.getByText('홍조')).toBeInTheDocument()
    expect(screen.getByText('모공')).toBeInTheDocument()
    expect(screen.getByText('주름')).toBeInTheDocument()
  })

  it('개선된 항목은 초록색으로 표시해야 함', () => {
    render(<BeforeAfterComparison analyses={mockAnalyses} />)
    // 모든 항목이 개선되었으므로 (점수 감소) 초록색 화살표가 있어야 함
    const improvements = screen.getAllByText(/↓/)
    expect(improvements.length).toBeGreaterThan(0)
  })

  it('image_urls 배열에서도 이미지를 가져올 수 있어야 함', () => {
    const analysesWithImageUrls = [
      {
        id: '1',
        created_at: '2025-01-15T00:00:00Z',
        image_urls: ['https://example.com/after.jpg'],
        stage_a_vision_result: {
          skin_condition_scores: { pigmentation: 0.6 },
        },
      },
      {
        id: '2',
        created_at: '2025-01-01T00:00:00Z',
        image_urls: ['https://example.com/before.jpg'],
        stage_a_vision_result: {
          skin_condition_scores: { pigmentation: 0.8 },
        },
      },
    ]

    render(<BeforeAfterComparison analyses={analysesWithImageUrls} />)
    const images = screen.getAllByAltText(/Before|After/)
    expect(images).toHaveLength(2)
  })

  it('analysis_data에서도 skin_condition_scores를 추출할 수 있어야 함', () => {
    const analysesWithAnalysisData = [
      {
        id: '1',
        created_at: '2025-01-15T00:00:00Z',
        image_url: 'https://example.com/after.jpg',
        analysis_data: {
          analysis_a: {
            skin_condition_scores: {
              pigmentation: 0.6,
            },
          },
        },
      },
      {
        id: '2',
        created_at: '2025-01-01T00:00:00Z',
        image_url: 'https://example.com/before.jpg',
        analysis_data: {
          analysis_a: {
            skin_condition_scores: {
              pigmentation: 0.8,
            },
          },
        },
      },
    ]

    render(<BeforeAfterComparison analyses={analysesWithAnalysisData} />)
    expect(screen.getByText('색소')).toBeInTheDocument()
  })
})

