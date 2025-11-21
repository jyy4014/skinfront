'use client'

import { useEffect } from 'react'
import { X, Camera } from 'lucide-react'
import { useCameraCapture } from '../hooks/useCameraCapture'
import Button from '@/app/components/ui/Button'

import type { FaceCaptureAngle } from '../types'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onClose: () => void
  autoCapture?: boolean
  targetAngle?: FaceCaptureAngle
  angleLabel?: string
  angleInstruction?: string
}

/**
 * 실시간 얼굴 감지 및 자동 촬영 카메라 컴포넌트
 */
export function CameraCapture({ 
  onCapture, 
  onClose, 
  autoCapture = true,
  targetAngle = 'front',
  angleLabel = '정면',
  angleInstruction = '얼굴을 중앙에 맞춰주세요',
}: CameraCaptureProps) {
  const {
    videoRef,
    canvasRef,
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
  } = useCameraCapture({
    onCapture,
    autoCapture,
    targetAngle,
    requireAngleDetection: true, // 모든 각도에서 각도 감지 사용
  })

  useEffect(() => {
    startCamera().catch((err) => {
      console.error('Camera start error:', err)
    })

    return () => {
      stopCamera()
    }
  }, [startCamera, stopCamera])

  const handleManualCapture = () => {
    const file = capturePhoto()
    if (file) {
      onCapture(file)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* 상단 컨트롤 */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex flex-col gap-2 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-semibold text-lg">
            Skin Scan
          </h2>
          <button
            onClick={() => {
              stopCamera()
              onClose()
            }}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="카메라 닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-1">
          <p className="text-white/90 text-sm font-medium">
            {angleInstruction}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-white/70">
            <span>💡 팁:</span>
            {targetAngle === 'front' ? (
              <>
                <span>• 밝은 조명에서 촬영하세요</span>
                <span>• 얼굴을 정면으로 향하세요</span>
                <span>• 화면 중앙의 가이드에 맞추세요</span>
              </>
            ) : targetAngle === 'left' ? (
              <>
                <span>• 얼굴을 왼쪽으로 15-45도 돌리세요</span>
                <span>• 고개는 정면을 유지하세요</span>
                <span>• 각도가 맞으면 자동 촬영됩니다</span>
              </>
            ) : (
              <>
                <span>• 얼굴을 오른쪽으로 15-45도 돌리세요</span>
                <span>• 고개는 정면을 유지하세요</span>
                <span>• 각도가 맞으면 자동 촬영됩니다</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 비디오 영역 */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* 얼굴 가이드 오버레이 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-80">
            {/* 외곽 프레임 */}
            <div className={`absolute inset-0 border-4 rounded-2xl transition-colors duration-300 ${
              angleValid ? 'border-green-400 shadow-lg shadow-green-400/50' : 
              faceDetected ? 'border-yellow-400' : 
              'border-white/50'
            }`}></div>
            
            {/* 얼굴 감지 박스 */}
            {facePosition && faceDetected && (
              <div
                className={`absolute border-2 rounded-lg transition-all duration-200 ${
                  angleValid ? 'border-green-400 shadow-lg shadow-green-400/50' : 'border-yellow-400'
                }`}
                style={{
                  left: `${(facePosition.x / (videoRef.current?.videoWidth || 1)) * 100}%`,
                  top: `${(facePosition.y / (videoRef.current?.videoHeight || 1)) * 100}%`,
                  width: `${(facePosition.width / (videoRef.current?.videoWidth || 1)) * 100}%`,
                  height: `${(facePosition.height / (videoRef.current?.videoHeight || 1)) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium whitespace-nowrap ${
                  angleValid ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {angleValid ? '✅ 각도 완벽!' : '👤 얼굴 감지됨'}
                </div>
              </div>
            )}

            {/* 중앙 가이드 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-48 h-60 border-2 border-dashed rounded-xl transition-colors ${
                angleValid ? 'border-green-400/50' : 'border-white/30'
              }`}></div>
            </div>
            
            {/* 각도별 방향 화살표 */}
            {faceDetected && !angleValid && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-white/80 text-4xl">
                {targetAngle === 'front' ? '↕️' : targetAngle === 'left' ? '↶' : '↷'}
              </div>
            )}
          </div>
        </div>

        {/* 상태 메시지 */}
        {isDetecting && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
            얼굴 감지 중...
          </div>
        )}

        {error && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* 숨겨진 canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* 하단 컨트롤 */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex flex-col items-center gap-4">
          {autoCapture ? (
            <>
              <div className="text-white text-sm text-center space-y-2 max-w-sm mx-auto">
                {faceDetected ? (
                  angleValid ? (
                    <div className="space-y-2 bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                      <p className="text-green-400 font-semibold text-base animate-pulse">
                        ✅ 각도 완벽합니다!
                      </p>
                      <p className="text-white/90 text-xs">
                        자동 촬영 준비 완료... 잠시만 기다려주세요
                      </p>
                      {currentAngle && (
                        <div className="flex justify-center gap-3 text-xs text-white/70">
                          <span>Yaw: {currentAngle.yaw.toFixed(0)}°</span>
                          <span>Pitch: {currentAngle.pitch.toFixed(0)}°</span>
                          <span>Roll: {currentAngle.roll.toFixed(0)}°</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30">
                      <div className="space-y-1">
                        {targetAngle === 'front' ? (
                          <>
                            <p className="text-yellow-400 font-medium">↕️ 얼굴을 정면으로 맞춰주세요</p>
                            <p className="text-white/80 text-xs">• 화면 중앙의 가이드에 얼굴을 맞추세요</p>
                            <p className="text-white/80 text-xs">• 고개를 똑바로 세우고 정면을 바라보세요</p>
                          </>
                        ) : targetAngle === 'left' ? (
                          <>
                            <p className="text-yellow-400 font-medium">↶ 얼굴을 왼쪽으로 돌려주세요</p>
                            <p className="text-white/80 text-xs">• 얼굴을 왼쪽으로 15-45도 돌리세요</p>
                            <p className="text-white/80 text-xs">• 고개는 정면을 유지하고 얼굴만 돌리세요</p>
                          </>
                        ) : (
                          <>
                            <p className="text-yellow-400 font-medium">↷ 얼굴을 오른쪽으로 돌려주세요</p>
                            <p className="text-white/80 text-xs">• 얼굴을 오른쪽으로 15-45도 돌리세요</p>
                            <p className="text-white/80 text-xs">• 고개는 정면을 유지하고 얼굴만 돌리세요</p>
                          </>
                        )}
                      </div>
                      {currentAngle && (
                        <div className="flex justify-center gap-3 text-xs text-white/70 pt-1 border-t border-white/10">
                          <span>현재 Yaw: {currentAngle.yaw.toFixed(0)}°</span>
                          <span>Pitch: {currentAngle.pitch.toFixed(0)}°</span>
                          <span>Roll: {currentAngle.roll.toFixed(0)}°</span>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-400/30">
                    <p className="text-blue-400 font-medium">👤 얼굴을 카메라에 맞춰주세요</p>
                    <p className="text-white/80 text-xs mt-1">
                      • 얼굴이 화면 중앙에 보이도록 위치를 조정하세요
                    </p>
                    <p className="text-white/80 text-xs">
                      • 밝은 조명에서 촬영하면 더 정확합니다
                    </p>
                  </div>
                )}
              </div>
              <Button
                onClick={handleManualCapture}
                disabled={!faceDetected}
                className="bg-white text-black hover:bg-gray-100"
              >
                <Camera className="w-5 h-5 mr-2" />
                수동 촬영
              </Button>
            </>
          ) : (
            <Button
              onClick={handleManualCapture}
              className="bg-white text-black hover:bg-gray-100 w-20 h-20 rounded-full"
            >
              <Camera className="w-8 h-8" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

