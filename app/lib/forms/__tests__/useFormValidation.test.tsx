import { renderHook, act } from '@testing-library/react'
import { useFormValidation } from '../hooks/useFormValidation'
import { validateEmail, validateRequired, validateMinLength } from '../validators'

describe('useFormValidation', () => {
  const initialConfig = {
    email: {
      value: '',
      validators: [validateRequired, validateEmail],
    },
    password: {
      value: '',
      validators: [validateRequired, validateMinLength.bind(null, 6)],
    },
  }

  it('초기 상태 설정', () => {
    const { result } = renderHook(() => useFormValidation(initialConfig))

    expect(result.current.values).toEqual({ email: '', password: '' })
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
    expect(result.current.isValid).toBe(true)
  })

  it('필드 값 변경', () => {
    const { result } = renderHook(() => useFormValidation(initialConfig))

    act(() => {
      result.current.setFieldValue('email', 'test@example.com')
    })

    expect(result.current.values.email).toBe('test@example.com')
  })

  it('필드 검증', () => {
    const { result } = renderHook(() => useFormValidation(initialConfig))

    act(() => {
      result.current.setFieldValue('email', 'invalid')
    })

    act(() => {
      result.current.setFieldTouched('email')
    })

    expect(result.current.errors.email).toBeDefined()
    expect(result.current.errors.email).toBeTruthy()
  })

  it('전체 폼 검증', () => {
    const { result } = renderHook(() => useFormValidation(initialConfig))

    act(() => {
      result.current.setFieldValue('email', 'invalid')
      result.current.setFieldValue('password', '123')
    })

    let isValid: boolean
    act(() => {
      isValid = result.current.validateForm()
    })

    expect(isValid!).toBe(false)
    // 최소 하나의 에러는 있어야 함
    const hasErrors = Object.keys(result.current.errors).length > 0
    expect(hasErrors).toBe(true)
  })

  it('폼 리셋', () => {
    const { result } = renderHook(() => useFormValidation(initialConfig))

    act(() => {
      result.current.setFieldValue('email', 'test@example.com')
      result.current.setFieldTouched('email')
    })

    act(() => {
      result.current.resetForm()
    })

    expect(result.current.values.email).toBe('')
    expect(result.current.errors.email).toBeUndefined()
    expect(result.current.touched.email).toBeUndefined()
  })
})

