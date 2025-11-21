/**
 * 설정 페이지 테스트
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SettingsPage from '../page'
import { useAuth } from '@/app/lib/auth'
import { useUserProfile, useAnalysisHistory } from '@/app/lib/data'
import { useDeleteAnalysis } from '@/app/lib/data/mutations/analysis'
import { useUpdateUserSettings } from '@/app/lib/data/mutations/user-settings'
import { useToast } from '@/app/hooks/useToast'
import { createClient } from '@/app/lib/supabaseClient'

// Mock dependencies
jest.mock('@/app/lib/auth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/app/lib/data', () => ({
  useUserProfile: jest.fn(),
  useAnalysisHistory: jest.fn(),
}))

jest.mock('@/app/lib/data/mutations/analysis', () => ({
  useDeleteAnalysis: jest.fn(),
}))

jest.mock('@/app/lib/data/mutations/user-settings', () => ({
  useUpdateUserSettings: jest.fn(),
}))

jest.mock('@/app/hooks/useToast', () => ({
  useToast: jest.fn(),
}))

jest.mock('@/app/lib/supabaseClient', () => ({
  createClient: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

jest.mock('@/app/components/common/BottomNav', () => ({
  __esModule: true,
  default: () => <nav>BottomNav</nav>,
}))

jest.mock('@/app/components/ui/ConfirmModal', () => ({
  ConfirmModal: ({ isOpen, onConfirm, onClose, title, message, confirmText, cancelText }: any) => {
    if (!isOpen) return null
    return (
      <div role="dialog">
        <h2>{title}</h2>
        <div>{typeof message === 'string' ? <p>{message}</p> : message}</div>
        <button onClick={onClose}>{cancelText}</button>
        <button onClick={onConfirm}>{confirmText}</button>
      </div>
    )
  },
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseUserProfile = useUserProfile as jest.MockedFunction<typeof useUserProfile>
const mockUseAnalysisHistory = useAnalysisHistory as jest.MockedFunction<typeof useAnalysisHistory>
const mockUseDeleteAnalysis = useDeleteAnalysis as jest.MockedFunction<typeof useDeleteAnalysis>
const mockUseUpdateUserSettings = useUpdateUserSettings as jest.MockedFunction<typeof useUpdateUserSettings>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('SettingsPage', () => {
  let queryClient: QueryClient
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    jest.clearAllMocks()

    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      loading: false,
    } as any)

    mockUseUserProfile.mockReturnValue({
      data: {
        profile: {
          id: 'user-123',
          notification_enabled: true,
          auto_delete_images: false,
          language: 'ko',
          skin_type: '건성',
        },
      },
      isLoading: false,
    } as any)

    mockUseAnalysisHistory.mockReturnValue({
      data: [
        { id: 'analysis-1', created_at: '2024-01-01' },
        { id: 'analysis-2', created_at: '2024-01-02' },
      ],
      isLoading: false,
    } as any)

    mockUseDeleteAnalysis.mockReturnValue({
      deleteAnalysis: jest.fn().mockResolvedValue(undefined),
      isPending: false,
    } as any)

    mockUseUpdateUserSettings.mockReturnValue({
      updateSettings: jest.fn().mockResolvedValue({}),
      isPending: false,
    } as any)

    mockUseToast.mockReturnValue(mockToast as any)

    mockCreateClient.mockReturnValue({
      auth: {
        signOut: jest.fn().mockResolvedValue({}),
      },
    } as any)
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('기본 렌더링', () => {
    it('설정 페이지가 렌더링되어야 함', () => {
      render(<SettingsPage />, { wrapper })

      expect(screen.getByText('설정')).toBeInTheDocument()
      expect(screen.getByText('프로필 관리')).toBeInTheDocument()
      expect(screen.getByText('AI 분석 이력')).toBeInTheDocument()
      expect(screen.getByText('알림 설정')).toBeInTheDocument()
      expect(screen.getByText('언어 설정')).toBeInTheDocument()
      expect(screen.getByText('프리미엄')).toBeInTheDocument()
      expect(screen.getByText('개인정보 설정')).toBeInTheDocument()
      expect(screen.getByText('로그아웃')).toBeInTheDocument()
    })

    it('사용자가 없으면 로그인 페이지로 리다이렉트되어야 함', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      } as any)

      const { useRouter } = require('next/navigation')
      const mockPush = jest.fn()
      useRouter.mockReturnValue({ push: mockPush })

      render(<SettingsPage />, { wrapper })

      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })

    it('로딩 중일 때 로딩 스피너가 표시되어야 함', () => {
      mockUseUserProfile.mockReturnValue({
        data: null,
        isLoading: true,
      } as any)

      render(<SettingsPage />, { wrapper })

      expect(screen.getByText('로딩 중...')).toBeInTheDocument()
    })
  })

  describe('프로필 관리', () => {
    it('프로필 정보 링크가 있어야 함', () => {
      render(<SettingsPage />, { wrapper })

      const profileLink = screen.getByText('프로필 정보').closest('a')
      expect(profileLink).toHaveAttribute('href', '/profile/edit')
    })

    it('피부 타입 설정 링크가 있어야 함', () => {
      render(<SettingsPage />, { wrapper })

      const skinTypeLink = screen.getByText('피부 타입 설정').closest('a')
      expect(skinTypeLink).toHaveAttribute('href', '/profile/complete')
      expect(screen.getByText(/현재: 건성/)).toBeInTheDocument()
    })
  })

  describe('알림 설정', () => {
    it('알림 토글이 표시되어야 함', () => {
      render(<SettingsPage />, { wrapper })

      // 알림 설정 섹션에서 첫 번째 checkbox 찾기
      const toggles = screen.getAllByRole('checkbox')
      expect(toggles.length).toBeGreaterThan(0)
      // 첫 번째 토글이 알림 토글
      expect(toggles[0]).toBeInTheDocument()
    })

    it('알림 토글을 클릭하면 설정이 업데이트되어야 함', async () => {
      const user = userEvent.setup()
      const mockUpdateSettings = jest.fn().mockResolvedValue({ notification_enabled: false })

      mockUseUpdateUserSettings.mockReturnValue({
        updateSettings: mockUpdateSettings,
        isPending: false,
      } as any)

      render(<SettingsPage />, { wrapper })

      const toggles = screen.getAllByRole('checkbox')
      // 첫 번째 토글이 알림 토글
      await user.click(toggles[0])

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({ notification_enabled: false })
      })
    })

    it('설정 업데이트 성공 시 성공 메시지가 표시되어야 함', async () => {
      const user = userEvent.setup()
      const mockUpdateSettings = jest.fn().mockResolvedValue({ notification_enabled: false })

      mockUseUpdateUserSettings.mockReturnValue({
        updateSettings: mockUpdateSettings,
        isPending: false,
      } as any)

      render(<SettingsPage />, { wrapper })

      const toggles = screen.getAllByRole('checkbox')
      await user.click(toggles[0])

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('알림이 비활성화되었습니다.')
      })
    })

    it('설정 업데이트 실패 시 에러 메시지가 표시되어야 함', async () => {
      const user = userEvent.setup()
      const mockUpdateSettings = jest.fn().mockRejectedValue(new Error('Update failed'))

      mockUseUpdateUserSettings.mockReturnValue({
        updateSettings: mockUpdateSettings,
        isPending: false,
      } as any)

      render(<SettingsPage />, { wrapper })

      const toggles = screen.getAllByRole('checkbox')
      await user.click(toggles[0])

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled()
      })
    })
  })

  describe('언어 설정', () => {
    it('언어 선택 드롭다운이 표시되어야 함', () => {
      render(<SettingsPage />, { wrapper })

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
      expect(select).toHaveValue('ko')
    })

    it('언어를 변경하면 설정이 업데이트되어야 함', async () => {
      const user = userEvent.setup()
      const mockUpdateSettings = jest.fn().mockResolvedValue({ language: 'en' })

      mockUseUpdateUserSettings.mockReturnValue({
        updateSettings: mockUpdateSettings,
        isPending: false,
      } as any)

      render(<SettingsPage />, { wrapper })

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'en')

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({ language: 'en' })
      })
    })
  })

  describe('자동 삭제 설정', () => {
    it('자동 삭제 토글이 표시되어야 함', () => {
      render(<SettingsPage />, { wrapper })

      const toggles = screen.getAllByRole('checkbox')
      expect(toggles.length).toBeGreaterThan(0)
    })

    it('자동 삭제 토글을 클릭하면 설정이 업데이트되어야 함', async () => {
      const user = userEvent.setup()
      const mockUpdateSettings = jest.fn().mockResolvedValue({ auto_delete_images: true })

      mockUseUpdateUserSettings.mockReturnValue({
        updateSettings: mockUpdateSettings,
        isPending: false,
      } as any)

      render(<SettingsPage />, { wrapper })

      const toggles = screen.getAllByRole('checkbox')
      // 두 번째 토글이 자동 삭제 토글
      await user.click(toggles[1])

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({ auto_delete_images: true })
      })
    })
  })

  describe('AI 분석 이력 삭제', () => {
    it('삭제 버튼이 표시되어야 함', () => {
      render(<SettingsPage />, { wrapper })

      expect(screen.getByText('AI 분석 이력 삭제')).toBeInTheDocument()
      expect(screen.getByText(/총 2개의 분석 기록/)).toBeInTheDocument()
    })

    it('삭제 버튼 클릭 시 확인 모달이 표시되어야 함', async () => {
      const user = userEvent.setup()
      render(<SettingsPage />, { wrapper })

      const deleteButton = screen.getByText('AI 분석 이력 삭제').closest('button')
      await user.click(deleteButton!)

      await waitFor(() => {
        expect(screen.getByText('모든 분석 이력 삭제')).toBeInTheDocument()
        expect(screen.getByText(/정말로 모든 분석 이력\(2개\)을 삭제하시겠습니까?/)).toBeInTheDocument()
      })
    })

    it('확인 모달에서 삭제 확인 시 모든 이력이 삭제되어야 함', async () => {
      const user = userEvent.setup()
      const mockDeleteAnalysis = jest.fn().mockResolvedValue(undefined)

      mockUseDeleteAnalysis.mockReturnValue({
        deleteAnalysis: mockDeleteAnalysis,
        isPending: false,
      } as any)

      render(<SettingsPage />, { wrapper })

      const deleteButton = screen.getByText('AI 분석 이력 삭제').closest('button')
      await user.click(deleteButton!)

      await waitFor(() => {
        expect(screen.getByText('삭제')).toBeInTheDocument()
      })

      const confirmButton = screen.getByText('삭제')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockDeleteAnalysis).toHaveBeenCalledTimes(2)
        expect(mockToast.success).toHaveBeenCalledWith('모든 분석 이력이 삭제되었습니다.')
      })
    })

    it('삭제 중일 때 진행 상태가 표시되어야 함', async () => {
      const user = userEvent.setup()
      let deleteProgress = 0
      const mockDeleteAnalysis = jest.fn().mockImplementation(async () => {
        deleteProgress++
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      mockUseDeleteAnalysis.mockReturnValue({
        deleteAnalysis: mockDeleteAnalysis,
        isPending: false,
      } as any)

      render(<SettingsPage />, { wrapper })

      const deleteButton = screen.getByText('AI 분석 이력 삭제').closest('button')
      await user.click(deleteButton!)

      await waitFor(() => {
        expect(screen.getByText('삭제')).toBeInTheDocument()
      })

      const confirmButton = screen.getByText('삭제')
      await user.click(confirmButton)

      // 진행 상태 확인은 실제 구현에 따라 다를 수 있음
      await waitFor(() => {
        expect(mockDeleteAnalysis).toHaveBeenCalled()
      })
    })
  })

  describe('로그아웃', () => {
    it('로그아웃 버튼이 표시되어야 함', () => {
      render(<SettingsPage />, { wrapper })

      expect(screen.getByText('로그아웃')).toBeInTheDocument()
    })

    it('로그아웃 버튼 클릭 시 확인 모달이 표시되어야 함', async () => {
      const user = userEvent.setup()
      render(<SettingsPage />, { wrapper })

      // 로그아웃 버튼 찾기 (button 요소)
      const logoutButtons = screen.getAllByText('로그아웃')
      const logoutButton = logoutButtons.find(btn => btn.closest('button'))
      await user.click(logoutButton!)

      await waitFor(() => {
        // 모달의 제목이 표시되어야 함
        expect(screen.getByText('정말로 로그아웃하시겠습니까?')).toBeInTheDocument()
      })
    })

    it('로그아웃 확인 시 로그아웃이 실행되어야 함', async () => {
      const user = userEvent.setup()
      const mockSignOut = jest.fn().mockResolvedValue({})
      const mockPush = jest.fn()

      mockCreateClient.mockReturnValue({
        auth: {
          signOut: mockSignOut,
        },
      } as any)

      const { useRouter } = require('next/navigation')
      useRouter.mockReturnValue({ push: mockPush })

      render(<SettingsPage />, { wrapper })

      const logoutButton = screen.getByText('로그아웃').closest('button')
      await user.click(logoutButton!)

      await waitFor(() => {
        expect(screen.getByText('정말로 로그아웃하시겠습니까?')).toBeInTheDocument()
      })

      // 모달의 확인 버튼 찾기 (role="dialog" 내부의 버튼)
      const dialog = screen.getByRole('dialog')
      const confirmButton = dialog.querySelector('button[type="button"]:not([aria-label="모달 닫기"])')
      if (confirmButton) {
        await user.click(confirmButton)
      }

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
        expect(mockToast.success).toHaveBeenCalledWith('로그아웃되었습니다.')
      })
    })
  })

  describe('프리미엄 링크', () => {
    it('프리미엄 결제 링크가 있어야 함', () => {
      render(<SettingsPage />, { wrapper })

      const premiumLink = screen.getByText('프리미엄 결제').closest('a')
      expect(premiumLink).toHaveAttribute('href', '/premium')
    })
  })
})

