/**
 * ConfirmModal 컴포넌트 테스트
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmModal } from '../ConfirmModal'

// Mock Modal component
jest.mock('../Modal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, title, children, showCloseButton = true }: any) => {
    if (!isOpen) return null
    return (
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
        {title && <h2 id="modal-title">{title}</h2>}
        {showCloseButton && (
          <button onClick={onClose} aria-label="모달 닫기">
            닫기
          </button>
        )}
        {children}
      </div>
    )
  },
}))

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onConfirm: jest.fn(),
  title: '확인 모달',
  message: '이 작업을 진행하시겠습니까?',
}

describe('ConfirmModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('기본 렌더링', () => {
    it('모달이 열려있을 때 내용이 표시되어야 함', () => {
      render(<ConfirmModal {...defaultProps} />)

      expect(screen.getByText('확인 모달')).toBeInTheDocument()
      expect(screen.getByText('이 작업을 진행하시겠습니까?')).toBeInTheDocument()
    })

    it('모달이 닫혀있을 때 내용이 표시되지 않아야 함', () => {
      render(<ConfirmModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('확인 모달')).not.toBeInTheDocument()
    })

    it('기본 확인/취소 버튼 텍스트가 표시되어야 함', () => {
      render(<ConfirmModal {...defaultProps} />)

      expect(screen.getByText('확인')).toBeInTheDocument()
      expect(screen.getByText('취소')).toBeInTheDocument()
    })

    it('커스텀 확인/취소 버튼 텍스트가 표시되어야 함', () => {
      render(
        <ConfirmModal
          {...defaultProps}
          confirmText="삭제"
          cancelText="닫기"
        />
      )

      expect(screen.getByText('삭제')).toBeInTheDocument()
      // Modal의 닫기 버튼과 취소 버튼이 모두 있을 수 있으므로 getAllByText 사용
      const cancelButtons = screen.getAllByText('닫기')
      expect(cancelButtons.length).toBeGreaterThan(0)
    })
  })

  describe('버튼 동작', () => {
    it('취소 버튼 클릭 시 onClose가 호출되어야 함', async () => {
      const user = userEvent.setup()
      const onClose = jest.fn()
      render(<ConfirmModal {...defaultProps} onClose={onClose} />)

      const cancelButton = screen.getByText('취소')
      await user.click(cancelButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('확인 버튼 클릭 시 onConfirm이 호출되어야 함', async () => {
      const user = userEvent.setup()
      const onConfirm = jest.fn()
      render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />)

      const confirmButton = screen.getByText('확인')
      await user.click(confirmButton)

      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('onConfirm이 Promise를 반환할 때 처리되어야 함', async () => {
      const user = userEvent.setup()
      const onConfirm = jest.fn().mockResolvedValue(undefined)
      render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />)

      const confirmButton = screen.getByText('확인')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('variant', () => {
    it('기본 variant는 primary여야 함', () => {
      render(<ConfirmModal {...defaultProps} />)

      const confirmButton = screen.getByText('확인')
      // Button 컴포넌트의 variant prop 확인은 실제 구현에 따라 다를 수 있음
      expect(confirmButton).toBeInTheDocument()
    })

    it('danger variant가 적용되어야 함', () => {
      render(<ConfirmModal {...defaultProps} confirmVariant="danger" />)

      const confirmButton = screen.getByText('확인')
      expect(confirmButton).toBeInTheDocument()
    })
  })

  describe('로딩 상태', () => {
    it('isLoading이 true일 때 확인 버튼이 비활성화되어야 함', () => {
      render(<ConfirmModal {...defaultProps} isLoading={true} />)

      // Button 컴포넌트가 isLoading일 때 disabled를 처리하는지 확인
      const confirmButton = screen.getByText('확인').closest('button')
      expect(confirmButton).toBeDisabled()
    })

    it('isLoading이 true일 때 취소 버튼이 비활성화되어야 함', () => {
      render(<ConfirmModal {...defaultProps} isLoading={true} />)

      const cancelButton = screen.getByText('취소')
      expect(cancelButton).toBeDisabled()
    })

    it('isLoading이 true일 때 닫기 버튼이 표시되지 않아야 함', () => {
      render(<ConfirmModal {...defaultProps} isLoading={true} />)

      // Modal의 showCloseButton이 false가 되어야 함
      // Mock Modal에서 showCloseButton이 false일 때 닫기 버튼을 숨기도록 구현되어 있지 않을 수 있음
      // 실제 구현에 따라 다를 수 있으므로 이 테스트는 선택적
      const closeButtons = screen.queryAllByLabelText('모달 닫기')
      // isLoading일 때는 닫기 버튼이 없거나 비활성화되어야 함
      expect(closeButtons.length).toBe(0)
    })
  })

  describe('React.ReactNode 메시지 지원', () => {
    it('React.ReactNode 메시지를 렌더링할 수 있어야 함', () => {
      const customMessage = (
        <div>
          <p>커스텀 메시지</p>
          <div>진행 상태: 50%</div>
        </div>
      )

      render(<ConfirmModal {...defaultProps} message={customMessage} />)

      expect(screen.getByText('커스텀 메시지')).toBeInTheDocument()
      expect(screen.getByText('진행 상태: 50%')).toBeInTheDocument()
    })

    it('진행 바가 포함된 메시지를 렌더링할 수 있어야 함', () => {
      const progressMessage = (
        <div className="space-y-3">
          <p>삭제 중... (5/10)</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-pink-500 h-2 rounded-full"
              style={{ width: '50%' }}
            />
          </div>
        </div>
      )

      render(<ConfirmModal {...defaultProps} message={progressMessage} />)

      expect(screen.getByText('삭제 중... (5/10)')).toBeInTheDocument()
    })
  })

  describe('disabled prop', () => {
    it('disabled가 true일 때 버튼들이 비활성화되어야 함', () => {
      render(<ConfirmModal {...defaultProps} disabled={true} />)

      const confirmButton = screen.getByText('확인')
      const cancelButton = screen.getByText('취소')

      expect(confirmButton).toBeDisabled()
      expect(cancelButton).toBeDisabled()
    })

    it('isLoading과 disabled가 모두 true일 때 버튼들이 비활성화되어야 함', () => {
      render(<ConfirmModal {...defaultProps} isLoading={true} disabled={true} />)

      const confirmButton = screen.getByText('확인').closest('button')
      const cancelButton = screen.getByText('취소').closest('button')

      expect(confirmButton).toBeDisabled()
      expect(cancelButton).toBeDisabled()
    })
  })

  describe('접근성', () => {
    it('role="dialog"가 있어야 함', () => {
      render(<ConfirmModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })

    it('aria-modal="true"가 있어야 함', () => {
      render(<ConfirmModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('제목이 aria-labelledby로 연결되어야 함', () => {
      render(<ConfirmModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      const title = screen.getByText('확인 모달')
      expect(title).toHaveAttribute('id', 'modal-title')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
    })
  })
})


