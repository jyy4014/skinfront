'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, ChevronRight, Mail, FileText, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { clearSkinRecords } from '@/app/utils/storage'

type SkinType = '건성' | '지성' | '복합성' | '민감성'

export default function SettingsPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('사용자')
  const [skinType, setSkinType] = useState<SkinType | null>(null)
  const [pushNotification, setPushNotification] = useState(true)
  const [nightModeRestriction, setNightModeRestriction] = useState(false)
  const [showSkinTypeModal, setShowSkinTypeModal] = useState(false)
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [newNickname, setNewNickname] = useState('')

  // localStorage에서 설정 불러오기
  useEffect(() => {
    try {
      const storedName = localStorage.getItem('userName') || '사용자'
      setUserName(storedName)
      setNewNickname(storedName)

      const storedSkinType = localStorage.getItem('skin_type') as SkinType | null
      if (storedSkinType && ['건성', '지성', '복합성', '민감성'].includes(storedSkinType)) {
        setSkinType(storedSkinType)
      }

      const storedPush = localStorage.getItem('push_notification')
      if (storedPush !== null) {
        setPushNotification(storedPush === 'true')
      }

      const storedNightMode = localStorage.getItem('night_mode_restriction')
      if (storedNightMode !== null) {
        setNightModeRestriction(storedNightMode === 'true')
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }, [])

  // 닉네임 변경
  const handleNicknameChange = () => {
    if (!newNickname.trim()) {
      toast.error('닉네임을 입력해주세요')
      return
    }
    try {
      localStorage.setItem('userName', newNickname.trim())
      setUserName(newNickname.trim())
      setShowNicknameModal(false)
      toast.success('닉네임이 변경되었습니다')
    } catch (error) {
      toast.error('닉네임 변경에 실패했습니다')
    }
  }

  // 피부 타입 변경
  const handleSkinTypeChange = (type: SkinType) => {
    try {
      localStorage.setItem('skin_type', type)
      setSkinType(type)
      setShowSkinTypeModal(false)
      toast.success(`피부 타입이 '${type}'으로 설정되었습니다`)
    } catch (error) {
      toast.error('피부 타입 설정에 실패했습니다')
    }
  }

  // 푸시 알림 토글
  const handlePushNotificationToggle = (value: boolean) => {
    setPushNotification(value)
    localStorage.setItem('push_notification', String(value))
    toast.success(value ? '푸시 알림이 켜졌습니다' : '푸시 알림이 꺼졌습니다')
  }

  // 야간 알림 제한 토글
  const handleNightModeToggle = (value: boolean) => {
    setNightModeRestriction(value)
    localStorage.setItem('night_mode_restriction', String(value))
    toast.success(value ? '야간 알림 제한이 켜졌습니다' : '야간 알림 제한이 꺼졌습니다')
  }

  // 전체 데이터 삭제
  const handleClearAllData = () => {
    if (!confirm('모든 진단 기록과 설정이 삭제됩니다. 정말 초기화하시겠습니까?')) {
      return
    }

    try {
      // 모든 localStorage 데이터 삭제
      localStorage.removeItem('skin_records')
      localStorage.removeItem('user_tier')
      localStorage.removeItem('analysis_count')
      localStorage.removeItem('skin_type')
      localStorage.removeItem('push_notification')
      localStorage.removeItem('night_mode_restriction')
      localStorage.removeItem('completed_routines')
      localStorage.removeItem('search_history')
      
      // userName은 유지 (선택사항)
      // localStorage.removeItem('userName')

      toast.success('초기화되었습니다', {
        duration: 2000,
      })

      // 홈으로 이동
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (error) {
      toast.error('데이터 삭제에 실패했습니다')
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-[#121212] border-b border-gray-800 px-4 py-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-800 transition-colors"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        <h1 className="text-xl font-bold text-white">설정</h1>
      </div>

      {/* 설정 리스트 */}
      <div className="px-4 py-6 space-y-6">
        {/* Group 1: 내 정보 */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 px-2 mb-2">내 정보</h2>
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            {/* 닉네임 변경 */}
            <button
              onClick={() => setShowNicknameModal(true)}
              className="w-full flex items-center justify-between px-4 py-4 active:bg-gray-800 transition-colors"
            >
              <div className="flex-1 text-left">
                <div className="text-white font-medium">닉네임 변경</div>
                <div className="text-gray-400 text-sm mt-0.5">{userName}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>

            {/* 피부 타입 설정 */}
            <button
              onClick={() => setShowSkinTypeModal(true)}
              className="w-full flex items-center justify-between px-4 py-4 active:bg-gray-800 transition-colors border-t border-gray-800"
            >
              <div className="flex-1 text-left">
                <div className="text-white font-medium">피부 타입 설정</div>
                <div className="text-gray-400 text-sm mt-0.5">
                  {skinType || '설정하지 않음'}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Group 2: 알림 */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 px-2 mb-2">알림</h2>
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            {/* 푸시 알림 */}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex-1">
                <div className="text-white font-medium">푸시 알림</div>
                <div className="text-gray-400 text-sm mt-0.5">앱 알림을 받습니다</div>
              </div>
              <button
                onClick={() => handlePushNotificationToggle(!pushNotification)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  pushNotification ? 'bg-[#00FFC2]' : 'bg-gray-700'
                }`}
              >
                <motion.div
                  animate={{
                    x: pushNotification ? 24 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                />
              </button>
            </div>

            {/* 야간 알림 제한 */}
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-800">
              <div className="flex-1">
                <div className="text-white font-medium">야간 알림 제한</div>
                <div className="text-gray-400 text-sm mt-0.5">22시 ~ 08시 알림 차단</div>
              </div>
              <button
                onClick={() => handleNightModeToggle(!nightModeRestriction)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  nightModeRestriction ? 'bg-[#00FFC2]' : 'bg-gray-700'
                }`}
              >
                <motion.div
                  animate={{
                    x: nightModeRestriction ? 24 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Group 3: 앱 정보 */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 px-2 mb-2">앱 정보</h2>
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            {/* 서비스 이용약관 */}
            <button
              onClick={() => {
                toast('이용약관 페이지 준비 중입니다', { icon: '📄' })
              }}
              className="w-full flex items-center justify-between px-4 py-4 active:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-white font-medium">서비스 이용약관</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>

            {/* 버전 정보 */}
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5" />
                <span className="text-white font-medium">버전 정보</span>
              </div>
              <span className="text-gray-400 text-sm">현재 버전 1.0.0</span>
            </div>

            {/* 문의하기 */}
            <a
              href="mailto:dev@dermaai.com"
              className="flex items-center justify-between px-4 py-4 border-t border-gray-800 active:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-white font-medium">문의하기</span>
              </div>
              <span className="text-gray-400 text-sm">dev@dermaai.com</span>
            </a>
          </div>
        </div>

        {/* Group 4: 데이터 관리 (Red Zone) */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 px-2 mb-2">데이터 관리</h2>
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <button
              onClick={handleClearAllData}
              className="w-full flex items-center justify-between px-4 py-4 active:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-500" />
                <span className="text-red-500 font-medium">진단 기록 전체 삭제</span>
              </div>
              <ChevronRight className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* 닉네임 변경 모달 */}
      <AnimatePresence>
        {showNicknameModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowNicknameModal(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-3xl p-6 max-w-md mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">닉네임 변경</h3>
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFC2] transition-colors mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNicknameChange()
                  }
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNicknameModal(false)}
                  className="flex-1 py-3 bg-gray-800 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleNicknameChange}
                  className="flex-1 py-3 bg-[#00FFC2] text-black font-bold rounded-xl hover:bg-[#00E6B8] transition-colors"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 피부 타입 선택 모달 */}
      <AnimatePresence>
        {showSkinTypeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowSkinTypeModal(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-3xl p-6 max-w-md mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">피부 타입 선택</h3>
              <div className="space-y-2">
                {(['건성', '지성', '복합성', '민감성'] as SkinType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleSkinTypeChange(type)}
                    className={`w-full px-4 py-4 rounded-xl text-left font-medium transition-colors ${
                      skinType === type
                        ? 'bg-[#00FFC2] text-black'
                        : 'bg-gray-800 text-white hover:bg-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowSkinTypeModal(false)}
                className="w-full mt-4 py-3 bg-gray-800 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}




