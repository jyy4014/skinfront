'use client'

import { useState, useEffect, useCallback } from 'react'

export type CameraPermissionStatus = 'prompt' | 'granted' | 'denied' | 'unavailable'

export interface UseCameraPermissionReturn {
  permissionStatus: CameraPermissionStatus
  hasCamera: boolean
  isChecking: boolean
  requestPermission: () => Promise<boolean>
  checkPermission: () => Promise<void>
}

/**
 * 카메라 권한 및 장치 확인 훅
 */
export function useCameraPermission(): UseCameraPermissionReturn {
  const [permissionStatus, setPermissionStatus] = useState<CameraPermissionStatus>('prompt')
  const [hasCamera, setHasCamera] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  /**
   * 카메라 장치 존재 여부 확인
   */
  const checkCameraDevices = useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return false
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      return videoDevices.length > 0
    } catch (err) {
      console.error('Camera device check error:', err)
      return false
    }
  }, [])

  /**
   * 카메라 권한 상태 확인
   */
  const checkPermission = useCallback(async () => {
    setIsChecking(true)

    try {
      // 카메라 장치 확인
      const cameraExists = await checkCameraDevices()
      setHasCamera(cameraExists)

      if (!cameraExists) {
        setPermissionStatus('unavailable')
        setIsChecking(false)
        return
      }

      // 권한 API 지원 여부 확인
      if (!navigator.permissions || !navigator.permissions.query) {
        // 권한 API를 지원하지 않는 브라우저 (Safari 등)
        // getUserMedia를 시도해서 권한 상태 확인
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          stream.getTracks().forEach(track => track.stop())
          setPermissionStatus('granted')
        } catch (err: any) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setPermissionStatus('denied')
          } else {
            setPermissionStatus('prompt')
          }
        }
        setIsChecking(false)
        return
      }

      // 권한 상태 확인
      const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })
      
      if (permissionStatus.state === 'granted') {
        setPermissionStatus('granted')
      } else if (permissionStatus.state === 'denied') {
        setPermissionStatus('denied')
      } else {
        setPermissionStatus('prompt')
      }

      // 권한 상태 변경 감지
      permissionStatus.onchange = () => {
        if (permissionStatus.state === 'granted') {
          setPermissionStatus('granted')
        } else if (permissionStatus.state === 'denied') {
          setPermissionStatus('denied')
        } else {
          setPermissionStatus('prompt')
        }
      }
    } catch (err) {
      console.error('Permission check error:', err)
      setPermissionStatus('prompt')
    } finally {
      setIsChecking(false)
    }
  }, [checkCameraDevices])

  /**
   * 카메라 권한 요청
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionStatus('unavailable')
        return false
      }

      // 카메라 장치 확인
      const cameraExists = await checkCameraDevices()
      if (!cameraExists) {
        setPermissionStatus('unavailable')
        setHasCamera(false)
        return false
      }

      // 권한 요청 (getUserMedia 호출)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      
      // 스트림 정리
      stream.getTracks().forEach(track => track.stop())
      
      setPermissionStatus('granted')
      setHasCamera(true)
      return true
    } catch (err: any) {
      console.error('Permission request error:', err)
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied')
      } else if (err.name === 'NotFoundError') {
        setPermissionStatus('unavailable')
        setHasCamera(false)
      } else {
        setPermissionStatus('prompt')
      }
      
      return false
    }
  }, [checkCameraDevices])

  // 초기 권한 확인
  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  return {
    permissionStatus,
    hasCamera,
    isChecking,
    requestPermission,
    checkPermission,
  }
}

