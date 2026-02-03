/**
 * 攀岩相關常數
 */

/**
 * 攀岩難度等級
 */
export const CLIMBING_GRADES = {
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
} as const

/**
 * 攀岩類型
 */
export const CLIMBING_TYPES = [
  { value: 'boulder', label: '抱石' },
  { value: 'sport', label: '運動攀登' },
  { value: 'trad', label: '傳統攀登' },
  { value: 'mixed', label: '混合攀登' },
] as const

export type ClimbingType = (typeof CLIMBING_TYPES)[number]['value']

/**
 * 季節
 */
export const SEASONS = [
  { value: 'spring', label: '春季' },
  { value: 'summer', label: '夏季' },
  { value: 'autumn', label: '秋季' },
  { value: 'winter', label: '冬季' },
] as const

export type Season = (typeof SEASONS)[number]['value']

/**
 * 岩場設施
 */
export const CRAG_AMENITIES = [
  '停車場',
  '洗手間',
  '野餐區',
  '遮蔽處',
  '垃圾桶',
  '飲用水',
  '營地',
] as const

/**
 * 岩館設施
 */
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
] as const

/**
 * 人物誌興趣標籤
 */
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
] as const
