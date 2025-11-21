/**
 * 확인 모달 컴포넌트
 * 삭제 등 중요한 작업 전 확인용
 */

'use client'

import Modal from './Modal'
import Button from './Button'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'danger'
  isLoading?: boolean
  disabled?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  confirmVariant = 'primary',
  isLoading = false,
  disabled = false,
}: ConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={!isLoading}
    >
      <div className="space-y-6">
        {typeof message === 'string' ? (
          <p className="text-gray-700">{message}</p>
        ) : (
          message
        )}

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading || disabled}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={isLoading || disabled}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}


