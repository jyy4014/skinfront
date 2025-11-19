/**
 * TDD: ImageQualityFeedback 컴포넌트 엄격 테스트
 * 
 * 테스트 범위:
 * 1. 렌더링
 * 2. 품질 점수 표시
 * 3. 세부 점수 진행률 바
 * 4. 문제점 및 권장사항 표시
 * 5. 재촬영 버튼
 * 6. 접근성
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageQualityFeedback } from '../ImageQualityFeedback'
import type { ImageQualityResult } from '@/app/lib/image/quality-check'

const mockQualityGood: ImageQualityResult = {
  overallScore: 85,
  sharpness: 90,
  brightness: 80,
  angle: 85,
  issues: [],
  recommendations: [],
  isGood: true,
}

const mockQualityBad: ImageQualityResult = {
  overallScore: 35,
  sharpness: 30,
  brightness: 25,
  angle: 50,
  issues: ['이미지가 흐릿합니다', '조명이 너무 어둡습니다'],
  recommendations: ['더 선명한 사진을 촬영해주세요', '밝은 곳에서 촬영해주세요'],
  isGood: false,
}

const mockQualityMedium: ImageQualityResult = {
  overallScore: 55,
  sharpness: 60,
  brightness: 50,
  angle: 55,
  issues: [],
  recommendations: ['초점을 더 정확히 맞춰주세요', '조명을 더 밝게 해주세요'],
  isGood: false,
}

describe('ImageQualityFeedback', () => {
  describe('기본 렌더링', () => {
    it('품질 결과가 올바르게 표시되어야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityGood} />)

      expect(screen.getByText(/완벽해요! 분석에 적합한 사진입니다/)).toBeInTheDocument()
      expect(screen.getByText(/품질 점수: 85\/100/)).toBeInTheDocument()
    })

    it('세부 점수가 표시되어야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityGood} />)

      expect(screen.getByText('초점')).toBeInTheDocument()
      expect(screen.getByText('조명')).toBeInTheDocument()
      expect(screen.getByText('각도')).toBeInTheDocument()
      expect(screen.getByText('90%')).toBeInTheDocument() // sharpness
      expect(screen.getByText('80%')).toBeInTheDocument() // brightness
      expect(screen.getByText('85%')).toBeInTheDocument() // angle
    })
  })

  describe('품질 점수별 메시지', () => {
    it('점수가 80 이상이면 완벽 메시지가 표시되어야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityGood} />)

      expect(screen.getByText(/완벽해요! 분석에 적합한 사진입니다/)).toBeInTheDocument()
    })

    it('점수가 60-79 사이면 좋음 메시지가 표시되어야 함', () => {
      const quality = {
        ...mockQualityMedium,
        overallScore: 70,
      }
      render(<ImageQualityFeedback quality={quality} />)

      expect(screen.getByText(/좋아요! 분석 가능한 사진입니다/)).toBeInTheDocument()
    })

    it('점수가 40-59 사이면 개선 필요 메시지가 표시되어야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityMedium} />)

      expect(screen.getByText(/개선이 필요합니다. 더 나은 사진을 권장합니다/)).toBeInTheDocument()
    })

    it('점수가 40 미만이면 재촬영 메시지가 표시되어야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityBad} />)

      expect(screen.getByText(/재촬영을 권장합니다/)).toBeInTheDocument()
    })
  })

  describe('세부 점수 진행률 바', () => {
    it('초점 점수가 진행률 바로 표시되어야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityGood} />)

      const sharpnessBars = screen.getAllByRole('progressbar', { name: /초점 점수/ })
      expect(sharpnessBars.length).toBeGreaterThan(0)
      expect(sharpnessBars[0]).toHaveAttribute('aria-valuenow', '90')
    })

    it('조명 점수가 진행률 바로 표시되어야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityGood} />)

      const brightnessBars = screen.getAllByRole('progressbar', { name: /조명 점수/ })
      expect(brightnessBars.length).toBeGreaterThan(0)
      expect(brightnessBars[0]).toHaveAttribute('aria-valuenow', '80')
    })

    it('각도 점수가 진행률 바로 표시되어야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityGood} />)

      const angleBars = screen.getAllByRole('progressbar', { name: /각도 점수/ })
      expect(angleBars.length).toBeGreaterThan(0)
      expect(angleBars[0]).toHaveAttribute('aria-valuenow', '85')
    })

    it('점수에 따라 색상이 변경되어야 함 (초점 70 이상 = 녹색)', () => {
      render(<ImageQualityFeedback quality={mockQualityGood} />)

      const sharpnessBar = screen.getByRole('progressbar', { name: /초점 점수 90퍼센트/ })
      const progressBar = sharpnessBar.parentElement?.querySelector('.bg-green-500')
      expect(progressBar).toBeInTheDocument()
    })

    it('점수에 따라 색상이 변경되어야 함 (초점 50-70 = 노란색)', () => {
      render(<ImageQualityFeedback quality={mockQualityMedium} />)

      const sharpnessBar = screen.getByRole('progressbar', { name: /초점 점수 60퍼센트/ })
      const progressBar = sharpnessBar.parentElement?.querySelector('.bg-yellow-500')
      expect(progressBar).toBeInTheDocument()
    })

    it('점수에 따라 색상이 변경되어야 함 (초점 50 미만 = 빨간색)', () => {
      render(<ImageQualityFeedback quality={mockQualityBad} />)

      const sharpnessBar = screen.getByRole('progressbar', { name: /초점 점수 30퍼센트/ })
      const progressBar = sharpnessBar.parentElement?.querySelector('.bg-red-500')
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('문제점 및 권장사항', () => {
    it('문제점이 없으면 문제점 섹션이 표시되지 않아야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityGood} />)

      expect(screen.queryByText(/발견된 문제:/)).not.toBeInTheDocument()
    })

    it('문제점이 있으면 문제점 섹션이 표시되어야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityBad} />)

      expect(screen.getByText(/발견된 문제:/)).toBeInTheDocument()
      expect(screen.getByText('이미지가 흐릿합니다')).toBeInTheDocument()
      expect(screen.getByText('조명이 너무 어둡습니다')).toBeInTheDocument()
    })

    it('권장사항이 없으면 권장사항 섹션이 표시되지 않아야 함', () => {
      const quality = {
        ...mockQualityGood,
        recommendations: [],
      }
      render(<ImageQualityFeedback quality={quality} />)

      expect(screen.queryByText(/개선 권장사항:/)).not.toBeInTheDocument()
    })

    it('권장사항이 있으면 권장사항 섹션이 표시되어야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityMedium} />)

      expect(screen.getByText(/개선 권장사항:/)).toBeInTheDocument()
      expect(screen.getByText('초점을 더 정확히 맞춰주세요')).toBeInTheDocument()
      expect(screen.getByText('조명을 더 밝게 해주세요')).toBeInTheDocument()
    })

    it('문제점과 권장사항이 모두 있으면 둘 다 표시되어야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityBad} />)

      expect(screen.getByText(/발견된 문제:/)).toBeInTheDocument()
      expect(screen.getByText(/개선 권장사항:/)).toBeInTheDocument()
    })
  })

  describe('재촬영 버튼', () => {
    it('품질이 좋으면 재촬영 버튼이 표시되지 않아야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityGood} />)

      expect(screen.queryByRole('button', { name: /다시 촬영하기/ })).not.toBeInTheDocument()
    })

    it('품질이 나쁘면 재촬영 버튼이 표시되어야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityBad} />)

      expect(screen.getByRole('button', { name: '재촬영하기' })).toBeInTheDocument()
    })

    it('재촬영 버튼 클릭 시 onRetake가 호출되어야 함', async () => {
      const user = userEvent.setup()
      const onRetake = jest.fn()

      render(<ImageQualityFeedback quality={mockQualityBad} onRetake={onRetake} />)

      const button = screen.getByRole('button', { name: '재촬영하기' })
      await user.click(button)

      expect(onRetake).toHaveBeenCalledTimes(1)
    })

    it('onRetake가 없어도 재촬영 버튼이 표시되어야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityBad} />)

      const button = screen.getByRole('button', { name: '재촬영하기' })
      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled() // onRetake가 없으면 disabled
    })
  })

  describe('접근성', () => {
    it('진행률 바에 aria 속성이 있어야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityGood} />)

      const progressBars = screen.getAllByRole('progressbar')
      expect(progressBars.length).toBeGreaterThanOrEqual(3) // 초점, 조명, 각도

      progressBars.forEach((bar) => {
        expect(bar).toHaveAttribute('aria-valuenow')
        expect(bar).toHaveAttribute('aria-valuemin', '0')
        expect(bar).toHaveAttribute('aria-valuemax', '100')
        expect(bar).toHaveAttribute('aria-label')
      })
    })

    it('재촬영 버튼에 aria-label이 있어야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityBad} onRetake={jest.fn()} />)

      const button = screen.getByRole('button', { name: '재촬영하기' })
      expect(button).toHaveAttribute('aria-label', '재촬영하기')
    })
  })

  describe('엣지 케이스', () => {
    it('점수가 0이어도 렌더링되어야 함', () => {
      const quality = {
        overallScore: 0,
        sharpness: 0,
        brightness: 0,
        angle: 0,
        issues: ['모든 항목이 나쁨'],
        recommendations: ['재촬영 필요'],
        isGood: false,
      }

      render(<ImageQualityFeedback quality={quality} />)

      expect(screen.getByText(/재촬영을 권장합니다/)).toBeInTheDocument()
      // 0%는 여러 개 있으므로 getAllByText 사용
      const zeroPercentElements = screen.getAllByText('0%')
      expect(zeroPercentElements.length).toBeGreaterThanOrEqual(1)
    })

    it('점수가 100이어도 렌더링되어야 함', () => {
      const quality = {
        overallScore: 100,
        sharpness: 100,
        brightness: 100,
        angle: 100,
        issues: [],
        recommendations: [],
        isGood: true,
      }

      render(<ImageQualityFeedback quality={quality} />)

      expect(screen.getByText(/완벽해요! 분석에 적합한 사진입니다/)).toBeInTheDocument()
      // 100%는 여러 개 있으므로 getAllByText 사용
      const hundredPercentElements = screen.getAllByText('100%')
      expect(hundredPercentElements.length).toBeGreaterThanOrEqual(1)
    })

    it('문제점과 권장사항이 많아도 모두 표시되어야 함', () => {
      const quality = {
        overallScore: 20,
        sharpness: 10,
        brightness: 15,
        angle: 35,
        issues: ['문제1', '문제2', '문제3', '문제4', '문제5'],
        recommendations: ['권장1', '권장2', '권장3', '권장4', '권장5'],
        isGood: false,
      }

      render(<ImageQualityFeedback quality={quality} />)

      quality.issues.forEach((issue) => {
        expect(screen.getByText(issue)).toBeInTheDocument()
      })

      quality.recommendations.forEach((rec) => {
        expect(screen.getByText(rec)).toBeInTheDocument()
      })
    })

    it('className prop이 전달되면 적용되어야 함', () => {
      const { container } = render(
        <ImageQualityFeedback quality={mockQualityGood} className="custom-class" />
      )

      const card = container.querySelector('.custom-class')
      expect(card).toBeInTheDocument()
    })
  })
})

