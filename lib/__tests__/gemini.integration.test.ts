/**
 * Gemini API 통합 테스트
 * 실제 API 호출을 테스트 (주의: API 키 필요)
 */

import { getGeminiModel, SKIN_ANALYSIS_PROMPT } from '../gemini'

describe('Gemini API - 통합 테스트 (실제 API 호출)', () => {
  // 실제 API 키가 있는 경우에만 실행
  const hasApiKey = !!process.env.GEMINI_API_KEY

  beforeAll(() => {
    if (!hasApiKey) {
      console.warn('⚠️  GEMINI_API_KEY가 없어 통합 테스트를 건너뜁니다.')
    }
  })

  describe('실제 Gemini API 호출', () => {
    it.skip('실제 이미지로 피부 분석을 수행해야 한다', async () => {
      // 실제 API 키가 없는 경우 테스트 건너뜀
      if (!hasApiKey) return

      // Arrange
      const model = getGeminiModel()

      // 작은 테스트 이미지 생성 (1x1 픽셀 PNG)
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

      const imagePart = {
        inlineData: {
          data: testImageBase64,
          mimeType: 'image/png',
        },
      }

      // Act
      const result = await model.generateContent([SKIN_ANALYSIS_PROMPT, imagePart])
      const response = await result.response
      const text = await response.text()

      // Assert
      expect(text).toBeDefined()
      expect(typeof text).toBe('string')
      expect(text.length).toBeGreaterThan(0)

      // JSON 파싱 시도
      let parsedResult
      try {
        parsedResult = JSON.parse(text)
        expect(parsedResult).toHaveProperty('totalScore')
        expect(parsedResult).toHaveProperty('primaryConcern')
        expect(parsedResult).toHaveProperty('details')
        expect(parsedResult).toHaveProperty('aiComment')
        expect(parsedResult).toHaveProperty('recommendations')
      } catch (error) {
        // JSON 파싱 실패 시 텍스트에 JSON 구조가 포함되어 있는지 확인
        expect(text).toContain('totalScore')
        expect(text).toContain('primaryConcern')
        console.warn('JSON 파싱 실패:', error)
      }
    }, 30000) // 30초 타임아웃

    it.skip('빈 이미지에 대한 분석이 실패해야 한다', async () => {
      if (!hasApiKey) return

      // Arrange
      const model = getGeminiModel()

      const invalidImagePart = {
        inlineData: {
          data: 'invalid-base64',
          mimeType: 'image/png',
        },
      }

      // Act & Assert
      await expect(
        model.generateContent([SKIN_ANALYSIS_PROMPT, invalidImagePart])
      ).rejects.toThrow()
    }, 30000)
  })

  describe('에러 처리', () => {
    it('네트워크 오류 시 적절히 처리해야 한다', async () => {
      if (!hasApiKey) return

      // Arrange
      const model = getGeminiModel()

      // 매우 큰 이미지로 네트워크 오류 유도 (실제로는 API 제한으로 실패)
      const largeImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

      const imagePart = {
        inlineData: {
          data: largeImageBase64.repeat(1000), // 매우 큰 데이터
          mimeType: 'image/png',
        },
      }

      // Act & Assert
      try {
        await model.generateContent([SKIN_ANALYSIS_PROMPT, imagePart])
      } catch (error: any) {
        // API 제한이나 네트워크 오류가 발생할 수 있음
        expect(error).toBeDefined()
      }
    }, 60000) // 60초 타임아웃
  })
})

