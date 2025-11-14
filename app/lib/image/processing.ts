/**
 * 이미지 처리 핵심 로직
 */

import { IMAGE_CONFIG, IMAGE_QUALITY_VALIDATION } from '../config'

export interface ProcessImageOptions {
  maxWidth?: number
  quality?: number
  checkQuality?: boolean
}

export interface ProcessImageResult {
  file: File
  qualityScore?: number
}

/**
 * 이미지를 리사이즈하고 WebP로 변환
 */
export async function resizeImage(
  file: File,
  maxWidth: number = IMAGE_CONFIG.MAX_WIDTH,
  quality: number = IMAGE_CONFIG.QUALITY
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // 비율 유지하면서 리사이즈
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // WebP 지원 여부 확인
        const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
        const mimeType = supportsWebP ? 'image/webp' : file.type

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create blob'))
            }
          },
          mimeType,
          quality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * 이미지 품질 검사 (Laplacian variance 기반)
 */
export async function checkImageQuality(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        // 성능을 위해 최대 512x512로 리사이즈하여 검사
        const maxSize = 512
        let width = img.width
        let height = img.height
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }
        
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        // 이미지 리사이즈하여 그리기
        ctx.drawImage(img, 0, 0, width, height)

        // Laplacian 필터를 사용한 edge detection
        const imageData = ctx.getImageData(0, 0, width, height)
        const data = imageData.data
        const laplacianKernel = [
          0, -1, 0,
          -1, 4, -1,
          0, -1, 0
        ]
        
        let laplacianSum = 0
        let pixelCount = 0

        // 그레이스케일 변환 및 Laplacian 계산
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            let laplacian = 0
            let gray = 0

            // Laplacian 커널 적용
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * width + (x + kx)) * 4
                const kernelIdx = (ky + 1) * 3 + (kx + 1)
                const weight = laplacianKernel[kernelIdx]
                
                // 그레이스케일 변환 (RGB 평균)
                const r = data[idx]
                const g = data[idx + 1]
                const b = data[idx + 2]
                gray = (r + g + b) / 3
                
                laplacian += gray * weight
              }
            }

            laplacianSum += Math.abs(laplacian)
            pixelCount++
          }
        }

        // Laplacian variance 계산
        const variance = laplacianSum / pixelCount
        
        // 정규화 (0-1 범위로 변환)
        // 일반적으로 variance가 100 이상이면 선명한 이미지로 간주
        const normalizedScore = Math.min(1.0, variance / 100)

        resolve(normalizedScore)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * 통합 이미지 처리 (리사이즈 + WebP 변환 + 품질 검사)
 */
export async function processImage(
  file: File,
  options: ProcessImageOptions = {}
): Promise<ProcessImageResult> {
  const {
    maxWidth = IMAGE_CONFIG.MAX_WIDTH,
    quality = IMAGE_CONFIG.QUALITY,
    checkQuality = false,
  } = options

  // 이미지 리사이즈 및 WebP 변환
  const resizedBlob = await resizeImage(file, maxWidth, quality)
  const processedFile = new File([resizedBlob], file.name, {
    type: resizedBlob.type,
    lastModified: Date.now(),
  })

  // 품질 검사 (선택적)
  let qualityScore: number | undefined
  if (checkQuality) {
    qualityScore = await checkImageQuality(processedFile)
    // sharpnessScore는 높을수록 선명 (0-1 범위)
    // 최소 품질 점수 미만이면 너무 흐린 이미지로 간주
    if (qualityScore < IMAGE_QUALITY_VALIDATION.MIN_QUALITY_SCORE) {
      throw new Error('이미지가 너무 흐릿합니다. 더 선명한 사진을 사용해주세요.')
    }
  }

  return { file: processedFile, qualityScore }
}

