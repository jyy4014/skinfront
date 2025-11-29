import type { NormalizedLandmark } from '@mediapipe/face_mesh'
import type { ScanningStage } from './types'

// 얼굴 윤곽선 (Tessellation) 그리기
export const drawFaceTessellation = (
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    width: number,
    height: number
) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 0.5
    ctx.beginPath()

    const faceOutline = [
        10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10
    ]

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

    const connections = [
        [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
        [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
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
export const drawProblemArea = (
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    width: number,
    height: number
) => {
    const rightCheekIndices = [234, 227, 116, 117, 118, 119, 120, 121, 126, 142, 36, 205, 206, 207, 454]

    if (rightCheekIndices.length === 0) return

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

    const radius = 40
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'
    ctx.fill()

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
export const drawScanLine = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scanningStage: ScanningStage,
    scanLineY: number
) => {
    if (scanningStage === 'processing') {
        const blink = Math.sin(Date.now() / 200) > 0
        if (!blink) return
    }

    const lineY = scanningStage === 'scanning' ? scanLineY : height / 2
    const gradient = ctx.createLinearGradient(0, lineY - 10, 0, lineY + 10)
    gradient.addColorStop(0, 'rgba(0, 255, 194, 0)')
    gradient.addColorStop(0.5, scanningStage === 'processing' ? 'rgba(0, 255, 194, 1)' : 'rgba(0, 255, 194, 0.8)')
    gradient.addColorStop(1, 'rgba(0, 255, 194, 0)')

    ctx.strokeStyle = gradient
    ctx.lineWidth = scanningStage === 'processing' ? 4 : 3
    ctx.beginPath()
    ctx.moveTo(0, lineY)
    ctx.lineTo(width, lineY)
    ctx.stroke()

    ctx.shadowBlur = scanningStage === 'processing' ? 20 : 15
    ctx.shadowColor = 'rgba(0, 255, 194, 0.6)'
    ctx.stroke()
    ctx.shadowBlur = 0
}
