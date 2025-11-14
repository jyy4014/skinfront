/**
 * 환경 변수 타입 안전 접근
 * 
 * 모든 환경 변수는 이 모듈을 통해 접근하여 타입 안전성과 일관성을 보장합니다.
 */

/**
 * 필수 환경 변수 목록
 */
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

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
 * 환경 변수 검증
 * @throws {Error} 필수 환경 변수가 없을 경우
 */
function validateEnv(): void {
  const missing: string[] = []
  
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please set these variables in your .env.local file.'
    )
  }
}

/**
 * 환경 변수 설정 가져오기
 * @returns 타입 안전한 환경 변수 설정
 * @throws {Error} 필수 환경 변수가 없을 경우
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
 * 앱 시작 시 한 번만 초기화됩니다.
 */
let envConfig: EnvConfig | null = null

/**
 * 환경 변수 설정 가져오기 (캐시된 버전)
 * @returns 타입 안전한 환경 변수 설정
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

/**
 * 환경 변수 설정 초기화 (테스트용)
 * @internal
 */
export function resetEnv(): void {
  envConfig = null
}

