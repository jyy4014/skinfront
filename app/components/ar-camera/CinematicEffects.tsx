import { motion, AnimatePresence } from 'framer-motion'
import type { ScanningStage } from '../../../lib/ar/types'

// Workaround for missing AnimationControls export in framer-motion v12
type AnimationControls = any

interface CinematicEffectsProps {
    scanningStage: ScanningStage
    laserControls: AnimationControls
    rippleControls: AnimationControls
    fadeControls: AnimationControls
    laserProgress: number
    showDataTransfer: boolean
    frozenFrame: string | null
    isMockMode: boolean
}

export default function CinematicEffects({
    scanningStage,
    laserControls,
    rippleControls,
    fadeControls,
    laserProgress,
    showDataTransfer,
    frozenFrame,
    isMockMode,
}: CinematicEffectsProps) {
    return (
        <>
            {/* 📸 정지 프레임 오버레이 (Freeze Frame) */}
            <AnimatePresence>
                {frozenFrame && scanningStage !== 'idle' && (
                    <motion.div
                        key="frozen-frame"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="absolute inset-0 z-15"
                    >
                        {frozenFrame === 'freezing' ? (
                            <div className="w-full h-full bg-transparent" />
                        ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={frozenFrame}
                                alt="Captured frame"
                                className="w-full h-full object-cover"
                                style={{
                                    objectPosition: 'center 40%',
                                    transform: isMockMode ? 'scale(0.9)' : 'scaleX(-1)',
                                }}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🔦 하이엔드 레이저 스캔 바 (Laser Beam) */}
            <AnimatePresence>
                {scanningStage === 'scanning' && (
                    <motion.div
                        key="laser-beam"
                        initial={{ y: '-10%' }}
                        animate={laserControls}
                        exit={{ opacity: 0, transition: { duration: 0.5 } }}
                        className="absolute left-0 right-0 z-35 pointer-events-none"
                        style={{ top: 0 }}
                    >
                        <div
                            className="absolute -top-8 left-0 right-0 h-32"
                            style={{
                                background: 'linear-gradient(to bottom, transparent 0%, rgba(0, 255, 194, 0.15) 30%, rgba(0, 255, 194, 0.3) 50%, rgba(0, 255, 194, 0.15) 70%, transparent 100%)',
                            }}
                        />
                        <div className="relative w-full h-24 gpu-accelerated">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00FFC2] to-transparent neon-glow-mint-intense animate-glow-pulse" />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00FFC2]/80 to-transparent" />
                        </div>
                        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 gpu-accelerated">
                            <div className="h-3 bg-white/50 neon-glow-mint animate-glow-pulse" />
                            <div className="absolute inset-0 h-2 top-0.5 bg-white" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
                        <div className="absolute -bottom-2 left-0 right-0 h-1 bg-[#00FFC2] neon-glow-mint" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🌐 AR Face Mesh Reveal 효과 */}
            <AnimatePresence>
                {(scanningStage === 'scanning' || scanningStage === 'processing') && laserProgress > 0 && (
                    <motion.div
                        key="mesh-reveal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
                    >
                        <div
                            className="absolute inset-0"
                            style={{
                                clipPath: `polygon(0 0, 100% 0, 100% ${laserProgress}%, 0 ${laserProgress}%)`,
                            }}
                        >
                            <div
                                className="w-full h-full opacity-30"
                                style={{
                                    backgroundImage: `
                    linear-gradient(rgba(0, 255, 194, 0.3) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 255, 194, 0.3) 1px, transparent 1px)
                  `,
                                    backgroundSize: '20px 20px',
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center gpu-accelerated">
                                <div className="w-48 h-48 rounded-full border border-[#00FFC2]/50 bg-[#00FFC2]/5" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 📡 데이터 전송 연출 */}
            <AnimatePresence>
                {showDataTransfer && (
                    <motion.div
                        key="data-transfer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-25 pointer-events-none flex items-center justify-center"
                    >
                        <div className="relative">
                            <motion.div
                                animate={rippleControls}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-[#00FFC2]"
                            />
                            <motion.div
                                initial={{ scale: 0, opacity: 0.8 }}
                                animate={{ scale: 3, opacity: 0 }}
                                transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-[#00FFC2]"
                            />
                            <motion.div
                                initial={{ scale: 0, opacity: 0.8 }}
                                animate={{ scale: 3, opacity: 0 }}
                                transition={{ duration: 1.5, delay: 0.6, ease: 'easeOut' }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-[#00FFC2]"
                            />
                            <div className="w-8 h-8 rounded-full bg-[#00FFC2] neon-glow-mint animate-gpu-pulse gpu-accelerated" />
                        </div>

                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className={`absolute w-2 h-2 rounded-full bg-[#00FFC2] neon-glow-mint gpu-accelerated ${i % 3 === 0 ? 'animate-blink' : i % 3 === 1 ? 'animate-blink-delay-1' : 'animate-blink-delay-2'
                                    }`}
                                style={{
                                    top: `${35 + (i % 4) * 10}%`,
                                    left: `${25 + (i % 5) * 12}%`,
                                }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 페이드 아웃 오버레이 */}
            <AnimatePresence>
                {scanningStage === 'complete' && (
                    <motion.div
                        key="fade-out"
                        initial={{ opacity: 0 }}
                        animate={fadeControls}
                        exit={{ opacity: 1 }}
                        className="absolute inset-0 bg-black z-50 pointer-events-none"
                    />
                )}
            </AnimatePresence>
        </>
    )
}
