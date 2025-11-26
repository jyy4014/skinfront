'use client'

import { useState, useEffect } from 'react'
import { User, Calendar, TrendingUp, Settings, Ticket, PenLine, CheckCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { getScoreColor, getGradeColor, formatReservationDate } from '@/lib/utils'
import toast from 'react-hot-toast'

// Supabase DB에서 가져온 분석 기록 타입
interface SupabaseSkinReport {
  id: string
  created_at: string
  user_id: string | null
  image_url: string
  total_score: number
  primary_concern: string
  details: {
    pigmentation: { score: number; grade: string }
    acne: { score: number; grade: string }
    wrinkles: { score: number; grade: string }
    pores: { score: number; grade: string }
  }
  ai_comment: string | null
}

// 차트/리스트에서 사용하는 분석 기록 타입
interface AnalysisRecord {
  id: string
  date: string // ISO date string
  totalScore: number
  primaryConcern: string
  details: {
    pigmentation: { score: number; grade: string }
    acne: { score: number; grade: string }
    wrinkles: { score: number; grade: string }
    pores: { score: number; grade: string }
  }
  aiComment?: string
  imageUrl?: string
}

// 차트 데이터 포맷
interface ChartData {
  date: string // MM/DD 형식
  score: number
  fullDate: string // 원본 날짜 (ISO)
}

// 예약 데이터 타입
interface Reservation {
  id: string
  hospitalName: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  treatment: string
  price: string
  status: 'confirmed' | 'completed' | 'cancelled'
  createdAt: string
  reviewWritten?: boolean // 후기 작성 여부
}

export default function MyPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('사용자')
  const [analysisRecords, setAnalysisRecords] = useState<AnalysisRecord[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [activeTab, setActiveTab] = useState<'report' | 'booking'>('report')
  const [isMounted, setIsMounted] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Supabase DB에서 분석 기록 불러오기
  const loadAnalysisRecords = async () => {
    try {
      setIsLoading(true)

      // 사용자 이름 (localStorage에서 가져오거나 기본값 사용)
      let storedName = '사용자'
      try {
        const nameFromStorage = localStorage.getItem('userName')
        if (nameFromStorage) {
          storedName = nameFromStorage
        }
      } catch (error) {
        console.warn('Failed to get userName from localStorage:', error)
      }
      setUserName(storedName)

      // Supabase에서 데이터 가져오기
      const { data: dbRecords, error: dbError } = await supabase
        .from('skin_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (dbError) {
        console.error('Supabase 데이터 로드 에러:', dbError)
        toast.error('데이터를 불러오는 중 오류가 발생했습니다.')
        setAnalysisRecords([])
        setChartData([])
        setIsLoading(false)
        return
      }

      if (!dbRecords || dbRecords.length === 0) {
        setAnalysisRecords([])
        setChartData([])
        setIsLoading(false)
        return
      }

      // DB 데이터를 AnalysisRecord 형식으로 변환
      const convertedRecords: AnalysisRecord[] = dbRecords.map((dbRecord: SupabaseSkinReport) => ({
        id: dbRecord.id,
        date: dbRecord.created_at, // ISO date string
        totalScore: dbRecord.total_score,
        primaryConcern: dbRecord.primary_concern,
        details: dbRecord.details,
        aiComment: dbRecord.ai_comment || undefined,
        imageUrl: dbRecord.image_url,
      }))

      setAnalysisRecords(convertedRecords)

      // 차트 데이터 포맷팅 (같은 날짜가 여러 개면 시간까지 표시)
      const dateMap = new Map<string, number>() // 날짜별 카운트
      const formattedData: ChartData[] = [...convertedRecords]
        .reverse() // 차트는 오래된 순서로 표시
        .map((record) => {
          try {
            const date = new Date(record.date)
            if (isNaN(date.getTime())) {
              return null
            }
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const dateKey = `${month}/${day}`
            
            // 같은 날짜가 이미 있는지 확인
            const count = dateMap.get(dateKey) || 0
            dateMap.set(dateKey, count + 1)
            
            // 같은 날짜가 여러 개면 시간까지 표시
            let displayDate = dateKey
            if (count > 0) {
              const hours = String(date.getHours()).padStart(2, '0')
              const minutes = String(date.getMinutes()).padStart(2, '0')
              displayDate = `${dateKey} ${hours}:${minutes}`
            }
            
            return {
              date: displayDate,
              score: Math.max(0, Math.min(100, record.totalScore)), // 0-100 범위로 제한
              fullDate: record.date,
            }
          } catch (error) {
            console.warn('Failed to format chart data for record:', record.id, error)
            return null
          }
        })
        .filter((data): data is ChartData => data !== null) // null 제거

      setChartData(formattedData)
    } catch (error) {
      console.error('Unexpected error in loadAnalysisRecords:', error)
      toast.error('데이터를 불러오는 중 오류가 발생했습니다.')
      setAnalysisRecords([])
      setChartData([])
    } finally {
      setIsLoading(false)
    }
  }

  // Hydration 방지
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 예약 데이터 로드
  const loadReservations = () => {
    if (!isMounted) return
    
    try {
      const stored = localStorage.getItem('reservations')
      if (!stored) {
        setReservations([])
        return
      }

      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) {
        setReservations([])
        return
      }

      // 미래의 예약이 맨 위로 오도록 정렬
      const now = new Date()
      const sorted = parsed
        .filter((r: Reservation) => r.status !== 'cancelled')
        .sort((a: Reservation, b: Reservation) => {
          const dateA = new Date(`${a.date}T${a.time}`)
          const dateB = new Date(`${b.date}T${b.time}`)
          
          // 미래 예약이 먼저
          if (dateA > now && dateB <= now) return -1
          if (dateA <= now && dateB > now) return 1
          
          // 둘 다 미래거나 둘 다 과거면 시간순
          return dateA.getTime() - dateB.getTime()
        })

      // 상태 자동 변경 (과거 예약은 completed로)
      const updated = sorted.map((r: Reservation) => {
        const reservationDate = new Date(`${r.date}T${r.time}`)
        if (reservationDate < now && r.status === 'confirmed') {
          return { ...r, status: 'completed' as const }
        }
        return r
      })

      // 상태가 변경된 경우 localStorage 업데이트
      const hasChanges = updated.some((r, i) => r.status !== sorted[i]?.status)
      if (hasChanges) {
        const allReservations = JSON.parse(stored)
        const updatedAll = allReservations.map((r: Reservation) => {
          const found = updated.find((u) => u.id === r.id)
          return found || r
        })
        localStorage.setItem('reservations', JSON.stringify(updatedAll))
      }

      setReservations(updated)
    } catch (error) {
      console.error('Failed to load reservations:', error)
      setReservations([])
    }
  }

  useEffect(() => {
    if (!isMounted) return

    loadAnalysisRecords()
    loadReservations()

    // 페이지 포커스 시 데이터 새로고침
    const handleFocus = () => {
      loadAnalysisRecords()
      loadReservations()
    }
    window.addEventListener('focus', handleFocus)

    // storage 이벤트 리스너 (예약 데이터용)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'reservations') {
        loadReservations()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [isMounted])

  // 날짜 포맷팅 (예: "11.25(월)" 또는 같은 날짜면 "11.25(월) 14:30")
  const formatDate = (dateString: string, allRecords: AnalysisRecord[]): string => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return '날짜 오류'
      }
      const month = date.getMonth() + 1
      const day = date.getDate()
      const weekdays = ['일', '월', '화', '수', '목', '금', '토']
      const weekday = weekdays[date.getDay()] || '?'
      
      // 같은 날짜(YYYY-MM-DD)에 여러 기록이 있는지 확인
      const dateKey = `${date.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const sameDayRecords = allRecords.filter(r => {
        try {
          const rDate = new Date(r.date)
          const rDateKey = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}-${String(rDate.getDate()).padStart(2, '0')}`
          return rDateKey === dateKey
        } catch {
          return false
        }
      })
      
      // 같은 날짜가 여러 개면 시간까지 표시
      if (sameDayRecords.length > 1) {
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${month}.${day}(${weekday}) ${hours}:${minutes}`
      }
      
      return `${month}.${day}(${weekday})`
    } catch (error) {
      console.error('Failed to format date:', dateString, error)
      return '날짜 오류'
    }
  }

  // 예약 취소 핸들러
  const handleCancelReservation = (id: string) => {
    if (!confirm('정말 예약을 취소하시겠습니까?')) {
      return
    }

    try {
      const stored = localStorage.getItem('reservations')
      if (!stored) return

      const parsed = JSON.parse(stored)
      const updated = parsed.map((r: Reservation) =>
        r.id === id ? { ...r, status: 'cancelled' as const } : r
      )

      localStorage.setItem('reservations', JSON.stringify(updated))
      loadReservations()
      toast.success('취소되었습니다')
    } catch (error) {
      console.error('Failed to cancel reservation:', error)
      toast.error('취소 처리에 실패했습니다')
    }
  }

  // 개발용 더미 데이터 생성
  const createDummyReservation = () => {
    const dummy: Reservation = {
      id: `reservation_${Date.now()}`,
      hospitalName: '미래 의원 강남점',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7일 후
      time: '14:00',
      treatment: '피코토닝 1회 체험',
      price: '4.9만',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    }

    try {
      const existing = JSON.parse(localStorage.getItem('reservations') || '[]')
      localStorage.setItem('reservations', JSON.stringify([dummy, ...existing]))
      loadReservations()
      toast.success('테스트 예약이 생성되었습니다')
    } catch (error) {
      console.error('Failed to create dummy reservation:', error)
    }
  }


  return (
    <div className="min-h-screen bg-[#121212] text-white pb-20">
      {/* 프로필 섹션 */}
      <div className="bg-gradient-to-br from-[#1A2333] to-[#0F1620] px-6 pt-12 pb-8 border-b border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#00FFC2]/20 rounded-full flex items-center justify-center border-2 border-[#00FFC2]/30">
              <User className="w-8 h-8 text-[#00FFC2]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{userName}님, 안녕하세요</h1>
              <p className="text-gray-400 text-sm mt-1">피부 건강을 함께 관리해요</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/mypage/settings')}
            className="p-2 rounded-full hover:bg-gray-800/50 transition-colors"
            aria-label="설정"
          >
            <Settings className="w-6 h-6 text-gray-400 hover:text-[#00FFC2] transition-colors" />
          </button>
        </div>

        {/* 누적 진단 횟수 뱃지 */}
        <div className="flex items-center gap-2 bg-gray-800/50 rounded-full px-4 py-2 w-fit">
          <Calendar className="w-4 h-4 text-[#00FFC2]" />
          <span className="text-sm font-semibold text-gray-300">
            누적 진단 횟수: <span className="text-[#00FFC2]">{analysisRecords.length}회</span>
          </span>
        </div>
      </div>

      {/* 탭 컨트롤 */}
      <div className="px-6 pt-6 pb-4">
        <div className="relative flex items-center gap-2 bg-gray-900 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('report')}
            className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-colors z-10 ${
              activeTab === 'report' ? 'text-black' : 'text-gray-400'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>진단 리포트</span>
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-colors z-10 ${
              activeTab === 'booking' ? 'text-black' : 'text-gray-400'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>예약 확인</span>
          </button>
          
          {/* 하이라이트 바 */}
          <motion.div
            layoutId="activeTab"
            className="absolute top-1 bottom-1 bg-[#00FFC2] rounded-lg z-0"
            initial={false}
            animate={{
              left: activeTab === 'report' ? '4px' : '50%',
              width: 'calc(50% - 4px)',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <AnimatePresence mode="wait">
        {activeTab === 'report' ? (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* 피부 변화 차트 */}
            <div className="px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-[#00FFC2]" />
          <h2 className="text-xl font-bold text-white">내 피부 변화 그래프</h2>
        </div>

        {isLoading ? (
          // 로딩 스켈레톤 UI
          <div className="bg-[#1A2333] rounded-2xl p-6 border border-gray-800">
            <div className="h-[300px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#00FFC2] border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <div className="bg-[#1A2333] rounded-2xl p-6 border border-gray-800">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  domain={[0, 100]}
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  labelStyle={{ color: '#9CA3AF', marginBottom: '4px' }}
                  formatter={(value: number) => [`${value}점`, '종합 점수']}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#00FFC2"
                  strokeWidth={3}
                  dot={{ fill: '#00FFC2', r: 5, strokeWidth: 2, stroke: '#121212' }}
                  activeDot={{ r: 7, fill: '#00FFC2', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-[#1A2333] rounded-2xl p-12 border border-gray-800 text-center">
            <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">아직 분석 기록이 없습니다</p>
            <p className="text-gray-500 text-xs mt-2">피부 분석을 시작해보세요!</p>
          </div>
        )}
      </div>

      {/* 최근 기록 리스트 */}
      <div className="px-6 pb-8">
        <h2 className="text-xl font-bold text-white mb-4">최근 진단 기록</h2>

        {isLoading ? (
          // 로딩 스켈레톤 UI
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#1A2333] rounded-xl p-4 border border-gray-800 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-700 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : analysisRecords.length > 0 ? (
          <div className="space-y-3">
            {analysisRecords.map((record) => {
              try {
                // primaryConcern을 키로 변환 (한글 -> 영문)
                const concernMap: Record<string, keyof typeof record.details> = {
                  '기미': 'pigmentation',
                  '모공': 'pores',
                  '주름': 'wrinkles',
                  '여드름': 'acne',
                }
                const concernKey = concernMap[record.primaryConcern] || 'pigmentation'
                const primaryDetail = record.details?.[concernKey]
                
                // 데이터 유효성 검사
                if (!primaryDetail || typeof primaryDetail.score !== 'number' || !primaryDetail.grade) {
                  console.warn('Invalid record data:', record.id)
                  return null
                }
                
                return (
                <div
                  key={record.id}
                  className="bg-[#1A2333] rounded-xl p-4 border border-gray-800 hover:border-[#00FFC2]/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${getScoreColor(record.totalScore)} bg-gray-800/50`}>
                        {record.totalScore}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold whitespace-nowrap">{formatDate(record.date, analysisRecords)}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${getGradeColor(primaryDetail.grade)} bg-gray-800/50`}>
                            {record.primaryConcern} {primaryDetail.grade}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-nowrap overflow-x-auto scrollbar-hide">
                          <span className="whitespace-nowrap">기미 {record.details.pigmentation.score}점</span>
                          <span className="whitespace-nowrap">모공 {record.details.pores.score}점</span>
                          <span className="whitespace-nowrap">주름 {record.details.wrinkles.score}점</span>
                          <span className="whitespace-nowrap">여드름 {record.details.acne.score}점</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
              } catch (error) {
                console.error('Failed to render record:', record.id, error)
                return null
              }
            }).filter(Boolean)}
          </div>
        ) : (
          <div className="bg-[#1A2333] rounded-xl p-8 border border-gray-800 text-center">
            <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">아직 진단 기록이 없습니다</p>
          </div>
        )}
      </div>
          </motion.div>
        ) : (
          <motion.div
            key="booking"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* 예약 확인 탭 */}
            <div className="px-6 pb-8">
              {!isMounted ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-[#00FFC2] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : reservations.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="text-6xl mb-4">📅</div>
                  <p className="text-gray-400 text-lg mb-6">아직 예정된 방문이 없어요.</p>
                  <button
                    onClick={() => router.push('/hospital')}
                    className="px-6 py-3 bg-[#00FFC2] text-black font-bold rounded-xl hover:bg-[#00E6B8] transition-colors"
                  >
                    내 주변 최저가 병원 예약하기 &gt;
                  </button>
                  
                  {/* 개발용 더미 데이터 버튼 */}
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={createDummyReservation}
                      className="mt-4 px-4 py-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
                    >
                      [개발용] 테스트 예약 생성
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map((reservation) => {
                    const isCompleted = reservation.status === 'completed'
                    const isConfirmed = reservation.status === 'confirmed'
                    
                    return (
                      <div
                        key={reservation.id}
                        className="bg-white rounded-2xl overflow-hidden relative"
                      >
                        {/* 펀칭 효과 (좌우 중간) */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#121212] rounded-full -translate-x-2 z-10" />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#121212] rounded-full translate-x-2 z-10" />
                        
                        {/* 상단 (Header) */}
                        <div className="px-6 pt-6 pb-4 border-b-2 border-dashed border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                isCompleted
                                  ? 'bg-gray-400 text-white'
                                  : 'bg-[#00FFC2] text-black'
                              }`}
                            >
                              {isCompleted ? '방문완료' : '예약확정'}
                            </span>
                            {isConfirmed && (
                              <button
                                onClick={() => handleCancelReservation(reservation.id)}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                              >
                                예약취소
                              </button>
                            )}
                          </div>
                          
                          {/* 중단 (Main Info) */}
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900">{reservation.hospitalName}</h3>
                            <p className="text-gray-700 font-semibold">
                              {formatReservationDate(reservation.date, reservation.time)}
                            </p>
                            <p className="text-gray-600">
                              {reservation.treatment} ({reservation.price})
                            </p>
                          </div>
                        </div>
                        
                        {/* 하단 (Footer - 절취선 아래) */}
                        <div className="px-6 py-4 bg-gray-50">
                          {isCompleted ? (
                            // 방문완료: 후기 작성 버튼 또는 작성완료 뱃지
                            <>
                              {reservation.reviewWritten ? (
                                <div className="flex items-center justify-center gap-2 py-3 bg-green-50 rounded-xl border border-green-200">
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                  <span className="text-green-700 font-semibold">후기 작성 완료</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    const params = new URLSearchParams({
                                      type: 'review',
                                      bookingId: reservation.id,
                                      hospitalName: reservation.hospitalName,
                                      procedure: reservation.treatment,
                                      visitDate: reservation.date,
                                    })
                                    router.push(`/community/write?${params.toString()}`)
                                  }}
                                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] text-black font-bold rounded-xl hover:opacity-90 transition-all"
                                >
                                  <PenLine className="w-5 h-5" />
                                  <span>✍️ 후기 작성하기</span>
                                </button>
                              )}
                            </>
                          ) : (
                            // 예약확정: 바코드 표시
                            <>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex-1 h-16 bg-gray-300 rounded flex items-center justify-center">
                                  <div className="flex gap-0.5">
                                    {Array.from({ length: 40 }).map((_, i) => (
                                      <div
                                        key={i}
                                        className="w-1 bg-gray-700"
                                        style={{ height: `${Math.random() * 40 + 20}px` }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 text-center">
                                데스크에서 이 바코드를 보여주세요.
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* 개발용 더미 데이터 버튼 */}
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={createDummyReservation}
                      className="fixed bottom-24 right-4 px-3 py-2 text-xs bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors z-50"
                    >
                      [테스트] 예약 생성
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

