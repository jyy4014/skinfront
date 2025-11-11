/**
 * 에러 처리 훅
 */

'use client'

import { useCallback } from 'react'
import { classifyError, getErrorMessage, ErrorType } from '../handler'
import type { ClassifiedError } from '../handler'

export interface UseErrorHandlerReturn {
  handleError: (error: unknown) => ClassifiedError
  getMessage: (error: unknown) => string
  isRetryable: (error: unknown) => boolean
}

/**
 * 에러 처리를 위한 훅
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const handleError = useCallback((error: unknown): ClassifiedError => {
    return classifyError(error)
  }, [])

  const getMessage = useCallback((error: unknown): string => {
    const classified = classifyError(error)
    return getErrorMessage(classified)
  }, [])

  const isRetryable = useCallback((error: unknown): boolean => {
    const classified = classifyError(error)
    return classified.retryable
  }, [])

  return {
    handleError,
    getMessage,
    isRetryable,
  }
}

