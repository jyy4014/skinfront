'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Webcam from 'react-webcam'
import type { FaceMesh as FaceMeshType } from '@mediapipe/face_mesh'

interface ScanModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ScanModal({ isOpen, onClose }: ScanModalProps) {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const faceMeshRef = useRef<FaceMeshType | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // FaceMesh 초기화
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    const initFaceMesh = async () => {
      try {
        // 동적 import로 MediaPipe 로드
        const { FaceMesh } = await import('@mediapipe/face_mesh')

        if (!isMounted) return

        const faceMesh = new FaceMesh({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
          },
        })

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })

        faceMesh.onResults((results) => {
      const canvas = canvasRef.current
      const video = webcamRef.current?.video

      if (!canvas || !video) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 캔버스 크기 설정
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // 비디오 프레임 그리기
      ctx.save()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // 얼굴 랜드마크 그리기
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0]

        ctx.strokeStyle = '#00FFC2'
        ctx.fillStyle = '#00FFC2'
        ctx.lineWidth = 2

        // 얼굴 윤곽선 그리기 (주요 포인트만)
        const faceOutline = [
          10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10
        ]

        ctx.beginPath()
        for (let i = 0; i < faceOutline.length; i++) {
          const idx = faceOutline[i]
          if (idx < landmarks.length) {
            const x = landmarks[idx].x * canvas.width
            const y = landmarks[idx].y * canvas.height

            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
        }
        ctx.closePath()
        ctx.stroke()

        // 눈 그리기
        const leftEye = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
        const rightEye = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]

        // 왼쪽 눈
        ctx.beginPath()
        for (let i = 0; i < leftEye.length; i++) {
          const idx = leftEye[i]
          if (idx < landmarks.length) {
            const x = landmarks[idx].x * canvas.width
            const y = landmarks[idx].y * canvas.height
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
        }
        ctx.closePath()
        ctx.stroke()

        // 오른쪽 눈
        ctx.beginPath()
        for (let i = 0; i < rightEye.length; i++) {
          const idx = rightEye[i]
          if (idx < landmarks.length) {
            const x = landmarks[idx].x * canvas.width
            const y = landmarks[idx].y * canvas.height
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
        }
        ctx.closePath()
        ctx.stroke()
      }

          ctx.restore()
        })

        faceMeshRef.current = faceMesh
      } catch (error) {
        console.error('Failed to initialize FaceMesh:', error)
      }
    }

    initFaceMesh()

    return () => {
      isMounted = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close()
        faceMeshRef.current = null
      }
    }
  }, [isOpen])

  // 카메라 프레임 처리
  const processFrame = useCallback(async () => {
    const video = webcamRef.current?.video
    if (!video || !faceMeshRef.current || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame)
      return
    }

    try {
      await faceMeshRef.current.send({ image: video })
    } catch (error) {
      console.error('FaceMesh processing error:', error)
    }

    animationFrameRef.current = requestAnimationFrame(processFrame)
  }, [])

  // 카메라 시작
  const startCamera = useCallback(() => {
    const video = webcamRef.current?.video
    if (!video || !faceMeshRef.current) return

    // 프레임 처리 시작
    processFrame()
    setIsCameraReady(true)
  }, [processFrame])

  // Webcam 준비 완료 시 카메라 시작
  const handleUserMedia = useCallback(() => {
    setTimeout(() => {
      startCamera()
    }, 500)
  }, [startCamera])

  // 모달 닫기
  const handleClose = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (faceMeshRef.current) {
      faceMeshRef.current.close()
      faceMeshRef.current = null
    }
    setIsCameraReady(false)
    onClose()
  }

  // 모달이 닫힐 때 카메라 정리
  useEffect(() => {
    if (!isOpen) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      setIsCameraReady(false)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 z-[100]"
            onClick={handleClose}
          />

          {/* 모달 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[90vh] bg-[#121212] rounded-t-3xl z-[101] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">피부 스캔</h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                aria-label="닫기"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* 카메라 영역 */}
            <div className="relative w-full flex-1 flex items-center justify-center bg-black overflow-hidden">
              <div className="relative w-full aspect-[4/3] max-w-full max-h-full">
                {/* Webcam */}
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    facingMode: 'user',
                  }}
                  onUserMedia={handleUserMedia}
                  className="absolute inset-0 w-full h-full object-cover"
                  mirrored
                />

                {/* Canvas (얼굴 인식 오버레이) */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {/* 얼굴 가이드 원 */}
                {!isCameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-4 border-[#00FFC2]/50 rounded-full border-dashed animate-pulse" />
                  </div>
                )}

                {/* 카메라 준비 중 메시지 */}
                {!isCameraReady && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
                    <p className="text-white text-sm mb-2">카메라를 준비하고 있어요...</p>
                    <div className="w-32 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-[#00FFC2] animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
                )}

                {/* 얼굴 인식 안내 */}
                {isCameraReady && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center px-4">
                    <p className="text-white text-sm font-medium mb-1">얼굴을 프레임 안에 맞춰주세요</p>
                    <p className="text-gray-400 text-xs">정면을 바라보고 자연스러운 표정을 유지해주세요</p>
                  </div>
                )}
              </div>
            </div>

            {/* 하단 액션 버튼 */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#121212] to-transparent">
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  className="flex-1 px-6 py-3 rounded-xl bg-[#00FFC2] text-black font-semibold hover:bg-[#00E6B8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isCameraReady}
                >
                  촬영하기
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

