/**
 * 날짜 유틸리티 함수
 */

/**
 * 날짜가 오늘인지 확인
 */
export function isToday(dateString: string): boolean {
    try {
        const date = new Date(dateString)
        const today = new Date()

        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        )
    } catch {
        return false
    }
}

/**
 * 날짜가 어제인지 확인
 */
export function isYesterday(dateString: string): boolean {
    try {
        const date = new Date(dateString)
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        return (
            date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear()
        )
    } catch {
        return false
    }
}

/**
 * 날짜 차이 계산 (일 단위)
 */
export function getDaysSince(dateString: string): number {
    try {
        const date = new Date(dateString)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        date.setHours(0, 0, 0, 0)

        const diffTime = today.getTime() - date.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        return diffDays
    } catch {
        return 0
    }
}
