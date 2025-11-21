'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TreatmentCandidate } from '@/app/types'
import Card from '@/app/components/ui/Card'
import Button from '@/app/components/ui/Button'
import { SkinRadarChart } from '@/app/components/analysis/RadarChart'
import {
  normalizeScoreValue,
  normalizeSkinScores,
} from '@/app/lib/utils/skinScores'

interface ResultViewProps {
  analysis: {
    skin_condition_scores: Record<string, unknown>
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
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.5)
  const skinScores = normalizeSkinScores(analysis.skin_condition_scores)
  const normalizeFraction = (value: unknown, fallback = 0) => {
    const normalized = normalizeScoreValue(value)
    if (normalized === null) {
      return fallback
    }
    return normalized
  }

  const clampPercent = (value: number) =>
    Math.min(100, Math.max(0, Math.round(value)))
  
  return (
    <div className="space-y-6">
      {/* 상단 요약 카드 - 피부 총점 및 현재 상태 */}
      {analysis.confidence && (() => {
        const confidencePercent = Math.round(analysis.confidence * 100)
        const status = analysis.confidence >= 0.7 ? '양호' : analysis.confidence >= 0.5 ? '보통' : '개선 필요'
        const statusColor = analysis.confidence >= 0.7 ? 'success' : analysis.confidence >= 0.5 ? 'warning' : 'danger'
        
        return (
          <Card className="p-6" style={{ backgroundImage: 'var(--gradient-primary)' }}>
            <div className="text-center text-[color:var(--color-on-primary)]">
              <p className="text-sm opacity-90 mb-2">AI 신뢰도</p>
              <p className="text-4xl font-bold mb-2">
                {confidencePercent}%
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  statusColor === 'success' 
                    ? 'bg-[color:var(--color-success-500)]/20 text-[color:var(--color-success-200)]'
                    : statusColor === 'warning'
                    ? 'bg-[color:var(--color-warning-500)]/20 text-[color:var(--color-warning-200)]'
                    : 'bg-[color:var(--color-danger-500)]/20 text-[color:var(--color-danger-200)]'
                }`}>
                  {status}
                </span>
              </div>
            </div>
          </Card>
        )
      })()}

      {/* NLG 결과 - 헤드라인 */}
      {nlg?.headline && (
        <Card className="p-5">
          <h2 className={`text-xl font-bold text-[color:var(--color-text-primary)] mb-3`}>
            {nlg.headline}
          </h2>
          {nlg.paragraphs && (
            <div className="space-y-3">
              {nlg.paragraphs.map((paragraph, idx) => (
                <p key={idx} className={`text-[color:var(--color-text-secondary)] text-sm leading-relaxed`}>
                  {paragraph}
                </p>
              ))}
            </div>
          )}
          <p className={`text-sm text-[color:var(--color-text-tertiary)] mt-4 italic leading-relaxed`}>
            오늘의 피부 컨디션을 AI가 세심하게 점검했어요. 당신의 피부는 변화할 수 있습니다.
          </p>
        </Card>
      )}

      {/* 세부 지표 카드 */}
      {Object.keys(skinScores).length > 0 && (
        <Card className="p-5">
          <h3 className={`text-lg font-semibold text-[color:var(--color-text-primary)] mb-4`}>
            세부 지표
          </h3>
          
          {/* 레이더 차트 */}
          <div className="mb-6">
            <SkinRadarChart skinConditionScores={skinScores} />
          </div>
          
          <div className="grid grid-cols-2 gap-3" role="list" aria-label="피부 상태 세부 지표">
            {Object.entries(skinScores).map(
              ([key, value]) => {
                const labels: Record<string, { name: string; icon: string }> = {
                  pigmentation: { name: '색소', icon: '🎨' },
                  acne: { name: '여드름', icon: '🔴' },
                  redness: { name: '홍조', icon: '🌹' },
                  pores: { name: '모공', icon: '⚫' },
                  wrinkles: { name: '주름', icon: '📏' },
                }
                const label = labels[key] || { name: key, icon: '📊' }
                const safeValue = Number.isFinite(value) ? value : 0
                const percentage = Math.max(0, Math.min(100, Math.round(safeValue * 100)))
                const getStatusInfo = (pct: number) => {
                  if (pct >= 70) return { text: '주의 필요', color: 'danger', badge: 'bg-[color:var(--color-danger-500)]' }
                  if (pct >= 40) return { text: '개선 필요', color: 'warning', badge: 'bg-[color:var(--color-warning-500)]' }
                  if (pct >= 20) return { text: '보통', color: 'warning', badge: 'bg-[color:var(--color-warning-500)]' }
                  return { text: '양호', color: 'success', badge: 'bg-[color:var(--color-success-500)]' }
                }
                const statusInfo = getStatusInfo(percentage)
                
                return (
                  <div
                    key={key}
                    className="bg-[color:var(--color-surface-muted)] rounded-[var(--radius-xl)] p-4 border border-[color:var(--color-border-subtle)]"
                    role="listitem"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl" aria-hidden="true">{label.icon}</span>
                        <span className={`text-sm font-medium text-[color:var(--color-text-primary)]`}>{label.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        statusInfo.color === 'danger'
                          ? 'bg-[color:var(--color-danger-500)]/10 text-[color:var(--color-danger-600)]'
                          : statusInfo.color === 'warning'
                          ? 'bg-[color:var(--color-warning-500)]/10 text-[color:var(--color-warning-600)]'
                          : 'bg-[color:var(--color-success-500)]/10 text-[color:var(--color-success-600)]'
                      }`}>
                        {statusInfo.text}
                      </span>
                    </div>
                    <div className="mb-2">
                      <p className={`text-xs mb-2 leading-relaxed text-[color:var(--color-text-secondary)]`} aria-label={`${label.name} ${percentage}퍼센트, 상태: ${statusInfo.text}`}>
                        {percentage}%
                      </p>
                      <div 
                        className={`w-full bg-[color:var(--color-gray-200)] rounded-full h-2`}
                        role="progressbar"
                        aria-valuenow={percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${label.name} ${percentage}퍼센트`}
                      >
                        <div
                          className={`h-2 rounded-full transition-all ${statusInfo.badge}`}
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
            <h3 className={`text-lg font-semibold text-[color:var(--color-text-primary)] mb-4`}>
              시각적 분석
            </h3>
            <div className={`relative rounded-[var(--radius-xl)] overflow-hidden bg-[color:var(--color-gray-100)]`} role="img" aria-label="피부 분석 이미지">
              <img
                src={preview}
                alt="피부 분석 이미지"
                className="w-full h-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.image-placeholder')) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'image-placeholder flex items-center justify-center h-48 text-gray-400';
                    placeholder.textContent = '이미지를 불러올 수 없습니다';
                    parent.appendChild(placeholder);
                  }
                }}
                loading="lazy"
              />
      {showHeatmap && Object.keys(skinScores).length > 0 && (
                <div 
                  className="absolute inset-0 pointer-events-none"
                  aria-label="히트맵 오버레이: 색소, 모공, 여드름 영역 강조"
                  role="img"
                  style={{ opacity: heatmapOpacity }}
                >
                  {skinScores.pigmentation > 0.5 && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[color:var(--color-primary-500)]/30 to-[color:var(--color-primary-500)]/40" aria-hidden="true" />
                  )}
                  {skinScores.pores > 0.5 && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[color:var(--color-accent-500)]/20 to-[color:var(--color-accent-500)]/30" aria-hidden="true" />
                  )}
                  {skinScores.acne > 0.5 && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[color:var(--color-danger-500)]/20 to-[color:var(--color-danger-500)]/30" aria-hidden="true" />
                  )}
                </div>
              )}
            </div>
            {showHeatmap && (
              <div className="mt-4 space-y-2">
                <label className={`block text-xs text-[color:var(--color-text-secondary)]`}>
                  오버레이 투명도: {Math.round(heatmapOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={heatmapOpacity}
                  onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[color:var(--color-gray-200)] rounded-lg appearance-none cursor-pointer accent-[color:var(--color-primary-500)]"
                  aria-label="히트맵 오버레이 투명도 조절"
                />
              </div>
            )}
            <div className={`mt-4 flex gap-2 bg-[color:var(--color-gray-100)] rounded-[var(--radius-lg)] p-1`} role="tablist" aria-label="이미지 보기 방식 선택">
              <button
                onClick={() => !showHeatmap && onToggleHeatmap()}
                role="tab"
                aria-selected={!showHeatmap}
                aria-controls="image-view"
                className={`flex-1 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-500)] focus:ring-offset-2 ${
                  !showHeatmap
                    ? 'bg-[color:var(--color-surface-elevated)] text-[color:var(--color-text-primary)] shadow-[var(--shadow-soft)]'
                    : 'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]'
                }`}
              >
                원본
              </button>
              <button
                onClick={() => showHeatmap && onToggleHeatmap()}
                role="tab"
                aria-selected={showHeatmap}
                aria-controls="image-view"
                className={`flex-1 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-500)] focus:ring-offset-2 ${
                  showHeatmap
                    ? 'bg-[color:var(--color-surface-elevated)] text-[color:var(--color-text-primary)] shadow-[var(--shadow-soft)]'
                    : 'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]'
                }`}
              >
                분석 결과
              </button>
            </div>
          </Card>
        )
      }

      {/* AI 추천 시술 리스트 - 증상 기반 추천 */}
      {mapping.treatment_candidates && mapping.treatment_candidates.length > 0 && (
        <Card className="p-5">
          <h3 className={`text-lg font-semibold text-[color:var(--color-text-primary)] mb-2`}>
            당신의 피부 증상에 맞춘 추천
          </h3>
          <p className={`text-xs text-[color:var(--color-text-tertiary)] mb-4`}>
            아래 시술은 현재 피부 상태 분석 결과를 바탕으로 추천되었습니다. (증상 기반 순위)
          </p>
          <div className="space-y-3" role="list" aria-label="추천 시술 목록">
            {mapping.treatment_candidates
              .map((candidate) => {
                const normalizedScore = normalizeFraction(candidate.score)
                const scorePercent = clampPercent(normalizedScore * 100)
                const improvementFraction = normalizeFraction(
                  candidate.expected_improvement_pct
                )
                const improvementPercent = Number.isFinite(
                  improvementFraction
                )
                  ? clampPercent(improvementFraction * 100)
                  : null
                const costRange = candidate.cost_range
                  ? {
                      min:
                        typeof candidate.cost_range.min === 'number'
                          ? candidate.cost_range.min
                          : Number(candidate.cost_range.min) || null,
                      max:
                        typeof candidate.cost_range.max === 'number'
                          ? candidate.cost_range.max
                          : Number(candidate.cost_range.max) || null,
                      currency: candidate.cost_range.currency || 'KRW',
                    }
                  : null

                return {
                  ...candidate,
                  normalizedScore,
                  scorePercent,
                  improvementPercent,
                  costRange,
                }
              })
              .sort((a, b) => b.normalizedScore - a.normalizedScore)
              .map((treatment, idx) => (
                <Link
                  key={idx}
                  href={`/treatments/${treatment.id}`}
                  className={`block border-2 border-[color:var(--color-border-strong)] rounded-[var(--radius-xl)] p-4 hover:border-[color:var(--color-primary-500)] hover:shadow-[var(--shadow-soft)] transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-500)] focus:ring-offset-2`}
                  role="listitem"
                  aria-label={`${treatment.name}, 증상 적합도 ${treatment.scorePercent}퍼센트, 예상 개선 ${
                    treatment.improvementPercent ?? '--'
                  }퍼센트${idx === 0 ? ', 최적 추천' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className={`font-semibold text-[color:var(--color-text-primary)] text-base`}>
                          {treatment.name}
                        </h4>
                        {idx === 0 && (
                          <span className={`text-xs bg-[color:var(--color-primary-50)] text-[color:var(--color-primary-700)] px-2 py-0.5 rounded-full font-medium`}>
                            최적 추천
                          </span>
                        )}
                        {treatment.latest_technology && (
                          <span className={`text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-2 py-0.5 rounded-full font-medium border border-purple-200`}>
                            ✨ 최신 기술
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs text-[color:var(--color-text-secondary)]`}>증상 적합도:</span>
                        <div className={`flex-1 bg-[color:var(--color-gray-200)] rounded-full h-1.5 max-w-[120px]`}>
                          <div
                            className={`bg-[color:var(--color-primary-500)] h-1.5 rounded-full transition-all`}
                            style={{ width: `${treatment.scorePercent}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium text-[color:var(--color-text-primary)]`}>
                          {treatment.scorePercent}%
                        </span>
                      </div>
                    </div>
                    <span className={`text-sm font-medium text-[color:var(--color-primary-600)] ml-2 whitespace-nowrap`}>
                      예상 개선{' '}
                      {treatment.improvementPercent !== null
                        ? `${treatment.improvementPercent}%`
                        : '--'}
                    </span>
                  </div>

                  {/* AI 기반 추가 정보 */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {treatment.costRange && (
                      <div className={`bg-[color:var(--color-surface-muted)] rounded-lg p-2.5 border border-[color:var(--color-border-subtle)]`}>
                        <p className={`text-xs text-[color:var(--color-text-tertiary)] mb-1`}>예상 비용</p>
                        <p className={`text-sm font-semibold text-[color:var(--color-text-primary)]`}>
                          {treatment.costRange.min !== null &&
                          treatment.costRange.max !== null
                            ? `₩${treatment.costRange.min.toLocaleString()} ~ ₩${treatment.costRange.max.toLocaleString()}`
                            : '상담 후 결정'}
                        </p>
                      </div>
                    )}
                    {treatment.frequency && (
                      <div className={`bg-[color:var(--color-surface-muted)] rounded-lg p-2.5 border border-[color:var(--color-border-subtle)]`}>
                        <p className={`text-xs text-[color:var(--color-text-tertiary)] mb-1`}>시술 빈도</p>
                        <p className={`text-sm font-semibold text-[color:var(--color-text-primary)]`}>
                          {treatment.frequency}
                        </p>
                      </div>
                    )}
                    {treatment.treatment_cycle && (
                      <div className={`bg-[color:var(--color-surface-muted)] rounded-lg p-2.5 border border-[color:var(--color-border-subtle)] col-span-2`}>
                        <p className={`text-xs text-[color:var(--color-text-tertiary)] mb-1`}>치료 사이클</p>
                        <p className={`text-sm font-semibold text-[color:var(--color-text-primary)]`}>
                          {treatment.treatment_cycle}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 추천 이유 및 임상 근거 */}
                  {treatment.notes && treatment.notes.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <p className={`text-xs font-semibold text-[color:var(--color-text-secondary)]`}>
                        추천 이유:
                      </p>
                      <ul className="text-sm text-[color:var(--color-text-secondary)] space-y-1">
                        {treatment.notes.map((note, noteIdx) => (
                          <li key={noteIdx} className="flex items-start gap-2">
                            <span className={`text-[color:var(--color-primary-500)] mt-0.5`}>•</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {treatment.clinical_evidence && (
                    <div className={`mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg`}>
                      <p className={`text-xs font-semibold text-blue-800 mb-1`}>
                        📚 임상 근거
                      </p>
                      <p className={`text-xs text-blue-700 leading-relaxed`}>
                        {treatment.clinical_evidence}
                      </p>
                    </div>
                  )}
                </Link>
              ))}
          </div>
        </Card>
      )}

      {/* 법적 고려 문구 */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <p className="text-xs text-yellow-800 leading-relaxed mb-2">
          <strong>⚠️ 참고용 안내</strong>
        </p>
        <p className="text-xs text-yellow-700 leading-relaxed">
          해당 결과는 참고용이며, 진단 또는 치료 목적이 아닙니다. 정확한 판단은 전문의 상담을 권장드립니다.
        </p>
        <p className="text-xs text-yellow-600 leading-relaxed mt-2 italic">
          본 서비스는 의료행위 또는 전문적 진단을 대체하지 않습니다. AI 분석 결과는 참고용 정보이며, 정확한 진단이나 치료를 위해서는 반드시 전문 의료인의 상담이 필요합니다.
        </p>
      </Card>

      {/* CTA 버튼 */}
      <div className="space-y-3">
        {resultId && (
          <Link href={`/analysis/${resultId}`} prefetch={false} className="block">
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

