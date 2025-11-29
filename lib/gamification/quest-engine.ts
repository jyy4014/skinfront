import { DailyQuest, XP_REWARDS } from './types'

/**
 * Generate daily quests based on user state
 */
export function generateDailyQuests(userState: {
    hasScannedToday: boolean
    routineCompletedToday: boolean
    streak: number
}): DailyQuest[] {
    const quests: DailyQuest[] = []

    // Quest 1: Daily Scan (Always available if not done)
    if (!userState.hasScannedToday) {
        quests.push({
            id: 'daily_scan',
            type: 'scan',
            title: '오늘의 피부 스캔',
            description: 'AI로 피부 상태를 분석하세요',
            xpReward: XP_REWARDS.DAILY_SCAN + XP_REWARDS.FIRST_SCAN_OF_DAY,
            status: 'active',
            icon: '📸',
        })
    } else {
        quests.push({
            id: 'daily_scan',
            type: 'scan',
            title: '오늘의 피부 스캔',
            description: 'AI로 피부 상태를 분석하세요',
            xpReward: XP_REWARDS.DAILY_SCAN + XP_REWARDS.FIRST_SCAN_OF_DAY,
            status: 'completed',
            icon: '✅',
        })
    }

    // Quest 2: Daily Routine (Always available if not done)
    if (!userState.routineCompletedToday) {
        quests.push({
            id: 'daily_routine',
            type: 'routine',
            title: '피부 숙제 완료',
            description: '오늘의 루틴을 모두 체크하세요',
            xpReward: XP_REWARDS.COMPLETE_ROUTINE,
            status: 'active',
            icon: '📝',
        })
    } else {
        quests.push({
            id: 'daily_routine',
            type: 'routine',
            title: '피부 숙제 완료',
            description: '오늘의 루틴을 모두 체크하세요',
            xpReward: XP_REWARDS.COMPLETE_ROUTINE,
            status: 'completed',
            icon: '✅',
        })
    }

    // Quest 3: Streak Milestone (Dynamic based on streak)
    const nextMilestone = getNextStreakMilestone(userState.streak)
    if (nextMilestone) {
        const daysNeeded = nextMilestone - userState.streak
        quests.push({
            id: 'streak_milestone',
            type: 'streak',
            title: `${nextMilestone}일 연속 도전`,
            description: `${daysNeeded}일 더 기록하면 보너스 ${nextMilestone * XP_REWARDS.STREAK_BONUS} XP!`,
            xpReward: nextMilestone * XP_REWARDS.STREAK_BONUS,
            status: 'active',
            icon: '🔥',
        })
    } else {
        // Default quest if no milestone nearby
        quests.push({
            id: 'share_progress',
            type: 'share',
            title: '피부 변화 공유',
            description: '커뮤니티에 후기를 남겨보세요',
            xpReward: XP_REWARDS.SHARE_PROGRESS,
            status: 'active',
            icon: '💬',
        })
    }

    return quests
}

/**
 * Get next streak milestone (7, 14, 30, 60, 100)
 */
function getNextStreakMilestone(currentStreak: number): number | null {
    const milestones = [7, 14, 30, 60, 100]
    for (const milestone of milestones) {
        if (currentStreak < milestone) {
            return milestone
        }
    }
    return null // Already past all milestones
}

/**
 * Complete a quest and return XP reward
 */
export function completeQuest(questId: string, quests: DailyQuest[]): number {
    const quest = quests.find((q) => q.id === questId)
    if (!quest || quest.status === 'completed') {
        return 0
    }

    quest.status = 'completed'
    quest.icon = '✅'
    return quest.xpReward
}

/**
 * Check if user maintained streak
 */
export function checkStreak(lastScanDate: string | null): {
    maintained: boolean
    newStreak: number
    bonusXP: number
} {
    if (!lastScanDate) {
        return { maintained: false, newStreak: 1, bonusXP: 0 }
    }

    const last = new Date(lastScanDate)
    const today = new Date()

    // Reset time to midnight for comparison
    last.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    const diffTime = today.getTime() - last.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
        // Consecutive day - maintain streak
        return { maintained: true, newStreak: 0, bonusXP: XP_REWARDS.STREAK_BONUS }
    } else if (diffDays === 0) {
        // Same day - no change
        return { maintained: true, newStreak: 0, bonusXP: 0 }
    } else {
        // Streak broken
        return { maintained: false, newStreak: 1, bonusXP: 0 }
    }
}
