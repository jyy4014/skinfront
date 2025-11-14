'use client'

import Button from '@/app/components/ui/Button'

interface ImagePreviewSectionProps {
  preview: string
  onReset: () => void
  onAnalyze: () => void
  analyzing?: boolean
  processing?: boolean
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
          disabled={analyzing || processing}
        >
          {analyzing ? '분석 중...' : '분석 시작하기'}
        </Button>
      </div>
    </div>
  )
}

