# 피부 분석 앱 - 프론트엔드

Next.js 기반 프론트엔드 애플리케이션입니다.

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. 개발 서버 실행

```bash
npm run dev
```

프론트엔드가 `http://localhost:3000`에서 실행됩니다.

## 📁 프로젝트 구조

```
skinfront/
├── app/              # Next.js 앱 라우트
│   ├── auth/         # 인증 페이지
│   ├── onboarding/   # 온보딩
│   ├── home/         # 홈 화면
│   ├── analyze/      # 분석 화면
│   ├── analysis/     # 분석 결과 상세
│   ├── treatments/   # 시술 상세
│   └── profile/      # 마이페이지
├── lib/              # 유틸리티 및 Supabase 클라이언트
├── public/           # 정적 파일
└── package.json
```

## 🛠 기술 스택

- **Framework**: Next.js 16
- **Language**: TypeScript
- **UI**: React 19
- **스타일링**: Tailwind CSS
- **애니메이션**: Framer Motion
- **아이콘**: Lucide React

