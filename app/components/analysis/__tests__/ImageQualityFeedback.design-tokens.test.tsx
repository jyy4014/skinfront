/**
 * ImageQualityFeedback 디자인 토큰 적용 테스트 (엄격한 TDD)
 * 
 * TDD 순서:
 * 1. Red: 테스트 작성 → 실패 확인
 * 2. Green: 디자인 토큰 적용 → 테스트 통과
 * 3. Refactor: 코드 개선
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageQualityFeedback } from '../ImageQualityFeedback'
import { ImageQualityResult } from '@/app/lib/image'

describe('ImageQualityFeedback - 디자인 토큰 적용 (TDD)', () => {
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
    overallScore: 35, // 40 미만이면 red 색상
    sharpness: 40,
    brightness: 50,
    angle: 45,
    issues: ['조명이 어둡습니다', '초점이 흐릿합니다'],
    recommendations: ['밝은 곳에서 촬영하세요', '카메라를 안정적으로 잡으세요'],
    isGood: false,
  }

  describe('디자인 토큰 적용 검증', () => {
    it('좋은 품질일 때 success 색상은 디자인 토큰을 사용해야 함', () => {
      const { container } = render(
        <ImageQualityFeedback quality={mockQualityGood} />
      )
      
      // Card 내부의 메시지 영역 찾기 (border-2가 있는 div)
      const messageDiv = container.querySelector('.border-2')
      
      expect(messageDiv).toBeInTheDocument()
      // 디자인 토큰 사용 확인
      expect(messageDiv?.className).toContain('text-[color:var(--color-success-500)]')
      expect(messageDiv?.className).toContain('bg-[color:var(--color-success-50)]')
      expect(messageDiv?.className).toContain('border-[color:var(--color-success-200)]')
    })

    it('나쁜 품질일 때 error 색상은 디자인 토큰을 사용해야 함', () => {
      const { container } = render(
        <ImageQualityFeedback quality={mockQualityBad} />
      )
      
      const messageDiv = container.querySelector('.border-2')
      
      expect(messageDiv).toBeInTheDocument()
      // 디자인 토큰 사용 확인
      expect(messageDiv?.className).toContain('text-[color:var(--color-danger-500)]')
      expect(messageDiv?.className).toContain('bg-[color:var(--color-danger-50)]')
      expect(messageDiv?.className).toContain('border-[color:var(--color-danger-200)]')
    })

    it('문제점 텍스트는 디자인 토큰의 danger 색상을 사용해야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityBad} />)
      
      const issueTitle = screen.getByText('발견된 문제:')
      
      // 디자인 토큰 사용 확인
      expect(issueTitle.className).toContain('text-[color:var(--color-danger-500)]')
    })

    it('권장사항 텍스트는 디자인 토큰의 primary 색상을 사용해야 함', () => {
      render(<ImageQualityFeedback quality={mockQualityBad} />)
      
      const recTitle = screen.getByText('개선 권장사항:')
      
      // 디자인 토큰 사용 확인
      expect(recTitle.className).toContain('text-[color:var(--color-primary-500)]')
    })

    it('재촬영 버튼은 디자인 토큰을 사용해야 함', () => {
      const handleRetake = jest.fn()
      const { container } = render(
        <ImageQualityFeedback quality={mockQualityBad} onRetake={handleRetake} />
      )
      
      const retakeButton = screen.getByRole('button', { name: '재촬영하기' })
      
      // 디자인 토큰 사용 확인 (style 속성으로 적용됨)
      expect(retakeButton.style.backgroundColor).toBeTruthy()
      expect(retakeButton.className).toContain('text-[color:var(--color-on-primary)]')
    })

    it('radius는 디자인 토큰을 사용해야 함', () => {
      const { container } = render(
        <ImageQualityFeedback quality={mockQualityGood} />
      )
      
      const messageDiv = container.querySelector('.border-2')
      
      expect(messageDiv).toBeInTheDocument()
      // 디자인 토큰 사용 확인
      expect(messageDiv?.className).toContain('rounded-[var(--radius-lg)]')
    })
  })
})

