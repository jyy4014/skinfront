import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Soft Delete 유틸리티 함수
 * 실제 데이터를 삭제하지 않고 is_active를 false로 설정
 */

/**
 * 리포트를 Soft Delete 처리
 */
export async function softDeleteReport(
  supabase: SupabaseClient,
  reportId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('skin_reports')
      .update({ is_active: false })
      .eq('id', reportId)
      .eq('user_id', userId)

    if (error) {
      console.error('리포트 Soft Delete 실패:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('리포트 Soft Delete 에러:', error)
    return { success: false, error: message }
  }
}

/**
 * 게시글을 Soft Delete 처리
 */
export async function softDeletePost(
  supabase: SupabaseClient,
  postId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('posts')
      .update({ is_active: false })
      .eq('id', postId)
      .eq('user_id', userId)

    if (error) {
      console.error('게시글 Soft Delete 실패:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('게시글 Soft Delete 에러:', error)
    return { success: false, error: message }
  }
}

/**
 * 멘토 팁을 Soft Delete 처리
 */
export async function softDeleteMentorTip(
  supabase: SupabaseClient,
  tipId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('mentor_tips')
      .update({ is_active: false })
      .eq('id', tipId)
      .eq('user_id', userId)

    if (error) {
      console.error('멘토 팁 Soft Delete 실패:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('멘토 팁 Soft Delete 에러:', error)
    return { success: false, error: message }
  }
}

/**
 * 병원을 Soft Delete 처리 (관리자용)
 */
export async function softDeleteHospital(
  supabase: SupabaseClient,
  hospitalId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('hospitals')
      .update({ is_active: false })
      .eq('id', hospitalId)

    if (error) {
      console.error('병원 Soft Delete 실패:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('병원 Soft Delete 에러:', error)
    return { success: false, error: message }
  }
}

/**
 * 시술을 Soft Delete 처리 (관리자용)
 */
export async function softDeleteProcedure(
  supabase: SupabaseClient,
  procedureId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('procedures')
      .update({ is_active: false })
      .eq('id', procedureId)

    if (error) {
      console.error('시술 Soft Delete 실패:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('시술 Soft Delete 에러:', error)
    return { success: false, error: message }
  }
}

/**
 * 병원 이벤트를 Soft Delete 처리 (관리자용)
 */
export async function softDeleteHospitalEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('hospital_events')
      .update({ is_active: false })
      .eq('id', eventId)

    if (error) {
      console.error('병원 이벤트 Soft Delete 실패:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('병원 이벤트 Soft Delete 에러:', error)
    return { success: false, error: message }
  }
}

