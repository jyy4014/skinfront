'use client'

import { useState, useCallback } from 'react'
import { useImageProcessor } from '@/app/lib/image'
import { useFaceDetection } from '@/app/hooks/useFaceDetection'
import { validateFile, ValidationResult } from '../validators'

export interface UseFileUploadOptions {
  /**
   * 이미지 최대 너비
   * @default 1024
   */
  maxWidth?: number
  
  /**
   * 이미지 품질 (0-1)
   * @default 0.85
   */
  quality?: number
  
  /**
   * 품질 검사 여부
   * @default false
   */
  checkQuality?: boolean
  
  /**
   * 자동 검증 여부
   * @default true
   */
  autoValidate?: boolean
  
  /**
   * 얼굴 감지 필수 여부
   * @default true
   */
  requireFaceDetection?: boolean
  
  /**
   * 최대 파일 크기 (bytes)
   * @default 10MB
   */
  maxFileSize?: number
}

export interface FileUploadResult {
  file: File
  preview: string
  faceDetected: boolean
  faceCount?: number
}

export interface UseFileUploadReturn {
  /**
   * 파일 업로드 처리
   */
  handleFileUpload: (file: File) => Promise<FileUploadResult>
  
  /**
   * 파일 검증
   */
  validateFile: (file: File) => ValidationResult
  
  /**
   * 업로드 중 여부
   */
  uploading: boolean
  
  /**
   * 얼굴 감지 중 여부
   */
  detectingFace: boolean
  
  /**
   * 처리 중 여부 (업로드 또는 얼굴 감지)
   */
  processing: boolean
  
  /**
   * 에러 메시지
   */
  error: string | null
  
  /**
   * 얼굴 감지 결과 메시지
   */
  faceDetectionMessage: string | null
  
  /**
   * 얼굴 감지 성공 여부
   */
  faceDetected: boolean | null
  
  /**
   * 리셋
   */
  reset: () => void
}

/**
 * 파일 업로드 훅
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    maxWidth = 1024,
    quality = 0.85,
    checkQuality = false,
    autoValidate = true,
    requireFaceDetection = true,
    maxFileSize = 10 * 1024 * 1024, // 10MB
  } = options

  const { processImage, processing: imageProcessing, error: imageError } = useImageProcessor({
    maxWidth,
    quality,
    checkQuality,
    autoValidate,
  })

  const { detectFace, detecting: detectingFace, error: faceError } = useFaceDetection()

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState<boolean | null>(null)
  const [faceDetectionMessage, setFaceDetectionMessage] = useState<string | null>(null)

  // 파일 검증
  const validateFileInput = useCallback(
    (file: File): ValidationResult => {
      return validateFile(file, {
        maxSize: maxFileSize,
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      })
    },
    [maxFileSize]
  )

  // 파일 업로드 처리
  const handleFileUpload = useCallback(
    async (file: File): Promise<FileUploadResult> => {
      setUploading(true)
      setError(null)
      setFaceDetected(null)
      setFaceDetectionMessage(null)

      try {
        // 파일 검증
        if (autoValidate) {
          const validation = validateFileInput(file)
          if (!validation.valid) {
            throw new Error(validation.error || '파일 검증 실패')
          }
        }

        // 이미지 처리 (리사이즈, WebP 변환)
        const processResult = await processImage(file)
        const processedFile = processResult.file

        // 미리보기 URL 생성
        const preview = URL.createObjectURL(processedFile)

        // 얼굴 감지 (필수인 경우)
        let faceDetectedResult = true
        let faceCount = 0

        if (requireFaceDetection) {
          setFaceDetectionMessage('얼굴을 확인하는 중...')
          const faceResult = await detectFace(processedFile)

          if (!faceResult.detected) {
            setFaceDetected(false)
            setFaceDetectionMessage(
              faceResult.error
                ? `얼굴 감지 실패: ${faceResult.error}`
                : '얼굴이 감지되지 않았습니다. 얼굴이 잘 보이는 사진을 다시 선택해주세요.'
            )
            throw new Error(faceResult.error || '얼굴이 감지되지 않았습니다.')
          }

          // 얼굴이 여러 개 감지된 경우
          if (faceResult.faceCount > 1) {
            setFaceDetected(false)
            setFaceDetectionMessage('얼굴이 여러 개 감지되었습니다. 한 명의 얼굴만 보이도록 다시 촬영해주세요.')
            throw new Error('얼굴이 여러 개 감지되었습니다.')
          }

          faceDetectedResult = true
          faceCount = faceResult.faceCount || 1
          setFaceDetected(true)
          setFaceDetectionMessage(null)
        }

        return {
          file: processedFile,
          preview,
          faceDetected: faceDetectedResult,
          faceCount,
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '파일 업로드 중 오류가 발생했습니다.'
        setError(errorMessage)
        setFaceDetected(false)
        setFaceDetectionMessage(errorMessage)
        throw err
      } finally {
        setUploading(false)
      }
    },
    [autoValidate, requireFaceDetection, validateFileInput, processImage, detectFace]
  )

  // 리셋
  const reset = useCallback(() => {
    setUploading(false)
    setError(null)
    setFaceDetected(null)
    setFaceDetectionMessage(null)
  }, [])

  const processing = uploading || imageProcessing || detectingFace
  const finalError = error || imageError || faceError

  return {
    handleFileUpload,
    validateFile: validateFileInput,
    uploading,
    detectingFace,
    processing,
    error: finalError,
    faceDetectionMessage,
    faceDetected,
    reset,
  }
}



