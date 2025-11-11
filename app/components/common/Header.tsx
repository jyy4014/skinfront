'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface HeaderProps {
  title: string
  showBack?: boolean
  backHref?: string
}

export default function Header({ title, showBack = false, backHref = '/home' }: HeaderProps) {
  return (
    <header 
      className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 safe-area-top border-b border-gray-100"
      role="banner"
    >
      <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
        {showBack && (
          <Link
            href={backHref}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            aria-label="이전 페이지로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" aria-hidden="true" />
          </Link>
        )}
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>
    </header>
  )
}

