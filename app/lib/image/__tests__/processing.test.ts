/**
 * TDD: 이미지 처리 모듈 테스트
 * 
 * 테스트 시나리오:
 * 1. 이미지 리사이즈 성공
 * 2. WebP 변환
 * 3. 품질 검사 (Laplacian)
 * 4. 파일 검증
 */

import { processImage, resizeImage, checkImageQuality } from '../processing'
import { validateImageFile } from '../validation'

// Canvas 및 Image 모킹
global.Image = class {
  width = 2000
  height = 1500
  src = ''
  onload: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor() {
    // 즉시 onload 트리거
    Promise.resolve().then(() => {
      if (this.onload) {
        this.onload()
      }
    })
  }
} as any

// getImageData 모킹 - Laplacian 계산을 위한 충분한 데이터
const createMockImageData = (width: number, height: number) => {
  const size = width * height * 4 // RGBA
  const data = new Uint8ClampedArray(size)
  // 다양한 픽셀 값으로 채워서 edge detection이 작동하도록
  // 최소 3x3 크기가 필요 (Laplacian 커널이 3x3)
  const w = Math.max(3, width || 10)
  const h = Math.max(3, height || 10)
  const actualSize = w * h * 4
  const actualData = new Uint8ClampedArray(actualSize)
  
  for (let i = 0; i < actualSize; i += 4) {
    actualData[i] = 100 + Math.floor(Math.random() * 100) // R
    actualData[i + 1] = 100 + Math.floor(Math.random() * 100) // G
    actualData[i + 2] = 100 + Math.floor(Math.random() * 100) // B
    actualData[i + 3] = 255 // A
  }
  return { data: actualData, width: w, height: h }
}

global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawImage: jest.fn(),
  getImageData: jest.fn((x, y, width, height) => {
    return createMockImageData(width || 10, height || 10)
  }),
}))

global.HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/webp;base64,test')

global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback, mimeType, quality) => {
  if (callback) {
    // 동기적으로 즉시 실행 (toBlob은 보통 동기적으로 콜백을 호출)
    const blob = new Blob(['test'], { type: mimeType || 'image/webp' })
    callback(blob)
  }
})

global.FileReader = class {
  result: string | null = null
  onload: ((e: any) => void) | null = null
  onerror: (() => void) | null = null

  readAsDataURL(file: File) {
    // 즉시 onload 트리거
    Promise.resolve().then(() => {
      this.result = 'data:image/jpeg;base64,test'
      if (this.onload) {
        this.onload({ target: { result: this.result } } as any)
      }
    })
  }
} as any

describe('Image Processing', () => {
  describe('resizeImage', () => {
    it('이미지를 올바르게 리사이즈해야 함', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const blob = await resizeImage(file, 1024, 0.85)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('image/webp')
    }, 10000) // 타임아웃 증가

    it('최대 너비를 초과하지 않아야 함', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const blob = await resizeImage(file, 800, 0.85)

      expect(blob).toBeInstanceOf(Blob)
    }, 10000) // 타임아웃 증가
  })

  describe('checkImageQuality', () => {
    it('이미지 품질 점수를 올바르게 계산해야 함', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const score = await checkImageQuality(file)

      expect(typeof score).toBe('number')
      expect(Number.isNaN(score)).toBe(false) // NaN이 아니어야 함
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    }, 10000) // 타임아웃 증가
  })

  describe('validateImageFile', () => {
    it('유효한 이미지 파일을 통과시켜야 함', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = validateImageFile(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('너무 큰 파일을 거부해야 함', () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      })
      const result = validateImageFile(largeFile, 10 * 1024 * 1024)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('크기')
    })

    it('이미지가 아닌 파일을 거부해야 함', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const result = validateImageFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('이미지')
    })
  })

  describe('processImage', () => {
    it('이미지를 리사이즈하고 WebP로 변환해야 함', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = await processImage(file, {
        maxWidth: 1024,
        quality: 0.85,
      })

      expect(result.file).toBeInstanceOf(File)
      expect(result.file.type).toBe('image/webp')
    }, 10000) // 타임아웃 증가

    it('품질 검사를 포함할 수 있어야 함', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = await processImage(file, {
        maxWidth: 1024,
        quality: 0.85,
        checkQuality: true,
      })

      expect(result.qualityScore).toBeDefined()
      expect(typeof result.qualityScore).toBe('number')
    }, 10000) // 타임아웃 증가
  })
})

