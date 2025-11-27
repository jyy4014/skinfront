'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, BarChart2, MapPin } from 'lucide-react'

const slides = [
  {
    id: 0,
    icon: <Camera className="w-16 h-16 text-[#00FFC2]" />,
    title: '🔍 AI 피부 진단',
    description: '셀카 한 장으로 모공, 주름, 기미를 분석하세요.',
  },
  {
    id: 1,
    icon: <BarChart2 className="w-16 h-16 text-[#00FFC2]" />,
    title: '📊 맞춤형 리포트',
    description: '내 피부 점수와 딱 맞는 시술을 추천받으세요.',
  },
  {
    id: 2,
    icon: <MapPin className="w-16 h-16 text-[#00FFC2]" />,
    title: '🏥 최저가 예약',
    description: '내 주변 피부과 이벤트를 지도에서 확인하세요.',
  },
]

export default function IntroPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const router = useRouter()

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1)
    }
  }

  const handleStart = () => {
    localStorage.setItem('has_seen_intro', 'true')
    router.push('/login')
  }

  // 자동 배경 애니메이션을 위해 주기적인 값 변경
  const [gradientPosition, setGradientPosition] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPosition((prev) => (prev + 1) % 360)
    }, 80)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative min-h-screen bg-[#121212] text-white overflow-hidden">
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-40"
        animate={{
          background: [
            `radial-gradient(circle at ${gradientPosition}% 20%, rgba(0,255,194,0.3), transparent 55%)`,
            `radial-gradient(circle at ${(gradientPosition + 40) % 100}% 80%, rgba(0,230,184,0.25), transparent 55%)`,
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative z-10 flex flex-col h-full px-6 py-10">
        {/* Skip button */}
        <div className="flex justify-end mb-8">
          <button
            className="text-xs text-gray-400 hover:text-white transition-colors"
            onClick={handleStart}
          >
            건너뛰기
          </button>
        </div>

        {/* Slider content */}
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.4 }}
              className="text-center space-y-6"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="w-24 h-24 rounded-3xl bg-[#00FFC2]/10 border border-[#00FFC2]/20 flex items-center justify-center">
                  {slides[currentSlide].icon}
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold">{slides[currentSlide].title}</h2>
                <p className="text-base text-gray-400">{slides[currentSlide].description}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((slide, index) => (
            <motion.span
              key={slide.id}
              className="h-2 rounded-full"
              animate={{
                width: currentSlide === index ? 20 : 8,
                backgroundColor: currentSlide === index ? '#00FFC2' : '#2F2F2F',
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-center">
          {currentSlide < slides.length - 1 ? (
            <button
              onClick={handleNext}
              className="text-white text-sm font-semibold px-6 py-3 rounded-full border border-white/20 hover:bg-white/5 transition-colors"
            >
              다음
            </button>
          ) : (
            <motion.button
              onClick={handleStart}
              className="w-full max-w-xs py-4 rounded-full bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] text-black font-bold shadow-[0_0_20px_rgba(0,255,194,0.4)]"
              animate={{ scale: [1, 1.02, 1], boxShadow: ['0 0 15px rgba(0,255,194,0.4)', '0 0 25px rgba(0,255,194,0.6)', '0 0 15px rgba(0,255,194,0.4)'] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              3초 만에 시작하기
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}



