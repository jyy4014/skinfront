'use client'

import { useMemo } from 'react'
import { designTokens } from '@/app/styles/design-tokens'

interface GreetingHeaderProps {
  displayName?: string | null
}

export default function GreetingHeader({ displayName }: GreetingHeaderProps) {
  const { greeting, emoji } = useMemo(() => {
    const hour = new Date().getHours()
    
    if (hour >= 6 && hour < 12) {
      return { greeting: '좋은 아침이에요', emoji: '☀️' }
    } else if (hour >= 12 && hour < 18) {
      return { greeting: '안녕하세요', emoji: '🌤️' }
    } else if (hour >= 18 && hour < 23) {
      return { greeting: '좋은 저녁이에요', emoji: '🌙' }
    } else {
      return { greeting: '안녕하세요', emoji: '🌃' }
    }
  }, [])

  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  return (
    <div className="space-y-1">
      <h1 className="text-xl font-bold" style={{ color: designTokens.colors.text.primary }}>
        {displayName ? `${greeting}, ${displayName}님! ${emoji}` : '피부 분석'}
      </h1>
      <p className="text-sm" style={{ color: designTokens.colors.text.secondary }}>
        {today}
      </p>
    </div>
  )
}





