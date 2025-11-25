'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Heart, MessageCircle, Share2, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import BeforeAfterSlider from '@/app/components/common/BeforeAfterSlider'
import AuthorProfileBadges from '@/app/components/community/AuthorProfileBadges'
import { getSkinRecords } from '@/app/utils/storage'

// 게시글 타입 (community/page.tsx와 동일)
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
  images?: string[]
  authorSkinType?: 'Dry' | 'Oily' | 'Combination' | 'Sensitive' | 'Normal'
  authorProfile?: {
    ageGroup: string
    skinType: string
    concern: string
  }
  relatedProcedure?: {
    name: string
    price: string
  }
}

// Mock 데이터 (실제로는 API에서 가져올 것)
const mockPosts: Post[] = [
  {
    id: '1',
    title: '피코토닝 3회차 후기 - 기미가 정말 많이 개선됐어요!',
    content: `처음에는 걱정이 많았는데, 지금 보니 정말 만족스러워요. 기미가 많이 옅어졌고 피부톤도 밝아졌어요.

3회차까지 받으면서 느낀 점:
- 1회차: 기미가 약간 옅어지는 느낌
- 2회차: 피부톤이 전체적으로 밝아짐
- 3회차: 기미가 확실히 많이 개선됨

통증은 거의 없었고, 회복 기간도 짧아서 좋았어요. 다음에도 계속 받을 예정입니다!`,
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
]

export default function CommunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  const [mySkinType, setMySkinType] = useState<'Dry' | 'Oily' | 'Combination' | 'Sensitive' | 'Normal' | null>(null)
  const [myConcern, setMyConcern] = useState<string | null>(null)

  const post = mockPosts.find((p) => p.id === postId)

  // 사용자 피부 정보 불러오기
  useEffect(() => {
    try {
      const allRecords = getSkinRecords()
      if (allRecords.length > 0) {
        const latestRecord = allRecords[0]
        const skinTypeMap: Record<string, 'Dry' | 'Oily' | 'Combination' | 'Sensitive' | 'Normal'> = {
          기미: 'Dry',
          모공: 'Oily',
          주름: 'Combination',
          여드름: 'Sensitive',
        }
        setMySkinType(skinTypeMap[latestRecord.primaryConcern] || 'Normal')
        setMyConcern(latestRecord.primaryConcern)
      }
    } catch (error) {
      console.error('Failed to load user records:', error)
    }
  }, [])

  if (!post) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-400 mb-4">게시글을 찾을 수 없습니다</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-[#00FFC2] text-black rounded-lg font-semibold"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  const hasBeforeAfter = post.images && post.images.length >= 2

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-[#121212]/95 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">게시글</h1>
          <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* 컨텐츠 */}
      <div className="px-4 py-6 pb-32">
        {/* 작성자 정보 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#00FFC2]/20 to-[#00E6B8]/20 rounded-full flex items-center justify-center">
            <span className="text-xl font-semibold">{post.author[0]}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-base font-semibold text-white">{post.author}</p>
              <AuthorProfileBadges
                authorProfile={post.authorProfile}
                mySkinType={mySkinType}
                myConcern={myConcern}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>{post.date}</span>
            </div>
          </div>
        </div>

        {/* 제목 */}
        <h2 className="text-2xl font-bold text-white mb-4">{post.title}</h2>

        {/* Before/After 슬라이더 또는 일반 이미지 */}
        {hasBeforeAfter ? (
          <div className="mb-6">
            <BeforeAfterSlider beforeImage={post.images[0]} afterImage={post.images[1]} />
          </div>
        ) : post.images && post.images.length > 0 ? (
          <div className="mb-6 rounded-xl overflow-hidden">
            <img src={post.images[0]} alt={post.title} className="w-full h-auto" />
          </div>
        ) : null}

        {/* 본문 내용 */}
        <div className="mb-6">
          <p className="text-base text-gray-300 leading-relaxed whitespace-pre-line">{post.content}</p>
        </div>

        {/* 태그 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 bg-gray-800/50 text-gray-300 text-sm rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* 관련 시술 정보 */}
        {post.relatedProcedure && (
          <div className="mb-6 p-4 bg-gradient-to-r from-[#00FFC2]/10 to-transparent border border-[#00FFC2]/20 rounded-xl">
            <p className="text-sm text-gray-400 mb-1">시술 정보</p>
            <p className="text-lg font-semibold text-[#00FFC2]">
              {post.relatedProcedure.name}
            </p>
            <p className="text-sm text-gray-300">평균 비용: {post.relatedProcedure.price}원</p>
          </div>
        )}

        {/* 좋아요/댓글/조회수 */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-800">
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-gray-400 hover:text-[#00FFC2] transition-colors">
              <Heart className="w-5 h-5" />
              <span className="text-sm font-medium">{post.likes}</span>
            </button>
            <button className="flex items-center gap-2 text-gray-400 hover:text-[#00FFC2] transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{post.comments}</span>
            </button>
          </div>
          <div className="text-xs text-gray-500">조회수 {post.views}</div>
        </div>
      </div>
    </div>
  )
}


