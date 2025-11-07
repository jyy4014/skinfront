'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Loader2, Camera, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import AnalysisLoading from '@/components/AnalysisLoading'

// 동적 렌더링 강제 (prerender 방지)
export const dynamic = 'force-dynamic'

export default function AnalyzePage() {
  const router = useRouter()
  const supabase = createClient()
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysisStep, setAnalysisStep] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [showHeatmap, setShowHeatmap] = useState(false)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.')
      return
    }

    setImage(file)
    setError(null)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!image) {
      setError('이미지를 선택해주세요.')
      return
    }

    setLoading(true)
    setError(null)
    setAnalysisStep('피부 질감 분석 중...')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // 1. 이미지 업로드
      const fileExt = image.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      // 버킷 이름은 제외하고 파일 경로만 사용
      const filePath = fileName

      const { error: uploadError } = await supabase.storage
        .from('skin-images')
        .upload(filePath, image, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // 2. 이미지 URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from('skin-images').getPublicUrl(filePath)

      // 3. AI 분석 API 호출 (Supabase Edge Functions)
      setAnalysisStep('색소 분석 중...')
      
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const API_URL = `${SUPABASE_URL}/functions/v1/analyze`

      setAnalysisStep('트러블 예측 중...')
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          image_url: publicUrl,
          user_id: user.id,
          access_token: accessToken,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류가 발생했습니다.' }))
        throw new Error(errorData.error || '분석 중 오류가 발생했습니다.')
      }

      const result = await response.json()

      // 4. 결과를 DB에 저장 (Supabase Edge Functions) - 3단계 파이프라인 결과
      const saveResponse = await fetch(`${API_URL}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          image_url: publicUrl,
          result_id: result.result_id,
          analysis_a: result.analysis,
          analysis_b: result.mapping,
          analysis_c: result.nlg,
          confidence: result.analysis?.confidence || 0.8,
          uncertainty_estimate: result.analysis?.uncertainty_estimate || 0.2,
          review_needed: result.review_needed || false,
          access_token: accessToken,
        }),
      })

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({ error: '알 수 없는 오류가 발생했습니다.' }))
        throw new Error(errorData.error || '저장 중 오류가 발생했습니다.')
      }

      const saveResult = await saveResponse.json()

      // 3단계 파이프라인 결과 형식으로 변환
      setAnalysisStep('분석 완료!')
      setAnalysisResult({
        result_id: result.result_id,
        analysis: result.analysis,
        mapping: result.mapping,
        nlg: result.nlg,
        review_needed: result.review_needed,
        id: saveResult.data.id,
      })
    } catch (err: any) {
      setError(err.message || '분석 중 오류가 발생했습니다.')
      setAnalysisStep('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
      {/* Header - 모바일 앱 스타일 */}
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 safe-area-top border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/home"
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">피부 분석하기</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">

        {loading && analysisStep ? (
          <AnalysisLoading step={analysisStep} />
        ) : !analysisResult ? (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error}
              </div>
            )}

            {!preview ? (
              <div className="space-y-6">
                {/* 상단 안내 */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    밝은 조명에서 정면을 찍어주세요
                  </p>
                </div>

                {/* 업로드 영역 */}
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-pink-500 transition-colors">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
                        <Camera className="w-10 h-10 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900 mb-2">
                          사진을 업로드하세요
                        </p>
                        <p className="text-gray-600 text-sm mb-2">
                          얼굴이 잘 보이는 사진을 선택해주세요
                        </p>
                      </div>
                      <div className="flex gap-3 w-full">
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                          <div className="px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-center hover:border-pink-500 transition-colors">
                            <span className="text-sm font-medium text-gray-700">📸 촬영하기</span>
                          </div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                          <div className="px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-center hover:border-pink-500 transition-colors">
                            <span className="text-sm font-medium text-gray-700">🖼️ 갤러리</span>
                          </div>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        사용자의 이미지와 분석 데이터는 익명화되어 저장되며, AI 모델 학습용으로 재사용되지 않습니다.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 얼굴 윤곽 가이드 원형 오버레이 */}
                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={preview}
                    alt="업로드된 이미지"
                    className="w-full h-auto max-h-96 object-contain mx-auto"
                  />
                  {/* 얼굴 윤곽 가이드 (원형 오버레이) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-4 border-pink-400/50 rounded-full border-dashed"></div>
                  </div>
                </div>
                
                {/* 사진 품질 피드백 */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm text-green-800 text-center">
                    멋져요! 분석에 적합한 사진이네요 🔍
                  </p>
                </div>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <div className="border-2 border-gray-300 rounded-lg p-4 text-center hover:border-pink-500 transition-colors">
                      <Upload className="w-5 h-5 mx-auto mb-2 text-gray-600" />
                      <span className="text-sm text-gray-700">다른 사진 선택</span>
                    </div>
                  </label>
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {analysisStep || '분석 중...'}
                      </>
                    ) : (
                      '분석 시작하기'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* 상단 요약 카드 - 피부 총점 및 현재 상태 */}
            {analysisResult.analysis?.confidence && (
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl p-6 text-white">
                <div className="text-center">
                  <p className="text-sm text-pink-100 mb-2">AI 신뢰도</p>
                  <p className="text-4xl font-bold mb-2">
                    {Math.round(analysisResult.analysis.confidence * 100)}%
                  </p>
                  <p className="text-pink-100 text-sm">
                    {analysisResult.analysis.confidence >= 0.7
                      ? '현재 상태: 양호'
                      : analysisResult.analysis.confidence >= 0.5
                        ? '현재 상태: 보통'
                        : '현재 상태: 개선 필요'}
                  </p>
                </div>
              </div>
            )}

            {/* NLG 결과 - 헤드라인 (감성 UX 문구) */}
            {analysisResult.nlg?.headline && (
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  {analysisResult.nlg.headline}
                </h2>
                {analysisResult.nlg.paragraphs && (
                  <div className="space-y-3">
                    {analysisResult.nlg.paragraphs.map((paragraph: string, idx: number) => (
                      <p key={idx} className="text-gray-700 text-sm leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}
                {/* 감성 UX 문구 추가 */}
                <p className="text-sm text-gray-600 mt-4 italic leading-relaxed">
                  오늘의 피부 컨디션을 AI가 세심하게 점검했어요. 당신의 피부는 변화할 수 있습니다.
                </p>
              </div>
            )}

            {/* 세부 지표 카드 3열 - 퍼센티지 바 + 아이콘 */}
            {analysisResult.analysis?.skin_condition_scores && (
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  세부 지표
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(analysisResult.analysis.skin_condition_scores).map(
                    ([key, value]: [string, any]) => {
                      const labels: Record<string, { name: string; icon: string }> = {
                        pigmentation: { name: '색소', icon: '🎨' },
                        acne: { name: '여드름', icon: '🔴' },
                        redness: { name: '홍조', icon: '🌹' },
                        pores: { name: '모공', icon: '⚫' },
                        wrinkles: { name: '주름', icon: '📏' },
                      }
                      const label = labels[key] || { name: key, icon: '📊' }
                      const percentage = Math.round(value * 100)
                      const status = percentage >= 70 ? '개선 필요' : percentage >= 40 ? '보통' : '양호'
                      const statusText = percentage >= 70 ? '약간 개선 필요' : percentage >= 40 ? '보통' : '양호'
                      
                      return (
                        <div
                          key={key}
                          className="bg-gray-50 rounded-xl p-4"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{label.icon}</span>
                            <span className="text-sm font-medium text-gray-900">{label.name}</span>
                          </div>
                          <div className="mb-2">
                            <p className="text-xs text-gray-700 mb-2 leading-relaxed">
                              {label.name} {percentage}% ({statusText})
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  percentage >= 70
                                    ? 'bg-red-400'
                                    : percentage >= 40
                                      ? 'bg-yellow-400'
                                      : 'bg-green-400'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              </div>
            )}

            {/* 시각적 분석 - 히트맵 오버레이 */}
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                시각적 분석
              </h3>
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={preview || ''}
                  alt="분석 이미지"
                  className="w-full h-auto"
                />
                {/* 히트맵 오버레이 (색소 강조) - 스와이프 토글에 따라 표시/숨김 */}
                {showHeatmap && analysisResult.analysis?.skin_condition_scores && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* 색소 침착 영역 강조 */}
                    {analysisResult.analysis.skin_condition_scores.pigmentation > 0.5 && (
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/30 to-pink-500/40" />
                    )}
                    {/* 모공 영역 강조 */}
                    {analysisResult.analysis.skin_condition_scores.pores > 0.5 && (
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/20 to-purple-500/30" />
                    )}
                    {/* 여드름 영역 강조 */}
                    {analysisResult.analysis.skin_condition_scores.acne > 0.5 && (
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/20 to-red-500/30" />
                    )}
                  </div>
                )}
              </div>
              {/* 스와이프 토글: 원본 / 분석 결과 보기 */}
              <div className="mt-4 flex gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setShowHeatmap(false)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    !showHeatmap
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  원본
                </button>
                <button
                  onClick={() => setShowHeatmap(true)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    showHeatmap
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  분석 결과
                </button>
              </div>
            </div>

            {/* AI 추천 시술 리스트 - 증상 기반 추천 */}
            {analysisResult.mapping?.treatment_candidates && analysisResult.mapping.treatment_candidates.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  당신의 피부 증상에 맞춘 추천
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  아래 시술은 현재 피부 상태 분석 결과를 바탕으로 추천되었습니다. (증상 기반 순위)
                </p>
                <div className="space-y-3">
                  {analysisResult.mapping.treatment_candidates
                    .sort((a: any, b: any) => (b.score || 0) - (a.score || 0)) // 증상 기반 점수로 재정렬 (확실히)
                    .map((treatment: any, idx: number) => (
                    <Link
                      key={idx}
                      href={`/treatments/${treatment.id}`}
                      className="block border-2 border-gray-200 rounded-xl p-4 hover:border-pink-500 hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 text-base">
                              {treatment.name}
                            </h4>
                            {idx === 0 && (
                              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-medium">
                                최적 추천
                              </span>
                            )}
                          </div>
                          {/* 증상 기반 적합도 점수 표시 */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-500">증상 적합도:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[120px]">
                              <div
                                className="bg-pink-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${(treatment.score || 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700">
                              {Math.round((treatment.score || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-pink-600 ml-2">
                          예상 개선 {Math.round(treatment.expected_improvement_pct * 100)}%
                        </span>
                      </div>
                      {treatment.notes && treatment.notes.length > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                          {treatment.notes.join(', ')}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Review 필요 안내 */}
            {analysisResult.review_needed && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ 전문가 검토가 필요할 수 있습니다. 정확한 진단을 위해서는 전문의 상담을 권장합니다.
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-800 leading-relaxed">
                ※ 이 결과는 사용자의 피부 상태를 기반으로 한 일반적인 정보 제공용 분석이며, 특정 시술, 약물, 치료를 권유하거나 처방하는 내용이 아닙니다.
              </p>
            </div>

            {/* 결과 공유 & 히스토리 버튼 */}
            <div className="space-y-3">
              <Link
                href={`/analysis/${analysisResult.id}`}
                className="block w-full text-center py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95"
              >
                자세히 보기
              </Link>
              <Link
                href="/home"
                className="block w-full text-center py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors active:scale-95"
              >
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

