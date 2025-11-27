import { NextRequest, NextResponse } from 'next/server'
import { getGeminiModel, SKIN_ANALYSIS_PROMPT } from '@/lib/gemini'
import { createClient } from '@/lib/supabase/server'


export async function POST(request: NextRequest) {
  console.log('[ANALYZE API] ===== 분석 요청 시작 =====')
  console.log('[ANALYZE API] 요청 헤더:', Object.fromEntries(request.headers.entries()))

  // 고유 분석 ID 생성 (실시간 진행 추적용)
  const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  console.log('[ANALYZE API] 분석 ID:', analysisId)

  try {
    // API 키 검증
    console.log('[ANALYZE API] GEMINI_API_KEY 존재 여부:', !!process.env.GEMINI_API_KEY)
    if (!process.env.GEMINI_API_KEY) {
      console.error('[ANALYZE API] GEMINI_API_KEY가 설정되지 않음')
      return NextResponse.json(
        { error: '서버 설정 오류: GEMINI_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 요청 본문 파싱
    console.log('[ANALYZE API] 요청 본문 파싱 시작')
    const body = await request.json()
    const { image: base64Image, userId, analysisId } = body

    console.log('[ANALYZE API] 분석 요청 데이터:', {
      hasImage: !!base64Image,
      userId: userId || 'anonymous',
      analysisId: analysisId || 'not_provided'
    })

    console.log('[ANALYZE API] 요청 데이터:', {
      hasImage: !!base64Image,
      imageLength: base64Image?.length || 0,
      userId: userId || 'anonymous',
      imagePreview: base64Image?.substring(0, 50) + '...'
    })

    if (!base64Image) {
      console.error('[ANALYZE API] 이미지가 제공되지 않음')
      return NextResponse.json(
        { error: '이미지가 제공되지 않았습니다.' },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createClient()

    // ============================================
    // 1. 이미지 업로드 (Storage)
    // ============================================
    console.log('[ANALYZE API] ===== 1단계: 이미지 처리 시작 =====')

    const mimeTypeMatch = base64Image.match(/^data:image\/(jpeg|jpg|png|webp);base64,/)
    const mimeType = mimeTypeMatch
      ? `image/${mimeTypeMatch[1] === 'jpg' ? 'jpeg' : mimeTypeMatch[1]}`
      : 'image/jpeg'

    console.log('[ANALYZE API] MIME 타입 분석:', { mimeTypeMatch, mimeType })

    // base64를 Blob으로 변환
    const base64Data = base64Image.replace(/^data:image\/(jpeg|jpg|png|webp);base64,/, '')
    const byteCharacters = Buffer.from(base64Data, 'base64')
    const fileExtension = mimeTypeMatch?.[1] || 'jpg'

    console.log('[ANALYZE API] Base64 변환:', {
      originalLength: base64Image.length,
      dataLength: base64Data.length,
      bufferLength: byteCharacters.length,
      fileExtension
    })

    // 파일명 생성 (타임스탬프 + 랜덤 문자열)
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileName = userId
      ? `${userId}/${timestamp}-${randomString}.${fileExtension}`
      : `anonymous/${timestamp}-${randomString}.${fileExtension}`

    console.log('[ANALYZE API] 파일명 생성:', fileName)

    // Storage에 업로드
    console.log('[ANALYZE API] Supabase Storage 업로드 시작')
    const { error: uploadError } = await supabase.storage
      .from('skin-images')
      .upload(fileName, byteCharacters, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      console.error('[ANALYZE API] Storage 업로드 에러:', uploadError)
      return NextResponse.json(
        { error: '이미지 업로드 중 오류가 발생했습니다.', details: uploadError.message },
        { status: 500 }
      )
    }

    console.log('[ANALYZE API] Storage 업로드 성공')

    // 업로드된 파일의 Public URL 가져오기
    const { data: urlData } = supabase.storage
      .from('skin-images')
      .getPublicUrl(fileName)

    const imageUrl = urlData.publicUrl
    console.log('[ANALYZE API] Public URL 생성:', imageUrl)

    // ============================================
    // 2. AI 분석 (Gemini)
    // ============================================
    console.log('[ANALYZE API] ===== 2단계: AI 분석 시작 =====')

    // 실시간 진행 상태 업데이트를 위한 함수
    const updateProgress = async (stage: string, progress: number, message: string) => {
      console.log(`[ANALYZE API] PROGRESS: ${stage} - ${progress}% - ${message}`)

      // analysisId가 제공된 경우에만 진행 상태 업데이트
      if (analysisId) {
        try {
          // 진행 상태를 별도 API로 전송 (비동기로 처리, 실패해도 분석 계속 진행)
          await fetch(`${request.nextUrl.origin}/api/analyze/progress`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              analysisId,
              stage,
              progress,
              message,
            }),
          }).catch(err => console.warn('[ANALYZE API] Progress update failed:', err))
        } catch (error) {
          // 진행 상태 업데이트 실패해도 분석은 계속 진행
          console.warn('[ANALYZE API] Progress update error:', error)
        }
      }
    }

    updateProgress('preparation', 10, 'AI 모델 준비 중...')

    // Gemini가 이해할 수 있는 포맷으로 변환 (이미 base64Data는 위에서 추출됨)
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    }

    console.log('[ANALYZE API] Gemini 입력 데이터 준비:', {
      promptLength: SKIN_ANALYSIS_PROMPT.length,
      imageDataLength: base64Data.length,
      mimeType
    })

    // Gemini 모델 인스턴스 생성
    console.log('[ANALYZE API] Gemini 모델 인스턴스 생성')
    const model = getGeminiModel()

    // Gemini API 호출
    console.log('[ANALYZE API] Gemini API 호출 시작')
    let text: string
    try {
      updateProgress('analysis', 50, '피부 특징 분석 중...')

      const result = await model.generateContent([SKIN_ANALYSIS_PROMPT, imagePart])
      console.log('[ANALYZE API] Gemini API 호출 성공')

      updateProgress('analysis', 70, '분석 결과 처리 중...')

      const response = await result.response
      console.log('[ANALYZE API] Response 객체 수신')

      text = await response.text()
      console.log('[ANALYZE API] 텍스트 응답 수신, 길이:', text.length)
      console.log('[ANALYZE API] Gemini 원본 응답 (처음 500자):', text.substring(0, 500))

      updateProgress('processing', 80, '결과 정리 중...')

    } catch (geminiError) {
      console.error('[ANALYZE API] Gemini API 호출 중 에러:', geminiError)
      throw geminiError // 상위 catch로 전달
    }

    // JSON 파싱 시도
    console.log('[ANALYZE API] ===== 3단계: JSON 파싱 시작 =====')
    updateProgress('processing', 85, '분석 데이터 파싱 중...')
    let analysisResult
    try {
      // 마크다운 코드블럭이나 불필요한 텍스트 제거
      const cleanedText = text
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()

      console.log('[ANALYZE API] 정제된 텍스트 (처음 300자):', cleanedText.substring(0, 300))

      analysisResult = JSON.parse(cleanedText)
      console.log('[ANALYZE API] JSON 파싱 성공:', {
        hasTotalScore: !!analysisResult.totalScore,
        hasDetails: !!analysisResult.details,
        hasPrimaryConcern: !!analysisResult.primaryConcern,
        hasAiComment: !!analysisResult.aiComment,
        recommendationsCount: analysisResult.recommendations?.length || 0
      })

    } catch (parseError) {
      console.error('[ANALYZE API] JSON 파싱 에러:', parseError)
      console.error('[ANALYZE API] 원본 응답 전체:', text)

      // 파싱 실패 시 기본 응답 반환
      return NextResponse.json(
        {
          error: '분석 결과를 파싱하는 중 오류가 발생했습니다.',
          rawResponse: text,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        },
        { status: 500 }
      )
    }

    // 응답 검증
    console.log('[ANALYZE API] 응답 데이터 검증')
    if (!analysisResult.totalScore || !analysisResult.details) {
      console.error('[ANALYZE API] 응답 검증 실패:', {
        totalScore: analysisResult.totalScore,
        details: analysisResult.details
      })
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
    console.log('[ANALYZE API] ===== 4단계: DB 저장 시작 =====')
    updateProgress('saving', 90, '결과 저장 중...')

    // userId가 있을 때만 DB에 저장 (RLS 정책상 user_id NOT NULL 필수)
    let reportId = null

    if (userId) {
      console.log('[ANALYZE API] 로그인 사용자 DB 저장 시도:', userId)

      const insertData = {
        user_id: userId,
        image_url: imageUrl,
        total_score: analysisResult.totalScore,
        primary_concern: analysisResult.primaryConcern,
        analysis_result: analysisResult.details,
        ai_comment: analysisResult.aiComment, // 필드명 변경: doctorComment -> aiComment
        recommendations: analysisResult.recommendations, // 시술 추천 저장
        is_active: true, // Soft Delete를 위한 활성화 상태
      }

      console.log('[ANALYZE API] DB 삽입 데이터:', insertData)

      const { data: dbData, error: dbError } = await supabase
        .from('skin_reports')
        .insert(insertData)
        .select('id')
        .single()

      if (dbError) {
        console.error('[ANALYZE API] DB 저장 에러:', dbError)
        // DB 저장 실패해도 분석 결과는 반환 (이미지 업로드는 성공했으므로)
      } else {
        reportId = dbData.id
        console.log('[ANALYZE API] DB 저장 성공, reportId:', reportId)
      }
    } else {
      console.log('[ANALYZE API] 비로그인 사용자: DB 저장 생략')
    }

    // ============================================
    // 4. 응답 반환 (reportId 포함)
    // ============================================
    console.log('[ANALYZE API] ===== 최종 응답 반환 =====')
    updateProgress('complete', 100, '분석 완료!')
    const finalResponse = {
      ...analysisResult,
      reportId,
      imageUrl,
      saved: reportId !== null,
    }

    console.log('[ANALYZE API] 최종 응답 데이터:', {
      totalScore: finalResponse.totalScore,
      primaryConcern: finalResponse.primaryConcern,
      reportId: finalResponse.reportId,
      saved: finalResponse.saved,
      recommendationsCount: finalResponse.recommendations?.length || 0
    })

    return NextResponse.json(finalResponse, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('[ANALYZE API] ❌ 전체 프로세스 에러:', error)
    console.error('[ANALYZE API] 에러 스택:', error instanceof Error ? error.stack : '스택 정보 없음')

    return NextResponse.json(
      {
        error: '피부 분석 중 오류가 발생했습니다.',
        message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

