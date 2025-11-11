/**
 * 통합 이미지 처리 훅
 * 리사이즈, WebP 변환, 품질 검사, 검증을 통합
 */

'use client'

import { useState, useCallback } from 'react'
import { processImage, validateImageFile } from '../'
import type { ProcessImageOptions, ProcessImageResult } from '../processing'
import type { ValidationResult } from '../validation'

export interface UseImageProcessorOptions extends ProcessImageOptions {
  autoValidate?: boolean
}

export interface UseImageProcessorReturn {
  processImage: (file: File) => Promise<ProcessImageResult>
  validateFile: (file: File) => ValidationResult
  processing: boolean
  error: string | null
}

/**
 * 통합 이미지 처리 훅
 */
export function useImageProcessor(
  options: UseImageProcessorOptions = {}
): UseImageProcessorReturn {
  const { autoValidate = true, ...processOptions } = options
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback((file: File): ValidationResult => {
    return validateImageFile(file)
  }, [])

  const handleProcessImage = useCallback(
    async (file: File): Promise<ProcessImageResult> => {
      setProcessing(true)
      setError(null)

      try {
        // 파일 검증 (선택적)
        if (autoValidate) {
          const validation = validateImageFile(file)
          if (!validation.valid) {
            throw new Error(validation.error || '파일 검증 실패')
          }
        }

        // 이미지 처리
        const result = await processImage(file, processOptions)
        return result
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '이미지 처리 중 오류가 발생했습니다.'
        setError(errorMessage)
        throw err
      } finally {
        setProcessing(false)
      }
    },
    [autoValidate, processOptions]
  )

  return {
    processImage: handleProcessImage,
    validateFile,
    processing,
    error,
  }
}

