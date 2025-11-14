import { useRef, useCallback, useEffect } from 'react'
import * as tf from '@tensorflow/tfjs'

interface FaceAngle {
  yaw: number // 좌우 각도 (도)
  pitch: number // 상하 각도 (도)
  roll: number // 회전 각도 (도)
}

interface UseFaceAngleDetectionReturn {
  detectFaceAngle: (image: HTMLCanvasElement | HTMLVideoElement) => Promise<FaceAngle | null>
  isInitialized: boolean
  initialize: () => Promise<void>
  cleanup: () => void
}

/**
 * 얼굴 각도 감지 훅
 * TensorFlow.js Face Landmarks Detection을 사용하여 얼굴의 yaw, pitch, roll 각도를 계산합니다.
 * 
 * 개선사항:
 * - MediaPipe Face Mesh의 3D 좌표를 활용한 정확한 각도 계산
 * - 모델 초기화 최적화 및 메모리 관리
 * - 에러 처리 강화
 */
export function useFaceAngleDetection(): UseFaceAngleDetectionReturn {
  const detectorRef = useRef<any>(null)
  const isInitializedRef = useRef(false)
  const isInitializingRef = useRef(false)

  /**
   * TensorFlow.js 모델 초기화
   */
  const initialize = useCallback(async () => {
    if (detectorRef.current || isInitializingRef.current) return

    isInitializingRef.current = true

    try {
      // TensorFlow.js 백엔드 설정 (WebGL 우선, 실패 시 CPU)
      try {
        await tf.setBackend('webgl')
      } catch {
        await tf.setBackend('cpu')
      }
      await tf.ready()

      // MediaPipe Face Mesh 모델 동적 로드
      const faceLandmarksDetection = await import('@tensorflow-models/face-landmarks-detection')
      
      detectorRef.current = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'mediapipe',
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
          refineLandmarks: true,
          maxFaces: 1, // 얼굴 1개만 감지
        }
      )

      isInitializedRef.current = true
    } catch (err) {
      console.error('Face landmarks initialization error:', err)
      isInitializedRef.current = false
      throw err
    } finally {
      isInitializingRef.current = false
    }
  }, [])

  /**
   * 3D 좌표를 사용한 정확한 얼굴 각도 계산
   * MediaPipe Face Mesh의 468개 랜드마크 중 주요 포인트를 사용
   */
  const calculateFaceAngle = useCallback((keypoints: Array<{ x: number; y: number; z?: number }>): FaceAngle | null => {
    if (!keypoints || keypoints.length < 468) return null

    try {
      // MediaPipe Face Mesh 주요 랜드마크 인덱스
      // https://github.com/tensorflow/tfjs-models/blob/master/face-landmarks-detection/mesh_map.jpg
      const NOSE_TIP = 4
      const LEFT_EYE_INNER = 133
      const RIGHT_EYE_INNER = 362
      const LEFT_EYE_OUTER = 33
      const RIGHT_EYE_OUTER = 263
      const CHIN = 18
      const FOREHEAD = 10

      const nose = keypoints[NOSE_TIP]
      const leftEyeInner = keypoints[LEFT_EYE_INNER]
      const rightEyeInner = keypoints[RIGHT_EYE_INNER]
      const leftEyeOuter = keypoints[LEFT_EYE_OUTER]
      const rightEyeOuter = keypoints[RIGHT_EYE_OUTER]
      const chin = keypoints[CHIN]
      const forehead = keypoints[FOREHEAD]

      // 3D 좌표가 있는 경우 사용, 없으면 2D 좌표로 추정
      const has3D = nose.z !== undefined && leftEyeInner.z !== undefined

      // Yaw (좌우 각도) 계산
      // 코의 x 위치와 눈 중심의 x 위치 차이를 사용
      const eyeCenterX = (leftEyeInner.x + rightEyeInner.x) / 2
      const eyeCenterZ = has3D ? (leftEyeInner.z! + rightEyeInner.z!) / 2 : 0
      const noseOffsetX = nose.x - eyeCenterX
      const noseOffsetZ = has3D ? (nose.z! - eyeCenterZ) : 0
      const eyeDistance = Math.sqrt(
        Math.pow(rightEyeInner.x - leftEyeInner.x, 2) +
        (has3D ? Math.pow(rightEyeInner.z! - leftEyeInner.z!, 2) : 0)
      )
      
      // atan2를 사용하여 정확한 각도 계산
      const yaw = Math.atan2(noseOffsetX, eyeDistance + Math.abs(noseOffsetZ)) * (180 / Math.PI)

      // Pitch (상하 각도) 계산
      // 코와 턱/이마의 y, z 위치 차이를 사용
      const faceCenterY = (leftEyeInner.y + rightEyeInner.y) / 2
      const faceCenterZ = has3D ? (leftEyeInner.z! + rightEyeInner.z!) / 2 : 0
      const noseOffsetY = nose.y - faceCenterY
      const noseOffsetZPitch = has3D ? (nose.z! - faceCenterZ) : 0
      const faceHeight = Math.sqrt(
        Math.pow(chin.y - forehead.y, 2) +
        (has3D ? Math.pow(chin.z! - forehead.z!, 2) : 0)
      )
      
      const pitch = Math.atan2(noseOffsetY, faceHeight + Math.abs(noseOffsetZPitch)) * (180 / Math.PI)

      // Roll (회전 각도) 계산
      // 양쪽 눈의 y 위치 차이를 사용
      const eyeDeltaY = rightEyeOuter.y - leftEyeOuter.y
      const eyeDeltaX = rightEyeOuter.x - leftEyeOuter.x
      const roll = Math.atan2(eyeDeltaY, eyeDeltaX) * (180 / Math.PI)

      return { 
        yaw: Math.round(yaw * 10) / 10, // 소수점 1자리로 반올림
        pitch: Math.round(pitch * 10) / 10,
        roll: Math.round(roll * 10) / 10,
      }
    } catch (err) {
      console.error('Face angle calculation error:', err)
      return null
    }
  }, [])

  const detectFaceAngle = useCallback(async (
    image: HTMLCanvasElement | HTMLVideoElement
  ): Promise<FaceAngle | null> => {
    // 초기화되지 않았으면 초기화 시도
    if (!isInitializedRef.current && !isInitializingRef.current) {
      try {
        await initialize()
      } catch (err) {
        console.error('Failed to initialize face angle detection:', err)
        return null
      }
    }

    // 초기화 중이면 대기
    if (isInitializingRef.current) {
      return null
    }

    if (!detectorRef.current) {
      return null
    }

    try {
      // 얼굴 랜드마크 감지
      const faces = await detectorRef.current.estimateFaces(image, {
        flipHorizontal: false,
        staticImageMode: false, // 비디오 스트림이므로 false
      })

      if (!faces || faces.length === 0) {
        return null
      }

      const face = faces[0]
      if (!face.keypoints || face.keypoints.length < 468) {
        return null
      }

      return calculateFaceAngle(face.keypoints)
    } catch (err) {
      console.error('Face angle detection error:', err)
      return null
    }
  }, [initialize, calculateFaceAngle])

  /**
   * 리소스 정리
   */
  const cleanup = useCallback(() => {
    if (detectorRef.current) {
      try {
        detectorRef.current.dispose?.()
      } catch (err) {
        console.error('Error disposing face landmarks detector:', err)
      }
      detectorRef.current = null
    }
    isInitializedRef.current = false
    isInitializingRef.current = false
  }, [])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    detectFaceAngle,
    isInitialized: isInitializedRef.current,
    initialize,
    cleanup,
  }
}

/**
 * 얼굴 각도가 목표 각도에 적합한지 확인
 * 
 * @param angle 얼굴 각도
 * @param targetAngle 목표 각도 ('front' | 'left' | 'right')
 * @param threshold 허용 오차 (도, 기본값: 15)
 * @returns 각도가 적합한지 여부
 */
export function isFaceAngleValid(
  angle: FaceAngle | null,
  targetAngle: 'front' | 'left' | 'right',
  threshold: number = 15 // 허용 오차 (도)
): boolean {
  if (!angle) return false

  // Roll과 Pitch는 작아야 함 (정면을 향해야 함)
  // 단, 좌/우측 촬영 시에는 약간의 pitch는 허용
  const maxRoll = threshold
  const maxPitch = targetAngle === 'front' ? threshold : threshold * 1.5

  if (Math.abs(angle.roll) > maxRoll || Math.abs(angle.pitch) > maxPitch) {
    return false
  }

  // Yaw 각도 확인
  switch (targetAngle) {
    case 'front':
      return Math.abs(angle.yaw) < threshold
    case 'left':
      // 왼쪽으로 15-60도 회전
      return angle.yaw < -threshold && angle.yaw > -60
    case 'right':
      // 오른쪽으로 15-60도 회전
      return angle.yaw > threshold && angle.yaw < 60
    default:
      return false
  }
}
