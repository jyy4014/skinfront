/**
 * UI 상태 컴포넌트 상수
 */

export const LOADING_MESSAGES = {
  DEFAULT: '로딩 중...',
  ANALYZING: '분석 중...',
  UPLOADING: '업로드 중...',
  PROCESSING: '처리 중...',
  SAVING: '저장 중...',
} as const

export const ERROR_MESSAGES = {
  DEFAULT: '오류가 발생했습니다.',
  NETWORK: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
  VALIDATION: '입력값을 확인해주세요.',
  UNAUTHORIZED: '인증이 필요합니다.',
  NOT_FOUND: '요청한 데이터를 찾을 수 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
} as const

export const EMPTY_STATE_MESSAGES = {
  NO_DATA: '데이터가 없습니다.',
  NO_RESULTS: '결과가 없습니다.',
  NO_HISTORY: '분석 기록이 없습니다.',
  NO_TREATMENTS: '추천 시술이 없습니다.',
} as const




