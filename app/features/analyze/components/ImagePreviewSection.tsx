'use client'

import Button from '@/app/components/ui/Button'
import { ImageQualityFeedback } from '@/app/components/analysis/ImageQualityFeedback'
import { ImageQualityResult } from '@/app/lib/image/quality-check'
import { Loader2 } from 'lucide-react'

interface ImagePreviewSectionProps {
  preview: string
  onReset: () => void
  onAnalyze: () => void
  analyzing?: boolean
  processing?: boolean
  quality?: ImageQualityResult | null
  qualityChecking?: boolean
  onRetake?: () => void
}

/**
 * 이미지 미리보기 및 분석 액션 섹션 컴포넌트
 */
export function ImagePreviewSection({
  preview,
  onReset,
  onAnalyze,
  analyzing = false,
  processing = false,
  quality,
  qualityChecking = false,
  onRetake,
}: ImagePreviewSectionProps) {
  return (
    <div className="space-y-6">
      <div 
        className="relative rounded-xl overflow-hidden bg-gray-100" 
        role="img" 
        aria-label="업로드된 피부 사진 미리보기"
      >
        <img
          src={preview}
          alt="업로드된 피부 사진"
          className="w-full h-auto max-h-96 object-contain mx-auto"
        />
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none" 
          aria-hidden="true"
        >
          <div className="w-64 h-64 border-4 border-pink-400/50 rounded-full border-dashed"></div>
        </div>
      </div>

      {/* 이미지 품질 피드백 */}
      {qualityChecking && (
        <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
          <p className="text-sm text-gray-600">이미지 품질을 검사하고 있어요...</p>
        </div>
      )}

      {quality && !qualityChecking && (
        <ImageQualityFeedback quality={quality} onRetake={onRetake} />
      )}
      
      <div className="flex gap-3">
        <Button
          onClick={onReset}
          variant="outline"
          className="flex-1"
          disabled={processing}
        >
          다시 선택
        </Button>
        <Button
          onClick={onAnalyze}
          className="flex-1"
          disabled={analyzing || processing || !!(quality && !quality.isGood)}
        >
          {analyzing ? '분석 중...' : '분석 시작하기'}
        </Button>
      </div>

      {quality && !quality.isGood && (
        <p className="text-xs text-center text-red-600">
          품질이 낮은 이미지는 정확한 분석이 어려울 수 있습니다. 재촬영을 권장합니다.
        </p>
      )}
    </div>
  )
}

