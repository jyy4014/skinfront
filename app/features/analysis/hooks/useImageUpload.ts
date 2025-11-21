/**
 * 이미지 업로드 전용 훅
 * Supabase Storage에 이미지 업로드만 담당
 */

'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabaseClient'

export interface UploadImageOptions {
  onProgress?: (progress: number) => void
  angles?: ('front' | 'left' | 'right')[] // 각 이미지의 각도 정보
}

export interface UploadImageResult {
  publicUrl: string
  filePath: string
  userId: string
  angle?: 'front' | 'left' | 'right' // 이미지 각도 정보
}

export interface UploadImagesResult {
  results: UploadImageResult[] // 3개 이미지 업로드 결과
  userId: string
}

/**
 * 이미지 업로드 훅
 */
export function useImageUpload() {
  const router = useRouter()
  const supabase = createClient()

  // 단일 이미지 업로드 (하위 호환성)
  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      onProgress,
      angle,
    }: {
      file: File
      onProgress?: (progress: number) => void
      angle?: 'front' | 'left' | 'right'
    }): Promise<UploadImageResult> => {
      if (!file || !file.name) {
        throw new Error('유효한 파일이 필요합니다.')
      }
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        throw new Error('인증이 필요합니다.')
      }

      // 이미지 업로드
      // UPDATE 방식: 같은 사용자의 원본은 각도별로 고정 경로에 덮어쓰기
      const fileExt = file.name.split('.').pop()
      const angleSuffix = angle || 'front'
      const fileName = `${user.id}/original/${angleSuffix}.${fileExt}`
      const filePath = fileName

      onProgress?.(10)

      const { error: uploadError } = await supabase.storage
        .from('skin-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // UPDATE: 같은 경로에 덮어쓰기
        })

      if (uploadError) throw uploadError

      onProgress?.(50)

      // 이미지 URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from('skin-images').getPublicUrl(filePath)

      return { publicUrl, filePath, userId: user.id, angle }
    },
  })

  // 여러 이미지 업로드 (병렬 처리)
  const uploadImagesMutation = useMutation({
    mutationFn: async ({
      files,
      onProgress,
      angles,
    }: {
      files: File[]
      onProgress?: (progress: number) => void
      angles?: ('front' | 'left' | 'right')[]
    }): Promise<UploadImagesResult> => {
      if (!files || files.length === 0) {
        throw new Error('최소 1개 이상의 파일이 필요합니다.')
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        throw new Error('인증이 필요합니다.')
      }

      // AI 분석 정확도 보장: 원본 이미지 업로드 (최적화 없음)
      // 저장 시에만 리사이즈하여 스토리지 절약
      
      // 각 이미지를 병렬로 업로드 (원본 그대로)
      // UPDATE 방식: 같은 사용자의 원본은 각도별로 고정 경로에 덮어쓰기
      const uploadPromises = files.map(async (file, index) => {
        const angle = angles?.[index] || 'front'
        const fileExt = file.name.split('.').pop() || 'jpg'
        // 각도별 고정 경로 (UPDATE를 위해 항상 같은 경로 사용)
        const fileName = `${user.id}/original/${angle}.${fileExt}`
        const filePath = fileName

        const { error: uploadError } = await supabase.storage
          .from('skin-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true, // UPDATE: 같은 경로에 덮어쓰기
          })

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('skin-images').getPublicUrl(filePath)

        // 진행도 업데이트
        const progress = Math.round(((index + 1) / files.length) * 100)
        onProgress?.(progress)

        return {
          publicUrl,
          filePath, // 원본 파일 경로 (나중에 삭제용)
          userId: user.id,
          angle: angle as 'front' | 'left' | 'right',
        }
      })

      const results = await Promise.all(uploadPromises)

      return {
        results,
        userId: user.id,
      }
    },
  })

  return {
    // 단일 이미지 업로드 (하위 호환성)
    uploadImage: (file: File, options?: UploadImageOptions) =>
      uploadMutation.mutateAsync({ 
        file, 
        onProgress: options?.onProgress,
        angle: options?.angles?.[0],
      }),
    // 여러 이미지 업로드 (새로운 기능)
    uploadImages: (files: File[], options?: UploadImageOptions) =>
      uploadImagesMutation.mutateAsync({
        files,
        onProgress: options?.onProgress,
        angles: options?.angles,
      }),
    loading: uploadMutation.isPending || uploadImagesMutation.isPending,
    error: uploadMutation.error || uploadImagesMutation.error,
  }
}

