/**
 * TDD: 회원가입 폼 테스트
 * 
 * 테스트 시나리오:
 * 1. 비밀번호 확인 실시간 검증
 * 2. 비밀번호 일치 시 에러 제거
 * 3. 비밀번호 불일치 시 에러 표시
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignupForm from '../SignupForm'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/app/hooks/useToast', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  }),
}))

jest.mock('@/app/lib/supabaseClient', () => ({
  createClient: () => ({
    auth: {
      signUp: jest.fn(),
    },
    from: () => ({
      upsert: jest.fn(),
    }),
  }),
}))

describe('SignupForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { useRouter } = require('next/navigation')
    useRouter.mockReturnValue({ push: jest.fn() })
  })

  // 실시간 비밀번호 확인 검증 테스트
  it('비밀번호 확인 필드에 입력 시 실시간으로 검증해야 함', async () => {
    render(<SignupForm />)

    // 이메일 입력
    const emailInput = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    // 비밀번호 입력
    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    const passwordInput = passwordInputs[0]
    fireEvent.change(passwordInput, { target: { value: 'test123456' } })

    // 비밀번호 확인 입력 (일치하지 않는 값)
    const passwordConfirmInput = passwordInputs[1]
    fireEvent.change(passwordConfirmInput, { target: { value: 'test123' } })

    // 에러 메시지가 표시되어야 함
    await waitFor(() => {
      expect(screen.getByText(/비밀번호가 일치하지 않습니다/i)).toBeInTheDocument()
    })
  })

  it('비밀번호와 비밀번호 확인이 일치하면 에러가 사라져야 함', async () => {
    render(<SignupForm />)

    // 이메일 입력
    const emailInput = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    // 비밀번호 입력
    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    const passwordInput = passwordInputs[0]
    fireEvent.change(passwordInput, { target: { value: 'test123456' } })

    // 비밀번호 확인 입력 (일치하지 않는 값)
    const passwordConfirmInput = passwordInputs[1]
    fireEvent.change(passwordConfirmInput, { target: { value: 'test123' } })

    // 에러가 표시됨
    await waitFor(() => {
      expect(screen.getByText(/비밀번호가 일치하지 않습니다/i)).toBeInTheDocument()
    })

    // 비밀번호 확인을 올바른 값으로 변경
    fireEvent.change(passwordConfirmInput, { target: { value: 'test123456' } })

    // 에러가 사라져야 함
    await waitFor(() => {
      expect(screen.queryByText(/비밀번호가 일치하지 않습니다/i)).not.toBeInTheDocument()
    })
  })

  it('비밀번호가 변경되면 비밀번호 확인도 다시 검증해야 함', async () => {
    render(<SignupForm />)

    // 이메일 입력
    const emailInput = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    // 비밀번호 입력
    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    const passwordInput = passwordInputs[0]
    const passwordConfirmInput = passwordInputs[1]

    // 비밀번호와 비밀번호 확인을 일치하게 입력
    fireEvent.change(passwordInput, { target: { value: 'test123456' } })
    fireEvent.change(passwordConfirmInput, { target: { value: 'test123456' } })

    // 비밀번호를 변경
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })

    // 비밀번호 확인이 이제 일치하지 않으므로 에러가 표시되어야 함
    await waitFor(() => {
      expect(screen.getByText(/비밀번호가 일치하지 않습니다/i)).toBeInTheDocument()
    })
  })

  it('비밀번호가 일치할 때 다음 단계로 진행할 수 있어야 함', async () => {
    const { useRouter } = require('next/navigation')
    const mockPush = jest.fn()
    useRouter.mockReturnValue({ push: mockPush })

    render(<SignupForm />)

    // 폼 입력
    const emailInput = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(passwordInputs[0], { target: { value: 'test123456' } })
    fireEvent.change(passwordInputs[1], { target: { value: 'test123456' } })

    // 다음 단계 버튼 클릭
    const nextButton = screen.getByText('다음 단계')
    fireEvent.click(nextButton)

    // Step 2로 이동해야 함
    await waitFor(() => {
      expect(screen.getByText(/추가 정보를 입력해주세요/i)).toBeInTheDocument()
    })
  })

  // 성별 필드 추가 테스트
  it('Step 2에 성별 필드가 표시되어야 함', async () => {
    render(<SignupForm />)

    // Step 1 완료
    const emailInput = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(passwordInputs[0], { target: { value: 'test123456' } })
    fireEvent.change(passwordInputs[1], { target: { value: 'test123456' } })

    const nextButton = screen.getByText('다음 단계')
    fireEvent.click(nextButton)

    // Step 2에서 성별 필드 확인
    await waitFor(() => {
      expect(screen.getByText(/성별/i)).toBeInTheDocument()
    })
  })

  it('성별 필드는 필수 항목이어야 함', async () => {
    render(<SignupForm />)

    // Step 1 완료
    const emailInput = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(passwordInputs[0], { target: { value: 'test123456' } })
    fireEvent.change(passwordInputs[1], { target: { value: 'test123456' } })

    const nextButton = screen.getByText('다음 단계')
    fireEvent.click(nextButton)

    // Step 2에서 성별 필드가 required인지 확인
    await waitFor(() => {
      const genderInput = screen.getByLabelText(/성별/i)
      expect(genderInput).toBeRequired()
    })
  })

  it('핸드폰번호와 국적은 필수 항목이어야 함', async () => {
    render(<SignupForm />)

    // Step 1 완료
    const emailInput = screen.getByPlaceholderText('your@email.com')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(passwordInputs[0], { target: { value: 'test123456' } })
    fireEvent.change(passwordInputs[1], { target: { value: 'test123456' } })

    const nextButton = screen.getByText('다음 단계')
    fireEvent.click(nextButton)

    // Step 2에서 핸드폰번호와 국적이 선택사항인지 확인
    await waitFor(() => {
      const phoneInput = screen.getByPlaceholderText(/01012345678/i)
      const countrySelect = screen.getByLabelText(/국적/i)
      
      // 필수 항목이어야 함
      expect(phoneInput).toBeRequired()
      expect(countrySelect).toBeRequired()
    })
  })
})

