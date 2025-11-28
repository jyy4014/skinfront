/**
 * Skin Analysis API 테스트
 * Gemini API를 사용하는 피부 분석 함수 테스트
 */

import { analyzeWithGemini, AnalysisProgress } from '../skinAnalysisApi'

// Mock Gemini API
jest.mock('../gemini', () => ({
  getGeminiModel: jest.fn(),
  SKIN_ANALYSIS_PROMPT: 'Mock skin analysis prompt'
}))

describe('Skin Analysis API 테스트', () => {
  const mockBase64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z'

  describe('analyzeWithGemini()', () => {
    it('유효한 이미지를 분석해야 한다', async () => {
      // Arrange
      const mockResponse = {
        totalScore: 75,
        primaryConcern: '모공',
        details: {
          pigmentation: { score: 70, grade: '주의' },
          acne: { score: 80, grade: '양호' },
          wrinkles: { score: 75, grade: '주의' },
          pores: { score: 65, grade: '주의' }
        },
        aiComment: '테스트 분석 결과입니다.',
        recommendations: [
          { name: '테스트 시술 1', desc: '테스트 설명', tags: ['#테스트'] }
        ]
      }

      // Mock EventSource
      global.EventSource = jest.fn().mockImplementation(() => ({
        onmessage: null,
        onerror: null,
        addEventListener: jest.fn(),
        close: jest.fn()
      })) as any

      // Mock fetch - API 응답은 GeminiAnalysisResponse 타입이지만 함수는 RealSkinAnalysisResult로 변환
      const apiResponse = {
        totalScore: 75,
        primaryConcern: '모공',
        details: {
          pigmentation: { score: 70, grade: '주의' },
          acne: { score: 80, grade: '양호' },
          wrinkles: { score: 75, grade: '주의' },
          pores: { score: 65, grade: '주의' }
        },
        aiComment: '테스트 분석 결과입니다.',
        recommendations: [{ name: '테스트 시술 1', desc: '테스트 설명', tags: ['#테스트'] }]
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(apiResponse)
      })

      // Act
      const result = await analyzeWithGemini(mockBase64Image)

      // Assert - 함수는 RealSkinAnalysisResult 타입을 반환하므로 details 순서가 변경됨
      expect(result.totalScore).toBe(75)
      expect(result.primaryConcern).toBe('모공')
      expect(result.details.pigmentation.score).toBe(70)
      expect(result.details.pigmentation.grade).toBe('주의')
      expect(result.details.pores.score).toBe(65)
      expect(result.details.acne.score).toBe(80)
    })

    it('진행 상태 콜백이 제공되면 EventSource를 사용해야 한다', async () => {
      // Arrange
      const mockProgressCallback = jest.fn()

      global.EventSource = jest.fn().mockImplementation(() => ({
        onmessage: null,
        onerror: null,
        addEventListener: jest.fn(),
        close: jest.fn()
      })) as any

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          totalScore: 80,
          primaryConcern: '기미',
          details: {
            pigmentation: { score: 75, grade: '주의' },
            acne: { score: 85, grade: '양호' },
            wrinkles: { score: 80, grade: '양호' },
            pores: { score: 70, grade: '주의' }
          },
          aiComment: '테스트 결과',
          recommendations: []
        })
      })

      // Act
      await analyzeWithGemini(mockBase64Image, undefined, mockProgressCallback)

      // Assert
      expect(global.EventSource).toHaveBeenCalled()
    })

    it('API 호출 실패 시 에러를 던져야 한다', async () => {
      // Arrange
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValue(new Error('Server Error'))
      })

      // Act & Assert
      await expect(analyzeWithGemini(mockBase64Image)).rejects.toThrow()
    })

    it('네트워크 오류 시 에러를 던져야 한다', async () => {
      // Arrange
      global.fetch = jest.fn().mockRejectedValue(new Error('Network Error'))

      // Act & Assert
      await expect(analyzeWithGemini(mockBase64Image)).rejects.toThrow('Network Error')
    })
  })

  describe('진행 상태 관리', () => {
    it('진행 상태가 올바르게 업데이트되어야 한다', async () => {
      // Arrange
      const mockProgressCallback = jest.fn()

      // Mock EventSource with message simulation
      const mockEventSource = {
        onmessage: null,
        onerror: null,
        addEventListener: jest.fn(),
        close: jest.fn()
      }

      // Mock EventSource 생성자
      const mockEventSourceConstructor = jest.fn().mockImplementation(() => {
        // Simulate message event
        setTimeout(() => {
          if (mockEventSource.onmessage) {
            mockEventSource.onmessage({
              data: JSON.stringify({
                stage: 'complete',
                progress: 100,
                message: '완료',
                timestamp: Date.now()
              })
            })
          }
        }, 10)
        return mockEventSource
      })

      global.EventSource = mockEventSourceConstructor as any

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          totalScore: 85,
          primaryConcern: '주름',
          details: {
            pigmentation: { score: 80, grade: '양호' },
            acne: { score: 75, grade: '주의' },
            wrinkles: { score: 70, grade: '주의' },
            pores: { score: 85, grade: '양호' }
          },
          aiComment: '진행 상태 테스트 결과',
          recommendations: []
        })
      })

      // Act
      await analyzeWithGemini(mockBase64Image, undefined, mockProgressCallback)

      // Wait for async callback
      await new Promise(resolve => setTimeout(resolve, 20))

      // Assert
      expect(mockProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'complete',
          progress: 100,
          message: '완료'
        })
      )
      expect(mockEventSourceConstructor).toHaveBeenCalled()
      expect(mockEventSource.close).toHaveBeenCalled()
    })
  })

  describe('에러 처리', () => {
    it('잘못된 base64 포맷에 대해 처리를 시도해야 한다', async () => {
      // Arrange
      const invalidBase64 = 'not-base64-format'

      // Mock fetch to simulate API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          totalScore: 50,
          primaryConcern: '알 수 없음',
          details: {
            pigmentation: { score: 50, grade: '주의' },
            acne: { score: 50, grade: '주의' },
            wrinkles: { score: 50, grade: '주의' },
            pores: { score: 50, grade: '주의' }
          }
        })
      })

      // Act & Assert - 실제로는 API에서 검증하므로 성공할 수 있음
      const result = await analyzeWithGemini(invalidBase64)
      expect(result).toHaveProperty('totalScore')
      expect(result).toHaveProperty('primaryConcern')
      expect(result).toHaveProperty('details')
    })

    it('잘못된 base64 데이터에 대해 에러를 던져야 한다', async () => {
      // Arrange
      const invalidBase64 = 'data:image/jpeg;base64,invalid-base64-data'
      global.fetch = jest.fn()

      // Act & Assert
      await expect(analyzeWithGemini(invalidBase64)).rejects.toThrow()
    })
  })
})
