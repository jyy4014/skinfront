import { POST } from '../route'
import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Mock Google Generative AI
jest.mock('@google/generative-ai')

describe('POST /api/analyze', () => {
  const mockApiKey = 'test-gemini-api-key'
  const mockBase64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='

  let mockModel: any
  let mockResponse: any
  let mockGenerateContent: jest.Mock

  beforeEach(() => {
    // 환경 변수 설정
    process.env.GEMINI_API_KEY = mockApiKey

    // Mock response 설정
    mockResponse = {
      text: jest.fn(),
    }

    mockGenerateContent = jest.fn().mockResolvedValue({
      response: mockResponse,
    })

    mockModel = {
      generateContent: mockGenerateContent,
    }

    // GoogleGenerativeAI Mock 설정
    ;(GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>).mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel),
      } as any
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
    delete process.env.GEMINI_API_KEY
  })

  describe('성공 케이스', () => {
    it('정상적인 이미지 분석 요청 시 올바른 JSON 응답을 반환해야 함', async () => {
      // Given: 유효한 분석 결과 JSON
      const mockAnalysisResult = {
        totalScore: 75,
        details: {
          pigmentation: { score: 65, grade: '주의' },
          acne: { score: 70, grade: '주의' },
          wrinkles: { score: 80, grade: '양호' },
          pores: { score: 55, grade: '주의' },
        },
        primaryConcern: '모공',
        doctorComment: '전반적으로 양호하나 모공 관리가 필요해 보입니다.',
      }

      mockResponse.text.mockResolvedValue(JSON.stringify(mockAnalysisResult))

      // When: POST 요청 실행
      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ image: mockBase64Image }),
      })

      const response = await POST(request)
      const data = await response.json()

      // Then: 올바른 응답 반환
      expect(response.status).toBe(200)
      expect(data).toEqual(mockAnalysisResult)
      expect(mockGenerateContent).toHaveBeenCalledTimes(1)
    })

    it('PNG 이미지도 올바르게 처리해야 함', async () => {
      const pngImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const mockAnalysisResult = {
        totalScore: 80,
        details: {
          pigmentation: { score: 75, grade: '주의' },
          acne: { score: 85, grade: '양호' },
          wrinkles: { score: 80, grade: '양호' },
          pores: { score: 80, grade: '양호' },
        },
        primaryConcern: '기미',
        doctorComment: '전반적으로 양호합니다.',
      }

      mockResponse.text.mockResolvedValue(JSON.stringify(mockAnalysisResult))

      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ image: pngImage }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockAnalysisResult)
    })
  })

  describe('에러 케이스', () => {
    it('GEMINI_API_KEY가 없으면 500 에러를 반환해야 함', async () => {
      // Given: API 키 없음
      delete process.env.GEMINI_API_KEY

      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ image: mockBase64Image }),
      })

      // When: POST 요청 실행
      const response = await POST(request)
      const data = await response.json()

      // Then: 500 에러 반환
      expect(response.status).toBe(500)
      expect(data.error).toContain('GEMINI_API_KEY')
      expect(mockGenerateContent).not.toHaveBeenCalled()
    })

    it('이미지가 없으면 400 에러를 반환해야 함', async () => {
      // Given: 이미지 없음
      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      // When: POST 요청 실행
      const response = await POST(request)
      const data = await response.json()

      // Then: 400 에러 반환
      expect(response.status).toBe(400)
      expect(data.error).toContain('이미지가 제공되지 않았습니다')
      expect(mockGenerateContent).not.toHaveBeenCalled()
    })

    it('JSON 파싱 실패 시 500 에러를 반환해야 함', async () => {
      // Given: 유효하지 않은 JSON 응답
      mockResponse.text.mockResolvedValue('Invalid JSON response')

      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ image: mockBase64Image }),
      })

      // When: POST 요청 실행
      const response = await POST(request)
      const data = await response.json()

      // Then: 500 에러 반환
      expect(response.status).toBe(500)
      expect(data.error).toContain('파싱')
      expect(data.rawResponse).toBe('Invalid JSON response')
    })

    it('필수 필드가 없는 응답 시 500 에러를 반환해야 함', async () => {
      // Given: 필수 필드가 없는 JSON
      const invalidResult = {
        details: {
          pigmentation: { score: 65, grade: '주의' },
        },
        // totalScore 없음
      }

      mockResponse.text.mockResolvedValue(JSON.stringify(invalidResult))

      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ image: mockBase64Image }),
      })

      // When: POST 요청 실행
      const response = await POST(request)
      const data = await response.json()

      // Then: 500 에러 반환
      expect(response.status).toBe(500)
      expect(data.error).toContain('형식이 올바르지 않습니다')
    })

    it('마크다운 코드블럭이 포함된 응답도 올바르게 파싱해야 함', async () => {
      // Given: 마크다운 코드블럭이 포함된 응답
      const mockAnalysisResult = {
        totalScore: 70,
        details: {
          pigmentation: { score: 60, grade: '주의' },
          acne: { score: 75, grade: '주의' },
          wrinkles: { score: 70, grade: '주의' },
          pores: { score: 65, grade: '주의' },
        },
        primaryConcern: '기미',
        doctorComment: '전반적으로 관리가 필요합니다.',
      }

      const responseWithMarkdown = `\`\`\`json\n${JSON.stringify(mockAnalysisResult)}\n\`\`\``
      mockResponse.text.mockResolvedValue(responseWithMarkdown)

      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ image: mockBase64Image }),
      })

      // When: POST 요청 실행
      const response = await POST(request)
      const data = await response.json()

      // Then: 올바르게 파싱되어 반환
      expect(response.status).toBe(200)
      expect(data).toEqual(mockAnalysisResult)
    })
  })

  describe('이미지 처리', () => {
    it('base64 헤더를 올바르게 제거해야 함', async () => {
      const mockAnalysisResult = {
        totalScore: 75,
        details: {
          pigmentation: { score: 65, grade: '주의' },
          acne: { score: 70, grade: '주의' },
          wrinkles: { score: 80, grade: '양호' },
          pores: { score: 55, grade: '주의' },
        },
        primaryConcern: '모공',
        doctorComment: '테스트',
      }

      mockResponse.text.mockResolvedValue(JSON.stringify(mockAnalysisResult))

      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ image: mockBase64Image }),
      })

      await POST(request)

      // Then: generateContent가 올바른 포맷으로 호출되었는지 확인
      expect(mockGenerateContent).toHaveBeenCalled()
      const callArgs = mockGenerateContent.mock.calls[0][0]
      
      // 이미지 파트가 올바른 형식인지 확인
      expect(callArgs[1]).toHaveProperty('inlineData')
      expect(callArgs[1].inlineData).toHaveProperty('data')
      expect(callArgs[1].inlineData).toHaveProperty('mimeType', 'image/jpeg')
      
      // base64 헤더가 제거되었는지 확인
      expect(callArgs[1].inlineData.data).not.toContain('data:image')
    })

    it('MIME 타입을 올바르게 감지해야 함', async () => {
      const pngImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const mockAnalysisResult = {
        totalScore: 80,
        details: {
          pigmentation: { score: 75, grade: '주의' },
          acne: { score: 85, grade: '양호' },
          wrinkles: { score: 80, grade: '양호' },
          pores: { score: 80, grade: '양호' },
        },
        primaryConcern: '기미',
        doctorComment: '테스트',
      }

      mockResponse.text.mockResolvedValue(JSON.stringify(mockAnalysisResult))

      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ image: pngImage }),
      })

      await POST(request)

      const callArgs = mockGenerateContent.mock.calls[0][0]
      expect(callArgs[1].inlineData.mimeType).toBe('image/png')
    })
  })

  describe('프롬프트 검증', () => {
    it('올바른 모델과 설정으로 호출되어야 함', async () => {
      const mockAnalysisResult = {
        totalScore: 75,
        details: {
          pigmentation: { score: 65, grade: '주의' },
          acne: { score: 70, grade: '주의' },
          wrinkles: { score: 80, grade: '양호' },
          pores: { score: 55, grade: '주의' },
        },
        primaryConcern: '모공',
        doctorComment: '테스트',
      }

      mockResponse.text.mockResolvedValue(JSON.stringify(mockAnalysisResult))

      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ image: mockBase64Image }),
      })

      await POST(request)

      // getGenerativeModel이 올바른 설정으로 호출되었는지 확인
      const mockGenAI = (GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>).mock.results[0].value
      const getModel = (mockGenAI as any).getGenerativeModel
      
      expect(getModel).toHaveBeenCalledWith({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024,
        },
      })
    })
  })
})



