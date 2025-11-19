'use client'

import { useState } from 'react'
import BottomNav from '@/app/components/common/BottomNav'
import Header from '@/app/components/common/Header'
import AnalysisLoading from '@/app/components/analysis/ProgressLoader'
import { ErrorMessage } from '@/app/lib/ui'
import ResultView from '@/app/features/analysis/ResultView'
import { useAnalysisFlow } from '@/app/features/analysis/hooks'
import { useToast } from '@/app/hooks/useToast'
import { classifyError, ErrorType } from '@/app/lib/error'
import { ImageUploadSection } from '@/app/features/analyze/components/ImageUploadSection'
import { ImagePreviewSection } from '@/app/features/analyze/components/ImagePreviewSection'
import { useImagePreview } from '@/app/features/analyze/hooks/useImagePreview'
import { useImageQuality } from '@/app/hooks/useImageQuality'
import type { AnalysisResult } from '@/app/features/analyze/types'
import type { ImageQualityResult } from '@/app/lib/image/quality-check'

// 동적 렌더링 강제 (prerender 방지)
export const dynamic = 'force-dynamic'

export default function AnalyzePage() {
  const [images, setImages] = useState<File[]>([])
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [quality, setQuality] = useState<ImageQualityResult | null>(null)
  
  const { preview, createPreview, clearPreview } = useImagePreview()
  const { uploadAndAnalyze, loading, error, progress } = useAnalysisFlow()
  const { checkQuality, checking: qualityChecking } = useImageQuality()
  const toast = useToast()

  const handleFileSelect = async (files: File[]) => {
    setProcessing(true)
    setImages(files)
    setQuality(null) // 이전 품질 결과 초기화
    
    try {
      // 첫 번째 이미지(정면)를 미리보기로 사용
      if (files.length > 0) {
        await createPreview(files[0])
        
        // 이미지 품질 검사 (첫 번째 이미지 기준)
        try {
          const qualityResult = await checkQuality(files[0])
          setQuality(qualityResult)
          
          // 품질이 낮으면 경고 메시지
          if (!qualityResult.isGood) {
            toast.warning('이미지 품질이 낮습니다. 재촬영을 권장합니다.')
          } else if (qualityResult.overallScore >= 80) {
            toast.success('완벽한 사진이에요! 분석을 시작할 수 있습니다.')
          }
        } catch (qualityError) {
          // 품질 검사 실패는 무시 (분석은 계속 진행 가능)
          console.warn('Quality check failed:', qualityError)
        }
      }
    } catch (err) {
      toast.error('이미지 미리보기 생성에 실패했습니다.')
      console.error('Preview creation error:', err)
    } finally {
      setProcessing(false)
    }
  }

  const handleAnalyze = async () => {
    if (images.length === 0) {
      toast.error('이미지를 선택해주세요.')
      return
    }

    // 3개 이미지인 경우에만 분석 가능 (선택사항: 단일 이미지도 허용하려면 이 검증 제거)
    if (images.length !== 3) {
      toast.warning('정면, 좌측, 우측 3장의 사진이 필요합니다. 카메라로 촬영해주세요.')
      return
    }

    try {
      const result = await uploadAndAnalyze(images)
      setAnalysisResult(result as AnalysisResult)
      toast.success('분석이 완료되었습니다!')
    } catch (err) {
      const classified = classifyError(err)
      
      // 에러 타입별 처리
      if (classified.type === ErrorType.NETWORK) {
        toast.error(classified.message, 8000)
      } else if (classified.type === ErrorType.MODEL) {
        toast.warning(classified.message, 6000)
      } else if (classified.type === ErrorType.VALIDATION) {
        toast.error(classified.message, 5000)
      } else {
        toast.error(classified.message)
      }
      
      // 재시도 가능한 에러는 상태에 저장 (재시도 버튼 표시용)
      if (classified.retryable) {
        // 에러는 이미 error 상태에 저장됨
      }
    }
  }
  
  const handleRetry = () => {
    // 에러 상태 초기화 후 재시도
    setAnalysisResult(null)
    handleAnalyze()
  }

  const handleReset = () => {
    setImages([])
    clearPreview()
    setAnalysisResult(null)
    setQuality(null)
  }

  const handleRetake = () => {
    handleReset()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
      <Header title="피부 분석하기" showBack backHref="/home" />

      <main className="max-w-md mx-auto px-4 py-6">
        {loading && progress ? (
          <AnalysisLoading 
            step={progress.message} 
            progress={progress.progress}
            stage={progress.stage}
          />
        ) : !analysisResult ? (
          <div>
            {error && (
              <div className="mb-6 space-y-3">
                <ErrorMessage error={error} dismissible />
                {(() => {
                  const classified = classifyError(error)
                  if (classified.retryable) {
                    return (
                      <button
                        onClick={handleRetry}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                        aria-label="다시 시도"
                      >
                        {loading ? '재시도 중...' : '다시 시도'}
                      </button>
                    )
                  }
                  return null
                })()}
              </div>
            )}

            {!preview ? (
              <ImageUploadSection 
                onFileSelect={handleFileSelect}
                processing={processing}
              />
            ) : (
              <div className="bg-white rounded-xl p-6">
                <ImagePreviewSection
                  preview={preview}
                  onReset={handleReset}
                  onAnalyze={handleAnalyze}
                  analyzing={loading}
                  processing={processing}
                  quality={quality}
                  qualityChecking={qualityChecking}
                  onRetake={handleRetake}
                />
              </div>
            )}
          </div>
        ) : (
          <ResultView
            analysis={analysisResult.analysis}
            mapping={analysisResult.mapping}
            nlg={analysisResult.nlg}
            preview={preview}
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
            resultId={analysisResult.id}
          />
        )}
      </main>

      <BottomNav />
    </div>
  )
}
