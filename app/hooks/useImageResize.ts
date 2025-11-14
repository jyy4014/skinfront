'use client'

import { useState, useCallback } from 'react'
import { resizeImage, checkImageQuality } from '@/app/lib/image'

interface UseImageResizeOptions {
  maxWidth?: number
  quality?: number
  checkQuality?: boolean
}

export function useImageResize(options: UseImageResizeOptions = {}) {
  const { maxWidth = 1024, quality = 0.85, checkQuality = true } = options
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processImage = useCallback(
    async (file: File): Promise<{ file: File; qualityScore?: number }> => {
      setProcessing(true)
      setError(null)

      try {
        // 이미지 리사이즈 및 WebP 변환
        const resizedBlob = await resizeImage(file, maxWidth, quality)
        const processedFile = new File([resizedBlob], file.name, {
          type: resizedBlob.type,
          lastModified: Date.now(),
        })

        // 품질 검사 (선택적)
        let qualityScore: number | undefined
        if (checkQuality) {
          qualityScore = await checkImageQuality(processedFile)
          // sharpnessScore는 높을수록 선명 (0-1 범위)
          // 0.1 미만이면 너무 흐린 이미지로 간주
          if (qualityScore < 0.1) {
            throw new Error(
              '이미지가 너무 흐릿합니다. 더 선명한 사진을 사용해주세요.'
            )
          }
        }

        return { file: processedFile, qualityScore }
      } catch (err: any) {
        setError(err.message || '이미지 처리 중 오류가 발생했습니다.')
        throw err
      } finally {
        setProcessing(false)
      }
    },
    [maxWidth, quality, checkQuality]
  )

  return {
    processImage,
    processing,
    error,
  }
}

