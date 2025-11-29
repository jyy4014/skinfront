'use client'

import { useState, useEffect, useCallback, useMemo, startTransition } from 'react'
import { Bell, Settings, MapPin, MessageSquare, BarChart3, FlaskConical, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getRecentSkinRecords, type SkinAnalysisRecord } from './utils/storage'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import SkinTwinWidget from './components/home/SkinTwinWidget'
import MirrorSlider from './components/home/MirrorSlider'
import QuickStats from './components/home/QuickStats'
import MiniTimeline from './components/home/MiniTimeline'
import { getBestComparisonPeriod, getComparisonData, type ComparisonPeriod } from '../lib/utils/comparison'
import { isToday } from '../lib/utils/date'
import SmartCTA from './components/home/SmartCTA'
import InsightCards from './components/home/InsightCards'

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

// ==================== 컴포넌트 ====================

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
  const [isMounted] = useState(true)

  // 사용자 데이터
  const [userName, setUserName] = useState<string>('')
  const [isPremium, setIsPremium] = useState(false)

  // 피부 분석 데이터
  const [latestRecord, setLatestRecord] = useState<SkinAnalysisRecord | null>(null)
  const [allRecords, setAllRecords] = useState<SkinAnalysisRecord[]>([])

  // 시간
  const [currentHour, setCurrentHour] = useState<number>(12)

  // 루틴 데이터
  const routineItems = useMemo(() => isMounted ? getTimeBasedRoutines(currentHour) : [], [currentHour, isMounted])
  const [completedRoutines, setCompletedRoutines] = useState<Set<string>>(new Set())

  // 비교 데이터 (Mirror Comparison)
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod>('7d')
  const comparison = useMemo(() => {
    if (!allRecords.length) {
      return getComparisonData([], '7d')
    }
    const autoPeriod = getBestComparisonPeriod(allRecords)
    return getComparisonData(allRecords, comparisonPeriod || autoPeriod)
  }, [allRecords, comparisonPeriod])

  // 통계 데이터
  const weeklyScans = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return allRecords.filter(r => new Date(r.date) >= weekAgo).length
  }, [allRecords])

  const streak = useMemo(() => {
    if (!allRecords.length) return 0
    let count = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < allRecords.length; i++) {
      const recordDate = new Date(allRecords[i].date)
      recordDate.setHours(0, 0, 0, 0)
      const expectedDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)

      if (recordDate.getTime() === expectedDate.getTime()) {
        count++
      } else {
        break
      }
    }
    return count
  }, [allRecords])

  const bestScore = useMemo(() => {
    if (!allRecords.length) return 0
    return Math.max(...allRecords.map(r => r.totalScore || 0))
  }, [allRecords])

  // ==================== 초기화 로직 ====================

  useEffect(() => {
    // 시간 업데이트
    const updateTime = () => {
      const now = new Date()
      setCurrentHour(now.getHours())
    }
    updateTime()
    const interval = setInterval(updateTime, 60000) // 1분마다 업데이트

    return () => clearInterval(interval)
  }, [])

  // 사용자 데이터 및 피부 기록 로드
  useEffect(() => {
    if (!isMounted) return

    startTransition(() => {
      try {
        // 사용자 이름 (Null Safety)
        const storedName = localStorage.getItem('userName')
        setUserName(storedName ?? '게스트')

        // 프리미엄 체크
        const userTier = localStorage.getItem('user_tier')
        setIsPremium(userTier === 'premium')

        // 모든 진단 기록 불러오기 (비교용)
        const records = getRecentSkinRecords(100)
        setAllRecords(records)
        if (records.length > 0) {
          setLatestRecord(records[0] ?? null)
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
        // 기본값 설정
        setUserName('게스트')
        setIsPremium(false)
      }
    })
  }, [isMounted])

  // 루틴 데이터 로드
  useEffect(() => {
    if (!isMounted) return

    try {
      const stored = localStorage.getItem('completed_routines')
      if (stored) {
        const data: RoutineData = JSON.parse(stored)
        const today = getTodayDateString()

        // 오늘 날짜 데이터만 load
        if (data.date === today) {
          setCompletedRoutines(new Set(data.checks))
        }
      }
    } catch (error) {
      console.error('Failed to load routine data:', error)
    }
  }, [isMounted])

  // 스크롤 이벤트
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
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

  // Smart CTA 설정
  const ctaConfig = useMemo(() => {
    if (allRecords.length === 0) {
      return {
        text: '첫 스캔 시작하기',
        icon: '🚀',
        variant: 'primary' as const,
        message: '피부 변화 추적을 시작해보세요'
      }
    }

    if (allRecords.length === 1) {
      return {
        text: '비교하기 위한 다음 스캔',
        icon: '📸',
        variant: 'primary' as const,
        message: '변화를 확인하려면 한 번 더 스캔해보세요!'
      }
    }

    // 마지막 스캔이 오늘이면
    if (isToday(allRecords[0].date)) {
      return {
        text: '오늘 기록 확인하기',
        icon: '✅',
        variant: 'secondary' as const,
        href: '/mypage'
      }
    }

    return {
      text: '오늘 피부 기록하기',
      icon: '📸',
      variant: 'primary' as const,
    }
  }, [allRecords])

  // ==================== 계산된 값 ====================

  const greeting = isMounted ? getTimeBasedGreeting(currentHour) : { text: '안녕하세요', emoji: '👋' }

  // ==================== 렌더링 ====================

  // Hydration Error 방지: 마운트 전에는 스켈레톤 표시
  if (!isMounted) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-[#121212] pb-32 max-w-md mx-auto">
      {/* 스마트 헤더 */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${scrollY > 10
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
        {/* 🪞 Mirror Slider Hero */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <MirrorSlider
            comparisonData={comparison}
            onPeriodChange={setComparisonPeriod}
          />
        </motion.div>

        {/* 📊 Quick Stats or Insights */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          {allRecords.length > 0 ? (
            <QuickStats
              scanCount={weeklyScans}
              streak={streak}
              bestScore={bestScore}
            />
          ) : (
            <InsightCards />
          )}
        </motion.div>

        {/* 📅 Mini Timeline */}
        {allRecords.length > 0 && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <MiniTimeline records={allRecords} maxDays={30} />
          </motion.div>
        )}

        {/* 🎯 Smart CTA */}
        <SmartCTA config={ctaConfig} onClick={openScanModal} />

        {/* 피부 쌍둥이 위젯 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <SkinTwinWidget />
        </motion.div>

        {/* 데일리 루틴 체크 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700/50" data-section="routine"
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
                    className={`flex-shrink-0 w-32 rounded-xl p-4 border-2 transition-all ${isCompleted
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

        {/* 퀵 액세스 그리드 */}
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
              const content = (
                <>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm mb-0.5">{item.title}</h3>
                    <p className="text-gray-400 text-xs truncate">{item.subtitle}</p>
                  </div>
                </>
              )

              return (
                <motion.div
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.href === '#' ? (
                    <button className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors border border-gray-700/50 text-left w-full">
                      {content}
                    </button>
                  ) : (
                    <Link href={item.href} className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors border border-gray-700/50 text-left">
                      {content}
                    </Link>
                  )}
                </motion.div>
              )
            })}
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
