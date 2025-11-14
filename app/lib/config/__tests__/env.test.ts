/**
 * 환경 변수 모듈 테스트
 */

describe('env', () => {
  // 각 테스트마다 모듈을 새로 로드하여 캐시 문제 방지
  let getEnv: () => any
  let getSupabaseUrl: () => string
  let getSupabaseAnonKey: () => string
  let resetEnv: () => void

  beforeEach(() => {
    jest.resetModules()
    const envModule = require('../env')
    getEnv = envModule.getEnv
    getSupabaseUrl = envModule.getSupabaseUrl
    getSupabaseAnonKey = envModule.getSupabaseAnonKey
    resetEnv = envModule.resetEnv
    resetEnv() // 캐시 초기화
  })

  describe('getEnv', () => {
    it('환경 변수가 모두 설정되어 있으면 설정 객체를 반환해야 함', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
      
      const env = getEnv()

      expect(env).toEqual({
        supabase: {
          url: 'https://test.supabase.co',
          anonKey: 'test-anon-key',
        },
      })
    })

    it('환경 변수가 없으면 에러를 던져야 함', () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      expect(() => getEnv()).toThrow('Missing Supabase environment variables')
      
      // 원래 값 복원
      if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
      if (originalKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
    })
  })

  describe('getSupabaseUrl', () => {
    it('Supabase URL을 반환해야 함', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

      const url = getSupabaseUrl()

      expect(url).toBe('https://test.supabase.co')
    })
  })

  describe('getSupabaseAnonKey', () => {
    it('Supabase Anon Key를 반환해야 함', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

      const key = getSupabaseAnonKey()

      expect(key).toBe('test-anon-key')
    })
  })
})

