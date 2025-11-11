'use client'

import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/app/utils/cn'

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
    default: 'bg-white rounded-2xl shadow-lg',
    elevated: 'bg-white rounded-2xl shadow-xl',
    outlined: 'bg-white rounded-2xl border-2 border-gray-200',
  }
  
  return (
    <div className={cn(variants[variant], className)} {...props}>
      {children}
    </div>
  )
}

