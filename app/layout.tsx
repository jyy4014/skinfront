import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import RootLayout from "./RootLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
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
  return <RootLayout fontVariable={inter.variable}>{children}</RootLayout>
}
