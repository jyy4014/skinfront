'use client'

import { useState, useEffect } from 'react'
import { CameraCapture } from './CameraCapture'
import { Check, ArrowRight, ArrowLeft } from 'lucide-react'
import Button from '@/app/components/ui/Button'
import type { FaceCaptureStep, FaceCaptureAngle } from '../types'

interface MultiAngleCameraCaptureProps {
  onComplete: (images: File[]) => void
  onClose: () => void
}

/**
 * 다각도 얼굴 촬영 컴포넌트
 * 정면, 좌측, 우측 3장을 순차적으로 촬영
 */
export function MultiAngleCameraCapture({ onComplete, onClose }: MultiAngleCameraCaptureProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [steps, setSteps] = useState<FaceCaptureStep[]>([
    {
      angle: 'front',
      label: '정면',
      instruction: '얼굴을 정면으로 향하고 중앙에 맞춰주세요',
      completed: false,
    },
    {
      angle: 'left',
      label: '좌측',
      instruction: '얼굴을 왼쪽으로 돌려주세요 (약 45도)',
      completed: false,
    },
    {
      angle: 'right',
      label: '우측',
      instruction: '얼굴을 오른쪽으로 돌려주세요 (약 45도)',
      completed: false,
    },
  ])

  const currentStep = steps[currentStepIndex]
  const allCompleted = steps.every(step => step.completed)

  const handleCapture = (file: File) => {
    const updatedSteps = [...steps]
    updatedSteps[currentStepIndex] = {
      ...updatedSteps[currentStepIndex],
      completed: true,
      image: file,
      preview: URL.createObjectURL(file),
    }
    setSteps(updatedSteps)

    // 다음 단계로 이동
    if (currentStepIndex < steps.length - 1) {
      setTimeout(() => {
        setCurrentStepIndex(currentStepIndex + 1)
      }, 500) // 짧은 딜레이로 사용자에게 피드백 제공
    }
  }

  const handleComplete = () => {
    const images = steps
      .filter(step => step.image)
      .map(step => step.image!)
    
    if (images.length === steps.length) {
      onComplete(images)
    }
  }

  const handleRetake = (index: number) => {
    const updatedSteps = [...steps]
    updatedSteps[index] = {
      ...updatedSteps[index],
      completed: false,
      image: undefined,
      preview: undefined,
    }
    setSteps(updatedSteps)
    setCurrentStepIndex(index)
  }

  // 모든 단계 완료 시 자동으로 완료 처리
  useEffect(() => {
    if (allCompleted) {
      // 자동 완료는 하지 않고 사용자가 버튼을 눌러야 함
      // handleComplete()
    }
  }, [allCompleted])

  // 촬영 중이 아닐 때 (모든 단계 완료 후)
  if (allCompleted) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">
              모든 각도 촬영 완료!
            </h2>
            <p className="text-white/70">
              3장의 사진이 모두 촬영되었습니다.
            </p>
          </div>

          {/* 촬영된 사진 미리보기 */}
          <div className="grid grid-cols-3 gap-4">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {step.preview ? (
                  <>
                    <img
                      src={step.preview}
                      alt={step.label}
                      className="w-full aspect-square object-cover rounded-lg border-2 border-white/20"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {step.label}
                    </div>
                    <button
                      onClick={() => handleRetake(index)}
                      className="absolute bottom-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
                    >
                      재촬영
                    </button>
                  </>
                ) : (
                  <div className="w-full aspect-square bg-gray-800 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center">
                    <span className="text-white/50 text-xs">{step.label}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-transparent border-white/30 text-white hover:bg-white/10"
            >
              취소
            </Button>
            <Button
              onClick={handleComplete}
              className="flex-1 bg-white text-black hover:bg-gray-100"
            >
              분석 시작하기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 현재 단계 촬영 중
  return (
    <CameraCapture
      onCapture={handleCapture}
      onClose={onClose}
      autoCapture={true}
      targetAngle={currentStep.angle}
      angleLabel={currentStep.label}
      angleInstruction={currentStep.instruction}
    />
  )
}

