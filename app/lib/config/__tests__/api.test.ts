/**
 * API 설정 모듈 테스트
 */

import {
  EDGE_FUNCTIONS,
  API_VERSION,
  API_TIMEOUT,
  RETRY_CONFIG,
} from '../api'

describe('api', () => {
  describe('EDGE_FUNCTIONS', () => {
    it('Edge Function 엔드포인트가 올바르게 정의되어야 함', () => {
      expect(EDGE_FUNCTIONS.ANALYZE).toBe('analyze')
      expect(EDGE_FUNCTIONS.ANALYZE_SAVE).toBe('analyze/save')
    })
  })

  describe('API_VERSION', () => {
    it('API 버전이 올바르게 정의되어야 함', () => {
      expect(API_VERSION.CURRENT).toBe('v1')
    })
  })

  describe('API_TIMEOUT', () => {
    it('API 타임아웃 설정이 올바르게 정의되어야 함', () => {
      expect(API_TIMEOUT.DEFAULT).toBe(30000)
      expect(API_TIMEOUT.ANALYZE).toBe(120000)
      expect(API_TIMEOUT.UPLOAD).toBe(60000)
    })
  })

  describe('RETRY_CONFIG', () => {
    it('재시도 설정이 올바르게 정의되어야 함', () => {
      expect(RETRY_CONFIG.MAX_RETRIES).toBe(3)
      expect(RETRY_CONFIG.RETRY_DELAY).toBe(1000)
      expect(RETRY_CONFIG.USE_EXPONENTIAL_BACKOFF).toBe(true)
    })
  })
})

