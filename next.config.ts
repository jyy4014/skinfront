import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  // 서버 컴포넌트에서 제외할 패키지 (클라이언트 전용)
  serverComponentsExternalPackages: [
    '@tensorflow-models/face-landmarks-detection',
    '@tensorflow/tfjs',
    '@tensorflow/tfjs-core',
    '@tensorflow/tfjs-converter',
    'face-api.js',
    '@mediapipe/face_detection',
    '@mediapipe/face_mesh',
  ],
};

export default nextConfig;
