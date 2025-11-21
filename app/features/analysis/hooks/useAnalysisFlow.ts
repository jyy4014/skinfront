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
  stage: 'upload' | 'analyze' | 'save' | 'complete' | 'retry'
  progress: number
  message: string
  estimatedTime?: number // 예상 남은 시간 (초)
  retryAttempt?: number // 현재 재시도 횟수
  maxRetries?: number // 최대 재시도 횟수
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
    const startTime = Date.now()
    
    // 파일 개수 검증 (가장 먼저)
    if (!files || files.length === 0) {
      throw new Error('최소 1개 이상의 이미지가 필요합니다.')
    }
    
    // 단계별 예상 소요 시간 (초)
    const ESTIMATED_TIMES = {
      upload: files.length * 1.5, // 원본 업로드 (파일당 약 1.5초)
      analyze: 15, // AI 분석 약 15초 (원본 사용으로 정확도 보장)
      save: files.length * 2 + 2, // 저장 시 리사이즈 + 업로드 (파일당 약 2초) + DB 저장 2초
    }

    try {

      // P2-6: 다양한 파일 개수에 대한 각도 배열 생성
      // 각도 배열은 반드시 files.length와 동일한 길이여야 함
      const angles: ('front' | 'left' | 'right')[] = 
        files.length === 3 
          ? ['front', 'left', 'right'] 
          : files.length === 1
          ? ['front']
          : files.length === 2
          ? ['front', 'left']
          : files.length > 3
          ? files.slice(0, 3).map((_, i) => 
              i === 0 ? 'front' : i === 1 ? 'left' : 'right'
            )
          : ['front'] // 예상치 못한 경우를 위한 fallback
      
      // 각도 배열과 파일 배열 길이 검증
      if (angles.length !== files.length) {
        console.warn(`Angles array length (${angles.length}) does not match files length (${files.length}). Adjusting...`)
        // 부족한 각도는 'front'로 채움
        while (angles.length < files.length) {
          angles.push('front')
        }
        // 초과한 각도는 제거
        angles.splice(files.length)
      }

      setProgress({ 
        stage: 'upload', 
        progress: 0, 
        message: `${files.length}개 이미지 업로드 준비 중...`,
        estimatedTime: ESTIMATED_TIMES.upload + ESTIMATED_TIMES.analyze + ESTIMATED_TIMES.save,
      })

      // 1. 여러 이미지 업로드 (병렬 처리)
      const uploadStartTime = Date.now()
      const uploadResults = await uploadImages(files, {
        angles,
        onProgress: (p) => {
          const uploadProgress = Math.round(p * 0.3) // 업로드는 전체의 30%
          const uploadedCount = Math.round((p / 100) * files.length)
          const elapsed = (Date.now() - uploadStartTime) / 1000
          const remaining = Math.max(0, ESTIMATED_TIMES.upload - elapsed + ESTIMATED_TIMES.analyze + ESTIMATED_TIMES.save)
          
          setProgress({
            stage: 'upload',
            progress: uploadProgress,
            message: `${uploadedCount}/${files.length}개 이미지 업로드 완료 (${Math.round(p)}%)`,
            estimatedTime: Math.ceil(remaining),
          })
        },
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

      // P0-2: 이미지 URL과 각도 배열 길이 검증
      if (imageUrls.length !== imageAngles.length) {
        throw new Error('이미지 URL과 각도 정보의 개수가 일치하지 않습니다.')
      }

      const analyzeStartTime = Date.now()
      setProgress({ 
        stage: 'analyze', 
        progress: 30, 
        message: 'AI 분석 시작 중...',
        estimatedTime: ESTIMATED_TIMES.analyze + ESTIMATED_TIMES.save,
      })

      const analysisResult = await analyze(
        {
          imageUrls,
          imageAngles,
          userId: uploadResults.userId,
          accessToken: token,
        },
        {
          onProgress: (p, msg) => {
            // 분석은 30-90% (60% 범위)
            const analyzeProgress = 30 + Math.round(p * 0.6)
            const elapsed = (Date.now() - analyzeStartTime) / 1000
            const remaining = Math.max(0, ESTIMATED_TIMES.analyze - elapsed + ESTIMATED_TIMES.save)
            
            setProgress({
              stage: 'analyze',
              progress: analyzeProgress,
              message: msg || `AI 분석 중... (${Math.round(p)}%)`,
              estimatedTime: Math.ceil(remaining),
            })
          },
          onRetry: (attempt, maxRetries, delay) => {
            setProgress({
              stage: 'retry',
              progress: 30 + Math.round((attempt / (maxRetries + 1)) * 60),
              message: `재시도 중... (${attempt}/${maxRetries + 1})`,
              retryAttempt: attempt,
              maxRetries: maxRetries + 1,
              estimatedTime: Math.ceil(delay / 1000),
            })
          },
        }
      )

      // P0-1: result_id 검증
      if (!analysisResult.result_id) {
        throw new Error('분석 결과 ID가 없습니다.')
      }

      // 4. 결과 저장 (저장 시 리사이즈된 이미지 생성)
      setProgress({ 
        stage: 'save', 
        progress: 90, 
        message: '이미지 리사이즈 및 저장 중...',
        estimatedTime: ESTIMATED_TIMES.save,
      })
      
      const saveResult = await saveAnalysis({
        userId: uploadResults.userId,
        imageUrls, // 원본 URL 전달 (저장 시 리사이즈됨)
        imageAngles,
        result: analysisResult,
        accessToken: token,
        onProgress: (p, msg) => {
          // 저장은 90-95% (리사이즈 + 업로드)
          const saveProgress = 90 + Math.round(p * 0.05)
          setProgress({
            stage: 'save',
            progress: saveProgress,
            message: msg || '결과 저장 중...',
            estimatedTime: Math.max(0, ESTIMATED_TIMES.save - (p / 100) * ESTIMATED_TIMES.save),
          })
        },
      })

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
      setProgress({
        stage: 'complete',
        progress: 100,
        message: `분석 완료! (총 ${totalTime}초 소요)`,
        estimatedTime: 0,
      })

      return {
        result_id: analysisResult.result_id,
        analysis: analysisResult.analysis,
        mapping: analysisResult.mapping,
        nlg: analysisResult.nlg,
        review_needed: analysisResult.review_needed || false,
        id: saveResult?.id || undefined,
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

