'use client'

import { motion } from 'framer-motion'
import { DailyQuest } from '../../../lib/gamification/types'
import confetti from 'canvas-confetti'

interface QuestCardProps {
    quest: DailyQuest
    onComplete?: (questId: string) => void
}

export default function QuestCard({ quest, onComplete }: QuestCardProps) {
    const isCompleted = quest.status === 'completed'

    const handleClick = () => {
        if (isCompleted || !onComplete) return

        // Quest-specific actions
        if (quest.type === 'scan') {
            // Trigger scan modal
            window.dispatchEvent(new CustomEvent('scan-button-click'))
        } else if (quest.type === 'routine') {
            // Navigate to routine section (scroll)
            const routineSection = document.querySelector('[data-section="routine"]')
            routineSection?.scrollIntoView({ behavior: 'smooth' })
        } else if (quest.type === 'share') {
            // Navigate to community
            window.location.href = '/community/write'
        }

        // For streak quest, just show info (no action)
    }

    const triggerConfetti = () => {
        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#00FFC2', '#00E6B8', '#FFD700'],
        })
    }

    const handleComplete = () => {
        if (isCompleted) return
        triggerConfetti()
        onComplete?.(quest.id)
    }

    return (
        <motion.div
            whileTap={!isCompleted ? { scale: 0.98 } : undefined}
            onClick={handleClick}
            className={`relative rounded-xl p-4 border-2 transition-all cursor-pointer ${isCompleted
                    ? 'bg-[#00FFC2]/10 border-[#00FFC2]/50'
                    : 'bg-gray-900/50 border-gray-700/50 hover:border-[#00FFC2]/30'
                }`}
        >
            <div className="flex items-center justify-between">
                {/* Left: Icon + Info */}
                <div className="flex items-center gap-3 flex-1">
                    <div className="text-3xl">{quest.icon}</div>
                    <div className="flex-1 min-w-0">
                        <h3
                            className={`text-sm font-bold ${isCompleted ? 'text-[#00FFC2]' : 'text-white'
                                }`}
                        >
                            {quest.title}
                        </h3>
                        <p className="text-xs text-gray-400 truncate">{quest.description}</p>
                    </div>
                </div>

                {/* Right: XP Badge */}
                <div
                    className={`px-3 py-1 rounded-full text-xs font-bold ${isCompleted
                            ? 'bg-[#00FFC2]/20 text-[#00FFC2]'
                            : 'bg-yellow-500/20 text-yellow-500'
                        }`}
                >
                    +{quest.xpReward} XP
                </div>
            </div>

            {/* Completion Overlay */}
            {isCompleted && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-[#00FFC2]/5 rounded-xl pointer-events-none"
                />
            )}
        </motion.div>
    )
}
