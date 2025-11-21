import { render, screen } from '@testing-library/react'
import RecentAnalysisCard from '../RecentAnalysisCard'

describe('RecentAnalysisCard - NaN handling', () => {
  it('should not render NaN in mainScore', () => {
    const analysis = {
      id: '1',
      image_url: 'test.jpg',
      result_summary: 'Test',
      created_at: '2024-01-01',
      skin_condition_scores: {
        pigmentation: NaN,
        acne: Infinity,
      },
    }

    render(<RecentAnalysisCard analysis={analysis} />)
    
    // NaN이 렌더링되지 않아야 함
    expect(screen.queryByText(/NaN/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Infinity/i)).not.toBeInTheDocument()
  })

  it('should handle null scores gracefully', () => {
    const analysis = {
      id: '1',
      image_url: 'test.jpg',
      result_summary: 'Test',
      created_at: '2024-01-01',
      skin_condition_scores: null,
    }

    render(<RecentAnalysisCard analysis={analysis} />)
    
    // 컴포넌트가 에러 없이 렌더링되어야 함
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('should handle nested score objects', () => {
    const analysis = {
      id: '1',
      image_url: 'test.jpg',
      result_summary: 'Test',
      created_at: '2024-01-01',
      analysis_data: {
        analysis_a: {
          skin_condition_scores: {
            pigmentation: { score: 0.7 },
            acne: { score: 0.3 },
          },
        },
      },
    }

    render(<RecentAnalysisCard analysis={analysis} />)
    
    // 정상적으로 렌더링되어야 함
    expect(screen.getByText('Test')).toBeInTheDocument()
    // NaN이 없어야 함
    expect(screen.queryByText(/NaN/i)).not.toBeInTheDocument()
  })

  it('should calculate trend correctly without NaN', () => {
    const analysis = {
      id: '1',
      image_url: 'test.jpg',
      result_summary: 'Test',
      created_at: '2024-01-01',
      skin_condition_scores: {
        pigmentation: 0.7,
        acne: 0.3,
      },
      previousScores: {
        pigmentation: 0.8,
        acne: 0.4,
      },
    }

    render(<RecentAnalysisCard analysis={analysis} />)
    
    // NaN이 없어야 함
    expect(screen.queryByText(/NaN/i)).not.toBeInTheDocument()
  })
})

