'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { formatPrice } from '@/lib/utils'
import { Crosshair, Loader2 } from 'lucide-react'

// Leaflet 기본 아이콘 경로 설정 (SSR 이슈 해결)
type LeafletIconPrototype = L.Icon.Default & {
  _getIconUrl?: () => string
}

if (typeof window !== 'undefined') {
  const iconPrototype = L.Icon.Default.prototype as LeafletIconPrototype
  delete iconPrototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

export interface Event {
  name: string
  originalPrice: number
  eventPrice: number
  discountRate: number
  isMain: boolean
}

export interface HospitalData {
  id: number
  name: string
  location: [number, number] // [lat, lng]
  events: Event[]
  isHighlighted: boolean
  keywords: string[]
  distance: number
  rating: number
  reviewCount: number
  phone: string
}

interface RealMapProps {
  hospitals: HospitalData[]
  selectedId?: number | null
  onMarkerClick?: (hospital: HospitalData) => void
  // 🗺️ 위치 기반 기능
  flyToLocation?: [number, number] | null // 검색 결과 위치로 이동
  onMapReady?: (map: L.Map) => void
}

// 커스텀 마커 아이콘 생성 (네온 민트색 빛나는 핀)
const createCustomIcon = (hospital: HospitalData, isSelected = false): L.DivIcon => {
  // 최저가 계산
  const minPrice = Math.min(...hospital.events.map((e) => e.eventPrice))

  const iconHtml = `
    <div class="relative animate-pulse">
      <!-- 빛 번짐 효과 -->
      <div class="absolute inset-0 bg-[#00FFC2] rounded-full blur-md opacity-60 scale-150"></div>

      <!-- 메인 마커 -->
      <div class="relative bg-gradient-to-br from-[#00FFC2] to-[#00E6B0] text-black font-bold px-3 py-2 rounded-full shadow-2xl border-2 border-white/20 whitespace-nowrap text-sm backdrop-blur-sm">
        <div class="flex items-center gap-1">
          <span class="text-xs opacity-80">₩</span>
          <span>${formatPrice(minPrice)}</span>
        </div>
      </div>

      <!-- 빛나는 테두리 효과 -->
      <div class="absolute inset-0 bg-[#00FFC2] rounded-full animate-ping opacity-20"></div>

      <!-- 핀 부분 -->
      <div class="absolute left-1/2 -translate-x-1/2 -bottom-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#00FFC2] drop-shadow-lg"></div>
    </div>
  `

  return L.divIcon({
    html: iconHtml,
    className: 'neon-price-marker',
    iconSize: [100, 60],
    iconAnchor: [50, 55],
    popupAnchor: [0, -55],
  })
}

// 커스텀 클러스터 아이콘 생성 함수 (네온 효과)
const createCustomClusterIcon = (cluster: any): L.DivIcon => {
  const count = cluster.getChildCount()
  const size = count < 10 ? 45 : count < 100 ? 55 : 65

  const iconHtml = `
    <div class="relative animate-pulse">
      <!-- 빛 번짐 효과 -->
      <div class="absolute inset-0 bg-[#00FFC2] rounded-full blur-lg opacity-30 scale-125"></div>

      <!-- 메인 클러스터 -->
      <div class="relative bg-gradient-to-br from-[#121212] to-[#1A2333] border-2 border-[#00FFC2] rounded-full flex items-center justify-content-center shadow-2xl backdrop-blur-sm"
           style="width: ${size}px; height: ${size}px; box-shadow: 0 0 20px rgba(0, 255, 194, 0.5), 0 4px 6px rgba(0, 0, 0, 0.3);">
        <span class="text-[#00FFC2] font-bold drop-shadow-lg"
              style="font-size: ${size < 50 ? '16px' : '18px'}; text-shadow: 0 0 10px rgba(0, 255, 194, 0.8);">
          ${count}
        </span>
      </div>

      <!-- 빛나는 링 효과 -->
      <div class="absolute inset-0 border-2 border-[#00FFC2] rounded-full animate-ping opacity-20"></div>
    </div>
  `

  return L.divIcon({
    html: iconHtml,
    className: 'neon-cluster-icon-wrapper',
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  })
}

// 지도 중심 조정 컴포넌트
function MapController({ 
  center, 
  zoom,
  flyToLocation,
  onMapReady
}: { 
  center: [number, number]
  zoom: number
  flyToLocation?: [number, number] | null
  onMapReady?: (map: L.Map) => void
}) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, zoom)
    onMapReady?.(map)
  }, [map, center, zoom, onMapReady])

  // flyToLocation이 변경되면 해당 위치로 부드럽게 이동
  useEffect(() => {
    if (flyToLocation) {
      map.flyTo(flyToLocation, 15, {
        duration: 1.5,
        easeLinearity: 0.25
      })
    }
  }, [map, flyToLocation])

  return null
}

// 내 위치 파란색 점 마커 (Pulse Effect)
function MyLocationMarker({ position }: { position: [number, number] | null }) {
  if (!position) return null

  return (
    <>
      {/* 외부 펄스 원 */}
      <Circle
        center={position}
        radius={50}
        pathOptions={{
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.2,
          weight: 0,
        }}
        className="animate-pulse"
      />
      {/* 내부 점 */}
      <Circle
        center={position}
        radius={12}
        pathOptions={{
          color: '#FFFFFF',
          fillColor: '#3B82F6',
          fillOpacity: 1,
          weight: 3,
        }}
      />
    </>
  )
}

export default function RealMap({ hospitals, selectedId, onMarkerClick, flyToLocation, onMapReady }: RealMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  
  // 🗺️ 내 위치 상태
  const [myLocation, setMyLocation] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // 강남역 좌표 (기본값)
  const defaultCenter: [number, number] = [37.4979, 127.0276]
const center = myLocation || defaultCenter
  const zoom = 15

  // GPS 위치 가져오기 함수
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('이 브라우저에서는 위치 서비스를 지원하지 않습니다.')
      return
    }

    setIsLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newLocation: [number, number] = [latitude, longitude]
        setMyLocation(newLocation)
        setIsLocating(false)

        // 지도를 내 위치로 이동
        if (mapRef.current) {
          mapRef.current.flyTo(newLocation, 16, {
            duration: 1.5,
            easeLinearity: 0.25
          })
        }
      },
      (error) => {
        setIsLocating(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('위치 권한이 거부되었습니다.')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('위치 정보를 사용할 수 없습니다.')
            break
          case error.TIMEOUT:
            setLocationError('위치 요청 시간이 초과되었습니다.')
            break
          default:
            setLocationError('알 수 없는 오류가 발생했습니다.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    )
  }, [])

  // 컴포넌트 마운트 시 위치 자동 감지
  useEffect(() => {
    getCurrentLocation()
  }, [getCurrentLocation])

  // 지도 인스턴스 저장
  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map
    onMapReady?.(map)
  }, [onMapReady])

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={true}
        scrollWheelZoom={true}
        className="leaflet-container"
      >
        {/* 다크 모드 지도 타일 레이어 */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a> contributors'
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
          subdomains="abcd"
          maxZoom={19}
          className="dark-map-tiles"
        />

        {/* 지도 중심 조정 및 flyTo 핸들링 */}
        <MapController 
          center={center} 
          zoom={zoom}
          flyToLocation={flyToLocation}
          onMapReady={handleMapReady}
        />

        {/* 🔵 내 위치 마커 (파란색 점 + 펄스) */}
        <MyLocationMarker position={myLocation} />

        {/* 병원 마커 클러스터 그룹 */}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createCustomClusterIcon}
          spiderfyOnMaxZoom={true}
          zoomToBoundsOnClick={true}
          maxClusterRadius={80}
        >
          {hospitals.map((hospital) => (
            <Marker
              key={hospital.id}
              position={hospital.location}
              icon={createCustomIcon(hospital, hospital.id === selectedId)}
              eventHandlers={{
                click: () => {
                  onMarkerClick?.(hospital)
                },
              }}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* 🎯 내 위치로 이동 버튼 (네온 스타일) */}
      <button
        onClick={getCurrentLocation}
        disabled={isLocating}
        className={`absolute bottom-[42%] right-4 z-20 w-14 h-14 bg-[#121212]/80 backdrop-blur-xl border border-[#00FFC2]/30 rounded-full shadow-2xl flex items-center justify-center transition-all hover:bg-[#1A2333]/90 hover:border-[#00FFC2]/50 hover:shadow-[0_0_20px_rgba(0,255,194,0.3)] active:scale-95 ${
          isLocating ? 'opacity-70' : ''
        }`}
        aria-label="내 위치로 이동"
        title={locationError || '내 위치로 이동'}
      >
        {isLocating ? (
          <Loader2 className="w-6 h-6 text-[#00FFC2] animate-spin drop-shadow-[0_0_8px_rgba(0,255,194,0.6)]" />
        ) : (
          <Crosshair className={`w-6 h-6 drop-shadow-[0_0_8px_rgba(0,255,194,0.6)] ${
            myLocation ? 'text-[#00FFC2]' : 'text-gray-400'
          }`} />
        )}
      </button>
    </div>
  )
}

