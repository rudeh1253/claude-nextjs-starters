import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/webp', 'image/avif'],
    // Notion 호스팅 이미지(커버/본문). 만료(약 1시간) 대응은 ISR 재검증으로 URL 을 갱신합니다.
    // 완전한 영구화(빌드 시 다운로드/프록시)는 후속 작업으로 둡니다. (F004)
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      {
        protocol: 'https',
        hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com',
      },
      { protocol: 'https', hostname: '*.notion.so' },
      { protocol: 'https', hostname: '*.notion-static.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

export default nextConfig
