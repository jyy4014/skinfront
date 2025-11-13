'use client'

import { useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import { ErrorMessage, LoadingSpinner } from '@/app/lib/ui'
import Button from '@/app/components/ui/Button'
import Card from '@/app/components/ui/Card'
import { useImageProcessor } from '@/app/lib/image'
import { useFaceDetection } from '@/app/hooks/useFaceDetection'

interface UploadFormProps {
  onFileSelect: (file: File) => void
  preview?: string | null
  onFaceDetectionResult?: (detected: boolean) => void
}

export default function UploadForm({ onFileSelect, preview, onFaceDetectionResult }: UploadFormProps) {
  const { processImage, processing, error: processingError } = useImageProcessor({
    maxWidth: 1024,
    quality: 0.85,
    checkQuality: false,
    autoValidate: true,
  })

  const { detectFace, detecting: detectingFace, error: faceDetectionError } = useFaceDetection()
  const [faceDetected, setFaceDetected] = useState<boolean | null>(null)
  const [faceDetectionMessage, setFaceDetectionMessage] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      return
    }

    try {
      // 이미지 전처리 (리사이즈, WebP 변환, 품질 검사)
      const result = await processImage(file)
      const processedFile = result.file
      
      // 얼굴 감지 실행
      setFaceDetected(null)
      setFaceDetectionMessage('얼굴을 확인하는 중...')
      
      const faceResult = await detectFace(processedFile)
      
      if (!faceResult.detected) {
        setFaceDetected(false)
        setFaceDetectionMessage(
          faceResult.error 
            ? `얼굴 감지 실패: ${faceResult.error}` 
            : '얼굴이 감지되지 않았습니다. 얼굴이 잘 보이는 사진을 다시 선택해주세요.'
        )
        onFaceDetectionResult?.(false)
        return
      }

      // 얼굴이 여러 개 감지된 경우
      if (faceResult.faceCount > 1) {
        setFaceDetected(false)
        setFaceDetectionMessage('얼굴이 여러 개 감지되었습니다. 한 명의 얼굴만 보이도록 다시 촬영해주세요.')
        onFaceDetectionResult?.(false)
        return
      }

      // 얼굴 감지 성공
      setFaceDetected(true)
      setFaceDetectionMessage(null)
      onFaceDetectionResult?.(true)
      onFileSelect(processedFile)
    } catch (error) {
      console.error('Image processing error:', error)
      setFaceDetected(false)
      setFaceDetectionMessage('이미지 처리 중 오류가 발생했습니다.')
      onFaceDetectionResult?.(false)
    }
  }


  return (
    <Card className="p-6">
      {processingError && (
        <div className="mb-4">
          <ErrorMessage error={processingError} size="sm" />
        </div>
      )}
      {faceDetectionError && (
        <div className="mb-4">
          <ErrorMessage error={faceDetectionError} size="sm" />
        </div>
      )}
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
      {(processing || detectingFace) && (
        <div className="mb-4">
          <LoadingSpinner
            size="sm"
            message={detectingFace ? '얼굴을 확인하는 중...' : '이미지를 처리하는 중...'}
          />
        </div>
      )}
      {!preview ? (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              밝은 조명에서 정면을 찍어주세요
            </p>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-pink-500 transition-colors">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center" aria-hidden="true">
                <Camera className="w-10 h-10 text-pink-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  사진을 업로드하세요
                </p>
                <p id="upload-description" className="text-gray-600 text-sm mb-2">
                  얼굴이 잘 보이는 사진을 선택해주세요
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={processing}
                    aria-label="카메라로 사진 촬영"
                  />
                  <div className="px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-center hover:border-pink-500 transition-colors">
                    <span className="text-sm font-medium text-gray-700">📸 촬영하기</span>
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={processing}
                    aria-label="갤러리에서 사진 선택"
                  />
                  <div className="px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-center hover:border-pink-500 transition-colors">
                    <span className="text-sm font-medium text-gray-700">🖼️ 갤러리</span>
                  </div>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2" role="note">
                사용자의 이미지와 분석 데이터는 익명화되어 저장되며, AI 모델 학습용으로 재사용되지 않습니다.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative rounded-xl overflow-hidden bg-gray-100" role="img" aria-label="업로드된 피부 사진 미리보기">
            <img
              src={preview || ''}
              alt="업로드된 피부 사진"
              className="w-full h-auto max-h-96 object-contain mx-auto"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
              <div className="w-64 h-64 border-4 border-pink-400/50 rounded-full border-dashed"></div>
            </div>
          </div>
          
          {faceDetected === true ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4" role="status" aria-live="polite">
              <p className="text-sm text-green-800 text-center">
                멋져요! 얼굴이 감지되었습니다. 분석에 적합한 사진이네요 🔍
              </p>
            </div>
          ) : faceDetected === false ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
              <p className="text-sm text-red-800 text-center">
                얼굴이 감지되지 않았습니다. 다른 사진을 선택해주세요.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4" role="status" aria-live="polite">
              <p className="text-sm text-blue-800 text-center">
                사진을 확인하는 중...
              </p>
            </div>
          )}
          
          <div className="flex gap-4">
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
          </div>
        </div>
      )}
    </Card>
  )
}
