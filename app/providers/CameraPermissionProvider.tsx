'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useCameraPermission } from '@/app/features/analyze/hooks/useCameraPermission'

interface CameraPermissionContextType {
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unavailable'
  hasCamera: boolean
  isChecking: boolean
  requestPermission: () => Promise<boolean>
  checkPermission: () => Promise<void>
}

const CameraPermissionContext = createContext<CameraPermissionContextType | undefined>(undefined)

/**
 * 카메라 권한 상태를 전역으로 관리하는 Provider
 * 여러 컴포넌트에서 동일한 권한 상태를 공유하도록 함
 */
export function CameraPermissionProvider({ children }: { children: ReactNode }) {
  const permissionState = useCameraPermission()

  return (
    <CameraPermissionContext.Provider value={permissionState}>
      {children}
    </CameraPermissionContext.Provider>
  )
}

/**
 * 카메라 권한 상태를 사용하는 훅
 * Context를 통해 전역 상태에 접근
 */
export function useCameraPermissionContext() {
  const context = useContext(CameraPermissionContext)
  if (context === undefined) {
    throw new Error('useCameraPermissionContext must be used within a CameraPermissionProvider')
  }
  return context
}

