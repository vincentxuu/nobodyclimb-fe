// API 端點
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nobodyclimb.cc/api/v1'

// 分頁默認值
export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 10

// 認證相關
export const AUTH_TOKEN_KEY = 'nobodyclimb-auth-token'
export const AUTH_REFRESH_TOKEN_KEY = 'nobodyclimb-refresh-token'
export const AUTH_USER_KEY = 'nobodyclimb-auth-user'

// Google OAuth
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

// 導航連結
export const NAV_LINKS = [
  { label: '人物誌', href: '/biography' },
  { label: '岩場', href: '/crag' },
  { label: '岩館', href: '/gym' },
  { label: '攝影集', href: '/gallery' },
  { label: '影片', href: '/videos' },
  { label: '部落格', href: '/blog' },
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

// 岩場難度等級
export const CRAG_DIFFICULTIES = {
  boulder: ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10+'],
  sport: [
    '5.6',
    '5.7',
    '5.8',
    '5.9',
    '5.10a',
    '5.10b',
    '5.10c',
    '5.10d',
    '5.11a',
    '5.11b',
    '5.11c',
    '5.11d',
    '5.12a+',
  ],
  trad: ['5.5', '5.6', '5.7', '5.8', '5.9', '5.10', '5.11', '5.12+'],
}

// 岩場類型
export const CRAG_TYPES = [
  { value: 'boulder', label: '抱石' },
  { value: 'sport', label: '運動攀登' },
  { value: 'trad', label: '傳統攀登' },
  { value: 'mixed', label: '混合攀登' },
]

// 岩場季節
export const CRAG_SEASONS = [
  { value: 'spring', label: '春季' },
  { value: 'summer', label: '夏季' },
  { value: 'autumn', label: '秋季' },
  { value: 'winter', label: '冬季' },
]

// 岩場設施
export const CRAG_AMENITIES = ['停車場', '洗手間', '野餐區', '遮蔽處', '垃圾桶', '飲用水', '營地']

// 人物誌興趣標籤
export const BIOGRAPHY_INTERESTS = [
  '抱石',
  '運動攀登',
  '傳統攀登',
  '速度攀登',
  '冰攀',
  '高山攀登',
  '攀岩教練',
  '攀岩攝影',
  '路線開發',
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

// SEO 相關常數
export const SITE_URL = 'https://nobodyclimb.cc'
export const SITE_NAME = 'NobodyClimb'
export const SITE_DESCRIPTION = '台灣攀岩社群平台，提供攀岩愛好者分享經驗、探索岩場岩館、觀看攀岩影片及交流的園地。無論你是初學者還是高手，都能在這裡找到志同道合的攀岩夥伴。'
export const SITE_LOGO = '/logo/Nobodylimb-black.png'
export const OG_IMAGE = '/og-image.png'

export const DEFAULT_SEO = {
  title: `${SITE_NAME} - 台灣攀岩社群平台`,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: SITE_URL,
    site_name: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}${OG_IMAGE}`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - 台灣攀岩社群平台`,
      },
    ],
  },
}

// 社群媒體連結
export const SOCIAL_LINKS = [
  { label: 'Mail', href: 'mailto:contact@nobodyclimb.cc', icon: 'mail' },
]

// 時間格式
export const DATE_FORMAT = 'yyyy年MM月dd日'
export const DATE_TIME_FORMAT = 'yyyy年MM月dd日 HH:mm'

// Toast 提示訊息常數
export const RATE_LIMIT_TOAST = {
  title: '請稍候',
  description: '點擊太快了，請稍後再試',
  variant: 'default' as const,
}
