'use client'

import { motion } from 'framer-motion'

interface QuickStatsProps {
    scanCount: number
    streak: number
    bestScore: number
}

export default function QuickStats({ scanCount, streak, bestScore }: QuickStatsProps) {
    const stats = [
        {
            id: 'scans',
            label: '이번 주 스캔',
            value: scanCount,
            unit: '회',
            icon: '📸',
            gradient: 'from-blue-500 to-cyan-500',
        },
        {
            id: 'streak',
            label: '연속 기록',
            value: streak,
            unit: '일',
            icon: '🔥',
            gradient: 'from-orange-500 to-red-500',
        },
        {
            id: 'best',
            label: '최고 점수',
            value: bestScore,
            unit: '점',
            icon: '⭐',
            gradient: 'from-yellow-500 to-orange-500',
        },
    ]

    return (
        <div className="grid grid-cols-3 gap-3">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative rounded-xl bg-gray-900/50 border border-gray-700/50 p-4 overflow-hidden"
                >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10`} />

                    {/* Content */}
                    <div className="relative z-10">
                        <div className="text-2xl mb-1">{stat.icon}</div>
                        <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-white">
                            {stat.value}
                            <span className="text-sm text-gray-400 ml-1">{stat.unit}</span>
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
