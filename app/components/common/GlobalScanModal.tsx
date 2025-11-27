'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

// 🚀 Dynamic Import: 모달이 열릴 때만 무거운 ARCamera 컴포넌트 로드
const ARCamera = dynamic(() => import('../ARCamera'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#00FFC2] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-sm">카메라 모듈 로딩 중...</p>
      </div>
    </div>
  ),
})

/**
 * 전역 스캔 모달 컴포넌트
 * 모든 페이지에서 스캔 버튼 클릭 시 작동하도록 함
 */
export default function GlobalScanModal() {
  const [isScanOpen, setIsScanOpen] = useState(false)
  const [isAnimationComplete, setIsAnimationComplete] = useState(false) // 애니메이션 완료 상태

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
      return () => {
        document.body.style.overflow = ''
      }
    }

    document.body.style.overflow = ''
    return undefined
  }, [isScanOpen])

  useEffect(() => {
    if (isScanOpen) {
      return
    }

    const frame = window.requestAnimationFrame(() => setIsAnimationComplete(false))
    return () => window.cancelAnimationFrame(frame)
  }, [isScanOpen])

  // 🎬 모달 애니메이션 완료 후 카메라 초기화 (500ms 딜레이)
  useEffect(() => {
    if (isScanOpen) {
      const timer = setTimeout(() => {
        setIsAnimationComplete(true)
      }, 500) // 모달 애니메이션이 완료된 후 카메라 초기화
      return () => clearTimeout(timer)
    }
  }, [isScanOpen])

  return (
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
              <ARCamera 
                className="w-full h-full" 
                onComplete={() => setIsScanOpen(false)}
                isReady={isAnimationComplete} // 애니메이션 완료 후 카메라 초기화
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}


