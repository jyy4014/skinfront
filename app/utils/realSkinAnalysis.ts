/**
 * 실제 이미지 픽셀 분석을 통한 피부 상태 분석
 * MediaPipe Face Mesh 랜드마크를 활용한 휴리스틱 분석 알고리즘
 */

export type SkinGrade = '양호' | '주의' | '위험'

export interface SkinDetail {
  score: number // 0-100 (높을수록 좋음)
  grade: SkinGrade
}

export interface RealSkinAnalysisResult {
  totalScore: number // 0-100 (종합 점수)
  details: {
    pigmentation: SkinDetail // 기미 (brightness 매핑)
    pores: SkinDetail // 모공 (texture 매핑)
    wrinkles: SkinDetail // 주름 (darkCircles 매핑)
    acne: SkinDetail // 여드름 (redness 매핑)
  }
  primaryConcern: string // 점수가 가장 낮은 항목의 한글 이름 (예: '기미')
}

/**
 * MediaPipe Face Mesh 랜드마크 인덱스 정의
 */
const LANDMARK_INDICES = {
  // 양쪽 볼 (Cheeks)
  leftCheek: [234, 227, 116, 117, 118, 119, 120, 121, 126, 142, 36, 205, 206, 207],
  rightCheek: [454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149],
  
  // 이마 (Forehead)
  forehead: [10, 151, 337, 299, 333, 298, 301, 368, 264, 447, 366, 401, 435, 410, 454],
  
  // 눈 밑 (Under Eyes)
  leftUnderEye: [23, 24, 25, 110, 111, 112, 226, 228, 229, 230, 231, 232, 233],
  rightUnderEye: [243, 244, 245, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475],
} as const

/**
 * 이미지를 Canvas에 로드하고 ImageData 반환
 */
function loadImageToCanvas(imageSrc: string): Promise<{ canvas: HTMLCanvasElement; imageData: ImageData; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      resolve({ canvas, imageData, width: canvas.width, height: canvas.height })
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    img.src = imageSrc
  })
}

/**
 * 랜드마크 좌표를 픽셀 좌표로 변환
 */
function landmarkToPixel(landmark: { x: number; y: number }, width: number, height: number): { x: number; y: number } {
  return {
    x: Math.round(landmark.x * width),
    y: Math.round(landmark.y * height),
  }
}

/**
 * ROI 영역에서 픽셀 샘플 추출 (10x10 영역)
 */
function extractPixelSamples(
  imageData: ImageData,
  centerX: number,
  centerY: number,
  sampleSize: number = 10
): Uint8ClampedArray[] {
  const samples: Uint8ClampedArray[] = []
  const halfSize = Math.floor(sampleSize / 2)
  
  for (let dy = -halfSize; dy <= halfSize; dy++) {
    for (let dx = -halfSize; dx <= halfSize; dx++) {
      const x = centerX + dx
      const y = centerY + dy
      
      if (x >= 0 && x < imageData.width && y >= 0 && y < imageData.height) {
        const index = (y * imageData.width + x) * 4
        const pixel = imageData.data.slice(index, index + 4) // RGBA
        samples.push(new Uint8ClampedArray(pixel))
      }
    }
  }
  
  return samples
}

/**
 * 여러 랜드마크 포인트의 중심 좌표 계산
 */
function getCenterPoint(
  landmarks: any[],
  indices: number[],
  width: number,
  height: number
): { x: number; y: number } | null {
  if (!landmarks || landmarks.length === 0) return null
  
  let sumX = 0
  let sumY = 0
  let count = 0
  
  indices.forEach((idx) => {
    if (idx < landmarks.length) {
      const pixel = landmarkToPixel(landmarks[idx], width, height)
      sumX += pixel.x
      sumY += pixel.y
      count++
    }
  })
  
  if (count === 0) return null
  
  return {
    x: Math.round(sumX / count),
    y: Math.round(sumY / count),
  }
}

/**
 * 픽셀 샘플들의 평균 RGB 값 계산
 */
function getAverageRGB(samples: Uint8ClampedArray[]): { r: number; g: number; b: number } {
  if (samples.length === 0) return { r: 0, g: 0, b: 0 }
  
  let sumR = 0
  let sumG = 0
  let sumB = 0
  
  samples.forEach((pixel) => {
    sumR += pixel[0] // R
    sumG += pixel[1] // G
    sumB += pixel[2] // B
  })
  
  return {
    r: sumR / samples.length,
    g: sumG / samples.length,
    b: sumB / samples.length,
  }
}

/**
 * 밝기(Luminance) 계산: 0.299*R + 0.587*G + 0.114*B
 */
function calculateLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * 픽셀 샘플들의 표준편차 계산 (거칠기 측정)
 */
function calculateStandardDeviation(samples: Uint8ClampedArray[]): number {
  if (samples.length === 0) return 0
  
  // 각 픽셀의 밝기 계산
  const luminances = samples.map((pixel) => {
    return calculateLuminance(pixel[0], pixel[1], pixel[2])
  })
  
  // 평균 계산
  const mean = luminances.reduce((sum, val) => sum + val, 0) / luminances.length
  
  // 분산 계산
  const variance = luminances.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / luminances.length
  
  // 표준편차 반환
  return Math.sqrt(variance)
}

/**
 * 점수를 등급으로 변환
 * @param score - 0-100 점수
 * @returns 등급 ('양호' | '주의' | '위험')
 * 
 * 등급 기준:
 * - 80점 이상: '양호' (🟢 Green)
 * - 50~79점: '주의' (🟠 Orange)
 * - 50점 미만: '위험' (🔴 Red)
 */
function scoreToGrade(score: number): SkinGrade {
  if (score >= 80) return '양호'
  if (score >= 50) return '주의'
  return '위험'
}

/**
 * 항목 키를 한글 이름으로 변환
 */
function getKoreanName(key: 'pigmentation' | 'pores' | 'wrinkles' | 'acne'): string {
  const names: Record<string, string> = {
    pigmentation: '기미',
    pores: '모공',
    wrinkles: '주름',
    acne: '여드름',
  }
  return names[key] || '알 수 없음'
}

/**
 * 실제 이미지 픽셀 분석을 통한 피부 상태 분석
 * @param imageSrc - 이미지 소스 (base64 또는 URL)
 * @param landmarks - MediaPipe Face Mesh 랜드마크 배열
 * @returns 분석 결과
 */
export async function analyzeSkinCondition(
  imageSrc: string,
  landmarks: any[]
): Promise<RealSkinAnalysisResult> {
  try {
    // 디버깅: 랜드마크 확인
    console.log('🔍 [Skin Analysis] Landmarks received:', {
      hasLandmarks: !!landmarks,
      landmarksLength: landmarks?.length || 0,
      firstLandmark: landmarks?.[0],
    })
    
    // 1. 이미지를 Canvas에 로드
    const { imageData, width, height } = await loadImageToCanvas(imageSrc)
    console.log('🖼️ [Skin Analysis] Image loaded:', { width, height })
    
    if (!landmarks || landmarks.length === 0) {
      // 랜드마크가 없으면 기본값 반환
      console.warn('⚠️ [Skin Analysis] No landmarks found, returning default scores')
      const defaultScore = 50
      return {
        totalScore: defaultScore,
        details: {
          pigmentation: { score: defaultScore, grade: scoreToGrade(defaultScore) },
          pores: { score: defaultScore, grade: scoreToGrade(defaultScore) },
          wrinkles: { score: defaultScore, grade: scoreToGrade(defaultScore) },
          acne: { score: defaultScore, grade: scoreToGrade(defaultScore) },
        },
        primaryConcern: '기미',
      }
    }
    
    // 2. ROI 영역 추출
    const leftCheekCenter = getCenterPoint(landmarks, LANDMARK_INDICES.leftCheek, width, height)
    const rightCheekCenter = getCenterPoint(landmarks, LANDMARK_INDICES.rightCheek, width, height)
    const foreheadCenter = getCenterPoint(landmarks, LANDMARK_INDICES.forehead, width, height)
    const leftUnderEyeCenter = getCenterPoint(landmarks, LANDMARK_INDICES.leftUnderEye, width, height)
    const rightUnderEyeCenter = getCenterPoint(landmarks, LANDMARK_INDICES.rightUnderEye, width, height)
    
    console.log('📍 [Skin Analysis] ROI Centers:', {
      leftCheek: leftCheekCenter,
      rightCheek: rightCheekCenter,
      forehead: foreheadCenter,
      leftUnderEye: leftUnderEyeCenter,
      rightUnderEye: rightUnderEyeCenter,
    })
    
    // 3. 픽셀 샘플 추출
    const leftCheekSamples = leftCheekCenter
      ? extractPixelSamples(imageData, leftCheekCenter.x, leftCheekCenter.y)
      : []
    const rightCheekSamples = rightCheekCenter
      ? extractPixelSamples(imageData, rightCheekCenter.x, rightCheekCenter.y)
      : []
    const foreheadSamples = foreheadCenter
      ? extractPixelSamples(imageData, foreheadCenter.x, foreheadCenter.y)
      : []
    const leftUnderEyeSamples = leftUnderEyeCenter
      ? extractPixelSamples(imageData, leftUnderEyeCenter.x, leftUnderEyeCenter.y)
      : []
    const rightUnderEyeSamples = rightUnderEyeCenter
      ? extractPixelSamples(imageData, rightUnderEyeCenter.x, rightUnderEyeCenter.y)
      : []
    
    // 모든 볼 샘플 합치기
    const allCheekSamples = [...leftCheekSamples, ...rightCheekSamples]
    const allUnderEyeSamples = [...leftUnderEyeSamples, ...rightUnderEyeSamples]
    
    console.log('📊 [Skin Analysis] Pixel Samples:', {
      leftCheekSamples: leftCheekSamples.length,
      rightCheekSamples: rightCheekSamples.length,
      foreheadSamples: foreheadSamples.length,
      leftUnderEyeSamples: leftUnderEyeSamples.length,
      rightUnderEyeSamples: rightUnderEyeSamples.length,
      allCheekSamples: allCheekSamples.length,
      allUnderEyeSamples: allUnderEyeSamples.length,
    })
    
    // 4. 항목별 점수 계산
    
    // 🔴 민감도/붉은기 (Redness)
    let rednessScore = 100
    if (allCheekSamples.length > 0) {
      const cheekRGB = getAverageRGB(allCheekSamples)
      const avgGB = (cheekRGB.g + cheekRGB.b) / 2
      const rednessDiff = cheekRGB.r - avgGB
      
      // R이 G, B 평균보다 높으면 붉은기 (나쁨)
      // 차이가 클수록 점수 감소 (0-100점)
      rednessScore = Math.max(0, Math.min(100, 100 - rednessDiff * 2))
    }
    
    // 💡 피부 톤/칙칙함 (Brightness)
    let brightnessScore = 50
    if (allCheekSamples.length > 0 || foreheadSamples.length > 0) {
      const allFaceSamples = [...allCheekSamples, ...foreheadSamples]
      const faceRGB = getAverageRGB(allFaceSamples)
      const luminance = calculateLuminance(faceRGB.r, faceRGB.g, faceRGB.b)
      
      // 밝기가 높을수록 점수 높음 (0-255 범위를 0-100으로 정규화)
      brightnessScore = Math.max(0, Math.min(100, (luminance / 255) * 100))
    }
    
    // 🐼 다크서클 (Dark Circle)
    let darkCirclesScore = 100
    if (allCheekSamples.length > 0 && allUnderEyeSamples.length > 0) {
      const cheekRGB = getAverageRGB(allCheekSamples)
      const underEyeRGB = getAverageRGB(allUnderEyeSamples)
      
      const cheekLuminance = calculateLuminance(cheekRGB.r, cheekRGB.g, cheekRGB.b)
      const underEyeLuminance = calculateLuminance(underEyeRGB.r, underEyeRGB.g, underEyeRGB.b)
      
      // 눈 밑이 볼보다 어두우면 다크서클 (차이가 클수록 점수 감소)
      const darknessDiff = cheekLuminance - underEyeLuminance
      darkCirclesScore = Math.max(0, Math.min(100, 100 - darknessDiff * 3))
    }
    
    // 🍩 모공/거칠기 (Texture)
    let textureScore = 100
    if (allCheekSamples.length > 0) {
      // 볼 영역의 표준편차 계산
      const stdDev = calculateStandardDeviation(allCheekSamples)
      
      // 표준편차가 크면 거칠음 (나쁨)
      // 표준편차가 작을수록 점수 높음 (0-50 범위를 0-100으로 정규화)
      textureScore = Math.max(0, Math.min(100, 100 - (stdDev / 50) * 100))
    }
    
    // 5. 점수 매핑 (분석 결과 -> UI 요구사항)
    const mappedScores = {
      pigmentation: Math.round(brightnessScore), // brightness -> pigmentation (기미)
      pores: Math.round(textureScore), // texture -> pores (모공)
      wrinkles: Math.round(darkCirclesScore), // darkCircles -> wrinkles (주름)
      acne: Math.round(rednessScore), // redness -> acne (여드름)
    }
    
    console.log('💯 [Skin Analysis] Raw Scores:', {
      rednessScore,
      brightnessScore,
      darkCirclesScore,
      textureScore,
    })
    
    console.log('📈 [Skin Analysis] Mapped Scores:', mappedScores)
    
    // 6. 종합 점수 계산 (평균)
    const totalScore = Math.round(
      (mappedScores.pigmentation + mappedScores.pores + mappedScores.wrinkles + mappedScores.acne) / 4
    )
    
    // 7. 최우선 관리 항목 찾기 (점수가 가장 낮은 항목)
    const primaryKey = Object.entries(mappedScores).reduce((min, [key, value]) => {
      return value < min[1] ? [key, value] : min
    }, ['pigmentation', mappedScores.pigmentation] as [string, number])[0] as 'pigmentation' | 'pores' | 'wrinkles' | 'acne'
    
    const primaryConcern = getKoreanName(primaryKey)
    
    // 8. 결과 반환 (UI 요구사항 형식)
    return {
      totalScore,
      details: {
        pigmentation: {
          score: mappedScores.pigmentation,
          grade: scoreToGrade(mappedScores.pigmentation),
        },
        pores: {
          score: mappedScores.pores,
          grade: scoreToGrade(mappedScores.pores),
        },
        wrinkles: {
          score: mappedScores.wrinkles,
          grade: scoreToGrade(mappedScores.wrinkles),
        },
        acne: {
          score: mappedScores.acne,
          grade: scoreToGrade(mappedScores.acne),
        },
      },
      primaryConcern,
    }
  } catch (error) {
    console.error('Real skin analysis error:', error)
    
    // 에러 발생 시 기본값 반환
    const defaultScore = 50
    return {
      totalScore: defaultScore,
      details: {
        pigmentation: { score: defaultScore, grade: scoreToGrade(defaultScore) },
        pores: { score: defaultScore, grade: scoreToGrade(defaultScore) },
        wrinkles: { score: defaultScore, grade: scoreToGrade(defaultScore) },
        acne: { score: defaultScore, grade: scoreToGrade(defaultScore) },
      },
      primaryConcern: '기미',
    }
  }
}



