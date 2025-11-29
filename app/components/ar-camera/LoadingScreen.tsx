interface LoadingScreenProps {
    isReady: boolean
    isCameraLoading: boolean
    cameraError: string | null
    isModelReady: boolean
    isMockMode: boolean
    handleRetry: () => void
    className?: string
}

export default function LoadingScreen({
    isReady,
    isCameraLoading,
    cameraError,
    isModelReady,
    isMockMode,
    handleRetry,
    className = '',
}: LoadingScreenProps) {
    // 1. 초기 준비 중 (Lazy Init)
    if (!isReady) {
        return (
            <div className={`relative w-full h-full ${className} bg-gray-900 flex items-center justify-center`}>
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6 gpu-accelerated">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
                        <div className="absolute inset-0 rounded-full border-4 border-[#00FFC2] border-t-transparent animate-gpu-spin" />
                        <div className="absolute inset-2 rounded-full border-2 border-[#00FFC2]/30 border-t-transparent animate-gpu-spin-reverse" />
                    </div>
                    <p className="text-white text-lg font-medium mb-2">카메라 준비 중...</p>
                    <p className="text-gray-400 text-sm">잠시만 기다려주세요</p>
                    <div className="mt-6 w-48 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
                        <div className="h-full w-1/2 bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] rounded-full animate-loading-slide" />
                    </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#00FFC2]/5 pointer-events-none" />
            </div>
        )
    }

    // 2. 카메라 에러
    if (cameraError && !isMockMode) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm z-10">
                <div className="text-center px-6 max-w-sm">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-white text-base font-medium mb-2">카메라 접근 실패</p>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">{cameraError}</p>
                    <button
                        onClick={handleRetry}
                        className="px-6 py-3 bg-[#00FFC2] text-black font-semibold rounded-xl hover:bg-[#00E6B8] transition-colors"
                    >
                        재시도
                    </button>
                </div>
            </div>
        )
    }

    // 3. 카메라 로딩 중
    if (isCameraLoading && !isMockMode) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm z-10">
                <div className="text-center px-4">
                    <div className="w-12 h-12 border-4 border-[#00FFC2] border-t-transparent rounded-full animate-gpu-spin mx-auto mb-4 gpu-accelerated" />
                    <p className="text-white text-base font-medium mb-1">AI 카메라 연결 중...</p>
                    <p className="text-gray-400 text-xs">잠시만 기다려주세요</p>
                </div>
            </div>
        )
    }

    // 4. 모델 로딩 중
    if (!isModelReady) {
        return (
            <div className={`absolute inset-0 flex items-center justify-center z-10 ${isMockMode ? 'bg-black/30' : 'bg-gray-900/80'} backdrop-blur-sm`}>
                <div className="text-center px-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-gpu-spin mx-auto mb-3 gpu-accelerated" />
                    <p className="text-white text-sm font-medium mb-1">AR 모델 로딩 중...</p>
                    <p className="text-gray-400 text-xs">{isMockMode ? 'Mock Mode에서 실행 중' : '잠시만 기다려주세요'}</p>
                </div>
            </div>
        )
    }

    return null
}
