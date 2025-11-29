import type { DebugInfo } from '../../../lib/ar/types'

interface DebugPanelProps {
    debugInfo: DebugInfo
    showDebugOverlay: boolean
    setShowDebugOverlay: (show: boolean) => void
    lockOnProgress: number
}

export default function DebugPanel({
    debugInfo,
    showDebugOverlay,
    setShowDebugOverlay,
    lockOnProgress,
}: DebugPanelProps) {
    return (
        <div className="absolute top-2 left-2 z-30">
            <button
                onClick={() => setShowDebugOverlay(!showDebugOverlay)}
                className="flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded text-[10px] font-mono text-gray-300 hover:bg-black/60 transition-colors"
            >
                <span>🐛</span>
                <span>{showDebugOverlay ? '접기' : '펼치기'}</span>
            </button>

            {showDebugOverlay && (
                <div className="mt-1 p-2 bg-black/40 backdrop-blur-sm rounded text-[10px] font-mono text-white space-y-0.5 min-w-[180px]">
                    {/* 상태 표시 */}
                    <div className="flex justify-between items-center pb-1 border-b border-white/20">
                        <span className={
                            debugInfo.status === 'Lock-on' ? 'text-[#00FFC2] font-bold' :
                                debugInfo.status === 'Capturing' ? 'text-yellow-400' : 'text-gray-400'
                        }>
                            {debugInfo.status}
                        </span>
                        <div className="flex items-center gap-1">
                            <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#00FFC2] rounded-full transition-all duration-100"
                                    style={{ width: `${lockOnProgress}%` }}
                                />
                            </div>
                            <span className="text-[#00FFC2] w-6">{Math.round(lockOnProgress)}%</span>
                        </div>
                    </div>

                    {/* 1️⃣ Face 감지 */}
                    <div className="flex justify-between">
                        <span className="text-gray-500">Face</span>
                        <span className={debugInfo.faceDetected ? 'text-green-400' : 'text-red-400'}>
                            {debugInfo.faceDetected ? '✓' : '✗'}
                        </span>
                    </div>

                    {/* 2️⃣ 위치 (최우선!) */}
                    <div className="flex justify-between">
                        <span className="text-yellow-400">📍 Y</span>
                        <span className={debugInfo.glabellaY <= 60 && debugInfo.glabellaY >= 33 ? 'text-green-400' : 'text-red-400'}>
                            {debugInfo.glabellaY}% <span className="text-gray-600">(33-57%)</span>
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">📍 X</span>
                        <span className={Math.abs(debugInfo.centerOffsetX) <= 0.12 ? 'text-green-400' : 'text-yellow-400'}>
                            {debugInfo.centerOffsetX > 0 ? '+' : ''}{(debugInfo.centerOffsetX * 100).toFixed(0)}%
                        </span>
                    </div>

                    {/* 3️⃣ 거리 */}
                    <div className="flex justify-between">
                        <span className="text-gray-500">📏 Size</span>
                        <span className={debugInfo.faceWidthRatio >= 50 && debugInfo.faceWidthRatio <= 90 ? 'text-green-400' : 'text-yellow-400'}>
                            {debugInfo.faceWidthRatio}% <span className="text-gray-600">(50-90%)</span>
                        </span>
                    </div>

                    {/* 4️⃣ 각도 (마지막) */}
                    <div className="flex justify-between pt-0.5 border-t border-white/10">
                        <span className="text-gray-500">🎯 Pose</span>
                        <span className={debugInfo.poseOk ? 'text-green-400' : 'text-yellow-400'}>
                            {debugInfo.poseOk ? '✓' : '⚠️'}
                        </span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                        <span className="text-gray-600">Yaw</span>
                        <span className={debugInfo.yawRatio >= 0.7 && debugInfo.yawRatio <= 1.4 ? 'text-green-400' : 'text-red-400'}>
                            {debugInfo.yawRatio.toFixed(2)} <span className="text-gray-700">(0.7~1.4)</span>
                        </span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                        <span className="text-gray-600">Roll</span>
                        <span className={debugInfo.rollAngle <= 10 ? 'text-green-400' : 'text-yellow-400'}>
                            {debugInfo.rollAngle.toFixed(1)}°
                        </span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                        <span className="text-gray-600">Pitch</span>
                        <span className={debugInfo.pitchValue >= -10 && debugInfo.pitchValue <= 22 ? 'text-green-400' : 'text-yellow-400'}>
                            {debugInfo.pitchValue > 0 ? '+' : ''}{debugInfo.pitchValue.toFixed(0)}
                        </span>
                    </div>

                    {/* 밝기 */}
                    <div className="flex justify-between text-[9px] pt-0.5 border-t border-white/10">
                        <span className="text-gray-600">💡 Bright</span>
                        <span className={debugInfo.brightness >= 80 ? 'text-green-400' : 'text-yellow-400'}>
                            {debugInfo.brightness}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
