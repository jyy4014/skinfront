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
  uploadAndAnalyze: (files: File[]) => Promise<AnalysisFlowResult>
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
  image_urls?: string[] // 3개 이미지 URL 배열
  image_angles?: ('front' | 'left' | 'right')[] // 각 이미지의 각도
}

/**
 * 전체 분석 플로우 훅
 */
export function useAnalysisFlow(): UseAnalysisFlowReturn {
  const { uploadImages, loading: uploadLoading, error: uploadError } = useImageUpload()
  const { analyze, loading: analyzeLoading, error: analyzeError } = useAnalysis()
  const { saveAnalysis, loading: saveLoading, error: saveError } = useAnalysisSave()
  const { accessToken } = useSession()
  const supabase = createClient()
  const [progress, setProgress] = useState<UploadProgress | null>(null)

  const uploadAndAnalyze = async (files: File[]): Promise<AnalysisFlowResult> => {
    try {
      // 파일 개수 검증
      if (!files || files.length === 0) {
        throw new Error('최소 1개 이상의 이미지가 필요합니다.')
      }

      // 3개 이미지인 경우 각도 정보 설정
      const angles: ('front' | 'left' | 'right')[] = 
        files.length === 3 
          ? ['front', 'left', 'right'] 
          : files.map(() => 'front') // 단일 이미지인 경우 기본값

      setProgress({ stage: 'upload', progress: 0, message: `${files.length}개 이미지 업로드 중...` })

      // 1. 여러 이미지 업로드 (병렬 처리)
      const uploadResults = await uploadImages(files, {
        angles,
        onProgress: (p) =>
          setProgress({
            stage: 'upload',
            progress: Math.round(p * 0.3), // 업로드는 전체의 30%
            message: `${files.length}개 이미지 업로드 중... (${Math.round(p)}%)`,
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

      // 3. AI 분석 (3개 이미지 URL 전송)
      const imageUrls = uploadResults.results.map(r => r.publicUrl)
      const imageAngles = uploadResults.results.map(r => r.angle || 'front') as ('front' | 'left' | 'right')[]

      const analysisResult = await analyze(
        {
          imageUrls,
          imageAngles,
          userId: uploadResults.userId,
          accessToken: token,
        },
        {
          onProgress: (p, msg) =>
            setProgress({
              stage: 'analyze',
              progress: 30 + Math.round(p * 0.6), // 분석은 30-90%
              message: msg,
            }),
        }
      )

      // 4. 결과 저장 (3개 이미지 URL 저장)
      setProgress({ stage: 'save', progress: 95, message: '결과 저장 중...' })
      
      const saveResult = await saveAnalysis({
        userId: uploadResults.userId,
        imageUrls,
        imageAngles,
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
        image_urls: imageUrls,
        image_angles: imageAngles,
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

