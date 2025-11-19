/**
 * 에러 처리 통합 테스트
 * TDD 기반 테스트 작성
 * 실제 사용 시나리오 기반 에러 처리 테스트
 */

import { classifyError, ErrorType } from '../handler'

describe('에러 처리 통합 테스트', () => {
  describe('네트워크 에러 시나리오', () => {
    it('네트워크 연결 실패 시 재시도 가능한 에러로 분류되어야 함', () => {
      const error = new Error('Failed to fetch')
      const classified = classifyError(error)

      expect(classified.type).toBe(ErrorType.NETWORK)
      expect(classified.retryable).toBe(true)
      expect(classified.message).toContain('네트워크')
    })

    it('타임아웃 에러는 네트워크 에러로 분류되어야 함', () => {
      const error = new Error('Request timeout')
      const classified = classifyError(error)

      expect(classified.type).toBe(ErrorType.NETWORK)
      expect(classified.retryable).toBe(true)
    })

    it('연결 에러는 네트워크 에러로 분류되어야 함', () => {
      const error = new Error('Network connection failed')
      const classified = classifyError(error)

      expect(classified.type).toBe(ErrorType.NETWORK)
      expect(classified.retryable).toBe(true)
    })
  })

  describe('API 에러 시나리오', () => {
    it('서버 에러(500)는 재시도 가능한 에러로 분류되어야 함', () => {
      const error = new Error('Internal server error 500')
      const classified = classifyError(error)

      expect(classified.type).toBe(ErrorType.SERVER)
      expect(classified.retryable).toBe(true)
    })

    it('서비스 불가 에러(503)는 재시도 가능한 에러로 분류되어야 함', () => {
      const error = new Error('Service unavailable 503')
      const classified = classifyError(error)

      expect(classified.type).toBe(ErrorType.SERVER)
      expect(classified.retryable).toBe(true)
    })
  })

  describe('AI 분석 에러 시나리오', () => {
    it('AI 분석 실패는 재시도 가능한 에러로 분류되어야 함', () => {
      const error = new Error('AI 분석 중 오류가 발생했습니다')
      const classified = classifyError(error)

      expect(classified.type).toBe(ErrorType.MODEL)
      expect(classified.retryable).toBe(true)
    })

    it('Gemini API 에러는 모델 에러로 분류되어야 함', () => {
      const error = new Error('Gemini API error')
      const classified = classifyError(error)

      expect(classified.type).toBe(ErrorType.MODEL)
      expect(classified.retryable).toBe(true)
    })

    it('파이프라인 실패는 모델 에러로 분류되어야 함', () => {
      const error = new Error('AI 분석 파이프라인 실패')
      const classified = classifyError(error)

      expect(classified.type).toBe(ErrorType.MODEL)
      expect(classified.retryable).toBe(true)
    })
  })

  describe('검증 에러 시나리오', () => {
    it('이미지 크기 초과는 재시도 불가능한 에러로 분류되어야 함', () => {
      const error = new Error('이미지가 너무 큽니다')
      const classified = classifyError(error)

      expect(classified.type).toBe(ErrorType.VALIDATION)
      expect(classified.retryable).toBe(false)
      expect(classified.message).toContain('크기')
    })

    it('잘못된 파일 형식은 재시도 불가능한 에러로 분류되어야 함', () => {
      const error = new Error('Invalid image format')
      const classified = classifyError(error)

      expect(classified.type).toBe(ErrorType.VALIDATION)
      expect(classified.retryable).toBe(false)
    })
  })

  describe('인증 에러 시나리오', () => {
    it('인증 실패는 재시도 불가능한 에러로 분류되어야 함', () => {
      const error = new Error('Unauthorized')
      const classified = classifyError(error)

      expect(classified.type).toBe(ErrorType.AUTH)
      expect(classified.retryable).toBe(false)
      expect(classified.message).toContain('인증')
    })

    it('토큰 만료는 인증 에러로 분류되어야 함', () => {
      const error = new Error('Token expired')
      const classified = classifyError(error)

      expect(classified.type).toBe(ErrorType.AUTH)
      expect(classified.retryable).toBe(false)
    })
  })

  describe('재시도 가능 여부 판단', () => {
    it('재시도 가능한 에러는 retryable이 true여야 함', () => {
      const networkError = new Error('Network error')
      const serverError = new Error('Server error 500')
      const modelError = new Error('AI 분석 실패')

      expect(classifyError(networkError).retryable).toBe(true)
      expect(classifyError(serverError).retryable).toBe(true)
      expect(classifyError(modelError).retryable).toBe(true)
    })

    it('재시도 불가능한 에러는 retryable이 false여야 함', () => {
      const validationError = new Error('File too large')
      const authError = new Error('Unauthorized')
      const unknownError = new Error('Unknown error')

      expect(classifyError(validationError).retryable).toBe(false)
      expect(classifyError(authError).retryable).toBe(false)
      expect(classifyError(unknownError).retryable).toBe(false)
    })
  })

  describe('사용자 친화적 메시지', () => {
    it('모든 에러 타입에 대해 사용자 친화적 메시지가 제공되어야 함', () => {
      const errors = [
        new Error('Network error'),
        new Error('Server error'),
        new Error('AI 분석 실패'),
        new Error('File too large'),
        new Error('Unauthorized'),
      ]

      errors.forEach((error) => {
        const classified = classifyError(error)
        expect(classified.message).toBeTruthy()
        expect(classified.message.length).toBeGreaterThan(0)
        expect(typeof classified.message).toBe('string')
      })
    })

    it('한국어 에러 메시지가 올바르게 처리되어야 함', () => {
      const error = new Error('network connection failed')
      const classified = classifyError(error)

      expect(classified.type).toBe(ErrorType.NETWORK)
      expect(classified.message).toContain('네트워크')
    })
  })

  describe('에러 체이닝', () => {
    it('원본 에러가 보존되어야 함', () => {
      const originalError = new Error('Original error')
      const classified = classifyError(originalError)

      expect(classified.originalError).toBe(originalError)
    })

    it('에러 스택이 보존되어야 함', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at test.js:1:1'
      const classified = classifyError(error)

      expect(classified.originalError.stack).toBe(error.stack)
    })
  })
})

