'use client'

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Bell } from 'lucide-react'

/**
 * 빈 상태일 때 QuickStats 대신 표시할 인사이트 카드
 */
export default function InsightCards() {
    const insights = [
        {
            id: 'consistent',
            icon: TrendingUp,
            title: '꾸준한 기록',
            description: '매일 기록하면 변화가 더 정확해요',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            id: 'frequency',
            icon: Sparkles,
            title: '추천 주기',
            description: '일주일에 2-3회가 가장 좋아요',
            color: 'from-purple-500 to-pink-500',
        },
        {
            id: 'reminder',
            icon: Bell,
            title: '알림 설정',
            description: '잊지 않도록 알림을 받아보세요',
            color: 'from-orange-500 to-red-500',
        },
    ]

    return (
        <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700/50">
            <h3 className="text-white text-sm font-bold mb-3">💡 피부 기록 팁</h3>

            <div className="grid grid-cols-1 gap-3">
                {insights.map((insight, index) => {
                    const Icon = insight.icon

                    return (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700/50"
                        >
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${insight.color} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="text-white text-sm font-semibold mb-0.5">
                                    {insight.title}
                                </h4>
                                <p className="text-gray-400 text-xs">
                                    {insight.description}
                                </p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
