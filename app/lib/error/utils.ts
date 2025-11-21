/**
 * 에러 처리 유틸리티 함수
 */

/**
 * Exponential backoff를 사용한 재시도 유틸리티
 * @param fn 실행할 함수
 * @param maxRetries 최대 재시도 횟수
 * @param initialDelay 초기 지연 시간 (ms)
 * @param onRetry 재시도 시 호출될 콜백 (attempt: 현재 시도 횟수, maxRetries: 최대 재시도 횟수, delay: 대기 시간)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  onRetry?: (attempt: number, maxRetries: number, delay: number) => void
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxRetries) {
        throw lastError
      }

      const delay = initialDelay * Math.pow(2, attempt)
      
      // 재시도 콜백 호출
      if (onRetry) {
        onRetry(attempt + 1, maxRetries, delay)
      }
      
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

