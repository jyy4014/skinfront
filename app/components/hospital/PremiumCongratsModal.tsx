'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Crown, X } from 'lucide-react'

interface PremiumCongratsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PremiumCongratsModal({ isOpen, onClose }: PremiumCongratsModalProps) {
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
            className="fixed inset-0 bg-black/80 z-[10001] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 모달 컨텐츠 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[10002] flex items-center justify-center px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-md bg-gradient-to-br from-[#121212] via-[#1a1a1a] to-[#121212] rounded-3xl border-2 border-[#00FFC2]/30 shadow-2xl overflow-hidden">
              {/* 닫기 버튼 */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-800/50 transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {/* 컨텐츠 */}
              <div className="p-8 text-center">
                {/* 축하 아이콘 */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="relative mb-6 flex justify-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#00FFC2]/20 rounded-full blur-2xl animate-pulse" />
                    <div className="relative bg-gradient-to-br from-[#00FFC2] to-[#FFD700] p-6 rounded-full">
                      <Crown className="w-12 h-12 text-black" fill="currentColor" />
                    </div>
                  </div>
                </motion.div>

                {/* 제목 */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-3"
                >
                  🎉 축하합니다!
                </motion.h2>

                {/* 설명 */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-300 text-lg mb-6 leading-relaxed"
                >
                  병원 예약 혜택으로 <span className="text-[#00FFC2] font-bold">'Premium'</span> 등급이 되었습니다.
                  <br />
                  이제 <span className="text-[#FFD700] font-semibold">광고 없이 무제한 분석</span>이 가능합니다!
                </motion.p>

                {/* 혜택 리스트 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3 mb-6"
                >
                  <div className="flex items-center gap-3 text-left bg-gray-800/50 rounded-lg p-3">
                    <Sparkles className="w-5 h-5 text-[#00FFC2] flex-shrink-0" />
                    <span className="text-gray-200 text-sm">광고 없이 무제한 피부 분석</span>
                  </div>
                  <div className="flex items-center gap-3 text-left bg-gray-800/50 rounded-lg p-3">
                    <Sparkles className="w-5 h-5 text-[#00FFC2] flex-shrink-0" />
                    <span className="text-gray-200 text-sm">평생 무료 이용권</span>
                  </div>
                  <div className="flex items-center gap-3 text-left bg-gray-800/50 rounded-lg p-3">
                    <Sparkles className="w-5 h-5 text-[#00FFC2] flex-shrink-0" />
                    <span className="text-gray-200 text-sm">우선 고객 지원</span>
                  </div>
                </motion.div>

                {/* 확인 버튼 */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={onClose}
                  className="w-full py-4 bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] text-black font-bold rounded-xl hover:from-[#00E6B8] hover:to-[#00D4A3] transition-all shadow-lg shadow-[#00FFC2]/40 active:scale-[0.98]"
                >
                  확인
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}



