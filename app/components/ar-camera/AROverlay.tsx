import { AnimatePresence, motion } from 'framer-motion'
import type { DebugInfo, ScanningStage } from '../../../lib/ar/types'

interface AROverlayProps {
    scanningStage: ScanningStage
    isScreenLightOn: boolean
    lockOnProgress: number
    guideColor: 'white' | 'yellow' | 'mint'
    faceAlignment: 'none' | 'aligned'
    isMockMode: boolean
    debugInfo: DebugInfo
    guideMessage: string
    showPoseGuide: boolean
    countdownText: string | null
}

export default function AROverlay({
    scanningStage,
    isScreenLightOn,
    lockOnProgress,
    guideColor,
    faceAlignment,
    isMockMode,
    debugInfo,
    guideMessage,
    showPoseGuide,
    countdownText,
}: AROverlayProps) {
    if (scanningStage === 'complete') return null

    return (
        <>
            {/* SVG 마스크를 사용한 오버레이 (타원형 구멍 뚫기) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-15" style={{ height: '100%' }}>
                <defs>
                    <mask id="scanner-mask">
                        <rect width="100%" height="100%" fill="white" />
                        <ellipse cx="50%" cy="40%" rx="35%" ry="27.5%" fill="black" />
                    </mask>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill={isScreenLightOn ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.6)'}
                    mask="url(#scanner-mask)"
                    className="transition-colors duration-300"
                />
            </svg>

            {/* 가이드라인 컨테이너 */}
            <div className="absolute inset-0 flex items-start justify-center pointer-events-none z-16 pt-[8%]">
                <div className="relative w-[70%] aspect-[3/4]">
                    {/* SVG 타원형 가이드라인 + 진행률 게이지 */}
                    <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 200 267"
                        preserveAspectRatio="none"
                    >
                        <ellipse
                            cx="100"
                            cy="133.5"
                            rx="95"
                            ry="128"
                            fill="none"
                            stroke={
                                lockOnProgress > 0
                                    ? 'rgba(255, 255, 255, 0.2)'
                                    : guideColor === 'mint' || (faceAlignment === 'aligned' || isMockMode)
                                        ? '#00FFC2'
                                        : guideColor === 'yellow'
                                            ? '#FBBF24'
                                            : 'rgba(255, 255, 255, 0.5)'
                            }
                            strokeWidth={lockOnProgress > 0 ? '2' : '3'}
                            strokeDasharray={
                                guideColor === 'mint' || (faceAlignment === 'aligned' || isMockMode) || lockOnProgress > 0
                                    ? 'none'
                                    : '8 4'
                            }
                            style={{
                                filter: guideColor === 'mint' || (faceAlignment === 'aligned' || isMockMode)
                                    ? 'drop-shadow(0 0 10px rgba(0, 255, 194, 0.5))'
                                    : guideColor === 'yellow'
                                        ? 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.5))'
                                        : 'none',
                                transition: 'all 0.3s ease',
                            }}
                        />

                        {/* 진행률 게이지 */}
                        {lockOnProgress > 0 && (
                            <ellipse
                                cx="100"
                                cy="133.5"
                                rx="95"
                                ry="128"
                                fill="none"
                                stroke="#00FFC2"
                                strokeWidth="4"
                                strokeLinecap="round"
                                style={{
                                    strokeDasharray: '702',
                                    strokeDashoffset: `${702 - (702 * lockOnProgress) / 100}`,
                                    filter: 'drop-shadow(0 0 15px rgba(0, 255, 194, 0.8)) drop-shadow(0 0 30px rgba(0, 255, 194, 0.4))',
                                    transition: 'stroke-dashoffset 0.05s linear',
                                    transformOrigin: 'center',
                                    transform: 'rotate(-90deg) scaleX(-1)',
                                }}
                            />
                        )}
                    </svg>

                    {/* 수평계 (Leveler) */}
                    {scanningStage === 'idle' && (
                        <>
                            <div
                                className="absolute left-[-20px] top-1/2 w-4 h-1 rounded-full transition-all duration-200"
                                style={{
                                    backgroundColor: debugInfo.rollAngle <= 8 ? '#00FFC2' : debugInfo.rollAngle <= 15 ? '#FBBF24' : '#EF4444',
                                    transform: `translateY(-50%) rotate(${Math.min(debugInfo.rollAngle, 20) * (debugInfo.pitchValue < 0 ? -1 : 1)}deg)`,
                                    boxShadow: debugInfo.rollAngle <= 8 ? '0 0 8px rgba(0, 255, 194, 0.6)' : 'none',
                                }}
                            />
                            <div
                                className="absolute right-[-20px] top-1/2 w-4 h-1 rounded-full transition-all duration-200"
                                style={{
                                    backgroundColor: debugInfo.rollAngle <= 8 ? '#00FFC2' : debugInfo.rollAngle <= 15 ? '#FBBF24' : '#EF4444',
                                    transform: `translateY(-50%) rotate(${Math.min(debugInfo.rollAngle, 20) * (debugInfo.pitchValue < 0 ? -1 : 1)}deg)`,
                                    boxShadow: debugInfo.rollAngle <= 8 ? '0 0 8px rgba(0, 255, 194, 0.6)' : 'none',
                                }}
                            />
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1">
                                <div
                                    className="w-6 h-0.5 rounded-full transition-all duration-200"
                                    style={{
                                        backgroundColor: debugInfo.rollAngle <= 8 ? '#00FFC2' : '#6B7280',
                                        transform: `rotate(${Math.min(debugInfo.rollAngle, 20) * (debugInfo.pitchValue < 0 ? -1 : 1)}deg)`,
                                    }}
                                />
                                <span className={`text-[10px] font-mono ${debugInfo.rollAngle <= 8 ? 'text-[#00FFC2]' : 'text-gray-400'}`}>
                                    {debugInfo.rollAngle.toFixed(1)}°
                                </span>
                            </div>
                        </>
                    )}

                    {/* 카운트다운 숫자 */}
                    <AnimatePresence>
                        {countdownText && (
                            <motion.div
                                key={countdownText}
                                initial={{ scale: 2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <span
                                    className="text-8xl font-black text-[#00FFC2]"
                                    style={{ textShadow: '0 0 30px rgba(0, 255, 194, 0.8), 0 0 60px rgba(0, 255, 194, 0.4)' }}
                                >
                                    {countdownText}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 내부 가이드 */}
                    <div
                        className={`absolute inset-[8%] rounded-[50%] border transition-all duration-300 ${guideColor === 'mint' || (faceAlignment === 'aligned' || isMockMode)
                                ? 'border-[1.5px] border-[#00FFC2]'
                                : guideColor === 'yellow'
                                    ? 'border-[1.5px] border-yellow-400'
                                    : 'border border-dashed border-white'
                            }`}
                        style={{ opacity: guideColor === 'mint' || (faceAlignment === 'aligned' || isMockMode) ? 0.6 : 0.4 }}
                    />

                    {/* 거리 게이지 (Distance Bar) */}
                    {scanningStage === 'idle' && (
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[80%]">
                            <div className="flex justify-between text-[9px] text-gray-400 mb-1 px-1">
                                <span>🔍 멀리</span>
                                <span className={debugInfo.faceWidthRatio >= 60 && debugInfo.faceWidthRatio <= 85 ? 'text-[#00FFC2] font-bold' : ''}>
                                    {debugInfo.faceWidthRatio}%
                                </span>
                                <span>가까이 ✋</span>
                            </div>
                            <div className="relative w-full h-2 bg-gray-800/60 rounded-full overflow-hidden">
                                <div className="absolute h-full bg-[#00FFC2]/20 rounded-full" style={{ left: '60%', width: '25%' }} />
                                <div
                                    className="absolute left-0 h-full rounded-full transition-all duration-200"
                                    style={{
                                        width: `${Math.min(debugInfo.faceWidthRatio, 100)}%`,
                                        backgroundColor: debugInfo.faceWidthRatio < 60 || debugInfo.faceWidthRatio > 85 ? '#EF4444' : '#00FFC2',
                                        boxShadow: debugInfo.faceWidthRatio >= 60 && debugInfo.faceWidthRatio <= 85 ? '0 0 10px rgba(0, 255, 194, 0.6)' : '0 0 10px rgba(239, 68, 68, 0.4)',
                                    }}
                                />
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white/40" style={{ left: '60%' }} />
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white/40" style={{ left: '85%' }} />
                            </div>
                        </div>
                    )}

                    {/* 하단 가이드 텍스트 */}
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center w-full">
                        <p
                            className={`text-lg font-bold transition-colors duration-300 ${guideColor === 'mint' || (faceAlignment === 'aligned' || isMockMode)
                                    ? 'text-[#00FFC2]'
                                    : guideColor === 'yellow'
                                        ? 'text-yellow-400'
                                        : 'text-white'
                                }`}
                            style={{
                                textShadow: guideColor === 'mint' || (faceAlignment === 'aligned' || isMockMode)
                                    ? '0 0 8px rgba(0, 255, 194, 0.8)'
                                    : guideColor === 'yellow'
                                        ? '0 0 8px rgba(251, 191, 36, 0.8)'
                                        : '0 0 4px rgba(255, 255, 255, 0.5)',
                            }}
                        >
                            {guideMessage}
                        </p>
                    </div>
                </div>
            </div>

            {/* 3D 자세 가이드 (Pose Indicator) */}
            {showPoseGuide && scanningStage === 'idle' && debugInfo.faceDetected && (
                <div className="absolute top-4 right-4 z-30">
                    <div className="bg-black/70 backdrop-blur-sm rounded-xl p-3 border border-gray-700">
                        <div className="relative w-16 h-20">
                            <svg
                                viewBox="0 0 64 80"
                                className="w-full h-full transition-transform duration-150"
                                style={{
                                    transform: `perspective(200px) rotateY(${(debugInfo.yawRatio - 1) * 50}deg) rotateX(${-debugInfo.pitchValue * 2}deg) rotateZ(${debugInfo.rollAngle * (debugInfo.pitchValue < 0 ? -1 : 1)}deg)`,
                                }}
                            >
                                <ellipse
                                    cx="32" cy="40" rx="28" ry="35" fill="none"
                                    stroke={debugInfo.poseOk ? '#00FFC2' : debugInfo.rollAngle > 15 || debugInfo.yawRatio < 0.7 || debugInfo.yawRatio > 1.4 ? '#EF4444' : '#FBBF24'}
                                    strokeWidth="2"
                                    style={{ filter: debugInfo.poseOk ? 'drop-shadow(0 0 6px rgba(0, 255, 194, 0.6))' : 'none' }}
                                />
                                <ellipse cx="20" cy="35" rx="5" ry="3" fill={debugInfo.poseOk ? '#00FFC2' : '#9CA3AF'} />
                                <ellipse cx="44" cy="35" rx="5" ry="3" fill={debugInfo.poseOk ? '#00FFC2' : '#9CA3AF'} />
                                <path d="M32 38 L30 50 L34 50 Z" fill={debugInfo.poseOk ? '#00FFC2' : '#9CA3AF'} />
                                <path d="M24 58 Q32 64 40 58" fill="none" stroke={debugInfo.poseOk ? '#00FFC2' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" />
                                <circle cx="32" cy="15" r="3" fill={debugInfo.poseOk ? '#00FFC2' : '#6B7280'} />
                                <line x1="32" y1="18" x2="32" y2="25" stroke={debugInfo.poseOk ? '#00FFC2' : '#6B7280'} strokeWidth="2" />
                            </svg>
                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-bold ${debugInfo.poseOk ? 'bg-[#00FFC2]/20 text-[#00FFC2]' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {debugInfo.poseOk ? '✓ OK' : '조정'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
