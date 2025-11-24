'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Webcam from 'react-webcam'
import type { FaceMesh as FaceMeshType, NormalizedLandmark } from '@mediapipe/face_mesh'

interface ARCameraProps {
  className?: string
}

export default function ARCamera({ className = '' }: ARCameraProps) {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const faceMeshRef = useRef<FaceMeshType | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const scanLineYRef = useRef<number>(0)
  const scanDirectionRef = useRef<number>(1) // 1: 아래로, -1: 위로
  const [isModelReady, setIsModelReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [isCameraLoading, setIsCameraLoading] = useState(true)
  const [isMockMode, setIsMockMode] = useState(false)
  const [scanStatus, setScanStatus] = useState<'scanning' | 'analyzing' | 'completed'>('scanning')
  const [scanProgress, setScanProgress] = useState(0)
  const router = useRouter()
  const landmarksRef = useRef<any[] | null>(null) // 랜드마크 저장용
  const [isFaceDetected, setIsFaceDetected] = useState(false) // 얼굴 감지 상태
  const [faceDetectionStartTime, setFaceDetectionStartTime] = useState<number | null>(null) // 얼굴 감지 시작 시간
  const faceDetectionDurationRef = useRef<number>(0) // 얼굴 감지 지속 시간 (ms)
  const [faceAlignment, setFaceAlignment] = useState<'none' | 'aligned'>('none') // 얼굴 정렬 상태
  const faceAlignmentStartTimeRef = useRef<number | null>(null) // 얼굴 정렬 시작 시간

  // FaceMesh 초기화
  useEffect(() => {
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

          // 캔버스 초기화
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // 얼굴 감지 및 정렬 검증 (Mock 모드가 아닐 때만)
          if (!isMockMode) {
            let faceDetected = false
            let faceAligned = false

            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
              const landmarks = results.multiFaceLandmarks[0]
              
              // 얼굴 크기 계산 (화면 대비 비율)
              const faceBounds = calculateFaceBounds(landmarks, canvas.width, canvas.height)
              const faceArea = faceBounds.width * faceBounds.height
              const screenArea = canvas.width * canvas.height
              const faceAreaRatio = faceArea / screenArea
              
              // 얼굴이 화면의 20% 이상 차지해야 유효
              const faceSizeValid = faceAreaRatio >= 0.2
              faceDetected = faceSizeValid

              if (faceDetected) {
                // 얼굴 정렬 검사 (Face ID 스타일)
                faceAligned = checkFaceAlignment(landmarks, canvas.width, canvas.height, faceBounds)
                
                landmarksRef.current = landmarks // 랜드마크 저장
                drawFaceTessellation(ctx, landmarks, canvas.width, canvas.height)
                drawProblemArea(ctx, landmarks, canvas.width, canvas.height)
                
                // 얼굴 감지 시작 시간 기록
                const now = Date.now()
                if (faceDetectionStartTime === null) {
                  setFaceDetectionStartTime(now)
                  faceDetectionDurationRef.current = 0
                } else {
                  // 얼굴 감지 지속 시간 업데이트
                  faceDetectionDurationRef.current = now - faceDetectionStartTime
                }

                // 얼굴 정렬 상태 업데이트
                if (faceAligned) {
                  if (faceAlignmentStartTimeRef.current === null) {
                    faceAlignmentStartTimeRef.current = now
                  }
                  setFaceAlignment('aligned')
                } else {
                  faceAlignmentStartTimeRef.current = null
                  setFaceAlignment('none')
                }
              } else {
                // 얼굴이 너무 작으면 감지 실패로 처리
                setFaceDetectionStartTime(null)
                faceDetectionDurationRef.current = 0
                faceAlignmentStartTimeRef.current = null
                setFaceAlignment('none')
              }
            } else {
              // 얼굴이 감지되지 않음
              setFaceDetectionStartTime(null)
              faceDetectionDurationRef.current = 0
              faceAlignmentStartTimeRef.current = null
              setFaceAlignment('none')
            }

            // 얼굴 감지 상태 업데이트
            setIsFaceDetected(faceDetected)
          } else {
            // Mock 모드: 항상 얼굴이 감지되고 정렬된 것으로 처리
            setIsFaceDetected(true)
            setFaceAlignment('aligned')
            const now = Date.now()
            if (faceAlignmentStartTimeRef.current === null) {
              faceAlignmentStartTimeRef.current = now
            }
          }

          // 스캔 라인 애니메이션
          drawScanLine(ctx, canvas.width, canvas.height)
        })

        faceMeshRef.current = faceMesh
        setIsModelReady(true)
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
  }, [])

  // 얼굴 경계 계산 (너비, 높이, 중심점)
  const calculateFaceBounds = (
    landmarks: NormalizedLandmark[],
    width: number,
    height: number
  ): { x: number; y: number; width: number; height: number; centerX: number; centerY: number } => {
    if (landmarks.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0, centerX: 0, centerY: 0 }
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    landmarks.forEach((landmark) => {
      const x = landmark.x * width
      const y = landmark.y * height
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    })

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    }
  }

  // 얼굴 정렬 검사 (Face ID 스타일 - 엄격한 판정)
  const checkFaceAlignment = (
    landmarks: NormalizedLandmark[],
    screenWidth: number,
    screenHeight: number,
    faceBounds: { centerX: number; centerY: number; width: number; height: number }
  ): boolean => {
    // 가이드라인 크기 (화면 너비의 85%, 높이의 65%) - 확대됨
    const guideWidth = screenWidth * 0.85
    const guideHeight = screenHeight * 0.65
    const guideCenterX = screenWidth / 2
    const guideCenterY = screenHeight / 2

    // Nose Tip 랜드마크 인덱스 (MediaPipe Face Mesh에서 코 끝)
    // MediaPipe Face Mesh: 인덱스 1 = 코 끝 (Nose Tip), 인덱스 4 = 코 중간
    const noseTipIndex = 1 // MediaPipe Face Mesh의 코 끝 랜드마크
    if (noseTipIndex >= landmarks.length) return false

    const noseTip = landmarks[noseTipIndex]
    const noseTipX = noseTip.x * screenWidth
    const noseTipY = noseTip.y * screenHeight

    // 조건 1: 얼굴 중심점(Nose Tip)이 화면 중심에서 10% 이내인지 검사
    const centerXDiff = Math.abs(noseTipX - guideCenterX)
    const centerYDiff = Math.abs(noseTipY - guideCenterY)
    const maxCenterDiffX = screenWidth * 0.1 // 10% 허용 오차
    const maxCenterDiffY = screenHeight * 0.1 // 10% 허용 오차

    const isCentered = centerXDiff <= maxCenterDiffX && centerYDiff <= maxCenterDiffY

    // 조건 2: 얼굴이 가이드라인을 거의 꽉 채워야 함 (엄격한 판정)
    // 얼굴 너비가 가이드라인 너비의 90% 이상이어야 함 (고화질 텍스처 확보)
    const faceWidthRatio = faceBounds.width / guideWidth
    const faceHeightRatio = faceBounds.height / guideHeight
    const minFillRatio = 0.9 // 90% 이상 채워야 함 (더 엄격)

    // 얼굴 너비가 가이드라인 너비의 90% 이상일 때만 통과
    const isFilled = faceWidthRatio >= minFillRatio && faceHeightRatio >= minFillRatio

    return isCentered && isFilled
  }

  // 얼굴 윤곽선 (Tessellation) 그리기
  const drawFaceTessellation = (
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    width: number,
    height: number
  ) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 0.5
    ctx.beginPath()

    // MediaPipe FaceMesh Tessellation 연결 정보
    // 주요 얼굴 윤곽선 포인트들을 연결
    const faceOutline = [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10
    ]

    // 얼굴 윤곽선 그리기
    for (let i = 0; i < faceOutline.length; i++) {
      const idx = faceOutline[i]
      if (idx < landmarks.length) {
        const x = landmarks[idx].x * width
        const y = landmarks[idx].y * height

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
    }
    ctx.closePath()
    ctx.stroke()

    // 추가 얼굴 메쉬 연결선 (더 세밀한 tessellation)
    const connections = [
      // 눈 주변
      [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
      [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
      // 입 주변
      [61, 146, 91, 181, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318],
    ]

    connections.forEach((connection) => {
      ctx.beginPath()
      for (let i = 0; i < connection.length; i++) {
        const idx = connection[i]
        if (idx < landmarks.length) {
          const x = landmarks[idx].x * width
          const y = landmarks[idx].y * height

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
      }
      ctx.closePath()
      ctx.stroke()
    })
  }

  // 문제 부위 시각화 (오른쪽 볼 위치)
  const drawProblemArea = (
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    width: number,
    height: number
  ) => {
    // 오른쪽 볼 랜드마크 인덱스 (대략적인 위치)
    // MediaPipe FaceMesh에서 볼 영역은 대략 234, 454, 227, 116, 117, 118, 119, 120, 121, 126, 142, 36, 205, 206, 207 등
    // 오른쪽 볼 중심부: 인덱스 234, 454 주변
    const rightCheekIndices = [234, 227, 116, 117, 118, 119, 120, 121, 126, 142, 36, 205, 206, 207, 454]
    
    if (rightCheekIndices.length === 0) return

    // 오른쪽 볼 중심점 계산
    let sumX = 0
    let sumY = 0
    let count = 0

    rightCheekIndices.forEach((idx) => {
      if (idx < landmarks.length) {
        sumX += landmarks[idx].x * width
        sumY += landmarks[idx].y * height
        count++
      }
    })

    if (count === 0) return

    const centerX = sumX / count
    const centerY = sumY / count

    // 빨간색 반투명 원 그리기 (기미/색소 침착 시각화)
    const radius = 40
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'
    ctx.lineWidth = 2

    // 외곽 원
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 내부 원 (더 진한 색)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'
    ctx.fill()

    // 타겟 십자선
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(centerX - radius * 0.8, centerY)
    ctx.lineTo(centerX + radius * 0.8, centerY)
    ctx.moveTo(centerX, centerY - radius * 0.8)
    ctx.lineTo(centerX, centerY + radius * 0.8)
    ctx.stroke()
  }

  // 스캔 라인 애니메이션
  const drawScanLine = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 분석 중일 때는 깜빡이는 효과
    if (scanStatus === 'analyzing') {
      const blink = Math.sin(Date.now() / 100) > 0
      if (!blink) return // 깜빡임 효과
    }

    // 스캔 중일 때만 라인 이동
    if (scanStatus === 'scanning') {
      scanLineYRef.current += scanDirectionRef.current * 2 // 속도 조절

      // 경계 체크 및 방향 전환
      if (scanLineYRef.current >= height) {
        scanLineYRef.current = height
        scanDirectionRef.current = -1
      } else if (scanLineYRef.current <= 0) {
        scanLineYRef.current = 0
        scanDirectionRef.current = 1
      }
    }

    // 파란색 스캔 라인 그리기
    const lineY = scanStatus === 'scanning' ? scanLineYRef.current : height / 2
    const gradient = ctx.createLinearGradient(0, lineY - 10, 0, lineY + 10)
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0)') // blue-500 투명
    gradient.addColorStop(0.5, scanStatus === 'analyzing' ? 'rgba(59, 130, 246, 1)' : 'rgba(59, 130, 246, 0.8)') // 분석 중일 때 더 진하게
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)') // blue-500 투명

    ctx.strokeStyle = gradient
    ctx.lineWidth = scanStatus === 'analyzing' ? 4 : 3
    ctx.beginPath()
    ctx.moveTo(0, lineY)
    ctx.lineTo(width, lineY)
    ctx.stroke()

    // 스캔 라인 위아래 글로우 효과
    ctx.shadowBlur = scanStatus === 'analyzing' ? 20 : 15
    ctx.shadowColor = 'rgba(59, 130, 246, 0.6)'
    ctx.stroke()
    ctx.shadowBlur = 0
  }

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

  // Webcam 준비 완료 시 프레임 처리 시작
  const handleUserMedia = useCallback(() => {
    setCameraError(null)
    setIsCameraReady(true)
    setIsCameraLoading(false)
    setScanStatus('scanning')
    setScanProgress(0)
    
    if (isModelReady) {
      setTimeout(() => {
        processFrame()
      }, 500)
    }
  }, [isModelReady, processFrame])

  // Mock Mode 활성화 시에도 스캔 시작 및 얼굴 감지 상태 설정
  useEffect(() => {
    if (isMockMode && !isCameraLoading) {
      setScanStatus('scanning')
      setScanProgress(0)
      // Mock 모드에서는 항상 얼굴이 감지된 것으로 간주
      setIsFaceDetected(true)
      setFaceDetectionStartTime(Date.now())
      faceDetectionDurationRef.current = 0
    } else if (!isMockMode) {
      // 실제 카메라 모드로 전환 시 얼굴 감지 상태 초기화
      setIsFaceDetected(false)
      setFaceDetectionStartTime(null)
      faceDetectionDurationRef.current = 0
    }
  }, [isMockMode, isCameraLoading])

  // 카메라 에러 처리 - Mock Mode로 전환
  const handleUserMediaError = useCallback((error: string | DOMException) => {
    console.warn('Camera error - switching to Mock Mode:', error)
    setIsCameraLoading(false)
    setIsCameraReady(false)
    setIsMockMode(true)
    setCameraError(null) // 에러 화면 대신 Mock Mode 사용
  }, [])

  // 카메라 재시도
  const handleRetry = useCallback(() => {
    setCameraError(null)
    setIsCameraLoading(true)
    setIsCameraReady(false)
    setIsMockMode(false)
    
    // 페이지 새로고침으로 카메라 재요청
    window.location.reload()
  }, [])

  // 이미지 캡처 및 네비게이션 처리 함수
  const handleCaptureAndNavigate = useCallback(() => {
    try {
      const video = webcamRef.current?.video
      if (video || isMockMode) {
        const tempCanvas = document.createElement('canvas')
        if (isMockMode) {
          // Mock 모드일 경우 Mock 이미지 사용
          const mockImg = new Image()
          mockImg.crossOrigin = 'anonymous'
          mockImg.onload = () => {
            tempCanvas.width = mockImg.width
            tempCanvas.height = mockImg.height
            const tempCtx = tempCanvas.getContext('2d')
            if (tempCtx) {
              tempCtx.drawImage(mockImg, 0, 0)
              const imageData = tempCanvas.toDataURL('image/jpeg', 0.9)
              sessionStorage.setItem('skinAnalysisImage', imageData)
              if (landmarksRef.current) {
                sessionStorage.setItem('skinAnalysisLandmarks', JSON.stringify(landmarksRef.current))
              }
            }
            // 카메라 cleanup
            if (webcamRef.current?.video?.srcObject) {
              const stream = webcamRef.current.video.srcObject as MediaStream
              stream.getTracks().forEach(track => track.stop())
            }
            // 페이지 이동
            router.push('/report')
          }
          mockImg.onerror = () => {
            console.error('Failed to load mock image')
            router.push('/report')
          }
          mockImg.src = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop'
        } else if (video) {
          // 실제 카메라일 경우 비디오 프레임 캡처
          tempCanvas.width = video.videoWidth
          tempCanvas.height = video.videoHeight
          const tempCtx = tempCanvas.getContext('2d')
          if (tempCtx) {
            tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height)
            const imageData = tempCanvas.toDataURL('image/jpeg', 0.9)
            sessionStorage.setItem('skinAnalysisImage', imageData)
            if (landmarksRef.current) {
              sessionStorage.setItem('skinAnalysisLandmarks', JSON.stringify(landmarksRef.current))
            }
          }
          // 카메라 cleanup
          if (webcamRef.current?.video?.srcObject) {
            const stream = webcamRef.current.video.srcObject as MediaStream
            stream.getTracks().forEach(track => track.stop())
          }
          // 페이지 이동
          router.push('/report')
        }
      }
    } catch (error) {
      console.error('Failed to save image/landmarks:', error)
      // 에러가 발생해도 페이지 이동
      if (webcamRef.current?.video?.srcObject) {
        const stream = webcamRef.current.video.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
      router.push('/report')
    }
  }, [isMockMode, router])

  // 자동 분석 흐름 타이머 (얼굴이 정렬된 상태에서 2초 이상 유지될 때만 실행)
  useEffect(() => {
    if ((isCameraReady || isMockMode) && !isCameraLoading && !cameraError && scanStatus === 'scanning') {
      let hasStartedAnalysis = false // 중복 실행 방지
      
      // 얼굴이 정렬된 상태에서 2초 이상 유지되는지 확인하는 인터벌
      const checkFaceAlignmentInterval = setInterval(() => {
        if (hasStartedAnalysis) return // 이미 분석이 시작되었으면 중단
        
        // Mock 모드일 경우 항상 얼굴이 정렬된 것으로 간주 (2초 대기)
        if (isMockMode) {
          const mockStartTime = faceAlignmentStartTimeRef.current || Date.now()
          const mockDuration = Date.now() - mockStartTime
          if (mockDuration >= 2000) {
            hasStartedAnalysis = true
            setScanStatus('analyzing')
            setScanProgress(100)
            
            // 분석 1.5초 후 페이지 이동
            setTimeout(() => {
              setScanStatus('completed')
              handleCaptureAndNavigate()
            }, 1500)
          }
          return
        }

        // 실제 카메라 모드: 얼굴이 정렬된 상태에서 2초 이상 유지된 경우에만 진행
        if (faceAlignment === 'aligned' && faceAlignmentStartTimeRef.current !== null) {
          const alignmentDuration = Date.now() - faceAlignmentStartTimeRef.current
          if (alignmentDuration >= 2000) {
            hasStartedAnalysis = true
            setScanStatus('analyzing')
            setScanProgress(100)
            
            // 분석 1.5초 후 페이지 이동
            setTimeout(() => {
              setScanStatus('completed')
              handleCaptureAndNavigate()
            }, 1500)
          }
        }
      }, 100) // 100ms마다 체크

      return () => {
        clearInterval(checkFaceAlignmentInterval)
      }
    }
  }, [isCameraReady, isMockMode, isCameraLoading, cameraError, faceAlignment, scanStatus, handleCaptureAndNavigate])

  // 스캔 진행률 업데이트
  useEffect(() => {
    if (scanStatus === 'scanning' && (isCameraReady || isMockMode)) {
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          const newProgress = prev + (100 / 30) // 3초 동안 100% 도달
          return newProgress >= 100 ? 100 : newProgress
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [scanStatus, isCameraReady, isMockMode])

  // Canvas 애니메이션 (스캔 라인 그리기)
  useEffect(() => {
    if ((isCameraReady || isMockMode) && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      let isAnimating = true

      const animate = () => {
        if (!isAnimating || scanStatus === 'completed') return
        
        // Canvas 크기 설정
        const container = canvas.parentElement
        if (container) {
          canvas.width = container.clientWidth || 640
          canvas.height = container.clientHeight || 480
        } else {
          canvas.width = 640
          canvas.height = 480
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        drawScanLine(ctx, canvas.width, canvas.height)
        
        if (isAnimating) {
          requestAnimationFrame(animate)
        }
      }
      
      const frameId = requestAnimationFrame(animate)
      
      return () => {
        isAnimating = false
        cancelAnimationFrame(frameId)
      }
    }
  }, [isCameraReady, isMockMode, scanStatus])

  // 모델이 준비되면 프레임 처리 시작
  useEffect(() => {
    if (isModelReady && webcamRef.current?.video) {
      const video = webcamRef.current.video
      if (video.readyState >= video.HAVE_METADATA) {
        processFrame()
      }
    }
  }, [isModelReady, processFrame])

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Dev Mode 뱃지 */}
      {isMockMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-yellow-500/90 backdrop-blur-sm rounded-full flex items-center gap-2">
          <span className="text-xs">⚠️</span>
          <span className="text-xs font-semibold text-black">Dev Mode: Camera Mockup</span>
        </div>
      )}

      {/* Webcam 또는 Mock 이미지 */}
      {isMockMode ? (
        <img
          src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop"
          alt="Mock face for development"
          className="absolute inset-0 w-full h-full object-cover bg-gray-900"
        />
      ) : (
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: 'user',
          }}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          className="absolute inset-0 w-full h-full object-cover bg-gray-900"
          mirrored
        />
      )}

      {/* Canvas (AR 오버레이) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* 얼굴 가이드라인 오버레이 (Face ID 스타일 - 확대된 가이드) */}
      {(isCameraReady || isMockMode) && scanStatus !== 'completed' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-15">
          {/* 타원형 가이드라인 (화면 너비의 85%, 높이의 65%) - 확대됨 */}
          <div className="relative w-[85%] h-[65%]">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 280 260"
              className="relative"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* 외곽 타원형 가이드라인 */}
              <ellipse
                cx="140"
                cy="130"
                rx="119"
                ry="117"
                fill="none"
                stroke={faceAlignment === 'aligned' || isMockMode ? '#00FFC2' : '#FFFFFF'}
                strokeWidth={faceAlignment === 'aligned' || isMockMode ? '4' : '2'}
                strokeDasharray={faceAlignment === 'aligned' || isMockMode ? '0' : '8 8'}
                opacity={faceAlignment === 'aligned' || isMockMode ? 1 : 0.6}
                className="transition-all duration-300"
                style={{
                  filter: faceAlignment === 'aligned' || isMockMode 
                    ? 'drop-shadow(0 0 12px rgba(0, 255, 194, 0.8)) drop-shadow(0 0 24px rgba(0, 255, 194, 0.4))'
                    : 'none',
                }}
              />
              {/* 내부 가이드 (더 작은 타원) */}
              <ellipse
                cx="140"
                cy="130"
                rx="102"
                ry="100"
                fill="none"
                stroke={faceAlignment === 'aligned' || isMockMode ? '#00FFC2' : '#FFFFFF'}
                strokeWidth={faceAlignment === 'aligned' || isMockMode ? '2' : '1'}
                strokeDasharray={faceAlignment === 'aligned' || isMockMode ? '0' : '4 4'}
                opacity={faceAlignment === 'aligned' || isMockMode ? 0.6 : 0.3}
                className="transition-all duration-300"
              />
            </svg>
            
            {/* 가이드라인 중앙 텍스트 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-8">
              <p 
                className={`text-base font-semibold transition-colors duration-300 ${
                  faceAlignment === 'aligned' || isMockMode 
                    ? 'text-[#00FFC2]' 
                    : 'text-white'
                }`}
                style={{
                  textShadow: faceAlignment === 'aligned' || isMockMode
                    ? '0 0 8px rgba(0, 255, 194, 0.8)'
                    : 'none',
                }}
              >
                {faceAlignment === 'aligned' || isMockMode
                  ? '완벽해요! 움직이지 마세요'
                  : isFaceDetected
                  ? '얼굴을 화면에 크게 맞춰주세요'
                  : '얼굴을 화면에 크게 맞춰주세요'}
              </p>
              {faceAlignment !== 'aligned' && !isMockMode && isFaceDetected && (
                <p className="text-xs text-gray-400 mt-2">
                  더 가까이 오세요
                </p>
              )}
              {!isFaceDetected && !isMockMode && (
                <p className="text-xs text-gray-400 mt-2">
                  얼굴을 찾을 수 없습니다
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 스캔 상태 표시 */}
      {(isCameraReady || isMockMode) && scanStatus !== 'completed' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-center px-6">
          <div className="bg-black/70 backdrop-blur-md rounded-full px-6 py-3 inline-block">
            <p className="text-white text-sm font-medium mb-1">
              {scanStatus === 'scanning' ? '피부 표면 스캔 중...' : '데이터 분석 중...'}
            </p>
            {scanStatus === 'scanning' && (
              <div className="w-48 h-1 bg-gray-700 rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-[#00FFC2] transition-all duration-100 ease-linear"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            )}
            {scanStatus === 'analyzing' && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="w-2 h-2 bg-[#00FFC2] rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-[#00FFC2] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-[#00FFC2] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 카메라 로딩 상태 */}
      {isCameraLoading && !cameraError && !isMockMode && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm z-10">
          <div className="text-center px-4">
            <div className="w-12 h-12 border-4 border-[#00FFC2] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-base font-medium mb-1">AI 카메라 연결 중...</p>
            <p className="text-gray-400 text-xs">잠시만 기다려주세요</p>
          </div>
        </div>
      )}

      {/* AR 모델 로딩 상태 (카메라는 준비되었지만 모델이 아직 로딩 중) */}
      {isCameraReady && !isModelReady && !cameraError && !isMockMode && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm z-10">
          <div className="text-center px-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white text-sm font-medium mb-1">AR 모델 로딩 중...</p>
            <p className="text-gray-400 text-xs">잠시만 기다려주세요</p>
          </div>
        </div>
      )}

      {/* Mock Mode일 때 AR 모델 로딩 상태 */}
      {isMockMode && !isModelReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
          <div className="text-center px-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white text-sm font-medium mb-1">AR 모델 로딩 중...</p>
            <p className="text-gray-400 text-xs">Mock Mode에서 실행 중</p>
          </div>
        </div>
      )}

      {/* 카메라 에러 상태 (Mock Mode가 아닐 때만 표시) */}
      {cameraError && !isMockMode && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm z-10">
          <div className="text-center px-6 max-w-sm">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-white text-base font-medium mb-2">카메라 접근 실패</p>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">{cameraError}</p>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-[#00FFC2] text-black font-semibold rounded-xl hover:bg-[#00E6B8] transition-colors"
            >
              재시도
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


