'use client'

import { Home, Users, MapPin, User, ScanLine } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { icon: Home, label: '홈', path: '/' },
  { icon: Users, label: '커뮤니티', path: '/community' },
  { icon: null, label: '', path: null }, // 공백 (스캔 버튼 자리)
  { icon: MapPin, label: '지도', path: '/map' },
  { icon: User, label: '마이', path: '/mypage' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40">
      {/* 플로팅 스캔 버튼 (FAB) */}
      <motion.button
        onClick={() => {
          // 전역 이벤트를 발생시켜 page.tsx의 모달을 열기
          window.dispatchEvent(new CustomEvent('scan-button-click'))
        }}
        className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#00FFC2] rounded-full flex items-center justify-center shadow-lg shadow-[#00FFC2]/40 z-10"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <ScanLine className="w-7 h-7 text-black" strokeWidth={2.5} />
      </motion.button>

      {/* 네비게이션 바 */}
      <div className="bg-[#121212]/90 backdrop-blur-lg border-t border-gray-800 px-4 pb-safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item, index) => {
            if (item.icon === null) {
              // 공백 (스캔 버튼 자리)
              return <div key={index} className="w-12 h-12" />
            }

            const Icon = item.icon
            const isActive = pathname === item.path

            return (
              <Link
                key={index}
                href={item.path || '#'}
                className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0"
              >
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gray-800/50 text-[#00FFC2]'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] transition-colors ${
                    isActive ? 'text-[#00FFC2]' : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

