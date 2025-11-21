'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, TrendingUp, DollarSign, Clock, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/app/lib/auth'
import {
  useTreatmentById,
  useFavoriteTreatments,
  useTreatmentFromRecentAnalysis,
  useToggleFavoriteTreatment,
} from '@/app/lib/data'
import { useToast } from '@/app/hooks/useToast'
import { ErrorMessage } from '@/app/lib/ui'
import Header from '@/app/components/common/Header'
import BottomNav from '@/app/components/common/BottomNav'
import Button from '@/app/components/ui/Button'

const formatCurrency = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  return `₩${value.toLocaleString('ko-KR')}`
}

const formatPercentage = (value?: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.max(0, Math.round(value * 100))
}

export default function TreatmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToast()

  const treatmentId = params?.id as string

  const { data: treatment, isLoading, isError } = useTreatmentById(treatmentId)
  const { data: favoriteTreatments = [] } = useFavoriteTreatments()
  const { data: analysisInfo } = useTreatmentFromRecentAnalysis(treatmentId)
  const { toggleFavorite, isPending: isToggling } = useToggleFavoriteTreatment()

  const isFavorite = favoriteTreatments.includes(treatmentId)

  const handleFavoriteClick = async () => {
    if (!user) {
      router.push('/auth/login')
      toast.error('로그인이 필요합니다.')
      return
    }

    try {
      await toggleFavorite(treatmentId)
      toast.success(
        isFavorite ? '관심 시술에서 제거되었습니다.' : '관심 시술로 등록되었습니다.'
      )
    } catch (error) {
      toast.error('오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
        <Header title="시술 상세" showBack backHref="/home" />
        <main className="max-w-md mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  if (isError || !treatment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
        <Header title="시술 상세" showBack backHref="/home" />
        <main className="max-w-md mx-auto px-4 py-6">
          <ErrorMessage error="시술 정보를 찾을 수 없습니다." />
        </main>
        <BottomNav />
      </div>
    )
  }

  const analysisTreatment = analysisInfo?.treatment
  const nlg = analysisInfo?.nlg

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
      <Header title="시술 상세" showBack backHref="/home" />
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 시술 기본 정보 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{treatment.name}</h1>
              <p className="text-gray-600 text-sm leading-relaxed">{treatment.description}</p>
            </div>
            <button
              onClick={handleFavoriteClick}
              disabled={isToggling}
              aria-label={isFavorite ? '관심 시술 해제' : '관심 시술 등록'}
              className={`p-2 rounded-full transition-colors ${
                isFavorite
                  ? 'bg-pink-100 text-pink-600'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          {treatment.benefits && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-1">효과</p>
              <p className="text-sm text-blue-800">{treatment.benefits}</p>
            </div>
          )}
        </div>

        {/* AI 맞춤 설명 */}
        {analysisTreatment && nlg && (
          <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-pink-500 text-white text-xs font-semibold rounded-full">
                AI 추천 시술
              </span>
              {analysisTreatment.score !== undefined && (
                <span className="text-sm font-medium text-gray-700">
                  적합도 {formatPercentage(analysisTreatment.score)}%
                </span>
              )}
            </div>
            {nlg.headline && <h2 className="text-lg font-bold text-gray-900 mb-2">{nlg.headline}</h2>}
            {nlg.paragraphs && nlg.paragraphs.length > 0 && (
              <div className="space-y-2">
                {nlg.paragraphs.map((paragraph: string, idx: number) => (
                  <p key={idx} className="text-sm text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
            {analysisTreatment.expected_improvement_pct !== undefined && (
              <div className="mt-4 p-3 bg-white/60 rounded-lg">
                <p className="text-xs font-semibold text-gray-600 mb-1">예상 개선률</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatPercentage(analysisTreatment.expected_improvement_pct)}%
                </p>
              </div>
            )}
          </div>
        )}

        {/* 시술 상세 정보 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">시술 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            {treatment.cost && (
              <div className="flex items-start gap-2">
                <DollarSign className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">예상 비용</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(treatment.cost) || '상담 후 결정'}
                  </p>
                </div>
              </div>
            )}
            {treatment.duration_minutes && (
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">소요 시간</p>
                  <p className="text-sm font-semibold text-gray-900">
                    약 {treatment.duration_minutes}분
                  </p>
                </div>
              </div>
            )}
            {treatment.recovery_time && (
              <div className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">회복 기간</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {treatment.recovery_time}
                  </p>
                </div>
              </div>
            )}
            {treatment.risk_level && (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">위험도</p>
                  <p className="text-sm font-semibold text-gray-900">{treatment.risk_level}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 주의사항 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-3">주의사항</h2>
          <div className="space-y-2 text-sm text-gray-600">
            {treatment.risk_level && <p>위험도: {treatment.risk_level}</p>}
            <p className="text-xs text-gray-500 leading-relaxed">
              본 서비스는 의료행위 또는 전문적 진단을 대체하지 않습니다. 정확한 판단은 전문의
              상담을 권장드립니다.
            </p>
          </div>
        </div>

        {/* CTA 버튼 */}
        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => router.push('/home')}
          >
            홈으로
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => router.push('/analyze')}
          >
            내 피부 분석하기
          </Button>
        </div>

        {/* 뒤로가기 */}
        <Link
          href="/home"
          className="block text-center text-sm text-gray-500 hover:text-gray-700"
        >
          뒤로가기
        </Link>
      </main>
      <BottomNav />
    </div>
  )
}
