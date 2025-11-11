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
  width = 0
  height = 0
  src = ''
  onload: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor() {
    setTimeout(() => {
      this.width = 2000
      this.height = 1500
      if (this.onload) {
        this.onload()
      }
    }, 10)
  }
} as any

global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawImage: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(1000).fill(128),
    width: 10,
    height: 10,
  })),
}))

global.HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
  callback(new Blob(['test'], { type: 'image/webp' }))
})

global.FileReader = class {
  result: string | null = null
  onloadend: (() => void) | null = null

  readAsDataURL() {
    this.result = 'data:image/jpeg;base64,test'
    if (this.onloadend) {
      this.onloadend()
    }
  }
} as any

describe('Image Processing', () => {
  describe('resizeImage', () => {
    it('이미지를 올바르게 리사이즈해야 함', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const blob = await resizeImage(file, 1024, 0.85)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('image/webp')
    })

    it('최대 너비를 초과하지 않아야 함', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const blob = await resizeImage(file, 800, 0.85)

      expect(blob).toBeInstanceOf(Blob)
    })
  })

  describe('checkImageQuality', () => {
    it('이미지 품질 점수를 올바르게 계산해야 함', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const score = await checkImageQuality(file)

      expect(typeof score).toBe('number')
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })
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
    })

    it('품질 검사를 포함할 수 있어야 함', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = await processImage(file, {
        maxWidth: 1024,
        quality: 0.85,
        checkQuality: true,
      })

      expect(result.qualityScore).toBeDefined()
      expect(typeof result.qualityScore).toBe('number')
    })
  })
})

