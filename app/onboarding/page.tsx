'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Heart, Shield } from 'lucide-react'

const onboardingSteps = [
  {
    icon: Sparkles,
    title: 'AI가 피부를 분석해드립니다',
    description: '사진 한 장으로 당신의 피부 상태를 정확하게 분석하고, 맞춤형 시술을 추천해드립니다.',
  },
  {
    icon: Heart,
    title: '개인 맞춤 시술 추천',
    description: '분석 결과를 바탕으로 당신에게 가장 적합한 피부 시술을 추천해드립니다.',
  },
  {
    icon: Shield,
    title: '안전하고 신뢰할 수 있는 정보',
    description: '본 서비스는 의료행위 또는 전문적 진단을 대체하지 않습니다. AI 분석 결과는 참고용 정보이며, 정확한 진단이나 치료를 위해서는 반드시 전문 의료인의 상담이 필요합니다.',
  },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push('/auth/login')
    }
  }

  const skip = () => {
    router.push('/auth/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="max-w-md w-full text-center"
          >
            <div className="mb-8 flex justify-center">
              <div className="rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-6">
                {(() => {
                  const Icon = onboardingSteps[currentStep].icon
                  return <Icon className="w-16 h-16 text-white" />
                })()}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {onboardingSteps[currentStep].title}
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              {onboardingSteps[currentStep].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 space-y-4">
        {/* Step indicators */}
        <div className="flex justify-center gap-2">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-pink-500'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={nextStep}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {currentStep === onboardingSteps.length - 1 ? '시작하기' : '다음'}
          </button>
          <button
            onClick={skip}
            className="w-full text-gray-600 py-2 font-medium"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  )
}

