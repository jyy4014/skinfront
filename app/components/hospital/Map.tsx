'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatPrice } from '@/lib/utils'

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
  discountRate: number // 예: 67
  isMain: boolean // true면 대표 시술
}

export interface HospitalData {
  id: number
  name: string
  location: [number, number] // [lat, lng]
  events: Event[] // 배열 형태 필수
  isHighlighted: boolean
  keywords: string[]
  distance: number
  rating: number
  reviewCount: number
  phone: string
}

interface MapProps {
  hospitals: HospitalData[]
  onMarkerClick?: (hospital: HospitalData) => void
  selectedHospitalId?: number | null
}

// 커스텀 마커 아이콘 생성
const createCustomIcon = (hospital: HospitalData, isSelected = false): L.DivIcon => {
  const minPrice = Math.min(...hospital.events.map((e) => e.eventPrice))

  const iconHtml = `
    <div class="relative">
      <div class="${isSelected ? 'bg-white text-black' : 'bg-[#00FFC2] text-black'} font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white whitespace-nowrap text-sm relative z-10">
        ${formatPrice(minPrice)}~
      </div>
      <div class="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 ${isSelected ? 'bg-white' : 'bg-[#00FFC2]'} rotate-45 border-r-2 border-b-2 border-white"></div>
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

// 지도 중심 조정 컴포넌트
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center, zoom])

  return null
}

export default function Map({ hospitals, onMarkerClick, selectedHospitalId }: MapProps) {
  // 서울 강남역 좌표
  const center: [number, number] = [37.498095, 127.027610]
  const zoom = 15

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={true}
        scrollWheelZoom={true}
        className="leaflet-container"
      >
        {/* CartoDB Dark Matter 타일 레이어 */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* 지도 중심 조정 */}
        <MapController center={center} zoom={zoom} />

        {/* 병원 마커 */}
        {hospitals.map((hospital) => (
          <Marker
            key={hospital.id}
            position={hospital.location}
            icon={createCustomIcon(hospital, hospital.id === selectedHospitalId)}
            eventHandlers={{
              click: () => {
                onMarkerClick?.(hospital)
              },
            }}
          />
        ))}
      </MapContainer>
    </div>
  )
}

