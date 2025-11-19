/**
 * TDD: 이미지 품질 검사 로직 검증 테스트 (수정 버전)
 * 
 * 로직 에러 체크:
 * 1. Division by zero 방지
 * 2. Undefined 변수 체크
 * 3. 경계값 처리
 * 4. 가중치 합 검증
 * 5. 점수 범위 검증
 */

import { checkImageQualityComprehensive } from '../quality-check'
import { checkImageQuality } from '../processing'

jest.mock('../processing', () => ({
  checkImageQuality: jest.fn(),
}))

const createMockFile = (name: string = 'test.jpg', type: string = 'image/jpeg'): File => {
  const blob = new Blob(['test'], { type })
  return new File([blob], name, { type })
}

// FileReader 모킹 헬퍼
const createMockFileReader = (result: string, shouldError: boolean = false) => {
  return class {
    result: string | null = result
    onload: ((e: any) => void) | null = null
    onerror: (() => void) | null = null

    readAsDataURL(file: File) {
      if (shouldError) {
        Promise.resolve().then(() => {
          if (this.onerror) this.onerror()
        })
      } else {
        Promise.resolve().then(() => {
          if (this.onload) {
            this.onload({ target: { result } })
          }
        })
      }
    }
  }
}

describe('로직 검증 테스트 (수정 버전)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Global FileReader 모킹
    global.FileReader = createMockFileReader('data:image/jpeg;base64,test') as any
    
    // Global Image 모킹
    global.Image = class {
      width = 100
      height = 100
      src = ''
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      
      constructor() {
        Promise.resolve().then(() => {
          if (this.onload) this.onload()
        })
      }
    } as any
    
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
      drawImage: jest.fn(),
      getImageData: jest.fn().mockReturnValue({
        data: new Uint8ClampedArray(100 * 100 * 4).fill(128),
        width: 100,
        height: 100,
      }),
    }) as any
  })

  describe('Division by Zero 방지', () => {
    it('pixelCount가 0이어도 에러가 발생하지 않아야 함', async () => {
      const file = createMockFile()
      
      // 빈 이미지 데이터 모킹
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
        drawImage: jest.fn(),
        getImageData: jest.fn().mockReturnValue({
          data: new Uint8ClampedArray(0), // 빈 배열
          width: 0,
          height: 0,
        }),
      }) as any
      
      // 에러가 발생하지 않아야 함 (기본값 50 반환)
      const result = await checkImageQualityComprehensive(file, {
        checkSharpness: false,
        checkBrightness: true,
        checkAngle: false,
      })
      
      expect(result).toBeDefined()
      expect(result.brightness).toBe(50) // 기본값
    }, 10000)

    it('이미지 크기가 0x0이어도 처리되어야 함', async () => {
      const file = createMockFile()
      
      global.Image = class {
        width = 0
        height = 0
        src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        
        constructor() {
          Promise.resolve().then(() => {
            if (this.onload) this.onload()
          })
        }
      } as any
      
      const result = await checkImageQualityComprehensive(file, {
        checkSharpness: false,
        checkBrightness: false,
        checkAngle: true,
      })
      
      expect(result).toBeDefined()
      expect(result.angle).toBe(75) // 기본값
    }, 10000)
  })

  describe('가중치 합 검증', () => {
    it('가중치의 합이 1.0이어야 함', async () => {
      const mockCheckImageQuality = checkImageQuality as jest.MockedFunction<typeof checkImageQuality>
      mockCheckImageQuality.mockResolvedValue(0.5)
      
      const file = createMockFile()
      const result = await checkImageQualityComprehensive(file)
      
      // 가중치: sharpness 0.4 + brightness 0.35 + angle 0.25 = 1.0
      const weightsSum = 0.4 + 0.35 + 0.25
      expect(weightsSum).toBe(1.0)
      
      // 종합 점수가 각 점수의 가중 평균인지 확인
      const expectedScore = Math.round(
        result.sharpness * 0.4 +
        result.brightness * 0.35 +
        result.angle * 0.25
      )
      expect(result.overallScore).toBe(expectedScore)
    }, 10000)
  })

  describe('점수 범위 검증', () => {
    it('모든 점수가 0-100 범위 내에 있어야 함', async () => {
      const mockCheckImageQuality = checkImageQuality as jest.MockedFunction<typeof checkImageQuality>
      mockCheckImageQuality.mockResolvedValue(0.5)
      
      const file = createMockFile()
      const result = await checkImageQualityComprehensive(file)
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
      expect(result.sharpness).toBeGreaterThanOrEqual(0)
      expect(result.sharpness).toBeLessThanOrEqual(100)
      expect(result.brightness).toBeGreaterThanOrEqual(0)
      expect(result.brightness).toBeLessThanOrEqual(100)
      expect(result.angle).toBeGreaterThanOrEqual(0)
      expect(result.angle).toBeLessThanOrEqual(100)
    }, 10000)

    it('종합 점수가 음수가 되지 않아야 함', async () => {
      const mockCheckImageQuality = checkImageQuality as jest.MockedFunction<typeof checkImageQuality>
      mockCheckImageQuality.mockRejectedValue(new Error('실패')) // sharpness: 0
      
      const file = createMockFile()
      
      // 어두운 이미지
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
        drawImage: jest.fn(),
        getImageData: jest.fn().mockReturnValue({
          data: new Uint8ClampedArray(100 * 100 * 4).fill(10), // 매우 어두움
          width: 100,
          height: 100,
        }),
      }) as any
      
      global.Image = class {
        width = 1
        height = 100
        src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        
        constructor() {
          Promise.resolve().then(() => {
            if (this.onload) this.onload()
          })
        }
      } as any
      
      const result = await checkImageQualityComprehensive(file)
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
    }, 10000)

    it('종합 점수가 100을 초과하지 않아야 함', async () => {
      const mockCheckImageQuality = checkImageQuality as jest.MockedFunction<typeof checkImageQuality>
      mockCheckImageQuality.mockResolvedValue(1.0) // sharpness: 100
      
      const file = createMockFile()
      
      // 매우 밝은 이미지
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
        drawImage: jest.fn(),
        getImageData: jest.fn().mockReturnValue({
          data: new Uint8ClampedArray(100 * 100 * 4).fill(255), // 최대 밝기
          width: 100,
          height: 100,
        }),
      }) as any
      
      global.Image = class {
        width = 100
        height = 100
        src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        
        constructor() {
          Promise.resolve().then(() => {
            if (this.onload) this.onload()
          })
        }
      } as any
      
      const result = await checkImageQualityComprehensive(file)
      
      expect(result.overallScore).toBeLessThanOrEqual(100)
    }, 10000)
  })

  describe('경계값 처리', () => {
    it('minScore가 0이어도 정상 작동해야 함', async () => {
      const mockCheckImageQuality = checkImageQuality as jest.MockedFunction<typeof checkImageQuality>
      mockCheckImageQuality.mockResolvedValue(0.3)
      
      const file = createMockFile()
      const result = await checkImageQualityComprehensive(file, { minScore: 0 })
      
      expect(result.isGood).toBeDefined()
      expect(typeof result.isGood).toBe('boolean')
    }, 10000)

    it('minScore가 100이어도 정상 작동해야 함', async () => {
      const mockCheckImageQuality = checkImageQuality as jest.MockedFunction<typeof checkImageQuality>
      mockCheckImageQuality.mockResolvedValue(1.0)
      
      const file = createMockFile()
      const result = await checkImageQualityComprehensive(file, { minScore: 100 })
      
      expect(result.isGood).toBeDefined()
      expect(typeof result.isGood).toBe('boolean')
    }, 10000)

    it('minScore가 음수여도 처리되어야 함', async () => {
      const mockCheckImageQuality = checkImageQuality as jest.MockedFunction<typeof checkImageQuality>
      mockCheckImageQuality.mockResolvedValue(0.5)
      
      const file = createMockFile()
      const result = await checkImageQualityComprehensive(file, { minScore: -10 })
      
      // 음수 minScore는 항상 true가 되어야 함 (issues가 없으면)
      expect(result.isGood).toBeDefined()
    }, 10000)
  })

  describe('Undefined 변수 체크', () => {
    it('모든 반환 값이 정의되어 있어야 함', async () => {
      const mockCheckImageQuality = checkImageQuality as jest.MockedFunction<typeof checkImageQuality>
      mockCheckImageQuality.mockResolvedValue(0.8)
      
      const file = createMockFile()
      const result = await checkImageQualityComprehensive(file)
      
      expect(result.overallScore).toBeDefined()
      expect(result.sharpness).toBeDefined()
      expect(result.brightness).toBeDefined()
      expect(result.angle).toBeDefined()
      expect(result.issues).toBeDefined()
      expect(result.recommendations).toBeDefined()
      expect(result.isGood).toBeDefined()
      
      expect(Array.isArray(result.issues)).toBe(true)
      expect(Array.isArray(result.recommendations)).toBe(true)
      expect(typeof result.isGood).toBe('boolean')
    }, 10000)

    it('issues와 recommendations가 항상 배열이어야 함', async () => {
      const mockCheckImageQuality = checkImageQuality as jest.MockedFunction<typeof checkImageQuality>
      mockCheckImageQuality.mockResolvedValue(0.9)
      
      const file = createMockFile()
      const result = await checkImageQualityComprehensive(file)
      
      expect(Array.isArray(result.issues)).toBe(true)
      expect(Array.isArray(result.recommendations)).toBe(true)
    }, 10000)
  })

  describe('에러 처리 로직', () => {
    it('초점 검사 실패 시 sharpness가 0으로 설정되어야 함', async () => {
      const mockCheckImageQuality = checkImageQuality as jest.MockedFunction<typeof checkImageQuality>
      mockCheckImageQuality.mockRejectedValue(new Error('검사 실패'))
      
      const file = createMockFile()
      const result = await checkImageQualityComprehensive(file)
      
      expect(result.sharpness).toBe(0)
      expect(result.issues).toContain('초점 검사 실패')
    }, 10000)

    it('조명 검사 실패 시 brightness가 50으로 설정되어야 함', async () => {
      const file = createMockFile()
      
      // FileReader 에러 모킹
      global.FileReader = createMockFileReader('', true) as any
      
      const result = await checkImageQualityComprehensive(file, {
        checkSharpness: false,
        checkBrightness: true,
        checkAngle: false,
      })
      
      expect(result.brightness).toBe(50)
      expect(result.issues).toContain('조명 검사 실패')
    }, 10000)

    it('각도 검사 실패 시 angle이 75로 설정되어야 함', async () => {
      const file = createMockFile()
      
      // Image 에러 모킹
      global.Image = class {
        width = 100
        height = 100
        src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        
        constructor() {
          Promise.resolve().then(() => {
            if (this.onerror) this.onerror()
          })
        }
      } as any
      
      const result = await checkImageQualityComprehensive(file, {
        checkSharpness: false,
        checkBrightness: false,
        checkAngle: true,
      })
      
      expect(result.angle).toBe(75)
      // 각도 검사 실패는 issues에 추가되지 않음 (너무 엄격하지 않게)
    }, 10000)
  })

  describe('isGood 판정 로직', () => {
    it('종합 점수가 minScore 이상이고 issues가 없으면 isGood이 true여야 함', async () => {
      const mockCheckImageQuality = checkImageQuality as jest.MockedFunction<typeof checkImageQuality>
      mockCheckImageQuality.mockResolvedValue(0.9) // sharpness: 90
      
      const file = createMockFile()
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
        drawImage: jest.fn(),
        getImageData: jest.fn().mockReturnValue({
          data: new Uint8ClampedArray(100 * 100 * 4).fill(150), // 적정 밝기
          width: 100,
          height: 100,
        }),
      }) as any
      
      global.Image = class {
        width = 100
        height = 100
        src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        
        constructor() {
          Promise.resolve().then(() => {
            if (this.onload) this.onload()
          })
        }
      } as any
      
      const result = await checkImageQualityComprehensive(file, { minScore: 60 })
      
      expect(result.overallScore).toBeGreaterThanOrEqual(60)
      expect(result.issues.length).toBe(0)
      expect(result.isGood).toBe(true)
    }, 10000)

    it('종합 점수가 minScore 이상이어도 issues가 있으면 isGood이 false여야 함', async () => {
      const mockCheckImageQuality = checkImageQuality as jest.MockedFunction<typeof checkImageQuality>
      mockCheckImageQuality.mockResolvedValue(0.3) // sharpness: 30 (문제점 발생)
      
      const file = createMockFile()
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
        drawImage: jest.fn(),
        getImageData: jest.fn().mockReturnValue({
          data: new Uint8ClampedArray(100 * 100 * 4).fill(150), // 적정 밝기
          width: 100,
          height: 100,
        }),
      }) as any
      
      global.Image = class {
        width = 100
        height = 100
        src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        
        constructor() {
          Promise.resolve().then(() => {
            if (this.onload) this.onload()
          })
        }
      } as any
      
      const result = await checkImageQualityComprehensive(file, { minScore: 20 })
      
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.isGood).toBe(false)
    }, 10000)

    it('종합 점수가 minScore 미만이면 issues가 없어도 isGood이 false여야 함', async () => {
      const mockCheckImageQuality = checkImageQuality as jest.MockedFunction<typeof checkImageQuality>
      mockCheckImageQuality.mockResolvedValue(0.3) // sharpness: 30
      
      const file = createMockFile()
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
        drawImage: jest.fn(),
        getImageData: jest.fn().mockReturnValue({
          data: new Uint8ClampedArray(100 * 100 * 4).fill(50), // 어두움
          width: 100,
          height: 100,
        }),
      }) as any
      
      global.Image = class {
        width = 1
        height = 100
        src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        
        constructor() {
          Promise.resolve().then(() => {
            if (this.onload) this.onload()
          })
        }
      } as any
      
      const result = await checkImageQualityComprehensive(file, { minScore: 60 })
      
      expect(result.overallScore).toBeLessThan(60)
      expect(result.isGood).toBe(false)
    }, 10000)
  })

  describe('밝기 계산 로직 검증', () => {
    it('밝기 점수가 0-100 범위를 벗어나지 않아야 함', async () => {
      const file = createMockFile()
      
      // 다양한 밝기 값 테스트
      const brightnessValues = [0, 50, 100, 150, 200, 255]
      
      for (const brightness of brightnessValues) {
        HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
          drawImage: jest.fn(),
          getImageData: jest.fn().mockReturnValue({
            data: new Uint8ClampedArray(100 * 100 * 4).fill(brightness),
            width: 100,
            height: 100,
          }),
        }) as any
        
        const result = await checkImageQualityComprehensive(file, {
          checkSharpness: false,
          checkBrightness: true,
          checkAngle: false,
        })
        
        expect(result.brightness).toBeGreaterThanOrEqual(0)
        expect(result.brightness).toBeLessThanOrEqual(100)
      }
    }, 30000)

    it('밝기 계산에서 averageBrightness가 정의되어 있어야 함', async () => {
      const file = createMockFile()
      
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
        drawImage: jest.fn(),
        getImageData: jest.fn().mockReturnValue({
          data: new Uint8ClampedArray(100 * 100 * 4).fill(128),
          width: 100,
          height: 100,
        }),
      }) as any
      
      const result = await checkImageQualityComprehensive(file, {
        checkSharpness: false,
        checkBrightness: true,
        checkAngle: false,
      })
      
      // averageBrightness가 계산되어 brightness 점수가 나와야 함
      expect(result.brightness).toBeDefined()
      expect(typeof result.brightness).toBe('number')
    }, 10000)
  })

  describe('각도 계산 로직 검증', () => {
    it('이미지 비율이 0이어도 에러가 발생하지 않아야 함', async () => {
      const file = createMockFile()
      
      global.Image = class {
        width = 0
        height = 100
        src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        
        constructor() {
          Promise.resolve().then(() => {
            if (this.onload) this.onload()
          })
        }
      } as any
      
      const result = await checkImageQualityComprehensive(file, {
        checkSharpness: false,
        checkBrightness: false,
        checkAngle: true,
      })
      
      expect(result).toBeDefined()
      expect(result.angle).toBe(75) // 기본값 (width가 0이므로)
    }, 10000)

    it('이미지 높이가 0이어도 에러가 발생하지 않아야 함', async () => {
      const file = createMockFile()
      
      global.Image = class {
        width = 100
        height = 0
        src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        
        constructor() {
          Promise.resolve().then(() => {
            if (this.onload) this.onload()
          })
        }
      } as any
      
      const result = await checkImageQualityComprehensive(file, {
        checkSharpness: false,
        checkBrightness: false,
        checkAngle: true,
      })
      
      expect(result).toBeDefined()
      expect(result.angle).toBe(75) // 기본값 (height가 0이므로)
    }, 10000)
  })
})

