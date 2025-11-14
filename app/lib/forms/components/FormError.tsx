'use client'

import { ErrorMessage } from '@/app/lib/ui'
import { cn } from '@/app/utils/cn'

export interface FormErrorProps {
  /**
   * 에러 메시지
   */
  error?: string | null
  
  /**
   * 크기
   * @default 'sm'
   */
  size?: 'sm' | 'md' | 'lg'
  
  /**
   * 추가 클래스명
   */
  className?: string
}

/**
 * 폼 에러 표시 컴포넌트
 */
export function FormError({ error, size = 'sm', className }: FormErrorProps) {
  if (!error) return null

  return (
    <div className={cn('mb-4', className)}>
      <ErrorMessage error={error} size={size} />
    </div>
  )
}



