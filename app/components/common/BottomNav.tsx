'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Camera, User, History } from 'lucide-react'
import { motion } from 'framer-motion'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/home', icon: Home, label: '홈' },
    { href: '/analyze', icon: Camera, label: '분석' },
    { href: '/history', icon: History, label: '히스토리' },
    { href: '/profile', icon: User, label: '프로필' },
  ]

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom"
      role="navigation"
      aria-label="하단 네비게이션"
    >
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href === '/home' && pathname === '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={item.href === '/history' ? false : undefined}
              className="flex flex-col items-center justify-center flex-1 h-full relative focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 rounded-t-lg"
              aria-label={`${item.label} 페이지로 이동`}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-pink-50 rounded-t-2xl"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  aria-hidden="true"
                />
              )}
              <div className={`relative z-10 flex flex-col items-center gap-1 ${isActive ? 'text-pink-600' : 'text-gray-500'}`}>
                <Icon 
                  className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`}
                  aria-hidden="true"
                />
                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

