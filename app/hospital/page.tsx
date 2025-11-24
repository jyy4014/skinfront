'use client'

import { ArrowLeft, Search, Phone, Calendar, MapPin, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function HospitalPage() {
  const router = useRouter()

  // 가격 핀 데이터
  const pricePins = [
    { id: 1, price: '8.9만', x: 50, y: 45, isHighlighted: true }, // 중앙, 민트색 강조
    { id: 2, price: '9.5만', x: 35, y: 50, isHighlighted: false },
    { id: 3, price: '11만', x: 65, y: 55, isHighlighted: false },
  ]

  return (
    <div className="relative h-screen overflow-hidden">
      {/* 배경 패턴 (Failsafe - 이미지가 없어도 도로 지도처럼 보임) */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: '#212121',
          backgroundImage: `
            linear-gradient(#333 2px, transparent 2px),
            linear-gradient(90deg, #333 2px, transparent 2px),
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
          backgroundPosition: '-2px -2px, -2px -2px, -1px -1px, -1px -1px',
        }}
      />
      
      {/* 배경 지도 이미지 (Overlay) */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-overlay"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1000&auto=format&fit=crop)',
          filter: 'grayscale(50%)',
        }}
      />
      
      {/* 가독성 확보를 위한 오버레이 */}
      <div className="absolute inset-0 bg-black/20" />

      {/* 상단 검색바 (Floating) */}
      <div className="absolute top-4 left-0 right-0 z-20 px-4">
        <div className="max-w-[430px] mx-auto">
          <div className="flex items-center gap-3 bg-white shadow-lg rounded-full px-4 py-3">
            <button
              onClick={() => router.back()}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex-1 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <span className="text-gray-800 text-sm font-medium">
                강남구 역삼동 · <span className="font-semibold">피코토닝</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 가격 말풍선 핀 */}
      {pricePins.map((pin) => (
        <motion.div
          key={pin.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: pin.id * 0.1 }}
          className={`absolute ${pin.isHighlighted ? 'z-30' : 'z-20'}`}
          style={{
            left: `${pin.x}%`,
            top: `${pin.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* 핀 아이콘 */}
          <div className="relative">
            <MapPin
              className={`w-8 h-8 ${
                pin.isHighlighted ? 'text-[#00FFC2]' : 'text-gray-600'
              }`}
              fill={pin.isHighlighted ? '#00FFC2' : '#ffffff'}
              style={{
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5)) drop-shadow(0 10px 15px rgba(0, 0, 0, 0.3))',
              }}
            />
            
            {/* 말풍선 */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: pin.id * 0.1 + 0.2 }}
              className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-4 py-2 rounded-full ${
                pin.isHighlighted
                  ? 'bg-[#00FFC2] text-black'
                  : 'bg-white text-gray-900'
              } text-sm font-bold whitespace-nowrap`}
              style={{
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5)) drop-shadow(0 10px 15px rgba(0, 0, 0, 0.3))',
              }}
            >
              {pin.price}
              {/* 말풍선 꼬리 */}
              <div
                className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 ${
                  pin.isHighlighted ? 'bg-[#00FFC2]' : 'bg-white'
                }`}
              />
            </motion.div>
          </div>
        </motion.div>
      ))}

      {/* 하단 병원 리스트 (Bottom Sheet) */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: '35%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-2xl max-w-[430px] mx-auto"
        style={{ height: '65%' }}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 내용 */}
        <div className="px-4 pb-6 overflow-y-auto h-full">
          {/* 병원 리스트 아이템 */}
          <div className="bg-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-sm">
            {/* 병원명 */}
            <h3 className="text-xl font-bold text-gray-900 mb-3">미래 의원 강남점</h3>

            {/* 정보 (거리/평점) */}
            <div className="flex items-center gap-3 mb-4 text-gray-600 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>300m</span>
              </div>
              <span>|</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-gray-900">4.9</span>
                <span className="text-gray-500">(124 reviews)</span>
              </div>
            </div>

            {/* 가격 (할인가 강조) */}
            <div className="mb-5">
              <span className="text-3xl font-bold text-[#00FFC2]">89,000원</span>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // 전화하기 기능
                  window.location.href = 'tel:02-1234-5678'
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Phone className="w-4 h-4" />
                전화하기
              </button>
              <button
                onClick={() => {
                  // 예약하기 기능
                  alert('예약 페이지로 이동합니다.')
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#00FFC2] text-black font-bold rounded-xl hover:bg-[#00E6B8] transition-colors shadow-md"
              >
                <Calendar className="w-4 h-4" />
                예약하기
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

