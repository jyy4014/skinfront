'use client'

import { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { cn } from '@/app/utils/cn'
import { Loader2 } from 'lucide-react'
import { designTokens } from '@/app/styles/design-tokens'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  isLoading?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-[var(--radius-xl)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-accent-200)] focus-visible:ring-offset-[color:var(--color-surface)]'

  const variantStyles: Record<
    NonNullable<ButtonProps['variant']>,
    { className: string; style?: CSSProperties }
  > = {
    primary: {
      className:
        'text-[color:var(--color-on-primary)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elevated)]',
      style: {
        backgroundImage: designTokens.gradients.primary,
      },
    },
    secondary: {
      className:
        'text-[color:var(--color-text-primary)] bg-[color:var(--color-surface-muted)] border border-[color:var(--color-border-subtle)] shadow-[var(--shadow-outline)] hover:shadow-[var(--shadow-soft)]',
    },
    outline: {
      className:
        'text-[color:var(--color-text-primary)] border-2 border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-surface-muted)]',
    },
    ghost: {
      className:
        'text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-muted)]',
    },
    danger: {
      className:
        'text-white shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elevated)]',
      style: {
        backgroundColor: designTokens.colors.danger[500],
      },
    },
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const { className: variantClassName, style: variantStyle } = variantStyles[variant]

  return (
    <button
      className={cn(
        baseStyles,
        variantClassName,
        sizes[size],
        className,
      )}
      disabled={disabled || isLoading}
      style={variantStyle}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}

