/**
 * 프로필 완성률 계산 유틸리티
 */

export interface ProfileData {
  nickname?: string | null
  birth_date?: string | null
  gender?: string | null
  skin_type?: string | null
  main_concerns?: string[] | null
}

export interface ProfileCompletionResult {
  percentage: number
  completedFields: string[]
  missingFields: string[]
  isComplete: boolean
}

/**
 * 프로필 완성률 계산
 */
export function calculateProfileCompletion(profile: ProfileData | null): ProfileCompletionResult {
  if (!profile) {
    return {
      percentage: 0,
      completedFields: [],
      missingFields: ['nickname', 'birth_date', 'gender', 'skin_type', 'main_concerns'],
      isComplete: false,
    }
  }

  const requiredFields = [
    { key: 'nickname', value: profile.nickname },
    { key: 'birth_date', value: profile.birth_date },
    { key: 'gender', value: profile.gender },
    { key: 'skin_type', value: profile.skin_type },
    { key: 'main_concerns', value: profile.main_concerns },
  ]

  const completedFields: string[] = []
  const missingFields: string[] = []

  requiredFields.forEach(({ key, value }) => {
    if (key === 'main_concerns') {
      // main_concerns는 배열이어야 하고, 최소 1개 이상 있어야 함
      if (Array.isArray(value) && value.length > 0) {
        completedFields.push(key)
      } else {
        missingFields.push(key)
      }
    } else {
      // 다른 필드는 값이 있으면 완성
      if (value && value.toString().trim() !== '') {
        completedFields.push(key)
      } else {
        missingFields.push(key)
      }
    }
  })

  const percentage = Math.round((completedFields.length / requiredFields.length) * 100)
  const isComplete = missingFields.length === 0

  return {
    percentage,
    completedFields,
    missingFields,
    isComplete,
  }
}

/**
 * 프로필 완성률에 따른 메시지 반환
 */
export function getProfileCompletionMessage(completion: ProfileCompletionResult): string {
  if (completion.isComplete) {
    return '프로필이 완성되었습니다! 🎉'
  }

  if (completion.percentage >= 80) {
    return '프로필이 거의 완성되었어요!'
  }

  if (completion.percentage >= 60) {
    return '프로필을 조금 더 완성해주세요'
  }

  return '프로필을 완성하면 더 정확한 분석을 받을 수 있어요'
}

