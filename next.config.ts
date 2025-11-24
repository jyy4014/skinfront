import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  // 서버 컴포넌트에서 제외할 패키지 (클라이언트 전용)
  serverExternalPackages: [
    '@tensorflow-models/face-landmarks-detection',
    '@tensorflow/tfjs',
    '@tensorflow/tfjs-core',
    '@tensorflow/tfjs-converter',
    'face-api.js',
    '@mediapipe/face_detection',
    '@mediapipe/face_mesh',
    '@mediapipe/camera_utils',
    'react-webcam',
  ],
  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
    // blob URL과 data URL은 unoptimized로 처리 (이미 최적화됨)
    unoptimized: false,
  },
};

export default nextConfig;
