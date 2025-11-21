'use client'

import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/app/utils/cn'
import { designTokens } from '@/app/styles/design-tokens'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'outlined'
}

export default function Card({ 
  children, 
  variant = 'default',
  className,
  ...props 
}: CardProps) {
  const variants = {
    default: cn(
      `bg-[color:${designTokens.colors.surface.elevated}]`,
      'rounded-[var(--radius-2xl)]',
      'shadow-[var(--shadow-soft)]',
      `border border-[color:${designTokens.colors.border.subtle}]`
    ),
    elevated: cn(
      `bg-[color:${designTokens.colors.surface.elevated}]`,
      'rounded-[var(--radius-2xl)]',
      'shadow-[var(--shadow-elevated)]'
    ),
    outlined: cn(
      `bg-[color:${designTokens.colors.surface.base}]`,
      'rounded-[var(--radius-2xl)]',
      `border-2 border-[color:${designTokens.colors.border.strong}]`
    ),
  }
  
  return (
    <div className={cn(variants[variant], className)} {...props}>
      {children}
    </div>
  )
}

