/**
 * API 엔드포인트 상수
 * 
 * 모든 API 엔드포인트를 중앙에서 관리하여 일관성과 유지보수성을 향상시킵니다.
 */

/**
 * Edge Function 엔드포인트
 */
export const EDGE_FUNCTIONS = {
  /** 피부 분석 Edge Function */
  ANALYZE: 'analyze',
  /** 분석 결과 저장 Edge Function */
  ANALYZE_SAVE: 'analyze/save',
} as const

/**
 * API 버전
 */
export const API_VERSION = {
  /** 현재 API 버전 */
  CURRENT: 'v1',
} as const

/**
 * API 타임아웃 설정 (ms)
 */
export const API_TIMEOUT = {
  /** 기본 타임아웃 */
  DEFAULT: 30000, // 30초
  /** 분석 API 타임아웃 (더 긴 시간 필요) */
  ANALYZE: 120000, // 2분
  /** 업로드 타임아웃 */
  UPLOAD: 60000, // 1분
} as const

/**
 * 재시도 설정
 */
export const RETRY_CONFIG = {
  /** 최대 재시도 횟수 */
  MAX_RETRIES: 3,
  /** 재시도 지연 시간 (ms) */
  RETRY_DELAY: 1000,
  /** 지수 백오프 사용 여부 */
  USE_EXPONENTIAL_BACKOFF: true,
} as const

