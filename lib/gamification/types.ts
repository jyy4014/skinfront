// Gamification Types

export interface UserProgress {
    level: number
    currentXP: number
    totalXP: number
    totalScans: number
    streak: number
    lastScanDate: string | null
    achievements: string[]
}

export interface DailyQuest {
    id: string
    type: 'scan' | 'routine' | 'streak' | 'share'
    title: string
    description: string
    xpReward: number
    status: 'active' | 'completed'
    icon: string
}

export interface Achievement {
    id: string
    title: string
    description: string
    icon: string
    xpReward: number
    unlocked: boolean
    unlockedAt?: string
}

export interface LevelInfo {
    level: number
    title: string
    minXP: number
    maxXP: number
    color: string
    gradient: string
}

// Level titles by tier
export const LEVEL_TITLES: Record<number, string> = {
    1: 'Skin Novice',
    5: 'Skin Apprentice',
    10: 'Skin Expert',
    20: 'Skin Master',
    30: 'Skin Legend',
    50: 'Derma Sage',
}

// XP rewards for different actions
export const XP_REWARDS = {
    DAILY_SCAN: 50,
    COMPLETE_ROUTINE: 20,
    STREAK_BONUS: 10, // Per consecutive day
    FIRST_SCAN_OF_DAY: 30,
    SHARE_PROGRESS: 40,
} as const
