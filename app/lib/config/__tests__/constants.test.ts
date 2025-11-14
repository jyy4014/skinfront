/**
 * 상수 모듈 테스트
 */

import {
  IMAGE_CONFIG,
  ANALYSIS_CONFIG,
  UI_CONFIG,
  UPLOAD_CONFIG,
  VALIDATION_CONFIG,
} from '../constants'

describe('constants', () => {
  describe('IMAGE_CONFIG', () => {
    it('이미지 설정 상수가 올바르게 정의되어야 함', () => {
      expect(IMAGE_CONFIG.MAX_WIDTH).toBe(1024)
      expect(IMAGE_CONFIG.MAX_HEIGHT).toBe(1024)
      expect(IMAGE_CONFIG.QUALITY).toBe(0.85)
      expect(IMAGE_CONFIG.MAX_FILE_SIZE).toBe(10 * 1024 * 1024)
      expect(IMAGE_CONFIG.MIN_QUALITY_SCORE).toBe(0.1)
      expect(IMAGE_CONFIG.AUTO_VALIDATE).toBe(true)
    })

    it('허용되는 이미지 타입이 올바르게 정의되어야 함', () => {
      expect(IMAGE_CONFIG.ALLOWED_TYPES).toContain('image/jpeg')
      expect(IMAGE_CONFIG.ALLOWED_TYPES).toContain('image/png')
      expect(IMAGE_CONFIG.ALLOWED_TYPES).toContain('image/webp')
    })
  })

  describe('ANALYSIS_CONFIG', () => {
    it('분석 설정 상수가 올바르게 정의되어야 함', () => {
      expect(ANALYSIS_CONFIG.MIN_CONFIDENCE).toBe(0.3)
      expect(ANALYSIS_CONFIG.HIGH_UNCERTAINTY_THRESHOLD).toBe(0.5)
      expect(ANALYSIS_CONFIG.REVIEW_NEEDED_UNCERTAINTY).toBe(0.4)
      expect(ANALYSIS_CONFIG.DEFAULT_CONFIDENCE).toBe(0.6)
      expect(ANALYSIS_CONFIG.MIN_CONFIDENCE_FLOOR).toBe(0.2)
    })
  })

  describe('UI_CONFIG', () => {
    it('UI 설정 상수가 올바르게 정의되어야 함', () => {
      expect(UI_CONFIG.DEFAULT_PAGE_SIZE).toBe(10)
      expect(UI_CONFIG.MAX_PAGE_SIZE).toBe(50)
      expect(UI_CONFIG.DEBOUNCE_DELAY).toBe(300)
      expect(UI_CONFIG.TOAST_DURATION).toBe(3000)
    })
  })

  describe('UPLOAD_CONFIG', () => {
    it('업로드 설정 상수가 올바르게 정의되어야 함', () => {
      expect(UPLOAD_CONFIG.MAX_FILE_SIZE).toBe(10 * 1024 * 1024)
      expect(UPLOAD_CONFIG.MIN_FILE_SIZE).toBe(1024)
      expect(UPLOAD_CONFIG.ALLOWED_TYPES).toContain('image/jpeg')
    })
  })

  describe('VALIDATION_CONFIG', () => {
    it('검증 설정 상수가 올바르게 정의되어야 함', () => {
      expect(VALIDATION_CONFIG.EMAIL_MIN_LENGTH).toBe(3)
      expect(VALIDATION_CONFIG.EMAIL_MAX_LENGTH).toBe(255)
      expect(VALIDATION_CONFIG.PASSWORD_MIN_LENGTH).toBe(6)
      expect(VALIDATION_CONFIG.PASSWORD_MAX_LENGTH).toBe(128)
    })
  })
})

