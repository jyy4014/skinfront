'use client'

import { usePathname } from 'next/navigation'
import QueryProvider from "./providers/QueryProvider";
import ToastProvider from "./components/common/ToastProvider";
import BottomNav from "./components/common/BottomNav";
import GlobalScanModal from "./components/common/GlobalScanModal";

interface RootLayoutProps {
  children: React.ReactNode;
  fontVariable: string;
}

export default function RootLayout({ children, fontVariable }: RootLayoutProps) {
  const pathname = usePathname()
  
  // 하단 네비게이션 숨김 조건:
  // 1. /report, /hospital 경로
  // 2. /community/write (글쓰기 페이지)
  // 3. /community/[id] (상세 페이지 - 경로 깊이가 2보다 큰 경우)
  const isCommunityDetailPage = pathname.startsWith('/community/') && pathname.split('/').length > 2
  const shouldShowBottomNav = 
    !pathname.startsWith('/report') && 
    !pathname.startsWith('/hospital') && 
    !isCommunityDetailPage

  return (
    <html lang="ko" className="scrollbar-hide">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#121212" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={`${fontVariable} antialiased`}>
        <div className="mobile-container">
          <QueryProvider>
            <ToastProvider>
              {children}
              {shouldShowBottomNav && <BottomNav />}
              <GlobalScanModal />
            </ToastProvider>
          </QueryProvider>
        </div>
      </body>
    </html>
  );
}

