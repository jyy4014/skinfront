/**
 * useRequireAuth 훅 테스트
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRequireAuth } from '../useRequireAuth'
import { useAuth } from '../useAuth'
import { useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('../useAuth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('useRequireAuth', () => {
  let queryClient: QueryClient
  const mockPush = jest.fn()
  const mockReplace = jest.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    } as any)
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('인증된 사용자는 리다이렉트하지 않아야 함', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123' } as any,
      isAuthenticated: true,
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    const { result } = renderHook(() => useRequireAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('인증되지 않은 사용자는 로그인 페이지로 리다이렉트되어야 함', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    renderHook(() => useRequireAuth(), { wrapper })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/auth/login')
    }, { timeout: 3000 })
  })

  it('로딩 중일 때는 리다이렉트하지 않아야 함', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: true,
      error: null,
      refresh: jest.fn(),
    })

    renderHook(() => useRequireAuth(), { wrapper })

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled()
    })
  })

  it('커스텀 리다이렉트 경로를 사용할 수 있어야 함', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    renderHook(() => useRequireAuth({ redirectTo: '/custom-login' }), { wrapper })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/custom-login')
    }, { timeout: 3000 })
  })

  it('중복 리다이렉트를 방지해야 함', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    const { rerender } = renderHook(() => useRequireAuth(), { wrapper })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledTimes(1)
    })

    // 상태가 변경되어도 한 번만 리다이렉트
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      refresh: jest.fn(),
    })

    rerender()

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledTimes(1)
    })
  })
})

