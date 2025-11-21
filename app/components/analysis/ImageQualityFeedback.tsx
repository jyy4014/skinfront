/**
 * 이미지 품질 피드백 컴포넌트
 * 실시간으로 이미지 품질을 표시하고 개선 권장사항 제공
 */

'use client'

import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { ImageQualityResult, getQualityMessage } from '@/app/lib/image/quality-check'
import Card from '@/app/components/ui/Card'
import { designTokens } from '@/app/styles/design-tokens'

interface ImageQualityFeedbackProps {
  quality: ImageQualityResult
  onRetake?: () => void
  className?: string
}

export function ImageQualityFeedback({
  quality,
  onRetake,
  className = '',
}: ImageQualityFeedbackProps) {
  const { message, color, icon } = getQualityMessage(quality.overallScore)

  const IconComponent =
    icon === 'check-circle' ? CheckCircle2 : icon === 'alert-circle' ? AlertCircle : XCircle

  // 디자인 토큰 사용
  const colorClasses = {
    green: 'text-[color:var(--color-success-500)] bg-[color:var(--color-success-50)] border-[color:var(--color-success-200)]',
    yellow: 'text-[color:var(--color-warning-500)] bg-[color:var(--color-warning-50)] border-[color:var(--color-warning-200)]',
    red: `text-[color:${designTokens.colors.danger[500]}] bg-[color:var(--color-danger-50)] border-[color:var(--color-danger-200)]`,
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* 전체 점수 및 메시지 */}
        <div className={`flex items-center gap-3 p-3 rounded-[var(--radius-lg)] border-2 ${colorClasses[color]}`}>
          <IconComponent className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">{message}</p>
            <p className="text-xs mt-1">품질 점수: {quality.overallScore}/100</p>
          </div>
        </div>

        {/* 세부 점수 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">초점</p>
            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  quality.sharpness >= 70
                    ? 'bg-green-500'
                    : quality.sharpness >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${quality.sharpness}%` }}
                role="progressbar"
                aria-valuenow={quality.sharpness}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`초점 점수 ${quality.sharpness}퍼센트`}
              />
            </div>
            <p className="text-xs font-medium mt-1">{quality.sharpness}%</p>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">조명</p>
            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  quality.brightness >= 60 && quality.brightness <= 90
                    ? 'bg-green-500'
                    : quality.brightness >= 40 && quality.brightness < 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${quality.brightness}%` }}
                role="progressbar"
                aria-valuenow={quality.brightness}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`조명 점수 ${quality.brightness}퍼센트`}
              />
            </div>
            <p className="text-xs font-medium mt-1">{quality.brightness}%</p>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">각도</p>
            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  quality.angle >= 80
                    ? 'bg-green-500'
                    : quality.angle >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${quality.angle}%` }}
                role="progressbar"
                aria-valuenow={quality.angle}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`각도 점수 ${quality.angle}퍼센트`}
              />
            </div>
            <p className="text-xs font-medium mt-1">{quality.angle}%</p>
          </div>
        </div>

        {/* 문제점 및 권장사항 */}
        {(quality.issues.length > 0 || quality.recommendations.length > 0) && (
          <div className="space-y-2">
            {quality.issues.length > 0 && (
              <div>
                <p className={`text-xs font-semibold text-[color:${designTokens.colors.danger[500]}] mb-1`}>발견된 문제:</p>
                <ul className="text-xs text-[color:var(--color-text-primary)] space-y-1">
                  {quality.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className={`text-[color:${designTokens.colors.danger[500]}]`}>•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {quality.recommendations.length > 0 && (
              <div>
                <p className={`text-xs font-semibold text-[color:${designTokens.colors.primary[500]}] mb-1`}>개선 권장사항:</p>
                <ul className="text-xs text-[color:var(--color-text-primary)] space-y-1">
                  {quality.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className={`text-[color:${designTokens.colors.primary[500]}]`}>•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 재촬영 버튼 (품질이 낮을 때) */}
        {!quality.isGood && (
          <button
            onClick={onRetake}
            className={`w-full px-4 py-2 text-[color:var(--color-on-primary)] rounded-[var(--radius-lg)] transition-colors text-sm font-medium shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elevated)]`}
            style={{ backgroundColor: designTokens.colors.primary[500] }}
            aria-label="재촬영하기"
            disabled={!onRetake}
          >
            다시 촬영하기
          </button>
        )}
      </div>
    </Card>
  )
}

