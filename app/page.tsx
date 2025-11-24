'use client'

import { useState, useEffect } from 'react'
import { Bell, History, MapPin, BookOpen, Gift, ChevronRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ARCamera from '@/app/components/ARCamera'

// 원형 프로그레스 바 컴포넌트
function DonutChart({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = (score: number) => {
    if (score >= 80) return '#10b981' // green-500
    if (score >= 60) return '#3b82f6' // blue-500
    if (score >= 40) return '#f59e0b' // amber-500
    return '#ef4444' // red-500
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth="12"
          fill="none"
        />
        {/* 진행 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* 중앙 점수 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-white">{score}</div>
          <div className="text-xs text-gray-400">점</div>
        </div>
      </div>
    </div>
  )
}

// 퀵 메뉴 아이템
const quickMenuItems = [
  { icon: History, label: '내 기록', color: 'from-blue-500 to-cyan-500' },
  { icon: MapPin, label: '병원 찾기', color: 'from-green-500 to-emerald-500' },
  { icon: BookOpen, label: '성분 사전', color: 'from-purple-500 to-pink-500' },
  { icon: Gift, label: '이벤트', color: 'from-orange-500 to-red-500' },
]

// 추천 시술 데이터 (예시)
const recommendedTreatments = [
  {
    id: 1,
    name: 'IPL 레이저',
    price: '150,000원',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=300&fit=crop',
  },
  {
    id: 2,
    name: '프락셀 레이저',
    price: '200,000원',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop',
  },
  {
    id: 3,
    name: '토닝 레이저',
    price: '120,000원',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=300&fit=crop',
  },
  {
    id: 4,
    name: '리쥬란',
    price: '300,000원',
    image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=300&h=300&fit=crop',
  },
]

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0)
  const [isScanOpen, setIsScanOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 스캔 버튼 클릭 핸들러 (BottomNav에서 호출할 수 있도록 전역 이벤트 사용)
  useEffect(() => {
    const handleScanClick = () => {
      setIsScanOpen(true)
    }

    window.addEventListener('scan-button-click', handleScanClick)
    return () => window.removeEventListener('scan-button-click', handleScanClick)
  }, [])

  // 모달이 열려 있을 때 body 스크롤 막기
  useEffect(() => {
    if (isScanOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isScanOpen])

  const userName = '회원'
  const skinScore = 85
  const encouragementMessages = [
    '수분 관리가 아주 잘 되고 있어요! 💧',
    '피부톤이 균일하고 건강해 보여요! ✨',
    '모공 관리가 완벽합니다! 🌟',
    '탄력이 뛰어난 피부예요! 💪',
  ]
  const encouragementMessage = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)]

  return (
    <div className="min-h-screen pb-28">
      {/* 
        하단 여백 (pb-28 = 112px):
        - 하단 네비게이션 바 높이: ~64px
        - 플로팅 스캔 버튼 높이: ~64px (위로 올라와 있음)
        - 추가 안전 여백: ~16px
        총 ~112px 여백으로 스크롤 끝까지 내렸을 때 콘텐츠가 가려지지 않도록 함
      */}
      {/* Sticky Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrollY > 10
            ? 'bg-gray-900/80 backdrop-blur-md border-b border-gray-800'
            : 'bg-transparent'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-white">Derma AI</h1>
          <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
            <Bell className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="px-4 pt-6">
        <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700/50">
          <div className="text-center mb-4">
            <p className="text-gray-400 text-sm mb-2">{userName}님의 피부 점수</p>
            <div className="flex justify-center mb-4">
              <DonutChart score={skinScore} />
            </div>
            <p className="text-white text-base font-medium">{encouragementMessage}</p>
          </div>
        </div>
      </div>

      {/* Quick Menu */}
      <div className="px-4 mt-6">
        <div className="grid grid-cols-4 gap-4">
          {quickMenuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={index}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors border border-gray-700/50"
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-gray-300">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Recommended Treatments */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{userName}님을 위한 맞춤 시술</h2>
          <button className="text-sm text-gray-400 flex items-center gap-1">
            전체보기
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4" style={{ width: 'max-content' }}>
            {recommendedTreatments.map((treatment) => (
              <div
                key={treatment.id}
                className="flex-shrink-0 w-48 rounded-xl overflow-hidden bg-gray-800/50 border border-gray-700/50"
              >
                {/* 
                  TODO: 이미지 교체 필요
                  현재: 플레이스홀더로 별 모양 아이콘(✨) 사용
                  향후: 실제 시술 사진으로 교체
                    - 피부과 레이저 기기 사진
                    - 시술 모델/전후 사진
                    - 시술 관련 전문 이미지
                  예시: <img src={treatment.image} alt={treatment.name} className="w-full h-full object-cover" />
                */}
                <div className="w-48 h-32 bg-gray-700 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-4xl">✨</div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-white font-semibold text-sm mb-1">{treatment.name}</h3>
                  <p className="text-gray-400 text-xs">{treatment.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 스캔 모달 */}
      <AnimatePresence>
        {isScanOpen && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black z-[9999]"
              onClick={() => setIsScanOpen(false)}
            />

            {/* 모달 컨텐츠 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[9999] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm flex-shrink-0">
                <h2 className="text-lg font-bold text-white">피부 스캔</h2>
                <button
                  onClick={() => setIsScanOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* AR Camera */}
              <div className="flex-1 relative overflow-hidden bg-gray-900">
                <ARCamera className="w-full h-full" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
