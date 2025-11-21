'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/app/utils/cn'
import { designTokens } from '@/app/styles/design-tokens'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[color:var(--color-text-primary)] mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--color-text-tertiary)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-3 border rounded-[var(--radius-lg)] focus:ring-2 focus:ring-[color:var(--color-primary-500)] focus:border-transparent transition-all',
              icon && 'pl-10',
              error
                ? `border-[color:${designTokens.colors.danger[500]}] focus:ring-[color:${designTokens.colors.danger[500]}]`
                : 'border-[color:var(--color-border-subtle)]',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p
            id={props.id ? `${props.id}-error` : undefined}
            className="mt-1 text-sm text-[color:var(--color-danger-500)]"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input

