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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, skinScore, primaryConcern, procedureName, comment, beforeImageUrl, afterImageUrl, isHospitalVerified, visitCount, verifiedHospitalName } = body

    // 필수 필드 검증
    if (!userId || !skinScore || !primaryConcern || !comment) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // mentor_tips 테이블에 INSERT
    const { data, error } = await supabase
      .from('mentor_tips')
      .insert({
        user_id: userId,
        skin_score: skinScore,
        primary_concern: primaryConcern,
        procedure_name: procedureName || null,
        comment: comment,
        before_image_url: beforeImageUrl || null,
        after_image_url: afterImageUrl || null,
        is_hospital_verified: isHospitalVerified || false,
        visit_count: visitCount || 0,
        verified_hospital_name: verifiedHospitalName || null,
        likes_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('멘토 팁 등록 실패:', error)
      return NextResponse.json(
        { error: '멘토 팁 등록에 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tip: data,
      message: '멘토 팁이 등록되었습니다!',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    console.error('멘토 팁 등록 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: message },
      { status: 500 }
    )
  }
}

