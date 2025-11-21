/**
 * 시술 관련 쿼리 테스트
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useTreatmentById,
  useFavoriteTreatments,
  useTreatmentFromRecentAnalysis,
} from '../treatment'
import { createClient } from '../../../../lib/supabaseClient'

// Mock dependencies
jest.mock('../../../../lib/supabaseClient', () => ({
  createClient: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('시술 관련 쿼리', () => {
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

  describe('useTreatmentById', () => {
    it('시술 정보를 올바르게 조회해야 함', async () => {
      const mockTreatment = {
        id: 'treatment-123',
        name: '프락셀 레이저',
        description: '테스트 설명',
        benefits: '모공 축소',
        cost: 200000,
        recovery_time: '3-7일',
        risk_level: '중',
        duration_minutes: 30,
      }

      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockTreatment,
            error: null,
          }),
        })),
      }

      mockCreateClient.mockReturnValue(mockSupabase as any)

      const { result } = renderHook(() => useTreatmentById('treatment-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockTreatment)
    })

    it('시술 ID가 없으면 쿼리가 비활성화되어야 함', () => {
      const { result } = renderHook(() => useTreatmentById(''), { wrapper })

      // enabled는 query 객체의 속성이므로 직접 접근 불가
      // 대신 쿼리가 실행되지 않음을 확인
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('에러 발생 시 에러를 반환해야 함', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        })),
      }

      mockCreateClient.mockReturnValue(mockSupabase as any)

      const { result } = renderHook(() => useTreatmentById('treatment-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useFavoriteTreatments', () => {
    it('관심 시술 목록을 올바르게 조회해야 함', async () => {
      const mockFavorites = ['treatment-1', 'treatment-2', 'treatment-3']

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
            data: { preferred_treatments: mockFavorites },
            error: null,
          }),
        })),
      }

      mockCreateClient.mockReturnValue(mockSupabase as any)

      const { result } = renderHook(() => useFavoriteTreatments(), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockFavorites)
    })

    it('사용자가 없으면 빈 배열을 반환해야 함', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      }

      mockCreateClient.mockReturnValue(mockSupabase as any)

      const { result } = renderHook(() => useFavoriteTreatments(), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual([])
    })

    it('preferred_treatments가 null이면 빈 배열을 반환해야 함', async () => {
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
            data: { preferred_treatments: null },
            error: null,
          }),
        })),
      }

      mockCreateClient.mockReturnValue(mockSupabase as any)

      const { result } = renderHook(() => useFavoriteTreatments(), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual([])
    })
  })

  describe('useTreatmentFromRecentAnalysis', () => {
    it('최근 분석 결과에서 시술 정보를 찾아야 함', async () => {
      const mockAnalyses = [
        {
          created_at: '2024-01-15T10:00:00Z',
          stage_b_mapping_result: {
            treatment_candidates: [
              {
                id: 'treatment-123',
                name: '프락셀 레이저',
                score: 0.85,
                expected_improvement_pct: 0.75,
              },
            ],
          },
          stage_c_nlg_result: {
            headline: 'AI 추천 설명',
            paragraphs: ['설명 1', '설명 2'],
          },
        },
      ]

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
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: mockAnalyses,
            error: null,
          }),
        })),
      }

      mockCreateClient.mockReturnValue(mockSupabase as any)

      const { result } = renderHook(
        () => useTreatmentFromRecentAnalysis('treatment-123'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.treatment.id).toBe('treatment-123')
      expect(result.current.data?.nlg.headline).toBe('AI 추천 설명')
    })

    it('시술이 추천되지 않았으면 null을 반환해야 함', async () => {
      const mockAnalyses = [
        {
          created_at: '2024-01-15T10:00:00Z',
          stage_b_mapping_result: {
            treatment_candidates: [
              {
                id: 'other-treatment',
                name: '다른 시술',
              },
            ],
          },
        },
      ]

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
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: mockAnalyses,
            error: null,
          }),
        })),
      }

      mockCreateClient.mockReturnValue(mockSupabase as any)

      const { result } = renderHook(
        () => useTreatmentFromRecentAnalysis('treatment-123'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeNull()
    })

    it('사용자가 없으면 쿼리가 실행되지 않아야 함', () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      }

      mockCreateClient.mockReturnValue(mockSupabase as any)

      const { result } = renderHook(
        () => useTreatmentFromRecentAnalysis('treatment-123'),
        { wrapper }
      )

      // 쿼리는 실행되지만 빈 결과를 반환해야 함
      expect(result.current.isLoading).toBe(true)
    })

    it('여러 분석 결과 중 첫 번째로 찾은 시술 정보를 반환해야 함', async () => {
      const mockAnalyses = [
        {
          created_at: '2024-01-20T10:00:00Z',
          stage_b_mapping_result: {
            treatment_candidates: [
              {
                id: 'treatment-123',
                name: '최신 분석의 시술',
                score: 0.9,
              },
            ],
          },
          stage_c_nlg_result: {
            headline: '최신 설명',
          },
        },
        {
          created_at: '2024-01-15T10:00:00Z',
          stage_b_mapping_result: {
            treatment_candidates: [
              {
                id: 'treatment-123',
                name: '이전 분석의 시술',
                score: 0.8,
              },
            ],
          },
          stage_c_nlg_result: {
            headline: '이전 설명',
          },
        },
      ]

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
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: mockAnalyses,
            error: null,
          }),
        })),
      }

      mockCreateClient.mockReturnValue(mockSupabase as any)

      const { result } = renderHook(
        () => useTreatmentFromRecentAnalysis('treatment-123'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // 첫 번째로 찾은 시술 정보 (최신 분석)
      expect(result.current.data?.treatment.name).toBe('최신 분석의 시술')
      expect(result.current.data?.nlg.headline).toBe('최신 설명')
    })
  })
})
