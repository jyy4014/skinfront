/**
 * 분석 플로우 오케스트레이션 훅
 * 업로드 → 분석 → 저장 전체 플로우를 통합 관리
 */

'use client'

import { useState } from 'react'
import { useImageUpload } from './useImageUpload'
import { useAnalysis } from './useAnalysis'
import { useAnalysisSave } from './useAnalysisSave'
import { useSession } from '../../../lib/auth'
import { createClient } from '../../../lib/supabaseClient'

export interface UploadProgress {
  stage: 'upload' | 'analyze' | 'save' | 'complete'
  progress: number
  message: string
}

export interface UseAnalysisFlowReturn {
  uploadAndAnalyze: (file: File) => Promise<AnalysisFlowResult>
  loading: boolean
  error: Error | null
  progress: UploadProgress | null
}

export interface AnalysisFlowResult {
  result_id: string
  analysis: any
  mapping: any
  nlg: any
  review_needed: boolean
  id?: string
}

/**
 * 전체 분석 플로우 훅
 */
export function useAnalysisFlow(): UseAnalysisFlowReturn {
  const { uploadImage, loading: uploadLoading, error: uploadError } = useImageUpload()
  const { analyze, loading: analyzeLoading, error: analyzeError } = useAnalysis()
  const { saveAnalysis, loading: saveLoading, error: saveError } = useAnalysisSave()
  const { accessToken } = useSession()
  const supabase = createClient()
  const [progress, setProgress] = useState<UploadProgress | null>(null)

  const uploadAndAnalyze = async (file: File): Promise<AnalysisFlowResult> => {
    try {
      setProgress({ stage: 'upload', progress: 0, message: '이미지 업로드 중...' })

      // 1. 이미지 업로드
      const uploadResult = await uploadImage(file, {
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
      const token = session?.access_token || accessToken

      if (!token) {
        throw new Error('인증 토큰을 가져올 수 없습니다.')
      }

      // 3. AI 분석
      const analysisResult = await analyze(
        {
          imageUrl: uploadResult.publicUrl,
          userId: uploadResult.userId,
          accessToken: token,
        },
        {
          onProgress: (p, msg) =>
            setProgress({
              stage: 'analyze',
              progress: p,
              message: msg,
            }),
        }
      )

      // 4. 결과 저장
      setProgress({ stage: 'save', progress: 95, message: '결과 저장 중...' })
      
      const saveResult = await saveAnalysis({
        userId: uploadResult.userId,
        imageUrl: uploadResult.publicUrl,
        result: analysisResult,
        accessToken: token,
      })

      setProgress({
        stage: 'complete',
        progress: 100,
        message: '분석 완료!',
      })

      return {
        result_id: analysisResult.result_id!,
        analysis: analysisResult.analysis,
        mapping: analysisResult.mapping,
        nlg: analysisResult.nlg,
        review_needed: analysisResult.review_needed || false,
        id: (saveResult as any).id,
      }
    } catch (error) {
      setProgress(null)
      throw error
    }
  }

  return {
    uploadAndAnalyze,
    loading: uploadLoading || analyzeLoading || saveLoading,
    error: uploadError || analyzeError || saveError,
    progress,
  }
}

