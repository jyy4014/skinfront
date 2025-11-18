/**
 * TDD: 에러 핸들링 통합 테스트
 * 
 * 테스트 시나리오:
 * 1. lib/error/handler.ts가 올바르게 작동하는지 확인
 * 2. utils/errorHandler.ts와 동일한 기능을 제공하는지 확인
 */

import { classifyError, ErrorType, getErrorMessage } from '../handler'

describe('Error Handler Integration', () => {
  // P2-5: 에러 핸들링 코드 통합 확인
  it('lib/error/handler가 모든 에러 타입을 올바르게 분류해야 함', () => {
    // Validation 에러
    const validationError = classifyError(new Error('파일 크기가 너무 큽니다'))
    expect(validationError.type).toBe(ErrorType.VALIDATION)
    expect(validationError.retryable).toBe(false)

    // Network 에러
    const networkError = classifyError(new Error('network connection failed'))
    expect(networkError.type).toBe(ErrorType.NETWORK)
    expect(networkError.retryable).toBe(true)

    // Auth 에러
    const authError = classifyError(new Error('인증이 필요합니다'))
    expect(authError.type).toBe(ErrorType.AUTH)
    expect(authError.retryable).toBe(false)

    // Server 에러
    const serverError = classifyError(new Error('서버 오류 500'))
    expect(serverError.type).toBe(ErrorType.SERVER)
    expect(serverError.retryable).toBe(true)

    // Model 에러
    const modelError = classifyError(new Error('AI 분석 실패'))
    expect(modelError.type).toBe(ErrorType.MODEL)
    expect(modelError.retryable).toBe(true)

    // Unknown 에러
    const unknownError = classifyError(new Error('알 수 없는 오류'))
    expect(unknownError.type).toBe(ErrorType.UNKNOWN)
    expect(unknownError.retryable).toBe(false)
  })

  it('getErrorMessage가 올바른 메시지를 반환해야 함', () => {
    const classified = classifyError(new Error('테스트 에러'))
    const message = getErrorMessage(classified)
    expect(typeof message).toBe('string')
    expect(message.length).toBeGreaterThan(0)
  })

  it('한국어 에러 메시지를 올바르게 처리해야 함', () => {
    const error = classifyError(new Error('크기가 너무 큽니다'))
    expect(error.type).toBe(ErrorType.VALIDATION)
    expect(error.message).toContain('10MB')
  })
})

