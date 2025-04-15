/**
 * 網站相關常數
 */
export const SITE_NAME = 'NobodyClimb'
export const SITE_URL = 'https://nobodyclimb.com'
export const SITE_DESCRIPTION = '專注於攀岩社群的網站，提供攀岩愛好者分享經驗、尋找攀岩地點及交流的平台'

/**
 * API 相關常數
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nobodyclimb.com'
export const API_TIMEOUT = 10000 // 10 seconds

/**
 * 分頁相關常數
 */
export const DEFAULT_PAGE_SIZE = 10
export const DEFAULT_PAGE = 1

/**
 * 導航連結
 */
export const NAV_LINKS = [
  { href: '/', label: '首頁' },
  { href: '/blog', label: '文章' },
  { href: '/gym', label: '攀岩館' },
  { href: '/gallery', label: '相簿' },
  { href: '/biography', label: '個人' },
]

/**
 * 身分驗證相關常數
 */
export const AUTH_COOKIE_NAME = 'nobodyclimb_token'
export const AUTH_TOKEN_EXPIRY = 60 * 60 * 24 * 7 // 7 days in seconds

/**
 * 圖片相關常數
 */
export const DEFAULT_AVATAR = '/images/default-avatar.png'
export const DEFAULT_COVER = '/images/default-cover.jpg'
export const IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.webp']
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * 社交媒體連結
 */
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/nobodyclimb',
  facebook: 'https://www.facebook.com/nobodyclimb',
  twitter: 'https://twitter.com/nobodyclimb',
}

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
  { id: 'gal1', src: '/photo/cont-photo-top-left.jpeg', alt: 'Climber on outdoor route', location: { country: '台灣', city: '新北市', spot: '龍洞' }, uploadDate: '2024. 01. 15' },
  { id: 'gal2', src: '/photo/cont-photo-top-right.jpeg', alt: 'Climber bouldering indoors', location: { country: '台灣', city: '台北市', spot: '市民岩館' }, uploadDate: '2024. 01. 14' },
  { id: 'gal3', src: '/photo/cont-photo-mid-left.jpeg', alt: 'Climber celebrating at the top', location: { country: '台灣', city: '高雄市', spot: '壽山' }, uploadDate: '2024. 01. 13' },
  { id: 'gal4', src: '/photo/cont-photo-mid-right.jpeg', alt: 'Climbing gear details', location: { country: '台灣', city: '台中市', spot: 'Dapro' }, uploadDate: '2024. 01. 12' },
  { id: 'gal5', src: '/photo/cont-photo-bottom-left.jpeg', alt: 'Scenic view from climbing spot', location: { country: '台灣', city: '花蓮縣', spot: '太魯閣' }, uploadDate: '2024. 01. 11' },
  { id: 'gal6', src: '/photo/cont-photo-bottom-right.jpeg', alt: 'Group of climbers', location: { country: '台灣', city: '新北市', spot: '龍洞' }, uploadDate: '2024. 01. 10' },
  // Row 2
  { id: 'gal7', src: '/photo/blog-left.png', alt: 'Climber on steep overhang', location: { country: '台灣', city: '台北市', spot: 'B-plus' }, uploadDate: '2024. 01. 09' },
  { id: 'gal8', src: '/photo/blog-mid-left.jpg', alt: 'Indoor climbing competition', location: { country: '台灣', city: '台中市', spot: '攀吶' }, uploadDate: '2024. 01. 08' },
  { id: 'gal9', src: '/photo/blog-mid-right.jpg', alt: 'Climber resting', location: { country: '台灣', city: '新北市', spot: '龍洞' }, uploadDate: '2024. 01. 07' },
  { id: 'gal10', src: '/photo/blog-right.jpg', alt: 'Close up of climbing hold', location: { country: '台灣', city: '台北市', spot: '原岩' }, uploadDate: '2024. 01. 06' },
  { id: 'gal11', src: '/photo/climbspot-photo.jpg', alt: 'Outdoor bouldering problem', location: { country: '台灣', city: '高雄市', spot: '關子嶺' }, uploadDate: '2024. 01. 05' },
  { id: 'gal12', src: '/photo/cont-about.jpg', alt: 'Climber looking at view', location: { country: '台灣', city: '新北市', spot: '龍洞' }, uploadDate: '2024. 01. 04' },
  // Row 3
  { id: 'gal13', src: '/photo/cont-intro.png', alt: 'Climber silhouette', location: { country: '台灣', city: '台東縣', spot: '東河' }, uploadDate: '2024. 01. 03' },
  { id: 'gal14', src: '/photo/cover-photo.jpg', alt: 'Wide shot of climbing crag', location: { country: '台灣', city: '新北市', spot: '龍洞' }, uploadDate: '2024. 01. 02' },
  { id: 'gal15', src: '/photo/person-poto.jpg', alt: 'Portrait of a climber', location: { country: '台灣', city: '台北市', spot: '市民岩館' }, uploadDate: '2024. 01. 01' },
  { id: 'gal16', src: '/photo/personleft.jpg', alt: 'Climber chalking up', location: { country: '台灣', city: '新北市', spot: '龍洞' }, uploadDate: '2023. 12. 31' },
  { id: 'gal17', src: '/photo/personmid.jpg', alt: 'Climber mid-move', location: { country: '台灣', city: '台中市', spot: 'Dapro' }, uploadDate: '2023. 12. 30' },
  { id: 'gal18', src: '/photo/personright.jpg', alt: 'Climber reaching for hold', location: { country: '台灣', city: '高雄市', spot: '攀吶' }, uploadDate: '2023. 12. 29' },
   // Add more if needed for "Load More" functionality testing
  { id: 'gal19', src: '/photo/cont-photo-top-left.jpg', alt: 'Climber on outdoor route repeat', location: { country: '台灣', city: '新北市', spot: '龍洞' }, uploadDate: '2023. 12. 28' },
  { id: 'gal20', src: '/photo/cont-photo-top-right.jpg', alt: 'Climber bouldering indoors repeat', location: { country: '台灣', city: '台北市', spot: '市民岩館' }, uploadDate: '2023. 12. 27' },
];
