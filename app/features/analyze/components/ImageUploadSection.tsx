'use client'

import { useState, useRef } from 'react'
import { Camera, Image as ImageIcon } from 'lucide-react'
import Card from '@/app/components/ui/Card'
import { MultiAngleCameraCapture } from './MultiAngleCameraCapture'
import { CameraPermissionModal } from '@/app/components/common/CameraPermissionModal'
import { useCameraPermissionContext } from '@/app/providers/CameraPermissionProvider'

interface ImageUploadSectionProps {
  onFileSelect: (files: File[]) => void // 3개 이미지 배열
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
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  const {
    permissionStatus,
    hasCamera,
    isChecking,
    requestPermission,
  } = useCameraPermissionContext()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      return
    }

    // 단일 파일도 배열로 전달 (하위 호환성)
    onFileSelect([file])

    // input 초기화 (같은 파일 다시 선택 가능하도록)
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  const handleCameraClick = () => {
    // 카메라가 없으면 아무것도 하지 않음
    if (!hasCamera) {
      return
    }

    // 권한이 있으면 바로 카메라 모달 표시
    if (permissionStatus === 'granted') {
      setShowCamera(true)
    } else {
      // 권한이 없으면 권한 요청 모달 표시
      setShowPermissionModal(true)
    }
  }

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true)
    const granted = await requestPermission()
    setIsRequestingPermission(false)
    
    if (granted) {
      // 권한이 허용되었으면 권한 모달 닫고 카메라 모달 표시
      setShowPermissionModal(false)
      setShowCamera(true)
    }
    // 권한이 거부되면 모달은 그대로 유지 (사용자가 다시 시도할 수 있도록)
  }

  // 카메라 사용 가능 여부
  const canUseCamera = hasCamera && permissionStatus === 'granted'

  const handleMultiAngleComplete = (images: File[]) => {
    setShowCamera(false)
    // 3개 이미지 모두 전달
    if (images.length > 0) {
      onFileSelect(images) // 전체 배열 전달
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
              {/* 카메라 버튼 - 항상 표시 (권한 상태와 관계없이) */}
              {hasCamera && !isChecking && (
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
              )}

              {/* 카메라 없음 안내 */}
              {!hasCamera && !isChecking && (
                <div className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-center">
                  <span className="text-sm font-medium text-gray-600">
                    카메라 없음
                  </span>
                </div>
              )}
              
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

      {/* 카메라 권한 요청 모달 */}
      <CameraPermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onRequestPermission={handleRequestPermission}
        isRequesting={isRequestingPermission}
      />

      {/* 다각도 카메라 캡처 모달 - 권한이 있고 카메라가 있을 때만 표시 */}
      {showCamera && canUseCamera && (
        <MultiAngleCameraCapture
          onComplete={handleMultiAngleComplete}
          onClose={handleCameraClose}
        />
      )}
    </Card>
  )
}

