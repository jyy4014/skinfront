'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Webcam from 'react-webcam'
import { useAnimation } from 'framer-motion'
import type { Results } from '@mediapipe/face_mesh'

import { useCamera } from '@/lib/hooks/ar/useCamera'
import { useFaceMesh } from '@/lib/hooks/ar/useFaceMesh'
import { useARAnalysis } from '@/lib/hooks/ar/useARAnalysis'
import { drawFaceTessellation, drawProblemArea, drawScanLine } from '@/lib/ar/drawing'
import { ARCameraProps, CAPTURE_QUALITY, CAPTURE_WIDTH, CAPTURE_HEIGHT, ScanningStage } from '@/lib/ar/types'

import AROverlay from './ar-camera/AROverlay'
import DebugPanel from './ar-camera/DebugPanel'
import StatusMessage from './ar-camera/StatusMessage'
import LoadingScreen from './ar-camera/LoadingScreen'
import CinematicEffects from './ar-camera/CinematicEffects'

export default function ARCamera({ className = '', onComplete, isReady = true }: ARCameraProps) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 1. Hooks
  const {
    webcamRef, isCameraReady, isCameraLoading, cameraError, isMockMode,
    handleUserMedia, handleUserMediaError, handleRetry
  } = useCamera()

  const {
    debugInfo, guideMessage, guideColor, lightingStatus, poseStatus, faceAlignment,
    analyzeFace, setDebugInfo
  } = useARAnalysis()

  // 2. Animation & Flow State
  const [scanningStage, setScanningStage] = useState<ScanningStage>('idle')
  const [bottomMessage, setBottomMessage] = useState('얼굴을 가이드 안에 맞춰주세요')
  const [laserProgress, setLaserProgress] = useState(0)
  const [lockOnProgress, setLockOnProgress] = useState(0)
  const [countdownText, setCountdownText] = useState<string | null>(null)
  const [showDebugOverlay, setShowDebugOverlay] = useState(false)
  const [showPoseGuide, setShowPoseGuide] = useState(false)
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null)
  const [showDataTransfer, setShowDataTransfer] = useState(false)

  const laserControls = useAnimation()
  const rippleControls = useAnimation()
  const fadeControls = useAnimation()

  const lockOnStartTimeRef = useRef<number | null>(null)
  const autoCaptureTriggeredRef = useRef(false)
  const scanLineYRef = useRef<number>(0)
  const scanDirectionRef = useRef<number>(1)

  // 3. FaceMesh Callback
  const handleResults = useCallback((results: Results) => {
    const canvas = canvasRef.current
    const video = webcamRef.current?.video

    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let canvasWidth = 640
    let canvasHeight = 480

    if (isMockMode) {
      const mockImg = document.querySelector('img[alt="Mock face for development"]') as HTMLImageElement
      if (mockImg && mockImg.complete) {
        canvasWidth = mockImg.naturalWidth || 640
        canvasHeight = mockImg.naturalHeight || 480
      }
    } else if (video) {
      canvasWidth = video.videoWidth
      canvasHeight = video.videoHeight
    }

    canvas.width = canvasWidth
    canvas.height = canvasHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Analyze
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0]
      analyzeFace(landmarks, video || null, canvasWidth, canvasHeight, false, isMockMode)

      drawFaceTessellation(ctx, landmarks, canvasWidth, canvasHeight)
      drawProblemArea(ctx, landmarks, canvasWidth, canvasHeight)
    }

    // Scan Line
    if (scanningStage !== 'idle') {
      if (scanningStage === 'scanning') {
        scanLineYRef.current += scanDirectionRef.current * 2
        if (scanLineYRef.current >= canvasHeight) {
          scanLineYRef.current = canvasHeight
          scanDirectionRef.current = -1
        } else if (scanLineYRef.current <= 0) {
          scanLineYRef.current = 0
          scanDirectionRef.current = 1
        }
      }
      drawScanLine(ctx, canvasWidth, canvasHeight, scanningStage, scanLineYRef.current)
    }
  }, [isMockMode, webcamRef, analyzeFace, scanningStage])

  // 4. Initialize FaceMesh
  const { isModelReady } = useFaceMesh(isReady, isMockMode, webcamRef, handleResults)

  // 5. Capture Logic
  const handleCaptureAndNavigate = useCallback(() => {
    try {
      const video = webcamRef.current?.video
      const canvas = document.createElement('canvas')

      if (isMockMode) {
        const mockImg = document.querySelector('img[alt="Mock face for development"]') as HTMLImageElement
        if (mockImg) {
          canvas.width = mockImg.naturalWidth
          canvas.height = mockImg.naturalHeight
          canvas.getContext('2d')?.drawImage(mockImg, 0, 0)
        }
      } else if (video) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d')?.drawImage(video, 0, 0)
      }

      const imageData = canvas.toDataURL('image/jpeg', CAPTURE_QUALITY)
      sessionStorage.setItem('skinAnalysisImage', imageData)

      onComplete?.()
      router.push('/report')
    } catch (error) {
      console.error('Capture failed:', error)
      onComplete?.()
      router.push('/report')
    }
  }, [isMockMode, onComplete, router, webcamRef])

  // 6. Cinematic Sequence
  const executeCinematicSequence = useCallback(async () => {
    if (scanningStage !== 'idle') return

    // Freeze Screen Logic
    setScanningStage('scanning')
    setBottomMessage('피부 표면 스캔 중... 움직이지 마세요')
    setLaserProgress(0)

    // Capture current frame for freeze effect
    const video = webcamRef.current?.video
    const canvas = canvasRef.current
    if (isMockMode) {
      const mockImg = document.querySelector('img[alt="Mock face for development"]') as HTMLImageElement
      if (mockImg) setFrozenFrame(mockImg.src)
    } else if (video && canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        setFrozenFrame('freezing') // Use canvas content
        // In a real implementation, we might want to convert to dataURL here or just use the canvas
        // For 'freezing', CinematicEffects renders a transparent overlay, assuming canvas has the image.
        // But handleResults clears the canvas every frame!
        // So we MUST stop handleResults or save the image.
        // Since we set scanningStage, handleResults will continue to draw scan line.
        // We need to capture the image and set it as frozenFrame.
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        tempCanvas.getContext('2d')?.drawImage(video, 0, 0)
        setFrozenFrame(tempCanvas.toDataURL())
      }
    }

    // Laser Animation
    const progressInterval = setInterval(() => {
      setLaserProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + (100 / 35)
      })
    }, 100)

    await laserControls.start({
      y: ['-10%', '110%'],
      transition: { duration: 3.5, ease: 'linear' },
    })

    clearInterval(progressInterval)
    setLaserProgress(100)

    // Processing
    setScanningStage('processing')
    setShowDataTransfer(true)
    setBottomMessage('데이터 추출 완료. 분석 서버로 전송 중...')

    await rippleControls.start({
      scale: [0, 3],
      opacity: [0.8, 0],
      transition: { duration: 1.5, ease: 'easeOut' },
    })

    // Complete
    setScanningStage('complete')
    setBottomMessage('분석 준비 완료')

    await fadeControls.start({
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeInOut' },
    })

    handleCaptureAndNavigate()
  }, [scanningStage, laserControls, rippleControls, fadeControls, handleCaptureAndNavigate, isMockMode, webcamRef])

  // 7. Auto Capture Loop
  useEffect(() => {
    if (scanningStage !== 'idle') return

    const checkConditions = () => {
      return (
        (faceAlignment === 'aligned' || isMockMode) &&
        lightingStatus === 'ok' &&
        poseStatus === 'ok'
      )
    }

    const intervalId = setInterval(() => {
      if (autoCaptureTriggeredRef.current) {
        clearInterval(intervalId)
        return
      }

      if (checkConditions()) {
        if (lockOnStartTimeRef.current === null) {
          lockOnStartTimeRef.current = Date.now()
          setDebugInfo(prev => ({ ...prev, status: 'Lock-on' }))
        }

        const elapsed = Date.now() - lockOnStartTimeRef.current
        const progress = Math.min((elapsed / 3000) * 100, 100)
        setLockOnProgress(progress)

        const remaining = Math.ceil((3000 - elapsed) / 1000)
        if (remaining > 0 && remaining <= 2) {
          setCountdownText(`${remaining}`)
          setBottomMessage(`✨ 완벽해요! 움직이지 마세요 (${remaining}...)`)
        } else {
          setCountdownText(null)
          setBottomMessage('✨ 완벽해요! 움직이지 마세요')
        }

        if (elapsed >= 3000 && !autoCaptureTriggeredRef.current) {
          autoCaptureTriggeredRef.current = true
          setLockOnProgress(100)
          clearInterval(intervalId)
          executeCinematicSequence()
        }
      } else {
        if (lockOnStartTimeRef.current !== null) {
          lockOnStartTimeRef.current = null
          setLockOnProgress(0)
          setCountdownText(null)
          setDebugInfo(prev => ({ ...prev, status: 'Waiting' }))
        }
      }
    }, 100)

    return () => clearInterval(intervalId)
  }, [scanningStage, isMockMode, faceAlignment, lightingStatus, poseStatus, executeCinematicSequence, setDebugInfo])

  // 8. Render
  return (
    <div className={`relative w-full h-full ${className}`}>
      <LoadingScreen
        isReady={isReady}
        isCameraLoading={isCameraLoading}
        cameraError={cameraError}
        isModelReady={isModelReady}
        isMockMode={isMockMode}
        handleRetry={handleRetry}
      />

      {isMockMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-yellow-500/90 backdrop-blur-sm rounded-full flex items-center gap-2">
          <span className="text-xs">⚠️</span>
          <span className="text-xs font-semibold text-black">Dev Mode: Camera Mockup</span>
        </div>
      )}

      <DebugPanel
        debugInfo={debugInfo}
        showDebugOverlay={showDebugOverlay}
        setShowDebugOverlay={setShowDebugOverlay}
        lockOnProgress={lockOnProgress}
      />

      {isMockMode ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop"
          alt="Mock face for development"
          crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-contain bg-gray-900 scale-90"
          style={{ objectPosition: 'center 40%' }}
        />
      ) : (
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={{
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

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {(isCameraReady || isMockMode) && (
        <>
          <AROverlay
            scanningStage={scanningStage}
            isScreenLightOn={false}
            lockOnProgress={lockOnProgress}
            guideColor={guideColor}
            faceAlignment={faceAlignment}
            isMockMode={isMockMode}
            debugInfo={debugInfo}
            guideMessage={guideMessage}
            showPoseGuide={showPoseGuide}
            countdownText={countdownText}
          />
          <CinematicEffects
            scanningStage={scanningStage}
            laserControls={laserControls}
            rippleControls={rippleControls}
            fadeControls={fadeControls}
            laserProgress={laserProgress}
            showDataTransfer={showDataTransfer}
            frozenFrame={frozenFrame}
            isMockMode={isMockMode}
          />
        </>
      )}

      <StatusMessage
        scanningStage={scanningStage}
        bottomMessage={bottomMessage}
        laserProgress={laserProgress}
        lockOnProgress={lockOnProgress}
        onManualCapture={executeCinematicSequence}
      />
    </div>
  )
}
