'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, MapPin, MessageCircle, Target, Sparkles, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import AnalysisLoading from '../components/AnalysisLoading'
import { useToastContext } from '../components/common/ToastProvider'
import { createClient } from '@/lib/supabase/client'

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

// MediaPipe FaceMesh 타입
interface FaceMeshLandmark {
  x: number
  y: number
  z?: number
}

interface FaceMeshResults {
  multiFaceLandmarks?: FaceMeshLandmark[][]
}

// Booking 타입
interface BookingWithHospital {
  hospitals?: { name: string } | null
  hospital_name?: string
  procedure_name?: string
  treatment?: string
  [key: string]: unknown
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
  faceMeshError,
}: {
  imageUrl: string
  details: AnalysisResult['details']
  landmarks: LandmarkPosition[] | null
  faceMeshError?: string | null
}) {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Removed unused container size tracking
  // useEffect(() => {
  //   if (containerRef.current) {
  //     const rect = containerRef.current.getBoundingClientRect()
  //     setContainerSize({ width: rect.width, height: rect.height })
  //   }
  // }, [imageUrl])

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

      {/* 랜드마크 없을 때 에러 안내 */}
      {markers.length === 0 && faceMeshError && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 backdrop-blur-sm rounded-lg p-3">
          <p className="text-white text-xs font-medium">⚠️ 얼굴 인식 실패</p>
          <p className="text-white/80 text-xs mt-1">{faceMeshError}</p>
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
  const toast = useToastContext()
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [landmarks, setLandmarks] = useState<LandmarkPosition[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [faceMeshError, setFaceMeshError] = useState<string | null>(null)
  const [showMentorModal, setShowMentorModal] = useState(false)
  const [mentorComment, setMentorComment] = useState('')
  const [isSubmittingMentor, setIsSubmittingMentor] = useState(false)
  const [beforeImage, setBeforeImage] = useState<File | null>(null)
  const [beforeImagePreview, setBeforeImagePreview] = useState<string | null>(null)
  const [afterImage, setAfterImage] = useState<File | null>(null)
  const [afterImagePreview, setAfterImagePreview] = useState<string | null>(null)
  const [useCurrentImage, setUseCurrentImage] = useState(true)
  const [isHospitalVerified, setIsHospitalVerified] = useState(false)
  const [visitCount, setVisitCount] = useState(0)
  const [verifiedHospitalName, setVerifiedHospitalName] = useState<string | null>(null)
  const [verifiedProcedureName, setVerifiedProcedureName] = useState<string | null>(null)
  const [isCheckingVisit, setIsCheckingVisit] = useState(false)

  // FaceMesh 초기화 및 랜드마크 추출 (타임아웃 포함)
  const extractLandmarksFromImage = useCallback(async (imageUrl: string): Promise<LandmarkPosition[] | null> => {
    const TIMEOUT_MS = 5000 // 5초 타임아웃

    const extractPromise = new Promise<LandmarkPosition[]>(async (resolve, reject) => {
      try {
        // MediaPipe FaceMesh 동적 로드
        const FaceMeshModule = await import('@mediapipe/face_mesh')
        
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

        faceMesh.onResults((results: FaceMeshResults) => {
          if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
            const lms = results.multiFaceLandmarks[0].map((lm: FaceMeshLandmark) => ({
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
          try {
            await faceMesh.send({ image: img })
          } catch {
            reject(new Error('FaceMesh 처리 실패'))
          }
        }
        img.onerror = () => reject(new Error('이미지 로드 실패'))
        img.src = imageUrl
      } catch (err) {
        reject(err)
      }
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('FaceMesh 타임아웃 (5초)')), TIMEOUT_MS)
    })

    try {
      return await Promise.race([extractPromise, timeoutPromise])
    } catch (err) {
      console.error('FaceMesh 실패:', err)
      throw err // 에러를 상위로 전파
    }
  }, [])

  // 데이터 로드 및 API 호출
  useEffect(() => {
    const loadData = async () => {
      const startTime = Date.now() // 시작 시간 기록
      const MIN_LOADING_TIME_MS = 3000 // 최소 로딩 시간 3초
      
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
            } catch (err: unknown) {
              const errorMsg = err instanceof Error ? err.message : 'FaceMesh 처리 실패'
              console.error('랜드마크 추출 실패:', errorMsg)
              setFaceMeshError(errorMsg)
              setLandmarks(null)
              toast.error(`얼굴 인식 실패: ${errorMsg}`)
            }
          }
          
          // 최소 3초 이상 기다린 후 로딩 종료
          const elapsed = Date.now() - startTime
          const remaining = Math.max(0, MIN_LOADING_TIME_MS - elapsed)
          await new Promise(resolve => setTimeout(resolve, remaining))
          
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
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'FaceMesh 처리 실패'
            console.error('랜드마크 추출 실패:', errorMsg)
            setFaceMeshError(errorMsg)
            setLandmarks(null)
            toast.error(`얼굴 인식 실패: ${errorMsg}`)
          }
        } else if (imageData) {
          // 업로드된 이미지가 없으면 원본 base64에서 추출 시도
          try {
            const lms = await extractLandmarksFromImage(imageData)
            if (lms) setLandmarks(lms)
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'FaceMesh 처리 실패'
            console.error('랜드마크 추출 실패:', errorMsg)
            setFaceMeshError(errorMsg)
            setLandmarks(null)
            toast.error(`얼굴 인식 실패: ${errorMsg}`)
          }
        }

        // 최소 3초 이상 기다린 후 로딩 종료
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, MIN_LOADING_TIME_MS - elapsed)
        await new Promise(resolve => setTimeout(resolve, remaining))
        
        setIsLoading(false)
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : '분석에 실패했습니다'
        console.error('분석 실패:', err)
        setError(errorMsg)
        setTimeout(() => router.push('/'), 3000)
      }
    }

    loadData()
  }, [router, extractLandmarksFromImage, toast])

  // 사진 업로드 함수
  const uploadMentorImage = async (file: File, type: 'before' | 'after'): Promise<string | null> => {
    const supabase = createClient()
    try {
      const userId = localStorage.getItem('userId') || localStorage.getItem('user_id')
      if (!userId) return null

      // 파일명 생성
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${type}_${timestamp}.${fileExt}`

      // 업로드 URL 요청
      const { error: uploadError } = await supabase
        .storage
        .from('mentor-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('사진 업로드 실패:', uploadError)
        return null
      }

      // Public URL 가져오기
      const { data: urlData } = supabase
        .storage
        .from('mentor-images')
        .getPublicUrl(fileName)

      return urlData.publicUrl
    } catch (error) {
      console.error('사진 업로드 에러:', error)
      return null
    }
  }

  // 방문 기록 조회 함수
  const checkVisitHistory = async () => {
    const supabase = createClient()
    try {
      setIsCheckingVisit(true)
      const userId = localStorage.getItem('userId') || localStorage.getItem('user_id')
      if (!userId) {
        setIsHospitalVerified(false)
        setIsCheckingVisit(false)
        return
      }

      // bookings 테이블에서 방문 완료 기록 조회
      // status가 'visited' 또는 'completed'인 경우
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*, hospitals(name)')
        .eq('user_id', userId)
        .in('status', ['visited', 'completed'])
        .order('created_at', { ascending: false })

      if (error) {
        // bookings 테이블이 없을 수도 있음
        console.warn('방문 기록 조회 실패 (테이블이 없을 수 있음):', error)
        setIsHospitalVerified(false)
        setIsCheckingVisit(false)
        return
      }

      if (bookings && bookings.length > 0) {
        // 방문 기록이 있으면 인증됨
        setIsHospitalVerified(true)
        setVisitCount(bookings.length)
        
        // 가장 최근 방문 기록의 병원명과 시술명 가져오기
        const latestBooking = bookings[0] as BookingWithHospital
        setVerifiedHospitalName(
          (latestBooking.hospitals && typeof latestBooking.hospitals === 'object' && 'name' in latestBooking.hospitals
            ? latestBooking.hospitals.name
            : latestBooking.hospital_name) || null
        )
        setVerifiedProcedureName(latestBooking.procedure_name || latestBooking.treatment || null)
      } else {
        setIsHospitalVerified(false)
        setVisitCount(0)
        setVerifiedHospitalName(null)
        setVerifiedProcedureName(null)
      }
    } catch (error) {
      console.error('방문 기록 조회 에러:', error)
      setIsHospitalVerified(false)
    } finally {
      setIsCheckingVisit(false)
    }
  }

  // 멘토 모달 열기 핸들러
  const handleOpenMentorModal = () => {
    setShowMentorModal(true)
    checkVisitHistory()
  }

  // 멘토 모달 닫기 핸들러
  const handleCloseMentorModal = () => {
    setShowMentorModal(false)
    setMentorComment('')
    setBeforeImage(null)
    setBeforeImagePreview(null)
    setAfterImage(null)
    setAfterImagePreview(null)
    setUseCurrentImage(true)
    setIsHospitalVerified(false)
    setVisitCount(0)
    setVerifiedHospitalName(null)
    setVerifiedProcedureName(null)
  }

  // 멘토 팁 등록 핸들러
  const handleMentorRegister = async () => {
    if (!analysisResult) return

    if (!mentorComment.trim()) {
      toast.error('팁 내용을 입력해주세요.')
      return
    }

    setIsSubmittingMentor(true)

    try {
      const userId = localStorage.getItem('userId') || localStorage.getItem('user_id')
      if (!userId) {
        toast.error('로그인이 필요합니다.')
        setIsSubmittingMentor(false)
        return
      }

      // 추천 시술명 결정
      // 인증된 사용자는 방문했던 시술명 우선, 아니면 AI 추천 시술명
      const procedureName = isHospitalVerified && verifiedProcedureName
        ? verifiedProcedureName
        : analysisResult.recommendations?.[0]?.name || null

      // 사진 업로드
      let beforeImageUrl: string | null = null
      let afterImageUrl: string | null = null

      if (beforeImage) {
        beforeImageUrl = await uploadMentorImage(beforeImage, 'before')
        if (!beforeImageUrl) {
          toast.error('Before 사진 업로드에 실패했습니다.')
          setIsSubmittingMentor(false)
          return
        }
      }

      if (useCurrentImage && analysisResult.imageUrl) {
        // 현재 진단 이미지 사용
        afterImageUrl = analysisResult.imageUrl
      } else if (afterImage) {
        // 다른 사진 업로드
        afterImageUrl = await uploadMentorImage(afterImage, 'after')
        if (!afterImageUrl) {
          toast.error('After 사진 업로드에 실패했습니다.')
          setIsSubmittingMentor(false)
          return
        }
      }

      const response = await fetch('/api/mentor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          skinScore: analysisResult.totalScore,
          primaryConcern: analysisResult.primaryConcern,
          procedureName,
          comment: mentorComment.trim(),
          beforeImageUrl,
          afterImageUrl,
          isHospitalVerified,
          visitCount,
          verifiedHospitalName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '등록 실패')
      }

      toast.success('멘토 팁이 등록되었습니다! 다른 사용자들에게 도움이 될 거예요.')
      handleCloseMentorModal()
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '멘토 팁 등록에 실패했습니다.'
      console.error('멘토 팁 등록 실패:', err)
      toast.error(errorMsg)
    } finally {
      setIsSubmittingMentor(false)
    }
  }

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
              faceMeshError={faceMeshError}
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

        {/* ============================================ */}
        {/* 섹션 6: 멘토 등록 버튼 */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <button
            onClick={handleOpenMentorModal}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-xl text-white font-semibold hover:from-purple-500/30 hover:to-pink-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>멘토 팁 남기기</span>
          </button>
          <p className="text-gray-500 text-xs text-center mt-2">
            다른 사용자들에게 도움이 되는 팁을 공유해주세요
          </p>
        </motion.div>
      </div>

      {/* ============================================ */}
      {/* 멘토 등록 모달 */}
      {/* ============================================ */}
      <AnimatePresence>
        {showMentorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseMentorModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl bg-gradient-to-br from-gray-900 to-slate-800 border border-[#00FFC2]/30 shadow-2xl overflow-hidden"
            >
              {/* 닫기 버튼 */}
              <button
                onClick={handleCloseMentorModal}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">멘토 팁 남기기</h2>
                  <p className="text-gray-400 text-sm">
                    다른 사용자들에게 도움이 되는 팁을 공유해주세요
                  </p>
                </div>

                {/* 방문 기록 확인 중 */}
                {isCheckingVisit && (
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 text-center">
                    <div className="w-6 h-6 border-2 border-[#00FFC2] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">방문 기록 확인 중...</p>
                  </div>
                )}

                {/* 병원 방문 인증 상태 */}
                {!isCheckingVisit && (
                  <>
                    {isHospitalVerified ? (
                      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border-2 border-blue-500/50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🏥</span>
                          <h3 className="text-white font-bold text-lg">병원 방문이 인증되었습니다!</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">방문 횟수:</span>
                            <span className="text-white font-semibold">{visitCount}회</span>
                          </div>
                          {verifiedHospitalName && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">방문 병원:</span>
                              <span className="text-white font-semibold">{verifiedHospitalName}</span>
                            </div>
                          )}
                          {verifiedProcedureName && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">시술명:</span>
                              <span className="text-[#00FFC2] font-semibold">{verifiedProcedureName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-400 text-xl">⚠️</span>
                          <div className="flex-1">
                            <p className="text-yellow-400 font-semibold text-sm mb-1">
                              병원 방문 기록이 없습니다
                            </p>
                            <p className="text-gray-400 text-xs">
                              &apos;홈케어 멘토&apos;로 등록됩니다. (시술 추천 불가)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* 현재 정보 표시 */}
                {analysisResult && (
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">현재 점수</p>
                        <p className="text-white font-semibold">{analysisResult.totalScore}점</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">주요 고민</p>
                        <p className="text-white font-semibold">{analysisResult.primaryConcern}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 사진으로 인증하기 (선택) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white text-sm font-medium">사진으로 인증하기</span>
                    <span className="text-gray-500 text-xs">(선택)</span>
                  </div>

                  {/* Before 사진 업로드 */}
                  <div>
                    <label className="block text-gray-400 text-xs mb-2">시술 전 사진</label>
                    {beforeImagePreview ? (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={beforeImagePreview}
                          alt="Before"
                          className="w-full h-32 object-cover rounded-lg border border-gray-700"
                        />
                        <button
                          onClick={() => {
                            setBeforeImage(null)
                            setBeforeImagePreview(null)
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 rounded-full"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setBeforeImage(file)
                              const reader = new FileReader()
                              reader.onloadend = () => {
                                setBeforeImagePreview(reader.result as string)
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                        <div className="w-full h-32 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#00FFC2]/50 transition-colors">
                          <div className="text-center">
                            <p className="text-gray-400 text-sm">+ 사진 선택</p>
                            <p className="text-gray-500 text-xs mt-1">시술 전 사진이 있나요?</p>
                          </div>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* After 사진 선택 */}
                  <div>
                    <label className="block text-gray-400 text-xs mb-2">시술 후 사진</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCurrentImage}
                          onChange={(e) => {
                            setUseCurrentImage(e.target.checked)
                            if (e.target.checked) {
                              setAfterImage(null)
                              setAfterImagePreview(null)
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#00FFC2] focus:ring-[#00FFC2]"
                        />
                        <span className="text-gray-300 text-sm">
                          현재 진단받은 이 사진 사용하기
                        </span>
                      </label>
                      {!useCurrentImage && (
                        <>
                          {afterImagePreview ? (
                            <div className="relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={afterImagePreview}
                                alt="After"
                                className="w-full h-32 object-cover rounded-lg border border-gray-700"
                              />
                              <button
                                onClick={() => {
                                  setAfterImage(null)
                                  setAfterImagePreview(null)
                                }}
                                className="absolute top-2 right-2 p-1 bg-red-500 rounded-full"
                              >
                                <X className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          ) : (
                            <label className="block">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    setAfterImage(file)
                                    const reader = new FileReader()
                                    reader.onloadend = () => {
                                      setAfterImagePreview(reader.result as string)
                                    }
                                    reader.readAsDataURL(file)
                                  }
                                }}
                              />
                              <div className="w-full h-32 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#00FFC2]/50 transition-colors">
                                <div className="text-center">
                                  <p className="text-gray-400 text-sm">+ 사진 선택</p>
                                  <p className="text-gray-500 text-xs mt-1">다른 사진 업로드</p>
                                </div>
                              </div>
                            </label>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 팁 입력 */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    팁 내용 <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={mentorComment}
                    onChange={(e) => setMentorComment(e.target.value)}
                    placeholder="예: 재생크림을 필수로 사용하세요! 3회차부터 효과가 확실히 보였어요."
                    className="w-full h-32 px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFC2]/50 resize-none"
                    maxLength={500}
                  />
                  <p className="text-gray-500 text-xs mt-1 text-right">
                    {mentorComment.length}/500
                  </p>
                </div>

                {/* 등록 버튼 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMentorRegister}
                  disabled={isSubmittingMentor || !mentorComment.trim()}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingMentor ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>등록 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>팁 등록하기</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
