/**
 * 프로필 완성률 계산 테스트
 */

import { calculateProfileCompletion, getProfileCompletionMessage, ProfileData } from '../profileCompletion'

describe('calculateProfileCompletion', () => {
  it('프로필이 null이면 0%를 반환해야 함', () => {
    const result = calculateProfileCompletion(null)
    expect(result.percentage).toBe(0)
    expect(result.isComplete).toBe(false)
    expect(result.completedFields).toEqual([])
    expect(result.missingFields).toHaveLength(5)
  })

  it('모든 필드가 채워지면 100%를 반환해야 함', () => {
    const profile: ProfileData = {
      nickname: '테스트',
      birth_date: '1990-01-01',
      gender: 'male',
      skin_type: '건성',
      main_concerns: ['잡티', '모공'],
    }

    const result = calculateProfileCompletion(profile)
    expect(result.percentage).toBe(100)
    expect(result.isComplete).toBe(true)
    expect(result.missingFields).toEqual([])
  })

  it('일부 필드만 채워지면 해당 비율을 반환해야 함', () => {
    const profile: ProfileData = {
      nickname: '테스트',
      birth_date: '1990-01-01',
      gender: 'male',
      skin_type: null,
      main_concerns: null,
    }

    const result = calculateProfileCompletion(profile)
    expect(result.percentage).toBe(60) // 3/5 = 60%
    expect(result.isComplete).toBe(false)
    expect(result.completedFields).toContain('nickname')
    expect(result.completedFields).toContain('birth_date')
    expect(result.completedFields).toContain('gender')
    expect(result.missingFields).toContain('skin_type')
    expect(result.missingFields).toContain('main_concerns')
  })

  it('main_concerns가 빈 배열이면 미완성으로 처리해야 함', () => {
    const profile: ProfileData = {
      nickname: '테스트',
      birth_date: '1990-01-01',
      gender: 'male',
      skin_type: '건성',
      main_concerns: [],
    }

    const result = calculateProfileCompletion(profile)
    expect(result.percentage).toBe(80) // 4/5 = 80%
    expect(result.isComplete).toBe(false)
    expect(result.missingFields).toContain('main_concerns')
  })

  it('main_concerns가 최소 1개 이상이면 완성으로 처리해야 함', () => {
    const profile: ProfileData = {
      nickname: '테스트',
      birth_date: '1990-01-01',
      gender: 'male',
      skin_type: '건성',
      main_concerns: ['잡티'],
    }

    const result = calculateProfileCompletion(profile)
    expect(result.percentage).toBe(100)
    expect(result.isComplete).toBe(true)
    expect(result.completedFields).toContain('main_concerns')
  })
})

describe('getProfileCompletionMessage', () => {
  it('100% 완성 시 축하 메시지를 반환해야 함', () => {
    const completion = {
      percentage: 100,
      completedFields: ['nickname', 'birth_date', 'gender', 'skin_type', 'main_concerns'],
      missingFields: [],
      isComplete: true,
    }

    const message = getProfileCompletionMessage(completion)
    expect(message).toContain('완성되었습니다')
  })

  it('80% 이상 시 거의 완성 메시지를 반환해야 함', () => {
    const completion = {
      percentage: 80,
      completedFields: ['nickname', 'birth_date', 'gender', 'skin_type'],
      missingFields: ['main_concerns'],
      isComplete: false,
    }

    const message = getProfileCompletionMessage(completion)
    expect(message).toContain('거의 완성')
  })

  it('60% 이상 시 조금 더 완성 메시지를 반환해야 함', () => {
    const completion = {
      percentage: 60,
      completedFields: ['nickname', 'birth_date', 'gender'],
      missingFields: ['skin_type', 'main_concerns'],
      isComplete: false,
    }

    const message = getProfileCompletionMessage(completion)
    expect(message).toContain('조금 더 완성')
  })

  it('60% 미만 시 기본 메시지를 반환해야 함', () => {
    const completion = {
      percentage: 40,
      completedFields: ['nickname', 'birth_date'],
      missingFields: ['gender', 'skin_type', 'main_concerns'],
      isComplete: false,
    }

    const message = getProfileCompletionMessage(completion)
    expect(message).toContain('더 정확한 분석')
  })
})

