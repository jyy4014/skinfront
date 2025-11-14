'use client'

import { useEffect, useState } from 'react'
import { useCameraPermissionContext } from '@/app/providers/CameraPermissionProvider'
import { AlertCircle, Camera, CheckCircle } from 'lucide-react'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'

/**
 * 앱 시작 시 권한 확인 및 요청 컴포넌트
 */
export function PermissionChecker() {
  const {
    permissionStatus,
    hasCamera,
    isChecking,
    requestPermission,
  } = useCameraPermissionContext()

  const [showPrompt, setShowPrompt] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  // 앱 시작 시 권한 상태 확인
  useEffect(() => {
    if (!isChecking && !hasChecked) {
      setHasChecked(true)
      
      // 카메라가 있고 권한이 없으면 프롬프트 표시
      if (hasCamera && permissionStatus === 'prompt') {
        // 약간의 지연 후 표시 (사용자가 앱을 먼저 볼 수 있도록)
        const timer = setTimeout(() => {
          setShowPrompt(true)
        }, 1000)
        
        return () => clearTimeout(timer)
      }
    }
  }, [isChecking, hasCamera, permissionStatus, hasChecked])

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    const granted = await requestPermission()
    setIsRequesting(false)
    
    if (granted) {
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // 24시간 동안 다시 표시하지 않음
    localStorage.setItem('permissionPromptDismissed', Date.now().toString())
  }

  // 이미 거부했거나 카메라가 없으면 표시하지 않음
  if (!showPrompt || permissionStatus === 'denied' || !hasCamera) {
    return null
  }

  // 24시간 이내에 거부했으면 표시하지 않음
  const dismissedTime = localStorage.getItem('permissionPromptDismissed')
  if (dismissedTime) {
    const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60)
    if (hoursSinceDismissed < 24) {
      return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="space-y-4">
          {/* 아이콘 */}
          <div className="flex justify-center">
            <div className="rounded-full bg-pink-100 p-4">
              <Camera className="h-8 w-8 text-pink-600" />
            </div>
          </div>

          {/* 제목 */}
          <h2 className="text-xl font-semibold text-center text-gray-900">
            카메라 권한이 필요합니다
          </h2>

          {/* 설명 */}
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              피부 분석을 위해 얼굴 사진을 촬영해야 합니다.
            </p>
            <div className="space-y-1 mt-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>얼굴 사진 촬영</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>다각도 촬영 (정면, 좌측, 우측)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>자동 얼굴 감지 및 촬영</span>
              </div>
            </div>
          </div>

          {/* 안내 */}
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                권한을 허용하지 않아도 갤러리에서 사진을 선택하여 사용할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="flex-1"
            >
              나중에
            </Button>
            <Button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="flex-1 bg-pink-500 hover:bg-pink-600"
            >
              {isRequesting ? '요청 중...' : '권한 허용'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

