/**
 * ProgressLoader 컴포넌트 테스트
 * TDD 기반 테스트 작성
 */

import { render, screen } from '@testing-library/react'
import ProgressLoader from '../ProgressLoader'

describe('ProgressLoader', () => {
  describe('기본 렌더링', () => {
    it('기본 메시지와 함께 렌더링되어야 함', () => {
      render(<ProgressLoader step="피부 질감 분석 중..." />)
      
      expect(screen.getByText(/AI가 당신의 피부를 분석 중입니다/)).toBeInTheDocument()
      expect(screen.getByText(/모공 구조, 색소 침착, 피지 균형을 확인하고 있어요/)).toBeInTheDocument()
    })

    it('진행률 바가 표시되어야 함', () => {
      render(<ProgressLoader step="피부 질감 분석 중..." />)
      
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toBeInTheDocument()
    })

    it('단계별 진행 상태가 표시되어야 함', () => {
      render(<ProgressLoader step="피부 질감 분석 중..." />)
      
      expect(screen.getByText(/Step 1: 피부 질감 분석 중/)).toBeInTheDocument()
      expect(screen.getByText(/Step 2: 색소 분석/)).toBeInTheDocument()
      expect(screen.getByText(/Step 3: 트러블 예측/)).toBeInTheDocument()
    })
  })

  describe('진행도 표시', () => {
    it('외부에서 전달된 progress 값을 사용해야 함', () => {
      render(
        <ProgressLoader 
          step="이미지 업로드 중..." 
          progress={50}
          stage="upload"
        />
      )
      
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '50')
    })

    it('progress가 없으면 단계 기반으로 계산해야 함', () => {
      render(<ProgressLoader step="색소 분석 중..." />)
      
      // Step 2이므로 약 66% 정도
      const progressbar = screen.getByRole('progressbar')
      const progressValue = progressbar.getAttribute('aria-valuenow')
      expect(parseInt(progressValue || '0')).toBeGreaterThan(50)
    })

    it('진행률 레이블이 표시되어야 함', () => {
      render(
        <ProgressLoader 
          step="이미지 업로드 중..." 
          progress={75}
        />
      )
      
      expect(screen.getByText(/75%/)).toBeInTheDocument()
    })
  })

  describe('단계별 메시지', () => {
    it('upload 단계일 때 올바른 메시지를 표시해야 함', () => {
      render(
        <ProgressLoader 
          step="이미지 업로드 중..." 
          stage="upload"
          progress={30}
        />
      )
      
      expect(screen.getByText(/이미지 업로드 중/)).toBeInTheDocument()
      expect(screen.getByText(/사진을 안전하게 업로드하고 있어요/)).toBeInTheDocument()
    })

    it('analyze 단계일 때 올바른 메시지를 표시해야 함', () => {
      render(
        <ProgressLoader 
          step="피부 질감 분석 중..." 
          stage="analyze"
          progress={60}
        />
      )
      
      expect(screen.getByText(/AI가 당신의 피부를 분석 중입니다/)).toBeInTheDocument()
    })

    it('save 단계일 때 올바른 메시지를 표시해야 함', () => {
      render(
        <ProgressLoader 
          step="결과 저장 중..." 
          stage="save"
          progress={95}
        />
      )
      
      expect(screen.getByText(/결과 저장 중/)).toBeInTheDocument()
      expect(screen.getByText(/분석 결과를 저장하고 있어요/)).toBeInTheDocument()
    })

    it('complete 단계일 때 올바른 메시지를 표시해야 함', () => {
      render(
        <ProgressLoader 
          step="분석 완료!" 
          stage="complete"
          progress={100}
        />
      )
      
      expect(screen.getByText(/분석 완료!/)).toBeInTheDocument()
      expect(screen.getByText(/결과를 준비하고 있어요/)).toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('role="status"와 aria-live 속성이 있어야 함', () => {
      const { container } = render(<ProgressLoader step="피부 질감 분석 중..." />)
      
      const statusElement = container.querySelector('[role="status"]')
      expect(statusElement).toBeInTheDocument()
      expect(statusElement).toHaveAttribute('aria-live', 'polite')
    })

    it('progressbar에 올바른 aria 속성이 있어야 함', () => {
      render(<ProgressLoader step="피부 질감 분석 중..." progress={50} />)
      
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow')
      expect(progressbar).toHaveAttribute('aria-valuemin', '0')
      expect(progressbar).toHaveAttribute('aria-valuemax', '100')
    })
  })

  describe('단계별 상태 표시', () => {
    it('현재 단계는 활성화 상태로 표시되어야 함', () => {
      render(<ProgressLoader step="색소 분석 중..." />)
      
      // Step 2가 활성화되어야 함
      const activeStep = screen.getByText(/Step 2: 색소 분석/)
      expect(activeStep).toBeInTheDocument()
      expect(activeStep.closest('.bg-pink-50')).toBeInTheDocument()
    })

    it('완료된 단계는 완료 상태로 표시되어야 함', () => {
      render(<ProgressLoader step="트러블 예측 중..." />)
      
      // Step 1, 2는 완료 상태
      const completedStep1 = screen.getByText(/Step 1: 피부 질감 분석 중/)
      expect(completedStep1.closest('.bg-green-50')).toBeInTheDocument()
    })
  })
})

