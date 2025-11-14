/**
 * 검증 규칙 모듈 테스트
 */

import {
  FILE_VALIDATION,
  IMAGE_QUALITY_VALIDATION,
  FORM_VALIDATION,
  ANALYSIS_VALIDATION,
} from '../validation'

describe('validation', () => {
  describe('FILE_VALIDATION', () => {
    it('파일 검증 규칙이 올바르게 정의되어야 함', () => {
      expect(FILE_VALIDATION.MAX_SIZE).toBe(10 * 1024 * 1024)
      expect(FILE_VALIDATION.MIN_SIZE).toBe(1024)
      expect(FILE_VALIDATION.ALLOWED_IMAGE_TYPES).toContain('image/jpeg')
      expect(FILE_VALIDATION.ALLOWED_IMAGE_TYPES).toContain('image/png')
    })
  })

  describe('IMAGE_QUALITY_VALIDATION', () => {
    it('이미지 품질 검증 규칙이 올바르게 정의되어야 함', () => {
      expect(IMAGE_QUALITY_VALIDATION.MIN_QUALITY_SCORE).toBe(0.1)
      expect(IMAGE_QUALITY_VALIDATION.RECOMMENDED_QUALITY_SCORE).toBe(0.5)
    })
  })

  describe('FORM_VALIDATION', () => {
    it('폼 검증 규칙이 올바르게 정의되어야 함', () => {
      expect(FORM_VALIDATION.EMAIL_REGEX).toBeInstanceOf(RegExp)
      expect(FORM_VALIDATION.EMAIL_MIN_LENGTH).toBe(3)
      expect(FORM_VALIDATION.EMAIL_MAX_LENGTH).toBe(255)
      expect(FORM_VALIDATION.PASSWORD_MIN_LENGTH).toBe(6)
    })

    it('이메일 정규식이 올바르게 작동해야 함', () => {
      const { EMAIL_REGEX } = FORM_VALIDATION
      
      expect('test@example.com').toMatch(EMAIL_REGEX)
      expect('invalid-email').not.toMatch(EMAIL_REGEX)
      expect('test@').not.toMatch(EMAIL_REGEX)
    })
  })

  describe('ANALYSIS_VALIDATION', () => {
    it('분석 결과 검증 규칙이 올바르게 정의되어야 함', () => {
      expect(ANALYSIS_VALIDATION.MIN_CONFIDENCE).toBe(0.3)
      expect(ANALYSIS_VALIDATION.HIGH_UNCERTAINTY_THRESHOLD).toBe(0.5)
      expect(ANALYSIS_VALIDATION.REVIEW_NEEDED_UNCERTAINTY).toBe(0.4)
    })
  })
})

