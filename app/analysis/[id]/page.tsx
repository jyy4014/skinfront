'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAnalysisById } from '@/app/lib/data/queries/analysis'
import { useRequireAuth } from '@/app/lib/auth/hooks/useRequireAuth'
import Header from '@/app/components/common/Header'
import BottomNav from '@/app/components/common/BottomNav'
import ResultView from '@/app/features/analysis/ResultView'
import { ErrorMessage } from '@/app/lib/ui'
import { LoadingSpinner } from '@/app/lib/ui'

export default function AnalysisDetailPage() {
  const params = useParams()
  const router = useRouter()
  const auth = useRequireAuth()
  const analysisId = params?.id as string

  const { data: analysis, isLoading, isError } = useAnalysisById(analysisId)
  const [preview, setPreview] = useState<string | null>(null)
  const [showHeatmap, setShowHeatmap] = useState(false)

  useEffect(() => {
    if (auth.loading) return
    if (!auth.isAuthenticated) {
      router.push('/auth/login')
    }
  }, [auth.loading, auth.isAuthenticated, router])

  useEffect(() => {
    if (analysis?.image_url) {
      setPreview(analysis.image_url)
    }
  }, [analysis])

  if (auth.loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
        <Header title="분석 결과" showBack backHref="/history" />
        <main className="max-w-md mx-auto px-4 py-6">
          <div className="text-center py-12">
            <LoadingSpinner />
            <p className="text-gray-600 mt-4">로딩 중...</p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  if (isError || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
        <Header title="분석 결과" showBack backHref="/history" />
        <main className="max-w-md mx-auto px-4 py-6">
          <ErrorMessage message="분석 결과를 찾을 수 없습니다." />
        </main>
        <BottomNav />
      </div>
    )
  }

  // 분석 데이터 구조 변환
  const analysisData = analysis.analysis_data || {}
  const stageA = analysisData.analysis_a || analysis.stage_a_vision_result || {}
  const stageB = analysisData.analysis_b || analysis.stage_b_mapping_result || {}
  const stageC = analysisData.analysis_c || analysis.stage_c_nlg_result || {}

  const analysisResult = {
    id: analysis.id,
    image_urls: analysis.image_urls || (analysis.image_url ? [analysis.image_url] : []),
    image_angles: analysis.image_angles || ['front'],
    analysis: {
      skin_condition_scores: stageA.skin_condition_scores || {},
      masks: stageA.masks || [],
      metrics: stageA.metrics || {},
      confidence: stageA.confidence || analysis.confidence || 0.8,
      uncertainty: stageA.uncertainty_estimate || analysis.uncertainty_estimate || 0.2,
      model_version: stageA.model_version || analysis.model_version_a,
    },
    mapping: {
      treatment_candidates: stageB.treatment_candidates || [],
      mapping_version: stageB.mapping_version || analysis.model_version_b,
      applied_rules: stageB.applied_rules || [],
    },
    nlg: {
      headline: stageC.headline || analysis.result_summary || '분석 완료',
      paragraphs: stageC.paragraphs || [],
      cta: stageC.cta,
    },
    review_needed: analysis.review_needed || false,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
      <Header title="분석 결과" showBack backHref="/history" />
      <main className="max-w-md mx-auto">
        <ResultView
          analysis={analysisResult.analysis}
          mapping={analysisResult.mapping}
          nlg={analysisResult.nlg}
          preview={preview}
          showHeatmap={showHeatmap}
          onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
          resultId={analysisResult.id}
        />
      </main>
      <BottomNav />
    </div>
  )
}
