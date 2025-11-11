/**
 * TDD: 이미지 업로드 훅 테스트
 * 
 * 테스트 시나리오:
 * 1. 이미지 업로드 성공
 * 2. 업로드 진행도 추적
 * 3. 업로드 에러 처리
 * 4. 인증 실패 처리
 */

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { useImageUpload } from '../hooks/useImageUpload'

const mockCreateClient = jest.fn()
jest.mock('../../../lib/supabaseClient', () => ({
  createClient: () => mockCreateClient(),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('useImageUpload', () => {
  let queryClient: QueryClient
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: 'https://example.com/image.jpg' },
        })),
      })),
    },
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabase)
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  it('이미지를 올바르게 업로드해야 함', async () => {
    const mockUser = { id: 'user123' }
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const uploadMock = jest.fn().mockResolvedValue({ error: null })
    const storageMock = {
      upload: uploadMock,
      getPublicUrl: jest.fn(() => ({
        data: { publicUrl: 'https://example.com/image.jpg' },
      })),
    }
    mockSupabase.storage.from.mockReturnValue(storageMock)

    const { result } = renderHook(() => useImageUpload(), { wrapper })

    await waitFor(async () => {
      const uploadResult = await result.current.uploadImage(mockFile, {})
      expect(uploadResult.publicUrl).toBe('https://example.com/image.jpg')
      expect(uploadResult.userId).toBe('user123')
    }, { timeout: 5000 })
  })

  it('업로드 진행도를 추적해야 함', async () => {
    const mockUser = { id: 'user123' }
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const onProgress = jest.fn()

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const uploadMock = jest.fn().mockResolvedValue({ error: null })
    const storageMock = {
      upload: uploadMock,
      getPublicUrl: jest.fn(() => ({
        data: { publicUrl: 'https://example.com/image.jpg' },
      })),
    }
    mockSupabase.storage.from.mockReturnValue(storageMock)

    const { result } = renderHook(() => useImageUpload(), { wrapper })

    await waitFor(async () => {
      await result.current.uploadImage(mockFile, { onProgress })
      expect(onProgress).toHaveBeenCalled()
    })
  })

  it('인증 실패 시 에러를 던져야 함', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const { result } = renderHook(() => useImageUpload(), { wrapper })

    await waitFor(async () => {
      await expect(result.current.uploadImage(mockFile)).rejects.toThrow('인증')
    })
  })
})

