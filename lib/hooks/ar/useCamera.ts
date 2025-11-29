import { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'

export const useCamera = () => {
    const webcamRef = useRef<Webcam>(null)
    const [isCameraReady, setIsCameraReady] = useState(false)
    const [isCameraLoading, setIsCameraLoading] = useState(true)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [isMockMode, setIsMockMode] = useState(false)

    const handleUserMedia = useCallback(() => {
        setCameraError(null)
        setIsCameraReady(true)
        setIsCameraLoading(false)
    }, [])

    const handleUserMediaError = useCallback((error: string | DOMException) => {
        console.warn('Camera error - switching to Mock Mode:', error)
        setIsCameraLoading(false)
        setIsCameraReady(false)
        setIsMockMode(true)
        setCameraError(null)
    }, [])

    const handleRetry = useCallback(() => {
        setCameraError(null)
        setIsCameraLoading(true)
        setIsCameraReady(false)
        setIsMockMode(false)
        window.location.reload()
    }, [])

    // Cleanup camera stream on unmount
    useEffect(() => {
        return () => {
            const webcam = webcamRef.current
            if (webcam?.video?.srcObject) {
                try {
                    const stream = webcam.video.srcObject as MediaStream
                    stream.getTracks().forEach((track) => {
                        track.stop()
                        console.log(`🧹 [useCamera] Camera track stopped: ${track.kind}`)
                    })
                    webcam.video.srcObject = null
                } catch (error) {
                    console.warn('🧹 [useCamera] Error stopping camera stream:', error)
                }
            }
        }
    }, [])

    return {
        webcamRef,
        isCameraReady,
        isCameraLoading,
        cameraError,
        isMockMode,
        setIsMockMode,
        handleUserMedia,
        handleUserMediaError,
        handleRetry,
    }
}
