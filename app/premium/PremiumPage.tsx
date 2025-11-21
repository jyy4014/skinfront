'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/app/lib/auth/hooks/useRequireAuth'
import { 
  ArrowLeft, 
  Crown, 
  Check, 
  Sparkles,
  Zap,
  Shield,
  Star
} from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/app/components/common/BottomNav'
import { LoadingSpinner } from '@/app/lib/ui'
import { designTokens } from '@/app/styles/design-tokens'
import { useToast } from '@/app/hooks/useToast'
import Button from '@/app/components/ui/Button'
import Card from '@/app/components/ui/Card'

interface PremiumFeature {
  icon: React.ReactNode
  title: string
  description: string
}

const premiumFeatures: PremiumFeature[] = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: '무제한 분석',
    description: '하루에 원하는 만큼 피부를 분석할 수 있습니다',
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: '고급 리포트',
    description: '더 상세한 분석 결과와 개선 추천을 받을 수 있습니다',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: '우선 지원',
    description: '프리미엄 고객 전용 고객 지원을 받을 수 있습니다',
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: '특별 혜택',
    description: '제휴 병원 할인 및 특별 이벤트에 우선 참여',
  },
]

export default function PremiumPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useRequireAuth()
  const toast = useToast()
  const [isSubscribing, setIsSubscribing] = useState(false)

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    )
  }

  const handleSubscribe = async () => {
    setIsSubscribing(true)
    // TODO: 실제 결제 연동
    setTimeout(() => {
      setIsSubscribing(false)
      toast.info('프리미엄 기능은 곧 출시될 예정입니다.')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
      {/* Header */}
      <header 
        className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 safe-area-top border-b"
        style={{
          borderColor: designTokens.colors.border.subtle,
        }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 -ml-2 rounded-lg transition-colors"
            style={{ color: designTokens.colors.gray[600] }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = designTokens.colors.gray[100]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 
            className="text-xl font-bold"
            style={{ color: designTokens.colors.text.primary }}
          >
            프리미엄
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 프리미엄 헤더 */}
        <div 
          className="rounded-2xl shadow-lg p-8 text-center relative overflow-hidden"
          style={{
            background: designTokens.gradients.primary,
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white blur-2xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="mb-4 flex justify-center">
              <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
                <Crown className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              프리미엄 멤버십
            </h2>
            <p className="text-white/90 text-lg mb-6">
              더 많은 기능과 혜택을 누려보세요
            </p>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white text-2xl font-bold mb-1">
                월 ₩9,900
              </p>
              <p className="text-white/80 text-sm">
                또는 연간 ₩99,000 (월 ₩8,250)
              </p>
            </div>
          </div>
        </div>

        {/* 프리미엄 기능 */}
        <div 
          className="rounded-2xl shadow-lg p-6"
          style={{
            backgroundColor: designTokens.colors.surface.base,
            border: `1px solid ${designTokens.colors.border.subtle}`,
          }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: designTokens.colors.text.primary }}
          >
            프리미엄 혜택
          </h3>
          <div className="space-y-4">
            {premiumFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl"
                style={{
                  backgroundColor: designTokens.colors.surface.muted,
                }}
              >
                <div 
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{
                    backgroundColor: designTokens.colors.primary[100],
                    color: designTokens.colors.primary[600],
                  }}
                >
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h4 
                    className="font-semibold mb-1"
                    style={{ color: designTokens.colors.text.primary }}
                  >
                    {feature.title}
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: designTokens.colors.text.secondary }}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 비교표 */}
        <div 
          className="rounded-2xl shadow-lg p-6"
          style={{
            backgroundColor: designTokens.colors.surface.base,
            border: `1px solid ${designTokens.colors.border.subtle}`,
          }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: designTokens.colors.text.primary }}
          >
            무료 vs 프리미엄
          </h3>
          <div className="space-y-3">
            {[
              { feature: '일일 분석 횟수', free: '3회', premium: '무제한' },
              { feature: '분석 리포트', free: '기본', premium: '고급' },
              { feature: '고객 지원', free: '일반', premium: '우선 지원' },
              { feature: '제휴 혜택', free: '없음', premium: '할인 및 이벤트' },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  backgroundColor: designTokens.colors.surface.muted,
                }}
              >
                <span 
                  className="text-sm font-medium"
                  style={{ color: designTokens.colors.text.primary }}
                >
                  {item.feature}
                </span>
                <div className="flex items-center gap-4">
                  <span 
                    className="text-sm"
                    style={{ color: designTokens.colors.text.secondary }}
                  >
                    {item.free}
                  </span>
                  <span 
                    className="text-sm font-semibold"
                    style={{ color: designTokens.colors.primary[600] }}
                  >
                    {item.premium}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 구독 버튼 */}
        <div className="space-y-3">
          <Button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            isLoading={isSubscribing}
            className="w-full"
            style={{
              background: designTokens.gradients.primary,
            }}
          >
            <Crown className="w-5 h-5 mr-2" />
            프리미엄 구독하기
          </Button>
          <p 
            className="text-xs text-center"
            style={{ color: designTokens.colors.text.tertiary }}
          >
            언제든지 구독을 취소할 수 있습니다
          </p>
        </div>

        {/* 법적 고려 문구 */}
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <p className="text-xs text-yellow-800 leading-relaxed">
            <strong>⚠️ 참고용 안내</strong>
          </p>
          <p className="text-xs text-yellow-700 leading-relaxed mt-1">
            프리미엄 멤버십은 추가 기능을 제공하며, 의료 진단 서비스가 아닙니다.
            모든 분석 결과는 참고용이며, 정확한 판단은 전문의 상담을 권장드립니다.
          </p>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}



