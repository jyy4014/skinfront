/**
 * 검증 규칙 상수
 * 
 * 파일, 폼, 데이터 검증에 사용되는 규칙들을 중앙에서 관리합니다.
 */

/**
 * 파일 검증 규칙
 */
export const FILE_VALIDATION = {
  /** 최대 파일 크기 (바이트) - 10MB */
  MAX_SIZE: 10 * 1024 * 1024,
  /** 최소 파일 크기 (바이트) - 1KB */
  MIN_SIZE: 1024,
  /** 허용되는 이미지 MIME 타입 */
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ] as const,
  /** 허용되는 파일 확장자 */
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const,
} as const

/**
 * 이미지 품질 검증 규칙
 */
export const IMAGE_QUALITY_VALIDATION = {
  /** 최소 품질 점수 (0-1) - 이 값보다 낮으면 거부 */
  MIN_QUALITY_SCORE: 0.1,
  /** 권장 품질 점수 (0-1) - 이 값보다 높으면 좋음 */
  RECOMMENDED_QUALITY_SCORE: 0.5,
} as const

/**
 * 폼 검증 규칙
 */
export const FORM_VALIDATION = {
  /** 이메일 정규식 */
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** 이메일 최소 길이 */
  EMAIL_MIN_LENGTH: 3,
  /** 이메일 최대 길이 */
  EMAIL_MAX_LENGTH: 255,
  /** 비밀번호 최소 길이 */
  PASSWORD_MIN_LENGTH: 6,
  /** 비밀번호 최대 길이 */
  PASSWORD_MAX_LENGTH: 128,
  /** 이름 최소 길이 */
  NAME_MIN_LENGTH: 1,
  /** 이름 최대 길이 */
  NAME_MAX_LENGTH: 100,
} as const

/**
 * 분석 결과 검증 규칙
 */
export const ANALYSIS_VALIDATION = {
  /** 최소 신뢰도 (0-1) */
  MIN_CONFIDENCE: 0.3,
  /** 높은 불확실성 임계값 (0-1) */
  HIGH_UNCERTAINTY_THRESHOLD: 0.5,
  /** 검토 필요 불확실성 임계값 (0-1) */
  REVIEW_NEEDED_UNCERTAINTY: 0.4,
} as const

