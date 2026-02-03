/**
 * 站點配置常數
 */

/**
 * 站點基本資訊
 */
export const SITE_CONFIG = {
  NAME: 'NobodyClimb',
  URL: 'https://nobodyclimb.cc',
  API_URL: 'https://api.nobodyclimb.cc',
  DESCRIPTION:
    '台灣攀岩社群平台，提供攀岩愛好者分享經驗、探索岩場岩館、觀看攀岩影片及交流的園地。無論你是初學者還是高手，都能在這裡找到志同道合的攀岩夥伴。',
  LOGO: '/logo/Nobodylimb-black.png',
  OG_IMAGE: '/og-image.png',
} as const

/**
 * 時間格式
 */
export const DATE_FORMATS = {
  DATE: 'yyyy年MM月dd日',
  DATE_TIME: 'yyyy年MM月dd日 HH:mm',
  ISO: 'yyyy-MM-dd',
  TIME: 'HH:mm',
} as const

/**
 * 社群媒體連結
 */
export const SOCIAL_LINKS = [
  { label: 'Mail', href: 'mailto:contact@nobodyclimb.cc', icon: 'mail' },
] as const

/**
 * 文章分類標籤
 */
export const BLOG_TAGS = [
  '技術教學',
  '初學心得',
  '裝備分享',
  '攀岩館評測',
  '戶外攀岩',
  '比賽資訊',
  '訓練方法',
  '攀岩故事',
] as const
