'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Gift, Sparkles, Hospital } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RewardAdModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function RewardAdModal({ isOpen, onClose }: RewardAdModalProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  const [canClose, setCanClose] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      // 모달이 닫히면 상태 초기화
      setCountdown(5)
      setCanClose(false)
      return
    }

    // 카운트다운 시작
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanClose(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/95 z-[9999]"
          />

          {/* 모달 컨텐츠 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-center px-4"
          >
            {/* 닫기 버튼 (우측 상단) */}
            <div className="absolute top-4 right-4">
              {canClose ? (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={onClose}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-full text-sm font-medium transition-colors backdrop-blur-sm"
                >
                  <X className="w-4 h-4" />
                  닫고 분석하기
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-2 bg-gray-800/50 text-gray-400 rounded-full text-sm font-medium backdrop-blur-sm cursor-not-allowed"
                >
                  {countdown > 0 ? `${countdown}초 후 리워드 지급...` : '리워드 지급 중...'}
                </motion.div>
              )}
            </div>

            {/* 비디오 영역 (16:9 비율) */}
            <div className="w-full max-w-2xl mb-6">
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl border-2 border-[#00FFC2]/20 flex flex-col items-center justify-center overflow-hidden">
                  {/* 배경 패턴 */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `
                        linear-gradient(45deg, transparent 25%, rgba(0, 255, 194, 0.1) 25%),
                        linear-gradient(-45deg, transparent 25%, rgba(0, 255, 194, 0.1) 25%),
                        linear-gradient(45deg, rgba(0, 255, 194, 0.1) 75%, transparent 75%),
                        linear-gradient(-45deg, rgba(0, 255, 194, 0.1) 75%, transparent 75%)
                      `,
                      backgroundSize: '40px 40px',
                      backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px',
                    }} />
                  </div>

                  {/* 중앙 아이콘 및 텍스트 */}
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="relative z-10 flex flex-col items-center gap-4"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#00FFC2]/20 rounded-full blur-xl" />
                      <Play className="w-16 h-16 text-[#00FFC2] fill-[#00FFC2]/20" strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-white mb-2">광고 영상 재생 중...</p>
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm">리워드를 받기 위해 잠시만 기다려주세요</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* 카운트다운 표시 (비디오 영역 내부 하단) */}
                  {countdown > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full"
                    >
                      <div className="flex items-center gap-2 text-white">
                        <Gift className="w-4 h-4 text-[#00FFC2]" />
                        <span className="text-sm font-medium">{countdown}초 후 리워드 지급...</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* 하단 안내 문구 및 병원 예약 버튼 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-2xl space-y-4"
            >
              {/* 안내 문구 */}
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">
                  광고가 보기 싫으신가요? 병원 상담 예약 시 광고가 평생 제거됩니다!
                </p>
              </div>

              {/* 병원 예약 버튼 */}
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => {
                  router.push('/hospital')
                  onClose()
                }}
                className="w-full py-4 px-6 bg-gradient-to-r from-[#00FFC2] via-[#FFD700] to-[#00FFC2] text-black font-bold rounded-xl shadow-lg shadow-[#00FFC2]/40 hover:shadow-[#00FFC2]/60 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
              >
                <Hospital className="w-6 h-6" />
                <span>🏥 제휴 병원 예약하고 '평생 무제한' 이용권 받기</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

