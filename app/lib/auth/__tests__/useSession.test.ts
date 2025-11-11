/**
 * TDD: 세션 관리 훅 테스트
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from '../hooks/useSession'

// Supabase 클라이언트 모킹
const mockCreateClient = jest.fn()
jest.mock('../../supabaseClient', () => ({
  createClient: () => mockCreateClient(),
}))

describe('useSession', () => {
  const mockSupabase = {
    auth: {
      getSession: jest.fn(),
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

  it('세션을 올바르게 가져와야 함', async () => {
    const mockSession = {
      access_token: 'token123',
      user: { id: 'user123' },
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })

    const { result } = renderHook(() => useSession())

    await waitFor(() => {
      expect(result.current.session).toEqual(mockSession)
      expect(result.current.accessToken).toBe('token123')
      expect(result.current.loading).toBe(false)
    })
  })

  it('세션이 없는 경우 올바르게 처리해야 함', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    const { result } = renderHook(() => useSession())

    await waitFor(() => {
      expect(result.current.session).toBeNull()
      expect(result.current.accessToken).toBeNull()
      expect(result.current.loading).toBe(false)
    })
  })
})

