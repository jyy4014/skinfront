'use client'

import { Inbox, FileQuestion, History, Heart } from 'lucide-react'
import { cn } from '@/app/utils/cn'
import { EMPTY_STATE_MESSAGES } from '../constants'

export interface EmptyStateProps {
  /**
   * 아이콘 타입
   * @default 'default'
   */
  icon?: 'default' | 'file' | 'history' | 'heart'
  
  /**
   * 메시지
   */
  message?: string
  
  /**
   * 설명
   */
  description?: string
  
  /**
   * 액션 버튼
   */
  action?: React.ReactNode
  
  /**
   * 추가 클래스명
   */
  className?: string
}

const iconMap = {
  default: Inbox,
  file: FileQuestion,
  history: History,
  heart: Heart,
}

/**
 * 빈 상태 컴포넌트
 */
export function EmptyState({
  icon = 'default',
  message = EMPTY_STATE_MESSAGES.NO_DATA,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Icon = iconMap[icon]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{message}</h3>
      {description && (
        <p className="text-sm text-gray-600 mb-6 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}




