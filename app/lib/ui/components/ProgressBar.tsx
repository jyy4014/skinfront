'use client'

import { motion } from 'framer-motion'
import { cn } from '@/app/utils/cn'

export interface ProgressBarProps {
  /**
   * 진행률 (0-100)
   */
  progress: number
  
  /**
   * 진행률 표시 여부
   * @default false
   */
  showLabel?: boolean
  
  /**
   * 색상 변형
   * @default 'pink'
   */
  variant?: 'pink' | 'blue' | 'green' | 'purple'
  
  /**
   * 크기
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  
  /**
   * 애니메이션 사용 여부
   * @default true
   */
  animated?: boolean
  
  /**
   * 추가 클래스명
   */
  className?: string
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

const variantClasses = {
  pink: 'bg-pink-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
}

/**
 * 진행률 표시 바 컴포넌트
 */
export function ProgressBar({
  progress,
  showLabel = false,
  variant = 'pink',
  size = 'md',
  animated = true,
  className,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <div className={cn('w-full', className)} role="progressbar" aria-valuenow={clampedProgress} aria-valuemin={0} aria-valuemax={100}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">진행률</span>
          <span className="text-sm text-gray-600">{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
      >
        {animated ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${clampedProgress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn('h-full rounded-full', variantClasses[variant])}
          />
        ) : (
          <div
            className={cn('h-full rounded-full', variantClasses[variant])}
            style={{ width: `${clampedProgress}%` }}
          />
        )}
      </div>
    </div>
  )
}


