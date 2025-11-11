/**
 * TDD: 인증 모듈 테스트
 * 
 * 테스트 시나리오:
 * 1. 사용자 정보 가져오기
 * 2. 인증되지 않은 경우 처리
 * 3. 세션 가져오기
 * 4. 로그아웃
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useAuth } from '../hooks/useAuth'

// Supabase 클라이언트 모킹
const mockCreateClient = jest.fn()
jest.mock('../../supabaseClient', () => ({
  createClient: () => mockCreateClient(),
}))

describe('useAuth', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabase)
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
  })

  it('사용자 정보를 올바르게 가져와야 함', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.auth.onAuthStateChange = jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    }))

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.loading).toBe(false)
    })
  })

  it('인증되지 않은 경우 올바르게 처리해야 함', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    mockSupabase.auth.onAuthStateChange = jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    }))

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.loading).toBe(false)
    })
  })

  it('로딩 상태를 올바르게 관리해야 함', async () => {
    let resolveGetUser: (value: any) => void
    const getUserPromise = new Promise((resolve) => {
      resolveGetUser = resolve
    })

    mockSupabase.auth.getUser.mockReturnValue(getUserPromise)
    mockSupabase.auth.onAuthStateChange = jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    }))

    const { result } = renderHook(() => useAuth())

    // 초기에는 로딩 상태
    expect(result.current.loading).toBe(true)

    // 사용자 정보 반환
    await act(async () => {
      resolveGetUser!({
        data: { user: { id: 'user123' } },
        error: null,
      })
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })
})

