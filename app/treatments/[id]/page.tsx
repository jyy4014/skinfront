'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabaseClient'
import { ArrowLeft, Clock, DollarSign, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Treatment {
  id: string
  name: string
  description: string
  benefits: string
  cost: number
  recovery_time: string
  risk_level: string
  duration_minutes: number
}

export default function TreatmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [treatment, setTreatment] = useState<Treatment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTreatment()
  }, [params.id])

  const fetchTreatment = async () => {
    try {
      const treatmentId = params.id as string
      
      // DB에서 시술 정보 조회
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .eq('id', treatmentId)
        .single()

      if (error) {
        // DB 조회 실패 시 샘플 데이터 사용
        const sampleTreatments: Treatment[] = [
          {
            id: '1',
            name: '프락셀 레이저',
            description: '레이저를 이용한 모공 및 잡티 개선 시술로, 피부 재생을 촉진하여 더욱 건강하고 매끄러운 피부를 만들어줍니다.',
            benefits: '모공 축소, 잡티 제거, 피부결 개선, 피부 재생',
            cost: 200000,
            recovery_time: '3-7일',
            risk_level: '중',
            duration_minutes: 30,
          },
          {
            id: '2',
            name: '토닝 레이저',
            description: '피부톤 균일화를 위한 레이저 시술로, 색소 침착을 개선하고 더욱 밝고 균일한 피부톤을 만들어줍니다.',
            benefits: '색소 침착 개선, 피부톤 균일화, 잡티 제거',
            cost: 150000,
            recovery_time: '1-3일',
            risk_level: '낮음',
            duration_minutes: 20,
          },
          {
            id: '3',
            name: '리쥬란 힐러',
            description: '주름 개선 및 피부 탄력 향상을 위한 시술로, 콜라겐 생성을 촉진하여 더욱 탄력있고 윤기있는 피부를 만들어줍니다.',
            benefits: '주름 개선, 탄력 증진, 윤기 개선, 피부 재생',
            cost: 300000,
            recovery_time: '1-2일',
            risk_level: '낮음',
            duration_minutes: 30,
          },
        ]

        const found = sampleTreatments.find((t) => t.id === treatmentId)
        if (found) {
          setTreatment(found)
        } else {
          throw new Error('시술 정보를 찾을 수 없습니다.')
        }
      } else {
        setTreatment(data as Treatment)
      }
    } catch (error) {
      console.error('Error fetching treatment:', error)
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

  if (!treatment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">시술 정보를 찾을 수 없습니다.</p>
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
          <h1 className="text-4xl font-bold text-gray-900">{treatment.name}</h1>

          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed">
              {treatment.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-pink-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                효과
              </h3>
              <p className="text-gray-700">{treatment.benefits}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">예상 비용</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {treatment.cost.toLocaleString()}원
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">소요 시간</p>
                  <p className="text-lg font-semibold text-gray-900">
                    약 {treatment.duration_minutes}분
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">회복 기간</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {treatment.recovery_time}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 mb-1">주의사항</p>
                <p className="text-sm text-yellow-800 mb-2">
                  위험도: {treatment.risk_level} | 시술 전 전문의 상담을 권장합니다. 본 정보는 참고용이며, 실제 시술은 전문의와 상담하시기 바랍니다.
                </p>
                <p className="text-xs text-yellow-700">
                  본 서비스는 의료행위 또는 전문적 진단을 대체하지 않습니다. AI 분석 결과는 참고용 정보이며, 정확한 진단이나 치료를 위해서는 반드시 전문 의료인의 상담이 필요합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              관련 후기
            </h3>
            <p className="text-gray-600 text-sm">
              후기 기능은 곧 추가될 예정입니다.
            </p>
          </div>

          <div className="flex gap-4">
            <Link
              href="/home"
              className="flex-1 text-center py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              홈으로
            </Link>
            <button
              onClick={() => router.push('/analyze')}
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              내 피부 분석하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

