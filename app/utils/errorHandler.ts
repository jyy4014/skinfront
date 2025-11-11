// 에러 분류 및 처리 유틸리티

export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  SERVER = 'server',
  MODEL = 'model',
  AUTH = 'auth',
  UNKNOWN = 'unknown',
}

export interface ClassifiedError {
  type: ErrorType
  message: string
  retryable: boolean
  originalError: Error
}

/**
 * 에러를 분류하고 사용자 친화적인 메시지로 변환
 */
export function classifyError(error: unknown): ClassifiedError {
  const err = error instanceof Error ? error : new Error(String(error))
  const message = err.message.toLowerCase()

  // Validation 에러
  if (
    message.includes('invalid') ||
    message.includes('validation') ||
    message.includes('too large') ||
    message.includes('not supported')
  ) {
    return {
      type: ErrorType.VALIDATION,
      message: getValidationMessage(err.message),
      retryable: false,
      originalError: err,
    }
  }

  // Network 에러
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    err.name === 'TypeError' && message.includes('failed to fetch')
  ) {
    return {
      type: ErrorType.NETWORK,
      message: '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요.',
      retryable: true,
      originalError: err,
    }
  }

  // Auth 에러
  if (
    message.includes('auth') ||
    message.includes('unauthorized') ||
    message.includes('인증') ||
    message.includes('token')
  ) {
    return {
      type: ErrorType.AUTH,
      message: '인증이 필요합니다. 다시 로그인해주세요.',
      retryable: false,
      originalError: err,
    }
  }

  // Server 에러 (5xx)
  if (
    message.includes('server') || 
    message.includes('500') || 
    message.includes('503') ||
    message.includes('서버') ||
    message.includes('internal server error')
  ) {
    return {
      type: ErrorType.SERVER,
      message: err.message || '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      retryable: true,
      originalError: err,
    }
  }

  // Model 에러 (AI 파이프라인 관련)
  if (
    message.includes('model') || 
    message.includes('ai') || 
    message.includes('analysis') ||
    message.includes('gemini') ||
    message.includes('파이프라인') ||
    message.includes('분석 실패') ||
    message.includes('AI 분석') ||
    message.includes('pipeline') ||
    message.includes('이미지를 가져올 수 없습니다') ||
    message.includes('AI 분석 결과를 파싱할 수 없습니다') ||
    message.includes('AI 텍스트 생성')
  ) {
    return {
      type: ErrorType.MODEL,
      message: err.message || 'AI 분석 중 오류가 발생했습니다. 다른 사진으로 다시 시도해주세요.',
      retryable: true,
      originalError: err,
    }
  }

  // Unknown 에러
  return {
    type: ErrorType.UNKNOWN,
    message: err.message || '알 수 없는 오류가 발생했습니다.',
    retryable: false,
    originalError: err,
  }
}

function getValidationMessage(message: string): string {
  if (message.includes('too large') || message.includes('크기')) {
    return '파일 크기가 너무 큽니다. 10MB 이하의 이미지를 선택해주세요.'
  }
  if (message.includes('invalid') && message.includes('email')) {
    return '유효한 이메일 주소를 입력해주세요.'
  }
  if (message.includes('invalid') && message.includes('image')) {
    return '이미지 파일만 업로드 가능합니다.'
  }
  return '입력값을 확인해주세요.'
}

/**
 * Exponential backoff를 사용한 재시도 유틸리티
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxRetries) {
        throw lastError
      }

      const delay = initialDelay * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

