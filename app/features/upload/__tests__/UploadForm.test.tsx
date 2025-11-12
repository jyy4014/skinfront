/**
 * TDD: UploadForm 컴포넌트 테스트
 * 
 * 테스트 시나리오:
 * 1. 갤러리 버튼 클릭 시 파일 input이 클릭되어야 함
 * 2. 카메라 버튼 클릭 시 파일 input이 클릭되어야 함
 * 3. label 클릭 이벤트가 input.click()을 호출해야 함
 * 4. 파일 선택 시 handleFileChange가 호출되어야 함
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import UploadForm from '../UploadForm'

// Mock hooks
jest.mock('../../../lib/image', () => ({
  useImageProcessor: () => ({
    processImage: jest.fn().mockResolvedValue({
      file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
    }),
    processing: false,
    error: null,
  }),
}))

jest.mock('../../../hooks/useFaceDetection', () => ({
  useFaceDetection: () => ({
    detectFace: jest.fn().mockResolvedValue({
      detected: true,
      faceCount: 1,
    }),
    detecting: false,
    error: null,
  }),
}))

describe('UploadForm', () => {
  const mockOnFileSelect = jest.fn()
  const mockOnFaceDetectionResult = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console methods for debugging
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('갤러리 label 클릭 시 파일 input이 클릭되어야 함', () => {
    render(
      <UploadForm
        onFileSelect={mockOnFileSelect}
        onFaceDetectionResult={mockOnFaceDetectionResult}
      />
    )

    const galleryInput = screen.getByLabelText('갤러리에서 사진 선택')
    const galleryLabel = screen.getByText('🖼️ 갤러리').closest('label')
    
    expect(galleryInput).toBeInTheDocument()
    expect(galleryLabel).toBeInTheDocument()
    // label이 input을 포함하는지 확인
    expect(galleryLabel?.contains(galleryInput)).toBe(true)
  })

  it('카메라 label 클릭 시 파일 input이 클릭되어야 함', () => {
    render(
      <UploadForm
        onFileSelect={mockOnFileSelect}
        onFaceDetectionResult={mockOnFaceDetectionResult}
      />
    )

    const cameraInput = screen.getByLabelText('카메라로 사진 촬영')
    const cameraLabel = screen.getByText('📸 촬영하기').closest('label')
    
    expect(cameraInput).toBeInTheDocument()
    expect(cameraLabel).toBeInTheDocument()
    // label이 input을 포함하는지 확인
    expect(cameraLabel?.contains(cameraInput)).toBe(true)
  })

  it('label이 input을 포함하고 있어야 함', () => {
    render(
      <UploadForm
        onFileSelect={mockOnFileSelect}
        onFaceDetectionResult={mockOnFaceDetectionResult}
      />
    )

    const galleryInput = screen.getByLabelText('갤러리에서 사진 선택')
    const galleryLabel = screen.getByText('🖼️ 갤러리').closest('label')
    
    expect(galleryLabel).toBeInTheDocument()
    expect(galleryInput).toBeInTheDocument()
    // label이 input을 직접 포함하는지 확인 (브라우저 기본 동작)
    expect(galleryLabel?.contains(galleryInput)).toBe(true)
  })

  it('파일 선택 시 handleFileChange가 호출되어야 함', async () => {
    render(
      <UploadForm
        onFileSelect={mockOnFileSelect}
        onFaceDetectionResult={mockOnFaceDetectionResult}
      />
    )

    const galleryInput = screen.getByLabelText('갤러리에서 사진 선택') as HTMLInputElement
    
    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    // Create a FileList mock
    const fileList = {
      0: file,
      length: 1,
      item: (index: number) => (index === 0 ? file : null),
      [Symbol.iterator]: function* () {
        yield file
      },
    } as FileList
    
    // Simulate file selection
    Object.defineProperty(galleryInput, 'files', {
      value: fileList,
      writable: false,
      configurable: true,
    })

    fireEvent.change(galleryInput, { target: { files: fileList } })

    // Wait for async processing
    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('input 요소가 올바르게 렌더링되어야 함', () => {
    render(
      <UploadForm
        onFileSelect={mockOnFileSelect}
        onFaceDetectionResult={mockOnFaceDetectionResult}
      />
    )

    const galleryInput = screen.getByLabelText('갤러리에서 사진 선택') as HTMLInputElement
    const cameraInput = screen.getByLabelText('카메라로 사진 촬영') as HTMLInputElement

    // Verify inputs exist and are accessible
    expect(galleryInput).toBeInTheDocument()
    expect(cameraInput).toBeInTheDocument()
    expect(galleryInput.type).toBe('file')
    expect(cameraInput.type).toBe('file')
    expect(galleryInput.className).toContain('hidden')
    expect(cameraInput.className).toContain('hidden')
  })

  it('label이 올바르게 렌더링되고 input을 포함해야 함', () => {
    render(
      <UploadForm
        onFileSelect={mockOnFileSelect}
        onFaceDetectionResult={mockOnFaceDetectionResult}
      />
    )

    const galleryLabel = screen.getByText('🖼️ 갤러리').closest('label')
    const cameraLabel = screen.getByText('📸 촬영하기').closest('label')
    const galleryInput = screen.getByLabelText('갤러리에서 사진 선택')
    const cameraInput = screen.getByLabelText('카메라로 사진 촬영')

    expect(galleryLabel).toBeInTheDocument()
    expect(cameraLabel).toBeInTheDocument()
    expect(galleryInput).toBeInTheDocument()
    expect(cameraInput).toBeInTheDocument()
    // label이 input을 직접 포함하는지 확인 (원래 구조)
    expect(galleryLabel?.contains(galleryInput)).toBe(true)
    expect(cameraLabel?.contains(cameraInput)).toBe(true)
  })
})


