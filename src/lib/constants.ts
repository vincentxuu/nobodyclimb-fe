// API 端點
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nobodyclimb.com'

// 分頁默認值
export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 10

// 認證相關
export const AUTH_TOKEN_KEY = 'nobodyclimb-auth-token'
export const AUTH_USER_KEY = 'nobodyclimb-auth-user'

// 導航連結
export const NAV_LINKS = [
  { label: '人物誌', href: '/biography' },
  { label: '岩場', href: '/crag' },
  { label: '岩館', href: '/gym' },
  { label: '攝影集', href: '/gallery' },
  { label: '專欄文章', href: '/blog', hasSubmenu: true },
]

// 專欄文章子選單
export const COLUMN_SUBMENU = [
  { label: '裝備介紹', href: '/blog?category=equipment' },
  { label: '技巧介紹', href: '/blog?category=technique' },
  { label: '技術研究', href: '/blog?category=research' },
  { label: '比賽介紹', href: '/blog?category=competition' },
]

// 路由路徑
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  PROFILE: '/profile',
  BLOG: '/blog',
  BLOG_DETAIL: (slug: string) => `/blog/${slug}`,
  GYM: '/gym',
  GYM_DETAIL: (slug: string) => `/gym/${slug}`,
  GYM_ADD: '/gym/add',
  GALLERY: '/gallery',
  GALLERY_DETAIL: (slug: string) => `/gallery/${slug}`,
  SEARCH: '/search',
  BIOGRAPHY: '/biography',
  CRAG: '/crag',
  CRAG_DETAIL: (id: string) => `/crag/${id}`,
}

// 文章分類標籤
export const BLOG_TAGS = [
  '技術教學',
  '初學心得',
  '裝備分享',
  '攀岩館評測',
  '戶外攀岩',
  '比賽資訊',
  '訓練方法',
  '攀岩故事',
]

// 攀岩館設施分類
export const GYM_FACILITIES = [
  '抱石區',
  '先鋒攀登',
  '速度攀登',
  '體能訓練區',
  '休息區',
  '淋浴設施',
  '置物櫃',
  '咖啡廳',
  '兒童區',
  '停車場',
]

// 頁尾連結
export const FOOTER_LINKS = {
  關於: [
    { label: '關於我們', href: '/about' },
    { label: '聯絡方式', href: '/contact' },
    { label: '使用條款', href: '/terms' },
    { label: '隱私政策', href: '/privacy' },
  ],
  功能: [
    { label: '攀岩技巧', href: '/blog/category/技術教學' },
    { label: '岩館', href: '/gym' },
    { label: '攀岩相簿', href: '/gallery' },
    { label: '小人物介紹', href: '/biography' },
  ],
  資源: [
    { label: '常見問題', href: '/faq' },
    { label: '攀岩知識', href: '/knowledge' },
    { label: '裝備指南', href: '/equipment' },
    { label: '安全須知', href: '/safety' },
  ],
}

// SEO 相關
export const DEFAULT_SEO = {
  title: 'NobodyClimb - 攀岩社群平台',
  description: '專注於攀岩社群的網站，提供攀岩愛好者分享經驗、尋找攀岩地點及交流的平台',
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: 'https://nobodyclimb.com',
    site_name: 'NobodyClimb',
    images: [
      {
        url: 'https://nobodyclimb.com/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NobodyClimb 攀岩社群平台',
      },
    ],
  },
}

// 社群媒體連結
export const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://instagram.com/nobodyclimb', icon: 'instagram' },
  { label: 'Facebook', href: 'https://facebook.com/nobodyclimb', icon: 'facebook' },
  { label: 'Mail', href: 'mailto:contact@nobodyclimb.com', icon: 'mail' },
]

// 時間格式
export const DATE_FORMAT = 'yyyy年MM月dd日'
export const DATE_TIME_FORMAT = 'yyyy年MM月dd日 HH:mm'
