'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Plus, Search, Filter, X, FileText, Sparkles, Calendar, ArrowLeft, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getSkinRecords, type SkinAnalysisRecord } from '../utils/storage'
import AuthorProfileBadges from '../components/community/AuthorProfileBadges'
import { formatRecordDate } from '@/lib/utils'

// 게시글 타입
interface Post {
  id: string
  title: string
  content: string
  author: string
  date: string
  likes: number
  comments: number
  views: number
  tags: string[]
  images?: string[] // 이미지 배열 추가
  authorSkinType?: 'Dry' | 'Oily' | 'Combination' | 'Sensitive' | 'Normal'
  authorProfile?: {
    ageGroup: string // '20대', '30대', '40대' 등
    skinType: string // '건성', '지성', '복합성', '민감성', '정상'
    concern: string // '기미', '모공', '주름', '여드름' 등
  }
  relatedProcedure?: {
    name: string
    price: string
  }
}

// 목업 데이터
const mockPosts: Post[] = [
  {
    id: '1',
    title: '피코토닝 3회차 후기 - 기미가 정말 많이 개선됐어요!',
    content: '처음에는 걱정이 많았는데, 지금 보니 정말 만족스러워요. 기미가 많이 옅어졌고 피부톤도 밝아졌어요.',
    author: '김민지',
    date: '2024.11.20',
    likes: 24,
    comments: 8,
    views: 156,
    tags: ['기미', '잡티', '미백', '피코토닝'],
    images: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop',
    ],
    authorSkinType: 'Dry',
    authorProfile: {
      ageGroup: '30대',
      skinType: '건성',
      concern: '기미',
    },
    relatedProcedure: {
      name: '피코 슈어 토닝',
      price: '8.9만',
    },
  },
  {
    id: '2',
    title: '프락셀 레이저 받고 모공이 정말 쫙 들어갔어요',
    content: '모공이 넓어서 고민이 많았는데, 프락셀 레이저 받고 나니 정말 만족스러워요. 피부결도 좋아졌어요.',
    author: '이수진',
    date: '2024.11.18',
    likes: 31,
    comments: 12,
    views: 289,
    tags: ['모공', '프락셀', '피부결'],
    authorSkinType: 'Oily',
    authorProfile: {
      ageGroup: '20대',
      skinType: '지성',
      concern: '모공',
    },
    relatedProcedure: {
      name: '프락셀 레이저',
      price: '20만',
    },
  },
  {
    id: '3',
    title: '리쥬란 후기 - 주름이 정말 많이 개선됐어요',
    content: '이마 주름이 많아서 고민이었는데, 리쥬란 받고 나니 정말 만족스러워요. 피부 탄력도 좋아졌어요.',
    author: '박지영',
    date: '2024.11.15',
    likes: 18,
    comments: 5,
    views: 98,
    tags: ['주름', '리쥬란', '탄력'],
    authorSkinType: 'Combination',
    authorProfile: {
      ageGroup: '40대',
      skinType: '복합성',
      concern: '주름',
    },
    relatedProcedure: {
      name: '리쥬란',
      price: '30만',
    },
  },
  {
    id: '4',
    title: '인모드 후기 - 정말 효과 좋아요',
    content: '인모드 FX 받고 나니 정말 만족스러워요. 피부톤도 좋아졌어요. 인모드 통증은 거의 없었어요.',
    author: '최혜진',
    date: '2024.11.12',
    likes: 15,
    comments: 7,
    views: 124,
    tags: ['여드름', '흉터', '관리', '인모드통증'],
    authorSkinType: 'Sensitive',
    authorProfile: {
      ageGroup: '20대',
      skinType: '민감성',
      concern: '여드름',
    },
    relatedProcedure: {
      name: '인모드 FX',
      price: '4.9만',
    },
  },
  {
    id: '5',
    title: '내돈내산 후기 - 쁘띠 레이저 진짜 효과 있어요',
    content: '쁘띠 레이저 받고 나니 정말 만족스러워요. 피부톤도 좋아졌어요.',
    author: '정수아',
    date: '2024.11.10',
    likes: 42,
    comments: 15,
    views: 312,
    tags: ['쁘띠', '레이저', '내돈내산'],
    authorSkinType: 'Normal',
    authorProfile: {
      ageGroup: '30대',
      skinType: '정상',
      concern: '잡티',
    },
  },
]

// 추천 키워드
const recommendedKeywords = ['#인모드통증', '#여드름흉터', '#내돈내산', '#프락셀', '#리쥬란', '#피코토닝']

// 시술 카테고리
const procedureCategories = ['레이저', '쁘띠', '관리', '수술']

// 정렬 옵션
type SortOption = 'latest' | 'popular' | 'views'

// 키워드 매핑 (진단 결과 -> 커뮤니티 태그)
const concernToTags: Record<string, string[]> = {
  기미: ['기미', '잡티', '미백', '색소'],
  모공: ['모공', '피부결', '프락셀'],
  주름: ['주름', '탄력', '리프팅'],
  여드름: ['여드름', '트러블', '흉터'],
}

// 최근 검색어 관리
const SEARCH_HISTORY_KEY = 'community_search_history'
const MAX_SEARCH_HISTORY = 10

const getSearchHistory = (): string[] => {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveSearchHistory = (query: string) => {
  try {
    const history = getSearchHistory()
    const filtered = history.filter((q) => q !== query)
    const updated = [query, ...filtered].slice(0, MAX_SEARCH_HISTORY)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save search history:', error)
  }
}

const deleteSearchHistory = (query: string) => {
  try {
    const history = getSearchHistory()
    const updated = history.filter((q) => q !== query)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to delete search history:', error)
  }
}

// 검색어 정규화 함수 (전처리)
const normalizeSearchQuery = (query: string): string => {
  return query.trim().toLowerCase().replace(/\s+/g, '')
}

// 텍스트 정규화 함수 (비교용)
const normalizeText = (text: string): string => {
  return text.toLowerCase().replace(/\s+/g, '')
}

// 검색 필터링 함수 (부분 일치 + 띄어쓰기 유연성)
const matchesSearchQuery = (post: Post, query: string): boolean => {
  if (!query.trim()) return false

  const normalizedQuery = normalizeSearchQuery(query)

  // 1. 제목 검색 (띄어쓰기 제거 후 비교)
  if (normalizeText(post.title).includes(normalizedQuery)) {
    return true
  }

  // 2. 본문 검색 (띄어쓰기 제거 후 비교)
  if (normalizeText(post.content).includes(normalizedQuery)) {
    return true
  }

  // 3. 태그 검색 (띄어쓰기 제거 후 비교)
  if (post.tags.some((tag) => normalizeText(tag).includes(normalizedQuery))) {
    return true
  }

  return false
}

// 텍스트 하이라이팅 함수 (개선된 버전: 띄어쓰기 유연성 포함)
const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text

  const trimmedQuery = query.trim()
  const normalizedQuery = normalizeSearchQuery(query)
  const normalizedText = normalizeText(text)

  // 정규화된 텍스트에서 검색어 위치 찾기
  const index = normalizedText.indexOf(normalizedQuery)
  if (index === -1) return text

  // 원본 텍스트에서 매칭할 정규식 생성 (띄어쓰기 유연성 포함)
  // 예: "피코 토닝" -> "피코\s*토닝" 또는 "피코토닝"
  const queryWords = trimmedQuery.split(/\s+/).filter((w) => w.length > 0)
  const regexPattern = queryWords
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s*')

  const regex = new RegExp(`(${regexPattern})`, 'gi')
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match
  let keyCounter = 0

  // 정규식으로 매칭된 부분 찾기
  while ((match = regex.exec(text)) !== null) {
    // 매칭 전 텍스트
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }
    // 매칭된 부분 (하이라이팅)
    parts.push(
      <span key={`highlight-${keyCounter++}`} className="bg-[#00FFC2]/30 text-[#00FFC2] font-semibold">
        {match[0]}
      </span>
    )
    lastIndex = regex.lastIndex

    // 무한 루프 방지
    if (match.index === regex.lastIndex) {
      regex.lastIndex++
    }
  }

  // 남은 텍스트
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? <>{parts}</> : text
}

export default function CommunityPage() {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [userName, setUserName] = useState('회원')
  const [selectedFilter, setSelectedFilter] = useState<'personalized' | 'trending'>('trending')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [attachReport, setAttachReport] = useState(false)
  const [recentRecord, setRecentRecord] = useState<SkinAnalysisRecord | null>(null)
  const [personalizedTags, setPersonalizedTags] = useState<string[]>([])
  const [hasRecords, setHasRecords] = useState(false)

  // 검색 관련 상태
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [isMySkinTypeOnly, setIsMySkinTypeOnly] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>('latest')
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null)
  const [isProcedureDropdownOpen, setIsProcedureDropdownOpen] = useState(false)
  const [mySkinType, setMySkinType] = useState<'Dry' | 'Oily' | 'Combination' | 'Sensitive' | 'Normal' | null>(null)
  const [myConcern, setMyConcern] = useState<string | null>(null)

  // 사용자 진단 기록 불러오기 및 스마트 필터링 로직
  useEffect(() => {
    let isMounted = true
    const timer = window.setTimeout(() => {
      if (!isMounted) return
      try {
        const storedName = localStorage.getItem('userName') || '회원'
        setUserName(storedName)

        // localStorage에서 모든 기록 불러오기
        const allRecords = getSkinRecords()
        setHasRecords(allRecords.length > 0)

        // 피부 타입 설정: 설정 페이지에서 설정한 값 우선 사용
        const storedSkinType = localStorage.getItem('skin_type')
        if (storedSkinType) {
          // 한국어 -> 영어 매핑
          const skinTypeMap: Record<string, 'Dry' | 'Oily' | 'Combination' | 'Sensitive' | 'Normal'> = {
            건성: 'Dry',
            지성: 'Oily',
            복합성: 'Combination',
            민감성: 'Sensitive',
          }
          setMySkinType(skinTypeMap[storedSkinType] || null)
        } else if (allRecords.length > 0) {
          // 설정이 없으면 진단 기록 기반으로 추정
          const latestRecord = allRecords[0]
          const concernToSkinTypeMap: Record<string, 'Dry' | 'Oily' | 'Combination' | 'Sensitive' | 'Normal'> = {
            기미: 'Dry',
            모공: 'Oily',
            주름: 'Combination',
            여드름: 'Sensitive',
          }
          setMySkinType(concernToSkinTypeMap[latestRecord.primaryConcern] || 'Normal')
        }

        // 진단 기록 기반 맞춤 태그 및 필터 설정
        if (allRecords.length > 0) {
          const latestRecord = allRecords[0]
          setMyConcern(latestRecord.primaryConcern)
          setRecentRecord(latestRecord)

          // 진단 결과 기반 맞춤 태그 생성
          const tags = concernToTags[latestRecord.primaryConcern] || []
          setPersonalizedTags(tags)
          setSelectedTags(tags) // 기본적으로 맞춤 태그 선택
          setSelectedFilter('personalized') // 맞춤 필터 활성화
        } else {
          // Case B: 진단 기록 없음 - 실시간 인기 기본값
          setSelectedFilter('trending')
          setSelectedTags([]) // 모든 게시글 표시
        }

        // 최근 검색어 불러오기
        setSearchHistory(getSearchHistory())
      } catch (error) {
        console.error('Failed to load user records:', error)
        // 에러 발생 시 기본값으로 실시간 인기 설정
        setSelectedFilter('trending')
        setSelectedTags([])
      }
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(timer)
    }
  }, [])

  // 검색 모달 열릴 때 포커스
  useEffect(() => {
    if (isSearchModalOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isSearchModalOpen])

  const filteredPosts = useMemo(() => {
    let filtered = [...mockPosts]

    if (searchQuery.trim()) {
      filtered = filtered.filter((post) => matchesSearchQuery(post, searchQuery))
    } else if (selectedFilter === 'personalized' && selectedTags.length > 0) {
      filtered = filtered.filter((post) => selectedTags.some((tag) => post.tags.includes(tag)))
    }

    if (isMySkinTypeOnly && mySkinType) {
      filtered = filtered.filter((post) => post.authorSkinType === mySkinType)
    }

    if (selectedProcedure) {
      filtered = filtered.filter((post) => {
        if (!post.relatedProcedure) return false
        const procedureName = post.relatedProcedure.name.toLowerCase()
        const categoryMap: Record<string, string[]> = {
          레이저: ['레이저', '프락셀', '피코', '토닝'],
          쁘띠: ['쁘띠'],
          관리: ['관리', '케어'],
          수술: ['수술', '리쥬란'],
        }
        const keywords = categoryMap[selectedProcedure] || []
        return keywords.some((keyword) => procedureName.includes(keyword))
      })
    }

    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'popular':
          return b.likes - a.likes
        case 'views':
          return b.views - a.views
        case 'latest':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

    return filtered
  }, [selectedTags, selectedFilter, searchQuery, isMySkinTypeOnly, mySkinType, selectedProcedure, sortOption])

  // 검색 실행
  const handleSearch = (query: string) => {
    if (query.trim()) {
      setSearchQuery(query)
      saveSearchHistory(query)
      setSearchHistory(getSearchHistory())
      setIsSearchModalOpen(false)
    }
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-32">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-[#121212]/95 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-white">커뮤니티</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
              <Filter className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* 필터 탭 */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => {
              setSelectedFilter('trending')
              setSelectedTags([])
              setSearchQuery('')
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedFilter === 'trending' && !searchQuery
                ? 'bg-[#00FFC2] text-black'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            🔥 실시간 인기
          </button>
          {hasRecords && recentRecord && personalizedTags.length > 0 && (
            <button
              onClick={() => {
                setSelectedFilter('personalized')
                setSelectedTags(personalizedTags)
                setSearchQuery('')
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedFilter === 'personalized' && !searchQuery
                  ? 'bg-[#00FFC2] text-black'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              ✨ #{recentRecord.primaryConcern} 맞춤
            </button>
          )}
        </div>
      </div>

      {/* 스마트 필터링 바 */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          {/* 내 피부 타입만 보기 */}
          {mySkinType && (
            <button
              onClick={() => setIsMySkinTypeOnly(!isMySkinTypeOnly)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isMySkinTypeOnly
                  ? 'bg-[#00FFC2] text-black'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              🧬 내 피부 타입만
            </button>
          )}

          {/* 정렬 */}
          <div className="flex items-center gap-1 bg-gray-800/50 rounded-full px-2">
            <button
              onClick={() => setSortOption('latest')}
              className={`px-2 py-1.5 rounded-full text-xs font-medium transition-all ${
                sortOption === 'latest' ? 'bg-[#00FFC2] text-black' : 'text-gray-300'
              }`}
            >
              최신순
            </button>
            <span className="text-gray-500">|</span>
            <button
              onClick={() => setSortOption('popular')}
              className={`px-2 py-1.5 rounded-full text-xs font-medium transition-all ${
                sortOption === 'popular' ? 'bg-[#00FFC2] text-black' : 'text-gray-300'
              }`}
            >
              인기순
            </button>
            <span className="text-gray-500">|</span>
            <button
              onClick={() => setSortOption('views')}
              className={`px-2 py-1.5 rounded-full text-xs font-medium transition-all ${
                sortOption === 'views' ? 'bg-[#00FFC2] text-black' : 'text-gray-300'
              }`}
            >
              조회순
            </button>
          </div>

          {/* 시술별 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setIsProcedureDropdownOpen(!isProcedureDropdownOpen)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                selectedProcedure
                  ? 'bg-[#00FFC2] text-black'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              {selectedProcedure || '시술별'}
              <ChevronDown className={`w-3 h-3 transition-transform ${isProcedureDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProcedureDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-gray-800 rounded-xl p-2 min-w-[120px] z-50 border border-gray-700">
                <button
                  onClick={() => {
                    setSelectedProcedure(null)
                    setIsProcedureDropdownOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                    !selectedProcedure ? 'bg-[#00FFC2]/20 text-[#00FFC2]' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  전체
                </button>
                {procedureCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedProcedure(category)
                      setIsProcedureDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      selectedProcedure === category
                        ? 'bg-[#00FFC2]/20 text-[#00FFC2]'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 검색어 표시 */}
      {searchQuery && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">검색어:</span>
            <span className="text-sm text-[#00FFC2] font-semibold">&quot;{searchQuery}&quot;</span>
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* 맞춤 필터 배너 (Case A: 기록 있을 때만 표시) */}
      {hasRecords && recentRecord && personalizedTags.length > 0 && selectedFilter === 'personalized' && (
        <div className="px-4 pt-2 pb-4">
          <div className="bg-gradient-to-r from-[#00FFC2]/10 via-[#00FFC2]/5 to-transparent rounded-xl p-4 border border-[#00FFC2]/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#00FFC2]" />
              <p className="text-sm text-gray-300">
                {userName}님의 <span className="text-[#00FFC2] font-semibold">&lsquo;{recentRecord.primaryConcern}&rsquo;</span> 고민 탈출을 위한 맞춤 글이에요
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {personalizedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-[#00FFC2] text-black'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 게시글 리스트 */}
      <div className="px-4 py-4">
        {filteredPosts.length > 0 ? (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1A2333] rounded-xl p-4 border border-gray-800 hover:border-[#00FFC2]/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#00FFC2]/20 to-[#00E6B8]/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{post.author[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-white">{post.author}</span>
                      <span className="text-xs text-gray-500">{post.date}</span>
                      <AuthorProfileBadges
                        authorProfile={post.authorProfile}
                        mySkinType={mySkinType}
                        myConcern={myConcern}
                      />
                    </div>
                    <Link href={`/community/${post.id}`}>
                      <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 hover:text-[#00FFC2] transition-colors cursor-pointer">
                        {searchQuery ? highlightText(post.title, searchQuery) : post.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {searchQuery ? highlightText(post.content, searchQuery) : post.content}
                    </p>

                    {/* 태그 */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 bg-gray-800/50 text-xs rounded-full ${
                            searchQuery && tag.toLowerCase().includes(searchQuery.toLowerCase())
                              ? 'text-[#00FFC2] font-semibold'
                              : 'text-gray-400'
                          }`}
                        >
                          #{searchQuery ? highlightText(tag, searchQuery) : tag}
                        </span>
                      ))}
                    </div>

                    {/* 관련 시술 정보 */}
                    {post.relatedProcedure && (
                      <Link
                        href="/hospital"
                        className="inline-flex items-center gap-1.5 text-xs text-[#00FFC2] hover:text-[#00E6B8] transition-colors mt-2 group"
                      >
                        <span>⚡</span>
                        <span>시술 정보: {post.relatedProcedure.name} ({post.relatedProcedure.price})</span>
                        <span className="text-[#00FFC2] group-hover:translate-x-0.5 transition-transform inline-block">&gt;</span>
                      </Link>
                    )}

                    {/* 좋아요/댓글 */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>좋아요 {post.likes}</span>
                      <span>댓글 {post.comments}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1A2333] rounded-xl p-12 border border-gray-800 text-center">
            <p className="text-gray-400 text-sm">선택한 태그에 해당하는 글이 없습니다</p>
          </div>
        )}
      </div>

      {/* 글쓰기 플로팅 버튼 */}
      <motion.button
        onClick={() => setIsWriteModalOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-[#00FFC2] rounded-full flex items-center justify-center shadow-lg shadow-[#00FFC2]/40 z-30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus className="w-6 h-6 text-black" strokeWidth={2.5} />
      </motion.button>

      {/* 글쓰기 모달 */}
      <AnimatePresence>
        {isWriteModalOpen && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setIsWriteModalOpen(false)}
            />

            {/* 모달 컨텐츠 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A2333] rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">글쓰기</h2>
                <button
                  onClick={() => setIsWriteModalOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* 제목 입력 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">제목</label>
                <input
                  type="text"
                  placeholder="제목을 입력하세요"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFC2] transition-colors"
                />
              </div>

              {/* 내용 입력 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">내용</label>
                <textarea
                  placeholder="내용을 입력하세요"
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFC2] transition-colors resize-none"
                />
              </div>

              {/* AI 진단 리포트 첨부 */}
              <div className="mb-6">
                {hasRecords && recentRecord ? (
                  <>
                    <label className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#00FFC2]/10 to-transparent border border-[#00FFC2]/20 rounded-xl cursor-pointer hover:bg-[#00FFC2]/15 transition-colors">
                      <input
                        type="checkbox"
                        checked={attachReport}
                        onChange={(e) => setAttachReport(e.target.checked)}
                        disabled={false}
                        className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-800 text-[#00FFC2] focus:ring-[#00FFC2] focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-[#00FFC2]" />
                          <span className="text-sm font-semibold text-white">내 AI 진단 리포트 첨부</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          의사 선생님이 {userName}님의 피부 데이터를 보고 더 정확하게 답변해 드립니다
                        </p>
                      </div>
                    </label>

                    {/* 리포트 첨부 시 표시되는 요약 카드 */}
                    {attachReport && recentRecord && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3 bg-gray-800/50 border border-[#00FFC2]/30 rounded-xl"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#00FFC2]" />
                          <div className="flex-1">
                            <p className="text-sm text-white font-medium">
                              📅 {formatRecordDate(recentRecord.date)} 진단 기록 ({recentRecord.totalScore}점 - {recentRecord.primaryConcern}{' '}
                              {(() => {
                                const concernKey = recentRecord.primaryConcern === '기미' ? 'pigmentation' : 
                                                  recentRecord.primaryConcern === '모공' ? 'pores' :
                                                  recentRecord.primaryConcern === '주름' ? 'wrinkles' : 'acne'
                                return recentRecord.details[concernKey]?.grade || '주의'
                              })()})
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">이 리포트가 게시글에 첨부됩니다</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-xl">
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-1">첨부할 리포트가 없습니다</p>
                        <p className="text-xs text-gray-500">먼저 진단을 받아보세요</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 작성 버튼 */}
              <button
                onClick={() => {
                  alert('글이 작성되었습니다!')
                  setIsWriteModalOpen(false)
                }}
                className="w-full py-4 bg-gradient-to-r from-[#00FFC2] to-[#00E6B8] text-black font-bold rounded-xl hover:from-[#00E6B8] hover:to-[#00D4A3] transition-all shadow-lg shadow-[#00FFC2]/40 active:scale-[0.98]"
              >
                작성하기
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 검색 모달 */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 z-[100]"
              onClick={() => setIsSearchModalOpen(false)}
            />

            {/* 검색 모달 컨텐츠 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[101] bg-[#121212] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
                <button
                  onClick={() => setIsSearchModalOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch(searchQuery)
                      }
                    }}
                    placeholder="검색어를 입력하세요"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFC2] transition-colors"
                  />
                </div>
              </div>

              {/* 컨텐츠 */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {/* 최근 검색어 */}
                {searchHistory.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-300">최근 검색어</h3>
                    </div>
                    <div className="space-y-2">
                      {searchHistory.map((query, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors"
                        >
                          <button
                            onClick={() => handleSearch(query)}
                            className="flex-1 text-left text-sm text-white"
                          >
                            {query}
                          </button>
                          <button
                            onClick={() => {
                              deleteSearchHistory(query)
                              setSearchHistory(getSearchHistory())
                            }}
                            className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 추천 키워드 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">추천 키워드</h3>
                  <div className="flex flex-wrap gap-2">
                    {recommendedKeywords.map((keyword) => (
                      <button
                        key={keyword}
                        onClick={() => handleSearch(keyword.replace('#', ''))}
                        className="px-3 py-1.5 bg-gray-800/50 text-gray-300 text-xs rounded-full hover:bg-[#00FFC2]/20 hover:text-[#00FFC2] transition-colors"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

