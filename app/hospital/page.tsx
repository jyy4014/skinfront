'use client'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { ArrowLeft, Search, Phone, Calendar, MapPin, Star, Loader2, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import ReservationModal from '@/app/components/hospital/ReservationModal'
import toast from 'react-hot-toast'
import type { HospitalData, Event } from '@/app/components/RealMap'
import { formatPrice } from '@/lib/utils'

// OSM Nominatim API 응답 타입
interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  type: string
}

// RealMap 컴포넌트를 SSR 없이 동적으로 로드
const RealMap = dynamic(() => import('@/app/components/RealMap').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[#212121] flex items-center justify-center z-0">
      <div className="w-8 h-8 border-2 border-[#00FFC2] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

// useSearchParams를 사용하는 컴포넌트를 Suspense로 감싸기 위해 분리
function HospitalPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState<string>('피코토닝')
  const [filteredPins, setFilteredPins] = useState<any[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 선택된 병원 ID (마커 클릭 시 포커스용)
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const hospitalListRef = useRef<HTMLDivElement>(null)

  // 🗺️ 위치 기반 검색 상태
  const [isSearching, setIsSearching] = useState(false)
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | null>(null)
  const [searchLocationName, setSearchLocationName] = useState<string | null>(null)

  // 병원 데이터 (Mock) - 정확한 인터페이스 구조 준수
  // 좌표를 강남역 주변으로 분산 배치
  const allPricePins: HospitalData[] = [
    {
      id: 1,
      name: '미래 의원 강남점',
      location: [37.4979, 127.0276], // 강남역 중심
      isHighlighted: true,
      keywords: ['피코토닝', '기미', '색소'],
      events: [
        { name: '피코토닝 1회 체험', originalPrice: 150000, eventPrice: 49000, discountRate: 67, isMain: true }, // 가장 저렴함
        { name: '인모드 FX 풀페이스', originalPrice: 300000, eventPrice: 190000, discountRate: 36, isMain: false },
        { name: '프락셀 레이저 3회', originalPrice: 450000, eventPrice: 320000, discountRate: 29, isMain: false },
      ],
      distance: 300,
      rating: 4.9,
      reviewCount: 124,
      phone: '02-1234-5678',
    },
    {
      id: 2,
      name: '스킨케어 클리닉',
      location: [37.4985, 127.0285], // 강남역 북동쪽
      isHighlighted: false,
      keywords: ['프락셀', '모공', '잡티'],
      events: [
        { name: '프락셀 3회 패키지', originalPrice: 600000, eventPrice: 450000, discountRate: 25, isMain: true },
        { name: '모공 관리 특가', originalPrice: 120000, eventPrice: 89000, discountRate: 26, isMain: false },
      ],
      distance: 350,
      rating: 4.7,
      reviewCount: 89,
      phone: '02-2345-6789',
    },
    {
      id: 3,
      name: '뷰티라인 의원',
      location: [37.4970, 127.0260], // 강남역 남서쪽
      isHighlighted: false,
      keywords: ['IPL', '레이저', '기미'],
      events: [
        { name: 'IPL 레이저 5회', originalPrice: 750000, eventPrice: 550000, discountRate: 27, isMain: true },
        { name: '기미 레이저 특가', originalPrice: 200000, eventPrice: 150000, discountRate: 25, isMain: false },
      ],
      distance: 400,
      rating: 4.8,
      reviewCount: 156,
      phone: '02-3456-7890',
    },
    {
      id: 4,
      name: '토닝 전문 클리닉',
      location: [37.4990, 127.0265], // 강남역 북서쪽
      isHighlighted: false,
      keywords: ['토닝', '기미', '색소'],
      events: [
        { name: '토닝 레이저 3회', originalPrice: 360000, eventPrice: 250000, discountRate: 31, isMain: true },
        { name: '색소 제거 패키지', originalPrice: 180000, eventPrice: 129000, discountRate: 28, isMain: false },
      ],
      distance: 450,
      rating: 4.6,
      reviewCount: 67,
      phone: '02-4567-8901',
    },
    {
      id: 5,
      name: '프락셀 센터',
      location: [37.4965, 127.0290], // 강남역 남동쪽
      isHighlighted: false,
      keywords: ['프락셀', '모공'],
      events: [
        { name: '프락셀 1회 체험', originalPrice: 200000, eventPrice: 149000, discountRate: 26, isMain: true },
        { name: '모공 리프팅 특가', originalPrice: 150000, eventPrice: 99000, discountRate: 34, isMain: false },
      ],
      distance: 500,
      rating: 4.5,
      reviewCount: 98,
      phone: '02-5678-9012',
    },
  ]

  // 검색 키워드에 따라 isMain 동적 설정
  const processHospitalsWithSearchKeyword = (hospitals: HospitalData[], keyword: string | null): HospitalData[] => {
    if (!keyword) {
      // 키워드가 없으면 가격이 가장 낮은 것을 isMain으로 설정
      return hospitals.map((hospital) => {
        const sortedEvents = [...hospital.events].sort((a, b) => a.eventPrice - b.eventPrice)
        const cheapestEvent = sortedEvents[0]
        return {
          ...hospital,
          events: hospital.events.map((e) => ({
            ...e,
            isMain: e.name === cheapestEvent.name,
          })),
        }
      })
    }

    // 키워드가 있으면 해당 키워드가 포함된 이벤트를 isMain으로 설정
    return hospitals.map((hospital) => {
      const matchingEvent = hospital.events.find((e) =>
        e.name.toLowerCase().includes(keyword.toLowerCase())
      )
      
      if (matchingEvent) {
        return {
          ...hospital,
          events: hospital.events.map((e) => ({
            ...e,
            isMain: e.name === matchingEvent.name,
          })),
        }
      }
      
      // 매칭되는 이벤트가 없으면 가장 저렴한 것을 isMain으로 설정
      const sortedEvents = [...hospital.events].sort((a, b) => a.eventPrice - b.eventPrice)
      const cheapestEvent = sortedEvents[0]
      return {
        ...hospital,
        events: hospital.events.map((e) => ({
          ...e,
          isMain: e.name === cheapestEvent.name,
        })),
      }
    })
  }

  // 쿼리 파라미터에서 keyword 받아오기 및 초기화
  useEffect(() => {
    const keyword = searchParams.get('keyword')
    if (keyword) {
      const decodedKeyword = decodeURIComponent(keyword)
      setSearchKeyword(decodedKeyword)
      
      // 검색어로 필터링 및 isMain 동적 설정
      const filtered = allPricePins.filter((pin) =>
        pin.keywords.some((k) => k.includes(decodedKeyword) || decodedKeyword.includes(k))
      )
      const processed = processHospitalsWithSearchKeyword(
        filtered.length > 0 ? filtered : allPricePins,
        decodedKeyword
      )
      setFilteredPins(processed)
      
      // 토스트 메시지
      toast.success(`'${decodedKeyword}' 검색 결과입니다`, {
        icon: '🔍',
        duration: 2000,
      })
      
      // 검색창에 포커스 (약간의 딜레이 후)
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 300)
    } else {
      // 키워드가 없으면 전체 표시 및 isMain 설정
      const processed = processHospitalsWithSearchKeyword(allPricePins, null)
      setFilteredPins(processed)
    }
  }, [searchParams])

  // 검색어 변경 시 필터링 (실시간)
  const handleSearchChange = (value: string) => {
    setSearchKeyword(value)
    // 실시간 필터링은 병원명/시술명만
    filterHospitals(value)
  }

  // 병원 필터링 로직 (분리)
  const filterHospitals = useCallback((keyword: string) => {
    if (keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase()
      const filtered = allPricePins.filter((pin) =>
        // 키워드, 병원명, 이벤트명 모두에서 검색
        pin.keywords.some((k) => k.toLowerCase().includes(lowerKeyword) || lowerKeyword.includes(k.toLowerCase())) ||
        pin.name.toLowerCase().includes(lowerKeyword) ||
        pin.events.some((e) => e.name.toLowerCase().includes(lowerKeyword))
      )
      const processed = processHospitalsWithSearchKeyword(
        filtered.length > 0 ? filtered : allPricePins,
        keyword
      )
      setFilteredPins(processed)
      return filtered.length > 0
    } else {
      const processed = processHospitalsWithSearchKeyword(allPricePins, null)
      setFilteredPins(processed)
      return true
    }
  }, [allPricePins])

  // 🗺️ 지역명 검색 (OSM Nominatim)
  const searchLocation = useCallback(async (query: string): Promise<[number, number] | null> => {
    try {
      const encodedQuery = encodeURIComponent(query)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&countrycodes=kr&limit=1`,
        {
          headers: {
            'Accept-Language': 'ko',
          },
        }
      )

      if (!response.ok) {
        throw new Error('위치 검색 실패')
      }

      const results: NominatimResult[] = await response.json()

      if (results.length > 0) {
        const { lat, lon, display_name } = results[0]
        setSearchLocationName(display_name.split(',')[0]) // 첫 번째 부분만 표시
        return [parseFloat(lat), parseFloat(lon)]
      }

      return null
    } catch (error) {
      console.error('Location search error:', error)
      return null
    }
  }, [])

  // 🔍 통합 검색 (엔터 시 실행)
  const handleSearchSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!searchKeyword.trim()) {
      toast.error('검색어를 입력해주세요')
      return
    }

    setIsSearching(true)
    setSearchLocationName(null)

    try {
      // A. 병원/시술 필터링
      const hasHospitalResults = filterHospitals(searchKeyword)

      // B. 지역명 검색 (Geocoding)
      const location = await searchLocation(searchKeyword)

      if (location) {
        // 지역이 발견되면 지도 이동
        setFlyToLocation(location)
        toast.success(`📍 ${searchLocationName || searchKeyword} 지역으로 이동합니다`, {
          duration: 2000,
        })
      } else if (!hasHospitalResults) {
        // 지역도 없고 병원도 없으면
        toast.error('검색 결과가 없습니다', {
          icon: '🔍',
          duration: 2000,
        })
      } else {
        // 병원만 발견
        toast.success(`'${searchKeyword}' 검색 결과 ${filteredPins.length}개`, {
          icon: '🔍',
          duration: 2000,
        })
      }
    } finally {
      setIsSearching(false)
    }
  }, [searchKeyword, filterHospitals, searchLocation, searchLocationName, filteredPins.length])


  // 마커 클릭 핸들러
  const handleMarkerClick = (hospital: HospitalData) => {
    setSelectedHospitalId(hospital.id)
    // 해당 병원 카드로 스크롤
    setTimeout(() => {
      const element = document.getElementById(`hospital-${hospital.id}`)
      if (element && hospitalListRef.current) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // 하이라이트 효과
        element.classList.add('ring-2', 'ring-[#00FFC2]')
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-[#00FFC2]')
        }, 2000)
      }
    }, 100)
  }

  // 가격 핀 데이터 (필터링된 결과 사용)
  const pricePins = filteredPins.length > 0 ? filteredPins : allPricePins

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 인터랙티브 지도 (RealMap) */}
      <RealMap
        hospitals={pricePins}
        selectedId={selectedHospitalId}
        onMarkerClick={handleMarkerClick}
        flyToLocation={flyToLocation}
      />

      {/* 상단 검색바 (Floating) */}
      <div className="absolute top-4 left-0 right-0 z-10 px-4">
        <div className="max-w-[430px] mx-auto">
          <form onSubmit={handleSearchSubmit}>
            <div className="flex items-center gap-3 bg-white shadow-lg rounded-full px-4 py-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="뒤로가기"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div className="flex-1 flex items-center gap-2">
                {isSearching ? (
                  <Loader2 className="w-4 h-4 text-[#00FFC2] flex-shrink-0 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="지역 또는 시술명 검색 (예: 강남, 피코토닝)"
                  className="flex-1 text-gray-800 text-sm font-medium bg-transparent border-none outline-none placeholder:text-gray-400"
                  disabled={isSearching}
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchKeyword('')
                      setSearchLocationName(null)
                      setFlyToLocation(null)
                      filterHospitals('')
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              {/* 검색 버튼 */}
              <button
                type="submit"
                disabled={isSearching}
                className="px-3 py-1.5 bg-[#00FFC2] text-black text-xs font-bold rounded-full hover:bg-[#00E6B8] transition-colors disabled:opacity-50"
              >
                {isSearching ? '검색중' : '검색'}
              </button>
            </div>
          </form>
          
          {/* 지역 검색 결과 표시 */}
          {searchLocationName && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 px-4 py-2 bg-blue-500/90 text-white text-sm rounded-full flex items-center gap-2 w-fit"
            >
              <MapPin className="w-4 h-4" />
              <span>📍 {searchLocationName} 주변</span>
            </motion.div>
          )}
        </div>
      </div>


      {/* 하단 병원 리스트 (Bottom Sheet) */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: '35%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute bottom-0 left-0 right-0 z-10 bg-white rounded-t-3xl shadow-2xl max-w-[430px] mx-auto"
        style={{ height: '65%' }}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 내용 */}
        <div ref={hospitalListRef} className="px-4 pb-6 overflow-y-auto h-full">
          {/* 검색 결과 표시 */}
          {searchKeyword && searchKeyword !== '피코토닝' && (
            <div className="mb-4 text-sm text-gray-600">
              <span className="font-semibold text-gray-900">'{searchKeyword}'</span> 검색 결과 {pricePins.length}개
            </div>
          )}

          {/* 병원 리스트 아이템 */}
          {pricePins.map((pin) => {
            const mainEvent = pin.events.find((e: Event) => e.isMain) || pin.events[0]
            const otherEvents = pin.events.filter((e: Event) => !e.isMain)

            return (
              <div
                key={pin.id}
                id={`hospital-${pin.id}`}
                className={`bg-white rounded-2xl mb-4 border-2 shadow-sm transition-all overflow-hidden ${
                  pin.isHighlighted ? 'border-[#00FFC2] bg-gradient-to-br from-[#00FFC2]/5 to-transparent' : 'border-gray-100'
                } ${selectedHospitalId === pin.id ? 'ring-2 ring-[#00FFC2]' : ''}`}
              >
                {/* 클릭 가능한 영역 */}
                <div
                  onClick={() => {
                    setExpandedId(expandedId === pin.id ? null : pin.id)
                  }}
                  className="p-5 cursor-pointer"
                >
                  {/* 병원명 및 할인 뱃지 */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{pin.name}</h3>
                    {pin.isHighlighted && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        🔥 특가
                      </span>
                    )}
                  </div>

                  {/* 정보 (거리/평점) */}
                  <div className="flex items-center gap-3 mb-4 text-gray-600 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{pin.distance}m</span>
                    </div>
                    <span>|</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-gray-900">{pin.rating}</span>
                      <span className="text-gray-500">({pin.reviewCount} reviews)</span>
                    </div>
                  </div>

                  {/* 대표 이벤트 가격 카드 */}
                  <div className="mb-4 p-3 rounded-xl border-2 bg-gradient-to-r from-[#00FFC2]/10 to-[#00E6B8]/10 border-[#00FFC2]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{mainEvent.name}</span>
                        <span className="px-1.5 py-0.5 bg-[#00FFC2] text-black text-xs font-bold rounded">
                          대표
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">
                        -{mainEvent.discountRate}%
                      </span>
                    </div>
                    {/* 가격 정보 - flex items-end로 밑라인 맞춤 */}
                    <div className="flex items-end">
                      <span className="text-red-500 font-extrabold text-lg mr-2">
                        -{mainEvent.discountRate}%
                      </span>
                      <span className="text-[#00FFC2] font-black text-2xl">
                        {formatPrice(mainEvent.eventPrice)}
                      </span>
                      <span className="text-gray-500 text-sm line-through ml-2">
                        {formatPrice(mainEvent.originalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 아코디언: 나머지 이벤트 */}
                {otherEvents.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: expandedId === pin.id ? 'auto' : 0,
                      opacity: expandedId === pin.id ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden bg-gray-800/50"
                  >
                    <div className="p-3 space-y-2">
                      {otherEvents.map((event: Event, eventIndex: number) => (
                        <div
                          key={eventIndex}
                          className="flex flex-row justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-200"
                        >
                          <span className="text-sm font-semibold text-gray-900">{event.name}</span>
                          <div className="flex items-end">
                            <span className="text-red-500 font-extrabold text-lg mr-2">
                              -{event.discountRate}%
                            </span>
                            <span className="text-[#00FFC2] font-black text-2xl">
                              {formatPrice(event.eventPrice)}
                            </span>
                            <span className="text-gray-500 text-sm line-through ml-2">
                              {formatPrice(event.originalPrice)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 버튼 */}
                <div className="px-5 pb-5 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      window.location.href = `tel:${pin.phone}`
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    전화하기
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsReservationModalOpen(true)
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 font-bold rounded-xl transition-colors shadow-md ${
                      pin.isHighlighted
                        ? 'bg-[#00FFC2] text-black hover:bg-[#00E6B8]'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    예약하기
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* 예약 신청 모달 */}
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
      />
    </div>
  )
}

// Suspense boundary로 감싸는 wrapper component
export default function HospitalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#212121] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00FFC2] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HospitalPageContent />
    </Suspense>
  )
}
