'use client'

import { ReactNode } from 'react'
import { cn } from '@/app/utils/cn'

export interface FormFieldProps {
  /**
   * 필드 라벨
   */
  label?: string
  
  /**
   * 필드 설명
   */
  description?: string
  
  /**
   * 에러 메시지
   */
  error?: string
  
  /**
   * 필수 여부
   */
  required?: boolean
  
  /**
   * 필드 ID
   */
  id?: string
  
  /**
   * 추가 클래스명
   */
  className?: string
  
  /**
   * 필드 내용
   */
  children: ReactNode
}

/**
 * 폼 필드 래퍼 컴포넌트
 */
export function FormField({
  label,
  description,
  error,
  required = false,
  id,
  className,
  children,
}: FormFieldProps) {
  const fieldId = id || (label ? `field-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      
      <div className={error ? 'has-error' : ''}>
        {children}
      </div>
      
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}



