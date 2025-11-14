'use client'

import { useState, useCallback } from 'react'
import { ValidationResult, validateAll } from '../validators'

export interface FieldValidation {
  value: any
  validators: Array<(value: any) => ValidationResult>
  touched?: boolean
  error?: string
}

export interface FormValidationConfig {
  [fieldName: string]: FieldValidation
}

export interface UseFormValidationReturn {
  /**
   * 필드 값
   */
  values: Record<string, any>
  
  /**
   * 필드 에러
   */
  errors: Record<string, string | undefined>
  
  /**
   * 필드 터치 상태
   */
  touched: Record<string, boolean>
  
  /**
   * 폼 유효성 상태
   */
  isValid: boolean
  
  /**
   * 필드 값 설정
   */
  setFieldValue: (fieldName: string, value: any) => void
  
  /**
   * 필드 값 변경 핸들러
   */
  handleChange: (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  
  /**
   * 필드 검증
   */
  validateField: (fieldName: string) => ValidationResult
  
  /**
   * 전체 폼 검증
   */
  validateForm: () => boolean
  
  /**
   * 필드 터치
   */
  setFieldTouched: (fieldName: string) => void
  
  /**
   * 폼 초기화
   */
  resetForm: () => void
  
  /**
   * 필드 리셋
   */
  resetField: (fieldName: string) => void
}

/**
 * 폼 검증 훅
 */
export function useFormValidation(
  initialConfig: FormValidationConfig
): UseFormValidationReturn {
  // 초기 값 설정
  const initialValues = Object.keys(initialConfig).reduce(
    (acc, key) => {
      acc[key] = initialConfig[key].value
      return acc
    },
    {} as Record<string, any>
  )

  const [values, setValues] = useState<Record<string, any>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // 필드 값 설정
  const setFieldValue = useCallback((fieldName: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }))
    
    // 터치된 필드는 자동 검증
    if (touched[fieldName]) {
      const fieldConfig = initialConfig[fieldName]
      if (fieldConfig) {
        const result = validateAll(value, fieldConfig.validators)
        setErrors((prev) => ({
          ...prev,
          [fieldName]: result.error,
        }))
      }
    }
  }, [initialConfig, touched])

  // 필드 변경 핸들러
  const handleChange = useCallback(
    (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
      setFieldValue(fieldName, value)
    },
    [setFieldValue]
  )

  // 필드 검증
  const validateField = useCallback(
    (fieldName: string): ValidationResult => {
      const fieldConfig = initialConfig[fieldName]
      if (!fieldConfig) {
        return { valid: true }
      }

      const result = validateAll(values[fieldName], fieldConfig.validators)
      setErrors((prev) => ({
        ...prev,
        [fieldName]: result.error,
      }))

      return result
    },
    [initialConfig, values]
  )

  // 전체 폼 검증
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string | undefined> = {}
    let isValid = true

    for (const fieldName in initialConfig) {
      const fieldConfig = initialConfig[fieldName]
      if (!fieldConfig) continue

      const result = validateAll(values[fieldName], fieldConfig.validators)
      if (!result.valid) {
        newErrors[fieldName] = result.error
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }, [initialConfig, values])

  // 필드 터치
  const setFieldTouched = useCallback(
    (fieldName: string) => {
      setTouched((prev) => ({ ...prev, [fieldName]: true }))
      validateField(fieldName)
    },
    [validateField]
  )

  // 폼 초기화
  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  // 필드 리셋
  const resetField = useCallback(
    (fieldName: string) => {
      const initialValue = initialConfig[fieldName]?.value
      setValues((prev) => ({ ...prev, [fieldName]: initialValue }))
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }))
      setTouched((prev) => ({ ...prev, [fieldName]: false }))
    },
    [initialConfig]
  )

  // 폼 유효성 계산
  const isValid = Object.keys(errors).every((key) => !errors[key])

  return {
    values,
    errors,
    touched,
    isValid,
    setFieldValue,
    handleChange,
    validateField,
    validateForm,
    setFieldTouched,
    resetForm,
    resetField,
  }
}

