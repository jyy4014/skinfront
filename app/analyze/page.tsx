'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Loader2, Camera } from 'lucide-react'
import Link from 'next/link'

export default function AnalyzePage() {
  const router = useRouter()
  const supabase = createClient()
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

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
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const API_URL = `${SUPABASE_URL}/functions/v1/analyze`

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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/home"
          className="text-gray-600 hover:text-gray-900 mb-6 inline-block"
        >
          ← 뒤로가기
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          피부 분석하기
        </h1>

        {!analysisResult ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error}
              </div>
            )}

            {!preview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-pink-500 transition-colors">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900 mb-2">
                        사진을 업로드하세요
                      </p>
                      <p className="text-gray-600 mb-2">
                        얼굴이 잘 보이는 사진을 선택해주세요
                      </p>
                      <p className="text-xs text-gray-500">
                        사용자의 이미지와 분석 데이터는 익명화되어 저장되며, AI 모델 학습용으로 재사용되지 않습니다. 이미지는 사용자가 삭제 요청 시 즉시 파기됩니다.
                      </p>
                    </div>
                    <button className="px-6 py-3 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 transition-colors">
                      파일 선택
                    </button>
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={preview}
                    alt="업로드된 이미지"
                    className="w-full h-auto max-h-96 object-contain mx-auto"
                  />
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
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        분석 중...
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
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                분석 완료!
              </h2>
              <p className="text-gray-600">당신의 피부 상태를 확인해보세요</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={preview || ''}
                  alt="분석 이미지"
                  className="w-full h-auto"
                />
              </div>
              <div className="space-y-4">
                {/* NLG 결과 표시 (3단계 파이프라인) */}
                {analysisResult.nlg && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {analysisResult.nlg.headline}
                    </h3>
                    <div className="space-y-2">
                      {analysisResult.nlg.paragraphs.map((paragraph: string, idx: number) => (
                        <p key={idx} className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* 상세 분석 (단계 A 결과) */}
                {analysisResult.analysis?.skin_condition_scores && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      상세 분석
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(analysisResult.analysis.skin_condition_scores).map(
                        ([key, value]: [string, any]) => (
                          <div
                            key={key}
                            className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                          >
                            <span className="text-gray-700">
                              {key === 'pigmentation'
                                ? '색소 침착'
                                : key === 'acne'
                                  ? '여드름'
                                  : key === 'redness'
                                    ? '홍조'
                                    : key === 'pores'
                                      ? '모공'
                                      : key === 'wrinkles'
                                        ? '주름'
                                        : key}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {Math.round(value * 100)}%
                            </span>
                          </div>
                        )
                      )}
                    </div>
                    {analysisResult.analysis.confidence && (
                      <p className="text-xs text-gray-500 mt-2">
                        신뢰도: {Math.round(analysisResult.analysis.confidence * 100)}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 추천 시술 (단계 B 결과) */}
            {analysisResult.mapping?.treatment_candidates && analysisResult.mapping.treatment_candidates.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  비교적 자주 선택되는 옵션
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {analysisResult.mapping.treatment_candidates.map((treatment: any, idx: number) => (
                    <Link
                      key={idx}
                      href={`/treatments/${treatment.id}`}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-pink-500 hover:shadow-md transition-all"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {treatment.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {treatment.notes.join(', ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        예상 개선률: {Math.round(treatment.expected_improvement_pct * 100)}%
                      </p>
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

            <div className="flex gap-4">
              <Link
                href="/home"
                className="flex-1 text-center py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                홈으로
              </Link>
              <Link
                href={`/analysis/${analysisResult.id}`}
                className="flex-1 text-center py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                자세히 보기
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

