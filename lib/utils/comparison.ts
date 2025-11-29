import { SkinAnalysisRecord } from '../../app/utils/storage'

export type ComparisonPeriod = '7d' | '30d' | '90d'

export interface ComparisonData {
    period: ComparisonPeriod
    periodLabel: string
    beforeRecord: SkinAnalysisRecord | null
    afterRecord: SkinAnalysisRecord | null
    scoreDelta: number
    hasValidComparison: boolean
}

/**
 * Get the best comparison period based on available records
 */
export function getBestComparisonPeriod(records: SkinAnalysisRecord[]): ComparisonPeriod {
    if (records.length < 2) return '7d'

    const now = new Date()
    const dates = records.map(r => new Date(r.date))

    // Find oldest record
    const oldestDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const daysSinceOldest = Math.floor((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))

    // Auto-select period based on data availability
    if (daysSinceOldest >= 90) return '90d'
    if (daysSinceOldest >= 30) return '30d'
    return '7d'
}

/**
 * Get comparison data for a specific period
 */
export function getComparisonData(
    records: SkinAnalysisRecord[],
    period: ComparisonPeriod
): ComparisonData {
    if (records.length < 2) {
        return {
            period,
            periodLabel: getPeriodLabel(period),
            beforeRecord: null,
            afterRecord: records[0] || null,
            scoreDelta: 0,
            hasValidComparison: false,
        }
    }

    // Sort records by date (newest first)
    const sortedRecords = [...records].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const afterRecord = sortedRecords[0]
    const afterDate = new Date(afterRecord.date)

    // Calculate target date based on period
    const targetDate = new Date(afterDate)
    if (period === '7d') {
        targetDate.setDate(targetDate.getDate() - 7)
    } else if (period === '30d') {
        targetDate.setDate(targetDate.getDate() - 30)
    } else if (period === '90d') {
        targetDate.setDate(targetDate.getDate() - 90)
    }

    // Find the record closest to the target date (but before afterRecord)
    let beforeRecord = sortedRecords[sortedRecords.length - 1] // Default to oldest
    let minDiff = Infinity

    for (let i = 1; i < sortedRecords.length; i++) {
        const record = sortedRecords[i]
        const recordDate = new Date(record.date)
        const diff = Math.abs(recordDate.getTime() - targetDate.getTime())

        if (diff < minDiff) {
            minDiff = diff
            beforeRecord = record
        }
    }

    const scoreDelta = calculateScoreDelta(beforeRecord, afterRecord)

    return {
        period,
        periodLabel: getPeriodLabel(period),
        beforeRecord,
        afterRecord,
        scoreDelta,
        hasValidComparison: true,
    }
}

/**
 * Calculate score delta between two records
 */
export function calculateScoreDelta(
    beforeRecord: SkinAnalysisRecord | null,
    afterRecord: SkinAnalysisRecord | null
): number {
    if (!beforeRecord || !afterRecord) return 0

    const beforeScore = beforeRecord.totalScore || 0
    const afterScore = afterRecord.totalScore || 0

    return afterScore - beforeScore
}

/**
 * Get human-readable label for period
 */
export function getPeriodLabel(period: ComparisonPeriod): string {
    switch (period) {
        case '7d':
            return '7일 전'
        case '30d':
            return '30일 전'
        case '90d':
            return '90일 전'
    }
}

/**
 * Format delta for display
 */
export function formatScoreDelta(delta: number): string {
    if (delta > 0) return `+${delta}`
    if (delta < 0) return `${delta}`
    return '±0'
}

/**
 * Get trend indicator icon
 */
export function getTrendIcon(delta: number): string {
    if (delta > 0) return '↑'
    if (delta < 0) return '↓'
    return '→'
}

/**
 * Get trend color
 */
export function getTrendColor(delta: number): string {
    if (delta > 0) return 'text-green-500'
    if (delta < 0) return 'text-red-500'
    return 'text-gray-500'
}
