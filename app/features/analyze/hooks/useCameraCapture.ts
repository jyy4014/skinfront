import { useState, useRef, useCallback, useEffect } from 'react'
import type { FaceDetection, Results } from '@mediapipe/face_detection'
import { useFaceAngleDetection, isFaceAngleValid } from './useFaceAngleDetection'
import type { FaceCaptureAngle } from '../types'

interface FacePosition {
  x: number
  y: number
  width: number
  height: number
  confidence: number
}

interface UseCameraCaptureOptions {
  onCapture: (file: File) => void
  autoCapture?: boolean
  minFaceSize?: number // 최소 얼굴 크기 (비율, 0-1)
  maxFaceSize?: number // 최대 얼굴 크기 (비율, 0-1)
  centerThreshold?: number // 중앙 위치 허용 오차 (비율, 0-1)
  minConfidence?: number // 최소 신뢰도 (0-1)
  stableFrames?: number // 자동 촬영 전 안정 프레임 수
  targetAngle?: FaceCaptureAngle // 목표 얼굴 각도
  requireAngleDetection?: boolean // 각도 감지 필수 여부
}

interface UseCameraCaptureReturn {
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  isStreaming: boolean
  isDetecting: boolean
  faceDetected: boolean
  facePosition: FacePosition | null
  startCamera: () => Promise<void>
  stopCamera: () => void
  capturePhoto: () => File | null
  error: string | null
  currentAngle: { yaw: number; pitch: number; roll: number } | null
  angleValid: boolean // 각도가 목표 각도에 맞는지 여부
}

/**
 * 카메라 캡처 및 실시간 얼굴 감지 훅
 */
export function useCameraCapture(options: UseCameraCaptureOptions): UseCameraCaptureReturn {
  const {
    onCapture,
    autoCapture = true,
    minFaceSize = 0.2,
    maxFaceSize = 0.6,
    centerThreshold = 0.15,
    minConfidence = 0.7,
    stableFrames = 10,
    targetAngle = 'front',
    requireAngleDetection = false,
  } = options

  const { detectFaceAngle } = useFaceAngleDetection()
  const currentFaceAngleRef = useRef<{ yaw: number; pitch: number; roll: number } | null>(null)
  const lastDetectionResultsRef = useRef<Results | null>(null)
  const angleDetectionPendingRef = useRef(false) // 각도 감지 중복 호출 방지
  const frameSkipCountRef = useRef(0) // 프레임 스킵 카운터 (성능 최적화)
  const lastAngleRef = useRef<{ yaw: number; pitch: number; roll: number } | null>(null) // 이전 각도 캐싱
  const lastPositionRef = useRef<FacePosition | null>(null) // 이전 위치 캐싱 (움직임 계산용)
  const angleChangeThreshold = 5 // 각도 변화 임계값 (도) - 이 값보다 작으면 캐싱 사용
  const movementHistoryRef = useRef<number[]>([]) // 얼굴 움직임 히스토리 (적응형 스킵용)
  const adaptiveSkipRateRef = useRef(3) // 적응형 스킵 비율 (기본 3프레임마다)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<FaceDetection | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const stableFrameCountRef = useRef(0)

  const [isStreaming, setIsStreaming] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [facePosition, setFacePosition] = useState<FacePosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentAngle, setCurrentAngle] = useState<{ yaw: number; pitch: number; roll: number } | null>(null)
  const [angleValid, setAngleValid] = useState(false)
  const angleValidRef = useRef(false) // ref로도 관리하여 dependency 문제 해결

  // MediaPipe Face Detection 초기화
  const initializeDetector = useCallback(async () => {
    if (detectorRef.current) return

    try {
      const { FaceDetection } = await import('@mediapipe/face_detection')
      
      detectorRef.current = new FaceDetection({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
        },
      })

      detectorRef.current.setOptions({
        model: 'short',
        minDetectionConfidence: minConfidence,
      })

      await detectorRef.current.initialize()
    } catch (err) {
      throw new Error(`얼굴 감지 초기화 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    }
  }, [minConfidence])

  // 얼굴 위치가 적절한지 확인
  const isFacePositionValid = useCallback((position: FacePosition, videoWidth: number, videoHeight: number): boolean => {
    // 얼굴 크기 확인
    const faceSize = Math.max(position.width / videoWidth, position.height / videoHeight)
    if (faceSize < minFaceSize || faceSize > maxFaceSize) {
      return false
    }

    // 얼굴이 중앙에 위치하는지 확인
    const centerX = position.x + position.width / 2
    const centerY = position.y + position.height / 2
    const videoCenterX = videoWidth / 2
    const videoCenterY = videoHeight / 2

    const offsetX = Math.abs(centerX - videoCenterX) / videoWidth
    const offsetY = Math.abs(centerY - videoCenterY) / videoHeight

    return offsetX < centerThreshold && offsetY < centerThreshold
  }, [minFaceSize, maxFaceSize, centerThreshold])

  // DataURL을 Blob으로 변환하는 헬퍼 함수
  const dataURLToBlob = useCallback((dataURL: string): Blob | null => {
    const arr = dataURL.split(',')
    if (arr.length < 2) return null
    
    const mimeMatch = arr[0].match(/:(.*?);/)
    if (!mimeMatch) return null
    
    const mime = mimeMatch[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    
    return new Blob([u8arr], { type: mime })
  }, [])

  // 사진 촬영
  const capturePhoto = useCallback((): File | null => {
    if (!canvasRef.current || !videoRef.current) return null

    const canvas = canvasRef.current
    const video = videoRef.current

    // Canvas 크기 설정
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // 비디오 프레임을 canvas에 그리기
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Canvas를 Blob으로 변환 (동기적으로 처리)
    try {
      const dataURL = canvas.toDataURL('image/jpeg', 0.9)
      const blob = dataURLToBlob(dataURL)
      if (!blob) return null

      return new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
    } catch (err) {
      console.error('Photo capture error:', err)
      return null
    }
  }, [dataURLToBlob])

  // 비디오 프레임 처리 및 얼굴 감지
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !detectorRef.current || !isStreaming) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame)
      return
    }

    // Canvas 크기 설정
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // 비디오 프레임을 canvas에 그리기
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    setIsDetecting(true)

    try {
      // 얼굴 감지 실행
      await new Promise<void>((resolve) => {
        detectorRef.current!.onResults((results: Results) => {
          const detections = results.detections || []
          
          if (detections.length === 1) {
            const detection = detections[0]
            const bbox = detection.boundingBox
            
            const position: FacePosition = {
              x: bbox.xCenter * canvas.width - (bbox.width * canvas.width) / 2,
              y: bbox.yCenter * canvas.height - (bbox.height * canvas.height) / 2,
              width: bbox.width * canvas.width,
              height: bbox.height * canvas.height,
              confidence: (detection as any).score || 0.8, // MediaPipe Detection 타입에 score가 없을 수 있음
            }

            setFacePosition(position)
            setFaceDetected(true)

            // 얼굴 위치가 적절한지 확인
            if (isFacePositionValid(position, canvas.width, canvas.height)) {
              // 적응형 스킵: 얼굴 움직임에 따라 동적으로 스킵 비율 조정
              const faceMovement = lastPositionRef.current
                ? Math.sqrt(
                    Math.pow(position.x - lastPositionRef.current.x, 2) +
                    Math.pow(position.y - lastPositionRef.current.y, 2)
                  ) / Math.max(canvas.width, canvas.height)
                : 0
              
              lastPositionRef.current = position
              
              // 움직임 히스토리 업데이트 (최근 10프레임)
              movementHistoryRef.current.push(faceMovement)
              if (movementHistoryRef.current.length > 10) {
                movementHistoryRef.current.shift()
              }
              
              // 평균 움직임 계산
              const avgMovement = movementHistoryRef.current.reduce((a, b) => a + b, 0) / movementHistoryRef.current.length
              
              // 움직임이 크면 더 자주 감지, 작으면 덜 감지
              if (avgMovement > 0.05) {
                adaptiveSkipRateRef.current = 2 // 빠른 움직임: 2프레임마다
              } else if (avgMovement < 0.01) {
                adaptiveSkipRateRef.current = 5 // 느린 움직임: 5프레임마다
              } else {
                adaptiveSkipRateRef.current = 3 // 보통: 3프레임마다
              }
              
              // 성능 최적화: 적응형 스킵 비율에 따라 각도 감지 실행
              frameSkipCountRef.current += 1
              const shouldDetectAngle = frameSkipCountRef.current % adaptiveSkipRateRef.current === 0 && !angleDetectionPendingRef.current
              
              // 캐싱: 이전 각도와 현재 위치가 비슷하면 캐시 사용
              const useCache = lastAngleRef.current && 
                currentFaceAngleRef.current &&
                lastPositionRef.current &&
                Math.abs(position.x - lastPositionRef.current.x) < canvas.width * 0.02 &&
                Math.abs(position.y - lastPositionRef.current.y) < canvas.height * 0.02

              // 캐시 사용 가능하고 각도가 유효하면 캐시 사용
              if (useCache && currentFaceAngleRef.current) {
                const cachedAngle = currentFaceAngleRef.current
                const isValid = isFaceAngleValid(cachedAngle, targetAngle)
                setAngleValid(isValid)
                angleValidRef.current = isValid
                
                if (isValid) {
                  stableFrameCountRef.current += 1
                  if (autoCapture && stableFrameCountRef.current >= stableFrames) {
                    stableFrameCountRef.current = 0
                    requestAnimationFrame(() => {
                      const file = capturePhoto()
                      if (file) {
                        onCapture(file)
                      }
                    })
                  }
                }
              } else if (shouldDetectAngle) {
                angleDetectionPendingRef.current = true
                
                // 각도 감지 실행 (비동기, 프레임 처리 블로킹 방지)
                detectFaceAngle(canvas)
                  .then((angle) => {
                    angleDetectionPendingRef.current = false
                    
                    if (angle) {
                      // 이전 각도와 비교하여 변화가 작으면 캐시로 간주
                      const angleChanged = !lastAngleRef.current || 
                        Math.abs(angle.yaw - lastAngleRef.current.yaw) > angleChangeThreshold ||
                        Math.abs(angle.pitch - lastAngleRef.current.pitch) > angleChangeThreshold ||
                        Math.abs(angle.roll - lastAngleRef.current.roll) > angleChangeThreshold
                      
                      if (angleChanged) {
                        lastAngleRef.current = angle
                        currentFaceAngleRef.current = angle
                        setCurrentAngle(angle)
                        
                        // 각도가 목표 각도에 적합한지 확인
                        const isValid = isFaceAngleValid(angle, targetAngle)
                        setAngleValid(isValid)
                        angleValidRef.current = isValid
                        
                        if (isValid) {
                          stableFrameCountRef.current += 1

                          // 안정적인 프레임 수에 도달하면 자동 촬영
                          if (autoCapture && stableFrameCountRef.current >= stableFrames) {
                            stableFrameCountRef.current = 0
                            // 다음 프레임에서 촬영 (UI 업데이트 완료 후)
                            requestAnimationFrame(() => {
                              const file = capturePhoto()
                              if (file) {
                                onCapture(file)
                              }
                            })
                          }
                        } else {
                          stableFrameCountRef.current = 0
                        }
                      } else {
                        // 각도 변화가 작으면 이전 각도 재사용 (캐싱)
                        if (currentFaceAngleRef.current) {
                          const isValid = isFaceAngleValid(currentFaceAngleRef.current, targetAngle)
                          setAngleValid(isValid)
                          angleValidRef.current = isValid
                          
                          if (isValid) {
                            stableFrameCountRef.current += 1
                            if (autoCapture && stableFrameCountRef.current >= stableFrames) {
                              stableFrameCountRef.current = 0
                              requestAnimationFrame(() => {
                                const file = capturePhoto()
                                if (file) {
                                  onCapture(file)
                                }
                              })
                            }
                          }
                        }
                      }
                    } else {
                      setCurrentAngle(null)
                      setAngleValid(false)
                      angleValidRef.current = false
                      stableFrameCountRef.current = 0
                    }
                  })
                  .catch((err) => {
                    angleDetectionPendingRef.current = false
                    console.error('Angle detection error:', err)
                    setCurrentAngle(null)
                    setAngleValid(false)
                    angleValidRef.current = false
                    stableFrameCountRef.current = 0
                  })
              } else {
                // 각도 감지 스킵 시, 이전 각도가 유효하면 카운터 증가
                if (angleValidRef.current && stableFrameCountRef.current > 0) {
                  stableFrameCountRef.current += 1
                  if (autoCapture && stableFrameCountRef.current >= stableFrames) {
                    stableFrameCountRef.current = 0
                    requestAnimationFrame(() => {
                      const file = capturePhoto()
                      if (file) {
                        onCapture(file)
                      }
                    })
                  }
                }
              }
            } else {
              setCurrentAngle(null)
              setAngleValid(false)
              angleValidRef.current = false
              stableFrameCountRef.current = 0
              frameSkipCountRef.current = 0
              movementHistoryRef.current = []
              lastPositionRef.current = null
            }
          } else {
            setFaceDetected(false)
            setFacePosition(null)
            setCurrentAngle(null)
            setAngleValid(false)
            angleValidRef.current = false
            stableFrameCountRef.current = 0
            frameSkipCountRef.current = 0
            angleDetectionPendingRef.current = false
            movementHistoryRef.current = []
            lastAngleRef.current = null
            lastPositionRef.current = null
          }

          resolve()
        })

        detectorRef.current!.send({ image: canvas })
      })
    } catch (err) {
      console.error('Face detection error:', err)
    } finally {
      setIsDetecting(false)
      animationFrameRef.current = requestAnimationFrame(processFrame)
    }
  }, [isStreaming, autoCapture, stableFrames, isFacePositionValid, onCapture, capturePhoto, detectFaceAngle, targetAngle])

  // 카메라 시작
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      
      // 얼굴 감지 초기화
      await initializeDetector()

      // 카메라 스트림 가져오기
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // 전면 카메라
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsStreaming(true)
        
        // 프레임 처리 시작
        processFrame()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '카메라 접근 실패'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [initializeDetector, processFrame])

  // 카메라 중지
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsStreaming(false)
    setFaceDetected(false)
    setFacePosition(null)
    stableFrameCountRef.current = 0
  }, [])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopCamera()
      if (detectorRef.current) {
        detectorRef.current.close()
        detectorRef.current = null
      }
    }
  }, [stopCamera])

  return {
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
    isStreaming,
    isDetecting,
    faceDetected,
    facePosition,
    startCamera,
    stopCamera,
    capturePhoto,
    error,
    currentAngle,
    angleValid,
  }
}

