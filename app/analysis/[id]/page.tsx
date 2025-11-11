'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAnalysisById } from '@/app/lib/data'
import { useAuth } from '@/app/lib/auth'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/app/components/common/BottomNav'

export default function AnalysisDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { data: analysis, isLoading: loading, error } = useAnalysisById(
    params.id as string
  )

  if (!user) {
    router.push('/auth/login')
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">분석 결과를 찾을 수 없습니다.</p>
          <Link
            href="/home"
            className="text-pink-600 hover:text-pink-700 font-semibold"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const analysisData = analysis.analysis_data || {}
  const recommendations = analysis.recommended_treatments || []

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
          <h1 className="text-xl font-bold text-gray-900">분석 결과</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              {new Date(analysis.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl overflow-hidden bg-gray-100">
              <img
                src={analysis.image_url}
                alt="분석 이미지"
                className="w-full h-auto"
              />
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI 분석 결과
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  일반적인 피부 특성 분석
                </p>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {analysis.result_summary}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  추천 항목은 참고용이며, 의료 전문가의 진단을 대체하지 않습니다.
                </p>
              </div>

              {Object.keys(analysisData).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    상세 분석
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(analysisData).map(
                      ([key, value]: [string, any]) => (
                        <div
                          key={key}
                          className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                        >
                          <span className="text-gray-700 capitalize">
                            {key === 'pores'
                              ? '모공'
                              : key === 'acne'
                                ? '여드름'
                                : key === 'tone'
                                  ? '피부톤'
                                  : key === 'spots'
                                    ? '잡티'
                                    : key}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {value}/100
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 증상 기반 추천 시술 */}
          {analysisData.analysis_b?.treatment_candidates && analysisData.analysis_b.treatment_candidates.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                당신의 피부 증상에 맞춘 추천
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                아래 시술은 이 분석 결과를 바탕으로 추천되었습니다. (증상 기반 순위)
              </p>
              <div className="space-y-3">
                {analysisData.analysis_b.treatment_candidates
                  .sort((a: any, b: any) => (b.score || 0) - (a.score || 0)) // 증상 기반 점수로 정렬
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
                        예상 개선 {Math.round((treatment.expected_improvement_pct || 0) * 100)}%
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
          ) : recommendations.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                추천 시술
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {recommendations.map((rec: any, idx: number) => (
                  <Link
                    key={idx}
                    href={`/treatments/${idx + 1}`}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-pink-500 hover:shadow-md transition-all"
                  >
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {rec.name || rec}
                    </h4>
                    {rec.reason && (
                      <p className="text-sm text-gray-600">{rec.reason}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-blue-800 leading-relaxed">
              ※ 이 결과는 사용자의 피부 상태를 기반으로 한 일반적인 정보 제공용 분석이며, 특정 시술, 약물, 치료를 권유하거나 처방하는 내용이 아닙니다.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/analyze"
              className="block w-full text-center py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95"
            >
              새로 분석하기
            </Link>
            <Link
              href="/home"
              className="block w-full text-center py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors active:scale-95"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

