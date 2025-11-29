'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider'
import type { ComparisonData, ComparisonPeriod } from '../../../lib/utils/comparison'
import { formatScoreDelta, getTrendIcon, getTrendColor } from '../../../lib/utils/comparison'

interface MirrorSliderProps {
    comparisonData: ComparisonData
    onPeriodChange?: (period: ComparisonPeriod) => void
}

export default function MirrorSlider({ comparisonData, onPeriodChange }: MirrorSliderProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<ComparisonPeriod>(comparisonData.period)

    const handlePeriodChange = (period: ComparisonPeriod) => {
        setSelectedPeriod(period)
        onPeriodChange?.(period)
    }

    if (!comparisonData.hasValidComparison) {
        // Empty state - no comparison available
        return (
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-2 border-gray-700/50 p-8">
                <div className="text-center">
                    <div className="text-6xl mb-4">📸</div>
                    <h3 className="text-white text-xl font-bold mb-2">
                        피부 변화를 추적해보세요
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">
                        {comparisonData.afterRecord
                            ? '한 번 더 스캔하면 변화를 비교할 수 있어요'
                            : '첫 피부 사진을 찍어보세요'
                        }
                    </p>
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('scan-button-click'))}
                        className="px-6 py-3 bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] text-black font-bold rounded-xl hover:scale-105 transition-transform"
                    >
                        {comparisonData.afterRecord ? '지금 스캔하기' : '첫 스캔 시작하기'}
                    </button>
                </div>
            </div>
        )
    }

    const { beforeRecord, afterRecord, scoreDelta } = comparisonData

    return (
        <div className="space-y-4">
            {/* Main Slider */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#00FFC2]/30 bg-black">
                <ReactCompareSlider
                    itemOne={
                        <ReactCompareSliderImage
                            src="/images/placeholder-face.jpg"
                            alt="Before"
                            style={{ objectFit: 'cover', height: '100%' }}
                        />
                    }
                    itemTwo={
                        <ReactCompareSliderImage
                            src="/images/placeholder-face.jpg"
                            alt="After"
                            style={{ objectFit: 'cover', height: '100%' }}
                        />
                    }
                    style={{
                        height: '400px',
                        maxHeight: '60vh',
                    }}
                />

                {/* Score Badges */}
                <div className="absolute top-4 left-4 px-3 py-2 bg-black/80 backdrop-blur-sm rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400">{comparisonData.periodLabel}</p>
                    <p className="text-xl font-bold text-white">{beforeRecord?.totalScore || 0}점</p>
                </div>

                <div className="absolute top-4 right-4 px-3 py-2 bg-black/80 backdrop-blur-sm rounded-lg border border-[#00FFC2]/50">
                    <p className="text-xs text-gray-400">오늘</p>
                    <p className="text-xl font-bold text-[#00FFC2]">{afterRecord?.totalScore || 0}점</p>
                </div>

                {/* Delta Badge */}
                <AnimatePresence>
                    {scoreDelta !== 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/90 backdrop-blur-sm rounded-full border-2 border-[#00FFC2]/50"
                        >
                            <p className={`text-lg font-bold ${getTrendColor(scoreDelta)}`}>
                                {formatScoreDelta(scoreDelta)} {getTrendIcon(scoreDelta)}
                                <span className="text-xs text-gray-400 ml-2">
                                    {scoreDelta > 0 ? '개선됨' : '관리 필요'}
                                </span>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Period Selector */}
            <div className="flex items-center justify-center gap-2">
                {(['7d', '30d', '90d'] as ComparisonPeriod[]).map((period) => (
                    <button
                        key={period}
                        onClick={() => handlePeriodChange(period)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${selectedPeriod === period
                                ? 'bg-[#00FFC2]/20 text-[#00FFC2] border-2 border-[#00FFC2]/50'
                                : 'bg-gray-800/50 text-gray-400 border-2 border-gray-700/50 hover:border-gray-600'
                            }`}
                    >
                        {period === '7d' && '7일'}
                        {period === '30d' && '30일'}
                        {period === '90d' && '90일'}
                    </button>
                ))}
            </div>
        </div>
    )
}
