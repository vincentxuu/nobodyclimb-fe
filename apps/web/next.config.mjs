import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
import path from 'path'
import { fileURLToPath } from 'url'

initOpenNextCloudflareForDev()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),

  // 排除開發依賴和不需要的套件，減少 bundle 大小
  serverExternalPackages: [
    'jsdom',
    'isomorphic-dompurify',
  ],

  // 從 output file tracing 中排除開發依賴和未使用的套件
  outputFileTracingExcludes: {
    '*': [
      'node_modules/typescript/**',
      'node_modules/sass/**',
      'node_modules/babel-plugin-react-compiler/**',
      'node_modules/@babel/**',
      'node_modules/eslint/**',
      'node_modules/prettier/**',
      // 未使用的 @vercel/og (動態 OG 圖片生成) - 省約 1.4MB
      'node_modules/next/dist/compiled/@vercel/og/**',
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
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
        hostname: 'storage.nobodyclimb.cc',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    unoptimized: false, // 啟用圖片優化
  },

  // 環境變量會從 wrangler.json 或 .env.local 讀取
  // 生產環境: https://api.nobodyclimb.cc/api/v1
  // 開發環境: http://localhost:8000/api
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.nobodyclimb.cc/api/v1',
  },
}

export default nextConfig
