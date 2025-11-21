'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { ProgressBar } from '@/app/lib/ui'
import { designTokens } from '@/app/styles/design-tokens'

interface AnalysisLoadingProps {
  step: string
  progress?: number
  stage?: 'upload' | 'analyze' | 'save' | 'complete' | 'retry'
  estimatedTime?: number // 예상 남은 시간 (초)
  retryAttempt?: number // 현재 재시도 횟수
  maxRetries?: number // 최대 재시도 횟수
}

const steps = [
  { 
    key: '피부 질감 분석 중...', 
    message: 'AI가 당신의 피부를 분석 중입니다…', 
    detail: '모공 구조, 색소 침착, 피지 균형을 확인하고 있어요.',
    stepNumber: 1,
    stepName: 'Step 1: 피부 질감 분석 중'
  },
  { 
    key: '색소 분석 중...', 
    message: '색소 분석 중입니다…', 
    detail: '피부톤 균일도와 색소 침착 패턴을 분석하고 있어요.',
    stepNumber: 2,
    stepName: 'Step 2: 색소 분석'
  },
  { 
    key: '트러블 예측 중...', 
    message: '트러블 예측 중입니다…', 
    detail: '여드름과 홍조 패턴을 확인하고 있어요.',
    stepNumber: 3,
    stepName: 'Step 3: 트러블 예측'
  },
]

export default function AnalysisLoading({ 
  step, 
  progress: externalProgress, 
  stage,
  estimatedTime,
  retryAttempt,
  maxRetries,
}: AnalysisLoadingProps) {
  const currentStepIndex = steps.findIndex(s => step.includes(s.key))
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : steps[0]
  
  // 외부에서 전달된 progress가 있으면 사용, 없으면 단계 기반 계산
  const progress = externalProgress !== undefined 
    ? externalProgress 
    : ((currentStepIndex + 1) / steps.length) * 100
  
  // stage에 따른 메시지 매핑
  const getStageMessage = () => {
    if (stage === 'upload') {
      return { message: '이미지 업로드 중...', detail: '사진을 안전하게 업로드하고 있어요.' }
    } else if (stage === 'retry') {
      return { 
        message: `재시도 중... (${retryAttempt || 0}/${maxRetries || 3})`, 
        detail: '일시적인 오류가 발생했습니다. 자동으로 재시도하고 있어요.' 
      }
    } else if (stage === 'analyze') {
      return { message: currentStep.message, detail: currentStep.detail }
    } else if (stage === 'save') {
      return { message: '결과 저장 중...', detail: '분석 결과를 저장하고 있어요.' }
    } else if (stage === 'complete') {
      return { message: '분석 완료!', detail: '결과를 준비하고 있어요.' }
    }
    return { message: currentStep.message, detail: currentStep.detail }
  }
  
  const stageInfo = getStageMessage()

  return (
    <div 
      className={`min-h-[60vh] flex flex-col items-center justify-center bg-[color:var(--color-surface-muted)] rounded-[var(--radius-2xl)] p-8`}
      role="status"
      aria-live="polite"
      aria-label="AI 분석 진행 중"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-6 w-full"
      >
        {/* 로딩 애니메이션 - 얼굴 outline 점점 선명하게 완성되는 라인 드로잉 */}
        <div className="relative w-40 h-40 mx-auto" aria-hidden="true">
          {/* 얼굴 윤곽 - 점점 선명하게 */}
          <motion.svg
            width="160"
            height="160"
            viewBox="0 0 160 160"
            className="absolute inset-0"
            aria-hidden="true"
          >
            {/* 얼굴 윤곽 (타원형) */}
            <motion.ellipse
              cx="80"
              cy="80"
              rx="50"
              ry="65"
              fill="none"
              stroke="var(--color-primary-500)"
              strokeWidth="3"
              strokeDasharray="314"
              initial={{ strokeDashoffset: 314, opacity: 0 }}
              animate={{ 
                strokeDashoffset: [314, 157, 0],
                opacity: [0, 0.5, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* 눈 (왼쪽) */}
            <motion.ellipse
              cx="65"
              cy="70"
              rx="8"
              ry="5"
              fill="none"
              stroke="var(--color-primary-500)"
              strokeWidth="2"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1] }}
              transition={{ delay: 0.5, duration: 1 }}
            />
            {/* 눈 (오른쪽) */}
            <motion.ellipse
              cx="95"
              cy="70"
              rx="8"
              ry="5"
              fill="none"
              stroke="var(--color-primary-500)"
              strokeWidth="2"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1] }}
              transition={{ delay: 0.5, duration: 1 }}
            />
            {/* 입 */}
            <motion.path
              d="M 60 100 Q 80 110 100 100"
              fill="none"
              stroke="var(--color-primary-500)"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1], opacity: [0, 1] }}
              transition={{ delay: 1, duration: 1 }}
            />
          </motion.svg>
          
          {/* 중앙 아이콘 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className={`w-12 h-12 text-[color:var(--color-primary-500)]`} aria-hidden="true" />
            </motion.div>
          </div>
        </div>

        {/* 진행 단계 표시 */}
        <div className="space-y-3">
          <h3 className={`text-xl font-bold text-[color:var(--color-text-primary)]`} aria-live="polite">
            {stageInfo.message}
          </h3>
          <p className={`text-sm text-[color:var(--color-text-secondary)] leading-relaxed`}>
            {stageInfo.detail}
          </p>
          {estimatedTime !== undefined && estimatedTime > 0 && (
            <p className={`text-xs text-[color:var(--color-text-tertiary)]`} role="status">
              예상 남은 시간: 약 {Math.ceil(estimatedTime)}초
            </p>
          )}
        </div>

        {/* 진행률 바 */}
        <div className="w-full max-w-xs">
          <ProgressBar 
            progress={progress} 
            showLabel={true}
            variant="pink"
            size="lg"
            animated={true}
          />
        </div>

        {/* 단계별 진행률 - 문장형 단계 */}
        <div className="space-y-3 w-full max-w-xs">
          {steps.map((s, idx) => {
            const isActive = idx === currentStepIndex
            const isCompleted = idx < currentStepIndex
            
            return (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-[var(--radius-lg)] transition-all ${
                  isActive ? `bg-[color:var(--color-primary-50)] border-2 border-[color:var(--color-primary-200)]` : 
                  isCompleted ? `bg-[color:var(--color-success-50)]` : `bg-[color:var(--color-gray-50)]`
                }`}
              >
                <div className={`w-3 h-3 rounded-full transition-all ${
                  isCompleted ? `bg-[color:var(--color-success-500)]` : 
                  isActive ? `bg-[color:var(--color-primary-500)] animate-pulse` : `bg-[color:var(--color-gray-300)]`
                }`} />
                <span className={`text-sm transition-colors ${
                  isActive ? `text-[color:var(--color-text-primary)] font-semibold` : 
                  isCompleted ? `text-[color:var(--color-text-secondary)] line-through` : `text-[color:var(--color-text-tertiary)]`
                }`}>
                  {s.stepName}
                </span>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

