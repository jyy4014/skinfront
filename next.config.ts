import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  // analyze 페이지는 동적 렌더링 (prerender 방지)
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
