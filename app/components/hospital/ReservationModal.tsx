'use client'

import React, { useState, useEffect } from 'react'
import { X, Calendar, FileText, CheckCircle2, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRecentSkinRecords, type SkinAnalysisRecord } from '@/app/utils/storage'
import toast, { Toaster } from 'react-hot-toast'
import PremiumCongratsModal from './PremiumCongratsModal'

interface ReservationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ReservationModal({ isOpen, onClose }: ReservationModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [sendReport, setSendReport] = useState(true)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recentRecord, setRecentRecord] = useState<SkinAnalysisRecord | null>(null)
  const [showPremiumCongrats, setShowPremiumCongrats] = useState(false)
  
  // 유효성 검사 에러 상태
  const [errors, setErrors] = useState<{
    name?: boolean
    phone?: boolean
  }>({})

  // 최근 진단 기록 불러오기
  useEffect(() => {
    if (isOpen) {
      const records = getRecentSkinRecords(1)
      if (records.length > 0) {
        setRecentRecord(records[0])
      }
    }
  }, [isOpen])

  // 고민 키 매핑
  const getConcernGrade = (record: SkinAnalysisRecord) => {
    const concernKey = 
      record.primaryConcern === '기미' ? 'pigmentation' : 
      record.primaryConcern === '모공' ? 'pores' :
      record.primaryConcern === '주름' ? 'wrinkles' : 'acne'
    return record.details[concernKey]?.grade || '주의'
  }

  // 유효성 검사
  const validate = () => {
    const newErrors: { name?: boolean; phone?: boolean } = {}
    
    if (!name.trim()) {
      newErrors.name = true
    }
    if (!phone.trim()) {
      newErrors.phone = true
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 예약 신청 처리
  const handleSubmit = async () => {
    // 약관 동의 체크
    if (!agreePrivacy) {
      toast.error('개인정보 제3자 제공 동의가 필요합니다')
      return
    }

    // 유효성 검사
    if (!validate()) {
      toast.error('정보를 입력해주세요')
      return
    }

    setIsSubmitting(true)

    // Mock API 호출 (1.5초)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    
    // 예약 데이터 저장
    try {
      const reservationData = {
        id: `reservation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        hospitalName: '미래 의원 강남점', // Mock 데이터 (실제로는 선택된 병원 정보 사용)
        date: visitDate || new Date().toISOString().split('T')[0],
        time: '14:00', // Mock 시간 (실제로는 시간 선택 필드 추가)
        treatment: '피코토닝 1회 체험',
        price: '4.9만',
        status: 'confirmed' as const,
        createdAt: new Date().toISOString(),
      }

      // localStorage에 예약 저장
      const existingReservations = JSON.parse(localStorage.getItem('reservations') || '[]')
      const updatedReservations = [reservationData, ...existingReservations]
      localStorage.setItem('reservations', JSON.stringify(updatedReservations))
    } catch (error) {
      console.error('Failed to save reservation:', error)
    }
    
    // 프리미엄 권한 부여
    localStorage.setItem('user_tier', 'premium')
    
    // 성공 Toast (짧게 표시)
    toast.success('✅ 예약 확정!', {
      duration: 1500,
      style: {
        background: '#00FFC2',
        color: '#000',
        fontWeight: 'bold',
        borderRadius: '12px',
        padding: '16px',
      },
    })

    // 폼 초기화
    setName('')
    setPhone('')
    setVisitDate('')
    setSendReport(true)
    setAgreePrivacy(false)
    setErrors({})
    
    // 축하 모달 표시 (약간의 딜레이 후)
    setTimeout(() => {
      setShowPremiumCongrats(true)
    }, 500)
    
    // 예약 모달은 닫지 않고, 축하 모달이 닫힐 때 함께 닫힘
  }

  return (
    <>
      <Toaster position="top-center" />
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={onClose}
            />

            {/* 모달 컨텐츠 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 핸들 바 */}
              <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-white z-10">
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* 헤더 */}
              <div className="px-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">예약 신청</h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* 폼 컨텐츠 */}
              <div className="px-6 py-6 space-y-6">
                {/* 이름 입력 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (errors.name) {
                        setErrors({ ...errors, name: false })
                      }
                    }}
                    placeholder="이름을 입력하세요"
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00FFC2] transition-colors ${
                      errors.name ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                </div>

                {/* 연락처 입력 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      if (errors.phone) {
                        setErrors({ ...errors, phone: false })
                      }
                    }}
                    placeholder="010-1234-5678"
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00FFC2] transition-colors ${
                      errors.phone ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                </div>

                {/* 방문 희망일 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    방문 희망일
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#00FFC2] transition-colors"
                    />
                  </div>
                </div>

                {/* AI 리포트 첨부 */}
                <div>
                  <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={sendReport}
                      onChange={(e) => setSendReport(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 bg-white text-[#00FFC2] focus:ring-[#00FFC2] focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-[#00FFC2]" />
                        <span className="text-sm font-semibold text-gray-900">
                          원장님께 내 피부 분석 리포트 전송
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        진단 기록을 함께 전송하면 더 정확한 상담이 가능합니다
                      </p>
                    </div>
                  </label>

                  {/* 리포트 첨부 카드 */}
                  <AnimatePresence>
                    {sendReport && recentRecord && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl"
                      >
                        <div className="flex items-start gap-4">
                          {/* 썸네일 (왼쪽) */}
                          <div className="w-16 h-16 bg-gradient-to-br from-[#00FFC2]/20 to-[#00E6B8]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-8 h-8 text-[#00FFC2]" />
                          </div>

                          {/* 정보 (오른쪽) */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <p className="text-sm font-bold text-gray-900">
                                  {formatRecordDate(recentRecord.date)} 진단기록
                                </p>
                                <p className="text-xs text-[#00FFC2] font-semibold mt-0.5">
                                  종합 {recentRecord.totalScore}점 | {recentRecord.primaryConcern} {getConcernGrade(recentRecord)}
                                </p>
                              </div>
                              <span className="px-2 py-0.5 bg-[#00FFC2]/20 text-[#00FFC2] text-xs font-semibold rounded-full whitespace-nowrap">
                                전송대기
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 약관 동의 */}
                <div>
                  <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 bg-white text-[#00FFC2] focus:ring-[#00FFC2] focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-700">
                      개인정보 제3자 제공 동의 <span className="text-red-500">(필수)</span>
                    </span>
                  </label>
                </div>

                {/* 제출 버튼 */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !agreePrivacy}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                    isSubmitting || !agreePrivacy
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#00FFC2] text-black hover:bg-[#00E6B8] active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>전송 중...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>예약 신청하기</span>
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* 프리미엄 축하 모달 */}
      <PremiumCongratsModal
        isOpen={showPremiumCongrats}
        onClose={() => {
          setShowPremiumCongrats(false)
          onClose() // 축하 모달이 닫히면 예약 모달도 닫기
        }}
      />
    </>
  )
}

