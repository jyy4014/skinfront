'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Treatment {
  id: string
  name: string
  description: string
}

export default function RecommendedTreatments() {
  const supabase = createClient()
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTreatments()
  }, [])

  const fetchTreatments = async () => {
    try {
      const { data, error } = await supabase
        .from('treatments')
        .select('id, name, description')
        .limit(3)

      if (error) throw error

      if (data && data.length > 0) {
        setTreatments(data as Treatment[])
      } else {
        // 샘플 데이터
        setTreatments([
          { id: '1', name: '프락셀 레이저', description: '모공 및 잡티 개선' },
          { id: '2', name: '토닝 레이저', description: '피부톤 균일화' },
          { id: '3', name: '리쥬란 힐러', description: '주름 개선 및 탄력 향상' },
        ])
      }
    } catch (error) {
      console.error('Error fetching treatments:', error)
      // 샘플 데이터
      setTreatments([
        { id: '1', name: '프락셀 레이저', description: '모공 및 잡티 개선' },
        { id: '2', name: '토닝 레이저', description: '피부톤 균일화' },
        { id: '3', name: '리쥬란 힐러', description: '주름 개선 및 탄력 향상' },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border-2 border-gray-200 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {treatments.map((treatment) => (
        <Link
          key={treatment.id}
          href={`/treatments/${treatment.id}`}
          className="p-4 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:shadow-md transition-all"
        >
          <h4 className="font-semibold text-gray-900 mb-1">{treatment.name}</h4>
          <p className="text-sm text-gray-600">
            {treatment.description || '피부 개선에 도움이 됩니다'}
          </p>
        </Link>
      ))}
    </div>
  )
}

