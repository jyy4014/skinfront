/**
 * Gemini API 유닛 테스트 (TDD 방식)
 * Red -> Green -> Refactor 순서로 진행
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { getGeminiClient, getGeminiModel, SKIN_ANALYSIS_PROMPT } from '../gemini'

// Mock GoogleGenerativeAI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn()
    })
  }))
}))

describe('Gemini API - TDD 방식 테스트', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getGeminiClient()', () => {
    it('GEMINI_API_KEY가 설정되어 있으면 GoogleGenerativeAI 인스턴스를 반환해야 한다', () => {
      // Arrange
      process.env.GEMINI_API_KEY = 'test-api-key'

      // Act
      const client = getGeminiClient()

      // Assert
      expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-api-key')
      expect(client).toBeDefined()
    })

    it('GEMINI_API_KEY가 없으면 에러를 던져야 한다', () => {
      // Arrange
      delete process.env.GEMINI_API_KEY

      // Act & Assert
      expect(() => getGeminiClient()).toThrow('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.')
    })
  })

  describe('getGeminiModel()', () => {
    it('올바른 모델 설정으로 GenerativeModel을 반환해야 한다', () => {
      // Arrange
      process.env.GEMINI_API_KEY = 'test-api-key'
      const mockModel = {
        generateContent: jest.fn()
      }
      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      }
      ;(GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>).mockImplementation(() => mockGenAI as any)

      // Act
      const model = getGeminiModel()

      // Assert
      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
      })
      expect(model).toBe(mockModel)
    })

    it('API 키가 없으면 getGeminiClient에서 에러가 발생해야 한다', () => {
      // Arrange
      delete process.env.GEMINI_API_KEY

      // Act & Assert
      expect(() => getGeminiModel()).toThrow('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.')
    })
  })

  describe('SKIN_ANALYSIS_PROMPT', () => {
    it('프롬프트가 정의되어 있어야 한다', () => {
      // Assert
      expect(SKIN_ANALYSIS_PROMPT).toBeDefined()
      expect(typeof SKIN_ANALYSIS_PROMPT).toBe('string')
      expect(SKIN_ANALYSIS_PROMPT.length).toBeGreaterThan(0)
    })

    it('필수 키워드가 포함되어 있어야 한다', () => {
      // Assert
      expect(SKIN_ANALYSIS_PROMPT).toContain('K-Beauty')
      expect(SKIN_ANALYSIS_PROMPT).toContain('JSON Only')
      expect(SKIN_ANALYSIS_PROMPT).toContain('totalScore')
      expect(SKIN_ANALYSIS_PROMPT).toContain('primaryConcern')
    })
  })

  describe('통합 테스트 - 실제 API 호출 시뮬레이션', () => {
    it('성공적인 API 응답을 올바르게 처리해야 한다', async () => {
      // Arrange
      process.env.GEMINI_API_KEY = 'test-api-key'

      const mockResponse = {
        response: {
          text: jest.fn().mockResolvedValue(JSON.stringify({
            totalScore: 75,
            primaryConcern: '모공',
            details: {
              pigmentation: { score: 70, grade: '주의', landmarkIndex: 123 },
              acne: { score: 80, grade: '양호', landmarkIndex: null },
              wrinkles: { score: 75, grade: '주의', landmarkIndex: 456 },
              pores: { score: 65, grade: '주의', landmarkIndex: 789 }
            },
            aiComment: '테스트 분석 결과입니다.',
            recommendations: [
              { name: '테스트 시술 1', desc: '테스트 설명', tags: ['#테스트'] }
            ]
          }))
        }
      }

      const mockModel = {
        generateContent: jest.fn().mockResolvedValue(mockResponse)
      }

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      }

      ;(GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>).mockImplementation(() => mockGenAI as any)

      // Act
      const model = getGeminiModel()
      const result = await model.generateContent([SKIN_ANALYSIS_PROMPT, { inlineData: {} }])

      // Assert
      expect(mockModel.generateContent).toHaveBeenCalled()
      expect(result).toBe(mockResponse)
    })

    it('API 호출 실패 시 적절한 에러를 던져야 한다', async () => {
      // Arrange
      process.env.GEMINI_API_KEY = 'test-api-key'

      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('API 호출 실패'))
      }

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      }

      ;(GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>).mockImplementation(() => mockGenAI as any)

      // Act & Assert
      const model = getGeminiModel()
      await expect(model.generateContent([SKIN_ANALYSIS_PROMPT, { inlineData: {} }]))
        .rejects.toThrow('API 호출 실패')
    })
  })
})

