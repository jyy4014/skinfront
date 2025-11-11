/**
 * 에러 메시지 상수
 */

export const ERROR_MESSAGES = {
  VALIDATION: {
    FILE_TOO_LARGE: '파일 크기가 너무 큽니다. 10MB 이하의 이미지를 선택해주세요.',
    INVALID_EMAIL: '유효한 이메일 주소를 입력해주세요.',
    INVALID_IMAGE: '이미지 파일만 업로드 가능합니다.',
    INVALID_INPUT: '입력값을 확인해주세요.',
  },
  NETWORK: {
    CONNECTION_FAILED: '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요.',
    TIMEOUT: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
  },
  SERVER: {
    INTERNAL_ERROR: '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    SERVICE_UNAVAILABLE: '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
  },
  MODEL: {
    ANALYSIS_FAILED: 'AI 분석 중 오류가 발생했습니다. 다른 사진으로 다시 시도해주세요.',
    PIPELINE_ERROR: 'AI 분석 파이프라인에 문제가 발생했습니다.',
  },
  AUTH: {
    REQUIRED: '인증이 필요합니다. 다시 로그인해주세요.',
    EXPIRED: '세션이 만료되었습니다. 다시 로그인해주세요.',
  },
  UNKNOWN: '알 수 없는 오류가 발생했습니다.',
} as const

