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
}

export interface UploadImageResult {
  publicUrl: string
  filePath: string
  userId: string
}

/**
 * 이미지 업로드 훅
 */
export function useImageUpload() {
  const router = useRouter()
  const supabase = createClient()

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: File
      onProgress?: (progress: number) => void
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
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const filePath = fileName

      onProgress?.(10)

      const { error: uploadError } = await supabase.storage
        .from('skin-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      onProgress?.(50)

      // 이미지 URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from('skin-images').getPublicUrl(filePath)

      return { publicUrl, filePath, userId: user.id }
    },
  })

  return {
    uploadImage: (file: File, options?: UploadImageOptions) =>
      uploadMutation.mutateAsync({ file, onProgress: options?.onProgress }),
    loading: uploadMutation.isPending,
    error: uploadMutation.error,
  }
}

