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
import { supabase } from '@/lib/supabase/client'

// RealMap 컴포넌트를 SSR 없이 동적으로 로드
const RealMap = dynamic(() => import('@/app/components/RealMap').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[#212121] flex items-center justify-center z-0">
      <div className="w-8 h-8 border-2 border-[#00FFC2] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

// Supabase 응답 타입 정의
interface SupabaseHospital {
  id: string
  name: string
  address: string | null
  phone: string | null
  latitude: number
  longitude: number
  rating: number
  review_count: number
  images: string[] | null
  tags: string[] | null
  dist_meters?: number
  hospital_events: SupabaseEvent[]
}

interface SupabaseEvent {
  id: string
  name: string
  category: string | null
  original_price: number
  event_price: number
  is_representative: boolean
}

// Supabase 데이터를 HospitalData 형식으로 변환
function transformToHospitalData(hospital: SupabaseHospital, searchKeyword?: string): HospitalData {
  const events: Event[] = hospital.hospital_events.map((e) => {
    const discountRate = e.original_price > 0
      ? Math.round((1 - e.event_price / e.original_price) * 100)
      : 0
    return {
      name: e.name,
      originalPrice: e.original_price,
      eventPrice: e.event_price,
      discountRate,
      isMain: e.is_representative,
    }
  })

  // 검색 키워드가 있으면 해당 이벤트를 isMain으로 설정
  if (searchKeyword) {
    const lowerKeyword = searchKeyword.toLowerCase()
    const matchingEvent = events.find((e) => e.name.toLowerCase().includes(lowerKeyword))
    if (matchingEvent) {
      events.forEach((e) => {
        e.isMain = e.name === matchingEvent.name
      })
    }
  }

  // isMain인 이벤트가 없으면 가장 저렴한 것을 isMain으로
  if (!events.some((e) => e.isMain) && events.length > 0) {
    const cheapest = events.reduce((min, e) => e.eventPrice < min.eventPrice ? e : min)
    cheapest.isMain = true
  }

  // 가장 저렴한 가격 확인 (특가 표시용)
  const minPrice = Math.min(...events.map((e) => e.eventPrice))
  const isHighlighted = minPrice < 100000 // 10만원 미만이면 특가

  return {
    id: hospital.id as unknown as number, // uuid를 number로 캐스팅 (실제로는 string)
    name: hospital.name,
    location: [hospital.latitude, hospital.longitude] as [number, number],
    isHighlighted,
    keywords: hospital.tags || [],
    events,
    distance: hospital.dist_meters ? Math.round(hospital.dist_meters) : 0,
    rating: Number(hospital.rating) || 0,
    reviewCount: hospital.review_count || 0,
    phone: hospital.phone || '',
  }
}

// useSearchParams를 사용하는 컴포넌트를 Suspense로 감싸기 위해 분리
function HospitalPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [hospitals, setHospitals] = useState<HospitalData[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 선택된 병원 ID (마커 클릭 시 포커스용)
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const hospitalListRef = useRef<HTMLDivElement>(null)

  // 🗺️ 위치 기반 검색 상태
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(true)
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | null>(null)
  const [searchLocationName, setSearchLocationName] = useState<string | null>(null)
  const [myLocation, setMyLocation] = useState<[number, number] | null>(null)

  // 🏥 Supabase에서 내 위치 기반 병원 로드 (RPC 사용)
  const loadNearbyHospitals = useCallback(async (lat: number, lon: number) => {
    setIsLoadingHospitals(true)
    try {
      // RPC 함수로 가까운 병원 조회
      const { data: nearbyHospitals, error: rpcError } = await supabase
        .rpc('get_nearby_hospitals', {
          my_lat: lat,
          my_long: lon,
          limit_count: 100
        })

      if (rpcError) {
        console.error('RPC Error:', rpcError)
        throw rpcError
      }

      if (!nearbyHospitals || nearbyHospitals.length === 0) {
        setHospitals([])
        return
      }

      // 각 병원의 이벤트 조회
      const hospitalIds = nearbyHospitals.map((h: { id: string }) => h.id)
      const { data: events, error: eventsError } = await supabase
        .from('hospital_events')
        .select('*')
        .in('hospital_id', hospitalIds)

      if (eventsError) {
        console.error('Events Error:', eventsError)
      }

      // 병원 데이터와 이벤트 결합
      const hospitalsWithEvents: SupabaseHospital[] = nearbyHospitals.map((h: SupabaseHospital) => ({
        ...h,
        hospital_events: events?.filter((e: { hospital_id: string }) => e.hospital_id === h.id) || []
      }))

      // HospitalData 형식으로 변환
      const transformedData = hospitalsWithEvents.map((h) => transformToHospitalData(h, searchKeyword))
      setHospitals(transformedData)
    } catch (error) {
      console.error('Failed to load hospitals:', error)
      toast.error('병원 정보를 불러오는데 실패했습니다')
    } finally {
      setIsLoadingHospitals(false)
    }
  }, [searchKeyword])

  // 🏥 Supabase에서 검색어 기반 병원 로드
  const searchHospitals = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      // 검색어가 없으면 내 위치 기준으로 다시 로드
      if (myLocation) {
        loadNearbyHospitals(myLocation[0], myLocation[1])
      }
      return true
    }

    setIsLoadingHospitals(true)
    try {
      const lowerKeyword = keyword.toLowerCase()

      // 병원명, 태그, 이벤트명으로 검색
      const { data: hospitalData, error } = await supabase
        .from('hospitals')
        .select(`
          *,
          hospital_events(*)
        `)
        .or(`name.ilike.%${lowerKeyword}%,tags.cs.{${lowerKeyword}}`)

      if (error) throw error

      // 이벤트명으로도 검색
      const { data: eventMatches, error: eventError } = await supabase
        .from('hospital_events')
        .select('hospital_id')
        .ilike('name', `%${lowerKeyword}%`)

      if (eventError) throw eventError

      // 이벤트 매칭 병원 ID 추출
      const eventMatchIds = [...new Set(eventMatches?.map((e) => e.hospital_id) || [])]

      // 이벤트 매칭 병원 추가 조회 (기존 결과에 없는 것만)
      const existingIds = hospitalData?.map((h) => h.id) || []
      const additionalIds = eventMatchIds.filter((id) => !existingIds.includes(id))

      let additionalHospitals: SupabaseHospital[] = []
      if (additionalIds.length > 0) {
        const { data: additionalData } = await supabase
          .from('hospitals')
          .select(`
            *,
            hospital_events(*)
          `)
          .in('id', additionalIds)
        additionalHospitals = additionalData || []
      }

      // 결합
      const allHospitals = [...(hospitalData || []), ...additionalHospitals] as SupabaseHospital[]

      // 내 위치 기준 거리 계산 (만약 있으면)
      const hospitalsWithDistance = allHospitals.map((h) => {
        if (myLocation) {
          const dist = calculateDistance(myLocation[0], myLocation[1], h.latitude, h.longitude)
          return { ...h, dist_meters: dist }
        }
        return { ...h, dist_meters: 0 }
      })

      // HospitalData 형식으로 변환
      const transformedData = hospitalsWithDistance.map((h) => transformToHospitalData(h, keyword))
      setHospitals(transformedData)

      return transformedData.length > 0
    } catch (error) {
      console.error('Failed to search hospitals:', error)
      toast.error('검색에 실패했습니다')
      return false
    } finally {
      setIsLoadingHospitals(false)
    }
  }, [myLocation, loadNearbyHospitals])

  // 거리 계산 함수 (Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000 // 지구 반경 (m)
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  // 초기 위치 로드 및 병원 데이터 조회
  useEffect(() => {
    const initLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            setMyLocation([latitude, longitude])
            loadNearbyHospitals(latitude, longitude)
          },
          () => {
            // GPS 실패 시 강남역 기본값
            const defaultLat = 37.4979
            const defaultLon = 127.0276
            setMyLocation([defaultLat, defaultLon])
            loadNearbyHospitals(defaultLat, defaultLon)
          },
          { enableHighAccuracy: true, timeout: 10000 }
        )
      } else {
        // Geolocation 미지원 시 기본값
        const defaultLat = 37.4979
        const defaultLon = 127.0276
        setMyLocation([defaultLat, defaultLon])
        loadNearbyHospitals(defaultLat, defaultLon)
      }
    }

    initLocation()
  }, [loadNearbyHospitals])

  // 쿼리 파라미터에서 keyword 받아오기
  useEffect(() => {
    const keyword = searchParams.get('keyword')
    if (keyword) {
      const decodedKeyword = decodeURIComponent(keyword)
      setSearchKeyword(decodedKeyword)
      searchHospitals(decodedKeyword)
      toast.success(`'${decodedKeyword}' 검색 결과입니다`, {
        icon: '🔍',
        duration: 2000,
      })
    }
  }, [searchParams, searchHospitals])

  // 검색어 변경 시 실시간 필터링
  const handleSearchChange = (value: string) => {
    setSearchKeyword(value)
  }

  // 🗺️ 지역명 검색 (Next.js API Route를 통해 OSM Nominatim 호출)
  const searchLocation = useCallback(async (query: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)

      if (!response.ok) {
        throw new Error('위치 검색 실패')
      }

      const result = await response.json()

      if (result.lat && result.lon) {
        setSearchLocationName(result.display_name)
        return [result.lat, result.lon]
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
      // A. 병원/시술 검색 (Supabase)
      const hasHospitalResults = await searchHospitals(searchKeyword)

      // B. 지역명 검색 (Geocoding)
      const location = await searchLocation(searchKeyword)

      if (location) {
        // 지역이 발견되면 지도 이동 + 해당 위치 기준 병원 로드
        setFlyToLocation(location)
        loadNearbyHospitals(location[0], location[1])
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
        toast.success(`'${searchKeyword}' 검색 결과 ${hospitals.length}개`, {
          icon: '🔍',
          duration: 2000,
        })
      }
    } finally {
      setIsSearching(false)
    }
  }, [searchKeyword, searchHospitals, searchLocation, searchLocationName, hospitals.length, loadNearbyHospitals])

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

  // 검색어 초기화
  const handleClearSearch = useCallback(() => {
    setSearchKeyword('')
    setSearchLocationName(null)
    setFlyToLocation(null)
    if (myLocation) {
      loadNearbyHospitals(myLocation[0], myLocation[1])
    }
  }, [myLocation, loadNearbyHospitals])

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 인터랙티브 지도 (RealMap) */}
      <RealMap
        hospitals={hospitals}
        selectedId={selectedHospitalId}
        onMarkerClick={handleMarkerClick}
        flyToLocation={flyToLocation}
      />

      {/* 🔄 로딩 칩 (지도 위) */}
      {isLoadingHospitals && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-black/80 text-white text-sm rounded-full flex items-center gap-2 shadow-lg"
        >
          <Loader2 className="w-4 h-4 animate-spin text-[#00FFC2]" />
          <span>주변 병원 탐색 중...</span>
        </motion.div>
      )}

      {/* 상단 검색바 (Floating) */}
      <div className="absolute top-4 left-0 right-0 z-10 px-4">
        <div className="max-w-[430px] mx-auto">
          <form onSubmit={handleSearchSubmit}>
            <div className="flex items-center gap-3 bg-white shadow-lg rounded-full px-4 py-3">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="홈으로"
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
                    onClick={handleClearSearch}
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
          {searchKeyword && (
            <div className="mb-4 text-sm text-gray-600">
              <span className="font-semibold text-gray-900">'{searchKeyword}'</span> 검색 결과 {hospitals.length}개
            </div>
          )}

          {/* 로딩 스켈레톤 */}
          {isLoadingHospitals ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-2xl p-5 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-20 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : hospitals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <MapPin className="w-12 h-12 mb-4" />
              <p className="text-lg font-semibold">주변 병원이 없습니다</p>
              <p className="text-sm mt-2">다른 지역을 검색해보세요</p>
            </div>
          ) : (
            /* 병원 리스트 아이템 */
            hospitals.map((pin) => {
              const mainEvent = pin.events.find((e: Event) => e.isMain) || pin.events[0]
              const otherEvents = pin.events.filter((e: Event) => !e.isMain)

              if (!mainEvent) return null

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
                        <span>{pin.distance > 0 ? `${pin.distance}m` : '거리 정보 없음'}</span>
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
                        if (pin.phone) {
                          window.location.href = `tel:${pin.phone}`
                        } else {
                          toast.error('전화번호가 등록되지 않았습니다')
                        }
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
            })
          )}
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
