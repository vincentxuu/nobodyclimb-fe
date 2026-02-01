/**
 * 常數定義統一匯出
 *
 * 從 @nobodyclimb/constants 共用套件重新導出共用常數，
 * 並保留 web 專屬的常數定義
 */

// 從共用套件重新導出（重新命名以避免衝突）
export {
  // 站點配置
  SITE_CONFIG,
  DATE_FORMATS,
  BLOG_TAGS,
  // API 相關
  PAGINATION,
  AUTH_KEYS,
  API_TIMEOUT as SHARED_API_TIMEOUT,
  RETRY_CONFIG,
  API_VERSION,
  // 攀岩相關
  CLIMBING_GRADES,
  CLIMBING_TYPES,
  SEASONS,
  CRAG_AMENITIES,
  GYM_FACILITIES as SHARED_GYM_FACILITIES,
  BIOGRAPHY_INTERESTS,
  // 路由 - 使用新結構的重新命名版本
  ROUTES as SHARED_ROUTES,
  NAV_LINKS as SHARED_NAV_LINKS,
  FOOTER_LINKS,
  // 社群連結 (與本地 SOCIAL_LINKS 格式不同，重新命名)
  SOCIAL_LINKS as SHARED_SOCIAL_LINKS,
} from '@nobodyclimb/constants'

/**
 * 路由路徑 (Web 舊格式，扁平結構)
 */
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
  LEARN: (categoryId: string) => `/games/rope-system/learn/${categoryId}`,
}

// ============================================
// Web 專屬常數
// ============================================

/**
 * 網站相關常數
 */
export const SITE_NAME = 'NobodyClimb'
export const SITE_URL = 'https://nobodyclimb.cc'
export const SITE_DESCRIPTION =
  '台灣攀岩社群平台，提供攀岩愛好者分享經驗、探索岩場岩館、觀看攀岩影片及交流的園地。無論你是初學者還是高手，都能在這裡找到志同道合的攀岩夥伴。'
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

/**
 * 時間格式
 */
export const DATE_FORMAT = 'yyyy年MM月dd日'
export const DATE_TIME_FORMAT = 'yyyy年MM月dd日 HH:mm'

/**
 * Toast 提示訊息常數
 */
export const RATE_LIMIT_TOAST = {
  title: '請稍候',
  description: '點擊太快了，請稍後再試',
  variant: 'default' as const,
}

/**
 * API 相關常數
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nobodyclimb.cc/api/v1'
export const API_URL = API_BASE_URL // 保留向後兼容

/**
 * 分頁相關常數
 */
export const DEFAULT_PAGE_SIZE = 10
export const DEFAULT_PAGE = 1

/**
 * 導航連結
 */
export const NAV_LINKS = [
  { href: '/biography', label: '人物誌' },
  { href: '/crag', label: '岩場' },
  { href: '/gym', label: '岩館' },
  { href: '/gallery', label: '攝影集' },
  { href: '/videos', label: '影片' },
  { href: '/blog', label: '部落格' },
]

/**
 * 身分驗證相關常數
 */
export const AUTH_COOKIE_NAME = 'nobodyclimb_token'
export const AUTH_TOKEN_EXPIRY = 60 * 60 * 24 * 7 // 7 days in seconds
export const AUTH_TOKEN_KEY = 'nobodyclimb-auth-token'
export const AUTH_REFRESH_TOKEN_KEY = 'nobodyclimb-refresh-token'
export const AUTH_USER_KEY = 'nobodyclimb-auth-user'

/**
 * Google OAuth
 */
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

/**
 * 圖片相關常數
 */
export const DEFAULT_AVATAR = '/images/default-avatar.png'
export const DEFAULT_COVER = '/images/default-cover.jpg'
export const IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.webp']
export const MAX_IMAGE_SIZE = 500 * 1024 // 500KB

/**
 * 社交媒體連結 (陣列格式供 footer 使用)
 */
export const SOCIAL_LINKS = [
  { label: 'Mail', href: 'mailto:contact@nobodyclimb.cc', icon: 'mail' },
]

/**
 * 搜尋選項
 */
export const SEARCH_TYPES = [
  { value: 'all', label: '全部' },
  { value: 'post', label: '文章' },
  { value: 'gym', label: '岩館' },
  { value: 'crag', label: '岩場' },
  { value: 'gallery', label: '相簿' },
  { value: 'user', label: '用戶' },
]

/**
 * 文章分類標籤
 */
export const POST_TAGS = [
  '技巧分享',
  '裝備評測',
  '攀岩故事',
  '賽事報導',
  '初學入門',
  '訓練方法',
  '攀岩地點',
  '心得分享',
]

/**
 * 攀岩館設施
 */
export const GYM_FACILITIES = [
  '抱石區',
  '先鋒攀登',
  '速度攀登',
  '兒童攀岩',
  '體能訓練區',
  '淋浴間',
  '置物櫃',
  '休息區',
  '咖啡廳',
]

/**
 * 攝影集照片 (Placeholder Data)
 */
export const galleryPhotos = [
  // Add 18+ placeholder images based on Figma structure
  // Row 1
  {
    id: 'gal1',
    src: '/photo/cont-photo-top-left.jpeg',
    alt: 'Climber on outdoor route',
    location: { country: '台灣', city: '新北市', spot: '龍洞' },
    uploadDate: '2024. 01. 15',
  },
  {
    id: 'gal2',
    src: '/photo/cont-photo-top-right.jpeg',
    alt: 'Climber bouldering indoors',
    location: { country: '台灣', city: '台北市', spot: '市民岩館' },
    uploadDate: '2024. 01. 14',
  },
  {
    id: 'gal3',
    src: '/photo/cont-photo-mid-left.jpeg',
    alt: 'Climber celebrating at the top',
    location: { country: '台灣', city: '高雄市', spot: '壽山' },
    uploadDate: '2024. 01. 13',
  },
  {
    id: 'gal4',
    src: '/photo/cont-photo-mid-right.jpeg',
    alt: 'Climbing gear details',
    location: { country: '台灣', city: '台中市', spot: 'Dapro' },
    uploadDate: '2024. 01. 12',
  },
  {
    id: 'gal5',
    src: '/photo/cont-photo-bottom-left.jpeg',
    alt: 'Scenic view from climbing spot',
    location: { country: '台灣', city: '花蓮縣', spot: '太魯閣' },
    uploadDate: '2024. 01. 11',
  },
  {
    id: 'gal6',
    src: '/photo/cont-photo-bottom-right.jpeg',
    alt: 'Group of climbers',
    location: { country: '台灣', city: '新北市', spot: '龍洞' },
    uploadDate: '2024. 01. 10',
  },
  // Row 2
  {
    id: 'gal7',
    src: '/photo/blog-left.png',
    alt: 'Climber on steep overhang',
    location: { country: '台灣', city: '台北市', spot: 'B-plus' },
    uploadDate: '2024. 01. 09',
  },
  {
    id: 'gal8',
    src: '/photo/blog-mid-left.jpg',
    alt: 'Indoor climbing competition',
    location: { country: '台灣', city: '台中市', spot: '攀吶' },
    uploadDate: '2024. 01. 08',
  },
  {
    id: 'gal9',
    src: '/photo/blog-mid-right.jpg',
    alt: 'Climber resting',
    location: { country: '台灣', city: '新北市', spot: '龍洞' },
    uploadDate: '2024. 01. 07',
  },
  {
    id: 'gal10',
    src: '/photo/blog-right.jpg',
    alt: 'Close up of climbing hold',
    location: { country: '台灣', city: '台北市', spot: '原岩' },
    uploadDate: '2024. 01. 06',
  },
  {
    id: 'gal11',
    src: '/photo/climbspot-photo.jpg',
    alt: 'Outdoor bouldering problem',
    location: { country: '台灣', city: '高雄市', spot: '關子嶺' },
    uploadDate: '2024. 01. 05',
  },
  {
    id: 'gal12',
    src: '/photo/cont-about.jpg',
    alt: 'Climber looking at view',
    location: { country: '台灣', city: '新北市', spot: '龍洞' },
    uploadDate: '2024. 01. 04',
  },
  // Row 3
  {
    id: 'gal13',
    src: '/photo/cont-intro.png',
    alt: 'Climber silhouette',
    location: { country: '台灣', city: '台東縣', spot: '東河' },
    uploadDate: '2024. 01. 03',
  },
  {
    id: 'gal14',
    src: '/photo/cover-photo.jpg',
    alt: 'Wide shot of climbing crag',
    location: { country: '台灣', city: '新北市', spot: '龍洞' },
    uploadDate: '2024. 01. 02',
  },
  {
    id: 'gal15',
    src: '/photo/person-poto.jpg',
    alt: 'Portrait of a climber',
    location: { country: '台灣', city: '台北市', spot: '市民岩館' },
    uploadDate: '2024. 01. 01',
  },
  {
    id: 'gal16',
    src: '/photo/personleft.jpg',
    alt: 'Climber chalking up',
    location: { country: '台灣', city: '新北市', spot: '龍洞' },
    uploadDate: '2023. 12. 31',
  },
  {
    id: 'gal17',
    src: '/photo/personmid.jpg',
    alt: 'Climber mid-move',
    location: { country: '台灣', city: '台中市', spot: 'Dapro' },
    uploadDate: '2023. 12. 30',
  },
  {
    id: 'gal18',
    src: '/photo/personright.jpg',
    alt: 'Climber reaching for hold',
    location: { country: '台灣', city: '高雄市', spot: '攀吶' },
    uploadDate: '2023. 12. 29',
  },
  // Add more if needed for "Load More" functionality testing
  {
    id: 'gal19',
    src: '/photo/cont-photo-top-left.jpg',
    alt: 'Climber on outdoor route repeat',
    location: { country: '台灣', city: '新北市', spot: '龍洞' },
    uploadDate: '2023. 12. 28',
  },
  {
    id: 'gal20',
    src: '/photo/cont-photo-top-right.jpg',
    alt: 'Climber bouldering indoors repeat',
    location: { country: '台灣', city: '台北市', spot: '市民岩館' },
    uploadDate: '2023. 12. 27',
  },
]

