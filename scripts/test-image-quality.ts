/**
 * 이미지 품질 검사 테스트 스크립트
 * 파일 경로를 받아서 품질 검사 결과를 출력
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// Node.js 환경에서 실행되므로 브라우저 API를 사용할 수 없음
// 대신 간단한 이미지 정보를 확인하는 스크립트

const filePath = process.argv[2] || join(process.env.USERPROFILE || '', 'Downloads', '얼굴정면1.png')

try {
  const fileBuffer = readFileSync(filePath)
  const fileSize = fileBuffer.length
  
  console.log('=== 이미지 파일 정보 ===')
  console.log(`파일 경로: ${filePath}`)
  console.log(`파일 크기: ${(fileSize / 1024).toFixed(2)} KB`)
  console.log(`파일 크기 (바이트): ${fileSize}`)
  
  // PNG 시그니처 확인
  const pngSignature = fileBuffer.slice(0, 8)
  const isPNG = pngSignature[0] === 0x89 && 
                pngSignature[1] === 0x50 && 
                pngSignature[2] === 0x4E && 
                pngSignature[3] === 0x47
  
  console.log(`PNG 형식: ${isPNG ? '예' : '아니오'}`)
  
  if (isPNG) {
    // IHDR 청크에서 이미지 크기 추출
    let offset = 8
    while (offset < fileBuffer.length - 8) {
      const chunkLength = fileBuffer.readUInt32BE(offset)
      const chunkType = fileBuffer.slice(offset + 4, offset + 8).toString('ascii')
      
      if (chunkType === 'IHDR') {
        const width = fileBuffer.readUInt32BE(offset + 8)
        const height = fileBuffer.readUInt32BE(offset + 12)
        const bitDepth = fileBuffer[offset + 16]
        const colorType = fileBuffer[offset + 17]
        const compression = fileBuffer[offset + 18]
        const filter = fileBuffer[offset + 19]
        const interlace = fileBuffer[offset + 20]
        
        console.log(`\n=== 이미지 메타데이터 ===`)
        console.log(`너비: ${width}px`)
        console.log(`높이: ${height}px`)
        console.log(`비트 깊이: ${bitDepth}`)
        console.log(`컬러 타입: ${colorType} (0=Grayscale, 2=RGB, 6=RGBA)`)
        console.log(`압축: ${compression}`)
        console.log(`필터: ${filter}`)
        console.log(`인터레이스: ${interlace}`)
        console.log(`해상도: ${width}x${height}`)
        console.log(`종횡비: ${(width / height).toFixed(2)}`)
        
        // 품질 추정 (파일 크기와 해상도 기반)
        const pixels = width * height
        const bytesPerPixel = fileSize / pixels
        console.log(`\n=== 품질 추정 ===`)
        console.log(`픽셀 수: ${pixels.toLocaleString()}`)
        console.log(`픽셀당 바이트: ${bytesPerPixel.toFixed(2)}`)
        
        if (bytesPerPixel < 0.5) {
          console.log(`⚠️ 파일 크기가 작습니다. 압축률이 높거나 품질이 낮을 수 있습니다.`)
        } else if (bytesPerPixel > 3) {
          console.log(`✅ 파일 크기가 적절합니다.`)
        }
        
        if (width < 800 || height < 800) {
          console.log(`⚠️ 해상도가 낮습니다. 최소 800x800 권장.`)
        } else {
          console.log(`✅ 해상도가 적절합니다.`)
        }
        
        break
      }
      
      offset += 8 + chunkLength + 4 // chunk length + type + data + CRC
    }
  }
  
} catch (error: any) {
  console.error('파일 읽기 실패:', error.message)
  console.log('\n사용법: ts-node scripts/test-image-quality.ts [파일경로]')
  process.exit(1)
}

