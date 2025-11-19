/**
 * TDD: useImageQuality 훅 엄격 테스트
 * 
 * 테스트 범위:
 * 1. checkQuality 함수 동작
 * 2. 상태 관리 (checking, error, lastResult)
 * 3. 에러 처리
 * 4. 엣지 케이스
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useImageQuality } from '../useImageQuality'
import { checkImageQualityComprehensive } from '../../lib/image/quality-check'

// Mock checkImageQualityComprehensive
jest.mock('../../lib/image/quality-check', () => ({
  checkImageQualityComprehensive: jest.fn(),
  getQualityMessage: jest.fn(),
}))

const mockCheckImageQualityComprehensive = checkImageQualityComprehensive as jest.MockedFunction<
  typeof checkImageQualityComprehensive
>

describe('useImageQuality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('기본 동작', () => {
    it('초기 상태가 올바르게 설정되어야 함', () => {
      const { result } = renderHook(() => useImageQuality())

      expect(result.current.checking).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.lastResult).toBe(null)
      expect(typeof result.current.checkQuality).toBe('function')
    })

    it('checkQuality 함수가 존재해야 함', () => {
      const { result } = renderHook(() => useImageQuality())

      expect(result.current.checkQuality).toBeDefined()
      expect(typeof result.current.checkQuality).toBe('function')
    })
  })

  describe('checkQuality 실행', () => {
    it('품질 검사가 성공하면 결과를 반환해야 함', async () => {
      const mockResult = {
        overallScore: 85,
        sharpness: 90,
        brightness: 80,
        angle: 85,
        issues: [],
        recommendations: [],
        isGood: true,
      }

      mockCheckImageQualityComprehensive.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useImageQuality())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      let qualityResult: any
      await act(async () => {
        qualityResult = await result.current.checkQuality(file)
      })

      expect(qualityResult).toEqual(mockResult)
      expect(result.current.lastResult).toEqual(mockResult)
      expect(result.current.checking).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('품질 검사 중 checking 상태가 true여야 함', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockCheckImageQualityComprehensive.mockReturnValue(promise as any)

      const { result } = renderHook(() => useImageQuality())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      act(() => {
        result.current.checkQuality(file)
      })

      expect(result.current.checking).toBe(true)

      await act(async () => {
        resolvePromise!({
          overallScore: 80,
          sharpness: 80,
          brightness: 80,
          angle: 80,
          issues: [],
          recommendations: [],
          isGood: true,
        })
        await promise
      })

      await waitFor(() => {
        expect(result.current.checking).toBe(false)
      })
    })

    it('품질 검사 완료 후 checking 상태가 false여야 함', async () => {
      const mockResult = {
        overallScore: 70,
        sharpness: 70,
        brightness: 70,
        angle: 70,
        issues: [],
        recommendations: [],
        isGood: true,
      }

      mockCheckImageQualityComprehensive.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useImageQuality())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        await result.current.checkQuality(file)
      })

      expect(result.current.checking).toBe(false)
    })
  })

  describe('에러 처리', () => {
    it('품질 검사 실패 시 에러를 설정해야 함', async () => {
      const error = new Error('품질 검사 실패')
      mockCheckImageQualityComprehensive.mockRejectedValue(error)

      const { result } = renderHook(() => useImageQuality())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        try {
          await result.current.checkQuality(file)
        } catch (e) {
          // 에러는 throw되어야 함
        }
      })

      expect(result.current.error).toBe('품질 검사 실패')
      expect(result.current.checking).toBe(false)
      expect(result.current.lastResult).toBe(null)
    })

    it('에러 메시지가 없으면 기본 메시지를 사용해야 함', async () => {
      const error = new Error('')
      mockCheckImageQualityComprehensive.mockRejectedValue(error)

      const { result } = renderHook(() => useImageQuality())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        try {
          await result.current.checkQuality(file)
        } catch (e) {
          // 에러는 throw되어야 함
        }
      })

      expect(result.current.error).toBe('이미지 품질 검사 중 오류가 발생했습니다.')
    })

    it('에러 객체가 아닌 경우도 처리해야 함', async () => {
      mockCheckImageQualityComprehensive.mockRejectedValue('문자열 에러')

      const { result } = renderHook(() => useImageQuality())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        try {
          await result.current.checkQuality(file)
        } catch (e) {
          // 에러는 throw되어야 함
        }
      })

      expect(result.current.error).toBe('이미지 품질 검사 중 오류가 발생했습니다.')
    })

    it('에러 발생 후에도 checking 상태가 false여야 함', async () => {
      const error = new Error('에러 발생')
      mockCheckImageQualityComprehensive.mockRejectedValue(error)

      const { result } = renderHook(() => useImageQuality())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        try {
          await result.current.checkQuality(file)
        } catch (e) {
          // 에러는 throw되어야 함
        }
      })

      expect(result.current.checking).toBe(false)
    })
  })

  describe('lastResult 관리', () => {
    it('성공한 검사 결과가 lastResult에 저장되어야 함', async () => {
      const mockResult1 = {
        overallScore: 80,
        sharpness: 80,
        brightness: 80,
        angle: 80,
        issues: [],
        recommendations: [],
        isGood: true,
      }

      mockCheckImageQualityComprehensive.mockResolvedValue(mockResult1)

      const { result } = renderHook(() => useImageQuality())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        await result.current.checkQuality(file)
      })

      expect(result.current.lastResult).toEqual(mockResult1)
    })

    it('새로운 검사 결과가 이전 결과를 덮어써야 함', async () => {
      const mockResult1 = {
        overallScore: 80,
        sharpness: 80,
        brightness: 80,
        angle: 80,
        issues: [],
        recommendations: [],
        isGood: true,
      }

      const mockResult2 = {
        overallScore: 90,
        sharpness: 90,
        brightness: 90,
        angle: 90,
        issues: [],
        recommendations: [],
        isGood: true,
      }

      mockCheckImageQualityComprehensive
        .mockResolvedValueOnce(mockResult1)
        .mockResolvedValueOnce(mockResult2)

      const { result } = renderHook(() => useImageQuality())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        await result.current.checkQuality(file)
      })

      expect(result.current.lastResult).toEqual(mockResult1)

      await act(async () => {
        await result.current.checkQuality(file)
      })

      expect(result.current.lastResult).toEqual(mockResult2)
    })

    it('에러 발생 시 lastResult가 변경되지 않아야 함', async () => {
      const mockResult = {
        overallScore: 80,
        sharpness: 80,
        brightness: 80,
        angle: 80,
        issues: [],
        recommendations: [],
        isGood: true,
      }

      mockCheckImageQualityComprehensive
        .mockResolvedValueOnce(mockResult)
        .mockRejectedValueOnce(new Error('에러'))

      const { result } = renderHook(() => useImageQuality())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        await result.current.checkQuality(file)
      })

      expect(result.current.lastResult).toEqual(mockResult)

      await act(async () => {
        try {
          await result.current.checkQuality(file)
        } catch (e) {
          // 에러는 throw되어야 함
        }
      })

      expect(result.current.lastResult).toEqual(mockResult) // 이전 결과 유지
    })
  })

  describe('옵션 전달', () => {
    it('옵션을 checkImageQualityComprehensive에 전달해야 함', async () => {
      const mockResult = {
        overallScore: 80,
        sharpness: 80,
        brightness: 80,
        angle: 80,
        issues: [],
        recommendations: [],
        isGood: true,
      }

      mockCheckImageQualityComprehensive.mockResolvedValue(mockResult)

      const { result } = renderHook(() =>
        useImageQuality({
          minScore: 70,
          checkSharpness: false,
          checkBrightness: true,
          checkAngle: true,
        })
      )

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        await result.current.checkQuality(file)
      })

      expect(mockCheckImageQualityComprehensive).toHaveBeenCalledWith(file, {
        minScore: 70,
        checkSharpness: false,
        checkBrightness: true,
        checkAngle: true,
      })
    })

    it('옵션이 없으면 기본값을 사용해야 함', async () => {
      const mockResult = {
        overallScore: 80,
        sharpness: 80,
        brightness: 80,
        angle: 80,
        issues: [],
        recommendations: [],
        isGood: true,
      }

      mockCheckImageQualityComprehensive.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useImageQuality())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        await result.current.checkQuality(file)
      })

      expect(mockCheckImageQualityComprehensive).toHaveBeenCalledWith(file, {})
    })
  })

  describe('엣지 케이스', () => {
    it('빈 파일도 처리할 수 있어야 함', async () => {
      const mockResult = {
        overallScore: 50,
        sharpness: 50,
        brightness: 50,
        angle: 50,
        issues: ['문제점'],
        recommendations: ['권장사항'],
        isGood: false,
      }

      mockCheckImageQualityComprehensive.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useImageQuality())
      const file = new File([], 'empty.jpg', { type: 'image/jpeg' })

      await act(async () => {
        await result.current.checkQuality(file)
      })

      expect(result.current.lastResult).toEqual(mockResult)
    })

    it('연속으로 여러 번 호출해도 정상 작동해야 함', async () => {
      const mockResult = {
        overallScore: 80,
        sharpness: 80,
        brightness: 80,
        angle: 80,
        issues: [],
        recommendations: [],
        isGood: true,
      }

      mockCheckImageQualityComprehensive.mockResolvedValue(mockResult)

      const { result } = renderHook(() => useImageQuality())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        await Promise.all([
          result.current.checkQuality(file),
          result.current.checkQuality(file),
          result.current.checkQuality(file),
        ])
      })

      expect(mockCheckImageQualityComprehensive).toHaveBeenCalledTimes(3)
      expect(result.current.lastResult).toEqual(mockResult)
    })
  })
})

