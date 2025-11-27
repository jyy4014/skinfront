import { NextRequest, NextResponse } from 'next/server'
import { getGeminiModel, SKIN_ANALYSIS_PROMPT } from '@/lib/gemini'
import { createSupabaseServerClient } from '@/lib/supabase/server'


export async function POST(request: NextRequest) {
  try {
    // API 키 검증
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: '서버 설정 오류: GEMINI_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 요청 본문 파싱
    const body = await request.json()
    const { image: base64Image, userId } = body

    if (!base64Image) {
      return NextResponse.json(
        { error: '이미지가 제공되지 않았습니다.' },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createSupabaseServerClient()

    // ============================================
    // 1. 이미지 업로드 (Storage)
    // ============================================
    const mimeTypeMatch = base64Image.match(/^data:image\/(jpeg|jpg|png|webp);base64,/)
    const mimeType = mimeTypeMatch 
      ? `image/${mimeTypeMatch[1] === 'jpg' ? 'jpeg' : mimeTypeMatch[1]}`
      : 'image/jpeg'

    // base64를 Blob으로 변환
    const base64Data = base64Image.replace(/^data:image\/(jpeg|jpg|png|webp);base64,/, '')
    const byteCharacters = Buffer.from(base64Data, 'base64')
    const fileExtension = mimeTypeMatch?.[1] || 'jpg'
    
    // 파일명 생성 (타임스탬프 + 랜덤 문자열)
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileName = userId 
      ? `${userId}/${timestamp}-${randomString}.${fileExtension}`
      : `anonymous/${timestamp}-${randomString}.${fileExtension}`

    // Storage에 업로드
    const { error: uploadError } = await supabase.storage
      .from('skin-images')
      .upload(fileName, byteCharacters, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage 업로드 에러:', uploadError)
      return NextResponse.json(
        { error: '이미지 업로드 중 오류가 발생했습니다.', details: uploadError.message },
        { status: 500 }
      )
    }

    // 업로드된 파일의 Public URL 가져오기
    const { data: urlData } = supabase.storage
      .from('skin-images')
      .getPublicUrl(fileName)

    const imageUrl = urlData.publicUrl

    // ============================================
    // 2. AI 분석 (Gemini)
    // ============================================

    // Gemini가 이해할 수 있는 포맷으로 변환 (이미 base64Data는 위에서 추출됨)
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    }

    // Gemini 모델 인스턴스 생성
    const model = getGeminiModel()

    // Gemini API 호출
    const result = await model.generateContent([SKIN_ANALYSIS_PROMPT, imagePart])
    const response = await result.response
    const text = await response.text()

    // JSON 파싱 시도
    let analysisResult
    try {
      // 마크다운 코드블럭이나 불필요한 텍스트 제거
      const cleanedText = text
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()

      analysisResult = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('JSON 파싱 에러:', parseError)
      console.error('원본 응답:', text)
      
      // 파싱 실패 시 기본 응답 반환
      return NextResponse.json(
        {
          error: '분석 결과를 파싱하는 중 오류가 발생했습니다.',
          rawResponse: text,
        },
        { status: 500 }
      )
    }

    // 응답 검증
    if (!analysisResult.totalScore || !analysisResult.details) {
      return NextResponse.json(
        {
          error: '분석 결과 형식이 올바르지 않습니다.',
          rawResponse: text,
        },
        { status: 500 }
      )
    }

    // recommendations가 없으면 기본값 추가
    if (!analysisResult.recommendations || !Array.isArray(analysisResult.recommendations)) {
      console.warn('AI가 recommendations를 반환하지 않음, 기본값 사용')
      analysisResult.recommendations = []
    }

    // ============================================
    // 3. DB 저장 (skin_reports 테이블)
    // ============================================
    // userId가 있을 때만 DB에 저장 (RLS 정책상 user_id NOT NULL 필수)
    let reportId = null
    
    if (userId) {
      const { data: dbData, error: dbError } = await supabase
        .from('skin_reports')
        .insert({
          user_id: userId,
          image_url: imageUrl,
          total_score: analysisResult.totalScore,
          primary_concern: analysisResult.primaryConcern,
          analysis_result: analysisResult.details,
          ai_comment: analysisResult.aiComment, // 필드명 변경: doctorComment -> aiComment
          recommendations: analysisResult.recommendations, // 시술 추천 저장
          is_active: true, // Soft Delete를 위한 활성화 상태
        })
        .select('id')
        .single()

      if (dbError) {
        console.error('DB 저장 에러:', dbError)
        // DB 저장 실패해도 분석 결과는 반환 (이미지 업로드는 성공했으므로)
      } else {
        reportId = dbData.id
      }
    } else {
      console.log('비로그인 사용자: DB 저장 생략')
    }

    // ============================================
    // 4. 응답 반환 (reportId 포함)
    // ============================================
    return NextResponse.json(
      {
        ...analysisResult,
        reportId,
        imageUrl,
        saved: reportId !== null,
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('피부 분석 API 에러:', error)
    
    return NextResponse.json(
      {
        error: '피부 분석 중 오류가 발생했습니다.',
        message,
      },
      { status: 500 }
    )
  }
}

