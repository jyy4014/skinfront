'use client'

import React from 'react'

interface AuthorProfileBadgesProps {
  authorProfile?: {
    ageGroup: string
    skinType: string
    concern: string
  }
  mySkinType?: string | null // 'Dry', 'Oily' 등 (영문)
  myConcern?: string | null // '기미', '모공' 등
}

// 피부 타입 매핑 (영문 -> 한글)
const skinTypeMap: Record<string, string> = {
  Dry: '건성',
  Oily: '지성',
  Combination: '복합성',
  Sensitive: '민감성',
  Normal: '정상',
}

export default function AuthorProfileBadges({ authorProfile, mySkinType, myConcern }: AuthorProfileBadgesProps) {
  if (!authorProfile) return null

  // 내 피부 타입을 한글로 변환
  const mySkinTypeKorean = mySkinType ? skinTypeMap[mySkinType] : null

  // 각 배지가 내 정보와 일치하는지 확인
  const isAgeMatch = false // 나이대는 비교하지 않음 (선택사항)
  const isSkinTypeMatch = mySkinTypeKorean === authorProfile.skinType
  const isConcernMatch = myConcern === authorProfile.concern

  const badges = [
    { label: authorProfile.ageGroup, isMatch: isAgeMatch },
    { label: authorProfile.skinType, isMatch: isSkinTypeMatch },
    { label: authorProfile.concern, isMatch: isConcernMatch },
  ]

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {badges.map((badge, index) => (
        <span
          key={index}
          className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
            badge.isMatch
              ? 'bg-[#00FFC2]/20 text-[#00FFC2] border border-[#00FFC2]/30'
              : 'bg-gray-800/50 text-gray-400'
          }`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  )
}

