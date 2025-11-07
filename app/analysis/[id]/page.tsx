'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AnalysisDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalysis()
  }, [params.id])

  const fetchAnalysis = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('skin_analysis')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setAnalysis(data)
    } catch (error) {
      console.error('Error fetching analysis:', error)
    } finally {
      setLoading(false)
    }
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          뒤로가기
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              분석 결과
            </h1>
            <p className="text-gray-600">
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

          {recommendations.length > 0 && (
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
              href="/analyze"
              className="flex-1 text-center py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              새로 분석하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

