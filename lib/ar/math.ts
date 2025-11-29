import type { NormalizedLandmark } from '@mediapipe/face_mesh'
import type { FaceBounds, PoseCheckResult, AlignmentResult } from './types'

// 얼굴 경계 계산 (너비, 높이, 중심점)
export const calculateFaceBounds = (
    landmarks: NormalizedLandmark[],
    width: number,
    height: number
): FaceBounds => {
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

// 얼굴 각도(Pose) 감지 함수 - 🧑 Human-Centric 로직
export const checkFacePose = (landmarks: NormalizedLandmark[]): PoseCheckResult => {
    if (landmarks.length < 468) {
        return { ok: false, message: '얼굴 랜드마크 부족', yawRatio: 1, pitchValue: 0, rollAngle: 0 }
    }

    try {
        // MediaPipe Face Mesh 랜드마크 인덱스
        const NOSE_TIP = 1 // 코끝
        const LEFT_EAR = 234 // 왼쪽 귀
        const RIGHT_EAR = 454 // 오른쪽 귀
        const LEFT_EYE_OUTER = 33 // 왼쪽 눈 바깥쪽
        const RIGHT_EYE_OUTER = 263 // 오른쪽 눈 바깥쪽

        const noseTip = landmarks[NOSE_TIP]
        const leftEar = landmarks[LEFT_EAR]
        const rightEar = landmarks[RIGHT_EAR]
        const leftEyeOuter = landmarks[LEFT_EYE_OUTER]
        const rightEyeOuter = landmarks[RIGHT_EYE_OUTER]

        // ═══════════════════════════════════════════════════════════════
        // 🥇 1순위: Yaw (좌우 대칭) - "대칭성 체크" (가장 중요!)
        // ═══════════════════════════════════════════════════════════════
        const leftDist = Math.abs(noseTip.x - leftEar.x)
        const rightDist = Math.abs(noseTip.x - rightEar.x)

        // 🔓 완화됨: 비율 계산: 1.0 = 완벽한 대칭, 0.7~1.4 = 허용 범위 (40% 오차)
        const yawRatio = leftDist / rightDist

        if (yawRatio < 0.7 || yawRatio > 1.4) {
            const direction = yawRatio < 1
                ? '👈 얼굴을 왼쪽으로 살짝 돌려주세요'
                : '👉 얼굴을 오른쪽으로 살짝 돌려주세요'
            return { ok: false, message: direction, yawRatio, pitchValue: 0, rollAngle: 0 }
        }

        // ═══════════════════════════════════════════════════════════════
        // 🥈 2순위: Roll (갸우뚱) - "수평 맞추기"
        // ═══════════════════════════════════════════════════════════════
        const eyeDeltaX = Math.abs(rightEyeOuter.x - leftEyeOuter.x)
        const eyeDeltaY = rightEyeOuter.y - leftEyeOuter.y
        const rollAngle = Math.atan2(Math.abs(eyeDeltaY), eyeDeltaX) * (180 / Math.PI)

        // 🔓 완화됨: ±10도까지 허용
        if (rollAngle > 10) {
            const direction = eyeDeltaY > 0
                ? '↩️ 고개를 살짝 왼쪽으로 기울여주세요'
                : '↪️ 고개를 살짝 오른쪽으로 기울여주세요'
            return { ok: false, message: direction, yawRatio, pitchValue: 0, rollAngle }
        }

        // ═══════════════════════════════════════════════════════════════
        // 🥉 3순위: Pitch (상하 기울기) - "내려다보기 허용" (가장 느슨)
        // ═══════════════════════════════════════════════════════════════
        const earCenterY = (leftEar.y + rightEar.y) / 2
        const pitchValue = (noseTip.y - earCenterY) * 100

        // 🔓 완화됨: 고개 들기(Up) 제한
        if (pitchValue < -10) {
            return { ok: false, message: '⬇️ 턱을 살짝 내려주세요', yawRatio, pitchValue, rollAngle }
        }

        // 🔓 완화됨: 고개 숙이기(Down) 허용
        if (pitchValue > 22) {
            return { ok: false, message: '⬆️ 고개를 살짝 들어주세요', yawRatio, pitchValue, rollAngle }
        }

        return { ok: true, message: '', yawRatio, pitchValue, rollAngle }
    } catch (error) {
        console.error('Pose check error:', error)
        return { ok: false, message: '자세 판정 오류', yawRatio: 1, pitchValue: 0, rollAngle: 0 }
    }
}

// 얼굴 정렬 검사 및 실시간 피드백
export const checkFaceAlignmentWithFeedback = (
    landmarks: NormalizedLandmark[],
    screenWidth: number,
    screenHeight: number,
    faceBounds: FaceBounds,
    lightingOk: boolean,
    lightingMessage: string,
    isScreenLightOn: boolean,
    poseCheck: PoseCheckResult,
    setDebugInfo: (info: any) => void
): AlignmentResult => {
    const guideWidth = screenWidth * 0.7
    const guideHeight = screenHeight * 0.55
    const guideCenterX = screenWidth / 2

    // 1. 조명 검사
    if (!lightingOk && !isScreenLightOn) {
        return { aligned: false, message: lightingMessage, color: 'yellow' }
    }

    const GLABELLA_INDEX = 168
    const glabella = GLABELLA_INDEX < landmarks.length ? landmarks[GLABELLA_INDEX] : null
    const referenceX = glabella ? glabella.x * screenWidth : 0
    const normalizedY = glabella ? glabella.y : 0
    const normalizedOffsetX = glabella ? (referenceX - guideCenterX) / screenWidth : 0

    const idealY = 0.40
    const normalizedOffsetY = glabella ? normalizedY - idealY : 0

    const faceWidthRatio = faceBounds.width / guideWidth
    const faceHeightRatio = faceBounds.height / guideHeight

    // 디버그 정보 업데이트
    setDebugInfo((prev: any) => ({
        ...prev,
        poseOk: poseCheck.ok,
        yawRatio: Math.round(poseCheck.yawRatio * 100) / 100,
        pitchValue: Math.round(poseCheck.pitchValue * 10) / 10,
        rollAngle: Math.round(poseCheck.rollAngle * 10) / 10,
        faceWidthRatio: Math.round(faceWidthRatio * 100),
        faceHeightRatio: Math.round(faceHeightRatio * 100),
        centerOffsetX: Math.round(normalizedOffsetX * 100) / 100,
        centerOffsetY: Math.round(normalizedOffsetY * 100) / 100,
        glabellaY: Math.round(normalizedY * 100),
    }))

    // 2. 위치(Center) 검사
    if (!glabella) {
        return { aligned: false, message: '👤 얼굴을 가이드 안에 맞춰주세요', color: 'white' }
    }

    if (normalizedY > 0.50) {
        return { aligned: false, message: '📱 핸드폰을 더 높이 들어주세요', color: 'white' }
    }

    const maxYOffset = 0.12
    const yOffset = normalizedY - idealY

    if (Math.abs(yOffset) > maxYOffset) {
        if (yOffset > 0) {
            return { aligned: false, message: '⬆️ 폰을 높여주세요', color: 'white' }
        } else {
            return { aligned: false, message: '⬇️ 폰을 낮춰주세요', color: 'white' }
        }
    }

    const maxXOffset = 0.12
    if (Math.abs(normalizedOffsetX) > maxXOffset) {
        if (normalizedOffsetX > 0) {
            return { aligned: false, message: '⬅️ 얼굴을 중앙으로', color: 'white' }
        } else {
            return { aligned: false, message: '➡️ 얼굴을 중앙으로', color: 'white' }
        }
    }

    // 3. 거리(크기) 검사
    const MIN_SIZE_RATIO = 0.50
    const MAX_SIZE_RATIO = 0.90

    if (faceWidthRatio < MIN_SIZE_RATIO) {
        return { aligned: false, message: '🔍 더 가까이 오세요', color: 'white' }
    }

    if (faceWidthRatio > MAX_SIZE_RATIO) {
        return { aligned: false, message: '✋ 조금만 뒤로 가세요', color: 'white' }
    }

    // 4. 각도(Pose) 검사
    if (!poseCheck.ok) {
        return { aligned: false, message: poseCheck.message, color: 'yellow' }
    }

    return { aligned: true, message: '✨ 완벽해요!', color: 'mint' }
}
