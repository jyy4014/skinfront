'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { SkinAnalysisRecord } from '../../utils/storage'

interface MiniTimelineProps {
    records: SkinAnalysisRecord[]
    maxDays?: number
}

export default function MiniTimeline({ records, maxDays = 30 }: MiniTimelineProps) {
    const router = useRouter()

    if (records.length === 0) {
        return null
    }

    // Sort records by date (newest first)
    const sortedRecords = [...records]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, maxDays)

    return (
        <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700/50">
            <h3 className="text-white text-sm font-bold mb-3">최근 기록</h3>

            {/* Timeline */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-2" style={{ width: 'max-content' }}>
                    {sortedRecords.map((record, index) => {
                        const date = new Date(record.date)
                        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
                        const isRecent = index < 7

                        return (
                            <motion.button
                                key={record.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push('/mypage')}
                                className="flex-shrink-0 flex flex-col items-center gap-1 group"
                            >
                                {/* Thumbnail */}
                                <div className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${isRecent
                                        ? 'border-[#00FFC2]/50 shadow-lg shadow-[#00FFC2]/20'
                                        : 'border-gray-700/50'
                                    } group-hover:border-[#00FFC2]/70`}>
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                        <span className="text-2xl">📊</span>
                                    </div>

                                    {/* Score Badge */}
                                    <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm py-0.5">
                                        <p className="text-[10px] text-[#00FFC2] font-bold text-center">
                                            {record.totalScore || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Date Label */}
                                <p className="text-[10px] text-gray-500 group-hover:text-gray-400">
                                    {dateStr}
                                </p>
                            </motion.button>
                        )
                    })}
                </div>
            </div>

            {/* Summary */}
            {records.length > maxDays && (
                <p className="text-xs text-gray-500 text-center mt-3">
                    총 {records.length}개 기록 ·
                    <button
                        onClick={() => router.push('/mypage')}
                        className="text-[#00FFC2] hover:underline ml-1"
                    >
                        전체보기
                    </button>
                </p>
            )}
        </div>
    )
}
