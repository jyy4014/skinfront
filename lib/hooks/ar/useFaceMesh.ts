import { useRef, useEffect, useState, useCallback } from 'react'
import type { FaceMesh as FaceMeshType, Results } from '@mediapipe/face_mesh'
import Webcam from 'react-webcam'
import { TRACKING_CANVAS_WIDTH } from '../../ar/types'

export const useFaceMesh = (
    isReady: boolean,
    isMockMode: boolean,
    webcamRef: React.RefObject<Webcam | null>,
    onResults: (results: Results) => void
) => {
    const faceMeshRef = useRef<FaceMeshType | null>(null)
    const [isModelReady, setIsModelReady] = useState(false)
    const trackingCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const isCleanedUpRef = useRef(false)

    // Initialize FaceMesh
    useEffect(() => {
        if (!isReady) return

        isCleanedUpRef.current = false
        let isMounted = true

        const initFaceMesh = async () => {
            try {
                const { FaceMesh } = await import('@mediapipe/face_mesh')
                if (!isMounted) return

                const faceMesh = new FaceMesh({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
                })

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                })

                faceMesh.onResults(onResults)
                faceMeshRef.current = faceMesh
                setIsModelReady(true)
            } catch (error) {
                console.error('Failed to initialize FaceMesh:', error)
            }
        }

        initFaceMesh()

        return () => {
            console.log('🧹 [useFaceMesh] Cleanup triggered')
            isMounted = false
            isCleanedUpRef.current = true

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }

            if (faceMeshRef.current) {
                try {
                    faceMeshRef.current.close()
                    faceMeshRef.current = null
                } catch (error) {
                    console.warn('Error closing FaceMesh:', error)
                }
            }
            setIsModelReady(false)
        }
    }, [isReady])

    // Update callback
    useEffect(() => {
        if (faceMeshRef.current) {
            faceMeshRef.current.onResults(onResults)
        }
    }, [onResults])

    // Frame Processing Loop
    const processFrame = useCallback(async () => {
        if (isCleanedUpRef.current) return

        const video = webcamRef.current?.video
        if (!faceMeshRef.current) {
            animationFrameRef.current = requestAnimationFrame(processFrame)
            return
        }

        try {
            if (isMockMode) {
                const mockImg = document.querySelector('img[alt="Mock face for development"]') as HTMLImageElement
                if (mockImg && mockImg.complete && mockImg.naturalWidth > 0) {
                    await faceMeshRef.current.send({ image: mockImg })
                }
            } else if (video && video.readyState === (video.HAVE_ENOUGH_DATA || 4)) {
                if (!trackingCanvasRef.current) {
                    trackingCanvasRef.current = document.createElement('canvas')
                }
                const trackingCanvas = trackingCanvasRef.current
                const aspectRatio = video.videoHeight / video.videoWidth
                const trackingWidth = TRACKING_CANVAS_WIDTH
                const trackingHeight = Math.round(trackingWidth * aspectRatio)

                if (trackingCanvas.width !== trackingWidth || trackingCanvas.height !== trackingHeight) {
                    trackingCanvas.width = trackingWidth
                    trackingCanvas.height = trackingHeight
                }

                const ctx = trackingCanvas.getContext('2d', { alpha: false })
                if (ctx) {
                    ctx.drawImage(video, 0, 0, trackingWidth, trackingHeight)
                    await faceMeshRef.current.send({ image: trackingCanvas })
                }
            }
        } catch (error) {
            if (!isCleanedUpRef.current) console.error('FaceMesh processing error:', error)
        }

        if (!isCleanedUpRef.current) {
            animationFrameRef.current = requestAnimationFrame(processFrame)
        }
    }, [isMockMode, webcamRef])

    // Start loop
    useEffect(() => {
        if (isModelReady) {
            const timer = setTimeout(() => {
                processFrame()
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [isModelReady, processFrame])

    return { isModelReady, faceMeshRef }
}
