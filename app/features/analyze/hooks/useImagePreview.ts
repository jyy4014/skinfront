import { useState, useCallback } from 'react'

interface UseImagePreviewReturn {
  preview: string | null
  setPreview: (preview: string | null) => void
  createPreview: (file: File) => Promise<string>
  clearPreview: () => void
}

/**
 * 이미지 미리보기 관리 훅
 */
export function useImagePreview(): UseImagePreviewReturn {
  const [preview, setPreview] = useState<string | null>(null)

  const createPreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setPreview(result)
        resolve(result)
      }
      reader.onerror = () => reject(new Error('파일 읽기 실패'))
      reader.readAsDataURL(file)
    })
  }, [])

  const clearPreview = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
  }, [preview])

  return {
    preview,
    setPreview,
    createPreview,
    clearPreview,
  }
}

