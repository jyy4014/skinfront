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

// 커스텀 마커 아이콘 생성 (민트색 말풍선 핀)
const createCustomIcon = (hospital: HospitalData, isSelected = false): L.DivIcon => {
  // 최저가 계산
  const minPrice = Math.min(...hospital.events.map((e) => e.eventPrice))

  const iconHtml = `
    <div class="relative">
      <div class="${
        isSelected ? 'bg-white text-black' : 'bg-[#00FFC2] text-black'
      } font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white whitespace-nowrap text-sm relative z-10">
        ${formatPrice(minPrice)}~
      </div>
      <div class="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 ${
        isSelected ? 'bg-white' : 'bg-[#00FFC2]'
      } rotate-45 border-r-2 border-b-2 border-white"></div>
    </div>
  `

  return L.divIcon({
    html: iconHtml,
    className: 'custom-price-marker',
    iconSize: [80, 40],
    iconAnchor: [40, 40],
    popupAnchor: [0, -40],
  })
}

// 커스텀 클러스터 아이콘 생성 함수
const createCustomClusterIcon = (cluster: L.MarkerCluster): L.DivIcon => {
  const count = cluster.getChildCount()
  const size = count < 10 ? 40 : count < 100 ? 50 : 60

  const iconHtml = `
    <div class="custom-cluster-icon" style="width: ${size}px; height: ${size}px; background-color: #121212; border: 2px solid #00FFC2; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3), 0 10px 15px rgba(0, 0, 0, 0.2);">
      <span style="color: #00FFC2; font-weight: bold; font-size: ${size < 50 ? '14px' : '16px'};">
        ${count}
      </span>
    </div>
  `

  return L.divIcon({
    html: iconHtml,
    className: 'custom-cluster-icon-wrapper',
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
        zoomControl={false}
        scrollWheelZoom={true}
        className="leaflet-container"
      >
        {/* Standard OpenStreetMap 타일 레이어 (필터로 다크 모드 변환) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          subdomains="abc"
          maxZoom={19}
          className="map-tiles"
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

      {/* 🎯 내 위치로 이동 버튼 (우측 하단) */}
      <button
        onClick={getCurrentLocation}
        disabled={isLocating}
        className={`absolute bottom-[42%] right-4 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center transition-all hover:bg-gray-50 active:scale-95 ${
          isLocating ? 'opacity-70' : ''
        }`}
        aria-label="내 위치로 이동"
        title={locationError || '내 위치로 이동'}
      >
        {isLocating ? (
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        ) : (
          <Crosshair className={`w-5 h-5 ${myLocation ? 'text-blue-500' : 'text-gray-500'}`} />
        )}
      </button>
    </div>
  )
}

