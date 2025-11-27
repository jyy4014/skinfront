import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Soft Delete: is_active를 false로 업데이트
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id
    const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('userId')

    if (!postId) {
      return NextResponse.json(
        { error: '게시글 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // Soft Delete: is_active를 false로 업데이트
    const { data, error } = await supabase
      .from('posts')
      .update({ is_active: false })
      .eq('id', postId)
      .eq('user_id', userId) // 본인 것만 삭제 가능
      .select()

    if (error) {
      console.error('게시글 삭제 실패:', error)
      return NextResponse.json(
        { error: '게시글 삭제에 실패했습니다.', details: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없거나 삭제 권한이 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '게시글이 삭제되었습니다.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    console.error('게시글 삭제 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: message },
      { status: 500 }
    )
  }
}

