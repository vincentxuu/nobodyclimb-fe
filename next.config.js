/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 排除 react-quill-new 從 server-side bundling，避免 SSR 預渲染錯誤
  serverExternalPackages: ['react-quill-new', 'quill'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
      },
      {
        protocol: 'https',
        hostname: 'r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'nobodyclimb.cc',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    unoptimized: false, // 啟用圖片優化
  },
  
  // 環境變量
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.nobodyclimb.cc/api/v1',
  },
}

module.exports = nextConfig
