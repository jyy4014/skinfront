'use client'

import Link from 'next/link'
import { TreatmentCandidate } from '@/app/types'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import { SkinRadarChart } from '@/app/components/analysis/RadarChart'

interface ResultViewProps {
  analysis: {
    skin_condition_scores: Record<string, number>
    confidence?: number
  }
  mapping: {
    treatment_candidates: TreatmentCandidate[]
  }
  nlg?: {
    headline?: string
    paragraphs?: string[]
  }
  preview?: string | null
  showHeatmap: boolean
  onToggleHeatmap: () => void
  resultId?: string
}

export default function ResultView({
  analysis,
  mapping,
  nlg,
  preview,
  showHeatmap,
  onToggleHeatmap,
  resultId,
}: ResultViewProps) {
  return (
    <div className="space-y-6">
      {/* 상단 요약 카드 - 피부 총점 및 현재 상태 */}
      {analysis.confidence && (
        <Card className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 text-white">
          <div className="text-center">
            <p className="text-sm text-pink-100 mb-2">AI 신뢰도</p>
            <p className="text-4xl font-bold mb-2">
              {Math.round(analysis.confidence * 100)}%
            </p>
            <p className="text-pink-100 text-sm">
              {analysis.confidence >= 0.7
                ? '현재 상태: 양호'
                : analysis.confidence >= 0.5
                  ? '현재 상태: 보통'
                  : '현재 상태: 개선 필요'}
            </p>
          </div>
        </Card>
      )}

      {/* NLG 결과 - 헤드라인 */}
      {nlg?.headline && (
        <Card className="p-5">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {nlg.headline}
          </h2>
          {nlg.paragraphs && (
            <div className="space-y-3">
              {nlg.paragraphs.map((paragraph, idx) => (
                <p key={idx} className="text-gray-700 text-sm leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-600 mt-4 italic leading-relaxed">
            오늘의 피부 컨디션을 AI가 세심하게 점검했어요. 당신의 피부는 변화할 수 있습니다.
          </p>
        </Card>
      )}

      {/* 세부 지표 카드 */}
      {analysis.skin_condition_scores && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            세부 지표
          </h3>
          
          {/* 레이더 차트 */}
          <div className="mb-6">
            <SkinRadarChart skinConditionScores={analysis.skin_condition_scores} />
          </div>
          
          <div className="grid grid-cols-2 gap-3" role="list" aria-label="피부 상태 세부 지표">
            {Object.entries(analysis.skin_condition_scores).map(
              ([key, value]) => {
                const labels: Record<string, { name: string; icon: string }> = {
                  pigmentation: { name: '색소', icon: '🎨' },
                  acne: { name: '여드름', icon: '🔴' },
                  redness: { name: '홍조', icon: '🌹' },
                  pores: { name: '모공', icon: '⚫' },
                  wrinkles: { name: '주름', icon: '📏' },
                }
                const label = labels[key] || { name: key, icon: '📊' }
                const percentage = Math.round(value * 100)
                const statusText = percentage >= 70 ? '약간 개선 필요' : percentage >= 40 ? '보통' : '양호'
                
                return (
                  <div
                    key={key}
                    className="bg-gray-50 rounded-xl p-4"
                    role="listitem"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl" aria-hidden="true">{label.icon}</span>
                      <span className="text-sm font-medium text-gray-900">{label.name}</span>
                    </div>
                    <div className="mb-2">
                      <p className="text-xs text-gray-700 mb-2 leading-relaxed" aria-label={`${label.name} ${percentage}퍼센트, 상태: ${statusText}`}>
                        {label.name} {percentage}% ({statusText})
                      </p>
                      <div 
                        className="w-full bg-gray-200 rounded-full h-2"
                        role="progressbar"
                        aria-valuenow={percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${label.name} ${percentage}퍼센트`}
                      >
                        <div
                          className={`h-2 rounded-full transition-all ${
                            percentage >= 70
                              ? 'bg-red-400'
                              : percentage >= 40
                                ? 'bg-yellow-400'
                                : 'bg-green-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              }
            )}
          </div>
        </Card>
      )}

      {/* 시각적 분석 - 히트맵 오버레이 */}
      {preview && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            시각적 분석
          </h3>
          <div className="relative rounded-xl overflow-hidden bg-gray-100" role="img" aria-label="피부 분석 이미지">
            <img
              src={preview}
              alt="피부 분석 이미지"
              className="w-full h-auto"
            />
            {showHeatmap && analysis.skin_condition_scores && (
              <div 
                className="absolute inset-0 pointer-events-none"
                aria-label="히트맵 오버레이: 색소, 모공, 여드름 영역 강조"
                role="img"
              >
                {analysis.skin_condition_scores.pigmentation > 0.5 && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/30 to-pink-500/40" aria-hidden="true" />
                )}
                {analysis.skin_condition_scores.pores > 0.5 && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/20 to-purple-500/30" aria-hidden="true" />
                )}
                {analysis.skin_condition_scores.acne > 0.5 && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/20 to-red-500/30" aria-hidden="true" />
                )}
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2 bg-gray-100 rounded-lg p-1" role="tablist" aria-label="이미지 보기 방식 선택">
            <button
              onClick={() => !showHeatmap && onToggleHeatmap()}
              role="tab"
              aria-selected={!showHeatmap}
              aria-controls="image-view"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                !showHeatmap
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              원본
            </button>
            <button
              onClick={() => showHeatmap && onToggleHeatmap()}
              role="tab"
              aria-selected={showHeatmap}
              aria-controls="image-view"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                showHeatmap
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              분석 결과
            </button>
          </div>
        </Card>
      )}

      {/* AI 추천 시술 리스트 - 증상 기반 추천 */}
      {mapping.treatment_candidates && mapping.treatment_candidates.length > 0 && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            당신의 피부 증상에 맞춘 추천
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            아래 시술은 현재 피부 상태 분석 결과를 바탕으로 추천되었습니다. (증상 기반 순위)
          </p>
          <div className="space-y-3" role="list" aria-label="추천 시술 목록">
            {mapping.treatment_candidates
              .sort((a, b) => (b.score || 0) - (a.score || 0))
              .map((treatment, idx) => (
                <Link
                  key={idx}
                  href={`/treatments/${treatment.id}`}
                  className="block border-2 border-gray-200 rounded-xl p-4 hover:border-pink-500 hover:shadow-md transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                  role="listitem"
                  aria-label={`${treatment.name}, 증상 적합도 ${Math.round((treatment.score || 0) * 100)}퍼센트, 예상 개선 ${Math.round((treatment.expected_improvement_pct || 0) * 100)}퍼센트${idx === 0 ? ', 최적 추천' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-base">
                          {treatment.name}
                        </h4>
                        {idx === 0 && (
                          <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-medium">
                            최적 추천
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500">증상 적합도:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[120px]">
                          <div
                            className="bg-pink-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${(treatment.score || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          {Math.round((treatment.score || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-pink-600 ml-2">
                      예상 개선 {Math.round((treatment.expected_improvement_pct || 0) * 100)}%
                    </span>
                  </div>
                  {treatment.notes && treatment.notes.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {treatment.notes.join(', ')}
                    </p>
                  )}
                </Link>
              ))}
          </div>
        </Card>
      )}

      {/* CTA 버튼 */}
      <div className="space-y-3">
        {resultId && (
          <Link href={`/analysis/${resultId}`} className="block">
            <Button className="w-full">
              자세히 보기
            </Button>
          </Link>
        )}
        <Link href="/home" className="block">
          <Button variant="outline" className="w-full">
            홈으로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  )
}

