/**
 * 기본 HTTP 클라이언트
 * fetch를 래핑하여 일관된 API 호출 인터페이스 제공
 * 자동 재시도 기능 포함
 */

import { retryWithBackoff } from '../error/utils'
import { classifyError, ErrorType } from '../error/handler'

export interface ApiClientOptions {
  baseURL?: string
  headers?: Record<string, string>
  timeout?: number
  retry?: {
    enabled: boolean
    maxRetries?: number
    initialDelay?: number
  }
}

export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>
  retry?: {
    enabled: boolean
    maxRetries?: number
    initialDelay?: number
  }
}

export class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>
  private defaultRetryConfig: {
    enabled: boolean
    maxRetries: number
    initialDelay: number
  }

  constructor(options: ApiClientOptions = {}) {
    this.baseURL = options.baseURL || ''
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    this.defaultRetryConfig = {
      enabled: options.retry?.enabled ?? true,
      maxRetries: options.retry?.maxRetries ?? 3,
      initialDelay: options.retry?.initialDelay ?? 1000,
    }
  }

  private async performRequest<T>(
    url: string,
    options: RequestOptions
  ): Promise<T> {
    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        // JSON 파싱 실패 시 기본 메시지 사용
      }
      const error = new Error(errorMessage)
      // HTTP 상태 코드를 에러에 포함
      ;(error as any).status = response.status
      throw error
    }

    return response.json()
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseURL}${endpoint}`

    const retryConfig = {
      enabled: options.retry?.enabled ?? this.defaultRetryConfig.enabled,
      maxRetries: options.retry?.maxRetries ?? this.defaultRetryConfig.maxRetries,
      initialDelay: options.retry?.initialDelay ?? this.defaultRetryConfig.initialDelay,
    }

    // 재시도가 비활성화된 경우 또는 재시도 불가능한 요청(GET이 아닌 경우)은 바로 실행
    if (!retryConfig.enabled || options.method !== 'GET') {
      return this.performRequest<T>(url, options)
    }

    // 재시도 가능한 에러인지 확인하고 재시도
    return retryWithBackoff(
      () => this.performRequest<T>(url, options),
      retryConfig.maxRetries,
      retryConfig.initialDelay
    ).catch((error) => {
      // 재시도 실패 시 에러 분류
      const classified = classifyError(error)
      if (classified.retryable && classified.type === ErrorType.NETWORK) {
        throw new Error(
          `${classified.message} (${retryConfig.maxRetries + 1}회 시도 후 실패)`
        )
      }
      throw error
    })
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

/**
 * 기본 API 클라이언트 생성
 */
export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  return new ApiClient(options)
}

/**
 * Edge Function 호출 헬퍼
 */
export interface EdgeFunctionOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  accessToken?: string
  headers?: Record<string, string>
}

import { getSupabaseUrl } from '../config'

export async function callEdgeFunction<T>(
  functionName: string,
  options: EdgeFunctionOptions & { retry?: { enabled: boolean; maxRetries?: number; initialDelay?: number } } = {}
): Promise<T> {
  const supabaseUrl = getSupabaseUrl()
  const url = `${supabaseUrl}/functions/v1/${functionName}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`
  }

  const retryConfig = {
    enabled: options.retry?.enabled ?? true,
    maxRetries: options.retry?.maxRetries ?? 3,
    initialDelay: options.retry?.initialDelay ?? 1000,
  }

  const performRequest = async (): Promise<T> => {
    const response = await fetch(url, {
      method: options.method || 'POST',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    if (!response.ok) {
      let errorMessage = `Edge Function error! status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        // JSON 파싱 실패 시 기본 메시지 사용
      }
      const error = new Error(errorMessage)
      ;(error as any).status = response.status
      throw error
    }

    return response.json()
  }

  // 재시도가 비활성화된 경우 바로 실행
  if (!retryConfig.enabled) {
    return performRequest()
  }

  // 재시도 가능한 에러인지 확인하고 재시도
  return retryWithBackoff(
    performRequest,
    retryConfig.maxRetries,
    retryConfig.initialDelay
  ).catch((error) => {
    const classified = classifyError(error)
    if (classified.retryable && (classified.type === ErrorType.NETWORK || classified.type === ErrorType.SERVER)) {
      throw new Error(
        `${classified.message} (${retryConfig.maxRetries + 1}회 시도 후 실패)`
      )
    }
    throw error
  })
}

