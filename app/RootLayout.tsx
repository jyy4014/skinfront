import QueryProvider from "./providers/QueryProvider";
import ToastProvider from "./components/common/ToastProvider";
import { CameraPermissionProvider } from "./providers/CameraPermissionProvider";
import type { NextFontWithVariable } from "next/dist/compiled/@next/font";

interface RootLayoutProps {
  children: React.ReactNode;
  geistSans: NextFontWithVariable;
  geistMono: NextFontWithVariable;
}

export default function RootLayout({ children, geistSans, geistMono }: RootLayoutProps) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#ec4899" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <CameraPermissionProvider>
            <ToastProvider>{children}</ToastProvider>
          </CameraPermissionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

