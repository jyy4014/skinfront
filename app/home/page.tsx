'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, History, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import RecommendedTreatments from '@/components/RecommendedTreatments'

interface SkinAnalysis {
  id: string
  image_url: string
  result_summary: string
  created_at: string
}

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [recentAnalysis, setRecentAnalysis] = useState<SkinAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    fetchRecentAnalysis()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
    setLoading(false)
  }

  const fetchRecentAnalysis = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('skin_analysis')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (data && data.length > 0 && !error) {
      setRecentAnalysis(data[0])
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">피부 분석</h1>
          <div className="flex gap-2">
            <Link
              href="/profile"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <User className="w-5 h-5 text-gray-600" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Main CTA */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl p-8 text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-4">오늘의 피부 분석하기</h2>
          <p className="text-pink-100 mb-6">
            사진 한 장으로 당신의 피부 상태를 분석하고 맞춤형 시술을 추천받으세요
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 bg-white text-pink-600 px-6 py-3 rounded-lg font-semibold hover:bg-pink-50 transition-colors"
          >
            <Camera className="w-5 h-5" />
            사진 업로드하기
          </Link>
          <p className="text-xs text-pink-100 mt-4 opacity-90">
            본 서비스는 의료행위 또는 전문적 진단을 대체하지 않습니다. AI 분석 결과는 참고용 정보이며, 정확한 진단이나 치료를 위해서는 반드시 전문 의료인의 상담이 필요합니다.
          </p>
        </div>

        {/* Recent Analysis */}
        {recentAnalysis && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                최근 분석 결과
              </h3>
            </div>
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={recentAnalysis.image_url}
                  alt="분석 이미지"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-gray-700 mb-2 line-clamp-2">
                  {recentAnalysis.result_summary}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(recentAnalysis.created_at).toLocaleDateString(
                    'ko-KR'
                  )}
                </p>
                <Link
                  href={`/analysis/${recentAnalysis.id}`}
                  className="text-pink-600 hover:text-pink-700 text-sm font-medium mt-2 inline-block"
                >
                  자세히 보기 →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Treatments */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            추천 시술
          </h3>
          <RecommendedTreatments />
        </div>
      </main>
    </div>
  )
}

