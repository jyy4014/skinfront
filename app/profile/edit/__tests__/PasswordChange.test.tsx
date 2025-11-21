/**
 * 비밀번호 변경 컴포넌트 테스트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PasswordChangeForm } from '../components/PasswordChangeForm'

// Supabase 클라이언트 모킹
jest.mock('@/app/lib/supabaseClient', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      }),
      signInWithPassword: jest.fn(),
      updateUser: jest.fn().mockResolvedValue({ data: {}, error: null }),
    },
  })),
}))

const mockOnSuccess = jest.fn()
const mockOnError = jest.fn()

describe('PasswordChangeForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('현재 비밀번호, 새 비밀번호, 확인 필드를 표시해야 함', () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} onError={mockOnError} />)
    
    expect(screen.getByLabelText(/현재 비밀번호/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/새 비밀번호/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/비밀번호 확인/i)).toBeInTheDocument()
  })

  it('비밀번호가 일치하지 않으면 에러 메시지를 표시해야 함', async () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} onError={mockOnError} />)
    
    const newPasswordInput = screen.getByLabelText(/새 비밀번호/i)
    const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i)
    const submitButton = screen.getByRole('button', { name: /변경/i })

    fireEvent.change(newPasswordInput, { target: { value: 'NewPass123!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'Different123!' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/비밀번호가 일치하지 않습니다/i)).toBeInTheDocument()
    })
  })

  it('비밀번호가 너무 짧으면 에러 메시지를 표시해야 함', async () => {
    render(<PasswordChangeForm onSuccess={mockOnSuccess} onError={mockOnError} />)
    
    const newPasswordInput = screen.getByLabelText(/새 비밀번호/i)
    const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i)
    const submitButton = screen.getByRole('button', { name: /변경/i })

    fireEvent.change(newPasswordInput, { target: { value: 'Short1!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'Short1!' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/최소 8자 이상/i)).toBeInTheDocument()
    })
  })

  it('유효한 비밀번호로 변경 시 폼 제출이 가능해야 함', async () => {
    const { createClient } = require('@/app/lib/supabaseClient')
    const mockSignIn = jest.fn().mockResolvedValue({ data: {}, error: null })
    const mockUpdateUser = jest.fn().mockResolvedValue({ data: {}, error: null })

    createClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'test@example.com' } },
          error: null,
        }),
        signInWithPassword: mockSignIn,
        updateUser: mockUpdateUser,
      },
    })

    render(<PasswordChangeForm onSuccess={mockOnSuccess} onError={mockOnError} />)
    
    const currentPasswordInput = screen.getByLabelText(/현재 비밀번호/i)
    const newPasswordInput = screen.getByLabelText(/새 비밀번호/i)
    const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i)
    const submitButton = screen.getByRole('button', { name: /변경/i })

    fireEvent.change(currentPasswordInput, { target: { value: 'CurrentPass123!' } })
    fireEvent.change(newPasswordInput, { target: { value: 'NewPass123!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'NewPass123!' } })
    
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).not.toBeDisabled()
  })
})

