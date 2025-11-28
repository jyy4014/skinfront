import { createClient } from '@/lib/supabase/client';

export interface SessionInfo {
  isValid: boolean;
  userId?: string;
  expiresAt?: number | null;
  error?: string;
}

/**
 * 클라이언트 사이드 세션 검증
 */
export const checkClientSession = (): SessionInfo => {
  try {
    // localStorage에서 세션 정보 확인
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userId = localStorage.getItem('userId');
    const sessionExpiresAt = localStorage.getItem('sessionExpiresAt');

    if (!isAuthenticated || !userId) {
      return { isValid: false, error: 'No stored session' };
    }

    // 세션 만료 시간 체크
    if (sessionExpiresAt) {
      const expiresAt = parseInt(sessionExpiresAt);
      const now = Date.now();

      if (now >= expiresAt) {
        // 세션 만료 - 정리
        clearStoredSession();
        return { isValid: false, error: 'Session expired' };
      }

      return { isValid: true, userId, expiresAt };
    }

    return { isValid: true, userId };
  } catch (error) {
    console.error('Error checking client session:', error);
    return { isValid: false, error: 'Session check failed' };
  }
};

/**
 * 서버 사이드 세션 검증
 */
export const checkServerSession = async (): Promise<SessionInfo> => {
  try {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Server session validation error:', error);
      return { isValid: false, error: error.message };
    }

    if (!session) {
      return { isValid: false, error: 'No session' };
    }

    // 세션 만료 시간 확인
    const expiresAt = session.expires_at ? session.expires_at * 1000 : null;
    const now = Date.now();

    if (expiresAt && now >= expiresAt) {
      console.log('Server session expired');
      return { isValid: false, error: 'Session expired' };
    }

    return {
      isValid: true,
      userId: session.user.id,
      expiresAt
    };
  } catch (error) {
    console.error('Unexpected error during server session check:', error);
    return { isValid: false, error: 'Server session check failed' };
  }
};

/**
 * 세션 갱신
 */
export const refreshSession = async (): Promise<SessionInfo> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Session refresh error:', error);
      clearStoredSession();
      return { isValid: false, error: error.message };
    }

    if (data.session) {
      // 갱신된 세션 정보 저장
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userId', data.session.user.id);

      const expiresAt = data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + (24 * 60 * 60 * 1000);
      localStorage.setItem('sessionExpiresAt', expiresAt.toString());

      return {
        isValid: true,
        userId: data.session.user.id,
        expiresAt
      };
    }

    return { isValid: false, error: 'Refresh failed' };
  } catch (error) {
    console.error('Unexpected error during session refresh:', error);
    return { isValid: false, error: 'Session refresh failed' };
  }
};

/**
 * 저장된 세션 정보 정리
 */
export const clearStoredSession = () => {
  try {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userId');
    localStorage.removeItem('sessionExpiresAt');
    localStorage.removeItem('has_seen_intro');
  } catch (error) {
    console.error('Error clearing stored session:', error);
  }
};

/**
 * 세션 만료까지 남은 시간 계산 (분 단위)
 */
export const getTimeUntilExpiry = (): number => {
  try {
    const sessionExpiresAt = localStorage.getItem('sessionExpiresAt');
    if (!sessionExpiresAt) return 0;

    const expiresAt = parseInt(sessionExpiresAt);
    const now = Date.now();
    const remainingMs = expiresAt - now;

    return Math.max(0, Math.floor(remainingMs / (1000 * 60))); // 분 단위
  } catch (error) {
    console.error('Error calculating time until expiry:', error);
    return 0;
  }
};

