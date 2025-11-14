import {
  validateEmail,
  validatePassword,
  validateFile,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumber,
  validateUrl,
  validateAll,
} from '../validators'

describe('validators', () => {
  describe('validateEmail', () => {
    it('유효한 이메일 통과', () => {
      expect(validateEmail('test@example.com')).toEqual({ valid: true })
      expect(validateEmail('user.name@domain.co.kr')).toEqual({ valid: true })
    })

    it('빈 이메일 거부', () => {
      const result = validateEmail('')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('이메일을 입력해주세요')
    })

    it('잘못된 형식 거부', () => {
      expect(validateEmail('invalid')).toEqual({
        valid: false,
        error: '유효한 이메일 주소를 입력해주세요.',
      })
      expect(validateEmail('test@')).toEqual({
        valid: false,
        error: '유효한 이메일 주소를 입력해주세요.',
      })
    })
  })

  describe('validatePassword', () => {
    it('기본 검증 통과', () => {
      expect(validatePassword('password123')).toEqual({ valid: true })
    })

    it('최소 길이 검증', () => {
      expect(validatePassword('12345', { minLength: 6 })).toEqual({
        valid: false,
        error: '비밀번호는 최소 6자 이상이어야 합니다.',
      })
    })

    it('대문자 필수 검증', () => {
      expect(validatePassword('password123', { requireUppercase: true })).toEqual({
        valid: false,
        error: '비밀번호에 대문자가 포함되어야 합니다.',
      })
    })

    it('소문자 필수 검증', () => {
      expect(validatePassword('PASSWORD123', { requireLowercase: true })).toEqual({
        valid: false,
        error: '비밀번호에 소문자가 포함되어야 합니다.',
      })
    })

    it('숫자 필수 검증', () => {
      expect(validatePassword('Password', { requireNumber: true })).toEqual({
        valid: false,
        error: '비밀번호에 숫자가 포함되어야 합니다.',
      })
    })
  })

  describe('validateFile', () => {
    it('유효한 이미지 파일 통과', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB

      expect(validateFile(file)).toEqual({ valid: true })
    })

    it('파일 크기 초과 거부', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 }) // 20MB

      const result = validateFile(file, { maxSize: 10 * 1024 * 1024 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('파일 크기가 너무 큽니다')
    })

    it('지원하지 않는 파일 타입 거부', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 1024 })

      expect(validateFile(file)).toEqual({
        valid: false,
        error: '이미지 파일만 업로드 가능합니다.',
      })
    })
  })

  describe('validateRequired', () => {
    it('값이 있으면 통과', () => {
      expect(validateRequired('test')).toEqual({ valid: true })
      expect(validateRequired(0)).toEqual({ valid: true })
    })

    it('빈 값 거부', () => {
      expect(validateRequired('')).toEqual({
        valid: false,
        error: '필수 입력 항목입니다.',
      })
      expect(validateRequired(null)).toEqual({
        valid: false,
        error: '필수 입력 항목입니다.',
      })
    })
  })

  describe('validateMinLength', () => {
    it('최소 길이 이상 통과', () => {
      expect(validateMinLength('test', 3)).toEqual({ valid: true })
    })

    it('최소 길이 미만 거부', () => {
      expect(validateMinLength('te', 3)).toEqual({
        valid: false,
        error: '최소 3자 이상 입력해주세요.',
      })
    })
  })

  describe('validateMaxLength', () => {
    it('최대 길이 이하 통과', () => {
      expect(validateMaxLength('test', 10)).toEqual({ valid: true })
    })

    it('최대 길이 초과 거부', () => {
      expect(validateMaxLength('testtesttest', 10)).toEqual({
        valid: false,
        error: '최대 10자까지 입력 가능합니다.',
      })
    })
  })

  describe('validateNumber', () => {
    it('유효한 숫자 통과', () => {
      expect(validateNumber('123')).toEqual({ valid: true })
      expect(validateNumber(123)).toEqual({ valid: true })
    })

    it('숫자가 아닌 값 거부', () => {
      expect(validateNumber('abc')).toEqual({
        valid: false,
        error: '숫자를 입력해주세요.',
      })
    })

    it('최소값 검증', () => {
      expect(validateNumber('5', { min: 10 })).toEqual({
        valid: false,
        error: '최소값은 10입니다.',
      })
    })
  })

  describe('validateUrl', () => {
    it('유효한 URL 통과', () => {
      expect(validateUrl('https://example.com')).toEqual({ valid: true })
      expect(validateUrl('http://test.co.kr')).toEqual({ valid: true })
    })

    it('잘못된 URL 거부', () => {
      expect(validateUrl('not-a-url')).toEqual({
        valid: false,
        error: '유효한 URL을 입력해주세요.',
      })
    })
  })

  describe('validateAll', () => {
    it('모든 검증 통과', () => {
      const result = validateAll('test@example.com', [validateRequired, validateEmail])
      expect(result).toEqual({ valid: true })
    })

    it('첫 번째 실패한 검증 반환', () => {
      const result = validateAll('', [validateRequired, validateEmail])
      expect(result.valid).toBe(false)
      expect(result.error).toContain('필수 입력')
    })
  })
})



