/**
 * 공통 유틸리티 함수 모음
 */

/**
 * 가격 포맷팅 함수
 * 예: 49000 -> "4.9만", 5000 -> "5000"
 */
export function formatPrice(price: number): string {
  if (price >= 10000) {
    return `${(price / 10000).toFixed(1).replace('.0', '')}만`
  }
  return `${price}`
}

/**
 * 날짜 포맷팅 함수 (진단 기록용)
 * 예: "2024-11-25T14:30:00Z" -> "11.25(월)" 또는 "11.25(월) 14:30" (같은 날짜가 여러 개일 때)
 */
export function formatRecordDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return '날짜 오류'
    }
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const weekday = weekdays[date.getDay()] || '?'
    
    return `${month}.${day}(${weekday})`
  } catch (error) {
    console.error('Failed to format date:', dateString, error)
    return '날짜 오류'
  }
}

/**
 * 날짜 포맷팅 함수 (상세 - 시간 포함)
 * 예: "2024-11-25T14:30:00Z" -> "11.25(월) 14:30"
 */
export function formatRecordDateWithTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return '날짜 오류'
    }
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const weekday = weekdays[date.getDay()] || '?'
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${month}.${day}(${weekday}) ${hours}:${minutes}`
  } catch (error) {
    console.error('Failed to format date with time:', dateString, error)
    return '날짜 오류'
  }
}

/**
 * 예약 날짜 포맷팅 함수
 * 예: "2024-11-25", "14:00" -> "2024.11.25 (월) 14:00"
 */
export function formatReservationDate(dateStr: string, timeStr: string): string {
  try {
    const date = new Date(`${dateStr}T${timeStr}`)
    if (isNaN(date.getTime())) return dateStr

    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const weekday = weekdays[date.getDay()] || '?'

    return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')} (${weekday}) ${timeStr}`
  } catch {
    return `${dateStr} ${timeStr}`
  }
}

/**
 * 등급에 따른 색상 반환
 */
export function getGradeColor(grade: string): string {
  switch (grade) {
    case '양호':
      return 'text-green-400'
    case '주의':
      return 'text-amber-400'
    case '위험':
      return 'text-red-400'
    default:
      return 'text-gray-400'
  }
}

/**
 * 점수에 따른 색상 반환
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-blue-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-red-400'
}




