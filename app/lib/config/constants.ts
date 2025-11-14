/**
 * 앱 전역 상수
 * 
 * 하드코딩된 값들을 중앙에서 관리하여 일관성과 유지보수성을 향상시킵니다.
 */

/**
 * 이미지 처리 설정
 */
export const IMAGE_CONFIG = {
  /** 최대 이미지 너비 (픽셀) */
  MAX_WIDTH: 1024,
  /** 최대 이미지 높이 (픽셀) */
  MAX_HEIGHT: 1024,
  /** 이미지 품질 (0-1) */
  QUALITY: 0.85,
  /** 최대 파일 크기 (바이트) - 10MB */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** 허용되는 이미지 타입 */
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'] as const,
  /** 최소 품질 점수 (0-1) - 이 값보다 낮으면 거부 */
  MIN_QUALITY_SCORE: 0.1,
  /** 자동 검증 활성화 여부 */
  AUTO_VALIDATE: true,
} as const

/**
 * 분석 설정
 */
export const ANALYSIS_CONFIG = {
  /** 최소 신뢰도 (0-1) - 이 값보다 낮으면 검토 필요 */
  MIN_CONFIDENCE: 0.3,
  /** 높은 불확실성 임계값 (0-1) - 이 값보다 높으면 검토 필요 */
  HIGH_UNCERTAINTY_THRESHOLD: 0.5,
  /** 검토 필요 불확실성 임계값 (0-1) */
  REVIEW_NEEDED_UNCERTAINTY: 0.4,
  /** 기본 신뢰도 (API에서 제공되지 않을 경우) */
  DEFAULT_CONFIDENCE: 0.6,
  /** 최소 신뢰도 (하한선) */
  MIN_CONFIDENCE_FLOOR: 0.2,
} as const

/**
 * UI 설정
 */
export const UI_CONFIG = {
  /** 페이지네이션 기본 크기 */
  DEFAULT_PAGE_SIZE: 10,
  /** 최대 페이지 크기 */
  MAX_PAGE_SIZE: 50,
  /** 디바운스 지연 시간 (ms) */
  DEBOUNCE_DELAY: 300,
  /** 토스트 표시 시간 (ms) */
  TOAST_DURATION: 3000,
} as const

/**
 * 파일 업로드 설정
 */
export const UPLOAD_CONFIG = {
  /** 최대 파일 크기 (바이트) - 10MB */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** 허용되는 파일 타입 */
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'] as const,
  /** 최소 파일 크기 (바이트) - 1KB */
  MIN_FILE_SIZE: 1024,
} as const

/**
 * 폼 검증 설정
 */
export const VALIDATION_CONFIG = {
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

