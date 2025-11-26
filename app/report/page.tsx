'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, MapPin, MessageCircle, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import AnalysisLoading from '../components/AnalysisLoading'

// ============================================
// 타입 정의
// ============================================
interface DetailScore {
  score: number
  grade: '양호' | '주의' | '위험'
  landmarkIndex: number | null
}

interface Recommendation {
  name: string
  desc: string
  tags: string[]
}

interface AnalysisResult {
  totalScore: number
  primaryConcern: string
  details: {
    pigmentation: DetailScore
    acne: DetailScore
    wrinkles: DetailScore
    pores: DetailScore
  }
  aiComment: string
  recommendations: Recommendation[]
  imageUrl?: string
  reportId?: string
}

// 랜드마크 좌표 타입
interface LandmarkPosition {
  x: number
  y: number
}

// ============================================
// 상수
// ============================================
const DETAIL_LABELS: Record<string, string> = {
  pigmentation: '기미/색소',
  acne: '여드름/붉은기',
  wrinkles: '주름/탄력',
  pores: '모공',
}

const CONCERN_TO_KEY: Record<string, string> = {
  '기미': 'pigmentation',
  '여드름': 'acne',
  '주름': 'wrinkles',
  '모공': 'pores',
}

// ============================================
// 유틸 함수
// ============================================
function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981' // green
  if (score >= 50) return '#f59e0b' // amber
  return '#ef4444' // red
}

function getScoreColorClass(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function getGradeEmoji(grade: string): string {
  if (grade === '양호') return '✅'
  if (grade === '주의') return '⚠️'
  return '🚨'
}

// ============================================
// 컴포넌트: 가로 막대그래프
// ============================================
function ScoreBar({ 
  label, 
  score, 
  grade, 
  delay = 0 
}: { 
  label: string
  score: number
  grade: string
  delay?: number
}) {
  const barColor = getScoreColorClass(score)
  const isLow = score < 50

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`p-4 rounded-xl border ${
        isLow 
          ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
          : 'bg-gray-800/50 border-gray-700/50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm">{getGradeEmoji(grade)}</span>
          <span className={`text-sm font-bold ${
            score >= 80 ? 'text-green-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {score}점
          </span>
        </div>
      </div>
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: delay + 0.2, duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${barColor} ${isLow ? 'animate-pulse' : ''}`}
        />
      </div>
    </motion.div>
  )
}

// ============================================
// 컴포넌트: 얼굴 이미지 + AR 마커 오버레이
// ============================================
function FaceImageWithMarkers({
  imageUrl,
  details,
  landmarks,
}: {
  imageUrl: string
  details: AnalysisResult['details']
  landmarks: LandmarkPosition[] | null
}) {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setContainerSize({ width: rect.width, height: rect.height })
    }
  }, [imageUrl])

  // 랜드마크 인덱스로 화면 좌표 계산
  const getMarkerPosition = (landmarkIndex: number | null): { x: number; y: number } | null => {
    if (landmarkIndex === null || !landmarks || !landmarks[landmarkIndex]) {
      return null
    }
    const lm = landmarks[landmarkIndex]
    return {
      x: lm.x * 100, // 0~100%
      y: lm.y * 100, // 0~100%
    }
  }

  const markers = Object.entries(details)
    .filter(([, detail]) => detail.landmarkIndex !== null && detail.score < 80)
    .map(([key, detail]) => ({
      key,
      label: DETAIL_LABELS[key],
      score: detail.score,
      grade: detail.grade,
      position: getMarkerPosition(detail.landmarkIndex),
    }))
    .filter((m) => m.position !== null)

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gray-900"
    >
      {/* 얼굴 이미지 */}
      <Image
        src={imageUrl}
        alt="분석된 얼굴 이미지"
        fill
        className="object-cover"
        priority
      />

      {/* AR 마커 오버레이 */}
      {markers.map((marker, index) => (
        <motion.div
          key={marker.key}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 + index * 0.15, type: 'spring', stiffness: 200 }}
          className="absolute cursor-pointer"
          style={{
            left: `${marker.position!.x}%`,
            top: `${marker.position!.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={() => setSelectedMarker(selectedMarker === marker.key ? null : marker.key)}
        >
          {/* 펄스 링 */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              width: 40,
              height: 40,
              marginLeft: -20,
              marginTop: -20,
              border: `2px solid ${getScoreColor(marker.score)}`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          
          {/* 타겟 아이콘 */}
          <div
            className="relative z-10 flex items-center justify-center rounded-full"
            style={{
              width: 32,
              height: 32,
              backgroundColor: `${getScoreColor(marker.score)}20`,
              border: `2px solid ${getScoreColor(marker.score)}`,
              boxShadow: `0 0 12px ${getScoreColor(marker.score)}80`,
            }}
          >
            <Target 
              size={16} 
              style={{ color: getScoreColor(marker.score) }}
            />
          </div>

          {/* 툴팁 */}
          <AnimatePresence>
            {selectedMarker === marker.key && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute z-20 whitespace-nowrap px-3 py-2 rounded-lg text-xs font-semibold"
                style={{
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: 8,
                  backgroundColor: '#1f2937',
                  border: `1px solid ${getScoreColor(marker.score)}`,
                  color: getScoreColor(marker.score),
                }}
              >
                {marker.label} - {marker.grade} ({marker.score}점)
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {/* 랜드마크 없을 때 안내 */}
      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <p className="text-gray-400 text-sm">마커 위치 분석 중...</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// 컴포넌트: AI 코멘트 말풍선
// ============================================
function AICommentBubble({ comment }: { comment: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border border-gray-700/50"
    >
      {/* 아이콘 */}
      <div className="absolute -top-3 -left-3 w-10 h-10 bg-[#00FFC2] rounded-full flex items-center justify-center shadow-lg shadow-[#00FFC2]/30">
        <MessageCircle size={20} className="text-black" />
      </div>
      
      <div className="ml-4">
        <p className="text-[#00FFC2] text-xs font-semibold mb-2">AI 분석가의 한마디</p>
        <p className="text-gray-200 text-sm leading-relaxed">{comment}</p>
      </div>
    </motion.div>
  )
}

// ============================================
// 컴포넌트: 추천 시술 카드 (가로 스크롤)
// ============================================
function RecommendationCards({ recommendations }: { recommendations: Recommendation[] }) {
  const router = useRouter()

  if (!recommendations || recommendations.length === 0) {
    return null
  }

  const handleCardClick = (treatmentName: string) => {
    router.push(`/hospital?keyword=${encodeURIComponent(treatmentName)}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
    >
      <h3 className="text-white font-bold text-lg mb-4">🎯 맞춤 추천 시술</h3>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        {recommendations.map((rec, index) => (
          <motion.div
            key={rec.name}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 + index * 0.1 }}
            onClick={() => handleCardClick(rec.name)}
            className="flex-shrink-0 w-[260px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700/50 cursor-pointer hover:border-[#00FFC2]/50 hover:shadow-lg hover:shadow-[#00FFC2]/10 transition-all active:scale-[0.98]"
          >
            {/* 시술명 */}
            <h4 className="text-white font-bold text-lg mb-2">{rec.name}</h4>
            
            {/* 설명 */}
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{rec.desc}</p>
            
            {/* 태그 */}
            <div className="flex flex-wrap gap-2">
              {rec.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-[#00FFC2]/10 text-[#00FFC2] text-xs rounded-full border border-[#00FFC2]/20"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-4 flex items-center gap-1 text-[#00FFC2] text-sm font-medium">
              <MapPin size={14} />
              <span>이 시술 가능한 병원 보기</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ============================================
// 메인 페이지 컴포넌트
// ============================================
export default function ReportPage() {
  const router = useRouter()
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [landmarks, setLandmarks] = useState<LandmarkPosition[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const faceMeshRef = useRef<any>(null)

  // FaceMesh 초기화 및 랜드마크 추출
  const extractLandmarksFromImage = useCallback(async (imageUrl: string) => {
    try {
      // MediaPipe FaceMesh 동적 로드
      const FaceMeshModule = await import('@mediapipe/face_mesh')
      const CameraUtilsModule = await import('@mediapipe/camera_utils')
      
      const FaceMesh = FaceMeshModule.FaceMesh
      
      const faceMesh = new FaceMesh({
        locateFile: (file: string) => 
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      })

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      return new Promise<LandmarkPosition[]>((resolve, reject) => {
        faceMesh.onResults((results: any) => {
          if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
            const lms = results.multiFaceLandmarks[0].map((lm: any) => ({
              x: lm.x,
              y: lm.y,
            }))
            resolve(lms)
          } else {
            reject(new Error('얼굴을 찾을 수 없습니다'))
          }
        })

        // 이미지 로드 및 처리
        const img = document.createElement('img')
        img.crossOrigin = 'anonymous'
        img.onload = async () => {
          await faceMesh.send({ image: img })
        }
        img.onerror = () => reject(new Error('이미지 로드 실패'))
        img.src = imageUrl
      })
    } catch (err) {
      console.error('FaceMesh 초기화 실패:', err)
      return null
    }
  }, [])

  // 데이터 로드 및 API 호출
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. 먼저 localStorage에서 캐시된 결과 확인
        const storedResult = localStorage.getItem('latest_analysis_result')
        
        if (storedResult) {
          const result: AnalysisResult = JSON.parse(storedResult)
          setAnalysisResult(result)
          
          // 이미지가 있으면 FaceMesh로 랜드마크 추출
          if (result.imageUrl) {
            try {
              const lms = await extractLandmarksFromImage(result.imageUrl)
              if (lms) setLandmarks(lms)
            } catch (err) {
              console.warn('랜드마크 추출 실패:', err)
            }
          }
          
          setIsLoading(false)
          return
        }

        // 2. localStorage에 없으면 sessionStorage에서 이미지 가져와 API 호출
        const imageData = sessionStorage.getItem('skinAnalysisImage')
        
        if (!imageData) {
          setError('분석할 이미지가 없습니다')
          setTimeout(() => router.push('/'), 2000)
          return
        }

        console.log('🚀 [Report] Calling analyze API...')
        
        // API 호출
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image: imageData,
            userId: localStorage.getItem('userId') || null,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'API 호출 실패')
        }

        const apiResult = await response.json()
        console.log('✅ [Report] API response:', apiResult)

        // API 응답을 AnalysisResult 형식으로 변환
        const result: AnalysisResult = {
          totalScore: apiResult.totalScore,
          primaryConcern: apiResult.primaryConcern,
          details: apiResult.details,
          aiComment: apiResult.aiComment || '',
          recommendations: apiResult.recommendations || [],
          imageUrl: apiResult.imageUrl,
          reportId: apiResult.reportId,
        }

        // localStorage에 캐시 저장
        localStorage.setItem('latest_analysis_result', JSON.stringify(result))
        
        setAnalysisResult(result)

        // FaceMesh로 랜드마크 추출 (이미지 URL이 있는 경우)
        if (result.imageUrl) {
          try {
            const lms = await extractLandmarksFromImage(result.imageUrl)
            if (lms) setLandmarks(lms)
          } catch (err) {
            console.warn('랜드마크 추출 실패:', err)
          }
        } else if (imageData) {
          // 업로드된 이미지가 없으면 원본 base64에서 추출 시도
          try {
            const lms = await extractLandmarksFromImage(imageData)
            if (lms) setLandmarks(lms)
          } catch (err) {
            console.warn('랜드마크 추출 실패:', err)
          }
        }

        setIsLoading(false)
      } catch (err: any) {
        console.error('분석 실패:', err)
        setError(err.message || '분석에 실패했습니다')
        setTimeout(() => router.push('/'), 3000)
      }
    }

    loadData()
  }, [router, extractLandmarksFromImage])

  // 로딩 중
  if (isLoading) {
    return <AnalysisLoading isVisible={true} />
  }

  // 에러
  if (error || !analysisResult) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || '알 수 없는 오류'}</p>
          <p className="text-gray-500 text-sm">홈으로 이동합니다...</p>
        </div>
      </div>
    )
  }

  const { totalScore, primaryConcern, details, aiComment, recommendations, imageUrl } = analysisResult

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-28">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#121212]/90 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center gap-4 px-4 py-3 max-w-[430px] mx-auto">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            aria-label="홈으로"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">AI 피부 분석 리포트</h1>
        </div>
      </header>

      <div className="max-w-[430px] mx-auto px-4">
        {/* ============================================ */}
        {/* 섹션 1: 총점 요약 */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-400 text-sm mb-1">종합 피부 점수</p>
          <div className="flex items-center justify-center gap-3">
            <span 
              className="text-6xl font-bold"
              style={{ color: getScoreColor(totalScore) }}
            >
              {totalScore}
            </span>
            <span className="text-2xl text-gray-500">/100</span>
          </div>
          <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full">
            <span className="text-gray-400 text-sm">주요 문제:</span>
            <span className="text-white font-semibold">{primaryConcern}</span>
          </div>
        </motion.div>

        {/* ============================================ */}
        {/* 섹션 2: 얼굴 이미지 + AR 마커 */}
        {/* ============================================ */}
        {imageUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <h3 className="text-white font-bold text-lg mb-4">📍 문제 부위 분석</h3>
            <FaceImageWithMarkers
              imageUrl={imageUrl}
              details={details}
              landmarks={landmarks}
            />
            <p className="text-gray-500 text-xs mt-2 text-center">
              마커를 탭하면 상세 정보를 볼 수 있어요
            </p>
          </motion.div>
        )}

        {/* ============================================ */}
        {/* 섹션 3: 상세 점수 막대그래프 */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10"
        >
          <h3 className="text-white font-bold text-lg mb-4">📊 항목별 상세 점수</h3>
          <div className="space-y-3">
            {Object.entries(details).map(([key, detail], index) => (
              <ScoreBar
                key={key}
                label={DETAIL_LABELS[key]}
                score={detail.score}
                grade={detail.grade}
                delay={0.5 + index * 0.1}
              />
            ))}
          </div>
        </motion.div>

        {/* ============================================ */}
        {/* 섹션 4: AI 코멘트 말풍선 */}
        {/* ============================================ */}
        {aiComment && (
          <div className="mt-10">
            <AICommentBubble comment={aiComment} />
          </div>
        )}

        {/* ============================================ */}
        {/* 섹션 5: 추천 시술 카드 */}
        {/* ============================================ */}
        <div className="mt-10">
          <RecommendationCards recommendations={recommendations} />
        </div>
      </div>

      {/* ============================================ */}
      {/* 하단 플로팅 CTA 버튼 */}
      {/* ============================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="fixed bottom-0 left-0 right-0 z-50 max-w-[430px] mx-auto px-4 pb-4 pt-2 bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent"
      >
        <Link
          href="/hospital"
          className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] text-black font-bold rounded-xl hover:from-[#00E6B8] hover:to-[#00D4A3] transition-all shadow-lg shadow-[#00FFC2]/40 active:scale-[0.98]"
        >
          <MapPin size={20} />
          <span>내 주변 치료 병원 찾기</span>
        </Link>
      </motion.div>
    </div>
  )
}
