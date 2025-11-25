// 간단한 클라이언트 자체 분석 로직 (비용 절감용)

export interface SkinAnalysisResult {
  totalScore: number // 0-100
  skinAge: number // 피부 나이
  mainIssue: 'pigmentation' | 'pores' | 'wrinkles' | 'acne' // 주요 문제
  issues: {
    pigmentation: number // 0-100
    pores: number // 0-100
    wrinkles: number // 0-100
    acne: number // 0-100
  }
}

export interface TreatmentRecommendation {
  id: string
  name: string
  nameEn: string
  tags: string[]
  pain: { level: string; score: number } // 1-5
  recovery: string
  price: string
  priceNote: string
}

/**
 * 간단한 피부 분석 함수 (랜덤 확률 + 규칙 기반)
 * @param imageData - 이미지 데이터 (현재는 사용하지 않지만 향후 확장 가능)
 * @returns 분석 결과
 */
export function analyzeSkin(imageData?: any): SkinAnalysisResult {
  // 랜덤으로 주요 문제 선택 (가중치 적용)
  const random = Math.random()
  let mainIssue: 'pigmentation' | 'pores' | 'wrinkles' | 'acne'
  
  if (random < 0.4) {
    mainIssue = 'pigmentation' // 40% 확률
  } else if (random < 0.7) {
    mainIssue = 'pores' // 30% 확률
  } else if (random < 0.9) {
    mainIssue = 'wrinkles' // 20% 확률
  } else {
    mainIssue = 'acne' // 10% 확률
  }

  // 각 문제별 점수 생성 (주요 문제는 높게, 나머지는 낮게)
  const issues = {
    pigmentation: mainIssue === 'pigmentation' 
      ? Math.floor(Math.random() * 30 + 50) // 50-80
      : Math.floor(Math.random() * 40 + 20), // 20-60
    pores: mainIssue === 'pores'
      ? Math.floor(Math.random() * 30 + 50) // 50-80
      : Math.floor(Math.random() * 40 + 20), // 20-60
    wrinkles: mainIssue === 'wrinkles'
      ? Math.floor(Math.random() * 30 + 50) // 50-80
      : Math.floor(Math.random() * 40 + 20), // 20-60
    acne: mainIssue === 'acne'
      ? Math.floor(Math.random() * 30 + 50) // 50-80
      : Math.floor(Math.random() * 40 + 20), // 20-60
  }

  // 종합 점수 계산 (주요 문제가 낮을수록 점수가 높음)
  const mainIssueScore = issues[mainIssue]
  const totalScore = Math.max(40, 100 - mainIssueScore + Math.floor(Math.random() * 20))

  // 피부 나이 계산 (점수 기반, 20-35세 범위)
  const skinAge = Math.floor(20 + (100 - totalScore) / 4)

  return {
    totalScore,
    skinAge,
    mainIssue,
    issues,
  }
}

/**
 * 분석 결과에 따른 추천 시술 반환
 * @param analysisResult - 분석 결과
 * @returns 추천 시술 정보
 */
export function getRecommendedTreatment(
  analysisResult: SkinAnalysisResult
): TreatmentRecommendation {
  const { mainIssue } = analysisResult

  // 추천 로직
  switch (mainIssue) {
    case 'pigmentation':
      return {
        id: 'pico-toning',
        name: '피코 슈어 토닝',
        nameEn: 'PicoSure Toning',
        tags: ['재발 방지', '톤업 효과'],
        pain: { level: '거의 없음', score: 1 },
        recovery: '즉시 일상생활',
        price: '8.9만원~',
        priceNote: '1회 기준',
      }
    
    case 'pores':
      return {
        id: 'secret-laser',
        name: '시크릿 레이저',
        nameEn: 'Secret Laser',
        tags: ['모공 개선', '피지 조절'],
        pain: { level: '약간 있음', score: 2 },
        recovery: '1-2일',
        price: '12.5만원~',
        priceNote: '1회 기준',
      }
    
    case 'wrinkles':
      return {
        id: 'ulthera',
        name: '울쎄라',
        nameEn: 'Ulthera',
        tags: ['리프팅', '탄력 개선'],
        pain: { level: '보통', score: 3 },
        recovery: '3-5일',
        price: '45만원~',
        priceNote: '1회 기준',
      }
    
    case 'acne':
      return {
        id: 'acne-treatment',
        name: '여드름 레이저',
        nameEn: 'Acne Laser',
        tags: ['염증 완화', '재발 방지'],
        pain: { level: '약간 있음', score: 2 },
        recovery: '2-3일',
        price: '6.5만원~',
        priceNote: '1회 기준',
      }
    
    default:
      // 기본값 (피코 토닝)
      return {
        id: 'pico-toning',
        name: '피코 슈어 토닝',
        nameEn: 'PicoSure Toning',
        tags: ['재발 방지', '톤업 효과'],
        pain: { level: '거의 없음', score: 1 },
        recovery: '즉시 일상생활',
        price: '8.9만원~',
        priceNote: '1회 기준',
      }
  }
}





