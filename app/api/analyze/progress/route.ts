import { NextRequest, NextResponse } from 'next/server'

// 진행 상태를 저장할 메모리 저장소 (실제로는 Redis 등을 사용해야 함)
const progressStore = new Map<string, {
  stage: string
  progress: number
  message: string
  timestamp: number
}>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const analysisId = searchParams.get('id')

  if (!analysisId) {
    return new NextResponse('Analysis ID required', { status: 400 })
  }

  // Server-Sent Events 헤더 설정
  const responseStream = new ReadableStream({
    start(controller) {
      // 초기 연결 메시지
      const initialData = {
        stage: 'connecting',
        progress: 0,
        message: '분석 준비 중...',
        timestamp: Date.now()
      }

      controller.enqueue(`data: ${JSON.stringify(initialData)}\n\n`)

      // 주기적으로 진행 상태 확인
      const interval = setInterval(() => {
        const progress = progressStore.get(analysisId)

        if (progress) {
          const eventData = {
            ...progress,
            timestamp: Date.now()
          }

          controller.enqueue(`data: ${JSON.stringify(eventData)}\n\n`)

          // 완료된 경우 연결 종료
          if (progress.stage === 'complete') {
            controller.enqueue('event: complete\ndata: 분석 완료\n\n')
            controller.close()
            clearInterval(interval)
            progressStore.delete(analysisId)
          }
        }
      }, 1000) // 1초마다 체크

      // 연결 종료 시 정리
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}

// 진행 상태 업데이트를 위한 POST 엔드포인트
export async function POST(request: NextRequest) {
  try {
    const { analysisId, stage, progress, message } = await request.json()

    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 })
    }

    // 진행 상태 저장
    progressStore.set(analysisId, {
      stage,
      progress,
      message,
      timestamp: Date.now()
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Progress update error:', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}
