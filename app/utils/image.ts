// 이미지 전처리 유틸리티

/**
 * 이미지를 리사이즈하고 WebP로 변환
 * @param file 원본 이미지 파일
 * @param maxWidth 최대 너비 (기본값: 1024)
 * @param quality 품질 (0-1, 기본값: 0.85)
 * @returns 리사이즈된 Blob
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 1024,
  quality: number = 0.85
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
 * @param file 이미지 파일
 * @returns sharpness 점수 (0-1, 높을수록 선명)
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
            
            // 3x3 커널 적용
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * width + (x + kx)) * 4
                const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
                const kernelIdx = (ky + 1) * 3 + (kx + 1)
                laplacian += gray * laplacianKernel[kernelIdx]
              }
            }
            
            laplacianSum += Math.abs(laplacian)
            pixelCount++
          }
        }

        // Laplacian variance 계산
        const meanLaplacian = laplacianSum / pixelCount
        let variance = 0
        
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            let laplacian = 0
            
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * width + (x + kx)) * 4
                const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
                const kernelIdx = (ky + 1) * 3 + (kx + 1)
                laplacian += gray * laplacianKernel[kernelIdx]
              }
            }
            
            variance += Math.pow(Math.abs(laplacian) - meanLaplacian, 2)
          }
        }
        
        variance /= pixelCount

        // Laplacian variance가 높을수록 선명한 이미지
        // 일반적으로 100 이상이면 선명한 이미지로 간주
        // 0-1 범위로 정규화 (100 이상이면 1.0에 가까움)
        const sharpnessScore = Math.min(1, variance / 100)
        resolve(sharpnessScore)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * EXIF 데이터 제거
 * @param file 원본 이미지 파일
 * @returns EXIF가 제거된 Blob
 */
export async function removeEXIF(file: File): Promise<Blob> {
  return resizeImage(file, file.type === 'image/jpeg' ? undefined : 4096, 0.9)
}

