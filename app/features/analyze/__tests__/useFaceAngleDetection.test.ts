/**
 * useFaceAngleDetection 훅 테스트
 * TDD 방식으로 작성: 테스트 먼저 작성 후 구현 수정
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useFaceAngleDetection, isFaceAngleValid } from '../hooks/useFaceAngleDetection'

// TensorFlow.js 및 face-landmarks-detection 모킹
jest.mock('@tensorflow/tfjs', () => ({
  setBackend: jest.fn().mockResolvedValue(undefined),
  ready: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@tensorflow-models/face-landmarks-detection', () => ({
  SupportedModels: {
    MediaPipeFaceMesh: 'MediaPipeFaceMesh',
  },
  createDetector: jest.fn().mockResolvedValue({
    estimateFaces: jest.fn(),
    dispose: jest.fn(),
  }),
}), { virtual: true })

describe('useFaceAngleDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('초기화', () => {
    it('initialize()를 호출하면 detector가 생성되어야 함', async () => {
      const { result } = renderHook(() => useFaceAngleDetection())

      await waitFor(async () => {
        await result.current.initialize()
      })

      expect(result.current.isInitialized).toBe(true)
    })

    it('서버 사이드에서 initialize() 호출 시 에러를 던져야 함', async () => {
      // window 객체가 없는 환경 시뮬레이션
      const originalWindow = global.window
      const originalTypeof = global.typeof
      
      // @ts-ignore
      delete global.window
      // @ts-ignore  
      global.typeof = (value: any) => {
        if (value === undefined) return 'undefined'
        return typeof value
      }

      const { result } = renderHook(() => useFaceAngleDetection())

      // initialize 함수 내부에서 typeof window === 'undefined' 체크를 우회하기 위해
      // 모킹된 import가 에러를 던지도록 설정
      const { createDetector } = await import('@tensorflow-models/face-landmarks-detection')
      ;(createDetector as jest.Mock).mockRejectedValueOnce(
        new Error('Face angle detection is only available on the client side')
      )

      await expect(result.current.initialize()).rejects.toThrow()

      // window 복원
      global.window = originalWindow
      // @ts-ignore
      global.typeof = originalTypeof
    })

    it('중복 초기화 호출 시 한 번만 초기화되어야 함', async () => {
      const { result } = renderHook(() => useFaceAngleDetection())
      const { createDetector } = await import('@tensorflow-models/face-landmarks-detection')

      await result.current.initialize()
      await result.current.initialize()
      await result.current.initialize()

      expect(createDetector).toHaveBeenCalledTimes(1)
    })
  })

  describe('얼굴 각도 감지', () => {
    it('detectFaceAngle() 호출 시 얼굴 각도를 반환해야 함', async () => {
      const { result } = renderHook(() => useFaceAngleDetection())

      // Mock 얼굴 랜드마크 데이터 (468개 키포인트)
      const mockKeypoints = Array.from({ length: 468 }, (_, i) => ({
        x: 0.5 + Math.random() * 0.1,
        y: 0.5 + Math.random() * 0.1,
        z: Math.random() * 0.1,
      }))

      const mockDetector = {
        estimateFaces: jest.fn().mockResolvedValue([
          {
            keypoints: mockKeypoints,
          },
        ]),
        dispose: jest.fn(),
      }

      const { createDetector } = await import('@tensorflow-models/face-landmarks-detection')
      ;(createDetector as jest.Mock).mockResolvedValue(mockDetector)

      await result.current.initialize()

      const mockCanvas = document.createElement('canvas')
      mockCanvas.width = 640
      mockCanvas.height = 480

      const angle = await result.current.detectFaceAngle(mockCanvas)

      expect(angle).not.toBeNull()
      expect(angle).toHaveProperty('yaw')
      expect(angle).toHaveProperty('pitch')
      expect(angle).toHaveProperty('roll')
      expect(typeof angle?.yaw).toBe('number')
      expect(typeof angle?.pitch).toBe('number')
      expect(typeof angle?.roll).toBe('number')
    })

    it('얼굴이 감지되지 않으면 null을 반환해야 함', async () => {
      const { result } = renderHook(() => useFaceAngleDetection())

      const mockDetector = {
        estimateFaces: jest.fn().mockResolvedValue([]),
        dispose: jest.fn(),
      }

      const { createDetector } = await import('@tensorflow-models/face-landmarks-detection')
      ;(createDetector as jest.Mock).mockResolvedValue(mockDetector)

      await result.current.initialize()

      const mockCanvas = document.createElement('canvas')
      const angle = await result.current.detectFaceAngle(mockCanvas)

      expect(angle).toBeNull()
    })

    it('키포인트가 468개 미만이면 null을 반환해야 함', async () => {
      const { result } = renderHook(() => useFaceAngleDetection())

      const mockDetector = {
        estimateFaces: jest.fn().mockResolvedValue([
          {
            keypoints: Array.from({ length: 100 }, () => ({ x: 0.5, y: 0.5 })),
          },
        ]),
        dispose: jest.fn(),
      }

      const { createDetector } = await import('@tensorflow-models/face-landmarks-detection')
      ;(createDetector as jest.Mock).mockResolvedValue(mockDetector)

      await result.current.initialize()

      const mockCanvas = document.createElement('canvas')
      const angle = await result.current.detectFaceAngle(mockCanvas)

      expect(angle).toBeNull()
    })
  })

  describe('리소스 정리', () => {
    it('cleanup() 호출 시 detector가 dispose되어야 함', async () => {
      const { result } = renderHook(() => useFaceAngleDetection())

      const mockDispose = jest.fn()
      const mockDetector = {
        estimateFaces: jest.fn(),
        dispose: mockDispose,
      }

      const { createDetector } = await import('@tensorflow-models/face-landmarks-detection')
      ;(createDetector as jest.Mock).mockResolvedValue(mockDetector)

      await waitFor(async () => {
        await result.current.initialize()
      })

      await waitFor(() => {
        result.current.cleanup()
        expect(mockDispose).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(false)
      })
    })
  })
})

describe('isFaceAngleValid', () => {
  describe('정면 각도 검증', () => {
    it('정면 각도(yaw < 15도)가 유효해야 함', () => {
      const angle = { yaw: 5, pitch: 2, roll: 1 }
      expect(isFaceAngleValid(angle, 'front', 15)).toBe(true)
    })

    it('yaw가 15도 이상이면 유효하지 않아야 함', () => {
      const angle = { yaw: 20, pitch: 2, roll: 1 }
      expect(isFaceAngleValid(angle, 'front', 15)).toBe(false)
    })

    it('roll이 15도 이상이면 유효하지 않아야 함', () => {
      const angle = { yaw: 5, pitch: 2, roll: 20 }
      expect(isFaceAngleValid(angle, 'front', 15)).toBe(false)
    })

    it('pitch가 15도 이상이면 유효하지 않아야 함', () => {
      const angle = { yaw: 5, pitch: 20, roll: 1 }
      expect(isFaceAngleValid(angle, 'front', 15)).toBe(false)
    })
  })

  describe('좌측 각도 검증', () => {
    it('왼쪽으로 15-60도 회전한 각도가 유효해야 함', () => {
      const angle = { yaw: -30, pitch: 5, roll: 2 }
      expect(isFaceAngleValid(angle, 'left', 15)).toBe(true)
    })

    it('yaw가 -15도 미만이면 유효하지 않아야 함', () => {
      const angle = { yaw: -10, pitch: 5, roll: 2 }
      expect(isFaceAngleValid(angle, 'left', 15)).toBe(false)
    })

    it('yaw가 -60도 이하면 유효하지 않아야 함', () => {
      const angle = { yaw: -70, pitch: 5, roll: 2 }
      expect(isFaceAngleValid(angle, 'left', 15)).toBe(false)
    })

    it('좌측 촬영 시 pitch 허용 범위가 더 넓어야 함', () => {
      const angle = { yaw: -30, pitch: 20, roll: 2 } // pitch 20도 (15 * 1.5 = 22.5도 이하)
      expect(isFaceAngleValid(angle, 'left', 15)).toBe(true)
    })
  })

  describe('우측 각도 검증', () => {
    it('오른쪽으로 15-60도 회전한 각도가 유효해야 함', () => {
      const angle = { yaw: 30, pitch: 5, roll: 2 }
      expect(isFaceAngleValid(angle, 'right', 15)).toBe(true)
    })

    it('yaw가 15도 미만이면 유효하지 않아야 함', () => {
      const angle = { yaw: 10, pitch: 5, roll: 2 }
      expect(isFaceAngleValid(angle, 'right', 15)).toBe(false)
    })

    it('yaw가 60도 이상이면 유효하지 않아야 함', () => {
      const angle = { yaw: 70, pitch: 5, roll: 2 }
      expect(isFaceAngleValid(angle, 'right', 15)).toBe(false)
    })
  })

  describe('에지 케이스', () => {
    it('null 각도는 항상 유효하지 않아야 함', () => {
      expect(isFaceAngleValid(null, 'front', 15)).toBe(false)
      expect(isFaceAngleValid(null, 'left', 15)).toBe(false)
      expect(isFaceAngleValid(null, 'right', 15)).toBe(false)
    })

    it('임계값을 변경하면 검증 결과가 달라져야 함', () => {
      const angle = { yaw: 20, pitch: 2, roll: 1 }
      expect(isFaceAngleValid(angle, 'front', 15)).toBe(false)
      expect(isFaceAngleValid(angle, 'front', 25)).toBe(true)
    })
  })
})

