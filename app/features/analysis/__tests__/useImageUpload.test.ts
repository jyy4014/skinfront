/**
 * TDD: 이미지 업로드 훅 테스트
 * 
 * 테스트 시나리오:
 * 1. 단일 이미지 업로드 성공
 * 2. 여러 이미지 업로드 성공
 * 3. 타임스탬프 중복 방지 확인
 */

import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useImageUpload } from '../hooks/useImageUpload'

// Mock Supabase
const mockUpload = jest.fn()
const mockGetPublicUrl = jest.fn()
const mockGetUser = jest.fn()

jest.mock('../../../lib/supabaseClient', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('useImageUpload', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user123' } },
    })
    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/image.jpg' },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  // P1-3: 타임스탬프 중복 방지 확인
  it('여러 이미지 업로드 시 파일명에 랜덤 서픽스가 포함되어야 함', async () => {
    const mockFiles = [
      new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
    ]

    const { result } = renderHook(() => useImageUpload(), { wrapper })

    await waitFor(async () => {
      await result.current.uploadImages(mockFiles, {
        angles: ['front', 'left'],
      })

      // upload가 호출된 횟수 확인
      expect(mockUpload).toHaveBeenCalledTimes(2)

      // UPDATE 방식: 고정 경로 사용
      const firstFileName = mockUpload.mock.calls[0][0] as string
      const secondFileName = mockUpload.mock.calls[1][0] as string

      // 파일명이 고정 경로인지 확인 (UPDATE 방식)
      expect(firstFileName).toMatch(/user123\/original\/front\.jpg/)
      expect(secondFileName).toMatch(/user123\/original\/left\.jpg/)
      expect(secondFileName).toMatch(/user123\/\d+-\d+-[a-z0-9]{7}-left\.jpg/)
    })
  })

  it('단일 이미지 업로드 성공', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    const { result } = renderHook(() => useImageUpload(), { wrapper })

    await waitFor(async () => {
      const uploadResult = await result.current.uploadImage(mockFile)

      expect(uploadResult.publicUrl).toBe('https://example.com/image.jpg')
      expect(mockUpload).toHaveBeenCalledTimes(1)
    })
  })

  it('여러 이미지 업로드 성공', async () => {
    const mockFiles = [
      new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
    ]

    const { result } = renderHook(() => useImageUpload(), { wrapper })

    await waitFor(async () => {
      const uploadResult = await result.current.uploadImages(mockFiles, {
        angles: ['front', 'left'],
      })

      expect(uploadResult.results).toHaveLength(2)
      expect(mockUpload).toHaveBeenCalledTimes(2)
    })
  })
})
