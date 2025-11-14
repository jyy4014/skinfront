# 📱 앱 권한 가이드

이 문서는 피부 분석 앱에서 필요한 모든 권한과 그 사용 목적을 설명합니다.

---

## 🔐 필수 권한

### 1. **카메라 권한** ✅ (구현 완료)

**목적**: 사용자의 얼굴 사진을 촬영하기 위해 필요

**사용 위치**:
- `app/features/analyze/hooks/useCameraPermission.ts` - 권한 확인 및 요청
- `app/features/analyze/hooks/useCameraCapture.ts` - 카메라 스트림 접근
- `app/features/analyze/components/ImageUploadSection.tsx` - 권한 상태에 따른 UI 표시

**요청 방법**:
```typescript
// 권한 확인
const { permissionStatus, hasCamera, requestPermission } = useCameraPermission()

// 권한 요청
await requestPermission()
```

**권한 상태**:
- `prompt`: 권한 요청 전 (기본 상태)
- `granted`: 권한 허용됨
- `denied`: 권한 거부됨
- `unavailable`: 카메라 장치 없음

**브라우저 호환성**:
- Chrome/Edge: `navigator.permissions.query({ name: 'camera' })` 지원
- Safari: 권한 API 미지원, `getUserMedia` 직접 호출로 확인
- Firefox: 권한 API 지원

**사용자 안내**:
- 권한 거부 시: "브라우저 설정에서 카메라 권한을 허용해주세요"
- 카메라 없음: "카메라를 찾을 수 없습니다"

---

### 2. **파일 접근 권한** ✅ (브라우저 기본)

**목적**: 갤러리에서 사진을 선택하기 위해 필요

**사용 위치**:
- `app/features/analyze/components/ImageUploadSection.tsx` - 파일 input 사용
- `app/features/upload/UploadForm.tsx` - 파일 업로드 폼

**요청 방법**:
```html
<!-- HTML5 File API 사용 (권한 요청 자동) -->
<input type="file" accept="image/*" />
```

**특징**:
- 브라우저가 자동으로 파일 선택 다이얼로그 표시
- 별도의 권한 API 호출 불필요
- 사용자가 파일을 선택할 때만 접근

**제한 사항**:
- 모바일: 갤러리 접근만 가능 (카메라 직접 접근은 별도 권한 필요)
- 데스크톱: 파일 시스템 접근 가능

---

## 🌐 네트워크 권한

**목적**: API 호출 및 이미지 업로드를 위해 필요

**사용 위치**:
- Supabase API 호출 (`lib/supabaseClient.ts`)
- Edge Functions 호출 (`lib/api/edge-functions.ts`)
- 이미지 업로드 (`app/features/analysis/hooks/useImageUpload.ts`)

**특징**:
- 브라우저가 자동으로 네트워크 접근 허용
- 별도의 권한 요청 불필요
- CORS 정책에 따라 제한될 수 있음

**보안 고려사항**:
- HTTPS 필수 (프로덕션)
- API 키는 클라이언트에 노출되므로 `anon` 키만 사용
- 민감한 작업은 Edge Functions에서 처리

---

## 💾 저장소 권한 (선택적)

### 로컬 스토리지 (LocalStorage)

**목적**: 사용자 설정, 캐시 데이터 저장

**사용 위치**:
- 인증 토큰 저장 (Supabase 자동 처리)
- 사용자 설정 저장 (향후 구현)

**특징**:
- 브라우저가 자동으로 접근 허용
- 도메인별로 격리됨
- 최대 5-10MB 제한

**보안 고려사항**:
- 민감한 정보 저장 금지
- 토큰은 Supabase가 자동 관리

### 세션 스토리지 (SessionStorage)

**목적**: 세션 동안만 유지되는 임시 데이터

**사용 위치**:
- 현재 구현에서는 사용하지 않음 (향후 필요 시)

---

## 🔔 알림 권한 (향후 구현)

**목적**: 분석 완료, 결과 알림 등 푸시 알림

**현재 상태**: 미구현

**예상 사용 위치**:
- 분석 완료 알림
- 시술 추천 알림
- 피부 상태 변화 알림

**요청 방법** (향후 구현):
```typescript
// 알림 권한 요청
const permission = await Notification.requestPermission()

if (permission === 'granted') {
  // 알림 표시 가능
}
```

**브라우저 호환성**:
- Chrome/Edge: 지원
- Safari: macOS/iOS에서 제한적 지원
- Firefox: 지원

---

## 🚫 사용하지 않는 권한

### 위치 권한 (GPS)
- **이유**: 피부 분석에 위치 정보 불필요
- **상태**: 사용하지 않음

### 마이크 권한
- **이유**: 오디오 입력 불필요
- **상태**: 사용하지 않음

### 블루투스 권한
- **이유**: 하드웨어 연동 불필요
- **상태**: 사용하지 않음

---

## 📋 권한 요청 전략

### 1. **점진적 권한 요청**
- 사용자가 기능을 사용하려고 할 때만 권한 요청
- 초기 로드 시 일괄 요청 금지

### 2. **명확한 안내**
- 권한이 필요한 이유 설명
- 권한 거부 시 대안 제시 (갤러리 업로드)

### 3. **권한 상태 표시**
- 현재 권한 상태를 UI에 표시
- 권한 거부 시 설정 변경 안내

### 4. **에러 처리**
- 권한 거부 시 친절한 에러 메시지
- 대안 기능 제공 (갤러리 업로드)

---

## 🔒 보안 및 개인정보 보호

### 권한 사용 원칙
1. **최소 권한 원칙**: 필요한 최소한의 권한만 요청
2. **투명성**: 권한 사용 목적 명확히 안내
3. **사용자 제어**: 언제든지 권한 취소 가능

### 개인정보 보호
- 카메라로 촬영한 이미지는 Supabase Storage에 암호화 저장
- 사용자가 언제든지 이미지 삭제 가능
- 이미지는 AI 분석 후 즉시 삭제 가능 (사용자 선택)

---

## 📱 모바일 앱 (PWA) 권한

### Android (manifest.json)
```json
{
  "permissions": [
    "camera",
    "android.permission.CAMERA"
  ]
}
```

### iOS (Info.plist)
```xml
<key>NSCameraUsageDescription</key>
<string>피부 분석을 위해 얼굴 사진을 촬영합니다.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>갤러리에서 사진을 선택합니다.</string>
```

---

## 🧪 테스트 체크리스트

- [ ] 카메라 권한 요청 정상 작동
- [ ] 권한 거부 시 적절한 안내 메시지 표시
- [ ] 권한 허용 후 카메라 정상 작동
- [ ] 갤러리 파일 선택 정상 작동
- [ ] 네트워크 오류 시 적절한 에러 처리
- [ ] 권한 상태 변경 감지 (브라우저 설정에서 변경 시)

---

## 📚 참고 자료

- [MDN: Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)
- [MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Web.dev: Permissions](https://web.dev/permissions/)
- [Supabase: Storage Security](https://supabase.com/docs/guides/storage/security)

