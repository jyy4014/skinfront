/**
 * 이미지 품질 검사 유틸리티
 * 조명, 초점, 각도 등을 종합적으로 평가
 */

import { checkImageQuality } from './processing'

export interface ImageQualityResult {
  overallScore: number // 0-100
  sharpness: number // 0-100 (초점)
  brightness: number // 0-100 (조명)
  angle: number // 0-100 (각도 - 얼굴 정면도)
  issues: string[] // 발견된 문제점
  recommendations: string[] // 개선 권장사항
  isGood: boolean // 분석에 적합한지 여부
}

export interface QualityCheckOptions {
  minScore?: number // 최소 허용 점수 (기본: 60)
  checkSharpness?: boolean
  checkBrightness?: boolean
  checkAngle?: boolean
}

/**
 * 이미지 품질 종합 검사
 */
export async function checkImageQualityComprehensive(
  file: File,
  options: QualityCheckOptions = {}
): Promise<ImageQualityResult> {
  const {
    minScore = 60,
    checkSharpness = true,
    checkBrightness = true,
    checkAngle = true,
  } = options

  const issues: string[] = []
  const recommendations: string[] = []

  // 1. 초점 검사 (Laplacian variance)
  let sharpness = 100
  if (checkSharpness) {
    try {
      const sharpnessScore = await checkImageQuality(file)
      sharpness = Math.round(sharpnessScore * 100)
      
      if (sharpness < 50) {
        issues.push('이미지가 흐릿합니다')
        recommendations.push('더 선명한 사진을 촬영해주세요')
      } else if (sharpness < 70) {
        recommendations.push('초점을 더 정확히 맞춰주세요')
      }
    } catch (error) {
      issues.push('초점 검사 실패')
      sharpness = 0
    }
  }

  // 2. 조명 검사 (밝기 분석)
  let brightness = 100
  if (checkBrightness) {
    try {
      brightness = await analyzeBrightness(file)
      
      if (brightness < 40) {
        issues.push('조명이 너무 어둡습니다')
        recommendations.push('밝은 곳에서 촬영해주세요')
      } else if (brightness < 60) {
        recommendations.push('조명을 더 밝게 해주세요')
      } else if (brightness > 90) {
        issues.push('조명이 너무 밝습니다')
        recommendations.push('과도한 조명을 피해주세요')
      }
    } catch (error) {
      issues.push('조명 검사 실패')
      brightness = 50
    }
  }

  // 3. 각도 검사 (얼굴 정면도)
  let angle = 100
  if (checkAngle) {
    try {
      angle = await analyzeFaceAngle(file)
      
      if (angle < 60) {
        issues.push('얼굴이 정면이 아닙니다')
        recommendations.push('정면을 향해 촬영해주세요')
      } else if (angle < 80) {
        recommendations.push('얼굴을 더 정면으로 향해주세요')
      }
    } catch (error) {
      // 얼굴 감지 실패는 각도 검사 스킵 (너무 엄격하지 않게)
      angle = 75 // 기본값
    }
  }

  // 4. 종합 점수 계산 (가중 평균)
  // 가중치 합은 정확히 1.0이어야 함 (검증)
  const weights = {
    sharpness: 0.4, // 초점이 가장 중요
    brightness: 0.35, // 조명도 중요
    angle: 0.25, // 각도는 상대적으로 덜 중요
  } as const

  // 가중치 합 검증 (개발 중에만)
  if (process.env.NODE_ENV === 'development') {
    const weightsSum = weights.sharpness + weights.brightness + weights.angle
    if (Math.abs(weightsSum - 1.0) > 0.0001) {
      console.warn(`가중치 합이 1.0이 아닙니다: ${weightsSum}`)
    }
  }

  const overallScore = Math.round(
    sharpness * weights.sharpness +
    brightness * weights.brightness +
    angle * weights.angle
  )

  // 점수 범위 검증 (0-100)
  const clampedOverallScore = Math.max(0, Math.min(100, overallScore))

  // 5. 최종 판정
  const isGood = clampedOverallScore >= minScore && issues.length === 0

  return {
    overallScore: clampedOverallScore,
    sharpness: Math.max(0, Math.min(100, sharpness)),
    brightness: Math.max(0, Math.min(100, brightness)),
    angle: Math.max(0, Math.min(100, angle)),
    issues,
    recommendations,
    isGood,
  }
}

/**
 * 이미지 밝기 검사
 * @returns 0-100 점수 (50이 적정, 40 미만은 어둡고, 90 초과는 너무 밝음)
 */
async function analyzeBrightness(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // 전체 픽셀의 평균 밝기 계산
        let totalBrightness = 0
        let pixelCount = 0

        for (let i = 0; i < data.length; i += 4) {
          // RGB를 그레이스케일로 변환 (0-255)
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const gray = (r + g + b) / 3
          
          totalBrightness += gray
          pixelCount++
        }

        // Division by zero 방지
        if (pixelCount === 0) {
          // 빈 이미지인 경우 기본값 반환 (에러 대신)
          resolve(50) // 중간값 반환
          return
        }

        const averageBrightness = totalBrightness / pixelCount

        // 0-255 범위를 0-100으로 정규화
        // 적정 밝기는 100-150 정도 (약 40-60점)
        // 너무 어두움: 0-80 (0-30점)
        // 너무 밝음: 200-255 (80-100점)
        let score: number
        if (averageBrightness < 80) {
          // 너무 어두움
          score = (averageBrightness / 80) * 40
        } else if (averageBrightness <= 150) {
          // 적정 밝기
          score = 40 + ((averageBrightness - 80) / 70) * 20
        } else if (averageBrightness <= 200) {
          // 약간 밝음 (양호)
          score = 60 + ((averageBrightness - 150) / 50) * 20
        } else {
          // 너무 밝음
          score = 80 + ((averageBrightness - 200) / 55) * 20
          if (score > 100) score = 100
        }

        resolve(Math.round(score))
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * 얼굴 각도 검사 (간단한 휴리스틱)
 * 실제 얼굴 인식이 어려우므로 이미지 비율과 중심점을 기반으로 추정
 * @returns 0-100 점수 (100이 정면)
 */
async function analyzeFaceAngle(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // 얼굴 인식이 없으므로 간단한 휴리스틱 사용
        // 실제로는 얼굴 인식 라이브러리(예: face-api.js)를 사용하는 것이 좋음
        
        // Division by zero 방지
        if (img.width === 0 || img.height === 0) {
          resolve(75) // 기본값 반환
          return
        }
        
        // 이미지 비율이 정사각형에 가까울수록 좋음 (얼굴이 중앙에 있을 가능성)
        const aspectRatio = img.width / img.height
        
        // Division by zero 방지 (height가 0인 경우는 이미 위에서 처리)
        if (!isFinite(aspectRatio)) {
          resolve(75) // 기본값 반환
          return
        }
        const ratioScore = aspectRatio >= 0.7 && aspectRatio <= 1.3 ? 80 : 60

        // 기본적으로 양호한 점수 반환 (너무 엄격하지 않게)
        // 향후 얼굴 인식 라이브러리로 교체 가능
        resolve(ratioScore)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * 품질 점수를 사용자 친화적 메시지로 변환
 */
export function getQualityMessage(score: number): {
  message: string
  color: 'green' | 'yellow' | 'red'
  icon: 'check-circle' | 'alert-circle' | 'x-circle'
} {
  if (score >= 80) {
    return {
      message: '완벽해요! 분석에 적합한 사진입니다',
      color: 'green',
      icon: 'check-circle',
    }
  } else if (score >= 60) {
    return {
      message: '좋아요! 분석 가능한 사진입니다',
      color: 'green',
      icon: 'check-circle',
    }
  } else if (score >= 40) {
    return {
      message: '개선이 필요합니다. 더 나은 사진을 권장합니다',
      color: 'yellow',
      icon: 'alert-circle',
    }
  } else {
    return {
      message: '재촬영을 권장합니다',
      color: 'red',
      icon: 'x-circle',
    }
  }
}

