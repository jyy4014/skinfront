'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/app/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createEdgeFunctionClient } from '@/app/lib/api'

interface UploadProgress {
  stage: 'upload' | 'analyze' | 'complete'
  progress: number
  message: string
}

// Signed URL로 업로드 (진행도 추적)
async function uploadToSignedUrl(
  uploadUrl: string,
  file: File,
  onProgress?: (p: number) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(xhr.statusText))
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.send(file)
  })
}

export function useUploadFlow() {
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<UploadProgress | null>(null)

  // 이미지 업로드 mutation
  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: File
      onProgress?: (progress: number) => void
    }) => {
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

  // AI 분석 mutation
  const analyzeMutation = useMutation({
    mutationFn: async ({
      imageUrl,
      userId,
      accessToken,
      onProgress,
    }: {
      imageUrl: string
      userId: string
      accessToken: string
      onProgress?: (progress: number, message: string) => void
    }) => {
      onProgress?.(60, '피부 질감 분석 중...')

      const edgeClient = createEdgeFunctionClient()
      const result = await edgeClient.analyze({
        image_url: imageUrl,
        user_id: userId,
        accessToken,
      })

      onProgress?.(80, '색소 분석 중...')

      // 응답에 에러가 있는지 확인
      if (result.status === 'error') {
        throw new Error(result.error || 'AI 분석 중 오류가 발생했습니다.')
      }

      onProgress?.(90, '트러블 예측 중...')

      return result
    },
  })

  // 결과 저장 mutation
  const saveMutation = useMutation({
    mutationFn: async ({
      userId,
      imageUrl,
      result,
      accessToken,
    }: {
      userId: string
      imageUrl: string
      result: any
      accessToken: string
    }) => {
      const edgeClient = createEdgeFunctionClient()
      return edgeClient.save({
        userId,
        imageUrl,
        result: {
          result_id: result.result_id,
          analysis: result.analysis,
          mapping: result.mapping,
          nlg: result.nlg,
          review_needed: result.review_needed,
          stage_metadata: result.stage_metadata,
        },
        accessToken,
      })
    },
    onSuccess: () => {
      // 히스토리 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['skin_analysis'] })
    },
  })

  // 전체 업로드 및 분석 플로우
  const uploadAndAnalyze = async (file: File) => {
    try {
      setProgress({ stage: 'upload', progress: 0, message: '이미지 업로드 중...' })

      // 1. 이미지 업로드
      const uploadResult = await uploadMutation.mutateAsync({
        file,
        onProgress: (p) =>
          setProgress({
            stage: 'upload',
            progress: p,
            message: '이미지 업로드 중...',
          }),
      })

      // 2. 세션 가져오기
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) {
        throw new Error('인증 토큰을 가져올 수 없습니다.')
      }

      // 3. AI 분석
      const analysisResult = await analyzeMutation.mutateAsync({
        imageUrl: uploadResult.publicUrl,
        userId: uploadResult.userId,
        accessToken,
        onProgress: (p, msg) =>
          setProgress({
            stage: 'analyze',
            progress: p,
            message: msg,
          }),
      })

      // 4. 결과 저장
      const saveResult = await saveMutation.mutateAsync({
        userId: uploadResult.userId,
        imageUrl: uploadResult.publicUrl,
        result: analysisResult,
        accessToken,
      })

      setProgress({
        stage: 'complete',
        progress: 100,
        message: '분석 완료!',
      })

      return {
        result_id: analysisResult.result_id,
        analysis: analysisResult.analysis,
        mapping: analysisResult.mapping,
        nlg: analysisResult.nlg,
        review_needed: analysisResult.review_needed,
        id: saveResult.id,
      }
    } catch (error) {
      setProgress(null)
      throw error
    }
  }

  return {
    uploadAndAnalyze,
    loading:
      uploadMutation.isPending ||
      analyzeMutation.isPending ||
      saveMutation.isPending,
    error:
      uploadMutation.error ||
      analyzeMutation.error ||
      saveMutation.error,
    progress,
  }
}
