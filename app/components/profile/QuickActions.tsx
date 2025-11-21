'use client'

import Link from 'next/link'
import { Camera, User, History, Settings, Sparkles } from 'lucide-react'
import { designTokens } from '@/app/styles/design-tokens'
import { useUserProfile } from '@/app/lib/data'
import { calculateProfileCompletion } from '@/app/lib/utils/profileCompletion'

export default function QuickActions() {
  const { data: userProfile } = useUserProfile()
  const completion = calculateProfileCompletion(userProfile?.profile)
  const isProfileIncomplete = !completion.isComplete

  const actions = [
    {
      icon: Camera,
      label: '새 분석 시작',
      href: '/analyze',
      primary: true,
      gradient: true,
    },
    {
      icon: User,
      label: isProfileIncomplete ? '프로필 완성' : '프로필 수정',
      href: isProfileIncomplete ? '/profile/complete' : '/profile/edit',
      primary: isProfileIncomplete,
      gradient: isProfileIncomplete,
    },
    {
      icon: History,
      label: '히스토리',
      href: '/history',
      primary: false,
      gradient: false,
    },
    {
      icon: Settings,
      label: '설정',
      href: '/settings',
      primary: false,
      gradient: false,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action, index) => {
        const Icon = action.icon
        const content = (
          <div
            className={`
              flex flex-col items-center justify-center gap-2 p-4 rounded-[var(--radius-xl)]
              transition-all active:scale-95
              ${
                action.primary
                  ? 'text-[color:var(--color-on-primary)]'
                  : 'bg-[color:var(--color-surface)] border border-[color:var(--color-border-subtle)] text-[color:var(--color-text-primary)]'
              }
              ${action.gradient ? 'hover:shadow-[var(--shadow-elevated)]' : 'hover:bg-[color:var(--color-surface-muted)]'}
            `}
            style={
              action.gradient
                ? { backgroundImage: designTokens.gradients.primary }
                : {}
            }
          >
            <Icon className="w-6 h-6" />
            <span className="text-sm font-semibold text-center">{action.label}</span>
          </div>
        )

        return (
          <Link
            key={index}
            href={action.href}
            prefetch={action.href === '/history' ? false : undefined}
          >
            {content}
          </Link>
        )
      })}
    </div>
  )
}



