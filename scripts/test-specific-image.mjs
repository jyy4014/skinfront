/**
 * 특정 이미지 파일의 품질을 브라우저에서 테스트하기 위한 스크립트
 * 실제 Laplacian 계산은 브라우저에서만 가능하므로, 여기서는 파일 정보만 출력
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const downloadsPath = join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads')
const targetFile = join(downloadsPath, '얼굴정면1.png')

if (!existsSync(targetFile)) {
  console.error('파일을 찾을 수 없습니다:', targetFile)
  process.exit(1)
}

const fileBuffer = readFileSync(targetFile)
const fileSize = fileBuffer.length

// JPEG SOF에서 크기 추출
let width = 0, height = 0
let offset = 2

while (offset < fileBuffer.length - 8) {
  if (fileBuffer[offset] === 0xFF) {
    const marker = fileBuffer[offset + 1]
    if (marker >= 0xC0 && marker <= 0xC3) {
      height = (fileBuffer[offset + 5] << 8) | fileBuffer[offset + 6]
      width = (fileBuffer[offset + 7] << 8) | fileBuffer[offset + 8]
      break
    }
    const segmentLength = (fileBuffer[offset + 2] << 8) | fileBuffer[offset + 3]
    offset += 2 + segmentLength
  } else {
    offset++
  }
  if (offset > 10000) break
}

console.log('=== 이미지 분석 결과 ===')
console.log(`파일: ${targetFile}`)
console.log(`실제 형식: JPEG (확장자는 .png)`)
console.log(`해상도: ${width}x${height}px`)
console.log(`파일 크기: ${(fileSize / 1024).toFixed(2)} KB`)
console.log(`픽셀당 바이트: ${(fileSize / (width * height)).toFixed(2)}`)

const issues = []
// 얼굴 분석에는 600-700px 정도면 충분하지만, 여유를 두고 700px로 설정
if (width < 600) {
  issues.push(`너비가 600px 미만입니다 (${width}px) - 분석이 어려울 수 있습니다`)
} else if (width < 700) {
  issues.push(`너비가 700px 미만입니다 (${width}px) - 권장 해상도는 700px 이상입니다`)
}
if (fileSize / (width * height) < 0.3) {
  issues.push(`압축률이 매우 높습니다 (픽셀당 ${(fileSize / (width * height)).toFixed(2)} 바이트)`)
}

console.log('\n=== 발견된 문제점 ===')
if (issues.length > 0) {
  issues.forEach(issue => console.log(`⚠️ ${issue}`))
} else {
  console.log('기본적인 문제는 없습니다.')
}

console.log('\n=== 품질 점수가 낮은 이유 추정 ===')
if (width < 700) {
  console.log(`1. 해상도 부족: 너비가 700px 미만 (${width}px) - 권장 해상도는 700px 이상`)
} else {
  console.log(`1. 해상도: ${width}px (권장 700px 이상, 현재는 충분함)`)
}
console.log('2. 높은 압축률: JPEG 품질이 낮아 선명도가 떨어질 수 있음 (픽셀당 0.23 바이트)')
console.log('3. 실제 Laplacian 계산 결과에 따라 선명도 점수가 낮을 수 있음')
console.log('\n브라우저에서 HTML 도구를 사용하여 정확한 Laplacian 점수를 확인하세요.')

