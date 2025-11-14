'use client'

import { useRef, useState, useId } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import { cn } from '@/app/utils/cn'
import { useFileUpload, UseFileUploadOptions } from '../hooks/useFileUpload'
import { LoadingSpinner, ErrorMessage } from '@/app/lib/ui'
import { FormError } from './FormError'

export interface FileUploadProps extends UseFileUploadOptions {
  /**
   * 파일 선택 콜백
   */
  onFileSelect: (file: File, preview: string) => void
  
  /**
   * 얼굴 감지 결과 콜백
   */
  onFaceDetectionResult?: (detected: boolean) => void
  
  /**
   * 미리보기 URL
   */
  preview?: string | null
  
  /**
   * 라벨
   */
  label?: string
  
  /**
   * 설명
   */
  description?: string
  
  /**
   * 추가 클래스명
   */
  className?: string
  
  /**
   * 카메라 촬영 지원 여부
   * @default true
   */
  allowCamera?: boolean
  
  /**
   * 갤러리 선택 지원 여부
   * @default true
   */
  allowGallery?: boolean
}

/**
 * 재사용 가능한 파일 업로드 컴포넌트
 */
export function FileUpload({
  onFileSelect,
  onFaceDetectionResult,
  preview,
  label = '사진을 업로드하세요',
  description = '얼굴이 잘 보이는 사진을 선택해주세요',
  className,
  allowCamera = true,
  allowGallery = true,
  ...options
}: FileUploadProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputId = useId()
  const galleryInputId = useId()

  const {
    handleFileUpload,
    processing,
    error,
    faceDetectionMessage,
    faceDetected,
    reset,
  } = useFileUpload(options)

  const [localPreview, setLocalPreview] = useState<string | null>(preview || null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 타입 기본 검사
    if (!file.type.startsWith('image/')) {
      return
    }

    try {
      const result = await handleFileUpload(file)
      setLocalPreview(result.preview)
      onFileSelect(result.file, result.preview)
      onFaceDetectionResult?.(result.faceDetected)
    } catch (err) {
      // 에러는 훅에서 처리됨
      onFaceDetectionResult?.(false)
    }
  }

  const handleRemove = () => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview)
      setLocalPreview(null)
    }
    reset()
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
    onFaceDetectionResult?.(false)
  }

  const currentPreview = preview || localPreview

  return (
    <div className={cn('space-y-4', className)}>
      {/* 에러 메시지 */}
      {error && <FormError error={error} />}
      {faceDetectionMessage && faceDetected === false && (
        <div className="mb-4">
          <ErrorMessage
            error={faceDetectionMessage}
            size="sm"
            autoStyle={false}
            className="bg-red-50 border-red-200 text-red-800"
          />
          <ul className="mt-2 text-xs list-disc list-inside space-y-1 text-red-600 ml-4">
            <li>밝은 조명에서 정면으로 촬영해주세요</li>
            <li>얼굴이 화면 중앙에 위치하도록 해주세요</li>
            <li>화장을 지우고 깨끗한 얼굴 상태로 촬영해주세요</li>
          </ul>
        </div>
      )}

      {/* 로딩 상태 */}
      {processing && (
        <div className="mb-4">
          <LoadingSpinner
            size="sm"
            message={faceDetected === null ? '얼굴을 확인하는 중...' : '이미지를 처리하는 중...'}
          />
        </div>
      )}

      {!currentPreview ? (
        /* 업로드 UI */
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-pink-500 transition-colors">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              <Camera className="w-10 h-10 text-pink-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 mb-2">{label}</p>
              <p id="upload-description" className="text-gray-600 text-sm mb-2">
                {description}
              </p>
            </div>
            <div className="flex gap-3 w-full">
              {allowCamera && (
                <label className="flex-1 cursor-pointer">
                  <input
                    id={cameraInputId}
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={processing}
                    aria-label="카메라로 사진 촬영"
                  />
                  <div className="px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-center hover:border-pink-500 transition-colors">
                    <span className="text-sm font-medium text-gray-700 pointer-events-none">📸 촬영하기</span>
                  </div>
                </label>
              )}
              {allowGallery && (
                <label className="flex-1 cursor-pointer">
                  <input
                    id={galleryInputId}
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={processing}
                    aria-label="갤러리에서 사진 선택"
                  />
                  <div className="px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-center hover:border-pink-500 transition-colors">
                    <span className="text-sm font-medium text-gray-700 pointer-events-none">🖼️ 갤러리</span>
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 미리보기 UI */
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-gray-100" role="img" aria-label="업로드된 피부 사진 미리보기">
            <img
              src={currentPreview}
              alt="업로드된 피부 사진"
              className="w-full h-auto max-h-96 object-contain mx-auto"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
              <div className="w-64 h-64 border-4 border-pink-400/50 rounded-full border-dashed"></div>
            </div>
          </div>

          {/* 얼굴 감지 결과 */}
          {faceDetected === true && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4" role="status" aria-live="polite">
              <p className="text-sm text-green-800 text-center">
                멋져요! 얼굴이 감지되었습니다. 분석에 적합한 사진이네요 🔍
              </p>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-4">
            {allowGallery && (
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                  disabled={processing}
                  aria-label="다른 사진 선택"
                />
                <div className="border-2 border-gray-300 rounded-lg p-4 text-center hover:border-pink-500 transition-colors focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-500">
                  <Upload className="w-5 h-5 mx-auto mb-2 text-gray-600" aria-hidden="true" />
                  <span className="text-sm text-gray-700">다른 사진 선택</span>
                </div>
              </label>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2 border-2 border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              aria-label="사진 제거"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

