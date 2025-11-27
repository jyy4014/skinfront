import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

interface MentorTipRow {
  id: string
  user_id: string
  skin_score: number
  primary_concern: string
  procedure_name: string | null
  comment: string
  before_image_url: string | null
  after_image_url: string | null
  is_hospital_verified: boolean | null
  visit_count: number | null
  verified_hospital_name: string | null
}

interface ProfileRow {
  id: string
  birth_year: number | null
  gender: string | null
  is_active: boolean | null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { primaryConcern, myScore } = body

    // 필수 필드 검증
    if (!primaryConcern || myScore === undefined) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // mentor_tips 테이블에서 매칭된 팁 찾기
    const supabase = getSupabaseClient()

    // 조건: 같은 고민, 나보다 점수 높은 것, 점수 높은 순으로 정렬
    const { data: tips, error } = await supabase
      .from('mentor_tips')
      .select(`
        *,
        profiles:user_id (
          id,
          birth_year,
          gender,
          is_active
        )
      `)
      .eq('primary_concern', primaryConcern)
      .gt('skin_score', myScore)
      .eq('is_active', true) // 활성화된 팁만 조회
      .order('skin_score', { ascending: false })
      .limit(1)

    if (error) {
      console.error('멘토 팁 조회 실패:', error)
      return NextResponse.json(
        { error: '멘토 팁 조회에 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }

    if (!tips || tips.length === 0) {
      return NextResponse.json({
        success: false,
        message: '매칭된 멘토가 없습니다.',
      })
    }

    const tip = tips[0] as MentorTipRow & { profiles: ProfileRow | null }
    const profile = tip.profiles

    // 나이 계산 (birth_year 사용)
    let age: number | null = null
    if (profile?.birth_year) {
      const currentYear = new Date().getFullYear()
      age = currentYear - profile.birth_year
    }

    // 활성화된 프로필만 반환
    if (!profile?.is_active) {
      return NextResponse.json({
        success: false,
        message: '매칭된 멘토가 없습니다.',
      })
    }

    return NextResponse.json({
      success: true,
      mentor: {
        id: tip.id,
        age: age,
        gender: profile?.gender || null,
        matchRate: 93 + Math.floor(Math.random() * 7), // 93~99% (랜덤)
        score: tip.skin_score,
        concern: tip.primary_concern,
        treatment: tip.procedure_name || '시술',
        comment: tip.comment,
        beforeImageUrl: tip.before_image_url || null,
        afterImageUrl: tip.after_image_url || null,
        isHospitalVerified: tip.is_hospital_verified || false,
        visitCount: tip.visit_count || 0,
        verifiedHospitalName: tip.verified_hospital_name || null,
        satisfaction: 85 + Math.floor(Math.random() * 10), // 85~94%
        sessions: 3 + Math.floor(Math.random() * 3), // 3~5회
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    console.error('멘토 팁 조회 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: message },
      { status: 500 }
    )
  }
}

