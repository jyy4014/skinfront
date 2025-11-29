import { motion } from 'framer-motion'
import type { ScanningStage } from '../../../lib/ar/types'

interface StatusMessageProps {
    scanningStage: ScanningStage
    bottomMessage: string
    laserProgress: number
    lockOnProgress: number
    onManualCapture: () => void
}

export default function StatusMessage({
    scanningStage,
    bottomMessage,
    laserProgress,
    lockOnProgress,
    onManualCapture,
}: StatusMessageProps) {
    if (scanningStage === 'complete') return null

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 text-center px-6 w-full max-w-md">
            {/* 상태 메시지 */}
            <div
                className={`bg-black/80 backdrop-blur-md rounded-2xl px-6 py-4 inline-block mb-4 border border-[#00FFC2]/20 gpu-accelerated ${scanningStage !== 'idle' ? 'neon-glow-mint animate-glow-pulse' : ''
                    }`}
            >
                <p className="text-white text-sm font-medium">
                    {bottomMessage}
                </p>

                {scanningStage === 'scanning' && (
                    <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-[#00FFC2] mb-1">
                            <span>🔦 피부 표면 스캔 중</span>
                            <span className="font-bold">{Math.round(laserProgress)}%</span>
                        </div>
                        <div className="w-52 h-3 bg-gray-800 rounded-full overflow-hidden mx-auto border border-[#00FFC2]/30">
                            <div
                                className="h-full bg-gradient-to-r from-[#00FFC2] via-[#00E6B8] to-[#00FFC2] neon-glow-mint gpu-accelerated"
                                style={{
                                    width: `${laserProgress}%`,
                                    transition: 'width 0.1s linear',
                                }}
                            />
                        </div>
                    </div>
                )}

                {scanningStage === 'processing' && (
                    <div className="mt-3">
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-3 h-3 bg-[#00FFC2] rounded-full neon-glow-mint animate-blink gpu-accelerated" />
                            <div className="w-3 h-3 bg-[#00FFC2] rounded-full neon-glow-mint animate-blink-delay-1 gpu-accelerated" />
                            <div className="w-3 h-3 bg-[#00FFC2] rounded-full neon-glow-mint animate-blink-delay-2 gpu-accelerated" />
                        </div>
                    </div>
                )}
            </div>

            {/* 오토 캡처 진행률 표시 */}
            {scanningStage === 'idle' && lockOnProgress > 0 && (
                <div className="flex items-center gap-3 mb-4 animate-fade-in">
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#00FFC2] neon-glow-mint gpu-accelerated"
                            style={{
                                width: `${lockOnProgress}%`,
                                transition: 'width 0.1s linear',
                            }}
                        />
                    </div>
                    <span className="text-[#00FFC2] text-sm font-bold min-w-[3rem] text-right">
                        {Math.round(lockOnProgress)}%
                    </span>
                </div>
            )}

            {/* 수동 촬영 보조 버튼 */}
            {scanningStage === 'idle' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="flex items-center justify-center gap-4"
                >
                    <p className="text-gray-500 text-xs">
                        {lockOnProgress > 0
                            ? '자동 촬영 중...'
                            : '얼굴을 맞추면 자동 촬영됩니다'}
                    </p>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onManualCapture}
                        className="px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-white rounded-full text-xs font-medium transition-colors border border-gray-700"
                    >
                        📷 수동 촬영
                    </motion.button>
                </motion.div>
            )}
        </div>
    )
}
