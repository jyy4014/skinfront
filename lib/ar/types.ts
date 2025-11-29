import type { NormalizedLandmark } from '@mediapipe/face_mesh'

export interface ARCameraProps {
    className?: string
    onComplete?: () => void // 분석 완료 시 콜백 (모달 닫기 등)
    isReady?: boolean // 카메라 초기화 준비 완료 여부 (Lazy Initialization)
}

export type ScanningStage = 'idle' | 'scanning' | 'processing' | 'complete'

export interface FaceBounds {
    x: number
    y: number
    width: number
    height: number
    centerX: number
    centerY: number
}

export interface LightingCheckResult {
    ok: boolean
    message: string
}

export interface PoseCheckResult {
    ok: boolean
    message: string
    yawRatio: number
    pitchValue: number
    rollAngle: number
}

export interface AlignmentResult {
    aligned: boolean
    message: string
    color: 'white' | 'yellow' | 'mint'
}

export interface DebugInfo {
    faceDetected: boolean
    faceWidthRatio: number
    faceHeightRatio: number
    centerOffsetX: number
    centerOffsetY: number
    glabellaY: number
    brightness: number
    status: 'Waiting' | 'Lock-on' | 'Capturing'
    poseOk: boolean
    yawRatio: number
    pitchValue: number
    rollAngle: number
}

export const CAPTURE_QUALITY = 1.0
export const TRACKING_CANVAS_WIDTH = 360
export const CAPTURE_WIDTH = 1920
export const CAPTURE_HEIGHT = 1080
