/**
 * 프로필 수정 페이지 테스트
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/auth'
import { useUserProfile, useUpdateProfile } from '@/app/lib/data'
import ProfileEditPage from '../page'

// 모킹
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/lib/data', () => ({
  useUserProfile: jest.fn(),
  useUpdateProfile: jest.fn(),
}))

jest.mock('@/components/common/ToastProvider', () => ({
  useToastContext: jest.fn(() => ({
    toast: jest.fn(),
  })),
}))

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
}

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
}

const mockUserProfile = {
  user: mockUser,
  profile: {
    id: 'user-1',
    email: 'test@example.com',
    name: '테스트',
    nickname: '테스트유저',
    birth_date: '1990-01-01',
    gender: '여성',
    phone_number: '01012345678',
    nationality: 'KR',
  },
}

const mockUpdateProfile = jest.fn().mockResolvedValue({})

describe('ProfileEditPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue({ user: mockUser })
    ;(useUserProfile as jest.Mock).mockReturnValue({
      data: mockUserProfile,
      isLoading: false,
    })
    ;(useUpdateProfile as jest.Mock).mockReturnValue({
      updateProfile: mockUpdateProfile,
      isLoading: false,
      isSuccess: false,
    })
  })

  it('사용자가 없으면 로그인 페이지로 리다이렉트해야 함', () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: null })
    render(<ProfileEditPage />)
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/login')
  })

  it('로딩 중일 때 로딩 스피너를 표시해야 함', () => {
    ;(useUserProfile as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    })

    render(<ProfileEditPage />)
    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  it('프로필 수정 폼을 표시해야 함', async () => {
    render(<ProfileEditPage />)

    await waitFor(() => {
      expect(screen.getByText('프로필 수정')).toBeInTheDocument()
      expect(screen.getByDisplayValue('테스트')).toBeInTheDocument()
      expect(screen.getByDisplayValue('테스트유저')).toBeInTheDocument()
    })
  })

  it('이름을 수정할 수 있어야 함', async () => {
    render(<ProfileEditPage />)

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/이름/i) as HTMLInputElement
      expect(nameInput).toBeInTheDocument()
      
      fireEvent.change(nameInput, { target: { value: '새 이름' } })
      expect(nameInput.value).toBe('새 이름')
    })
  })

  it('별명을 수정할 수 있어야 함', async () => {
    render(<ProfileEditPage />)

    await waitFor(() => {
      const nicknameInput = screen.getByLabelText(/별명/i) as HTMLInputElement
      expect(nicknameInput).toBeInTheDocument()
      
      fireEvent.change(nicknameInput, { target: { value: '새 별명' } })
      expect(nicknameInput.value).toBe('새 별명')
    })
  })

  it('생년월일을 수정할 수 있어야 함', async () => {
    render(<ProfileEditPage />)

    await waitFor(() => {
      const birthDateInput = screen.getByLabelText(/생년월일/i) as HTMLInputElement
      expect(birthDateInput).toBeInTheDocument()
      
      fireEvent.change(birthDateInput, { target: { value: '1995-05-15' } })
      expect(birthDateInput.value).toBe('1995-05-15')
    })
  })

  it('전화번호를 수정할 수 있어야 함', async () => {
    render(<ProfileEditPage />)

    await waitFor(() => {
      const phoneInput = screen.getByLabelText(/전화번호/i) as HTMLInputElement
      expect(phoneInput).toBeInTheDocument()
      
      fireEvent.change(phoneInput, { target: { value: '010-9876-5432' } })
      expect(phoneInput.value).toBe('010-9876-5432')
    })
  })

  it('저장 버튼을 클릭하면 프로필 업데이트가 호출되어야 함', async () => {
    render(<ProfileEditPage />)

    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /저장/i })
      expect(saveButton).toBeInTheDocument()
      
      fireEvent.click(saveButton)
    })

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled()
    })
  })

  it('취소 버튼을 클릭하면 이전 페이지로 돌아가야 함', async () => {
    render(<ProfileEditPage />)

    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /취소/i })
      expect(cancelButton).toBeInTheDocument()
      
      fireEvent.click(cancelButton)
      expect(mockRouter.back).toHaveBeenCalled()
    })
  })
})

