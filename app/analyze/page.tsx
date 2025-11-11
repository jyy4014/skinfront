'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/app/components/common/BottomNav'
import Header from '@/app/components/common/Header'
import AnalysisLoading from '@/app/components/analysis/ProgressLoader'
import UploadForm from '@/app/features/upload/UploadForm'
import ResultView from '@/app/features/analysis/ResultView'
import Button from '@/app/components/ui/Button'
import { useAnalysisFlow } from '@/app/features/analysis/hooks'
import { useToast } from '@/app/hooks/useToast'
import { classifyError, ErrorType } from '@/app/lib/error'

// 동적 렌더링 강제 (prerender 방지)
export const dynamic = 'force-dynamic'

export default function AnalyzePage() {
  const router = useRouter()
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [faceDetected, setFaceDetected] = useState<boolean>(false)
  
  const { uploadAndAnalyze, loading, error, progress } = useAnalysisFlow()
  const toast = useToast()

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.')
      return
    }

    setImage(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFaceDetectionResult = (detected: boolean) => {
    setFaceDetected(detected)
    if (!detected) {
      setImage(null)
      setPreview(null)
    }
  }

  const handleAnalyze = async () => {
    if (!image) return

    try {
      const result = await uploadAndAnalyze(image)
      setAnalysisResult(result)
      toast.success('분석이 완료되었습니다!')
    } catch (err) {
      const classified = classifyError(err)
      
      // 에러 타입에 따라 다른 처리
      if (classified.type === ErrorType.NETWORK) {
        toast.error(classified.message, 8000) // 네트워크 에러는 더 오래 표시
      } else if (classified.type === ErrorType.MODEL) {
        toast.warning(classified.message, 6000)
      } else {
        toast.error(classified.message)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 pb-20">
      <Header title="피부 분석하기" showBack backHref="/home" />

      <main className="max-w-md mx-auto px-4 py-6">

        {loading && progress ? (
          <AnalysisLoading step={progress.message} />
        ) : !analysisResult ? (
          <div>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error instanceof Error ? error.message : String(error)}
              </div>
            )}

            <UploadForm
              onFileSelect={handleImageSelect}
              preview={preview || undefined}
              onFaceDetectionResult={handleFaceDetectionResult}
            />

            {preview && faceDetected && (
              <div className="mt-6">
                <Button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? '분석 중...' : '분석 시작하기'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <ResultView
            analysis={analysisResult.analysis}
            mapping={analysisResult.mapping}
            nlg={analysisResult.nlg}
            preview={preview}
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
            resultId={analysisResult.id}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

