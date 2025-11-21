'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { designTokens } from '@/app/styles/design-tokens'
import { normalizeSkinScores } from '@/app/lib/utils/skinScores'

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
  const normalizedScores = normalizeSkinScores(skinConditionScores)

  const data = [
    {
      name: '색소',
      value: Math.round((normalizedScores.pigmentation || 0) * 100),
      fullMark: 100,
    },
    {
      name: '여드름',
      value: Math.round((normalizedScores.acne || 0) * 100),
      fullMark: 100,
    },
    {
      name: '홍조',
      value: Math.round((normalizedScores.redness || 0) * 100),
      fullMark: 100,
    },
    {
      name: '모공',
      value: Math.round((normalizedScores.pores || 0) * 100),
      fullMark: 100,
    },
    {
      name: '주름',
      value: Math.round((normalizedScores.wrinkles || 0) * 100),
      fullMark: 100,
    },
  ]

  return (
    <div className={className} role="img" aria-label="피부 상태 레이더 차트">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--color-gray-200)" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: 'var(--color-text-primary)', fontSize: 12, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'var(--color-text-tertiary)', fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name="피부 상태"
            dataKey="value"
            stroke="var(--color-primary-500)"
            fill="var(--color-primary-500)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

