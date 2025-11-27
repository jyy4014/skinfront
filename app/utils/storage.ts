/**
 * 피부 분석 기록 저장/불러오기 유틸리티
 * localStorage를 사용하여 클라이언트 측에서 데이터 관리
 */

export interface SkinAnalysisRecord {
  id: string
  date: string // ISO 날짜 문자열
  totalScore: number
  primaryConcern: string
  details: {
    pigmentation: { score: number; grade: string }
    pores: { score: number; grade: string }
    wrinkles: { score: number; grade: string }
    acne: { score: number; grade: string }
  }
}

const STORAGE_KEY = 'skin_records'
const MAX_RECORDS = 100 // 최대 저장 개수

/**
 * localStorage에서 모든 진단 기록 불러오기
 */
export function getSkinRecords(): SkinAnalysisRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }

    const records = JSON.parse(stored)
    if (!Array.isArray(records)) {
      console.warn('Invalid records format in localStorage, resetting')
      localStorage.removeItem(STORAGE_KEY)
      return []
    }

    // 유효성 검사 및 필터링
    const validRecords = records.filter((record) => {
      return (
        record &&
        typeof record === 'object' &&
        record.id &&
        record.date &&
        typeof record.totalScore === 'number' &&
        record.totalScore >= 0 &&
        record.totalScore <= 100 &&
        record.primaryConcern &&
        record.details &&
        typeof record.details === 'object'
      )
    })

    return validRecords
  } catch (error) {
    console.error('Failed to load skin records from localStorage:', error)
    return []
  }
}

/**
 * 진단 기록을 localStorage에 저장 (중복 방지)
 * @param record 저장할 진단 기록
 * @returns 저장 성공 여부
 */
export function saveSkinRecord(record: Omit<SkinAnalysisRecord, 'id'>): boolean {
  try {
    // 데이터 유효성 검사
    if (
      !record ||
      typeof record.totalScore !== 'number' ||
      record.totalScore < 0 ||
      record.totalScore > 100 ||
      !record.primaryConcern ||
      !record.details
    ) {
      console.warn('Invalid record data, skipping save:', record)
      return false
    }

    // 기존 기록 불러오기
    const existingRecords = getSkinRecords()

    // 중복 체크: 같은 날짜와 점수로 저장된 기록이 있는지 확인
    const recordDate = new Date(record.date).toISOString().split('T')[0]

    // 오늘 날짜의 기록이 이미 있는지 확인 (점수 차이가 5점 이내면 중복으로 간주)
    const isDuplicate = existingRecords.some((existing) => {
      const existingDate = new Date(existing.date).toISOString().split('T')[0]
      const scoreDiff = Math.abs(existing.totalScore - record.totalScore)
      return existingDate === recordDate && scoreDiff <= 5
    })

    if (isDuplicate) {
      console.log('⚠️ Duplicate record detected, skipping save')
      return false
    }

    // 새 기록 생성
    const newRecord: SkinAnalysisRecord = {
      id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: record.date,
      totalScore: Math.max(0, Math.min(100, record.totalScore)),
      primaryConcern: record.primaryConcern,
      details: {
        pigmentation: {
          score: Math.max(0, Math.min(100, record.details.pigmentation?.score || 50)),
          grade: record.details.pigmentation?.grade || '주의',
        },
        pores: {
          score: Math.max(0, Math.min(100, record.details.pores?.score || 50)),
          grade: record.details.pores?.grade || '주의',
        },
        wrinkles: {
          score: Math.max(0, Math.min(100, record.details.wrinkles?.score || 50)),
          grade: record.details.wrinkles?.grade || '주의',
        },
        acne: {
          score: Math.max(0, Math.min(100, record.details.acne?.score || 50)),
          grade: record.details.acne?.grade || '주의',
        },
      },
    }

    // 새 기록을 맨 앞에 추가 (최신순)
    const updatedRecords = [newRecord, ...existingRecords]

    // 최대 개수 제한
    const trimmedRecords = updatedRecords.slice(0, MAX_RECORDS)

    // localStorage에 저장
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedRecords))
      console.log('✅ Skin record saved successfully')
      return true
    } catch (error) {
      // 저장 실패 시 (용량 초과 등) 오래된 기록 삭제 후 재시도
      console.warn('Failed to save, trying to reduce records:', error)
      try {
        const reducedRecords = trimmedRecords.slice(0, Math.floor(MAX_RECORDS / 2))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedRecords))
        console.log('✅ Skin record saved with reduced history')
        return true
      } catch (retryError) {
        console.error('Failed to save skin record after retry:', retryError)
        return false
      }
    }
  } catch (error) {
    console.error('Unexpected error saving skin record:', error)
    return false
  }
}

/**
 * 특정 기록 삭제
 * @param recordId 삭제할 기록의 ID
 */
export function deleteSkinRecord(recordId: string): boolean {
  try {
    const records = getSkinRecords()
    const filtered = records.filter((record) => record.id !== recordId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Failed to delete skin record:', error)
    return false
  }
}

/**
 * 모든 기록 삭제
 */
export function clearSkinRecords(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Failed to clear skin records:', error)
    return false
  }
}

/**
 * 최근 N개의 기록만 가져오기
 * @param limit 가져올 개수
 */
export function getRecentSkinRecords(limit: number = 10): SkinAnalysisRecord[] {
  const records = getSkinRecords()
  return records.slice(0, limit)
}


