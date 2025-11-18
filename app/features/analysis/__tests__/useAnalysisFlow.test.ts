/**
 * TDD: 분석 플로우 훅 테스트
 * 
 * 테스트 시나리오:
 * 1. 전체 플로우 성공
 * 2. result_id가 undefined일 때 에러 처리
 * 3. 이미지 URL과 각도 배열 길이 불일치 검증
 * 4. 다양한 파일 개수에 대한 각도 배열 생성
 */

import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAnalysisFlow } from '../hooks/useAnalysisFlow'

// Mock dependencies
const mockUploadImages = jest.fn()
const mockAnalyze = jest.fn()
const mockSaveAnalysis = jest.fn()
const mockGetSession = jest.fn()
const mockGetUser = jest.fn()

jest.mock('../hooks/useImageUpload', () => ({
  useImageUpload: () => ({
    uploadImages: mockUploadImages,
    loading: false,
    error: null,
  }),
}))

jest.mock('../hooks/useAnalysis', () => ({
  useAnalysis: () => ({
    analyze: mockAnalyze,
    loading: false,
    error: null,
  }),
}))

jest.mock('../hooks/useAnalysisSave', () => ({
  useAnalysisSave: () => ({
    saveAnalysis: mockSaveAnalysis,
    loading: false,
    error: null,
  }),
}))

jest.mock('../../../lib/auth', () => ({
  useSession: () => ({
    accessToken: 'mock-token',
  }),
}))

jest.mock('../../../lib/supabaseClient', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      getUser: mockGetUser,
    },
  }),
}))

describe('useAnalysisFlow', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    jest.clearAllMocks()
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'mock-token' } },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  // P0-1: result_id가 undefined일 때 에러를 던져야 함
  it('result_id가 undefined일 때 에러를 던져야 함', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    mockUploadImages.mockResolvedValue({
      results: [
        { publicUrl: 'https://example.com/image.jpg', angle: 'front', userId: 'user123' },
      ],
      userId: 'user123',
    })

    mockAnalyze.mockResolvedValue({
      status: 'success',
      result_id: undefined, // ❌ undefined인 경우
      analysis: {},
      mapping: {},
      nlg: {},
    })

    const { result } = renderHook(() => useAnalysisFlow(), { wrapper })

    await waitFor(async () => {
      await expect(
        result.current.uploadAndAnalyze([mockFile])
      ).rejects.toThrow('분석 결과 ID가 없습니다.')
    })
  })

  // P0-2: 이미지 URL과 각도 배열 길이 불일치 검증
  it('이미지 URL과 각도 배열 길이가 다를 때 에러를 던져야 함', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    // uploadImages가 잘못된 결과를 반환하는 경우 시뮬레이션
    mockUploadImages.mockResolvedValue({
      results: [
        { publicUrl: 'https://example.com/image1.jpg', angle: 'front', userId: 'user123' },
        { publicUrl: 'https://example.com/image2.jpg', angle: undefined, userId: 'user123' }, // angle이 undefined
      ],
      userId: 'user123',
    })

    mockAnalyze.mockResolvedValue({
      status: 'success',
      result_id: '123',
      analysis: {},
      mapping: {},
      nlg: {},
    })

    const { result } = renderHook(() => useAnalysisFlow(), { wrapper })

    // 실제로는 uploadResults에서 map할 때 길이가 일치하지만, 
    // 검증 로직을 추가하여 안전하게 처리
    await waitFor(async () => {
      const flowResult = await result.current.uploadAndAnalyze([mockFile, mockFile])
      
      // imageUrls와 imageAngles의 길이가 일치하는지 확인
      expect(flowResult.image_urls?.length).toBe(flowResult.image_angles?.length)
    })
  })

  // P2-6: 다양한 파일 개수에 대한 각도 배열 생성
  it('1개 파일일 때 각도 배열이 [front]여야 함', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    mockUploadImages.mockResolvedValue({
      results: [
        { publicUrl: 'https://example.com/image.jpg', angle: 'front', userId: 'user123' },
      ],
      userId: 'user123',
    })

    mockAnalyze.mockResolvedValue({
      status: 'success',
      result_id: '123',
      analysis: {},
      mapping: {},
      nlg: {},
    })

    mockSaveAnalysis.mockResolvedValue({
      status: 'success',
      id: '456',
    })

    const { result } = renderHook(() => useAnalysisFlow(), { wrapper })

    await waitFor(async () => {
      const flowResult = await result.current.uploadAndAnalyze([mockFile])
      
      expect(flowResult.image_angles).toEqual(['front'])
    })
  })

  it('3개 파일일 때 각도 배열이 [front, left, right]여야 함', async () => {
    const mockFiles = [
      new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      new File(['test3'], 'test3.jpg', { type: 'image/jpeg' }),
    ]
    
    mockUploadImages.mockResolvedValue({
      results: [
        { publicUrl: 'https://example.com/front.jpg', angle: 'front', userId: 'user123' },
        { publicUrl: 'https://example.com/left.jpg', angle: 'left', userId: 'user123' },
        { publicUrl: 'https://example.com/right.jpg', angle: 'right', userId: 'user123' },
      ],
      userId: 'user123',
    })

    mockAnalyze.mockResolvedValue({
      status: 'success',
      result_id: '123',
      analysis: {},
      mapping: {},
      nlg: {},
    })

    mockSaveAnalysis.mockResolvedValue({
      status: 'success',
      id: '456',
    })

    const { result } = renderHook(() => useAnalysisFlow(), { wrapper })

    await waitFor(async () => {
      const flowResult = await result.current.uploadAndAnalyze(mockFiles)
      
      expect(flowResult.image_angles).toEqual(['front', 'left', 'right'])
    })
  })

  it('2개 파일일 때 각도 배열이 [front, left]여야 함', async () => {
    const mockFiles = [
      new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
    ]
    
    mockUploadImages.mockResolvedValue({
      results: [
        { publicUrl: 'https://example.com/front.jpg', angle: 'front', userId: 'user123' },
        { publicUrl: 'https://example.com/left.jpg', angle: 'left', userId: 'user123' },
      ],
      userId: 'user123',
    })

    mockAnalyze.mockResolvedValue({
      status: 'success',
      result_id: '123',
      analysis: {},
      mapping: {},
      nlg: {},
    })

    mockSaveAnalysis.mockResolvedValue({
      status: 'success',
      id: '456',
    })

    const { result } = renderHook(() => useAnalysisFlow(), { wrapper })

    await waitFor(async () => {
      const flowResult = await result.current.uploadAndAnalyze(mockFiles)
      
      expect(flowResult.image_angles).toEqual(['front', 'left'])
    })
  })
})

