'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { analyzeWithGemini, AnalysisProgress } from '@/lib/skinAnalysisApi'
import { RealSkinAnalysisResult } from '@/app/utils/realSkinAnalysis'

interface RealTimeAnalysisProps {
  imageBase64: string
  userId?: string
  onComplete: (result: RealSkinAnalysisResult) => void
  onError: (error: Error) => void
}

export default function RealTimeAnalysis({
  imageBase64,
  userId,
  onComplete,
  onError
}: RealTimeAnalysisProps) {
  const [progress, setProgress] = useState<AnalysisProgress>({
    stage: 'connecting',
    progress: 0,
    message: '분석 준비 중...',
    timestamp: Date.now()
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const hasStartedRef = useRef(false)

  // 분석 시작
  const startAnalysis = async () => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    setIsAnalyzing(true)

    try {
      const result = await analyzeWithGemini(
        imageBase64,
        userId,
        (progressUpdate) => {
          console.log('📊 Progress update:', progressUpdate)
          setProgress(progressUpdate)
        }
      )

      setProgress({
        stage: 'complete',
        progress: 100,
        message: '분석 완료!',
        timestamp: Date.now()
      })

      // 약간의 지연 후 완료 콜백 호출
      setTimeout(() => {
        onComplete(result)
      }, 1000)

    } catch (error) {
      console.error('Analysis failed:', error)
      setProgress({
        stage: 'error',
        progress: 0,
        message: '분석 중 오류가 발생했습니다',
        timestamp: Date.now()
      })
      onError(error instanceof Error ? error : new Error('Unknown error'))
    }
  }

  // 컴포넌트 마운트 시 분석 시작
  React.useEffect(() => {
    startAnalysis()
  }, [])

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'preparation': return '🔧'
      case 'analysis': return '🔍'
      case 'processing': return '⚙️'
      case 'saving': return '💾'
      case 'complete': return '✅'
      case 'error': return '❌'
      default: return '⏳'
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'complete': return 'text-green-400'
      case 'error': return 'text-red-400'
      default: return 'text-blue-400'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6"
    >
      {/* 중앙 분석 영역 */}
      <div className="relative w-full max-w-md">
        {/* 프로그레스 링 */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* 배경 링 */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            {/* 진행 링 */}
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: progress.progress / 100 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00FFC2" />
                <stop offset="100%" stopColor="#00E6B8" />
              </linearGradient>
            </defs>
          </svg>

          {/* 중앙 아이콘 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              key={progress.stage}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-6xl"
            >
              {getStageIcon(progress.stage)}
            </motion.div>
          </div>
        </div>

        {/* 진행률 텍스트 */}
        <div className="text-center mb-6">
          <motion.div
            key={progress.message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-semibold text-white mb-2">
              {progress.progress}%
            </h3>
            <p className={`text-lg ${getStageColor(progress.stage)}`}>
              {progress.message}
            </p>
          </motion.div>
        </div>

        {/* 단계별 진행 바 */}
        <div className="space-y-2">
          {[
            { stage: 'preparation', label: '준비', threshold: 30 },
            { stage: 'analysis', label: 'AI 분석', threshold: 60 },
            { stage: 'processing', label: '데이터 처리', threshold: 85 },
            { stage: 'saving', label: '결과 저장', threshold: 95 },
            { stage: 'complete', label: '완료', threshold: 100 },
          ].map((step, index) => (
            <motion.div
              key={step.stage}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: progress.progress >= step.threshold ? 1 : 0.3,
                x: progress.progress >= step.threshold ? 0 : -20
              }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3"
            >
              <div className={`w-2 h-2 rounded-full ${
                progress.progress >= step.threshold
                  ? 'bg-[#00FFC2] shadow-lg shadow-[#00FFC2]/50'
                  : 'bg-gray-600'
              }`} />
              <span className={`text-sm ${
                progress.progress >= step.threshold
                  ? 'text-white font-medium'
                  : 'text-gray-500'
              }`}>
                {step.label}
              </span>
              {progress.stage === step.stage && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-3 h-3 border border-[#00FFC2] border-t-transparent rounded-full"
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* 하단 안내 텍스트 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-0 right-0 text-center px-6"
      >
        <p className="text-sm text-gray-400">
          AI가 당신의 피부를 정밀하게 분석하고 있습니다
        </p>
        <p className="text-xs text-gray-500 mt-1">
          분석 시간은 네트워크 상태에 따라 10-30초 정도 소요됩니다
        </p>
      </motion.div>
    </motion.div>
  )
}
