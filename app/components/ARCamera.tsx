'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Webcam from 'react-webcam'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import type { FaceMesh as FaceMeshType, NormalizedLandmark } from '@mediapipe/face_mesh'

interface ARCameraProps {
  className?: string
  onComplete?: () => void // 분석 완료 시 콜백 (모달 닫기 등)
  isReady?: boolean // 카메라 초기화 준비 완료 여부 (Lazy Initialization)
}

// 🎯 이원화 전략 상수 (Dual Strategy Constants)
const TRACKING_CANVAS_WIDTH = 360 // 트래킹용 축소 캔버스 너비 (성능 최적화)
const CAPTURE_WIDTH = 1920 // 캡처용 고해상도 너비
const CAPTURE_HEIGHT = 1080 // 캡처용 고해상도 높이
const CAPTURE_QUALITY = 1.0 // 캡처 품질 (1.0 = 무압축, 최고 화질)

export default function ARCamera({ className = '', onComplete, isReady = true }: ARCameraProps) {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const trackingCanvasRef = useRef<HTMLCanvasElement | null>(null) // 🚀 트래킹용 축소 캔버스 (MediaPipe 연산용)
  const faceMeshRef = useRef<FaceMeshType | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const scanLineYRef = useRef<number>(0)
  const scanDirectionRef = useRef<number>(1) // 1: 아래로, -1: 위로
  const [isModelReady, setIsModelReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [isCameraLoading, setIsCameraLoading] = useState(true)
  const [isMockMode, setIsMockMode] = useState(false)
  const [scanningStage, setScanningStage] = useState<'idle' | 'scanning' | 'processing' | 'complete'>('idle')
  const [bottomMessage, setBottomMessage] = useState('얼굴을 가이드 안에 맞춰주세요')
  const [isShutterDisabled, setIsShutterDisabled] = useState(true)
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null) // 📸 정지 프레임 이미지
  const [laserProgress, setLaserProgress] = useState(0) // 레이저 진행률 (0-100) - Mesh Reveal용
  const [showDataTransfer, setShowDataTransfer] = useState(false) // 데이터 전송 연출 상태
  const router = useRouter()
  const laserControls = useAnimation() // 레이저 바 애니메이션 컨트롤
  const faceMeshControls = useAnimation() // 얼굴 메쉬 펄스 애니메이션 컨트롤
  const fadeControls = useAnimation() // 페이드 아웃 애니메이션 컨트롤
  const rippleControls = useAnimation() // 원형 파동 애니메이션 컨트롤
  const landmarksRef = useRef<any[] | null>(null) // 랜드마크 저장용
  const [isFaceDetected, setIsFaceDetected] = useState(false) // 얼굴 감지 상태
  const [faceDetectionStartTime, setFaceDetectionStartTime] = useState<number | null>(null) // 얼굴 감지 시작 시간
  const faceDetectionDurationRef = useRef<number>(0) // 얼굴 감지 지속 시간 (ms)
  const [faceAlignment, setFaceAlignment] = useState<'none' | 'aligned'>('none') // 얼굴 정렬 상태
  const faceAlignmentStartTimeRef = useRef<number | null>(null) // 얼굴 정렬 시작 시간
  const [guideMessage, setGuideMessage] = useState('얼굴을 가이드 안에 맞춰주세요') // 실시간 가이드 메시지
  const [guideColor, setGuideColor] = useState<'white' | 'yellow' | 'mint'>('white') // 가이드라인 색상
  const [lightingStatus, setLightingStatus] = useState<'ok' | 'too-dark'>('ok') // 조명 상태
  const [poseStatus, setPoseStatus] = useState<'ok' | 'not-frontal'>('ok') // 얼굴 각도 상태
  const lastLightingCheckRef = useRef<number>(0) // 마지막 조명 검사 시간 (성능 최적화)
  const [isScreenLightOn, setIsScreenLightOn] = useState(false) // 화면 조명 상태
  
  // 🎯 핸즈프리 오토 캡처 상태
  const lockOnStartTimeRef = useRef<number | null>(null) // 락온 시작 시간
  const [lockOnProgress, setLockOnProgress] = useState(0) // 락온 진행률 (0-100)
  const [countdownText, setCountdownText] = useState<string | null>(null) // 카운트다운 텍스트
  const autoCaptureTriggeredRef = useRef(false) // 오토 캡처 중복 실행 방지
  const executeCinematicSequenceRef = useRef<(() => void) | null>(null) // 시네마틱 시퀀스 함수 ref
  const isCleanedUpRef = useRef(false) // 🧹 메모리 cleanup 상태 추적

  // 🧹 메모리 누수 방지: 컴포넌트 언마운트 시 전체 리소스 정리
  useEffect(() => {
    isCleanedUpRef.current = false

    return () => {
      console.log('🧹 [ARCamera] Cleanup: Releasing all resources...')
      isCleanedUpRef.current = true

      // 1. Animation Frame 취소
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
        console.log('🧹 [ARCamera] Animation frame cancelled')
      }

      // 2. FaceMesh 인스턴스 종료
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close()
          faceMeshRef.current = null
          console.log('🧹 [ARCamera] FaceMesh instance closed')
        } catch (error) {
          console.warn('🧹 [ARCamera] Error closing FaceMesh:', error)
        }
      }

      // 3. 카메라 스트림 종료 (모든 트랙 stop)
      if (webcamRef.current?.video?.srcObject) {
        try {
          const stream = webcamRef.current.video.srcObject as MediaStream
          stream.getTracks().forEach((track) => {
            track.stop()
            console.log(`🧹 [ARCamera] Camera track stopped: ${track.kind}`)
          })
          webcamRef.current.video.srcObject = null
          console.log('🧹 [ARCamera] Camera stream released')
        } catch (error) {
          console.warn('🧹 [ARCamera] Error stopping camera stream:', error)
        }
      }

      // 4. Canvas 정리
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
        console.log('🧹 [ARCamera] Canvas cleared')
      }

      // 4-1. 🚀 트래킹용 축소 캔버스 정리
      if (trackingCanvasRef.current) {
        trackingCanvasRef.current = null
        console.log('🧹 [ARCamera] Tracking canvas released')
      }

      // 5. 랜드마크 참조 정리
      landmarksRef.current = null

      // 6. 기타 ref 정리
      lockOnStartTimeRef.current = null
      executeCinematicSequenceRef.current = null
      faceAlignmentStartTimeRef.current = null

      console.log('🧹 [ARCamera] Cleanup complete!')
    }
  }, [])

  // FaceMesh 초기화 (isReady가 true일 때만)
  useEffect(() => {
    // 🚀 Lazy Initialization: isReady가 false면 초기화하지 않음
    if (!isReady) {
      return
    }

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
          const currentMockMode = isMockMode // 클로저 문제 해결

          if (!canvas) return

          const ctx = canvas.getContext('2d')
          if (!ctx) return

          // Mock 모드일 경우 이미지 크기 사용, 실제 모드일 경우 비디오 크기 사용
          let canvasWidth = 640
          let canvasHeight = 480
          
          if (currentMockMode) {
            // Mock 모드: 이미지 요소에서 크기 가져오기
            const mockImg = document.querySelector('img[alt="Mock face for development"]') as HTMLImageElement
            if (mockImg && mockImg.complete) {
              canvasWidth = mockImg.naturalWidth || 640
              canvasHeight = mockImg.naturalHeight || 480
            }
          } else if (video) {
            canvasWidth = video.videoWidth
            canvasHeight = video.videoHeight
          } else {
            return
          }

          // 캔버스 크기 설정
          canvas.width = canvasWidth
          canvas.height = canvasHeight

          // 캔버스 초기화
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // 얼굴 감지 및 정렬 검증
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
              // Mock 모드일 경우 항상 정렬된 것으로 간주, 실제 모드일 경우 검사
              if (currentMockMode) {
                faceAligned = true
                setLightingStatus('ok')
                setPoseStatus('ok')
                setGuideMessage('✨ 완벽해요! 움직이지 마세요')
                setGuideColor('mint')
              } else {
                // 얼굴 정렬 검사 및 실시간 피드백 (3단계 검증 시스템)
                const video = webcamRef.current?.video || null
                const alignmentResult = checkFaceAlignmentWithFeedback(landmarks, canvas.width, canvas.height, faceBounds, video)
                faceAligned = alignmentResult.aligned
                // guideMessage와 guideColor는 checkFaceAlignmentWithFeedback 내부에서 설정됨
              }
              
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
              if (!currentMockMode) {
                setFaceDetectionStartTime(null)
                faceDetectionDurationRef.current = 0
                faceAlignmentStartTimeRef.current = null
                setFaceAlignment('none')
                setLightingStatus('ok')
                setPoseStatus('ok')
                setGuideMessage('얼굴을 가이드 안에 맞춰주세요')
                setGuideColor('white')
              }
            }

            // 얼굴 감지 상태 업데이트
            setIsFaceDetected(faceDetected)
          } else {
            // 얼굴이 감지되지 않음
            if (!currentMockMode) {
              setIsFaceDetected(false)
              setFaceDetectionStartTime(null)
              faceDetectionDurationRef.current = 0
              faceAlignmentStartTimeRef.current = null
              setFaceAlignment('none')
              setLightingStatus('ok')
              setPoseStatus('ok')
              setGuideMessage('얼굴을 가이드 안에 맞춰주세요')
              setGuideColor('white')
            } else {
              // Mock 모드: 얼굴이 감지되지 않아도 정렬된 것으로 처리 (이미지 분석은 계속 진행)
              setIsFaceDetected(true)
              setFaceAlignment('aligned')
              const now = Date.now()
              if (faceAlignmentStartTimeRef.current === null) {
                faceAlignmentStartTimeRef.current = now
              }
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
      console.log('🧹 [ARCamera] FaceMesh useEffect cleanup triggered')
      isMounted = false
      
      // Animation frame 취소
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      
      // FaceMesh 인스턴스 종료 (메인 cleanup에서 중복 체크하므로 여기서도 처리)
      if (faceMeshRef.current && !isCleanedUpRef.current) {
        try {
          faceMeshRef.current.close()
          faceMeshRef.current = null
          console.log('🧹 [ARCamera] FaceMesh closed in useEffect cleanup')
        } catch (error) {
          console.warn('🧹 [ARCamera] Error in FaceMesh cleanup:', error)
        }
      }
      
      // 모델 준비 상태 리셋
      setIsModelReady(false)
    }
  }, [isReady]) // isReady가 true로 변경되면 초기화 실행

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

  // 조명(밝기) 감지 함수 (성능 최적화: 500ms마다만 실행)
  const checkLighting = (video: HTMLVideoElement | null, forceCheck: boolean = false): { ok: boolean; message: string } => {
    if (!video || video.readyState < video.HAVE_METADATA) {
      return { ok: true, message: '' } // 비디오가 준비되지 않았으면 통과
    }

    // 화면 조명이 켜져 있으면 조명 검사 통과
    if (isScreenLightOn) {
      return { ok: true, message: '' }
    }

    // 성능 최적화: 500ms마다만 조명 검사 실행 (강제 검사가 아닌 경우)
    const now = Date.now()
    if (!forceCheck && now - lastLightingCheckRef.current < 500) {
      // 마지막 검사 결과를 반환 (상태는 이미 업데이트됨)
      return lightingStatus === 'ok' 
        ? { ok: true, message: '' } 
        : { ok: false, message: '🚫 너무 어두워요! 밝은 곳으로 이동해주세요.' }
    }
    lastLightingCheckRef.current = now

    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return { ok: true, message: '' }

      // 비디오 프레임을 캔버스에 그리기
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // 중앙 영역 샘플링 (화면의 30% x 30% 영역)
      const sampleWidth = Math.floor(canvas.width * 0.3)
      const sampleHeight = Math.floor(canvas.height * 0.3)
      const startX = Math.floor((canvas.width - sampleWidth) / 2)
      const startY = Math.floor((canvas.height - sampleHeight) / 2)

      const imageData = ctx.getImageData(startX, startY, sampleWidth, sampleHeight)
      const data = imageData.data

      // 평균 밝기 계산 (Luminance 공식: 0.299*R + 0.587*G + 0.114*B)
      let totalLuminance = 0
      let pixelCount = 0

      // 샘플링 최적화: 모든 픽셀이 아닌 10픽셀마다 샘플링
      for (let i = 0; i < data.length; i += 40) { // 4 * 10 = 40 (RGBA * 10)
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b
        totalLuminance += luminance
        pixelCount++
      }

      const avgLuminance = totalLuminance / pixelCount

      if (avgLuminance < 80) {
        return { ok: false, message: '🚫 너무 어두워요! 밝은 곳으로 이동해주세요.' }
      }

      return { ok: true, message: '' }
    } catch (error) {
      console.error('Lighting check error:', error)
      return { ok: true, message: '' } // 에러 발생 시 통과
    }
  }

  // 얼굴 각도(Pose) 감지 함수
  const checkFacePose = (landmarks: NormalizedLandmark[]): { ok: boolean; message: string } => {
    if (landmarks.length < 468) {
      return { ok: true, message: '' } // 랜드마크가 부족하면 통과
    }

    try {
      // MediaPipe Face Mesh 랜드마크 인덱스
      const NOSE_TIP = 1 // 코끝
      const LEFT_EAR = 234 // 왼쪽 귀 (대략)
      const RIGHT_EAR = 454 // 오른쪽 귀 (대략)
      const CHIN = 18 // 턱
      const FOREHEAD = 10 // 이마 (대략)

      const noseTip = landmarks[NOSE_TIP]
      const leftEar = landmarks[LEFT_EAR]
      const rightEar = landmarks[RIGHT_EAR]
      const chin = landmarks[CHIN]
      const forehead = landmarks[FOREHEAD]

      // 좌우 회전(Yaw) 검사: 코끝과 양쪽 귀의 거리 비율
      const distLeft = Math.sqrt(
        Math.pow(noseTip.x - leftEar.x, 2) + Math.pow(noseTip.y - leftEar.y, 2)
      )
      const distRight = Math.sqrt(
        Math.pow(noseTip.x - rightEar.x, 2) + Math.pow(noseTip.y - rightEar.y, 2)
      )

      // 거리 비율이 1.3 이상 차이나면 옆을 보고 있는 것으로 판정
      const yawRatio = Math.max(distLeft, distRight) / Math.min(distLeft, distRight)
      if (yawRatio > 1.3) {
        return { ok: false, message: '👀 정면을 응시해주세요.' }
      }

      // 상하 기울기(Pitch) 검사: 코와 턱, 이마의 거리
      const distChin = Math.sqrt(
        Math.pow(noseTip.x - chin.x, 2) + Math.pow(noseTip.y - chin.y, 2)
      )
      const distForehead = Math.sqrt(
        Math.pow(noseTip.x - forehead.x, 2) + Math.pow(noseTip.y - forehead.y, 2)
      )

      // 코-턱 거리와 코-이마 거리의 비율이 비정상적이면 기울어짐
      const pitchRatio = Math.max(distChin, distForehead) / Math.min(distChin, distForehead)
      if (pitchRatio > 1.5) {
        return { ok: false, message: '👀 정면을 응시해주세요.' }
      }

      return { ok: true, message: '' }
    } catch (error) {
      console.error('Pose check error:', error)
      return { ok: true, message: '' } // 에러 발생 시 통과
    }
  }

  // 얼굴 정렬 검사 및 실시간 피드백 (Face ID 스타일 - 상세한 피드백 제공)
  const checkFaceAlignmentWithFeedback = (
    landmarks: NormalizedLandmark[],
    screenWidth: number,
    screenHeight: number,
    faceBounds: { centerX: number; centerY: number; width: number; height: number },
    video: HTMLVideoElement | null
  ): { aligned: boolean; message: string; color: 'white' | 'yellow' | 'mint' } => {
    // 가이드라인 크기 (화면 너비의 70%, 높이의 55%) - 얼굴 모양에 맞춘 타원형
    const guideWidth = screenWidth * 0.7
    const guideHeight = screenHeight * 0.55
    const guideCenterX = screenWidth / 2
    const guideCenterY = screenHeight * 0.4 // 화면 정중앙보다 약간 위쪽 (눈높이)

    // 3단계 검증 시스템 (우선순위 순서대로 체크)

    // 1단계: 조명(밝기) 검사 (우선순위 1위) - 화면 조명이 켜져 있으면 통과
    const lightingCheck = checkLighting(video)
    if (!lightingCheck.ok && !isScreenLightOn) {
      setLightingStatus('too-dark')
      setGuideMessage(lightingCheck.message)
      setGuideColor('yellow')
      return { aligned: false, message: lightingCheck.message, color: 'yellow' }
    }
    setLightingStatus('ok')

    // 2단계: 얼굴 각도(Pose) 검사 (우선순위 2위)
    const poseCheck = checkFacePose(landmarks)
    if (!poseCheck.ok) {
      setPoseStatus('not-frontal')
      setGuideMessage(poseCheck.message)
      setGuideColor('yellow')
      return { aligned: false, message: poseCheck.message, color: 'yellow' }
    }
    setPoseStatus('ok')

    // 3단계: 거리 및 위치 검사 (우선순위 3위)
    const noseTipIndex = 1
    if (noseTipIndex >= landmarks.length) {
      setGuideMessage('얼굴을 가이드 안에 맞춰주세요')
      setGuideColor('white')
      return { aligned: false, message: '얼굴을 가이드 안에 맞춰주세요', color: 'white' }
    }

    const noseTip = landmarks[noseTipIndex]
    const noseTipX = noseTip.x * screenWidth
    const noseTipY = noseTip.y * screenHeight

    // 위치 판별 (Centering) - 코끝이 화면 중앙에서 ±10% 오차 범위를 벗어나는지 검사
    const centerXDiff = Math.abs(noseTipX - guideCenterX)
    const centerYDiff = Math.abs(noseTipY - guideCenterY)
    const maxCenterDiffX = screenWidth * 0.1 // 10% 허용 오차
    const maxCenterDiffY = screenHeight * 0.1 // 10% 허용 오차

    const isCentered = centerXDiff <= maxCenterDiffX && centerYDiff <= maxCenterDiffY

    // 거리 판별 (Distance) - 얼굴 너비가 가이드라인 너비의 비율
    const faceWidthRatio = faceBounds.width / guideWidth
    const faceHeightRatio = faceBounds.height / guideHeight
    const minFillRatio = 0.5 // 50% 미만이면 너무 멀음
    const maxFillRatio = 0.9 // 90% 초과면 너무 가까움
    const perfectMinRatio = 0.6 // 완벽한 상태의 최소 비율
    const perfectMaxRatio = 0.85 // 완벽한 상태의 최대 비율

    // 위치가 벗어난 경우
    if (!isCentered) {
      setGuideMessage('🎯 얼굴을 중앙으로 옮겨주세요')
      setGuideColor('yellow')
      return { aligned: false, message: '🎯 얼굴을 중앙으로 옮겨주세요', color: 'yellow' }
    }

    // 거리가 너무 먼 경우
    if (faceWidthRatio < minFillRatio) {
      setGuideMessage('🔍 조금 더 가까이 오세요')
      setGuideColor('white')
      return { aligned: false, message: '🔍 조금 더 가까이 오세요', color: 'white' }
    }

    // 거리가 너무 가까운 경우
    if (faceWidthRatio > maxFillRatio) {
      setGuideMessage('✋ 조금만 뒤로 물러나세요')
      setGuideColor('white')
      return { aligned: false, message: '✋ 조금만 뒤로 물러나세요', color: 'white' }
    }

    // 완벽한 상태 - 모든 조건 통과 (조명, 각도, 거리 모두 OK)
    if (faceWidthRatio >= perfectMinRatio && faceWidthRatio <= perfectMaxRatio && 
        faceHeightRatio >= perfectMinRatio && faceHeightRatio <= perfectMaxRatio) {
      setGuideMessage('✨ 완벽해요! 움직이지 마세요')
      setGuideColor('mint')
      return { aligned: true, message: '✨ 완벽해요! 움직이지 마세요', color: 'mint' }
    }

    // 중간 상태 (50%~60% 또는 85%~90%)
    if (faceWidthRatio < perfectMinRatio) {
      setGuideMessage('🔍 조금 더 가까이 오세요')
      setGuideColor('white')
      return { aligned: false, message: '🔍 조금 더 가까이 오세요', color: 'white' }
    } else {
      setGuideMessage('✋ 조금만 뒤로 물러나세요')
      setGuideColor('white')
      return { aligned: false, message: '✋ 조금만 뒤로 물러나세요', color: 'white' }
    }
  }

  // 얼굴 정렬 검사 (Face ID 스타일 - 엄격한 판정) - 기존 함수 유지 (호환성, 사용되지 않음)
  const checkFaceAlignment = (
    landmarks: NormalizedLandmark[],
    screenWidth: number,
    screenHeight: number,
    faceBounds: { centerX: number; centerY: number; width: number; height: number }
  ): boolean => {
    // 이 함수는 호환성을 위해 유지되지만 실제로는 사용되지 않음
    // checkFaceAlignmentWithFeedback을 직접 사용해야 함
    return false
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

  // 스캔 라인 애니메이션 (기존 로직 유지, scanningStage에 따라 동작)
  const drawScanLine = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // processing 단계일 때는 깜빡이는 효과 (펄스)
    if (scanningStage === 'processing') {
      const blink = Math.sin(Date.now() / 200) > 0
      if (!blink) return // 깜빡임 효과
    }

    // scanning 단계일 때만 라인 이동 (기존 로직 유지)
    if (scanningStage === 'scanning') {
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

    // 민트색 스캔 라인 그리기 (scanningStage에 따라 색상 변경)
    const lineY = scanningStage === 'scanning' ? scanLineYRef.current : height / 2
    const gradient = ctx.createLinearGradient(0, lineY - 10, 0, lineY + 10)
    gradient.addColorStop(0, 'rgba(0, 255, 194, 0)') // 민트 투명
    gradient.addColorStop(0.5, scanningStage === 'processing' ? 'rgba(0, 255, 194, 1)' : 'rgba(0, 255, 194, 0.8)') // processing 중일 때 더 진하게
    gradient.addColorStop(1, 'rgba(0, 255, 194, 0)') // 민트 투명

    ctx.strokeStyle = gradient
    ctx.lineWidth = scanningStage === 'processing' ? 4 : 3
    ctx.beginPath()
    ctx.moveTo(0, lineY)
    ctx.lineTo(width, lineY)
    ctx.stroke()

    // 스캔 라인 위아래 글로우 효과
    ctx.shadowBlur = scanningStage === 'processing' ? 20 : 15
    ctx.shadowColor = 'rgba(0, 255, 194, 0.6)'
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  // 카메라 프레임 처리
  const processFrame = useCallback(async () => {
    // 🧹 Cleanup 상태 체크: 언마운트된 후 실행 방지
    if (isCleanedUpRef.current) {
      console.log('🧹 [ARCamera] processFrame skipped - component cleaned up')
      return
    }

    const video = webcamRef.current?.video
    if (!faceMeshRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame)
      return
    }

    try {
      if (isMockMode) {
        // Mock 모드: 이미지 요소 사용
        const mockImg = document.querySelector('img[alt="Mock face for development"]') as HTMLImageElement
        if (mockImg && mockImg.complete && mockImg.naturalWidth > 0) {
          await faceMeshRef.current.send({ image: mockImg })
        }
      } else if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        // 🚀 이원화 전략: 트래킹용 축소 캔버스로 MediaPipe 연산 (성능 최적화)
        // 원본 비디오 대신 축소된 캔버스를 MediaPipe에 전달하여 연산 부하 감소
        
        // 트래킹용 캔버스가 없으면 생성
        if (!trackingCanvasRef.current) {
          trackingCanvasRef.current = document.createElement('canvas')
        }
        
        const trackingCanvas = trackingCanvasRef.current
        const aspectRatio = video.videoHeight / video.videoWidth
        const trackingWidth = TRACKING_CANVAS_WIDTH
        const trackingHeight = Math.round(trackingWidth * aspectRatio)
        
        // 캔버스 크기 설정 (변경 시에만)
        if (trackingCanvas.width !== trackingWidth || trackingCanvas.height !== trackingHeight) {
          trackingCanvas.width = trackingWidth
          trackingCanvas.height = trackingHeight
        }
        
        // 원본 비디오를 축소 캔버스에 그리기 (빠른 다운샘플링)
        const ctx = trackingCanvas.getContext('2d', { alpha: false })
        if (ctx) {
          ctx.drawImage(video, 0, 0, trackingWidth, trackingHeight)
          // 축소된 이미지로 MediaPipe 연산 (발열/렉 감소)
          await faceMeshRef.current.send({ image: trackingCanvas })
        }
      }
    } catch (error) {
      // 🧹 cleanup 중 에러는 무시
      if (!isCleanedUpRef.current) {
        console.error('FaceMesh processing error:', error)
      }
    }

    // 🧹 cleanup 상태가 아닐 때만 다음 프레임 예약
    if (!isCleanedUpRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame)
    }
  }, [isMockMode])

  // Webcam 준비 완료 시 프레임 처리 시작
  const handleUserMedia = useCallback(() => {
    setCameraError(null)
    setIsCameraReady(true)
    setIsCameraLoading(false)
    setScanningStage('idle') // 초기 상태를 idle로 설정
    setBottomMessage('얼굴을 가이드 안에 맞춰주세요')
    
    if (isModelReady) {
      setTimeout(() => {
        processFrame()
      }, 500)
    }
  }, [isModelReady, processFrame])

  // Mock Mode 활성화 시에도 얼굴 감지 상태 설정
  useEffect(() => {
    if (isMockMode && !isCameraLoading) {
      setScanningStage('idle') // 초기 상태를 idle로 설정
      setBottomMessage('얼굴을 가이드 안에 맞춰주세요')
      // Mock 모드에서는 항상 얼굴이 감지되고 정렬된 것으로 간주
      setIsFaceDetected(true)
      setFaceAlignment('aligned')
      setGuideMessage('완벽해요! 움직이지 마세요 ✨')
      setGuideColor('mint')
      setFaceDetectionStartTime(Date.now())
      faceAlignmentStartTimeRef.current = Date.now() // Mock 모드에서 정렬 시작 시간 설정
      faceDetectionDurationRef.current = 0
    } else if (!isMockMode) {
      // 실제 카메라 모드로 전환 시 얼굴 감지 상태 초기화
      setIsFaceDetected(false)
      setFaceAlignment('none')
      setGuideMessage('얼굴을 가이드 안에 맞춰주세요')
      setGuideColor('white')
      setFaceDetectionStartTime(null)
      faceAlignmentStartTimeRef.current = null
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

  // 🎯 이원화 전략: 고화질 이미지 캡처 및 네비게이션 처리 함수
  const handleCaptureAndNavigate = useCallback(() => {
    try {
      const video = webcamRef.current?.video
      if (video || isMockMode) {
        const tempCanvas = document.createElement('canvas')
        if (isMockMode) {
          // Mock 모드일 경우 Mock 이미지 사용
            const mockImg = document.querySelector('img[alt="Mock face for development"]') as HTMLImageElement
            if (mockImg && mockImg.complete && mockImg.naturalWidth > 0) {
              try {
                tempCanvas.width = mockImg.naturalWidth
                tempCanvas.height = mockImg.naturalHeight
                const tempCtx = tempCanvas.getContext('2d')
                if (tempCtx) {
                  tempCtx.drawImage(mockImg, 0, 0)
                  // 🎯 최고 화질로 캡처 (무압축)
                  const imageData = tempCanvas.toDataURL('image/jpeg', CAPTURE_QUALITY)
                  sessionStorage.setItem('skinAnalysisImage', imageData)
                  console.log(`📸 [ARCamera] High-res capture: ${mockImg.naturalWidth}x${mockImg.naturalHeight}, Quality: ${CAPTURE_QUALITY}`)
                  
                  // MediaPipe로 분석된 실제 랜드마크 사용
                  console.log('💾 [ARCamera] Saving landmarks:', {
                    hasLandmarks: !!landmarksRef.current,
                    landmarksLength: landmarksRef.current?.length || 0,
                  })
                  if (landmarksRef.current) {
                    sessionStorage.setItem('skinAnalysisLandmarks', JSON.stringify(landmarksRef.current))
                    console.log('✅ [ARCamera] Landmarks saved to sessionStorage')
                  } else {
                    console.warn('⚠️ [ARCamera] No landmarks found in landmarksRef.current')
                  }
                }
              } catch (error) {
                console.error('Failed to save image/landmarks:', error)
                // CORS 에러가 발생해도 랜드마크만 저장하고 진행
                if (landmarksRef.current) {
                  sessionStorage.setItem('skinAnalysisLandmarks', JSON.stringify(landmarksRef.current))
                }
              }
            // 카메라 cleanup
            if (webcamRef.current?.video?.srcObject) {
              const stream = webcamRef.current.video.srcObject as MediaStream
              stream.getTracks().forEach(track => track.stop())
            }
            // 모달 닫기 & 페이지 이동
            onComplete?.()
            router.push('/report')
          } else {
            // 이미지가 아직 로드되지 않았으면 새로 로드
            const newMockImg = new Image()
            newMockImg.crossOrigin = 'anonymous'
            newMockImg.onload = () => {
              try {
                tempCanvas.width = newMockImg.width
                tempCanvas.height = newMockImg.height
                const tempCtx = tempCanvas.getContext('2d')
                if (tempCtx) {
                  tempCtx.drawImage(newMockImg, 0, 0)
                  // 🎯 최고 화질로 캡처 (무압축)
                  const imageData = tempCanvas.toDataURL('image/jpeg', CAPTURE_QUALITY)
                  sessionStorage.setItem('skinAnalysisImage', imageData)
                  
                  // MediaPipe로 분석된 실제 랜드마크 사용
                  console.log('💾 [ARCamera] Saving landmarks:', {
                    hasLandmarks: !!landmarksRef.current,
                    landmarksLength: landmarksRef.current?.length || 0,
                  })
                  if (landmarksRef.current) {
                    sessionStorage.setItem('skinAnalysisLandmarks', JSON.stringify(landmarksRef.current))
                    console.log('✅ [ARCamera] Landmarks saved to sessionStorage')
                  } else {
                    console.warn('⚠️ [ARCamera] No landmarks found in landmarksRef.current')
                  }
                }
                // 모달 닫기 & 페이지 이동
                onComplete?.()
                router.push('/report')
              } catch (error) {
                console.error('Failed to save image/landmarks:', error)
                onComplete?.()
                router.push('/report')
              }
            }
            newMockImg.onerror = () => {
              console.error('Failed to load mock image')
              onComplete?.()
              router.push('/report')
            }
            newMockImg.src = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop'
          }
        } else if (video) {
          // 🎯 이원화 전략: 실제 카메라 - 카메라 하드웨어 최대 해상도로 캡처
          // video.videoWidth/Height는 카메라의 실제 해상도 (1920x1080 또는 그 이상)
          const captureWidth = video.videoWidth
          const captureHeight = video.videoHeight
          
          tempCanvas.width = captureWidth
          tempCanvas.height = captureHeight
          const tempCtx = tempCanvas.getContext('2d', { alpha: false })
          if (tempCtx) {
            // 원본 해상도 그대로 캡처 (resize 없음)
            tempCtx.drawImage(video, 0, 0, captureWidth, captureHeight)
            // 🎯 최고 화질로 저장 (무압축, 모공 디테일 유지)
            const imageData = tempCanvas.toDataURL('image/jpeg', CAPTURE_QUALITY)
            sessionStorage.setItem('skinAnalysisImage', imageData)
            console.log(`📸 [ARCamera] High-res capture: ${captureWidth}x${captureHeight}, Quality: ${CAPTURE_QUALITY}`)
            
            if (landmarksRef.current) {
              sessionStorage.setItem('skinAnalysisLandmarks', JSON.stringify(landmarksRef.current))
            }
          }
          // 카메라 cleanup
          if (webcamRef.current?.video?.srcObject) {
            const stream = webcamRef.current.video.srcObject as MediaStream
            stream.getTracks().forEach(track => track.stop())
          }
          // 모달 닫기 & 페이지 이동
          onComplete?.()
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
      onComplete?.()
      router.push('/report')
    }
  }, [isMockMode, router, onComplete])

  // ⚡ 화면 정지 함수 (가벼운 작업만 - 즉시 UI 업데이트)
  const freezeScreen = useCallback(() => {
    console.log('⚡ [ARCamera] freezeScreen: Instant UI freeze started')
    
    // 1. MediaPipe 루프 즉시 중단 (리소스 확보)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
      console.log('⚡ [ARCamera] MediaPipe loop stopped')
    }
    
    // 2. 즉시 UI 상태 업데이트 (가벼운 작업)
    setIsShutterDisabled(true)
    setScanningStage('scanning')
    setBottomMessage('피부 표면 스캔 중... 움직이지 마세요')
    setLaserProgress(0)
    
    // 3. 현재 비디오 프레임을 캔버스에 그려서 화면 '정지' (Base64 변환 없음!)
    const video = webcamRef.current?.video
    const canvas = canvasRef.current
    
    if (isMockMode) {
      // Mock 모드: Mock 이미지로 frozen frame 설정 (URL만 설정, Base64 변환 X)
      const mockImg = document.querySelector('img[alt="Mock face for development"]') as HTMLImageElement
      if (mockImg && mockImg.complete) {
        // 캔버스에 이미지 그리기 (UI 정지용)
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx) {
            canvas.width = mockImg.naturalWidth
            canvas.height = mockImg.naturalHeight
            ctx.drawImage(mockImg, 0, 0)
          }
        }
        // frozenFrame에 원본 URL만 설정 (빠름)
        setFrozenFrame(mockImg.src)
      }
    } else if (video && canvas) {
      // 실제 카메라: 비디오 프레임을 캔버스에 그리기
      const ctx = canvas.getContext('2d')
      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        // frozenFrame에 캔버스 참조만 설정 (실제 데이터 변환은 나중에)
        // 임시로 빈 문자열 설정하여 frozen 상태임을 표시
        setFrozenFrame('freezing')
      }
    }
    
    console.log('⚡ [ARCamera] Screen frozen, animation starting...')
  }, [isMockMode])

  // 🎬 시네마틱 3단계 시퀀스 실행 함수 (최적화됨)
  const executeCinematicSequence = useCallback(async () => {
    if (scanningStage !== 'idle') return // 이미 진행 중이면 무시

    try {
      // ============================================
      // ⚡ Step 0: 즉시 화면 정지 (가벼운 작업만!)
      // ============================================
      freezeScreen()
      
      // ============================================
      // 💾 Step 1: 데이터 저장 (500ms 뒤 - Lazy Processing)
      // ============================================
      // 사용자는 애니메이션을 보고 있으니 뒷단에서 처리
      setTimeout(() => {
        console.log('💾 [ARCamera] Lazy processing: Saving HIGH-RES image data...')
        
        let capturedImage: string | null = null
        
        if (isMockMode) {
          // Mock 모드: Mock 이미지 Base64 변환
          const mockImg = document.querySelector('img[alt="Mock face for development"]') as HTMLImageElement
          if (mockImg && mockImg.complete) {
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = mockImg.naturalWidth
            tempCanvas.height = mockImg.naturalHeight
            const ctx = tempCanvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(mockImg, 0, 0)
              // 🎯 최고 화질로 캡처 (무압축)
              capturedImage = tempCanvas.toDataURL('image/jpeg', CAPTURE_QUALITY)
              console.log(`📸 [ARCamera] High-res capture: ${mockImg.naturalWidth}x${mockImg.naturalHeight}`)
            }
          }
        } else {
          // 🎯 이원화 전략: 실제 카메라 - 캔버스에 저장된 원본 해상도 이미지 사용
          const canvas = canvasRef.current
          if (canvas && canvas.width > 0 && canvas.height > 0) {
            // 캔버스에는 video.videoWidth x video.videoHeight (카메라 최대 해상도)가 저장됨
            capturedImage = canvas.toDataURL('image/jpeg', CAPTURE_QUALITY)
            console.log(`📸 [ARCamera] High-res capture: ${canvas.width}x${canvas.height}, Quality: ${CAPTURE_QUALITY}`)
          }
        }
        
        // 세션 스토리지에 저장
        if (capturedImage) {
          sessionStorage.setItem('skinAnalysisImage', capturedImage)
          setFrozenFrame(capturedImage) // 실제 이미지로 업데이트
          console.log('💾 [ARCamera] High-quality image data saved to sessionStorage')
        }
        
        // 랜드마크도 저장
        if (landmarksRef.current) {
          sessionStorage.setItem('skinAnalysisLandmarks', JSON.stringify(landmarksRef.current))
        }
      }, 500) // 500ms 지연

      // ============================================
      // 🔦 Step 2: 레이저 스캐닝 (Laser Beam) - 즉시 시작
      // ============================================

      // 레이저 진행률 업데이트 (Mesh Reveal 효과용) - 3.5초
      const progressInterval = setInterval(() => {
        setLaserProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + (100 / 35) // 3.5초 동안 100%
        })
      }, 100)

      // 레이저 바 애니메이션: 상단(-10%)에서 하단(110%)까지 (3.5초 - 느리게)
      await laserControls.start({
        y: ['-10%', '110%'],
        transition: {
          duration: 3.5,
          ease: 'linear', // 일정한 속도로 이동
        },
      })

      clearInterval(progressInterval)
      setLaserProgress(100)

      // ============================================
      // 📡 Step 3: 데이터 전송 연출 (Data Transfer)
      // ============================================
      setScanningStage('processing')
      setShowDataTransfer(true)
      setBottomMessage('데이터 추출 완료. 분석 서버로 전송 중...')

      // 원형 파동 애니메이션 (1.5초)
      await rippleControls.start({
        scale: [0, 3],
        opacity: [0.8, 0],
        transition: {
          duration: 1.5,
          ease: 'easeOut',
        },
      })

      // ============================================
      // 🎬 Step 4: 트랜지션 (Transition)
      // ============================================
      setScanningStage('complete')
      setBottomMessage('분석 준비 완료')

      // 페이드 아웃 애니메이션
      await fadeControls.start({
        opacity: 1,
        transition: {
          duration: 0.5,
          ease: 'easeInOut',
        },
      })

      // 이미지 캡처 및 네비게이션
      handleCaptureAndNavigate()
    } catch (error) {
      console.error('Cinematic sequence error:', error)
      // 에러 발생 시에도 페이지 이동
      handleCaptureAndNavigate()
    }
  }, [scanningStage, isMockMode, laserControls, faceMeshControls, fadeControls, rippleControls, handleCaptureAndNavigate, freezeScreen])

  // executeCinematicSequence를 ref에 저장 (의존성 문제 해결)
  useEffect(() => {
    executeCinematicSequenceRef.current = executeCinematicSequence
  }, [executeCinematicSequence])

  // 🎯 핸즈프리 오토 캡처 로직 (Hands-free Auto Capture) - 인터벌 기반
  useEffect(() => {
    // 스캔 중이면 무시
    if (scanningStage !== 'idle') {
      return
    }

    const LOCK_ON_DURATION = 2000 // 2초
    
    // 3단계 검증이 모두 Pass인지 확인하는 함수
    const checkConditions = () => {
      return (
        (faceAlignment === 'aligned' || isMockMode) &&
        lightingStatus === 'ok' &&
        poseStatus === 'ok'
      )
    }

    // 조건 체크 및 오토 캡처 실행 인터벌
    const intervalId = setInterval(() => {
      // 이미 캡처가 트리거됐으면 중단
      if (autoCaptureTriggeredRef.current) {
        clearInterval(intervalId)
        return
      }

      const isAllConditionsMet = checkConditions()

      if (isAllConditionsMet) {
        // 락온 시작
        if (lockOnStartTimeRef.current === null) {
          lockOnStartTimeRef.current = Date.now()
          console.log('🎯 Lock-on started')
        }

        const elapsed = Date.now() - lockOnStartTimeRef.current
        const progress = Math.min((elapsed / LOCK_ON_DURATION) * 100, 100)
        setLockOnProgress(progress)

        // 카운트다운 텍스트 (2..1)
        const remaining = Math.ceil((LOCK_ON_DURATION - elapsed) / 1000)
        if (remaining > 0 && remaining <= 2) {
          setCountdownText(`${remaining}`)
          setBottomMessage(`✨ 완벽해요! 움직이지 마세요 (${remaining}...)`)
        } else if (remaining <= 0) {
          setCountdownText(null)
          setBottomMessage('📸 촬영!')
        } else {
          setCountdownText(null)
          setBottomMessage('✨ 완벽해요! 움직이지 마세요')
        }

        // 2초 경과 -> 오토 캡처 실행
        if (elapsed >= LOCK_ON_DURATION && !autoCaptureTriggeredRef.current) {
          autoCaptureTriggeredRef.current = true
          setLockOnProgress(100)
          clearInterval(intervalId)
          
          console.log('📸 Auto capture triggered!')
          // 시네마틱 시퀀스 실행 (ref를 통해 호출)
          if (executeCinematicSequenceRef.current) {
            executeCinematicSequenceRef.current()
          }
        }
      } else {
        // 조건 실패 -> 타이머 리셋
        if (lockOnStartTimeRef.current !== null) {
          console.log('❌ Lock-on reset - conditions not met')
          lockOnStartTimeRef.current = null
          setLockOnProgress(0)
          setCountdownText(null)
        }
      }
    }, 100) // 100ms마다 체크

    return () => {
      clearInterval(intervalId)
    }
  }, [scanningStage, isMockMode, faceAlignment, lightingStatus, poseStatus])

  // 스캔 완료 후 오토캡처 플래그 리셋
  useEffect(() => {
    if (scanningStage === 'idle') {
      autoCaptureTriggeredRef.current = false
      lockOnStartTimeRef.current = null
      setLockOnProgress(0)
      setCountdownText(null)
    }
  }, [scanningStage])

  // 스캔 진행률 업데이트 (기존 로직 제거 - 레이저 바 애니메이션으로 대체)
  // 주석: scanningStage를 사용하므로 scanStatus는 더 이상 사용하지 않음

  // Canvas 애니메이션 (스캔 라인 그리기)
  useEffect(() => {
    if ((isCameraReady || isMockMode) && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      let isAnimating = true

      const animate = () => {
        if (!isAnimating || scanningStage === 'complete') return
        
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
  }, [isCameraReady, isMockMode, scanningStage])

  // 모델이 준비되면 프레임 처리 시작
  useEffect(() => {
    if (isModelReady) {
      if (isMockMode) {
        // Mock 모드: 이미지가 로드되면 처리 시작
        const mockImg = document.querySelector('img[alt="Mock face for development"]') as HTMLImageElement
        if (mockImg) {
          if (mockImg.complete) {
            processFrame()
          } else {
            mockImg.onload = () => {
              processFrame()
            }
          }
        }
      } else if (webcamRef.current?.video) {
        const video = webcamRef.current.video
        if (video.readyState >= video.HAVE_METADATA) {
          processFrame()
        }
      }
    }
  }, [isModelReady, isMockMode, processFrame])

  // 🚀 Lazy Initialization: isReady가 false면 가벼운 로딩 UI만 표시
  if (!isReady) {
    return (
      <div className={`relative w-full h-full ${className} bg-gray-900 flex items-center justify-center`}>
        <div className="text-center">
          {/* 🚀 GPU 최적화 로딩 스피너 */}
          <div className="relative w-20 h-20 mx-auto mb-6 gpu-accelerated">
            <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
            <div className="absolute inset-0 rounded-full border-4 border-[#00FFC2] border-t-transparent animate-gpu-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-[#00FFC2]/30 border-t-transparent animate-gpu-spin-reverse" />
          </div>
          
          {/* 텍스트 */}
          <p className="text-white text-lg font-medium mb-2">카메라 준비 중...</p>
          <p className="text-gray-400 text-sm">잠시만 기다려주세요</p>
          
          {/* 🚀 GPU 최적화 로딩 바 */}
          <div className="mt-6 w-48 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
            <div className="h-full w-1/2 bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] rounded-full animate-loading-slide" />
          </div>
        </div>
        
        {/* 배경 그라데이션 효과 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#00FFC2]/5 pointer-events-none" />
      </div>
    )
  }

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
          crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-contain bg-gray-900 scale-90"
          style={{
            objectPosition: 'center 40%', // 얼굴이 가이드라인 위치에 맞도록 조정
          }}
        />
      ) : (
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={{
            // 🎯 이원화 전략: 카메라는 최대 해상도로 유지 (고화질 캡처용)
            // 트래킹은 축소 캔버스로 처리하므로 원본 해상도 유지해도 성능 OK
            width: { ideal: CAPTURE_WIDTH, min: 1280 },
            height: { ideal: CAPTURE_HEIGHT, min: 720 },
            facingMode: 'user',
            frameRate: { ideal: 30, max: 30 },
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

      {/* 스캐너 마스크 오버레이 (Dark Overlay with Elliptical Cutout) */}
      {(isCameraReady || isMockMode) && scanningStage !== 'complete' && (
        <>
          {/* SVG 마스크를 사용한 오버레이 (타원형 구멍 뚫기) - 화면 조명 상태에 따라 색상 변경 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-15" style={{ height: '100%' }}>
            <defs>
              <mask id="scanner-mask">
                {/* 전체 화면을 흰색으로 (마스크에서 흰색 = 불투명, 오버레이가 보임) */}
                <rect width="100%" height="100%" fill="white" />
                {/* 타원형 영역을 검은색으로 (마스크에서 검은색 = 투명, 원본이 보임) */}
                <ellipse cx="50%" cy="40%" rx="35%" ry="27.5%" fill="black" />
              </mask>
            </defs>
            {/* 오버레이 (마스크 적용) - 화면 조명 상태에 따라 색상 변경 */}
            <rect 
              width="100%" 
              height="100%" 
              fill={isScreenLightOn ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.6)'} 
              mask="url(#scanner-mask)"
              className="transition-colors duration-300"
            />
          </svg>
          
          {/* 가이드라인 컨테이너 */}
          <div className="absolute inset-0 flex items-start justify-center pointer-events-none z-16 pt-[15%]">
            {/* 세로로 긴 타원형 가이드라인 (화면 너비의 70%, 높이의 55%) */}
            <div className="relative w-[70%] aspect-[3/4]">
              {/* SVG 타원형 가이드라인 + 진행률 게이지 */}
              <svg 
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 200 267"
                preserveAspectRatio="none"
              >
                {/* 배경 타원 (점선 또는 실선) */}
                <ellipse
                  cx="100"
                  cy="133.5"
                  rx="95"
                  ry="128"
                  fill="none"
                  stroke={
                    lockOnProgress > 0 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : guideColor === 'mint' || (faceAlignment === 'aligned' || isMockMode)
                      ? '#00FFC2'
                      : guideColor === 'yellow'
                      ? '#FBBF24'
                      : 'rgba(255, 255, 255, 0.5)'
                  }
                  strokeWidth={lockOnProgress > 0 ? '2' : '3'}
                  strokeDasharray={
                    guideColor === 'mint' || (faceAlignment === 'aligned' || isMockMode) || lockOnProgress > 0
                      ? 'none'
                      : '8 4'
                  }
                  style={{
                    filter: guideColor === 'mint' || (faceAlignment === 'aligned' || isMockMode)
                      ? 'drop-shadow(0 0 10px rgba(0, 255, 194, 0.5))'
                      : guideColor === 'yellow'
                      ? 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.5))'
                      : 'none',
                    transition: 'all 0.3s ease',
                  }}
                />
                
                {/* 🎯 진행률 게이지 (Lock-on Progress) */}
                {lockOnProgress > 0 && (
                  <ellipse
                    cx="100"
                    cy="133.5"
                    rx="95"
                    ry="128"
                    fill="none"
                    stroke="#00FFC2"
                    strokeWidth="4"
                    strokeLinecap="round"
                    style={{
                      // 타원 둘레 계산: 약 2 * π * sqrt((a² + b²) / 2) ≈ 702
                      strokeDasharray: '702',
                      strokeDashoffset: `${702 - (702 * lockOnProgress) / 100}`,
                      filter: 'drop-shadow(0 0 15px rgba(0, 255, 194, 0.8)) drop-shadow(0 0 30px rgba(0, 255, 194, 0.4))',
                      transition: 'stroke-dashoffset 0.05s linear',
                      transformOrigin: 'center',
                      transform: 'rotate(-90deg) scaleX(-1)',
                    }}
                  />
                )}
              </svg>
              
              {/* 카운트다운 숫자 표시 (중앙) */}
              <AnimatePresence>
                {countdownText && (
                  <motion.div
                    key={countdownText}
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span 
                      className="text-8xl font-black text-[#00FFC2]"
                      style={{
                        textShadow: '0 0 30px rgba(0, 255, 194, 0.8), 0 0 60px rgba(0, 255, 194, 0.4)',
                      }}
                    >
                      {countdownText}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* 내부 가이드 (더 작은 타원) */}
              <div 
                className={`absolute inset-[8%] rounded-[50%] border transition-all duration-300 ${
                  guideColor === 'mint' || (faceAlignment === 'aligned' || isMockMode)
                    ? 'border-[1.5px] border-[#00FFC2]' 
                    : guideColor === 'yellow'
                    ? 'border-[1.5px] border-yellow-400'
                    : 'border border-dashed border-white'
                }`}
                style={{
                  opacity: guideColor === 'mint' || (faceAlignment === 'aligned' || isMockMode) ? 0.6 : 0.4,
                }}
              />
              
              {/* 가이드라인 바깥쪽 하단 텍스트 */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center w-full">
                <p 
                  className={`text-lg font-bold transition-colors duration-300 ${
                    guideColor === 'mint' || (faceAlignment === 'aligned' || isMockMode)
                      ? 'text-[#00FFC2]' 
                      : guideColor === 'yellow'
                      ? 'text-yellow-400'
                      : 'text-white'
                  }`}
                  style={{
                    textShadow: guideColor === 'mint' || (faceAlignment === 'aligned' || isMockMode)
                      ? '0 0 8px rgba(0, 255, 194, 0.8)'
                      : guideColor === 'yellow'
                      ? '0 0 8px rgba(251, 191, 36, 0.8)'
                      : '0 0 4px rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {guideMessage}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 📸 정지 프레임 오버레이 (Freeze Frame) - 최적화됨 */}
      <AnimatePresence>
        {frozenFrame && scanningStage !== 'idle' && (
          <motion.div
            key="frozen-frame"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 z-15"
          >
            {/* 'freezing' 상태: 캔버스가 이미 화면에 그려져 있으므로 
                반투명 오버레이만 표시 (실제 캔버스는 배경에 있음) */}
            {frozenFrame === 'freezing' ? (
              <div 
                className="w-full h-full bg-transparent"
                style={{ 
                  // 캔버스 위에 오버레이되므로 투명하게
                }}
              />
            ) : (
              // 실제 Base64 이미지가 있을 때
              <img
                src={frozenFrame}
                alt="Captured frame"
                className="w-full h-full object-cover"
                style={{ 
                  objectPosition: 'center 40%',
                  transform: isMockMode ? 'scale(0.9)' : 'scaleX(-1)', // 실제 카메라는 미러링
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔦 하이엔드 레이저 스캔 바 (Laser Beam) - 더 두껍고 눈에 띄게 */}
      <AnimatePresence>
        {scanningStage === 'scanning' && (
          <motion.div
            key="laser-beam"
            initial={{ y: '-10%' }}
            animate={laserControls}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="absolute left-0 right-0 z-35 pointer-events-none"
            style={{ top: 0 }}
          >
            {/* 글로우 배경 (더 넓은 범위) */}
            <div 
              className="absolute -top-8 left-0 right-0 h-32"
              style={{
                background: 'linear-gradient(to bottom, transparent 0%, rgba(0, 255, 194, 0.15) 30%, rgba(0, 255, 194, 0.3) 50%, rgba(0, 255, 194, 0.15) 70%, transparent 100%)',
              }}
            />
            
            {/* 🚀 GPU 최적화: 메인 레이저 바 (정적 boxShadow + opacity 애니메이션) */}
            <div className="relative w-full h-24 gpu-accelerated">
              {/* 글로우 레이어 (정적, opacity만 변경) */}
              <div 
                className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00FFC2] to-transparent neon-glow-mint-intense animate-glow-pulse"
              />
              {/* 메인 컬러 바 */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00FFC2]/80 to-transparent" />
            </div>
            
            {/* 🚀 GPU 최적화: 레이저 중심선 (정적 글로우) */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 gpu-accelerated">
              {/* 글로우 레이어 */}
              <div className="h-3 bg-white/50 neon-glow-mint animate-glow-pulse" />
              {/* 메인 라인 */}
              <div className="absolute inset-0 h-2 top-0.5 bg-white" />
            </div>
            
            {/* 좌우 테이퍼 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
            
            {/* 🚀 GPU 최적화: 스캔 라인 하단 하이라이트 (정적 글로우) */}
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-[#00FFC2] neon-glow-mint" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌐 AR Face Mesh Reveal 효과 (레이저가 지나간 자리에 드러남) */}
      <AnimatePresence>
        {(scanningStage === 'scanning' || scanningStage === 'processing') && laserProgress > 0 && (
          <motion.div
            key="mesh-reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
          >
            {/* 스캔된 영역에 메쉬 그리드 표시 */}
            <div 
              className="absolute inset-0"
              style={{
                clipPath: `polygon(0 0, 100% 0, 100% ${laserProgress}%, 0 ${laserProgress}%)`,
              }}
            >
              {/* 민트색 그리드 패턴 */}
              <div 
                className="w-full h-full opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(0, 255, 194, 0.3) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 255, 194, 0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',
                }}
              />
              {/* 🚀 GPU 최적화: 데이터 포인트 시각화 (정적 그림자) */}
              <div className="absolute inset-0 flex items-center justify-center gpu-accelerated">
                <div className="w-48 h-48 rounded-full border border-[#00FFC2]/50 bg-[#00FFC2]/5" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📡 데이터 전송 연출 (원형 파동 + 점 반짝임) */}
      <AnimatePresence>
        {showDataTransfer && (
          <motion.div
            key="data-transfer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-25 pointer-events-none flex items-center justify-center"
          >
            {/* 중앙 데이터 포인트 */}
            <div className="relative">
              {/* 원형 파동 1 */}
              <motion.div
                animate={rippleControls}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-[#00FFC2]"
              />
              {/* 원형 파동 2 (딜레이) */}
              <motion.div
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-[#00FFC2]"
              />
              {/* 원형 파동 3 (딜레이) */}
              <motion.div
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 1.5, delay: 0.6, ease: 'easeOut' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-[#00FFC2]"
              />
              {/* 🚀 GPU 최적화: 중앙 글로우 (정적 글로우 + opacity 펄스) */}
              <div className="w-8 h-8 rounded-full bg-[#00FFC2] neon-glow-mint animate-gpu-pulse gpu-accelerated" />
            </div>

            {/* 🚀 GPU 최적화: 반짝이는 데이터 점들 (CSS blink로 대체) */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 rounded-full bg-[#00FFC2] neon-glow-mint gpu-accelerated ${
                  i % 3 === 0 ? 'animate-blink' : i % 3 === 1 ? 'animate-blink-delay-1' : 'animate-blink-delay-2'
                }`}
                style={{
                  top: `${35 + (i % 4) * 10}%`,
                  left: `${25 + (i % 5) * 12}%`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 페이드 아웃 오버레이 (Stage 3) */}
      <AnimatePresence>
        {scanningStage === 'complete' && (
          <motion.div
            key="fade-out"
            initial={{ opacity: 0 }}
            animate={fadeControls}
            exit={{ opacity: 1 }}
            className="absolute inset-0 bg-black z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* 하단 상태 메시지 및 셔터 버튼 */}
      {(isCameraReady || isMockMode) && scanningStage !== 'complete' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 text-center px-6 w-full max-w-md">
          {/* 🚀 GPU 최적화: 상태 메시지 (정적 글로우) */}
          <div 
            className={`bg-black/80 backdrop-blur-md rounded-2xl px-6 py-4 inline-block mb-4 border border-[#00FFC2]/20 gpu-accelerated ${
              scanningStage !== 'idle' ? 'neon-glow-mint animate-glow-pulse' : ''
            }`}
          >
            <p className="text-white text-sm font-medium">
              {bottomMessage}
            </p>
            {scanningStage === 'scanning' && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-[#00FFC2] mb-1">
                  <span>🔦 피부 표면 스캔 중</span>
                  <span className="font-bold">{Math.round(laserProgress)}%</span>
                </div>
                {/* 🚀 GPU 최적화: 진행 바 (CSS transition으로 width 변경) */}
                <div className="w-52 h-3 bg-gray-800 rounded-full overflow-hidden mx-auto border border-[#00FFC2]/30">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00FFC2] via-[#00E6B8] to-[#00FFC2] neon-glow-mint gpu-accelerated"
                    style={{
                      width: `${laserProgress}%`,
                      transition: 'width 0.1s linear',
                    }}
                  />
                </div>
              </div>
            )}
            {scanningStage === 'processing' && (
              <div className="mt-3">
                {/* 🚀 GPU 최적화: 로딩 점들 (CSS 애니메이션) */}
                <div className="flex items-center justify-center gap-3">
                  <div className="w-3 h-3 bg-[#00FFC2] rounded-full neon-glow-mint animate-blink gpu-accelerated" />
                  <div className="w-3 h-3 bg-[#00FFC2] rounded-full neon-glow-mint animate-blink-delay-1 gpu-accelerated" />
                  <div className="w-3 h-3 bg-[#00FFC2] rounded-full neon-glow-mint animate-blink-delay-2 gpu-accelerated" />
                </div>
              </div>
            )}
          </div>

          {/* 🚀 GPU 최적화: 오토 캡처 진행률 표시 */}
          {scanningStage === 'idle' && lockOnProgress > 0 && (
            <div className="flex items-center gap-3 mb-4 animate-fade-in">
              {/* 진행률 바 (CSS transition) */}
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00FFC2] neon-glow-mint gpu-accelerated"
                  style={{ 
                    width: `${lockOnProgress}%`,
                    transition: 'width 0.1s linear',
                  }}
                />
              </div>
              {/* 퍼센트 표시 */}
              <span className="text-[#00FFC2] text-sm font-bold min-w-[3rem] text-right">
                {Math.round(lockOnProgress)}%
              </span>
            </div>
          )}

          {/* 수동 촬영 보조 버튼 (작게, 우측 하단) */}
          {scanningStage === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center justify-center gap-4"
            >
              {/* 안내 텍스트 */}
              <p className="text-gray-500 text-xs">
                {lockOnProgress > 0 
                  ? '자동 촬영 중...' 
                  : '얼굴을 맞추면 자동 촬영됩니다'}
              </p>
              
              {/* 수동 촬영 버튼 (작은 보조 버튼) */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={executeCinematicSequence}
                className="px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-white rounded-full text-xs font-medium transition-colors border border-gray-700"
              >
                📷 수동 촬영
              </motion.button>
            </motion.div>
          )}
        </div>
      )}

      {/* 카메라 로딩 상태 */}
      {isCameraLoading && !cameraError && !isMockMode && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm z-10">
          <div className="text-center px-4">
            {/* 🚀 GPU 최적화: 스피너 */}
            <div className="w-12 h-12 border-4 border-[#00FFC2] border-t-transparent rounded-full animate-gpu-spin mx-auto mb-4 gpu-accelerated" />
            <p className="text-white text-base font-medium mb-1">AI 카메라 연결 중...</p>
            <p className="text-gray-400 text-xs">잠시만 기다려주세요</p>
          </div>
        </div>
      )}

      {/* 🚀 GPU 최적화: AR 모델 로딩 상태 */}
      {isCameraReady && !isModelReady && !cameraError && !isMockMode && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm z-10">
          <div className="text-center px-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-gpu-spin mx-auto mb-3 gpu-accelerated" />
            <p className="text-white text-sm font-medium mb-1">AR 모델 로딩 중...</p>
            <p className="text-gray-400 text-xs">잠시만 기다려주세요</p>
          </div>
        </div>
      )}

      {/* 🚀 GPU 최적화: Mock Mode AR 모델 로딩 */}
      {isMockMode && !isModelReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
          <div className="text-center px-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-gpu-spin mx-auto mb-3 gpu-accelerated" />
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


