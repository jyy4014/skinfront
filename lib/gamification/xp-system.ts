import { LevelInfo, LEVEL_TITLES } from './types'

/**
 * Calculate level from total XP
 * Formula: Level = floor(sqrt(XP / 100))
 * This creates a smooth progression curve
 */
export function calculateLevel(totalXP: number): number {
    if (totalXP <= 0) return 1
    return Math.floor(Math.sqrt(totalXP / 100)) + 1
}

/**
 * Get XP required for a specific level
 */
export function getXPForLevel(level: number): number {
    if (level <= 1) return 0
    return Math.pow(level - 1, 2) * 100
}

/**
 * Get XP needed to reach next level
 */
export function getXPForNextLevel(currentLevel: number): number {
    return getXPForLevel(currentLevel + 1)
}

/**
 * Get XP progress percentage for current level
 */
export function getLevelProgress(currentXP: number, currentLevel: number): number {
    const currentLevelXP = getXPForLevel(currentLevel)
    const nextLevelXP = getXPForNextLevel(currentLevel)
    const xpInCurrentLevel = currentXP - currentLevelXP
    const xpNeededForLevel = nextLevelXP - currentLevelXP

    return Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100))
}

/**
 * Get level title based on current level
 */
export function getLevelTitle(level: number): string {
    // Find the highest level title that applies
    const levelKeys = Object.keys(LEVEL_TITLES)
        .map(Number)
        .sort((a, b) => b - a)

    for (const key of levelKeys) {
        if (level >= key) {
            return LEVEL_TITLES[key]
        }
    }

    return LEVEL_TITLES[1]
}

/**
 * Get level color gradient
 */
export function getLevelGradient(level: number): string {
    if (level < 5) return 'from-gray-500 to-gray-700'
    if (level < 10) return 'from-green-500 to-emerald-600'
    if (level < 20) return 'from-blue-500 to-cyan-600'
    if (level < 30) return 'from-purple-500 to-pink-600'
    if (level < 50) return 'from-yellow-500 to-orange-600'
    return 'from-yellow-400 via-pink-500 to-purple-600'
}

/**
 * Get complete level info
 */
export function getLevelInfo(totalXP: number): LevelInfo {
    const level = calculateLevel(totalXP)
    const title = getLevelTitle(level)
    const minXP = getXPForLevel(level)
    const maxXP = getXPForNextLevel(level)
    const gradient = getLevelGradient(level)

    return {
        level,
        title,
        minXP,
        maxXP,
        color: gradient.split(' ')[0].replace('from-', ''),
        gradient,
    }
}

/**
 * Award XP and return updated progress
 */
export function awardXP(
    currentProgress: { currentXP: number; totalXP: number; level: number },
    xpAmount: number
): { newXP: number; newTotalXP: number; newLevel: number; leveledUp: boolean } {
    const newTotalXP = currentProgress.totalXP + xpAmount
    const newLevel = calculateLevel(newTotalXP)
    const leveledUp = newLevel > currentProgress.level

    return {
        newXP: newTotalXP,
        newTotalXP,
        newLevel,
        leveledUp,
    }
}
