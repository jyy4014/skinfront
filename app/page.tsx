'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Settings, Sun, Droplets, MapPin, MessageSquare, BarChart3, FlaskConical, ChevronRight, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getRecentSkinRecords, type SkinAnalysisRecord } from './utils/storage'
import Link from 'next/link'
import confetti from 'canvas-confetti'

// ==================== 타입 정의 ====================
interface RoutineItem {
  id: string
  emoji: string
  label: string
}

interface RoutineData {
  date: string // YYYY-MM-DD 형식
  checks: string[] // 완료된 루틴 ID 배열
}

interface WeatherData {
  condition: 'sunny' | 'cloudy'
  uv: string
  humidity: string
}

// ==================== 유틸리티 함수 ====================

/**
 * 날짜 차이 계산 (안전 처리)
 */
function getDaysAgo(dateString: string | null | undefined): number {
  if (!dateString) return 0
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 0
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  } catch {
    return 0
  }
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getTodayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 시간대별 루틴 아이템 반환
 */
function getTimeBasedRoutines(hour: number): RoutineItem[] {
  if (hour >= 5 && hour < 12) {
    // Morning (05~11)
    return [
      { id: 'water', emoji: '💧', label: '물 한잔' },
      { id: 'sunscreen', emoji: '🧴', label: '선크림' },
      { id: 'vitamin', emoji: '💊', label: '비타민' },
    ]
  } else if (hour >= 12 && hour < 19) {
    // Day (12~18)
    return [
      { id: 'water', emoji: '💧', label: '물 보충' },
      { id: 'makeup', emoji: '💄', label: '수정화장' },
      { id: 'mist', emoji: '🌫️', label: '미스트' },
    ]
  } else {
    // Night (19~04)
    return [
      { id: 'cleansing', emoji: '🧼', label: '메이크업 제거' },
      { id: 'nightcare', emoji: '🌙', label: '나이트 크림' },
      { id: 'sleep', emoji: '😴', label: '7시간 수면' },
    ]
  }
}

/**
 * 시간대별 인사말 반환
 */
function getTimeBasedGreeting(hour: number): { text: string; emoji: string } {
  if (hour >= 5 && hour < 12) {
    return { text: '좋은 아침이에요!', emoji: '☀️' }
  } else if (hour >= 12 && hour < 19) {
    return { text: '오후 자외선 조심하세요', emoji: '😎' }
  } else {
    return { text: '오늘 하루 수고하셨어요', emoji: '🌙' }
  }
}

/**
 * 날씨 데이터 생성 (Mock)
 */
function generateWeatherData(): WeatherData {
  const conditions: ('sunny' | 'cloudy')[] = ['sunny', 'cloudy']
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)]
  const uv = randomCondition === 'sunny' ? '강함' : '보통'
  const humidity = `${Math.floor(Math.random() * 30) + 30}%`
  return { condition: randomCondition, uv, humidity }
}

// ==================== 컴포넌트 ====================

/**
 * 원형 프로그레스 차트
 */
function DonutChart({ score, size = 120 }: { score: number; size?: number }) {
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth="12"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-white">{score}</div>
          <div className="text-xs text-gray-400">점</div>
        </div>
      </div>
    </div>
  )
}

/**
 * 로딩 스켈레톤
 */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#121212] pb-32">
      <div className="px-5 pt-6 space-y-6">
        {/* 헤더 스켈레톤 */}
        <div className="h-20 bg-gray-900/50 rounded-2xl animate-pulse" />
        {/* 히어로 카드 스켈레톤 */}
        <div className="h-64 bg-gray-900/50 rounded-2xl animate-pulse" />
        {/* 루틴 스켈레톤 */}
        <div className="h-32 bg-gray-900/50 rounded-2xl animate-pulse" />
        {/* 퀵 액세스 스켈레톤 */}
        <div className="h-48 bg-gray-900/50 rounded-2xl animate-pulse" />
      </div>
    </div>
  )
}

// ==================== 메인 컴포넌트 ====================

export default function HomePage() {
  const router = useRouter()
  const [scrollY, setScrollY] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  
  // 사용자 데이터
  const [userName, setUserName] = useState<string>('')
  const [isPremium, setIsPremium] = useState(false)
  
  // 피부 분석 데이터
  const [latestRecord, setLatestRecord] = useState<SkinAnalysisRecord | null>(null)
  const [previousRecord, setPreviousRecord] = useState<SkinAnalysisRecord | null>(null)
  
  // 시간 및 날씨
  const [currentHour, setCurrentHour] = useState<number>(12)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  
  // 루틴 데이터
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>([])
  const [completedRoutines, setCompletedRoutines] = useState<Set<string>>(new Set())

  // ==================== 초기화 로직 ====================

  useEffect(() => {
    setIsMounted(true)
    
    // 시간 업데이트
    const updateTime = () => {
      const now = new Date()
      setCurrentHour(now.getHours())
    }
    updateTime()
    const interval = setInterval(updateTime, 60000) // 1분마다 업데이트
    
    // 날씨 데이터 생성 (한 번만)
    setWeatherData(generateWeatherData())
    
    return () => clearInterval(interval)
  }, [])

  // 시간대별 루틴 업데이트
  useEffect(() => {
    if (isMounted) {
      setRoutineItems(getTimeBasedRoutines(currentHour))
    }
  }, [currentHour, isMounted])

  // 사용자 데이터 및 피부 기록 로드
  useEffect(() => {
    if (!isMounted) return

    try {
      // 사용자 이름 (Null Safety)
      const storedName = localStorage.getItem('userName')
      setUserName(storedName ?? '게스트')

      // 프리미엄 체크
      const userTier = localStorage.getItem('user_tier')
      setIsPremium(userTier === 'premium')

      // 최신 진단 기록 불러오기
      const records = getRecentSkinRecords(2)
      if (records.length > 0) {
        setLatestRecord(records[0] ?? null)
        if (records.length > 1) {
          setPreviousRecord(records[1] ?? null)
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
      // 기본값 설정
      setUserName('게스트')
      setIsPremium(false)
    }
  }, [isMounted])

  // 루틴 체크 데이터 로드 및 날짜 체크
  useEffect(() => {
    if (!isMounted) return

    try {
      const stored = localStorage.getItem('completed_routines')
      if (!stored) {
        // 데이터가 없으면 초기화
        setCompletedRoutines(new Set())
        return
      }

      const routineData: RoutineData = JSON.parse(stored)
      const today = getTodayDateString()

      // 날짜가 다르면 리셋
      if (routineData.date !== today) {
        setCompletedRoutines(new Set())
        localStorage.setItem('completed_routines', JSON.stringify({ date: today, checks: [] }))
      } else {
        // 오늘 날짜면 기존 체크 불러오기
        setCompletedRoutines(new Set(routineData.checks ?? []))
      }
    } catch (error) {
      console.error('Failed to load routine data:', error)
      setCompletedRoutines(new Set())
    }
  }, [isMounted])

  // 스크롤 이벤트
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ==================== 이벤트 핸들러 ====================

  /**
   * 루틴 체크 토글
   */
  const toggleRoutine = useCallback((id: string) => {
    if (!isMounted) return

    const newCompleted = new Set(completedRoutines)
    const wasCompleted = newCompleted.has(id)

    if (wasCompleted) {
      newCompleted.delete(id)
    } else {
      newCompleted.add(id)
    }

    setCompletedRoutines(newCompleted)

    // localStorage에 저장
    try {
      const today = getTodayDateString()
      const routineData: RoutineData = {
        date: today,
        checks: Array.from(newCompleted),
      }
      localStorage.setItem('completed_routines', JSON.stringify(routineData))

      // 모두 완료 시 폭죽 효과
      if (!wasCompleted && newCompleted.size === routineItems.length) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00FFC2', '#00E6B8', '#00D4A3'],
        })
      }
    } catch (error) {
      console.error('Failed to save routine data:', error)
    }
  }, [completedRoutines, routineItems.length, isMounted])

  /**
   * 스캔 모달 열기
   */
  const openScanModal = useCallback(() => {
    window.dispatchEvent(new CustomEvent('scan-button-click'))
  }, [])

  /**
   * 점수 공유하기
   */
  const shareScore = useCallback(() => {
    if (!latestRecord) return
    // 커뮤니티 페이지로 이동
    router.push('/community')
  }, [latestRecord, router])

  // ==================== 계산된 값 ====================

  const greeting = isMounted ? getTimeBasedGreeting(currentHour) : { text: '안녕하세요', emoji: '👋' }
  const scoreDiff = latestRecord && previousRecord
    ? latestRecord.totalScore - previousRecord.totalScore
    : null

  // 동년배 상위 그룹 평균 점수 계산 (Mock)
  const getPeerAverageScore = (userScore: number): number => {
    // 상위 10% 평균을 사용자 점수보다 높게 설정 (비교 심리)
    return Math.min(100, userScore + 15 + Math.floor(Math.random() * 10))
  }

  // 가장 낮은 항목 찾기 (개선 포인트)
  const getWeakestCategory = (): string | null => {
    if (!latestRecord?.details) return null
    const details = latestRecord.details
    const scores = [
      { name: '탄력', score: details.wrinkles?.score ?? 0 },
      { name: '톤 균일도', score: details.pigmentation?.score ?? 0 },
      { name: '모공', score: details.pores?.score ?? 0 },
      { name: '민감도', score: details.acne?.score ?? 0 },
    ]
    const weakest = scores.reduce((min, item) => (item.score < min.score ? item : min))
    return weakest.name
  }

  // 히어로 카드 스타일 결정 (의료법 준수)
  const getHeroStyle = () => {
    if (!latestRecord) {
      // State A: 데이터 없음
      return {
        bgGradient: 'bg-gradient-to-br from-gray-800/50 to-gray-900/50',
        borderColor: 'border-gray-700/50',
        message: '내 피부 나이, 궁금하지 않으세요?',
        buttonText: '지금 첫 진단하기 >',
        buttonAction: openScanModal,
        buttonColor: 'bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] text-black',
        showComparison: false,
      }
    }

    const score = latestRecord.totalScore ?? 0
    const peerScore = getPeerAverageScore(score)
    const weakestCategory = getWeakestCategory()

    // 모든 경우에 비교 카드 표시
    return {
      bgGradient: isPremium
        ? 'bg-gradient-to-br from-yellow-500/20 via-yellow-500/10 to-transparent'
        : 'bg-gradient-to-br from-[#00FFC2]/20 via-[#00FFC2]/10 to-transparent',
      borderColor: isPremium ? 'border-yellow-500/30' : 'border-[#00FFC2]/30',
      message: weakestCategory
        ? `${userName}님, '${weakestCategory}' 관리만 더해지면 상위권 진입이 가능해요.`
        : `${userName}님의 피부 상태를 확인해보세요.`,
      buttonText: '상세 분석 리포트 보기 >',
      buttonAction: () => router.push('/mypage'),
      buttonColor: 'bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] text-black',
      showComparison: true,
      userScore: score,
      peerScore: peerScore,
    }
  }

  const heroStyle = getHeroStyle()

  // ==================== 렌더링 ====================

  // Hydration Error 방지: 마운트 전에는 스켈레톤 표시
  if (!isMounted) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-[#121212] pb-32 max-w-md mx-auto">
      {/* 스마트 헤더 */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrollY > 10
            ? 'bg-gray-900/80 backdrop-blur-md border-b border-gray-800'
            : 'bg-transparent'
        }`}
      >
        {/* 메인 헤더 */}
        <motion.div
          className="flex items-center justify-between px-5 py-3"
          animate={{
            scale: scrollY > 10 ? 0.95 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <motion.h1
            className="text-xl font-bold text-white"
            animate={{
              fontSize: scrollY > 10 ? '18px' : '20px',
            }}
            transition={{ duration: 0.2 }}
          >
            Derma AI
          </motion.h1>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-full hover:bg-gray-800 transition-colors">
              <Bell className="w-5 h-5 text-white" />
              {/* 읽지 않은 알림 빨간 점 (Mock) */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-900"
              />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </motion.div>

        {/* 서브 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 pb-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">
              {greeting.text} {greeting.emoji} {userName}님
            </span>
            {isPremium && (
              <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/50 rounded-full text-xs font-bold">
                👑
              </span>
            )}
          </div>
          {/* 날씨 위젯 */}
          {weatherData && (
            <div className="px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 rounded-full flex items-center gap-2">
              <Sun className={`w-3.5 h-3.5 ${weatherData.condition === 'sunny' ? 'text-yellow-500' : 'text-gray-400'}`} />
              <span className="text-xs text-gray-300">자외선 {weatherData.uv}</span>
              <span className="text-xs text-gray-500">|</span>
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-gray-300">습도 {weatherData.humidity}</span>
            </div>
          )}
        </motion.div>
      </header>

      {/* 컨텐츠 영역 */}
      <motion.div
        className="space-y-6 px-5 pt-6"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {/* 다이내믹 히어로 카드 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div
            className={`rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden border-2 shadow-lg ${heroStyle.bgGradient} ${heroStyle.borderColor}`}
          >
            {/* 프리미엄 라벨 */}
            {isPremium && latestRecord && (
              <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full">
                <p className="text-yellow-500 text-xs font-semibold flex items-center gap-1">
                  ⚡ 광고 없이 무제한 분석 중
                </p>
              </div>
            )}

            {latestRecord ? (
              <>
                {/* 비교 카드: 남들 vs 나 */}
                {heroStyle.showComparison && (
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    {/* 좌측: 나의 현재 점수 */}
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                      <p className="text-gray-400 text-xs mb-2">나의 현재 점수</p>
                      <p className="text-2xl font-bold text-white mb-1">{heroStyle.userScore}점</p>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00FFC2] rounded-full transition-all duration-500"
                          style={{ width: `${heroStyle.userScore}%` }}
                        />
                      </div>
                    </div>
                    {/* 우측: 상위 10% 평균 */}
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                      <p className="text-gray-400 text-xs mb-2">상위 10% 평균</p>
                      <p className="text-2xl font-bold text-[#00FFC2] mb-1">{heroStyle.peerScore}점</p>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00FFC2] rounded-full transition-all duration-500"
                          style={{ width: `${heroStyle.peerScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-gray-400 text-xs mb-3">
                  마지막 진단: {getDaysAgo(latestRecord.date)}일 전
                </p>
                <p className="text-white text-sm font-medium mb-4 text-center">
                  {heroStyle.message}
                </p>
              </>
            ) : (
              <p className="text-gray-300 text-base mb-4">{heroStyle.message}</p>
            )}

            {/* 액션 버튼 */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={heroStyle.buttonAction}
              className={`w-full px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${heroStyle.buttonColor}`}
            >
              {heroStyle.buttonText}
            </motion.button>
          </div>
        </motion.div>

        {/* 데일리 루틴 체크 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700/50"
        >
          <h2 className="text-lg font-bold text-white mb-3">오늘의 피부 숙제</h2>
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-3" style={{ width: 'max-content' }}>
              {routineItems.map((item) => {
                const isCompleted = completedRoutines.has(item.id)
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => toggleRoutine(item.id)}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-shrink-0 w-32 rounded-xl p-4 border-2 transition-all ${
                      isCompleted
                        ? 'bg-[#00FFC2]/10 border-[#00FFC2]/50'
                        : 'bg-gray-800/50 border-gray-700/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-3xl">{item.emoji}</div>
                      <span className={`text-xs font-medium ${isCompleted ? 'text-[#00FFC2]' : 'text-gray-300'}`}>
                        {item.label}
                      </span>
                      {isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-[#00FFC2]" />
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* 퀵 엑세스 그리드 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700/50"
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'hospital', icon: MapPin, title: '병원찾기', subtitle: '투명한 가격 정보', href: '/hospital', color: 'from-green-500 to-emerald-500' },
              { id: 'community', icon: MessageSquare, title: '커뮤니티', subtitle: '의사 상담 & 후기', href: '/community', color: 'from-blue-500 to-cyan-500' },
              { id: 'history', icon: BarChart3, title: '내 기록', subtitle: '피부 변화 그래프', href: '/mypage', color: 'from-purple-500 to-pink-500' },
              { id: 'ingredient', icon: FlaskConical, title: '성분분석', subtitle: '화장품 궁합 보기', href: '#', color: 'from-orange-500 to-red-500' },
            ].map((item) => {
              const Icon = item.icon
              const Component = item.href === '#' ? 'button' : Link
              const props = item.href === '#' ? {} : { href: item.href }
              
              return (
                <motion.div
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                >
                  <Component
                    {...props}
                    className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors border border-gray-700/50 text-left"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm mb-0.5">{item.title}</h3>
                      <p className="text-gray-400 text-xs truncate">{item.subtitle}</p>
                    </div>
                  </Component>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* 심층 분석 알림 */}
        {latestRecord && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            className="bg-gradient-to-br from-blue-900/20 to-[#00FFC2]/10 rounded-2xl p-4 border border-blue-500/30"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔍</div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm mb-1">
                  숨은 색소 포착
                </h3>
                <p className="text-gray-300 text-xs mb-2">
                  겉으로는 깨끗해 보이지만, <span className="font-medium">진피층</span>에 색소가 관찰됩니다.
                </p>
                <div className="bg-gray-800/50 rounded-lg p-2 mt-2">
                  <p className="text-[#00FFC2] text-xs font-medium flex items-center gap-1">
                    💡 관리 팁
                  </p>
                  <p className="text-gray-300 text-xs mt-1">
                    지금부터 토닝으로 관리하면 맑은 톤 유지에 도움이 됩니다.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 가격 정보 티커 */}
        {latestRecord && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700/50"
          >
            <button
              onClick={() => {
                const keyword = latestRecord.primaryConcern ?? '피부 관리'
                router.push(`/hospital?keyword=${encodeURIComponent(keyword)}`)
              }}
              className="w-full flex items-center justify-between group"
            >
              <div className="flex-1 text-left">
                <p className="text-white text-sm font-medium mb-1">
                  투명한 가격 정보
                </p>
                <p className="text-gray-400 text-xs">
                  내 피부 고민인 <span className="text-[#00FFC2] font-medium">'{latestRecord.primaryConcern ?? '피부 관리'}'</span>, 주변 병원 시술가는 얼마일까요?
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#00FFC2] transition-colors flex-shrink-0" />
            </button>
          </motion.div>
        )}

        {/* 리얼 후기 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">실제 사용자 후기</h2>
            <Link href="/community" className="text-sm text-gray-400 flex items-center gap-1 hover:text-[#00FFC2] transition-colors">
              전체보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { id: 1, treatment: '피코토닝', count: 10, result: '피부톤이 한 톤 밝아졌어요', author: '30대 여성' },
              { id: 2, treatment: '프락셀', count: 5, result: '모공이 눈에 띄게 작아졌습니다', author: '20대 여성' },
              { id: 3, treatment: 'IPL 레이저', count: 8, result: '색소 침착이 많이 개선되었어요', author: '40대 여성' },
            ].map((review) => (
              <div
                key={review.id}
                className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <div className="text-xl">✨</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm font-semibold">{review.treatment}</span>
                      <span className="text-gray-500 text-xs">{review.count}회차</span>
                    </div>
                    <p className="text-gray-300 text-xs mb-1">{review.result}</p>
                    <p className="text-gray-500 text-xs">{review.author}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 면책 조항 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          className="pb-8"
        >
          <p className="text-gray-500 text-xs text-center leading-relaxed">
            본 서비스의 분석 결과는 AI에 의한 참고용이며, 정확한 진단과 치료는 전문의와 상담하시기 바랍니다.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
