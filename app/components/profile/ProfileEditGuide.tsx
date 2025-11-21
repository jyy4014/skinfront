'use client'

import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import { designTokens } from '@/app/styles/design-tokens'
import { calculateProfileCompletion } from '@/app/lib/utils/profileCompletion'

interface ProfileEditGuideProps {
  profile: any
  currentStep?: number
  onStepClick?: (step: number) => void
}

const STEPS = [
  {
    id: 1,
    title: '기본 정보',
    fields: ['name', 'nickname', 'birth_date'],
    description: '이름, 별명, 생년월일을 입력해주세요',
  },
  {
    id: 2,
    title: '연락처',
    fields: ['phone_number', 'country'],
    description: '전화번호와 국적을 선택해주세요',
  },
  {
    id: 3,
    title: '피부 정보',
    fields: ['gender', 'skin_type', 'main_concerns'],
    description: '성별, 피부 타입, 관심사를 선택해주세요',
    link: '/profile/complete',
  },
]

export default function ProfileEditGuide({
  profile,
  currentStep = 1,
  onStepClick,
}: ProfileEditGuideProps) {
  const completion = calculateProfileCompletion(profile)

  const getStepStatus = (step: typeof STEPS[0]) => {
    const completedFields = step.fields.filter((field) => {
      if (field === 'main_concerns') {
        return (
          Array.isArray(profile?.main_concerns) &&
          profile.main_concerns.length > 0
        )
      }
      return profile?.[field] && profile[field].toString().trim() !== ''
    })

    const isComplete = completedFields.length === step.fields.length
    const isPartial = completedFields.length > 0 && !isComplete

    return { isComplete, isPartial, completedCount: completedFields.length }
  }

  return (
    <div className="bg-[color:var(--color-surface-muted)] rounded-[var(--radius-xl)] p-5 mb-6">
      <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)] mb-4">
        프로필 완성 가이드
      </h3>
      <div className="space-y-3">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step)
          const isCurrent = currentStep === step.id

          const content = (
            <div
              className={`
                flex items-center gap-3 p-3 rounded-[var(--radius-lg)] transition-all
                ${
                  isCurrent
                    ? 'bg-[color:var(--color-primary-50)] border-2 border-[color:var(--color-primary-500)]'
                    : 'bg-[color:var(--color-surface)] border border-[color:var(--color-border-subtle)]'
                }
                ${onStepClick ? 'cursor-pointer hover:shadow-[var(--shadow-soft)]' : ''}
              `}
              onClick={() => onStepClick?.(step.id)}
            >
              <div className="flex-shrink-0">
                {status.isComplete ? (
                  <CheckCircle2
                    className="w-6 h-6"
                    style={{ color: designTokens.colors.success[600] }}
                  />
                ) : (
                  <Circle
                    className="w-6 h-6"
                    style={{
                      color: status.isPartial
                        ? designTokens.colors.warning[500]
                        : designTokens.colors.gray[400],
                    }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`font-semibold ${
                      isCurrent
                        ? 'text-[color:var(--color-primary-700)]'
                        : 'text-[color:var(--color-text-primary)]'
                    }`}
                  >
                    {step.title}
                  </span>
                  {status.isPartial && (
                    <span className="text-xs text-[color:var(--color-warning-600)]">
                      ({status.completedCount}/{step.fields.length})
                    </span>
                  )}
                </div>
                <p className="text-xs text-[color:var(--color-text-secondary)]">
                  {step.description}
                </p>
              </div>
              {step.link && (
                <ArrowRight
                  className="w-5 h-5 text-[color:var(--color-text-tertiary)] flex-shrink-0"
                />
              )}
            </div>
          )

          if (step.link) {
            return (
              <a key={step.id} href={step.link}>
                {content}
              </a>
            )
          }

          return <div key={step.id}>{content}</div>
        })}
      </div>

      {/* 전체 완성도 */}
      <div className="mt-4 pt-4 border-t border-[color:var(--color-border-subtle)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[color:var(--color-text-primary)]">
            전체 완성도
          </span>
          <span
            className="text-sm font-bold"
            style={{ color: designTokens.colors.primary[600] }}
          >
            {completion.percentage}%
          </span>
        </div>
        <div className="w-full bg-[color:var(--color-gray-200)] rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${completion.percentage}%`,
              backgroundImage: designTokens.gradients.primary,
            }}
          />
        </div>
      </div>
    </div>
  )
}






