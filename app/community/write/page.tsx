'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { ArrowLeft, Image as ImageIcon, Tag, FileText, X, CheckCircle2, Building2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { getRecentSkinRecords, type SkinAnalysisRecord } from '../../utils/storage'
import { useToastContext } from '../../components/common/ToastProvider'
import { formatRecordDate } from '@/lib/utils'

type Category = 'question' | 'review'

// 예약 기반 후기 작성 정보
interface BookingInfo {
  bookingId: string
  hospitalName: string
  procedure: string
  visitDate: string
}

interface AttachedImage {
  id: string
  url: string
  name: string
}

interface AttachedReport {
  id: string
  record: SkinAnalysisRecord
}

const mockImagePool = [
  {
    url: 'https://images.unsplash.com/photo-1616394584738-fc6e612e781b?q=80&w=400&auto=format&fit=crop',
    name: '피부 사진 1.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=400&auto=format&fit=crop',
    name: '피부 사진 2.jpg',
  },
]

let uniqueIdCounter = 0
const generateUniqueId = (prefix: string) => `${prefix}_${uniqueIdCounter++}`

let mockImageCursor = 0
const getNextMockImage = () => {
  const image = mockImagePool[mockImageCursor % mockImagePool.length]
  mockImageCursor += 1
  return image
}

// useSearchParams를 사용하는 내부 컴포넌트
function WritePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { success } = useToastContext()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [category, setCategory] = useState<Category>('question')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([])
  const [attachedReport, setAttachedReport] = useState<AttachedReport | null>(null)
  const [tags, setTags] = useState<string[]>([])
  
  // 🏥 예약 기반 후기 작성 정보
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null)
  const [isVerifiedReview, setIsVerifiedReview] = useState(false)

  // URL 쿼리 파라미터에서 예약 정보 추출
  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (cancelled) return
      const type = searchParams.get('type')
      const bookingId = searchParams.get('bookingId')
      const hospitalName = searchParams.get('hospitalName') || searchParams.get('hospital')
      const procedure = searchParams.get('procedure') || searchParams.get('treatment')
      const visitDate = searchParams.get('visitDate')

      if (type === 'review' && hospitalName && procedure) {
        setCategory('review')
        setIsVerifiedReview(true)
        setBookingInfo({
          bookingId: bookingId || '',
          hospitalName,
          procedure,
          visitDate: visitDate || '',
        })
        setTitle(`[후기] ${procedure} 솔직 후기`)
        setTags([procedure, hospitalName])
      }
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [searchParams])

  // Textarea 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [content])

  // AI 리포트 첨부
  const handleAttachReport = () => {
    try {
      const records = getRecentSkinRecords(1)
      if (records.length === 0) {
        success('진단 기록이 없습니다. 먼저 진단을 받아보세요.', 3000)
        return
      }

      const latestRecord = records[0]
      setAttachedReport({
        id: generateUniqueId('report'),
        record: latestRecord,
      })

      // 리포트 카드를 본문에 삽입
      const reportCard = `\n\n[AI 진단 리포트 첨부]\n📅 ${formatRecordDate(latestRecord.date)} 진단 기록 (${latestRecord.totalScore}점 - ${latestRecord.primaryConcern} ${getGrade(latestRecord)})\n`
      setContent((prev) => prev + reportCard)

      success(`✅ ${formatRecordDate(latestRecord.date)} 진단 데이터가 첨부되었습니다.`, 3000)
    } catch (error) {
      console.error('Failed to attach report:', error)
    }
  }

  // 사진 첨부 (Mock)
  const handleAttachImage = () => {
    const randomImage = getNextMockImage()
    const imageWithId: AttachedImage = {
      id: generateUniqueId('img'),
      ...randomImage,
    }
    setAttachedImages((prev) => [...prev, imageWithId])

    // 이미지 마크다운을 본문에 삽입
    const imageMarkdown = `\n\n![${imageWithId.name}](${imageWithId.url})\n`
    setContent((prev) => prev + imageMarkdown)

    success('📷 사진이 첨부되었습니다.', 2000)
  }

  // 이미지 삭제
  const handleRemoveImage = (id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id))
  }

  // 리포트 삭제
  const handleRemoveReport = () => {
    setAttachedReport(null)
    // 본문에서 리포트 카드 제거 (간단한 구현)
    setContent((prev) => prev.replace(/\n\n\[AI 진단 리포트 첨부\].*?\n/g, ''))
  }

  // 등록 버튼 활성화 조건
  const isValid = title.trim().length > 0 && content.trim().length > 0

  // 등록 처리
  const handleSubmit = () => {
    if (!isValid) return

    // 등록 데이터 구성
    const postData = {
      category,
      title,
      content,
      attachedImages,
      attachedReport,
      tags,
      // 🏥 인증된 후기 정보
      isVerified: isVerifiedReview,
      bookingId: bookingInfo?.bookingId || null,
      hospitalName: bookingInfo?.hospitalName || null,
      procedure: bookingInfo?.procedure || null,
      visitDate: bookingInfo?.visitDate || null,
    }

    // 실제로는 API 호출
    console.log('Submit:', postData)

    // 예약 데이터에 reviewWritten 업데이트
    if (bookingInfo?.bookingId) {
      try {
        const stored = localStorage.getItem('reservations')
        if (stored) {
          const reservations = JSON.parse(stored)
          const updated = reservations.map((r: { id: string }) =>
            r.id === bookingInfo.bookingId ? { ...r, reviewWritten: true } : r
          )
          localStorage.setItem('reservations', JSON.stringify(updated))
        }
      } catch (error) {
        console.error('Failed to update reservation:', error)
      }
    }

    success(isVerifiedReview ? '✅ 인증된 후기가 등록되었습니다!' : '글이 등록되었습니다!', 2000)
    setTimeout(() => {
      router.push('/community')
    }, 1000)
  }

  // 등급 가져오기
  const getGrade = (record: SkinAnalysisRecord): string => {
    const concernKey =
      record.primaryConcern === '기미'
        ? 'pigmentation'
        : record.primaryConcern === '모공'
          ? 'pores'
          : record.primaryConcern === '주름'
            ? 'wrinkles'
            : 'acne'
    return record.details[concernKey]?.grade || '주의'
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-20">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-[#121212]/95 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">글쓰기</h1>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              isValid
                ? 'text-[#00FFC2] hover:text-[#00E6B8] cursor-pointer'
                : 'text-gray-500 cursor-not-allowed'
            }`}
          >
            등록
          </button>
        </div>
      </header>

      <div className="px-4 py-4">
        {/* 🏥 인증된 후기 카드 */}
        {isVerifiedReview && bookingInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-[#00FFC2]/10 to-[#00E6B8]/10 border-2 border-[#00FFC2]/50 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#00FFC2]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#00FFC2]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#00FFC2] font-bold text-sm">🏥 방문 인증됨</span>
                  <span className="px-2 py-0.5 bg-[#00FFC2]/20 text-[#00FFC2] text-xs font-semibold rounded-full">
                    ✓ VERIFIED
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold">{bookingInfo.hospitalName}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-300">{bookingInfo.procedure}</span>
                </div>
                {bookingInfo.visitDate && (
                  <p className="text-sm text-gray-400 mt-1">
                    📅 {new Date(bookingInfo.visitDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })} 방문
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 카테고리 선택 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => !isVerifiedReview && setCategory('question')}
            disabled={isVerifiedReview}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              category === 'question'
                ? 'bg-[#00FFC2] text-black'
                : isVerifiedReview
                  ? 'bg-gray-800/30 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            질문
          </button>
          <button
            onClick={() => !isVerifiedReview && setCategory('review')}
            disabled={isVerifiedReview}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              category === 'review'
                ? 'bg-[#00FFC2] text-black'
                : isVerifiedReview
                  ? 'bg-gray-800/30 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            후기 {isVerifiedReview && '✓'}
          </button>
        </div>

        {/* 제목 입력 */}
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isVerifiedReview ? `[후기] ${bookingInfo?.procedure} 솔직 후기` : "제목을 입력하세요"}
            className="w-full px-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFC2] transition-colors text-lg font-semibold"
          />
        </div>

        {/* 본문 입력 */}
        <div className="mb-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="고민 부위 사진과 함께 자세히 적어주시면 의사 선생님 답변 확률이 올라갑니다."
            rows={10}
            className="w-full px-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFC2] transition-colors resize-none min-h-[200px]"
            style={{ overflow: 'hidden' }}
          />
        </div>

        {/* 첨부된 리포트 카드 */}
        {attachedReport && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-gray-800/50 border border-[#00FFC2]/30 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-[#00FFC2] mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-white">AI 진단 리포트</p>
                  <button
                    onClick={handleRemoveReport}
                    className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <p className="text-sm text-gray-300">
                  📅 {formatRecordDate(attachedReport.record.date)} 진단 기록 ({attachedReport.record.totalScore}점 -{' '}
                  {attachedReport.record.primaryConcern} {getGrade(attachedReport.record)})
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 첨부된 이미지 미리보기 */}
        {attachedImages.length > 0 && (
          <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
            {attachedImages.map((img) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative flex-shrink-0"
              >
                <Image
                  src={img.url}
                  alt={img.name}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-lg object-cover border border-gray-700"
                />
                <button
                  onClick={() => handleRemoveImage(img.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* 툴바 */}
        <div className="fixed bottom-0 left-0 right-0 z-50 max-w-[430px] mx-auto bg-[#121212] border-t border-gray-800 px-4 py-3 pb-safe-area-bottom">
          <div className="flex items-center gap-4">
            {/* 사진 버튼 */}
            <button
              onClick={handleAttachImage}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors"
            >
              <ImageIcon className="w-5 h-5 text-white" />
              <span className="text-sm text-white">사진</span>
            </button>

            {/* 태그 버튼 */}
            <button
              onClick={() => {
                // 태그 선택 모달 (간단 구현)
                const tag = prompt('태그를 입력하세요:')
                if (tag && tag.trim()) {
                  setTags((prev) => [...prev, tag.trim()])
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors"
            >
              <Tag className="w-5 h-5 text-white" />
              <span className="text-sm text-white">태그</span>
            </button>

            {/* AI 리포트 첨부 버튼 */}
            <button
              onClick={handleAttachReport}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00FFC2]/20 to-[#00E6B8]/20 border border-[#00FFC2]/30 rounded-xl hover:from-[#00FFC2]/30 hover:to-[#00E6B8]/30 transition-colors"
            >
              <FileText className="w-5 h-5 text-[#00FFC2]" />
              <span className="text-sm text-[#00FFC2] font-medium">AI 리포트</span>
            </button>
          </div>

          {/* 선택된 태그 표시 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-[#00FFC2]/20 text-[#00FFC2] text-xs rounded-full flex items-center gap-1"
                >
                  #{tag}
                  <button
                    onClick={() => setTags((prev) => prev.filter((_, i) => i !== index))}
                    className="hover:text-[#00E6B8]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 로딩 스피너
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00FFC2] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// useSearchParams는 Suspense로 감싸야 함
export default function WritePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <WritePageContent />
    </Suspense>
  )
}

