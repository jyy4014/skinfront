import { useState, useRef, useCallback } from 'react'
import type { NormalizedLandmark } from '@mediapipe/face_mesh'
import type { DebugInfo, PoseCheckResult, AlignmentResult } from '../../ar/types'
import { checkFacePose, checkFaceAlignmentWithFeedback, calculateFaceBounds } from '../../ar/math'

export const useARAnalysis = () => {
    const [debugInfo, setDebugInfo] = useState<DebugInfo>({
        faceDetected: false,
        faceWidthRatio: 0,
        faceHeightRatio: 0,
        centerOffsetX: 0,
        centerOffsetY: 0,
        glabellaY: 0,
        brightness: 0,
        status: 'Waiting',
        poseOk: false,
        yawRatio: 0,
        pitchValue: 0,
        rollAngle: 0,
    })

    const [guideMessage, setGuideMessage] = useState('얼굴을 가이드 안에 맞춰주세요')
    const [guideColor, setGuideColor] = useState<'white' | 'yellow' | 'mint'>('white')
    const [lightingStatus, setLightingStatus] = useState<'ok' | 'too-dark'>('ok')
    const [poseStatus, setPoseStatus] = useState<'ok' | 'not-frontal'>('ok')
    const [faceAlignment, setFaceAlignment] = useState<'none' | 'aligned'>('none')

    const lastLightingCheckRef = useRef<number>(0)
    const landmarksRef = useRef<NormalizedLandmark[] | null>(null)

    // 조명(밝기) 감지 함수
    const checkLighting = useCallback((video: HTMLVideoElement | null, isScreenLightOn: boolean, forceCheck: boolean = false): { ok: boolean; message: string } => {
        if (!video || video.readyState < video.HAVE_METADATA) {
            return { ok: true, message: '' }
        }

        if (isScreenLightOn) {
            return { ok: true, message: '' }
        }

        const now = Date.now()
        if (!forceCheck && now - lastLightingCheckRef.current < 500) {
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

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

            const sampleWidth = Math.floor(canvas.width * 0.3)
            const sampleHeight = Math.floor(canvas.height * 0.3)
            const startX = Math.floor((canvas.width - sampleWidth) / 2)
            const startY = Math.floor((canvas.height - sampleHeight) / 2)

            const imageData = ctx.getImageData(startX, startY, sampleWidth, sampleHeight)
            const data = imageData.data

            let totalLuminance = 0
            let pixelCount = 0

            for (let i = 0; i < data.length; i += 40) {
                const r = data[i]
                const g = data[i + 1]
                const b = data[i + 2]
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b
                totalLuminance += luminance
                pixelCount++
            }

            const avgLuminance = totalLuminance / pixelCount

            setDebugInfo(prev => ({
                ...prev,
                brightness: Math.round(avgLuminance),
            }))

            if (avgLuminance < 80) {
                return { ok: false, message: `💡 밝기 부족! (${Math.round(avgLuminance)} → 80 필요)` }
            }

            return { ok: true, message: '' }
        } catch (error) {
            console.error('Lighting check error:', error)
            return { ok: true, message: '' }
        }
    }, [lightingStatus])

    // 통합 분석 함수
    const analyzeFace = useCallback((
        landmarks: NormalizedLandmark[],
        video: HTMLVideoElement | null,
        canvasWidth: number,
        canvasHeight: number,
        isScreenLightOn: boolean,
        isMockMode: boolean
    ) => {
        landmarksRef.current = landmarks

        // 1. 얼굴 크기 및 감지 여부
        const faceBounds = calculateFaceBounds(landmarks, canvasWidth, canvasHeight)
        const faceArea = faceBounds.width * faceBounds.height
        const screenArea = canvasWidth * canvasHeight
        const faceAreaRatio = faceArea / screenArea
        const faceDetected = faceAreaRatio >= 0.05

        setDebugInfo(prev => ({
            ...prev,
            faceDetected,
        }))

        if (!faceDetected) {
            setFaceAlignment('none')
            setGuideMessage('👤 얼굴을 화면에 보여주세요')
            setGuideColor('white')
            return { faceDetected: false, aligned: false }
        }

        // Mock Mode Bypass
        if (isMockMode) {
            setLightingStatus('ok')
            setPoseStatus('ok')
            setFaceAlignment('aligned')
            setGuideMessage('✨ 완벽해요! 움직이지 마세요')
            setGuideColor('mint')
            return { faceDetected: true, aligned: true }
        }

        // 2. 조명 체크
        const lightingCheck = checkLighting(video, isScreenLightOn)
        if (!lightingCheck.ok) {
            setLightingStatus('too-dark')
        } else {
            setLightingStatus('ok')
        }

        // 3. 포즈 체크
        const poseCheck = checkFacePose(landmarks)
        if (!poseCheck.ok) {
            setPoseStatus('not-frontal')
        } else {
            setPoseStatus('ok')
        }

        // 4. 정렬 체크 (통합)
        const alignmentResult = checkFaceAlignmentWithFeedback(
            landmarks,
            canvasWidth,
            canvasHeight,
            faceBounds,
            lightingCheck.ok,
            lightingCheck.message,
            isScreenLightOn,
            poseCheck,
            setDebugInfo
        )

        setGuideMessage(alignmentResult.message)
        setGuideColor(alignmentResult.color)
        setFaceAlignment(alignmentResult.aligned ? 'aligned' : 'none')

        return {
            faceDetected: true,
            aligned: alignmentResult.aligned,
            lightingOk: lightingCheck.ok,
            poseOk: poseCheck.ok
        }
    }, [checkLighting])

    return {
        debugInfo,
        guideMessage,
        guideColor,
        lightingStatus,
        poseStatus,
        faceAlignment,
        setFaceAlignment,
        setGuideMessage,
        setGuideColor,
        analyzeFace,
        landmarksRef,
        setDebugInfo // Expose for manual updates if needed
    }
}
