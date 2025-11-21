'use client'

import { useState } from 'react'
import { Camera } from 'lucide-react'
import Card from '@/app/components/ui/Card'
import { CameraCapture } from './CameraCapture'
import { MultiAngleCameraCapture } from './MultiAngleCameraCapture'
import { CameraPermissionModal } from '@/app/components/common/CameraPermissionModal'
import { useCameraPermissionContext } from '@/app/providers/CameraPermissionProvider'
import Button from '@/app/components/ui/Button'

interface ImageUploadSectionProps {
  onFileSelect: (files: File[]) => void // 1개 이상의 이미지 배열 (정면 필수, 좌/우 선택)
  processing?: boolean
}

/**
 * 이미지 업로드 섹션 컴포넌트
 * 앱 내 카메라로만 촬영 (정면 필수, 좌/우 선택사항)
 */
export function ImageUploadSection({ onFileSelect, processing = false }: ImageUploadSectionProps) {
  const [showCamera, setShowCamera] = useState(false)
  const [showMultiAngle, setShowMultiAngle] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [frontImage, setFrontImage] = useState<File | null>(null)

  const {
    permissionStatus,
    hasCamera,
    isChecking,
    requestPermission,
  } = useCameraPermissionContext()

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

  // 정면 사진 촬영 완료
  const handleFrontCapture = (file: File) => {
    setFrontImage(file)
    setShowCamera(false)
    // 정면만으로도 즉시 분석 가능하도록 전달
    onFileSelect([file])
  }

  // 좌/우 추가 촬영 시작
  const handleAddSideAngles = () => {
    setShowMultiAngle(true)
  }

  // 다각도 촬영 완료 (정면 + 좌/우)
  const handleMultiAngleComplete = (images: File[]) => {
    setShowMultiAngle(false)
    // 정면이 첫 번째에 있어야 함
    if (images.length > 0) {
      onFileSelect(images)
    }
  }

  const handleCameraClose = () => {
    setShowCamera(false)
  }

  const handleMultiAngleClose = () => {
    setShowMultiAngle(false)
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
                정면 사진 촬영
              </p>
              <p className="text-gray-600 text-sm mb-2">
                얼굴이 잘 보이는 정면 사진을 촬영해주세요
              </p>
            </div>
            
            <div className="w-full">
              {/* 카메라 버튼 - 항상 표시 (권한 상태와 관계없이) */}
              {hasCamera && !isChecking ? (
                <Button
                  type="button"
                  onClick={handleCameraClick}
                  disabled={processing}
                  className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Camera className="w-5 h-5" />
                    정면 사진 촬영하기
                  </span>
                </Button>
              ) : !hasCamera && !isChecking ? (
                <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-center">
                  <span className="text-sm font-medium text-gray-600">
                    카메라를 사용할 수 없습니다
                  </span>
                </div>
              ) : (
                <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-center">
                  <span className="text-sm font-medium text-gray-600">
                    카메라 확인 중...
                  </span>
                </div>
              )}
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

      {/* 정면 카메라 캡처 모달 - 권한이 있고 카메라가 있을 때만 표시 */}
      {showCamera && canUseCamera && !showMultiAngle && (
        <CameraCapture
          onCapture={handleFrontCapture}
          onClose={handleCameraClose}
          autoCapture={true}
          targetAngle="front"
          angleLabel="정면"
          angleInstruction="얼굴을 정면으로 향하고 중앙에 맞춰주세요"
        />
      )}

      {/* 다각도 카메라 캡처 모달 - 좌/우 추가 촬영 시 */}
      {showMultiAngle && canUseCamera && (
        <MultiAngleCameraCapture
          onComplete={handleMultiAngleComplete}
          onClose={handleMultiAngleClose}
        />
      )}
    </Card>
  )
}

