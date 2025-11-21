/**
 * 다운로드 폴더의 이미지 파일을 찾아서 품질 검사
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 다운로드 폴더 경로
const downloadsPath = join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads')
const targetFile = join(downloadsPath, '얼굴정면1.png')

console.log('=== 이미지 파일 검색 ===')
console.log(`다운로드 폴더: ${downloadsPath}`)
console.log(`대상 파일: ${targetFile}`)
console.log(`파일 존재 여부: ${existsSync(targetFile) ? '예' : '아니오'}`)

if (!existsSync(targetFile)) {
  console.log('\n파일을 찾을 수 없습니다. 다른 이름으로 검색 중...')
  
  // 대체 파일명 시도
  const alternatives = [
    '얼굴정면1.PNG',
    '얼굴정면.png',
    '얼굴.png',
  ]
  
  let found = false
  for (const alt of alternatives) {
    const altPath = join(downloadsPath, alt)
    if (existsSync(altPath)) {
      console.log(`대체 파일 발견: ${altPath}`)
      analyzeImage(altPath)
      found = true
      break
    }
  }
  
  if (!found) {
    console.log('\n사용 가능한 PNG 파일 목록:')
    try {
      const fs = await import('fs/promises')
      const files = await fs.readdir(downloadsPath)
      const pngFiles = files.filter(f => f.toLowerCase().endsWith('.png')).slice(0, 10)
      pngFiles.forEach(f => console.log(`  - ${f}`))
    } catch (err) {
      console.error('파일 목록 읽기 실패:', err.message)
    }
    process.exit(1)
  }
} else {
  analyzeImage(targetFile)
}

function analyzeImage(filePath) {
  try {
    const fileBuffer = readFileSync(filePath)
    const fileSize = fileBuffer.length
    
    console.log('\n=== 이미지 파일 정보 ===')
    console.log(`파일 경로: ${filePath}`)
    console.log(`파일 크기: ${(fileSize / 1024).toFixed(2)} KB`)
    console.log(`파일 크기 (바이트): ${fileSize.toLocaleString()}`)
    
    // 파일 시그니처 확인 (더 정확한 검사)
    const signature = fileBuffer.slice(0, 8)
    const signatureHex = Array.from(signature).map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
    console.log(`파일 시그니처 (첫 8바이트): ${signatureHex}`)
    
    // PNG 시그니처: 89 50 4E 47 0D 0A 1A 0A
    const isPNG = signature[0] === 0x89 && 
                  signature[1] === 0x50 && 
                  signature[2] === 0x4E && 
                  signature[3] === 0x47
    
    // JPEG 시그니처: FF D8 FF
    const isJPEG = signature[0] === 0xFF && signature[1] === 0xD8 && signature[2] === 0xFF
    
    console.log(`PNG 형식: ${isPNG ? '예' : '아니오'}`)
    console.log(`JPEG 형식: ${isJPEG ? '예' : '아니오'}`)
    
    if (isPNG) {
      // IHDR 청크에서 이미지 크기 추출
      let offset = 8
      let width = 0, height = 0, bitDepth = 0, colorType = 0
      
      while (offset < fileBuffer.length - 8) {
        const chunkLength = fileBuffer.readUInt32BE(offset)
        const chunkType = fileBuffer.slice(offset + 4, offset + 8).toString('ascii')
        
        if (chunkType === 'IHDR') {
          width = fileBuffer.readUInt32BE(offset + 8)
          height = fileBuffer.readUInt32BE(offset + 12)
          bitDepth = fileBuffer[offset + 16]
          colorType = fileBuffer[offset + 17]
          
          console.log(`\n=== 이미지 메타데이터 ===`)
          console.log(`너비: ${width}px`)
          console.log(`높이: ${height}px`)
          console.log(`비트 깊이: ${bitDepth}`)
          console.log(`컬러 타입: ${colorType} (0=Grayscale, 2=RGB, 6=RGBA)`)
          console.log(`해상도: ${width}x${height}`)
          console.log(`종횡비: ${(width / height).toFixed(2)}`)
          
          // 품질 추정
          const pixels = width * height
          const bytesPerPixel = fileSize / pixels
          console.log(`\n=== 품질 추정 ===`)
          console.log(`픽셀 수: ${pixels.toLocaleString()}`)
          console.log(`픽셀당 바이트: ${bytesPerPixel.toFixed(2)}`)
          
          const issues = []
          const recommendations = []
          
          if (bytesPerPixel < 0.5) {
            issues.push('파일 크기가 작습니다 (압축률이 높거나 품질이 낮을 수 있음)')
            recommendations.push('원본 해상도로 다시 촬영하거나 압축률을 낮춰주세요')
          } else if (bytesPerPixel > 3) {
            console.log(`✅ 파일 크기가 적절합니다.`)
          }
          
          if (width < 800 || height < 800) {
            issues.push(`해상도가 낮습니다 (${width}x${height}). 최소 800x800 권장.`)
            recommendations.push('더 높은 해상도로 촬영해주세요')
          } else {
            console.log(`✅ 해상도가 적절합니다.`)
          }
          
          if (width > 4000 || height > 4000) {
            console.log(`⚠️ 해상도가 매우 높습니다. 처리 시간이 오래 걸릴 수 있습니다.`)
          }
          
          if (issues.length > 0) {
            console.log(`\n=== 발견된 문제점 ===`)
            issues.forEach(issue => console.log(`⚠️ ${issue}`))
          }
          
          if (recommendations.length > 0) {
            console.log(`\n=== 권장사항 ===`)
            recommendations.forEach(rec => console.log(`💡 ${rec}`))
          }
          
          // 예상 품질 점수 추정
          let estimatedScore = 100
          if (width < 800 || height < 800) estimatedScore -= 20
          if (bytesPerPixel < 0.5) estimatedScore -= 15
          if (bytesPerPixel < 0.3) estimatedScore -= 10
          
          console.log(`\n=== 예상 품질 점수 (추정) ===`)
          console.log(`예상 점수: ${Math.max(0, estimatedScore)}점`)
          console.log(`\n⚠️ 실제 품질 점수는 선명도(Laplacian), 조명, 각도 등을 종합하여 계산됩니다.`)
          console.log(`브라우저에서 HTML 도구를 사용하여 정확한 분석을 수행하세요.`)
          
          break
        }
        
        offset += 8 + chunkLength + 4
        if (chunkLength > 1000000) break // 안전장치
      }
    } else if (isJPEG) {
      console.log('\n=== JPEG 파일 분석 ===')
      // JPEG는 SOF (Start of Frame) 마커에서 크기 정보 추출
      let offset = 2 // FF D8 이후
      let width = 0, height = 0
      
      while (offset < fileBuffer.length - 8) {
        // JPEG 마커 찾기 (FF XX)
        if (fileBuffer[offset] === 0xFF) {
          const marker = fileBuffer[offset + 1]
          
          // SOF 마커들 (Start of Frame)
          // 0xC0-0xC3: Baseline, Extended Sequential, Progressive, Lossless
          if (marker >= 0xC0 && marker <= 0xC3) {
            const segmentLength = (fileBuffer[offset + 2] << 8) | fileBuffer[offset + 3]
            height = (fileBuffer[offset + 5] << 8) | fileBuffer[offset + 6]
            width = (fileBuffer[offset + 7] << 8) | fileBuffer[offset + 8]
            
            console.log(`\n=== 이미지 메타데이터 ===`)
            console.log(`너비: ${width}px`)
            console.log(`높이: ${height}px`)
            console.log(`해상도: ${width}x${height}`)
            console.log(`종횡비: ${(width / height).toFixed(2)}`)
            
            // 품질 추정
            const pixels = width * height
            const bytesPerPixel = fileSize / pixels
            console.log(`\n=== 품질 추정 ===`)
            console.log(`픽셀 수: ${pixels.toLocaleString()}`)
            console.log(`픽셀당 바이트: ${bytesPerPixel.toFixed(2)}`)
            
            const issues = []
            const recommendations = []
            
            if (bytesPerPixel < 0.3) {
              issues.push('파일 크기가 매우 작습니다 (압축률이 매우 높거나 품질이 낮을 수 있음)')
              recommendations.push('JPEG 품질을 높여서 다시 저장하거나 원본으로 촬영해주세요')
            } else if (bytesPerPixel < 0.5) {
              issues.push('파일 크기가 작습니다 (압축률이 높을 수 있음)')
              recommendations.push('JPEG 품질을 높여서 다시 저장해주세요')
            } else if (bytesPerPixel > 2) {
              console.log(`✅ 파일 크기가 적절합니다.`)
            }
            
            // 얼굴 분석에는 600-700px 정도면 충분하지만, 여유를 두고 700px로 설정
            if (width < 700 || height < 700) {
              issues.push(`해상도가 낮습니다 (${width}x${height}). 최소 700x700 권장.`)
              recommendations.push('더 높은 해상도로 촬영해주세요')
            } else {
              console.log(`✅ 해상도가 적절합니다.`)
            }
            
            if (width > 4000 || height > 4000) {
              console.log(`⚠️ 해상도가 매우 높습니다. 처리 시간이 오래 걸릴 수 있습니다.`)
            }
            
            if (issues.length > 0) {
              console.log(`\n=== 발견된 문제점 ===`)
              issues.forEach(issue => console.log(`⚠️ ${issue}`))
            }
            
            if (recommendations.length > 0) {
              console.log(`\n=== 권장사항 ===`)
              recommendations.forEach(rec => console.log(`💡 ${rec}`))
            }
            
            // 예상 품질 점수 추정
            let estimatedScore = 100
            // 700px 미만이면 감점, 600px 미만이면 더 큰 감점
            if (width < 600 || height < 600) estimatedScore -= 25
            else if (width < 700 || height < 700) estimatedScore -= 10
            if (bytesPerPixel < 0.3) estimatedScore -= 20
            else if (bytesPerPixel < 0.5) estimatedScore -= 15
            
            console.log(`\n=== 예상 품질 점수 (추정) ===`)
            console.log(`예상 점수: ${Math.max(0, estimatedScore)}점`)
            console.log(`\n⚠️ 실제 품질 점수는 선명도(Laplacian), 조명, 각도 등을 종합하여 계산됩니다.`)
            console.log(`브라우저에서 HTML 도구를 사용하여 정확한 분석을 수행하세요.`)
            
            break
          }
          
          // 마커에 따라 세그먼트 길이 건너뛰기
          if (marker === 0xD8 || marker === 0xD9) {
            offset += 2
          } else if (marker >= 0xE0 && marker <= 0xEF) {
            // APP 마커 (애플리케이션 데이터)
            const segmentLength = (fileBuffer[offset + 2] << 8) | fileBuffer[offset + 3]
            offset += 2 + segmentLength
          } else if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
            // SOF 마커 (이미 위에서 처리)
            const segmentLength = (fileBuffer[offset + 2] << 8) | fileBuffer[offset + 3]
            offset += 2 + segmentLength
          } else {
            offset += 2
          }
        } else {
          offset++
        }
        
        if (offset > 10000) break // 안전장치 (일반적으로 SOF는 처음 10KB 내에 있음)
      }
      
      if (width === 0 || height === 0) {
        console.log('\nJPEG 크기 정보를 추출할 수 없습니다.')
        console.log('브라우저에서 HTML 도구를 사용하여 정확한 분석을 수행하세요.')
      }
    } else {
      console.log('\n알 수 없는 이미지 형식입니다.')
      console.log('파일 확장자는 .png이지만 실제 형식이 다를 수 있습니다.')
      console.log('브라우저에서 HTML 도구를 사용하여 정확한 분석을 수행하세요.')
    }
    
  } catch (error) {
    console.error('파일 분석 실패:', error.message)
    process.exit(1)
  }
}

