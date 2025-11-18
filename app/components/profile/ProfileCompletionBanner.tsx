'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, User } from 'lucide-react'
import { calculateProfileCompletion, getProfileCompletionMessage } from '@/app/lib/utils/profileCompletion'
import { useUserProfile } from '@/app/lib/data'

interface ProfileCompletionBannerProps {
  onDismiss?: () => void
}

export default function ProfileCompletionBanner({ onDismiss }: ProfileCompletionBannerProps) {
  const router = useRouter()
  const { data: userProfile } = useUserProfile()
  const [dismissed, setDismissed] = useState(false)

  // 로컬 스토리지에서 "나중에" 클릭 여부 확인
  const [isPostponed, setIsPostponed] = useState(() => {
    if (typeof window === 'undefined') return false
    const postponed = localStorage.getItem('profile_completion_postponed')
    if (postponed) {
      const postponedDate = new Date(postponed)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      // 7일이 지났으면 다시 표시
      return postponedDate > sevenDaysAgo
    }
    return false
  })

  if (dismissed || isPostponed) {
    return null
  }

  const profile = userProfile?.profile
  const completion = calculateProfileCompletion(profile)
  const message = getProfileCompletionMessage(completion)

  // 100% 완성되면 배너 숨김
  if (completion.isComplete) {
    return null
  }

  const handleComplete = () => {
    router.push('/profile/complete')
  }

  const handleLater = () => {
    // 7일간 숨김
    if (typeof window !== 'undefined') {
      localStorage.setItem('profile_completion_postponed', new Date().toISOString())
    }
    setIsPostponed(true)
    onDismiss?.()
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-2xl p-5 mb-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="닫기"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            📝 프로필을 완성해주세요
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {message}
          </p>

          {/* 진행률 바 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600">진행률</span>
              <span className="text-xs font-semibold text-pink-600">{completion.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completion.percentage}%` }}
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={handleComplete}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all active:scale-95"
            >
              지금 완성하기
            </button>
            <button
              onClick={handleLater}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all"
            >
              나중에
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

