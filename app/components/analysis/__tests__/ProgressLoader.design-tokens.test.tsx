/**
 * ProgressLoader 디자인 토큰 적용 테스트 (엄격한 TDD)
 */

import { render } from '@testing-library/react'
import AnalysisLoading from '../ProgressLoader'

describe('ProgressLoader - 디자인 토큰 적용 (TDD)', () => {
  describe('디자인 토큰 적용 검증', () => {
    it('배경 그라디언트는 디자인 토큰을 사용해야 함', () => {
      const { container } = render(
        <AnalysisLoading step="피부 질감 분석 중..." />
      )

      const mainContainer = container.firstChild as HTMLElement
      
      // 디자인 토큰 사용 확인
      expect(mainContainer.className).toContain('bg-[color:var(--color-surface-muted)]')
      expect(mainContainer.className).toContain('rounded-[var(--radius-2xl)]')
    })

    it('활성 단계 배경은 디자인 토큰을 사용해야 함', () => {
      const { container } = render(
        <AnalysisLoading step="피부 질감 분석 중..." />
      )

      // 활성 단계 찾기 (첫 번째 단계가 활성)
      const steps = container.querySelectorAll('.flex.items-center.gap-3')
      const activeStep = Array.from(steps).find(step => 
        step.className.includes('bg-[color:var(--color-primary-50)]')
      )
      
      // 디자인 토큰 사용 확인
      expect(activeStep).toBeTruthy()
      expect(activeStep?.className).toContain('bg-[color:var(--color-primary-50)]')
      expect(activeStep?.className).toContain('border-[color:var(--color-primary-200)]')
    })

    it('완료된 단계 배경은 디자인 토큰을 사용해야 함', () => {
      const { container } = render(
        <AnalysisLoading step="색소 분석 중..." />
      )

      // 완료된 단계 찾기 (첫 번째 단계가 완료됨)
      const steps = container.querySelectorAll('.flex.items-center.gap-3')
      const completedStep = Array.from(steps).find(step => 
        step.className.includes('bg-[color:var(--color-success-50)]')
      )
      
      // 디자인 토큰 사용 확인
      expect(completedStep).toBeTruthy()
      expect(completedStep?.className).toContain('bg-[color:var(--color-success-50)]')
    })

    it('단계 인디케이터 색상은 디자인 토큰을 사용해야 함', () => {
      const { container } = render(
        <AnalysisLoading step="피부 질감 분석 중..." />
      )

      // 활성 인디케이터 찾기
      const indicators = container.querySelectorAll('.w-3.h-3.rounded-full')
      const activeIndicator = Array.from(indicators).find(ind => 
        ind.className.includes('bg-[color:var(--color-primary-500)]')
      )
      
      // 디자인 토큰 사용 확인
      expect(activeIndicator).toBeTruthy()
      expect(activeIndicator?.className).toContain('bg-[color:var(--color-primary-500)]')
    })

    it('radius는 디자인 토큰을 사용해야 함', () => {
      const { container } = render(
        <AnalysisLoading step="피부 질감 분석 중..." />
      )

      const mainContainer = container.firstChild as HTMLElement
      
      // 디자인 토큰 사용 확인
      expect(mainContainer.className).toContain('rounded-[var(--radius-2xl)]')
    })
  })
})

