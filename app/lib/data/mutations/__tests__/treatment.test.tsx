/**
 * 시술 관련 뮤테이션 테스트
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useToggleFavoriteTreatment } from '../treatment'
import { createClient } from '../../../../lib/supabaseClient'

// Mock dependencies
jest.mock('../../../../lib/supabaseClient', () => ({
  createClient: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('useToggleFavoriteTreatment', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    jest.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('관심 시술을 등록해야 함', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({ error: null })
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { preferred_treatments: [] },
          error: null,
        }),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useToggleFavoriteTreatment(), { wrapper })

    await waitFor(async () => {
      const response = await result.current.toggleFavorite('treatment-123')
      expect(response.isFavorite).toBe(true)
      expect(response.treatmentId).toBe('treatment-123')
      expect(response.favorites).toContain('treatment-123')
    })
  })

  it('관심 시술을 해제해야 함', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { preferred_treatments: ['treatment-123'] },
          error: null,
        }),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useToggleFavoriteTreatment(), { wrapper })

    await waitFor(async () => {
      const response = await result.current.toggleFavorite('treatment-123')
      expect(response.isFavorite).toBe(false)
      expect(response.treatmentId).toBe('treatment-123')
      expect(response.favorites).not.toContain('treatment-123')
    })
  })

  it('사용자가 없으면 에러를 던져야 함', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useToggleFavoriteTreatment(), { wrapper })

    await waitFor(async () => {
      await expect(result.current.toggleFavorite('treatment-123')).rejects.toThrow(
        '사용자를 찾을 수 없습니다.'
      )
    })
  })

  it('성공 시 프로필 쿼리를 무효화해야 함', async () => {
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries')
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { preferred_treatments: [] },
          error: null,
        }),
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useToggleFavoriteTreatment(), { wrapper })

    await waitFor(async () => {
      await result.current.toggleFavorite('treatment-123')
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['user', 'profile'],
      })
    })
  })

  it('여러 시술을 등록할 수 있어야 함', async () => {
    let currentFavorites: string[] = []
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() =>
          Promise.resolve({
            data: { preferred_treatments: currentFavorites },
            error: null,
          })
        ),
        update: jest.fn(() => ({
          eq: jest.fn().mockImplementation(() => {
            return Promise.resolve({ error: null })
          }),
        })),
      })),
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useToggleFavoriteTreatment(), { wrapper })

    // 첫 번째 시술 등록
    await waitFor(async () => {
      const response1 = await result.current.toggleFavorite('treatment-1')
      expect(response1.favorites).toContain('treatment-1')
      currentFavorites = ['treatment-1']
    })

    // 두 번째 시술 등록
    await waitFor(async () => {
      const response2 = await result.current.toggleFavorite('treatment-2')
      expect(response2.favorites).toContain('treatment-1')
      expect(response2.favorites).toContain('treatment-2')
    })
  })
})
