'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Lock, Camera, FileText } from 'lucide-react'

const onboardingSteps = [
  {
    icon: Sparkles,
    title: 'AI가 피부를 분석해드립니다',
    description: '사진 한 장으로 당신의 피부 상태를 정확하게 분석하고, 맞춤형 시술을 추천해드립니다.',
  },
  {
    icon: Lock,
    title: '사진은 암호화되어 안전하게 저장됩니다',
    description: '업로드된 모든 사진은 암호화되어 저장되며, AI 모델 학습용으로 재사용되지 않습니다. 개인정보는 철저히 보호됩니다.',
  },
  {
    icon: Camera,
    title: '촬영 시 빛, 각도, 화장 제거 등 안내',
    description: '밝은 조명에서 정면을 찍어주세요. 화장을 지우고 자연스러운 표정으로 촬영하면 더 정확한 분석이 가능합니다.',
  },
  {
    icon: FileText,
    title: '이용 약관 및 개인정보 동의',
    description: '서비스 이용을 위해 이용 약관 및 개인정보 처리 방침에 동의해주세요.',
  },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [agreed, setAgreed] = useState(false)
  const router = useRouter()

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      if (agreed) {
        router.push('/auth/login')
      }
    }
  }

  const skip = () => {
    router.push('/auth/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50">
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

        {/* Step 4: 동의 체크 */}
        {currentStep === onboardingSteps.length - 1 && (
          <div className="space-y-4 mb-4">
            <label className="flex items-start gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 cursor-pointer hover:border-pink-300 transition-colors">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  이용 약관 및 개인정보 처리 방침에 동의합니다
                </p>
                <p className="text-xs text-gray-500">
                  본 서비스는 의료행위 또는 전문적 진단을 대체하지 않습니다. AI 분석 결과는 참고용 정보이며, 정확한 진단이나 치료를 위해서는 반드시 전문 의료인의 상담이 필요합니다.
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={nextStep}
            disabled={currentStep === onboardingSteps.length - 1 && !agreed}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === onboardingSteps.length - 1 ? '시작하기' : '다음'}
          </button>
          {currentStep < onboardingSteps.length - 1 && (
            <button
              onClick={skip}
              className="w-full text-gray-600 py-2 font-medium"
            >
              건너뛰기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

