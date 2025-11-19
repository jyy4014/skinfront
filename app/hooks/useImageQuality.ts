/**
 * 이미지 품질 검사 훅
 * 실시간으로 이미지 품질을 검사하고 피드백 제공
 */

'use client'

import { useState, useCallback } from 'react'
import {
  checkImageQualityComprehensive,
  ImageQualityResult,
  QualityCheckOptions,
} from '@/app/lib/image/quality-check'

export interface UseImageQualityReturn {
  checkQuality: (file: File) => Promise<ImageQualityResult>
  checking: boolean
  error: string | null
  lastResult: ImageQualityResult | null
}

export function useImageQuality(
  options: QualityCheckOptions = {}
): UseImageQualityReturn {
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<ImageQualityResult | null>(null)

  const checkQuality = useCallback(
    async (file: File): Promise<ImageQualityResult> => {
      setChecking(true)
      setError(null)

      try {
        const result = await checkImageQualityComprehensive(file, options)
        setLastResult(result)
        return result
      } catch (err: any) {
        const errorMessage = err.message || '이미지 품질 검사 중 오류가 발생했습니다.'
        setError(errorMessage)
        throw err
      } finally {
        setChecking(false)
      }
    },
    [options]
  )

  return {
    checkQuality,
    checking,
    error,
    lastResult,
  }
}

