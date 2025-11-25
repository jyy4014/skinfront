'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, AlertCircle, CheckCircle, Info, Zap, Bandage, DollarSign, Sparkles, Flame, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { analyzeSkinCondition, type RealSkinAnalysisResult } from '../utils/realSkinAnalysis'
import { getRecommendedTreatment } from '../utils/simpleAnalysis'
import type { TreatmentRecommendation } from '../utils/simpleAnalysis'
import { saveSkinRecord } from '../utils/storage'
import AnalysisLoading from '../components/AnalysisLoading'
import RewardAdModal from '../components/RewardAdModal'

// 원형 차트 컴포넌트
function ScoreChart({ score, size = 160 }: { score: number; size?: number }) {
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = (score: number) => {
    if (score >= 80) return '#10b981' // green-500
    if (score >= 60) return '#3b82f6' // blue-500
    if (score >= 40) return '#f59e0b' // amber-500
    return '#ef4444' // red-500
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth="16"
          fill="none"
        />
        {/* 프로그레스 원 */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth="16"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      {/* 중앙 점수 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-white">{score}</div>
          <div className="text-sm font-semibold text-gray-400 mt-1">점</div>
        </div>
      </div>
    </div>
  )
}

// 문제 항목 타입
interface ProblemItem {
  id: string
  name: string
  score: number
  status: 'good' | 'warning' | 'danger'
  position: { x: number; y: number } // 얼굴 일러스트 상의 위치 (0-100%) - 대표 위치 1개만
}

export default function ReportPage() {
  const router = useRouter()
  const [analysisResult, setAnalysisResult] = useState<RealSkinAnalysisResult | null>(null)
  const [recommendedTreatment, setRecommendedTreatment] = useState<TreatmentRecommendation | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [showRewardAd, setShowRewardAd] = useState(false)
  const [shouldShowAd, setShouldShowAd] = useState(false)

  // 분석 실행 함수 (분리)
  const runAnalysis = async () => {
      try {
        // sessionStorage에서 이미지와 랜드마크 가져오기
        const imageData = sessionStorage.getItem('skinAnalysisImage')
        const landmarksStr = sessionStorage.getItem('skinAnalysisLandmarks')
        
        if (imageData && landmarksStr) {
          const landmarks = JSON.parse(landmarksStr)
          
          console.log('📥 [Report Page] Data loaded:', {
            hasImage: !!imageData,
            imageLength: imageData?.length || 0,
            hasLandmarks: !!landmarks,
            landmarksLength: landmarks?.length || 0,
            landmarksType: Array.isArray(landmarks) ? 'array' : typeof landmarks,
          })
          
          // 실제 분석 실행
          const result = await analyzeSkinCondition(imageData, landmarks)
          
          console.log('✅ [Report Page] Analysis result:', result)
          setAnalysisResult(result)
          
          // 분석 결과를 localStorage에 저장 (utils/storage.ts 사용)
          const recordToSave = {
            date: new Date().toISOString(),
            totalScore: result.totalScore,
            primaryConcern: result.primaryConcern,
            details: result.details,
          }
          saveSkinRecord(recordToSave)
          
          // 추천 시술 결정 (primaryConcern 기반)
          const mockAnalysisResult = {
            mainIssue: (result.primaryConcern === '기미' ? 'pigmentation' 
              : result.primaryConcern === '모공' ? 'pores'
              : result.primaryConcern === '주름' ? 'wrinkles'
              : 'acne') as 'pigmentation' | 'pores' | 'wrinkles' | 'acne',
            totalScore: result.totalScore,
            skinAge: Math.floor(20 + (100 - result.totalScore) / 4),
            issues: {
              pigmentation: result.details.pigmentation.score,
              pores: result.details.pores.score,
              wrinkles: result.details.wrinkles.score,
              acne: result.details.acne.score,
            }
          }
          setRecommendedTreatment(getRecommendedTreatment(mockAnalysisResult))
        } else {
          // 데이터가 없으면 기본값 사용 (fallback)
          const defaultResult: RealSkinAnalysisResult = {
            totalScore: 50,
            details: {
              pigmentation: { score: 50, grade: '주의' },
              pores: { score: 50, grade: '주의' },
              wrinkles: { score: 50, grade: '주의' },
              acne: { score: 50, grade: '주의' },
            },
            primaryConcern: '기미',
          }
          setAnalysisResult(defaultResult)
          const mockAnalysisResult = {
            mainIssue: 'pigmentation' as const,
            totalScore: 50,
            skinAge: 30,
            issues: {
              pigmentation: 50,
              pores: 50,
              wrinkles: 50,
              acne: 50,
            }
          }
          setRecommendedTreatment(getRecommendedTreatment(mockAnalysisResult))
        }
      } catch (error) {
        console.error('Analysis error:', error)
        // 에러 발생 시 기본값 사용
        const defaultResult: RealSkinAnalysisResult = {
          totalScore: 50,
          details: {
            pigmentation: { score: 50, grade: '주의' },
            pores: { score: 50, grade: '주의' },
            wrinkles: { score: 50, grade: '주의' },
            acne: { score: 50, grade: '주의' },
          },
          primaryConcern: '기미',
        }
        setAnalysisResult(defaultResult)
        const mockAnalysisResult = {
          mainIssue: 'pigmentation' as const,
          totalScore: 50,
          skinAge: 30,
          issues: {
            pigmentation: 50,
            pores: 50,
            wrinkles: 50,
            acne: 50,
          }
        }
        setRecommendedTreatment(getRecommendedTreatment(mockAnalysisResult))
      } finally {
        setIsAnalyzing(false)
      }
    }

  // 광고 시청 로직 (Gatekeeper) - 프리미엄 모델
  useEffect(() => {
    // 프리미엄 유저 체크
    const userTier = localStorage.getItem('user_tier')
    const analysisCount = parseInt(localStorage.getItem('analysis_count') || '0', 10)

    // 프리미엄 유저는 횟수 체크 및 광고 로직을 아예 건너뜀 (Pass)
    if (userTier === 'premium') {
      setIsAnalyzing(true)
      runAnalysis()
      return
    }

    // 일반 유저는 기존대로 3회마다 광고 체크
    if (analysisCount > 0 && analysisCount % 3 === 0) {
      // 광고 모달 표시 (분석 일시 정지)
      setShouldShowAd(true)
      setShowRewardAd(true)
      setIsAnalyzing(false)
    } else {
      // 광고 안 보는 순서 -> 바로 분석 시작
      setIsAnalyzing(true)
      runAnalysis()
      // count를 1 올림
      localStorage.setItem('analysis_count', String(analysisCount + 1))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 광고 모달 닫기 핸들러
  const handleAdClose = () => {
    setShowRewardAd(false)
    setShouldShowAd(false)
    // 광고를 다 보고 닫으면 -> count를 1 올리고 분석 시작
    const analysisCount = parseInt(localStorage.getItem('analysis_count') || '0', 10)
    localStorage.setItem('analysis_count', String(analysisCount + 1))
    setIsAnalyzing(true)
    runAnalysis()
  }

  // 광고 모달이 표시되어야 하는 경우
  if (shouldShowAd && showRewardAd) {
    return (
      <>
        <AnalysisLoading isVisible={false} />
        <RewardAdModal isOpen={showRewardAd} onClose={handleAdClose} />
      </>
    )
  }

  // 분석 결과가 없으면 로딩 표시
  if (isAnalyzing || !analysisResult || !recommendedTreatment) {
    // 다음 광고까지 남은 횟수 계산
    const analysisCount = parseInt(localStorage.getItem('analysis_count') || '0', 10)
    const nextAdAt = Math.ceil((analysisCount + 1) / 3) * 3
    const remainingCount = Math.max(0, nextAdAt - analysisCount - 1)
    
    return <AnalysisLoading isVisible={true} remainingCount={remainingCount} />
  }

  const { totalScore, details, primaryConcern } = analysisResult
  const skinAge = Math.floor(20 + (100 - totalScore) / 4) // 피부 나이 계산

  // 등급을 status로 변환
  const gradeToStatus = (grade: '양호' | '주의' | '위험'): 'good' | 'warning' | 'danger' => {
    if (grade === '양호') return 'good'
    if (grade === '주의') return 'warning'
    return 'danger'
  }

  // 문제 항목 데이터 (실제 분석 결과 기반)
  const problems: ProblemItem[] = [
    { 
      id: 'pigmentation', 
      name: '기미', 
      score: details.pigmentation.score, 
      status: gradeToStatus(details.pigmentation.grade), 
      position: { x: 65, y: 45 } // 오른쪽 광대뼈 중앙
    },
    { 
      id: 'pores', 
      name: '모공', 
      score: details.pores.score, 
      status: gradeToStatus(details.pores.grade), 
      position: { x: 45, y: 50 } // 코 바로 옆 나비존
    },
    { 
      id: 'wrinkles', 
      name: '주름', 
      score: details.wrinkles.score, 
      status: gradeToStatus(details.wrinkles.grade), 
      position: { x: 25, y: 35 } // 왼쪽 눈가 옆
    },
    { 
      id: 'acne', 
      name: '여드름', 
      score: details.acne.score, 
      status: gradeToStatus(details.acne.grade), 
      position: { x: 50, y: 25 } // 이마 중앙
    },
  ]

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setIsAnalyzing(true)
    try {
      // sessionStorage에서 다시 가져와서 재분석
      const imageData = sessionStorage.getItem('skinAnalysisImage')
      const landmarksStr = sessionStorage.getItem('skinAnalysisLandmarks')
      
      if (imageData && landmarksStr) {
        const landmarks = JSON.parse(landmarksStr)
        const result = await analyzeSkinCondition(imageData, landmarks)
        setAnalysisResult(result)
        
        // 분석 결과를 localStorage에 저장 (히스토리용)
        try {
          // 데이터 유효성 검사
          if (
            !result ||
            typeof result.totalScore !== 'number' ||
            result.totalScore < 0 ||
            result.totalScore > 100 ||
            !result.primaryConcern ||
            !result.details
          ) {
            console.warn('Invalid analysis result, skipping save:', result)
            return
          }

          const historyRecord = {
            id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 고유 ID 보장
            date: new Date().toISOString(),
            totalScore: Math.max(0, Math.min(100, result.totalScore)), // 0-100 범위로 제한
            primaryConcern: result.primaryConcern,
            details: {
              pigmentation: {
                score: Math.max(0, Math.min(100, result.details.pigmentation?.score || 50)),
                grade: result.details.pigmentation?.grade || '주의',
              },
              pores: {
                score: Math.max(0, Math.min(100, result.details.pores?.score || 50)),
                grade: result.details.pores?.grade || '주의',
              },
              wrinkles: {
                score: Math.max(0, Math.min(100, result.details.wrinkles?.score || 50)),
                grade: result.details.wrinkles?.grade || '주의',
              },
              acne: {
                score: Math.max(0, Math.min(100, result.details.acne?.score || 50)),
                grade: result.details.acne?.grade || '주의',
              },
            },
          }
          
          // 기존 기록 불러오기
          let existingRecords: string | null = null
          try {
            existingRecords = localStorage.getItem('skinAnalysisHistory')
          } catch (error) {
            console.error('Failed to access localStorage:', error)
            return
          }

          let records: typeof historyRecord[] = []
          if (existingRecords) {
            try {
              const parsed = JSON.parse(existingRecords)
              if (Array.isArray(parsed)) {
                records = parsed
              } else {
                console.warn('Invalid records format in localStorage, resetting')
                records = []
              }
            } catch (error) {
              console.error('Failed to parse existing records:', error)
              records = []
            }
          }
          
          // 새 기록 추가 (최신순으로 정렬)
          records.unshift(historyRecord)
          
          // 최대 50개까지만 저장 (성능 고려)
          const trimmedRecords = records.slice(0, 50)
          
          try {
            localStorage.setItem('skinAnalysisHistory', JSON.stringify(trimmedRecords))
            console.log('💾 [Report Page] Analysis record saved to localStorage (refresh)')
          } catch (error) {
            // 저장 실패 시 (용량 초과 등) 오래된 기록 삭제 후 재시도
            console.warn('Failed to save, trying to clear old records:', error)
            try {
              const reducedRecords = trimmedRecords.slice(0, 25) // 절반으로 줄임
              localStorage.setItem('skinAnalysisHistory', JSON.stringify(reducedRecords))
              console.log('💾 [Report Page] Analysis record saved with reduced history (refresh)')
            } catch (retryError) {
              console.error('Failed to save analysis record after retry:', retryError)
            }
          }
        } catch (error) {
          console.error('Unexpected error saving analysis record:', error)
        }
        
        const mockAnalysisResult = {
          mainIssue: (result.primaryConcern === '기미' ? 'pigmentation' 
            : result.primaryConcern === '모공' ? 'pores'
            : result.primaryConcern === '주름' ? 'wrinkles'
            : 'acne') as 'pigmentation' | 'pores' | 'wrinkles' | 'acne',
          totalScore: result.totalScore,
          skinAge: Math.floor(20 + (100 - result.totalScore) / 4),
          issues: {
            pigmentation: result.details.pigmentation.score,
            pores: result.details.pores.score,
            wrinkles: result.details.wrinkles.score,
            acne: result.details.acne.score,
          }
        }
        setRecommendedTreatment(getRecommendedTreatment(mockAnalysisResult))
      }
    } catch (error) {
      console.error('Refresh analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-500 bg-green-500/20'
      case 'warning':
        return 'text-amber-500 bg-amber-500/20'
      case 'danger':
        return 'text-red-500 bg-red-500/20'
      default:
        return 'text-gray-500 bg-gray-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4" />
      case 'warning':
        return <AlertCircle className="w-4 h-4" />
      case 'danger':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'good':
        return '양호'
      case 'warning':
        return '주의'
      case 'danger':
        return '위험'
      default:
        return '보통'
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-28">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#121212]/90 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center gap-4 px-4 py-3 max-w-[430px] mx-auto">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">진단 리포트</h1>
        </div>
      </header>

      <div className="max-w-[430px] mx-auto px-4">
        {/* Score Section */}
        <div className="mt-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-gray-400 text-sm mb-2">피부 나이</p>
            <h2 className="text-5xl font-bold text-white mb-6">{skinAge}세</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center mb-4"
          >
            <ScoreChart score={totalScore} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-gray-300 text-base"
          >
            상위 <span className="text-[#00FFC2] font-semibold">15%</span> 피부입니다
          </motion.p>
        </div>

        {/* Problem Map */}
        <div className="mt-12">
          <h3 className="text-lg font-bold text-white mb-4">문제 부위 분석</h3>
          
          {/* 얼굴 일러스트 영역 */}
          <div 
            className="relative rounded-2xl p-8 mb-6 border border-gray-700/50 overflow-hidden"
            style={{
              backgroundColor: '#0B1221',
              backgroundImage: `
                linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                radial-gradient(circle at center, rgba(0, 255, 194, 0.1) 0%, transparent 70%)
              `,
              backgroundSize: '20px 20px, 20px 20px, 100% 100%',
              backgroundPosition: '0 0, 0 0, center',
            }}
          >
            {/* 마커 컨테이너 */}
            <div className="relative mx-auto flex items-center justify-center" style={{ width: 280, height: 320 }}>
              {/* 얼굴 윤곽선 SVG 가이드 (컨테이너의 90% 높이, 높은 대비) */}
              <svg 
                width="100%" 
                height="90%" 
                className="absolute" 
                viewBox="0 0 280 320"
                preserveAspectRatio="xMidYMid meet"
                style={{ 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))',
                }}
              >
                {/* 얼굴 윤곽 (타원) - 밝고 진하게 */}
                <ellipse
                  cx="140"
                  cy="160"
                  rx="90"
                  ry="115"
                  fill="none"
                  stroke="#D1D5DB"
                  strokeWidth="2"
                  opacity="0.9"
                />
                {/* 눈 영역 - 밝고 진하게 */}
                <ellipse
                  cx="110"
                  cy="120"
                  rx="16"
                  ry="10"
                  fill="none"
                  stroke="#D1D5DB"
                  strokeWidth="1.5"
                  opacity="0.85"
                />
                <ellipse
                  cx="170"
                  cy="120"
                  rx="16"
                  ry="10"
                  fill="none"
                  stroke="#D1D5DB"
                  strokeWidth="1.5"
                  opacity="0.85"
                />
                {/* 코 영역 - 밝고 진하게 */}
                <ellipse
                  cx="140"
                  cy="150"
                  rx="5"
                  ry="18"
                  fill="none"
                  stroke="#D1D5DB"
                  strokeWidth="1.5"
                  opacity="0.85"
                />
                {/* 입 영역 - 밝고 진하게 */}
                <ellipse
                  cx="140"
                  cy="195"
                  rx="22"
                  ry="7"
                  fill="none"
                  stroke="#D1D5DB"
                  strokeWidth="1.5"
                  opacity="0.85"
                />
                {/* 턱선 - 밝고 진하게 */}
                <path
                  d="M 70 240 Q 140 275 210 240"
                  fill="none"
                  stroke="#D1D5DB"
                  strokeWidth="2"
                  opacity="0.9"
                />
              </svg>

              {/* 문제 위치 마커 (날카로운 조준선 스타일) - 각 증상별 대표 위치 1개씩만 */}
              {problems.map((problem) => {
                const getMarkerColor = () => {
                  if (problem.status === 'good') return '#10b981' // green-500
                  if (problem.status === 'warning') return '#f59e0b' // amber-500
                  return '#ef4444' // red-500
                }
                
                const markerColor = getMarkerColor()
                
                return (
                  <motion.div
                    key={problem.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      delay: 0.5 + problems.indexOf(problem) * 0.1,
                      type: 'spring',
                      stiffness: 200,
                      damping: 15
                    }}
                    className="absolute"
                    style={{
                      left: `${problem.position.x}%`,
                      top: `${problem.position.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {/* 작고 정밀한 조준선 마커 */}
                    <div className="relative">
                      {/* 아주 작은 조준선 (w-5 h-5 = 20px) */}
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        className="relative z-10"
                        style={{
                          filter: `drop-shadow(0 0 2px ${markerColor}) drop-shadow(0 0 4px ${markerColor}40)`,
                        }}
                      >
                        {/* 십자선 (아주 얇게) */}
                        <line
                          x1="12"
                          y1="6"
                          x2="12"
                          y2="18"
                          stroke={markerColor}
                          strokeWidth="0.8"
                          strokeLinecap="round"
                        />
                        <line
                          x1="6"
                          y1="12"
                          x2="18"
                          y2="12"
                          stroke={markerColor}
                          strokeWidth="0.8"
                          strokeLinecap="round"
                        />
                        {/* 모서리 조준선 (꺾쇠 괄호 형태, 아주 얇게) */}
                        <line
                          x1="6"
                          y1="6"
                          x2="9"
                          y2="6"
                          stroke={markerColor}
                          strokeWidth="1"
                          strokeLinecap="round"
                        />
                        <line
                          x1="6"
                          y1="6"
                          x2="6"
                          y2="9"
                          stroke={markerColor}
                          strokeWidth="1"
                          strokeLinecap="round"
                        />
                        <line
                          x1="18"
                          y1="6"
                          x2="15"
                          y2="6"
                          stroke={markerColor}
                          strokeWidth="1"
                          strokeLinecap="round"
                        />
                        <line
                          x1="18"
                          y1="6"
                          x2="18"
                          y2="9"
                          stroke={markerColor}
                          strokeWidth="1"
                          strokeLinecap="round"
                        />
                        <line
                          x1="6"
                          y1="18"
                          x2="9"
                          y2="18"
                          stroke={markerColor}
                          strokeWidth="1"
                          strokeLinecap="round"
                        />
                        <line
                          x1="6"
                          y1="18"
                          x2="6"
                          y2="15"
                          stroke={markerColor}
                          strokeWidth="1"
                          strokeLinecap="round"
                        />
                        <line
                          x1="18"
                          y1="18"
                          x2="15"
                          y2="18"
                          stroke={markerColor}
                          strokeWidth="1"
                          strokeLinecap="round"
                        />
                        <line
                          x1="18"
                          y1="18"
                          x2="18"
                          y2="15"
                          stroke={markerColor}
                          strokeWidth="1"
                          strokeLinecap="round"
                        />
                        {/* 중앙 점 (아주 작고, ping 애니메이션) */}
                        <motion.circle
                          cx="12"
                          cy="12"
                          r="1"
                          fill={markerColor}
                          animate={{
                            scale: [1, 2, 1],
                            opacity: [1, 0, 1],
                          }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                      </svg>
                      
                      {/* 라벨 (마커에 가깝게 배치, 간격 최소화) */}
                      <div 
                        className="absolute whitespace-nowrap text-[10px] font-semibold leading-tight"
                        style={{
                          left: 'calc(100% + 4px)',
                          top: '-2px',
                          color: markerColor,
                          textShadow: `0 0 6px ${markerColor}50`,
                        }}
                      >
                        {problem.name}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* 문제 항목 리스트 */}
          <div className="space-y-3">
            {problems.map((problem) => (
              <motion.div
                key={problem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + problems.indexOf(problem) * 0.1 }}
                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${getStatusColor(problem.status)}`}>
                      {getStatusIcon(problem.status)}
                    </div>
                    <span className="text-white font-medium">{problem.name}</span>
                  </div>
                  <span className={`text-sm font-semibold ${getStatusColor(problem.status).split(' ')[0]}`}>
                    {getStatusLabel(problem.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${problem.score}%` }}
                      transition={{ duration: 1, delay: 0.8 + problems.indexOf(problem) * 0.1 }}
                      className={`h-full ${
                        problem.status === 'good'
                          ? 'bg-green-500'
                          : problem.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                    />
                  </div>
                  <span className="text-gray-400 text-sm w-12 text-right">{problem.score}점</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI 시술 솔루션 */}
        <div className="mt-12 mb-32">
          <h3 className="text-lg font-bold text-white mb-6">
            {totalScore}점인 회원님에게 가장 필요한 시술
          </h3>
          
          {/* 메인 히어로 카드 (1개, 강조) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="relative bg-gradient-to-br from-[#1A2333] to-[#0F1620] rounded-2xl p-6 mb-6 border border-gray-700/50 shadow-xl"
          >
            {/* 새로고침 버튼 (우측 상단) */}
            <button
              onClick={handleRefresh}
              disabled={isAnalyzing}
              className="absolute top-4 right-4 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors border border-gray-700/30 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="추천 새로고침"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
            </button>

            {/* Best 뱃지 */}
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#00FFC2]/20 text-[#00FFC2] text-xs font-bold rounded-full border border-[#00FFC2]/30">
                Best
              </span>
              <h4 className="text-white font-bold text-2xl">
                {recommendedTreatment.name} ({recommendedTreatment.nameEn})
              </h4>
            </div>

            {/* 태그 */}
            <div className="flex flex-wrap gap-2 mb-6">
              {recommendedTreatment.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 ${
                    index === 0
                      ? 'bg-red-500/20 text-red-400 border-red-500/20'
                      : 'bg-purple-500/20 text-purple-400 border-purple-500/20'
                  } text-xs font-semibold rounded-full flex items-center gap-1 border`}
                >
                  {index === 0 && <Flame className="w-3 h-3" />}
                  {index === 1 && <Sparkles className="w-3 h-3" />}
                  {tag}
                </span>
              ))}
            </div>

            {/* 스펙 그리드 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-gray-400 text-xs">통증</span>
                </div>
                <p className="text-white font-bold text-base">{recommendedTreatment.pain.level}</p>
                <p className="text-gray-500 text-xs mt-1">{recommendedTreatment.pain.score}/5</p>
              </div>
              
              <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Bandage className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400 text-xs">회복</span>
                </div>
                <p className="text-white font-bold text-base">{recommendedTreatment.recovery}</p>
                <p className="text-gray-500 text-xs mt-1">-</p>
              </div>
              
              <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400 text-xs">예상가</span>
                </div>
                <p className="text-white font-bold text-base">{recommendedTreatment.price}</p>
                <p className="text-gray-500 text-xs mt-1">{recommendedTreatment.priceNote}</p>
              </div>
            </div>
          </motion.div>

          {/* 서브 추천 리스트 (N개) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mb-6"
          >
            <h4 className="text-white font-semibold text-base mb-4">함께하면 좋은 시너지 케어</h4>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              <div className="flex-shrink-0 bg-gray-900/80 rounded-xl p-4 border border-gray-700/50 min-w-[180px] backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">💧</span>
                  </div>
                  <h5 className="text-white font-semibold text-sm">LDM 물방울 리프팅</h5>
                </div>
                <p className="text-gray-400 text-xs">수분 진정 및 피부 재생</p>
                <div className="mt-3 flex items-center gap-1">
                  <span className="text-[#00FFC2] text-xs font-semibold">+5.2만원</span>
                  <span className="text-gray-500 text-xs">추가</span>
                </div>
              </div>
              
              <div className="flex-shrink-0 bg-gray-900/80 rounded-xl p-4 border border-gray-700/50 min-w-[180px] backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">✨</span>
                  </div>
                  <h5 className="text-white font-semibold text-sm">비타민 관리</h5>
                </div>
                <p className="text-gray-400 text-xs">미백 부스터 효과</p>
                <div className="mt-3 flex items-center gap-1">
                  <span className="text-[#00FFC2] text-xs font-semibold">+3.5만원</span>
                  <span className="text-gray-500 text-xs">추가</span>
                </div>
              </div>

              <div className="flex-shrink-0 bg-gray-900/80 rounded-xl p-4 border border-gray-700/50 min-w-[180px] backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🌿</span>
                  </div>
                  <h5 className="text-white font-semibold text-sm">앰플 케어</h5>
                </div>
                <p className="text-gray-400 text-xs">진정 및 보습 강화</p>
                <div className="mt-3 flex items-center gap-1">
                  <span className="text-[#00FFC2] text-xs font-semibold">+2.8만원</span>
                  <span className="text-gray-500 text-xs">추가</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA 버튼 (Bottom Fixed) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className="fixed bottom-0 left-0 right-0 z-50 max-w-[430px] mx-auto px-4 pb-4 pt-2 bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent"
      >
        <Link
          href="/hospital"
          className="block w-full py-4 bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] text-black font-bold rounded-xl hover:from-[#00E6B8] hover:to-[#00D4A3] transition-all shadow-lg shadow-[#00FFC2]/40 active:scale-[0.98] text-center"
        >
          내 주변 최저가 병원 찾기 (3곳)
        </Link>
      </motion.div>

      {/* 보상형 광고 모달 (분석 완료 후 표시 - 기존 로직) */}
      {!shouldShowAd && (
        <RewardAdModal 
          isOpen={showRewardAd} 
          onClose={() => setShowRewardAd(false)} 
        />
      )}
    </div>
  )
}

