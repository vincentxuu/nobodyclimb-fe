/** @type {import('next').NextConfig} */
// 移除 next-intl 插件配置
// const withNextIntl = require('next-intl/plugin')();

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'cloudflare-ipfs.com',
      'r2.cloudflarestorage.com', // 根據 README 中的描述，使用 Cloudflare R2 存儲圖片
      'i.imgur.com' // 允許 imgur 域名
    ],
  },
  // Server Actions 已默認啟用，不需要此配置
}

// 移除 next-intl 包裝
module.exports = nextConfig;