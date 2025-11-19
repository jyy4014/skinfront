'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

interface RadarChartProps {
  skinConditionScores: {
    pigmentation?: number
    acne?: number
    redness?: number
    pores?: number
    wrinkles?: number
  } | Record<string, number>
  className?: string
}

const labels: Record<string, string> = {
  pigmentation: '색소',
  acne: '여드름',
  redness: '홍조',
  pores: '모공',
  wrinkles: '주름',
}

export function SkinRadarChart({ skinConditionScores, className }: RadarChartProps) {
  // Record<string, number> 타입을 처리하기 위해 안전하게 접근
  const getScore = (key: string): number => {
    const score = (skinConditionScores as Record<string, number>)[key]
    return typeof score === 'number' ? score : 0
  }

  const data = [
    {
      name: '색소',
      value: Math.round(getScore('pigmentation') * 100),
      fullMark: 100,
    },
    {
      name: '여드름',
      value: Math.round(getScore('acne') * 100),
      fullMark: 100,
    },
    {
      name: '홍조',
      value: Math.round(getScore('redness') * 100),
      fullMark: 100,
    },
    {
      name: '모공',
      value: Math.round(getScore('pores') * 100),
      fullMark: 100,
    },
    {
      name: '주름',
      value: Math.round(getScore('wrinkles') * 100),
      fullMark: 100,
    },
  ]

  return (
    <div className={className} role="img" aria-label="피부 상태 레이더 차트">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name="피부 상태"
            dataKey="value"
            stroke="#ec4899"
            fill="#ec4899"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

