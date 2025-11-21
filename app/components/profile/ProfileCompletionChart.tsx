'use client'

import { useMemo } from 'react'
import { calculateProfileCompletion } from '@/app/lib/utils/profileCompletion'
import { designTokens } from '@/app/styles/design-tokens'
import { CheckCircle2, Circle } from 'lucide-react'

interface ProfileCompletionChartProps {
  profile: any
  size?: number
  showDetails?: boolean
}

export default function ProfileCompletionChart({
  profile,
  size = 120,
  showDetails = false,
}: ProfileCompletionChartProps) {
  const completion = useMemo(
    () => calculateProfileCompletion(profile),
    [profile]
  )

  const percentage = completion.percentage
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const getColor = (pct: number) => {
    if (pct >= 80) return designTokens.colors.success[600]
    if (pct >= 60) return designTokens.colors.warning[600]
    if (pct >= 40) return designTokens.colors.warning[500]
    return designTokens.colors.danger[500]
  }

  const fieldLabels: Record<string, string> = {
    nickname: '별명',
    birth_date: '생년월일',
    gender: '성별',
    skin_type: '피부 타입',
    main_concerns: '관심사',
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 원형 차트 */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* 배경 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={designTokens.colors.gray[200]}
            strokeWidth="8"
          />
          {/* 진행 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor(percentage)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            }}
          />
        </svg>
        {/* 중앙 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold"
            style={{ color: getColor(percentage) }}
          >
            {percentage}%
          </span>
          <span className={`text-xs text-[color:var(--color-text-tertiary)] mt-1`}>
            완성도
          </span>
        </div>
      </div>

      {/* 상세 정보 */}
      {showDetails && (
        <div className="w-full space-y-2">
          <div className="text-sm font-semibold text-[color:var(--color-text-primary)] mb-3">
            완성된 항목
          </div>
          {completion.completedFields.length > 0 ? (
            <div className="space-y-2">
              {completion.completedFields.map((field) => (
                <div
                  key={field}
                  className="flex items-center gap-2 text-sm"
                >
                  <CheckCircle2
                    className="w-4 h-4"
                    style={{ color: designTokens.colors.success[600] }}
                  />
                  <span className="text-[color:var(--color-text-secondary)]">
                    {fieldLabels[field] || field}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text-tertiary)]">
              완성된 항목이 없습니다
            </p>
          )}

          {completion.missingFields.length > 0 && (
            <>
              <div className="text-sm font-semibold text-[color:var(--color-text-primary)] mt-4 mb-3">
                미완성 항목
              </div>
              <div className="space-y-2">
                {completion.missingFields.map((field) => (
                  <div
                    key={field}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Circle
                      className="w-4 h-4"
                      style={{ color: designTokens.colors.gray[400] }}
                    />
                    <span className="text-[color:var(--color-text-tertiary)]">
                      {fieldLabels[field] || field}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}






