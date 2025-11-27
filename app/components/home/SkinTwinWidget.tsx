'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Crown, TrendingUp, Sparkles, X, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider'

interface AnalysisResult {
  totalScore: number
  primaryConcern: string
  details: Record<string, { score: number; grade: string }>
}

interface Mentor {
  age: number
  matchRate: number
  score: number
  concern: string
  treatment: string
  satisfaction: number
  sessions: number
  comment?: string // 멘토의 실제 팁 내용
  beforeImageUrl?: string | null // 시술 전 사진
  afterImageUrl?: string | null // 시술 후 사진
  isHospitalVerified?: boolean // 병원 방문 인증 여부
  visitCount?: number // 방문 횟수
  verifiedHospitalName?: string | null // 인증된 병원명
}

const TREATMENT_MAP: Record<string, { name: string; keyword: string }> = {
  '기미': { name: 'IPL 레이저', keyword: 'IPL레이저' },
  '모공': { name: '쥬베룩 볼륨', keyword: '쥬베룩볼륨' },
  '주름': { name: '리쥬란', keyword: '리쥬란' },
  '여드름': { name: '피코 프락셀', keyword: '피코프락셀' },
}

const createFallbackMentor = (concern: string, baseScore: number): Mentor => {
  const treatment = TREATMENT_MAP[concern] || TREATMENT_MAP['모공']
  const scoreBoost = 15 + Math.floor(Math.random() * 6)
  const mentorScore = Math.min(100, baseScore + scoreBoost)

  return {
    age: 30,
    matchRate: 93 + Math.floor(Math.random() * 7),
    score: mentorScore,
    concern,
    treatment: treatment.name,
    satisfaction: 85 + Math.floor(Math.random() * 10),
    sessions: 3 + Math.floor(Math.random() * 3),
  }
}

export default function SkinTwinWidget() {
  const router = useRouter()
  const [hasAnalysis, setHasAnalysis] = useState(false)
  const [myData, setMyData] = useState<AnalysisResult | null>(null)
  const [mentor, setMentor] = useState<Mentor | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isMatching, setIsMatching] = useState(false)
  const [matchSuccess, setMatchSuccess] = useState(false)
  const [revealTreatment, setRevealTreatment] = useState(false)

  const generateMentor = useCallback(async (myResult: AnalysisResult) => {
    const myScore = myResult.totalScore || 50
    const myConcern = myResult.primaryConcern || '모공'

    try {
      const response = await fetch('/api/mentor/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryConcern: myConcern,
          myScore: myScore,
        }),
      })

      const data = await response.json()

      if (data.success && data.mentor) {
        setMentor({
          age: data.mentor.age || 30,
          matchRate: data.mentor.matchRate,
          score: data.mentor.score,
          concern: data.mentor.concern,
          treatment: data.mentor.treatment,
          satisfaction: data.mentor.satisfaction,
          sessions: data.mentor.sessions,
          comment: data.mentor.comment,
          beforeImageUrl: data.mentor.beforeImageUrl,
          afterImageUrl: data.mentor.afterImageUrl,
          isHospitalVerified: data.mentor.isHospitalVerified,
          visitCount: data.mentor.visitCount,
          verifiedHospitalName: data.mentor.verifiedHospitalName,
        })
        return
      }

      setMentor(createFallbackMentor(myConcern, myScore))
    } catch (error) {
      console.error('멘토 조회 실패:', error)
      setMentor(createFallbackMentor(myConcern, myScore))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (cancelled) return
      const storedResult = localStorage.getItem('latest_analysis_result')
      if (!storedResult) {
        setHasAnalysis(false)
        return
      }

      try {
        const parsed = JSON.parse(storedResult)
        const sanitized: AnalysisResult = {
          totalScore: parsed.totalScore || 0,
          primaryConcern: parsed.primaryConcern || '모공',
          details: parsed.details || {},
        }
        setMyData(sanitized)
        setHasAnalysis(true)
        generateMentor(sanitized)
      } catch (error) {
        console.error('Failed to parse analysis result:', error)
        setHasAnalysis(false)
      }
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [generateMentor])

  // 모달 열기
  const handleOpenModal = () => {
    if (!hasAnalysis) {
      // 진단 먼저 하기
      router.push('/')
      return
    }
    
    setShowModal(true)
    setIsMatching(true)
    setMatchSuccess(false)
    setRevealTreatment(false)
    
    // 매칭 애니메이션 시퀀스
    setTimeout(() => {
      setIsMatching(false)
      setMatchSuccess(true)
      
      setTimeout(() => {
        setRevealTreatment(true)
      }, 800)
    }, 1000)
  }

  // 병원 찾기로 이동
  const handleFindHospital = () => {
    if (!mentor) return
    const treatment = TREATMENT_MAP[mentor.concern] || TREATMENT_MAP['모공']
    router.push(`/hospital?keyword=${treatment.keyword}`)
    setShowModal(false)
  }

  // 빈 상태 (진단 기록 없음)
  if (!hasAnalysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-slate-800 border border-[#00FFC2]/30 shadow-lg p-6"
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <div className="w-20 h-20 rounded-full bg-[#00FFC2]/20 flex items-center justify-center mb-2">
            <Sparkles className="w-10 h-10 text-[#00FFC2]" />
          </div>
          <h3 className="text-xl font-bold text-white">
            나와 꼭 닮은 피부 멘토를 찾아보세요!
          </h3>
          <p className="text-gray-400 text-sm">
            비슷한 피부 타입의 멘토가 어떤 시술로 개선했는지 확인해보세요
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00FFC2]/50 transition-all"
          >
            진단 먼저 하기
          </motion.button>
        </div>
      </motion.div>
    )
  }

  if (!myData || !mentor) return null

  return (
    <>
      {/* 위젯 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        onClick={handleOpenModal}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-slate-800 border border-[#00FFC2]/30 shadow-lg cursor-pointer transition-all hover:border-[#00FFC2]/50 hover:shadow-xl hover:shadow-[#00FFC2]/20"
      >
        <div className="grid grid-cols-3 gap-4 p-6">
          {/* 좌측: 익명 프로필 */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-20 h-20 rounded-full overflow-hidden mb-2">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00FFC2]/30 to-[#00E6B8]/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
              </div>
              {/* Blur 효과 */}
              <div className="absolute inset-0 backdrop-blur-[2px]" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-full border border-yellow-500/30">
                <Crown className="w-3 h-3 text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-300">상위 5%</span>
              </div>
              {mentor.isHospitalVerified && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full border border-blue-500/30">
                  <span className="text-xs">✅</span>
                  <span className="text-xs font-semibold text-blue-300">병원 인증</span>
                </div>
              )}
            </div>
          </div>

          {/* 중앙: 스펙 비교 */}
          <div className="flex flex-col justify-center space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                <span className="text-[#00FFC2]">당신</span>과 <span className="text-[#00FFC2]">{mentor.matchRate}%</span> 일치하는
              </h3>
              <p className="text-xs text-gray-400">피부 쌍둥이 발견!</p>
            </div>
            
            {/* 비교 바 */}
            <div className="space-y-2">
              {/* 나 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-8">나</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${myData.totalScore}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
                <span className="text-xs font-semibold text-white w-10">{myData.totalScore}점</span>
              </div>
              
              {/* 멘토 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-8">멘토</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${mentor.score}%` }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="h-full bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] rounded-full"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-[#00FFC2] w-10">{mentor.score}점</span>
                  <TrendingUp className="w-3 h-3 text-[#00FFC2]" />
                </div>
              </div>
            </div>
          </div>

          {/* 우측: 시크릿 키 */}
          <div className="flex flex-col items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00FFC2]/20 to-[#00E6B8]/20 border-2 border-[#00FFC2]/50 flex items-center justify-center mb-2"
            >
              <Lock className="w-6 h-6 text-[#00FFC2]" />
            </motion.div>
            <span className="text-xs font-semibold text-[#00FFC2]">비결 보기</span>
          </div>
        </div>

        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFC2]/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#00E6B8]/5 rounded-full blur-2xl -z-10" />
      </motion.div>

      {/* 모달 */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
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
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="p-6 space-y-6">
                {/* 매칭 애니메이션 */}
                {isMatching && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-16 h-16 border-4 border-[#00FFC2] border-t-transparent rounded-full mb-4"
                    />
                    <p className="text-white font-medium">데이터 분석 중...</p>
                  </div>
                )}

                {/* 매칭 성공 */}
                {matchSuccess && !revealTreatment && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center justify-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00FFC2] to-[#00E6B8] flex items-center justify-center mb-4"
                    >
                      <Sparkles className="w-10 h-10 text-black" />
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-2xl font-bold text-white mb-2"
                    >
                      매칭 성공! 🎉
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-gray-400 text-center"
                    >
                      {mentor.matchRate}% 일치하는 멘토를 찾았어요!
                    </motion.p>
                  </motion.div>
                )}

                {/* Before/After 비교 슬라이더 */}
                {revealTreatment && mentor.beforeImageUrl && mentor.afterImageUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-xl overflow-hidden border border-[#00FFC2]/30"
                  >
                    <ReactCompareSlider
                      itemOne={
                        <ReactCompareSliderImage
                          src={mentor.beforeImageUrl}
                          alt="Before"
                        />
                      }
                      itemTwo={
                        <ReactCompareSliderImage
                          src={mentor.afterImageUrl}
                          alt="After"
                        />
                      }
                      style={{
                        width: '100%',
                        height: '300px',
                      }}
                    />
                    {/* 라벨 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center justify-between text-white text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Before</span>
                          <span className="text-gray-400">
                            {myData?.totalScore || 0}점
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">After</span>
                          <span className="text-[#00FFC2]">
                            {mentor.score}점 ✨
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 멘토의 한마디 */}
                {revealTreatment && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: mentor.beforeImageUrl && mentor.afterImageUrl ? 0.2 : 0 }}
                      className="bg-gray-800/50 rounded-xl p-4 border border-[#00FFC2]/20"
                    >
                      <p className="text-white text-sm leading-relaxed">
                        {mentor.comment ? (
                          <>
                            저도 <span className="text-[#00FFC2] font-semibold">&lsquo;{mentor.concern}&rsquo;</span> 때문에 고민했는데,
                            <br />
                            {mentor.comment}
                          </>
                        ) : (
                          <>
                            저도 <span className="text-[#00FFC2] font-semibold">&lsquo;{mentor.concern}&rsquo;</span> 때문에 고민했는데,
                            <br />
                            이 시술 받고 좋아졌어요.
                          </>
                        )}
                      </p>
                    </motion.div>

                    {/* Secret Card (Blur 해제 효과) */}
                    <motion.div
                      initial={{ filter: 'blur(10px)', opacity: 0 }}
                      animate={{ filter: 'blur(0px)', opacity: 1 }}
                      transition={{ duration: 0.8 }}
                      className="relative bg-gradient-to-br from-[#00FFC2]/20 to-[#00E6B8]/20 rounded-xl p-6 border-2 border-[#00FFC2]/50"
                    >
                      <div className="text-center space-y-3">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Sparkles className="w-5 h-5 text-[#00FFC2]" />
                          <h3 className="text-lg font-bold text-[#00FFC2]">추천 시술</h3>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">
                          {mentor.treatment}
                        </h2>
                        <p className="text-sm text-gray-300">
                          평균 <span className="text-[#00FFC2] font-semibold">{mentor.sessions}회</span> 시술 시
                          <br />
                          만족도 <span className="text-[#00FFC2] font-semibold">{mentor.satisfaction}%</span>
                        </p>
                      </div>
                    </motion.div>

                    {/* CTA 버튼 */}
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFindHospital}
                      className="w-full py-4 bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] text-black font-bold rounded-xl hover:shadow-lg hover:shadow-[#00FFC2]/50 transition-all flex items-center justify-center gap-2"
                    >
                      <span>내 주변 &lsquo;{mentor.treatment}&rsquo; 병원 찾기</span>
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

