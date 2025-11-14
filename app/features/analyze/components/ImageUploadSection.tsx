'use client'

import { useState, useRef } from 'react'
import { Camera, Image as ImageIcon } from 'lucide-react'
import Card from '@/app/components/ui/Card'
import { MultiAngleCameraCapture } from './MultiAngleCameraCapture'

interface ImageUploadSectionProps {
  onFileSelect: (file: File) => void
  processing?: boolean
}

/**
 * 이미지 업로드 섹션 컴포넌트
 * 카메라 촬영 및 갤러리 선택 기능 제공
 */
export function ImageUploadSection({ onFileSelect, processing = false }: ImageUploadSectionProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [showCamera, setShowCamera] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      return
    }

    onFileSelect(file)

    // input 초기화 (같은 파일 다시 선택 가능하도록)
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  const handleCameraClick = () => {
    setShowCamera(true)
  }

  const handleMultiAngleComplete = (images: File[]) => {
    setShowCamera(false)
    // 첫 번째 이미지(정면)를 메인으로 사용
    if (images.length > 0) {
      onFileSelect(images[0])
    }
  }

  const handleCameraClose = () => {
    setShowCamera(false)
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            밝은 조명에서 정면을 찍어주세요
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-pink-500 transition-colors">
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center" 
              aria-hidden="true"
            >
              <Camera className="w-10 h-10 text-pink-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                사진을 업로드하세요
              </p>
              <p className="text-gray-600 text-sm mb-2">
                얼굴이 잘 보이는 사진을 선택해주세요
              </p>
            </div>
            
            <div className="flex gap-3 w-full">
              {/* 카메라 버튼 - 자동 얼굴 감지 촬영 */}
              <button
                type="button"
                onClick={handleCameraClick}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-center hover:border-pink-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-sm font-medium text-gray-700 flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" />
                  촬영하기
                </span>
              </button>
              
              {/* 기존 파일 선택 (fallback) */}
              <label className="hidden">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  disabled={processing}
                  className="hidden"
                  aria-label="카메라로 사진 촬영"
                />
              </label>
              
              {/* 갤러리 버튼 */}
              <label className="flex-1">
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={processing}
                  className="hidden"
                  aria-label="갤러리에서 사진 선택"
                />
                <div className="px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-center hover:border-pink-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="text-sm font-medium text-gray-700 flex items-center justify-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    갤러리
                  </span>
                </div>
              </label>
            </div>

            <p className="text-xs text-gray-500 mt-2" role="note">
              사용자의 이미지와 분석 데이터는 익명화되어 저장되며, AI 모델 학습용으로 재사용되지 않습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 다각도 카메라 캡처 모달 */}
      {showCamera && (
        <MultiAngleCameraCapture
          onComplete={handleMultiAngleComplete}
          onClose={handleCameraClose}
        />
      )}
    </Card>
  )
}

