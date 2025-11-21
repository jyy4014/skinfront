/**
 * 사용자 설정 뮤테이션 테스트
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUpdateUserSettings } from '../user-settings'
import { createClient } from '../../../../lib/supabaseClient'

// Mock dependencies
jest.mock('../../../../lib/supabaseClient', () => ({
  createClient: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('useUpdateUserSettings', () => {
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

  it('알림 설정을 업데이트해야 함', async () => {
    const mockUpdate = jest.fn(() => ({
      eq: jest.fn().mockResolvedValue({ error: null }),
    }))
    const mockFrom = jest.fn(() => ({
      update: mockUpdate,
    }))
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: mockFrom,
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useUpdateUserSettings(), { wrapper })

    await waitFor(async () => {
      const settings = await result.current.updateSettings({ notification_enabled: true })
      expect(settings.notification_enabled).toBe(true)
    })

    expect(mockFrom).toHaveBeenCalledWith('users')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        notification_enabled: true,
        updated_at: expect.any(String),
      })
    )
  })

  it('자동 삭제 설정을 업데이트해야 함', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useUpdateUserSettings(), { wrapper })

    await waitFor(async () => {
      const settings = await result.current.updateSettings({ auto_delete_images: true })
      expect(settings.auto_delete_images).toBe(true)
    })
  })

  it('언어 설정을 업데이트해야 함', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useUpdateUserSettings(), { wrapper })

    await waitFor(async () => {
      const settings = await result.current.updateSettings({ language: 'en' })
      expect(settings.language).toBe('en')
    })
  })

  it('여러 설정을 동시에 업데이트해야 함', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useUpdateUserSettings(), { wrapper })

    await waitFor(async () => {
      const settings = await result.current.updateSettings({
        notification_enabled: true,
        auto_delete_images: false,
        language: 'ko',
      })
      expect(settings.notification_enabled).toBe(true)
      expect(settings.auto_delete_images).toBe(false)
      expect(settings.language).toBe('ko')
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

    const { result } = renderHook(() => useUpdateUserSettings(), { wrapper })

    await waitFor(async () => {
      await expect(
        result.current.updateSettings({ notification_enabled: true })
      ).rejects.toThrow('로그인이 필요합니다.')
    })
  })

  it('업데이트 실패 시 에러를 던져야 함', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Update failed' },
          }),
        })),
      })),
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useUpdateUserSettings(), { wrapper })

    await waitFor(async () => {
      await expect(
        result.current.updateSettings({ notification_enabled: true })
      ).rejects.toMatchObject({ message: 'Update failed' })
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
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }

    mockCreateClient.mockReturnValue(mockSupabase as any)

    const { result } = renderHook(() => useUpdateUserSettings(), { wrapper })

    await waitFor(async () => {
      await result.current.updateSettings({ notification_enabled: true })
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['user', 'profile'],
      })
    })
  })
})

