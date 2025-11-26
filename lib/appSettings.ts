/**
 * App Settings 유틸리티
 * Supabase DB에서 앱 설정을 조회하는 함수들
 */

import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 (anon key 사용 - 읽기 전용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Gemini 분석 설정 타입
 */
export interface GeminiAnalysisSettings {
  enabled: boolean // Gemini API 사용 여부
  fallback_to_heuristic: boolean // Gemini 실패 시 휴리스틱으로 폴백 여부
}

/**
 * 분석 설정 타입
 */
export interface AnalysisSettings {
  max_retries: number
  timeout_ms: number
  cache_ttl_hours: number
}

/**
 * 앱 설정 조회 (캐싱 포함)
 */
const settingsCache: Map<string, { value: unknown; timestamp: number }> = new Map()
const CACHE_TTL_MS = 60 * 1000 // 1분 캐시

async function getSettingWithCache<T>(key: string, defaultValue: T): Promise<T> {
  // 캐시 확인
  const cached = settingsCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.value as T
  }

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error || !data) {
      console.warn(`[AppSettings] Failed to fetch "${key}", using default:`, error?.message)
      return defaultValue
    }

    const value = data.value as T
    
    // 캐시 저장
    settingsCache.set(key, { value, timestamp: Date.now() })
    
    return value
  } catch (error) {
    console.error(`[AppSettings] Error fetching "${key}":`, error)
    return defaultValue
  }
}

/**
 * Gemini 분석 사용 여부 조회
 * @returns enabled=true면 Gemini API 사용, false면 휴리스틱 분석
 */
export async function getGeminiAnalysisSettings(): Promise<GeminiAnalysisSettings> {
  const defaultSettings: GeminiAnalysisSettings = {
    enabled: false, // 기본값: 휴리스틱 분석 사용
    fallback_to_heuristic: true,
  }

  return getSettingWithCache('use_gemini_analysis', defaultSettings)
}

/**
 * 분석 설정 조회
 */
export async function getAnalysisSettings(): Promise<AnalysisSettings> {
  const defaultSettings: AnalysisSettings = {
    max_retries: 3,
    timeout_ms: 30000,
    cache_ttl_hours: 24,
  }

  return getSettingWithCache('analysis_settings', defaultSettings)
}

/**
 * Gemini 분석 활성화 여부만 빠르게 확인
 */
export async function isGeminiEnabled(): Promise<boolean> {
  const settings = await getGeminiAnalysisSettings()
  return settings.enabled
}

/**
 * 설정 캐시 초기화 (테스트/디버깅용)
 */
export function clearSettingsCache(): void {
  settingsCache.clear()
}

