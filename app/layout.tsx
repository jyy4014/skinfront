import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "./providers/QueryProvider";
import ToastProvider from "./components/common/ToastProvider";
import { CameraPermissionProvider } from "./providers/CameraPermissionProvider";
import RootLayout from "./RootLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "피부 분석 앱 - AI 기반 시술 추천",
  description: "AI가 분석하는 당신의 피부, 맞춤형 시술을 추천받으세요",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootLayout geistSans={geistSans} geistMono={geistMono}>{children}</RootLayout>
}
