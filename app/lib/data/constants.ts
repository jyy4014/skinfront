/**
 * React Query 캐시 키 상수
 * 모든 쿼리 키를 중앙에서 관리하여 일관성 유지
 */

export const QUERY_KEYS = {
  // 분석 관련
  analysis: {
    all: () => ['skin_analysis'] as const,
    history: (filters?: { page?: number; limit?: number }) =>
      ['skin_analysis', 'history', filters] as const,
    byId: (id: string) => ['skin_analysis', id] as const,
    byUserId: (userId: string) => ['skin_analysis', 'user', userId] as const,
  },

  // 사용자 관련
  user: {
    all: () => ['user'] as const,
    profile: () => ['user', 'profile'] as const,
    session: () => ['user', 'session'] as const,
  },

  // 시술 관련
  treatment: {
    all: () => ['treatment'] as const,
    byId: (id: string) => ['treatment', id] as const,
    recommended: (userId?: string) =>
      ['treatment', 'recommended', userId] as const,
    fromAnalysis: (treatmentId: string) =>
      ['treatment', 'fromAnalysis', treatmentId] as const,
  },
} as const

