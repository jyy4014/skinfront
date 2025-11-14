/**
 * 이미지 파일 검증
 */

import { FILE_VALIDATION } from '../config'

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * 이미지 파일 유효성 검사
 */
export function validateImageFile(
  file: File,
  maxSize: number = FILE_VALIDATION.MAX_SIZE
): ValidationResult {
  // 파일 타입 검사
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: '이미지 파일만 업로드 가능합니다.',
    }
  }

  // MIME 타입 검사
  const fileType = file.type.toLowerCase()
  const allowedTypes = FILE_VALIDATION.ALLOWED_IMAGE_TYPES as readonly string[]
  if (!allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: '지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP, GIF만 지원)',
    }
  }

  // 파일 크기 검사
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `파일 크기가 너무 큽니다. ${Math.round(maxSize / 1024 / 1024)}MB 이하의 이미지를 선택해주세요.`,
    }
  }

  return { valid: true }
}

