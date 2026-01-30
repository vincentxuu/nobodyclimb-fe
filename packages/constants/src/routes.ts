/**
 * 路由常數
 * 跨平台使用的路由路徑定義
 */

/**
 * 應用程式路由路徑
 */
export const ROUTES = {
  // 首頁
  HOME: '/',

  // 認證相關
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // 使用者相關
  PROFILE: '/profile',

  // 部落格
  BLOG: '/blog',
  BLOG_DETAIL: (slug: string) => `/blog/${slug}`,

  // 岩館
  GYM: '/gym',
  GYM_DETAIL: (slug: string) => `/gym/${slug}`,
  GYM_ADD: '/gym/add',

  // 岩場
  CRAG: '/crag',
  CRAG_DETAIL: (id: string) => `/crag/${id}`,

  // 相簿
  GALLERY: '/gallery',
  GALLERY_DETAIL: (slug: string) => `/gallery/${slug}`,

  // 人物誌
  BIOGRAPHY: '/biography',
  BIOGRAPHY_DETAIL: (slug: string) => `/biography/${slug}`,

  // 影片
  VIDEOS: '/videos',

  // 搜尋
  SEARCH: '/search',
} as const

/**
 * 導航連結
 */
export const NAV_LINKS = [
  { label: '人物誌', href: ROUTES.BIOGRAPHY },
  { label: '岩場', href: ROUTES.CRAG },
  { label: '岩館', href: ROUTES.GYM },
  { label: '攝影集', href: ROUTES.GALLERY },
  { label: '影片', href: ROUTES.VIDEOS },
  { label: '部落格', href: ROUTES.BLOG },
] as const

/**
 * 頁尾連結
 */
export const FOOTER_LINKS = {
  關於: [
    { label: '關於我們', href: '/about' },
    { label: '聯絡方式', href: '/contact' },
    { label: '使用條款', href: '/terms' },
    { label: '隱私政策', href: '/privacy' },
  ],
  功能: [
    { label: '攀岩技巧', href: '/blog/category/技術教學' },
    { label: '岩館', href: ROUTES.GYM },
    { label: '攀岩相簿', href: ROUTES.GALLERY },
    { label: '小人物介紹', href: ROUTES.BIOGRAPHY },
  ],
  資源: [
    { label: '常見問題', href: '/faq' },
    { label: '攀岩知識', href: '/knowledge' },
    { label: '裝備指南', href: '/equipment' },
    { label: '安全須知', href: '/safety' },
  ],
} as const
