/**
 * 환경 변수 타입 안전 접근
 */

/**
 * 환경 변수 타입 정의
 */
export interface EnvConfig {
  supabase: {
    url: string
    anonKey: string
  }
}

/**
 * 환경 변수 설정 가져오기
 */
export function getEnvConfig(): EnvConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.'
    )
  }
  
  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    },
  }
}

/**
 * 환경 변수 설정 (싱글톤)
 */
let envConfig: EnvConfig | null = null

/**
 * 환경 변수 설정 가져오기 (캐시된 버전)
 */
export function getEnv(): EnvConfig {
  if (!envConfig) {
    envConfig = getEnvConfig()
  }
  return envConfig
}

/**
 * Supabase URL 가져오기
 */
export function getSupabaseUrl(): string {
  return getEnv().supabase.url
}

/**
 * Supabase Anon Key 가져오기
 */
export function getSupabaseAnonKey(): string {
  return getEnv().supabase.anonKey
}

