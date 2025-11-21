import {
  normalizeScoreValue,
  normalizeSkinScores,
  getSkinScoresFromAnalysis,
  calculateAverageScore,
  calculateAverageScoreFromAnalysis,
} from '../skinScores'

describe('normalizeScoreValue', () => {
  it('should return number for valid number', () => {
    expect(normalizeScoreValue(0.5)).toBe(0.5)
    expect(normalizeScoreValue(1)).toBe(1)
    expect(normalizeScoreValue(0)).toBe(0)
  })

  it('should return null for NaN', () => {
    expect(normalizeScoreValue(NaN)).toBeNull()
  })

  it('should return null for Infinity', () => {
    expect(normalizeScoreValue(Infinity)).toBeNull()
    expect(normalizeScoreValue(-Infinity)).toBeNull()
  })

  it('should extract score from object', () => {
    expect(normalizeScoreValue({ score: 0.7 })).toBe(0.7)
    expect(normalizeScoreValue({ score: { score: 0.5 } })).toBe(0.5)
  })

  it('should parse string numbers', () => {
    expect(normalizeScoreValue('0.5')).toBe(0.5)
    expect(normalizeScoreValue('1')).toBe(1)
    expect(normalizeScoreValue('0.75')).toBe(0.75)
  })

  it('should return null for invalid strings', () => {
    expect(normalizeScoreValue('abc')).toBeNull()
    expect(normalizeScoreValue('')).toBeNull()
  })

  it('should return null for null or undefined', () => {
    expect(normalizeScoreValue(null)).toBeNull()
    expect(normalizeScoreValue(undefined)).toBeNull()
  })
})

describe('normalizeSkinScores', () => {
  it('should return empty object for null or undefined', () => {
    expect(normalizeSkinScores(null)).toEqual({})
    expect(normalizeSkinScores(undefined)).toEqual({})
  })

  it('should normalize valid scores', () => {
    const input = {
      pigmentation: 0.7,
      acne: 0.3,
      pores: 0.5,
    }
    expect(normalizeSkinScores(input)).toEqual(input)
  })

  it('should filter out NaN and invalid values', () => {
    const input = {
      pigmentation: 0.7,
      acne: NaN,
      pores: Infinity,
      redness: null,
      wrinkles: 'invalid',
    }
    expect(normalizeSkinScores(input)).toEqual({
      pigmentation: 0.7,
    })
  })

  it('should handle nested score objects', () => {
    const input = {
      pigmentation: { score: 0.7 },
      acne: { score: { score: 0.3 } },
    }
    expect(normalizeSkinScores(input)).toEqual({
      pigmentation: 0.7,
      acne: 0.3,
    })
  })
})

describe('getSkinScoresFromAnalysis', () => {
  it('should extract from skin_condition_scores', () => {
    const analysis = {
      skin_condition_scores: {
        pigmentation: 0.7,
        acne: 0.3,
      },
    }
    expect(getSkinScoresFromAnalysis(analysis)).toEqual({
      pigmentation: 0.7,
      acne: 0.3,
    })
  })

  it('should extract from analysis_data.analysis_a.skin_condition_scores', () => {
    const analysis = {
      analysis_data: {
        analysis_a: {
          skin_condition_scores: {
            pigmentation: 0.7,
            acne: 0.3,
          },
        },
      },
    }
    expect(getSkinScoresFromAnalysis(analysis)).toEqual({
      pigmentation: 0.7,
      acne: 0.3,
    })
  })

  it('should handle nested score objects', () => {
    const analysis = {
      analysis_data: {
        analysis_a: {
          skin_condition_scores: {
            pigmentation: { score: 0.7 },
            acne: { score: 0.3 },
          },
        },
      },
    }
    expect(getSkinScoresFromAnalysis(analysis)).toEqual({
      pigmentation: 0.7,
      acne: 0.3,
    })
  })

  it('should return empty object for missing data', () => {
    expect(getSkinScoresFromAnalysis({})).toEqual({})
    expect(getSkinScoresFromAnalysis(null)).toEqual({})
  })
})

describe('calculateAverageScore', () => {
  it('should calculate average of valid scores', () => {
    const scores = {
      pigmentation: 0.7,
      acne: 0.3,
      pores: 0.5,
    }
    expect(calculateAverageScore(scores)).toBeCloseTo(0.5, 2)
  })

  it('should return null for empty scores', () => {
    expect(calculateAverageScore({})).toBeNull()
    expect(calculateAverageScore(null)).toBeNull()
  })

  it('should filter out invalid values before calculating', () => {
    const scores = {
      pigmentation: 0.7,
      acne: NaN,
      pores: 0.5,
    }
    expect(calculateAverageScore(scores)).toBeCloseTo(0.6, 2)
  })
})

describe('calculateAverageScoreFromAnalysis', () => {
  it('should calculate average from analysis object', () => {
    const analysis = {
      skin_condition_scores: {
        pigmentation: 0.7,
        acne: 0.3,
        pores: 0.5,
      },
    }
    expect(calculateAverageScoreFromAnalysis(analysis)).toBeCloseTo(0.5, 2)
  })

  it('should return null for analysis with no scores', () => {
    expect(calculateAverageScoreFromAnalysis({})).toBeNull()
    expect(calculateAverageScoreFromAnalysis(null)).toBeNull()
  })

  it('should handle nested score objects', () => {
    const analysis = {
      analysis_data: {
        analysis_a: {
          skin_condition_scores: {
            pigmentation: { score: 0.7 },
            acne: { score: 0.3 },
          },
        },
      },
    }
    expect(calculateAverageScoreFromAnalysis(analysis)).toBeCloseTo(0.5, 2)
  })
})

