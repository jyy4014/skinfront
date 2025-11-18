'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface AnalysisData {
  id: string
  created_at: string
  stage_a_vision_result?: {
    skin_condition_scores?: Record<string, number>
  }
  analysis_data?: {
    analysis_a?: {
      skin_condition_scores?: Record<string, number>
    }
  }
}

interface AnalysisTrendChartProps {
  analyses: AnalysisData[]
}

export function AnalysisTrendChart({ analyses }: AnalysisTrendChartProps) {
  const chartData = useMemo(() => {
    return analyses
      .map((analysis) => {
        // skin_condition_scores 추출
        const scores =
          analysis.stage_a_vision_result?.skin_condition_scores ||
          analysis.analysis_data?.analysis_a?.skin_condition_scores ||
          {}

        const date = new Date(analysis.created_at)
        const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`

        return {
          date: dateLabel,
          fullDate: date,
          pigmentation: Math.round((scores.pigmentation || 0) * 100),
          acne: Math.round((scores.acne || 0) * 100),
          redness: Math.round((scores.redness || 0) * 100),
          pores: Math.round((scores.pores || 0) * 100),
          wrinkles: Math.round((scores.wrinkles || 0) * 100),
        }
      })
      .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
  }, [analyses])

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        그래프를 표시할 데이터가 없습니다.
      </div>
    )
  }

  const conditionLabels: Record<string, string> = {
    pigmentation: '색소',
    acne: '여드름',
    redness: '홍조',
    pores: '모공',
    wrinkles: '주름',
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={12}
            tick={{ fill: '#6b7280' }}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tick={{ fill: '#6b7280' }}
            domain={[0, 100]}
            label={{ value: '점수 (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: number, name: string) => [
              `${value}%`,
              conditionLabels[name] || name,
            ]}
          />
          <Legend
            formatter={(value) => conditionLabels[value] || value}
            wrapperStyle={{ paddingTop: '20px' }}
          />
          <Line
            type="monotone"
            dataKey="pigmentation"
            stroke="#f472b6"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="pigmentation"
          />
          <Line
            type="monotone"
            dataKey="acne"
            stroke="#ec4899"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="acne"
          />
          <Line
            type="monotone"
            dataKey="redness"
            stroke="#f87171"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="redness"
          />
          <Line
            type="monotone"
            dataKey="pores"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="pores"
          />
          <Line
            type="monotone"
            dataKey="wrinkles"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="wrinkles"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

