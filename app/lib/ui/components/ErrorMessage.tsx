'use client'

import { AlertCircle, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/app/utils/cn'
import { classifyError, ErrorType } from '@/app/lib/error'

export interface ErrorMessageProps {
  /**
   * 에러 객체 또는 메시지 문자열
   */
  error: Error | string | unknown
  
  /**
   * 에러 타입에 따른 자동 스타일링 사용 여부
   * @default true
   */
  autoStyle?: boolean
  
  /**
   * 닫기 버튼 표시 여부
   * @default false
   */
  dismissible?: boolean
  
  /**
   * 닫기 콜백
   */
  onDismiss?: () => void
  
  /**
   * 추가 클래스명
   */
  className?: string
  
  /**
   * 크기
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'p-2 text-xs',
  md: 'p-3 text-sm',
  lg: 'p-4 text-base',
}

/**
 * 통일된 에러 메시지 컴포넌트
 */
export function ErrorMessage({
  error,
  autoStyle = true,
  dismissible = false,
  onDismiss,
  className,
  size = 'md',
}: ErrorMessageProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  // 에러 분류
  const classified = autoStyle && error instanceof Error
    ? classifyError(error)
    : null

  // 에러 메시지 추출
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : '오류가 발생했습니다.'

  // 자동 스타일링
  const bgColor = classified?.type === ErrorType.NETWORK
    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
    : classified?.type === ErrorType.VALIDATION
    ? 'bg-blue-50 border-blue-200 text-blue-800'
    : 'bg-red-50 border-red-200 text-red-800'

  const iconColor = classified?.type === ErrorType.NETWORK
    ? 'text-yellow-600'
    : classified?.type === ErrorType.VALIDATION
    ? 'text-blue-600'
    : 'text-red-600'

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  return (
    <div
      className={cn(
        'border rounded-lg flex items-start gap-3',
        sizeClasses[size],
        autoStyle ? bgColor : 'bg-gray-50 border-gray-200 text-gray-800',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle
        className={cn('flex-shrink-0 mt-0.5', iconColor || 'text-gray-600')}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium">{message}</p>
        {classified?.retryable && (
          <p className="mt-1 text-xs opacity-90">
            잠시 후 다시 시도해주세요.
          </p>
        )}
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
          aria-label="에러 메시지 닫기"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}




