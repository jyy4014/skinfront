/**
 * 폼 검증 함수 모음
 */

import { FILE_VALIDATION } from '../config'

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * 이메일 검증
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return {
      valid: false,
      error: '이메일을 입력해주세요.',
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: '유효한 이메일 주소를 입력해주세요.',
    }
  }

  return { valid: true }
}

/**
 * 비밀번호 검증
 */
export function validatePassword(
  password: string,
  options: {
    minLength?: number
    requireUppercase?: boolean
    requireLowercase?: boolean
    requireNumber?: boolean
    requireSpecialChar?: boolean
  } = {}
): ValidationResult {
  const {
    minLength = 6,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecialChar = false,
  } = options

  if (!password || password.length === 0) {
    return {
      valid: false,
      error: '비밀번호를 입력해주세요.',
    }
  }

  if (password.length < minLength) {
    return {
      valid: false,
      error: `비밀번호는 최소 ${minLength}자 이상이어야 합니다.`,
    }
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: '비밀번호에 대문자가 포함되어야 합니다.',
    }
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return {
      valid: false,
      error: '비밀번호에 소문자가 포함되어야 합니다.',
    }
  }

  if (requireNumber && !/[0-9]/.test(password)) {
    return {
      valid: false,
      error: '비밀번호에 숫자가 포함되어야 합니다.',
    }
  }

  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      valid: false,
      error: '비밀번호에 특수문자가 포함되어야 합니다.',
    }
  }

  return { valid: true }
}

/**
 * 파일 검증 (이미지 파일)
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}
): ValidationResult {
  const {
    maxSize = FILE_VALIDATION.MAX_SIZE,
    allowedTypes = [...FILE_VALIDATION.ALLOWED_IMAGE_TYPES],
    allowedExtensions = [...FILE_VALIDATION.ALLOWED_EXTENSIONS],
  } = options

  // 파일 타입 검사
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: '이미지 파일만 업로드 가능합니다.',
    }
  }

  // MIME 타입 검사
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `지원하지 않는 이미지 형식입니다. (${allowedExtensions.join(', ').toUpperCase()}만 지원)`,
    }
  }

  // 파일 확장자 검사
  const fileName = file.name.toLowerCase()
  const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext))
  if (!hasValidExtension) {
    return {
      valid: false,
      error: `지원하지 않는 파일 확장자입니다. (${allowedExtensions.join(', ').toUpperCase()}만 지원)`,
    }
  }

  // 파일 크기 검사
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `파일 크기가 너무 큽니다. ${Math.round(maxSize / 1024 / 1024)}MB 이하의 파일을 선택해주세요.`,
    }
  }

  return { valid: true }
}

/**
 * 필수 필드 검증
 */
export function validateRequired(value: string | number | null | undefined, fieldName?: string): ValidationResult {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim().length === 0)) {
    return {
      valid: false,
      error: fieldName ? `${fieldName}을(를) 입력해주세요.` : '필수 입력 항목입니다.',
    }
  }

  return { valid: true }
}

/**
 * 최소 길이 검증
 */
export function validateMinLength(value: string, minLength: number, fieldName?: string): ValidationResult {
  if (value.length < minLength) {
    return {
      valid: false,
      error: fieldName
        ? `${fieldName}은(는) 최소 ${minLength}자 이상이어야 합니다.`
        : `최소 ${minLength}자 이상 입력해주세요.`,
    }
  }

  return { valid: true }
}

/**
 * 최대 길이 검증
 */
export function validateMaxLength(value: string, maxLength: number, fieldName?: string): ValidationResult {
  if (value.length > maxLength) {
    return {
      valid: false,
      error: fieldName
        ? `${fieldName}은(는) 최대 ${maxLength}자까지 입력 가능합니다.`
        : `최대 ${maxLength}자까지 입력 가능합니다.`,
    }
  }

  return { valid: true }
}

/**
 * 숫자 검증
 */
export function validateNumber(value: string | number, options: { min?: number; max?: number } = {}): ValidationResult {
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
    return {
      valid: false,
      error: '숫자를 입력해주세요.',
    }
  }

  if (options.min !== undefined && numValue < options.min) {
    return {
      valid: false,
      error: `최소값은 ${options.min}입니다.`,
    }
  }

  if (options.max !== undefined && numValue > options.max) {
    return {
      valid: false,
      error: `최대값은 ${options.max}입니다.`,
    }
  }

  return { valid: true }
}

/**
 * URL 검증
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || url.trim().length === 0) {
    return {
      valid: false,
      error: 'URL을 입력해주세요.',
    }
  }

  try {
    new URL(url)
    return { valid: true }
  } catch {
    return {
      valid: false,
      error: '유효한 URL을 입력해주세요.',
    }
  }
}

/**
 * 여러 검증 함수를 순차적으로 실행
 */
export function validateAll(
  value: string | number | File | null | undefined,
  validators: Array<(value: any) => ValidationResult>
): ValidationResult {
  for (const validator of validators) {
    const result = validator(value)
    if (!result.valid) {
      return result
    }
  }

  return { valid: true }
}



