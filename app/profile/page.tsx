'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabaseClient'
import { useAuth } from '@/app/lib/auth'
import { useUserProfile, useAnalysisHistory } from '@/app/lib/data'
import { ArrowLeft, User, Calendar, Mail, LogOut } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/app/components/common/BottomNav'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth()
  const { data: userProfileData, isLoading: profileLoading } = useUserProfile()
  const { data: analyses, isLoading: analysesLoading } = useAnalysisHistory({
    filters: { limit: 10 },
  })

  const loading = profileLoading || analysesLoading
  const userProfile = userProfileData?.profile || {
    id: user?.id,
    email: user?.email,
    name: userProfileData?.user_metadata?.name || '',
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

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
          <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">

          {/* 프로필 정보 */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">프로필 정보</h2>
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">이름</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {userProfile?.name || '미설정'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">이메일</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {userProfile?.email || user?.email}
                  </p>
                </div>
              </div>
              {userProfile?.birth_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">생년월일</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(userProfile.birth_date).toLocaleDateString(
                        'ko-KR'
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 개인정보 처리 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              개인정보 처리 안내
            </h3>
            <p className="text-xs text-blue-800 leading-relaxed">
              사용자의 이미지와 분석 데이터는 익명화되어 저장되며, AI 모델 학습용으로 재사용되지 않습니다. 이미지는 사용자가 삭제 요청 시 즉시 파기됩니다.
            </p>
          </div>

          {/* 분석 기록 */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">분석 기록</h2>
            {!analyses || analyses.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <p className="text-gray-600 mb-4">아직 분석 기록이 없습니다.</p>
                <Link
                  href="/analyze"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  첫 분석 시작하기
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {analyses?.map((analysis: any) => (
                  <Link
                    key={analysis.id}
                    href={`/analysis/${analysis.id}`}
                    className="block bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src={analysis.image_url}
                          alt="분석 이미지"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 mb-2 line-clamp-2">
                          {analysis.result_summary}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(analysis.created_at).toLocaleDateString(
                            'ko-KR',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 로그아웃 */}
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              로그아웃
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

