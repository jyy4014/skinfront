/**
 * 분석 히스토리 아이템 컴포넌트
 * 삭제 기능 포함
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trash2, BarChart3, Calendar } from 'lucide-react'
import { useDeleteAnalysis } from '@/app/lib/data/mutations/analysis'
import { useToast } from '@/app/hooks/useToast'
import { ConfirmModal } from '@/app/components/ui/ConfirmModal'

interface AnalysisHistoryItemProps {
  analysis: {
    id: string
    created_at: string
    image_url?: string
    image_urls?: string[]
    result_summary?: string
    confidence?: number | string
    analysis_data?: any
  }
  onDelete?: () => void
}

export function AnalysisHistoryItem({ analysis, onDelete }: AnalysisHistoryItemProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { deleteAnalysis, isPending: isDeleting } = useDeleteAnalysis()
  const toast = useToast()
  const confidenceValue = (() => {
    if (
      typeof analysis.confidence === 'number' &&
      Number.isFinite(analysis.confidence)
    ) {
      return analysis.confidence
    }
    if (typeof analysis.confidence === 'string') {
      const sanitized = analysis.confidence.replace(/[^\d.-]/g, '')
      if (!sanitized) return null
      const parsedString = Number(sanitized)
      return Number.isFinite(parsedString) ? parsedString : null
    }
    const parsed = Number(analysis.confidence)
    return Number.isFinite(parsed) ? parsed : null
  })()

  const handleDelete = async () => {
    try {
      await deleteAnalysis(analysis.id)
      toast.success('분석 기록이 삭제되었습니다.')
      setShowDeleteModal(false)
      onDelete?.()
    } catch (error: any) {
      toast.error(error.message || '삭제 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteModal(true)
  }

  const imageUrl = analysis.image_url || analysis.image_urls?.[0]

  return (
    <>
      <div className="relative group">
        <Link
          href={`/analysis/${analysis.id}`}
          prefetch={false}
          className="block bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
        >
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="분석 이미지"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.image-placeholder')) {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'image-placeholder flex items-center justify-center h-full bg-gray-100';
                      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                      icon.setAttribute('class', 'w-8 h-8 text-gray-400');
                      icon.setAttribute('fill', 'none');
                      icon.setAttribute('viewBox', '0 0 24 24');
                      icon.setAttribute('stroke', 'currentColor');
                      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                      path.setAttribute('d', 'M9 2v4M15 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z');
                      path.setAttribute('stroke-linecap', 'round');
                      path.setAttribute('stroke-linejoin', 'round');
                      path.setAttribute('stroke-width', '2');
                      icon.appendChild(path);
                      placeholder.appendChild(icon);
                      parent.appendChild(placeholder);
                    }
                  }}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-700 mb-2 line-clamp-2 text-sm">
                {analysis.result_summary || '분석 결과'}
              </p>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500">
                  {new Date(analysis.created_at).toLocaleDateString('ko-KR', {
                    month: 'numeric',
                    day: 'numeric',
                  })}
                  {confidenceValue !== null && Number.isFinite(confidenceValue) && ` – ${Math.round(confidenceValue * 100)}`}
                </p>
              </div>
              {confidenceValue !== null && Number.isFinite(confidenceValue) && (
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    신뢰도 {Math.round(confidenceValue * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* 삭제 버튼 */}
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-red-50 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="분석 기록 삭제"
          title="삭제"
        >
          <Trash2 className="w-4 h-4 text-gray-600 group-hover:text-red-600 transition-colors" />
        </button>
      </div>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="분석 기록 삭제"
        message="이 분석 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}

