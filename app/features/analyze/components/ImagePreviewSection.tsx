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
  onAddSideAngles?: () => void // 좌/우 추가 촬영 (선택사항)
  hasSideAngles?: boolean // 좌/우 사진이 있는지 여부
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
  onAddSideAngles,
  hasSideAngles = false,
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

      {/* AI 서포트 UX 문구 */}
      {quality && quality.isGood && quality.overallScore >= 80 && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-4">
          <p className="text-sm font-medium text-pink-700 text-center">
            멋져요! 분석에 적합한 사진이네요 🔍
          </p>
          <p className="text-xs text-pink-600 text-center mt-1">
            AI가 피부 결, 색소, 트러블 패턴을 인식하고 있어요.
          </p>
        </div>
      )}

      {/* 좌/우 추가 촬영 옵션 (선택사항) */}
      {!hasSideAngles && onAddSideAngles && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-800 text-center mb-2">
            💡 더 정확한 분석을 위해 좌/우 사진도 촬영하시겠어요?
          </p>
          <p className="text-xs text-blue-700 text-center mb-3">
            좌/우 사진을 추가하면 측면 주름, 색소 등을 더 정확하게 분석할 수 있습니다. (선택사항)
          </p>
          <Button
            onClick={onAddSideAngles}
            variant="outline"
            className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
            disabled={processing}
          >
            좌/우 사진 추가 촬영
          </Button>
        </div>
      )}

      {hasSideAngles && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-xs text-green-700 text-center">
            ✅ 정면, 좌측, 우측 사진이 모두 준비되었습니다. 더 정확한 분석이 가능합니다.
          </p>
        </div>
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
          {analyzing ? '분석 중...' : 'AI 분석 시작하기'}
        </Button>
      </div>

      {quality && !quality.isGood && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-xs text-center text-yellow-800 font-medium mb-1">
            조명이 어둡습니다. 다시 찍을까요?
          </p>
          <p className="text-xs text-center text-yellow-700">
            품질이 낮은 이미지는 정확한 분석이 어려울 수 있습니다. 재촬영을 권장합니다.
          </p>
        </div>
      )}
    </div>
  )
}

