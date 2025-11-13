'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/app/utils/cn'

export interface LoadingSpinnerProps {
  /**
   * 스피너 크기
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  
  /**
   * 로딩 메시지
   */
  message?: string
  
  /**
   * 전체 화면 로딩 여부
   * @default false
   */
  fullScreen?: boolean
  
  /**
   * 추가 클래스명
   */
  className?: string
  
  /**
   * 접근성 라벨
   */
  'aria-label'?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

/**
 * 통일된 로딩 스피너 컴포넌트
 */
export function LoadingSpinner({
  size = 'md',
  message,
  fullScreen = false,
  className,
  'aria-label': ariaLabel = '로딩 중',
}: LoadingSpinnerProps) {
  const spinner = (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn('flex flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <Loader2 className={cn('text-pink-500', sizeClasses[size])} aria-hidden="true" />
      </motion.div>
      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </motion.div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}


