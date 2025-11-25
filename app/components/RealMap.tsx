'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { formatPrice } from '@/lib/utils'

// Leaflet 기본 아이콘 경로 설정 (SSR 이슈 해결)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
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
}

// 커스텀 마커 아이콘 생성 (민트색 말풍선 핀)
const createCustomIcon = (hospital: HospitalData): L.DivIcon => {
  // 최저가 계산
  const minPrice = Math.min(...hospital.events.map((e) => e.eventPrice))

  const iconHtml = `
    <div class="relative">
      <div class="bg-[#00FFC2] text-black font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white whitespace-nowrap text-sm relative z-10">
        ${formatPrice(minPrice)}~
      </div>
      <div class="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-[#00FFC2] rotate-45 border-r-2 border-b-2 border-white"></div>
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
const createCustomClusterIcon = (cluster: any): L.DivIcon => {
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
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center, zoom])

  return null
}

export default function RealMap({ hospitals, selectedId, onMarkerClick }: RealMapProps) {
  const mapRef = useRef<L.Map | null>(null)

  // 강남역 좌표
  const center: [number, number] = [37.4979, 127.0276]
  const zoom = 15

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={center}
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

        {/* 지도 중심 조정 */}
        <MapController center={center} zoom={zoom} />

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
              icon={createCustomIcon(hospital)}
              eventHandlers={{
                click: () => {
                  onMarkerClick?.(hospital)
                },
              }}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}

