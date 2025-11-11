/**
 * TDD: 에러 처리 모듈 테스트
 * 
 * 테스트 시나리오:
 * 1. Validation 에러 분류
 * 2. Network 에러 분류
 * 3. Server 에러 분류
 * 4. Model 에러 분류
 * 5. Auth 에러 분류
 * 6. Unknown 에러 분류
 * 7. 사용자 친화적 메시지 변환
 */

import { classifyError, getErrorMessage, ErrorType } from '../handler'

describe('Error Handler', () => {
  describe('classifyError', () => {
    it('Validation 에러를 올바르게 분류해야 함', () => {
      const error = new Error('File too large')
      const result = classifyError(error)

      expect(result.type).toBe(ErrorType.VALIDATION)
      expect(result.retryable).toBe(false)
      expect(result.message).toContain('크기')
    })

    it('Network 에러를 올바르게 분류해야 함', () => {
      const error = new Error('Network request failed')
      const result = classifyError(error)

      expect(result.type).toBe(ErrorType.NETWORK)
      expect(result.retryable).toBe(true)
      expect(result.message).toContain('네트워크')
    })

    it('Server 에러를 올바르게 분류해야 함', () => {
      const error = new Error('Internal server error')
      const result = classifyError(error)

      expect(result.type).toBe(ErrorType.SERVER)
      expect(result.retryable).toBe(true)
    })

    it('Model 에러를 올바르게 분류해야 함', () => {
      const error = new Error('AI 분석 파이프라인 실패')
      const result = classifyError(error)

      expect(result.type).toBe(ErrorType.MODEL)
      expect(result.retryable).toBe(true)
    })

    it('Auth 에러를 올바르게 분류해야 함', () => {
      const error = new Error('Unauthorized')
      const result = classifyError(error)

      expect(result.type).toBe(ErrorType.AUTH)
      expect(result.retryable).toBe(false)
      expect(result.message).toContain('인증')
    })

    it('Unknown 에러를 올바르게 분류해야 함', () => {
      const error = new Error('Some random error')
      const result = classifyError(error)

      expect(result.type).toBe(ErrorType.UNKNOWN)
      expect(result.retryable).toBe(false)
    })

    it('Error 객체가 아닌 경우도 처리해야 함', () => {
      const error = 'String error'
      const result = classifyError(error)

      expect(result.type).toBe(ErrorType.UNKNOWN)
      expect(result.originalError).toBeInstanceOf(Error)
    })
  })

  describe('getErrorMessage', () => {
    it('분류된 에러에서 사용자 친화적 메시지를 반환해야 함', () => {
      const error = new Error('Network request failed')
      const classified = classifyError(error)
      const message = getErrorMessage(classified)

      expect(message).toBe(classified.message)
      expect(message).toContain('네트워크')
    })

    it('에러 타입에 따라 적절한 메시지를 반환해야 함', () => {
      const validationError = classifyError(new Error('File too large'))
      const networkError = classifyError(new Error('Network failed'))
      const authError = classifyError(new Error('Unauthorized'))

      expect(getErrorMessage(validationError)).toContain('크기')
      expect(getErrorMessage(networkError)).toContain('네트워크')
      expect(getErrorMessage(authError)).toContain('인증')
    })
  })
})

