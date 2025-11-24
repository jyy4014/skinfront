'use client'

import { usePathname } from 'next/navigation'
import QueryProvider from "./providers/QueryProvider";
import ToastProvider from "./components/common/ToastProvider";
import BottomNav from "./components/common/BottomNav";

interface RootLayoutProps {
  children: React.ReactNode;
  fontVariable: string;
}

export default function RootLayout({ children, fontVariable }: RootLayoutProps) {
  const pathname = usePathname()
  const shouldShowBottomNav = !pathname.startsWith('/report') && !pathname.startsWith('/hospital')

  return (
    <html lang="ko" className="scrollbar-hide">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#121212" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${fontVariable} antialiased`}>
        <div className="mobile-container">
          <QueryProvider>
            <ToastProvider>
              {children}
              {shouldShowBottomNav && <BottomNav />}
            </ToastProvider>
          </QueryProvider>
        </div>
      </body>
    </html>
  );
}

