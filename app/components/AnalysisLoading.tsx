'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanLine, Activity, Scan } from 'lucide-react'

interface AnalysisLoadingProps {
  isVisible?: boolean
  remainingCount?: number // 다음 광고까지 남은 횟수
}

const loadingMessages = [
  '🔍 얼굴 랜드마크를 스캔하고 있어요...',
  '🧬 피부 톤과 색소 침착을 분석 중입니다...',
  '📏 모공 깊이와 주름을 측정 중입니다...',
  '👨‍⚕️ 피부과 전문의 데이터와 대조 중입니다...',
  '✨ 맞춤 시술 솔루션을 생성하고 있어요...',
]

export default function AnalysisLoading({ isVisible = true, remainingCount }: AnalysisLoadingProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  // 메시지 순환 (1.2초마다 변경)
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 1200)

    return () => clearInterval(interval)
  }, [isVisible])

  // 프로그레스 바 (5초 동안 0%에서 100%)
  useEffect(() => {
    if (!isVisible) {
      setProgress(0)
      return
    }

    const duration = 5000 // 5초
    const steps = 100
    const interval = duration / steps

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          return 100
        }
        return prev + 1
      })
    }, interval)

    return () => clearInterval(timer)
  }, [isVisible])

  // 다음 광고까지 남은 횟수 계산
  const getRemainingCount = () => {
    if (remainingCount !== undefined) {
      return remainingCount
    }
    try {
      const analysisCount = parseInt(localStorage.getItem('analysis_count') || '0', 10)
      const nextAdAt = Math.ceil((analysisCount + 1) / 3) * 3
      return Math.max(0, nextAdAt - analysisCount - 1)
    } catch {
      return undefined
    }
  }

  const remaining = getRemainingCount()

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center"
    >
      {/* 남은 횟수 뱃지 (우측 상단) */}
      {remaining !== undefined && remaining > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute top-4 right-4 px-3 py-1.5 bg-[#00FFC2]/20 backdrop-blur-sm border border-[#00FFC2]/30 rounded-full z-10"
        >
          <p className="text-xs text-[#00FFC2] font-medium">
            다음 광고까지 {remaining}회 남음
          </p>
        </motion.div>
      )}

      {/* 중앙 스캐너 영역 */}
      <div className="relative w-80 h-80 flex items-center justify-center mb-8">
        {/* 레이더 원형 배경 (3개 원) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-0 border-2 border-[#00FFC2]/20 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-6 border-2 border-[#00FFC2]/30 rounded-full"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-12 border-2 border-[#00FFC2]/40 rounded-full"
        />

        {/* 얼굴 실루엣 (SVG) */}
        <motion.svg
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative z-10 w-32 h-32"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 얼굴 윤곽 */}
          <motion.ellipse
            cx="50"
            cy="50"
            rx="35"
            ry="42"
            stroke="#00FFC2"
            strokeWidth="2"
            fill="none"
            opacity={0.6}
          />
          {/* 왼쪽 눈 */}
          <motion.ellipse
            cx="38"
            cy="45"
            rx="4"
            ry="5"
            stroke="#00FFC2"
            strokeWidth="1.5"
            fill="none"
            opacity={0.8}
          />
          {/* 오른쪽 눈 */}
          <motion.ellipse
            cx="62"
            cy="45"
            rx="4"
            ry="5"
            stroke="#00FFC2"
            strokeWidth="1.5"
            fill="none"
            opacity={0.8}
          />
          {/* 코 */}
          <motion.path
            d="M50 50 L48 58 L50 60 L52 58 Z"
            stroke="#00FFC2"
            strokeWidth="1.5"
            fill="none"
            opacity={0.6}
          />
          {/* 입 */}
          <motion.path
            d="M42 65 Q50 68 58 65"
            stroke="#00FFC2"
            strokeWidth="1.5"
            fill="none"
            opacity={0.6}
          />
        </motion.svg>

        {/* 스캔 레이저 선 (위아래 왕복) */}
        <motion.div
          animate={{
            y: [-160, 160, -160],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00FFC2] to-transparent z-20"
          style={{
            boxShadow: '0 0 20px rgba(0, 255, 194, 0.8), 0 0 40px rgba(0, 255, 194, 0.4)',
          }}
        />

        {/* 추가 스캔 라인 (좌우 왕복) */}
        <motion.div
          animate={{
            x: [-160, 160, -160],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
          className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#00FFC2]/60 to-transparent z-20"
          style={{
            boxShadow: '0 0 15px rgba(0, 255, 194, 0.6)',
          }}
        />
      </div>

      {/* 상태 메시지 (페이드 인/아웃) */}
      <div className="h-12 mb-12 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-lg text-white font-medium text-center px-4"
          >
            {loadingMessages[currentMessageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* 프로그레스 바 */}
      <div className="absolute bottom-20 left-0 right-0 px-8">
        <div className="max-w-md mx-auto">
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: 'linear' }}
              className="h-full bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] rounded-full"
              style={{
                boxShadow: '0 0 10px rgba(0, 255, 194, 0.6)',
              }}
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-400 text-center mt-2"
          >
            {progress}%
          </motion.p>
        </div>
      </div>
    </motion.div>
  )
}

