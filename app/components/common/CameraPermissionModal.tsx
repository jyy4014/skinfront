'use client'

import { AlertCircle, Camera, CheckCircle, X } from 'lucide-react'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'

interface CameraPermissionModalProps {
  isOpen: boolean
  onClose: () => void
  onRequestPermission: () => Promise<void>
  isRequesting: boolean
}

/**
 * 카메라 권한 요청 모달 컴포넌트
 * 재사용 가능한 권한 요청 UI
 */
export function CameraPermissionModal({
  isOpen,
  onClose,
  onRequestPermission,
  isRequesting,
}: CameraPermissionModalProps) {
  if (!isOpen) return null

  const handleRequest = async () => {
    await onRequestPermission()
    // 권한이 허용되면 모달 닫기 (부모 컴포넌트에서 처리)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md p-6 relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="닫기"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

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
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isRequesting}
            >
              취소
            </Button>
            <Button
              onClick={handleRequest}
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

