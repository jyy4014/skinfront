'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronsLeftRight } from 'lucide-react'

interface BeforeAfterSliderProps {
  beforeImage: string
  afterImage: string
  className?: string
}

export default function BeforeAfterSlider({ beforeImage, afterImage, className = '' }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50) // 0-100%
  const [isDragging, setIsDragging] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState({ before: false, after: false })
  const containerRef = useRef<HTMLDivElement>(null)

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    updateSliderPosition(e.clientX)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    if (e.touches[0]) {
      updateSliderPosition(e.touches[0].clientX)
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      e.preventDefault()
      updateSliderPosition(e.clientX)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      e.preventDefault()
      if (e.touches[0]) {
        updateSliderPosition(e.touches[0].clientX)
      }
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleTouchEnd)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, updateSliderPosition])

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-900 select-none cursor-ew-resize ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Before 이미지 (배경) */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-300"
        style={{
          backgroundImage: `url(${beforeImage})`,
          opacity: imagesLoaded.before ? 1 : 0,
        }}
      >
        <img
          src={beforeImage}
          alt="Before"
          className="hidden"
          onLoad={() => setImagesLoaded((prev) => ({ ...prev, before: true }))}
          onError={() => setImagesLoaded((prev) => ({ ...prev, before: true }))}
        />
      </div>

      {/* After 이미지 (클리핑) */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-300"
        style={{
          backgroundImage: `url(${afterImage})`,
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          opacity: imagesLoaded.after ? 1 : 0,
        }}
      >
        <img
          src={afterImage}
          alt="After"
          className="hidden"
          onLoad={() => setImagesLoaded((prev) => ({ ...prev, after: true }))}
          onError={() => setImagesLoaded((prev) => ({ ...prev, after: true }))}
        />
      </div>

      {/* 로딩 인디케이터 */}
      {(!imagesLoaded.before || !imagesLoaded.after) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
          <div className="w-8 h-8 border-2 border-[#00FFC2] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 슬라이더 핸들 */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/90 z-10 pointer-events-none"
        style={{
          left: `${sliderPosition}%`,
          transform: 'translateX(-50%)',
        }}
      >
        {/* 핸들 중앙 아이콘 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-300 pointer-events-auto">
          <ChevronsLeftRight className="w-5 h-5 text-gray-700" strokeWidth={2} />
        </div>
      </div>

      {/* 라벨 */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-semibold">
        Before
      </div>
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-semibold">
        After
      </div>
    </div>
  )
}

