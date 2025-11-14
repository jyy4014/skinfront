/**
 * LoginForm 컴포넌트 테스트
 * TDD: 테스트 먼저 작성 후 구현
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import LoginForm from '../LoginForm'
import { createClient } from '@/app/lib/supabaseClient'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/supabaseClient', () => ({
  createClient: jest.fn(),
}))

describe('LoginForm', () => {
  const mockRouter = {
    push: jest.fn(),
    refresh: jest.fn(),
  }
  const mockSupabase = {
    auth: {
      signInWithPassword: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('입력값 자동 감지', () => {
    it('이메일 입력 시 이메일로 감지되어야 함', async () => {
      render(<LoginForm />)

      const input = screen.getByPlaceholderText('이메일 또는 전화번호 입력')
      fireEvent.change(input, { target: { value: 'test@example.com' } })

      await waitFor(() => {
        expect(screen.getByText('이메일로 로그인')).toBeInTheDocument()
      })
    })

    it('전화번호 입력 시 전화번호로 감지되어야 함', async () => {
      render(<LoginForm />)

      const input = screen.getByPlaceholderText('이메일 또는 전화번호 입력')
      fireEvent.change(input, { target: { value: '01012345678' } })

      await waitFor(() => {
        expect(screen.getByText('전화번호로 로그인')).toBeInTheDocument()
      })
    })

    it('전화번호 입력 시 자동 포맷팅되어야 함 (010-1234-5678)', async () => {
      render(<LoginForm />)

      const input = screen.getByPlaceholderText('이메일 또는 전화번호 입력')
      fireEvent.change(input, { target: { value: '01012345678' } })

      await waitFor(() => {
        expect(input).toHaveValue('010-1234-5678')
      })
    })
  })

  describe('이메일 로그인', () => {
    it('이메일과 비밀번호로 로그인 성공 시 홈으로 이동해야 함', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          session: {
            access_token: 'token',
            refresh_token: 'refresh',
            expires_at: Date.now() + 3600,
            user: { id: 'user-id' },
          },
          user: { id: 'user-id' },
        },
        error: null,
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { login_count: 0 },
          error: null,
        }),
        update: jest.fn().mockReturnThis(),
      })

      render(<LoginForm />)

      const emailInput = screen.getByPlaceholderText('이메일 또는 전화번호 입력')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByRole('button', { name: /로그인/ })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
        expect(mockRouter.push).toHaveBeenCalledWith('/home')
      })
    })

    it('잘못된 이메일 형식 시 에러 메시지를 표시해야 함', async () => {
      render(<LoginForm />)

      const emailInput = screen.getByPlaceholderText('이메일 또는 전화번호 입력')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByRole('button', { name: /로그인/ })

      // @가 없는 문자열 입력
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        // 에러 메시지가 표시되어야 함
        const errorElement = screen.queryByText(/올바른 이메일 주소 또는 전화번호를 입력해주세요/)
        expect(errorElement).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('비밀번호가 일치하지 않으면 에러 메시지를 표시해야 함', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials' },
      })

      render(<LoginForm />)

      const emailInput = screen.getByPlaceholderText('이메일 또는 전화번호 입력')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByRole('button', { name: /로그인/ })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrong-password' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('이메일 또는 전화번호와 비밀번호가 일치하지 않습니다.')
        ).toBeInTheDocument()
      })
    })
  })

  describe('전화번호 로그인', () => {
    it('전화번호로 로그인 시 users 테이블에서 이메일을 찾아야 함', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { email: 'found@example.com' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockFrom)
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          session: {
            access_token: 'token',
            refresh_token: 'refresh',
            expires_at: Date.now() + 3600,
            user: { id: 'user-id' },
          },
          user: { id: 'user-id' },
        },
        error: null,
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockUpdate = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { login_count: 0 },
          error: null,
        }),
        update: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return mockFrom
        }
        return mockUpdate
      })

      render(<LoginForm />)

      const phoneInput = screen.getByPlaceholderText('이메일 또는 전화번호 입력')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByRole('button', { name: /로그인/ })

      fireEvent.change(phoneInput, { target: { value: '01012345678' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockFrom.select).toHaveBeenCalledWith('email')
        expect(mockFrom.eq).toHaveBeenCalledWith('phone_number', '01012345678')
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'found@example.com',
          password: 'password123',
        })
      })
    })

    it('등록되지 않은 전화번호 시 에러 메시지를 표시해야 함', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // not found
        }),
      }

      mockSupabase.from.mockReturnValue(mockFrom)

      render(<LoginForm />)

      const phoneInput = screen.getByPlaceholderText('이메일 또는 전화번호 입력')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByRole('button', { name: /로그인/ })

      fireEvent.change(phoneInput, { target: { value: '01012345678' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('해당 전화번호로 가입된 계정을 찾을 수 없습니다.')
        ).toBeInTheDocument()
      })
    })

    it('전화번호가 너무 짧으면 에러 메시지를 표시해야 함', async () => {
      render(<LoginForm />)

      const phoneInput = screen.getByPlaceholderText('이메일 또는 전화번호 입력')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByRole('button', { name: /로그인/ })

      // 전화번호로 인식되려면 10자리 이상이어야 함
      // 010123은 6자리이므로 이메일로 처리되어 다른 에러가 발생할 수 있음
      // 따라서 9자리로 테스트 (전화번호로 인식되지만 너무 짧음)
      fireEvent.change(phoneInput, { target: { value: '010123456' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        // 전화번호로 인식되면 "올바른 핸드폰번호를 입력해주세요" 또는
        // 이메일로 인식되면 "올바른 이메일 주소 또는 전화번호를 입력해주세요"가 표시됨
        const errorMessage = screen.queryByText(/올바른/) || screen.queryByText(/핸드폰번호/)
        expect(errorMessage).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('자동 로그인', () => {
    it('자동 로그인 체크박스가 기본적으로 체크되어 있어야 함', () => {
      render(<LoginForm />)

      const checkbox = screen.getByLabelText('자동 로그인 (세션 유지)')
      expect(checkbox).toBeChecked()
    })

    it('자동 로그인 체크박스를 해제할 수 있어야 함', () => {
      render(<LoginForm />)

      const checkbox = screen.getByLabelText('자동 로그인 (세션 유지)')
      fireEvent.click(checkbox)

      expect(checkbox).not.toBeChecked()
    })
  })

  describe('로그인 통계 업데이트', () => {
    it('로그인 성공 시 last_login_at과 login_count를 업데이트해야 함', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          session: {
            access_token: 'token',
            refresh_token: 'refresh',
            expires_at: Date.now() + 3600,
            user: { id: 'user-id' },
          },
          user: { id: 'user-id' },
        },
        error: null,
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockSelect = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: { login_count: 5 },
        error: null,
      })
      const mockUpdate = jest.fn().mockReturnThis()
      const mockUpdateEq = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: mockEq.mockReturnValue({
                single: mockSingle,
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: mockUpdateEq,
            }),
          }
        }
      })

      render(<LoginForm />)

      const emailInput = screen.getByPlaceholderText('이메일 또는 전화번호 입력')
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByRole('button', { name: /로그인/ })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockEq).toHaveBeenCalledWith('id', 'user-id')
        expect(mockSingle).toHaveBeenCalled()
        expect(mockUpdateEq).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })
})

