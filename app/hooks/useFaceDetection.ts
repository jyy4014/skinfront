'use client'

import { useState, useCallback, useRef } from 'react'
import type { FaceDetection, Results } from '@mediapipe/face_detection'

interface FaceDetectionResult {
  detected: boolean
  faceCount: number
  confidence?: number
  error?: string
}

/**
 * 얼굴 감지 훅
 * MediaPipe Face Detection을 사용하여 이미지에서 얼굴을 감지합니다.
 */
export function useFaceDetection() {
  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const detectorRef = useRef<FaceDetection | null>(null)

  const detectFace = useCallback(async (imageFile: File | string): Promise<FaceDetectionResult> => {
    setDetecting(true)
    setError(null)

    let imageUrl: string | null = null

    try {
      // 이미지 URL 생성
      imageUrl = typeof imageFile === 'string' 
        ? imageFile 
        : URL.createObjectURL(imageFile)

      // MediaPipe Face Detection 동적 로드
      if (!detectorRef.current) {
        const { FaceDetection } = await import('@mediapipe/face_detection')
        
        detectorRef.current = new FaceDetection({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
          },
        })

        detectorRef.current.setOptions({
          model: 'short',
          minDetectionConfidence: 0.5,
        })

        // 초기화
        await detectorRef.current.initialize()
      }

      // 이미지 로드
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'))
        img.src = imageUrl!
      })

      // 얼굴 감지 실행 (Promise로 래핑)
      return new Promise<FaceDetectionResult>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('얼굴 감지 시간 초과 (10초)'))
        }, 10000) // 10초 타임아웃

        // 결과 리스너 설정
        detectorRef.current!.onResults((results: Results) => {
          clearTimeout(timeout)
          
          const faceCount = results.detections?.length || 0
          const detected = faceCount > 0

          resolve({
            detected,
            faceCount,
            confidence: detected ? 0.8 : undefined, // MediaPipe는 confidence를 직접 제공하지 않음
          })
        })

        // 이미지 전송
        detectorRef.current!.send({ image: img }).catch((err) => {
          clearTimeout(timeout)
          reject(err)
        })
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '얼굴 감지 중 오류가 발생했습니다.'
      setError(errorMessage)
      
      return {
        detected: false,
        faceCount: 0,
        error: errorMessage,
      }
    } finally {
      // 메모리 정리
      if (imageUrl && typeof imageFile !== 'string') {
        URL.revokeObjectURL(imageUrl)
      }
      setDetecting(false)
    }
  }, [])

  return {
    detectFace,
    detecting,
    error,
  }
}

