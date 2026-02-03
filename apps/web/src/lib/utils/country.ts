/**
 * 國家相關工具函數
 */

// 國旗對照表
const COUNTRY_FLAGS: Record<string, string> = {
  台灣: '🇹🇼',
  泰國: '🇹🇭',
  越南: '🇻🇳',
  中國: '🇨🇳',
  日本: '🇯🇵',
  韓國: '🇰🇷',
  美國: '🇺🇸',
  西班牙: '🇪🇸',
  法國: '🇫🇷',
  義大利: '🇮🇹',
  希臘: '🇬🇷',
  土耳其: '🇹🇷',
  馬來西亞: '🇲🇾',
  印尼: '🇮🇩',
  菲律賓: '🇵🇭',
  澳洲: '🇦🇺',
  紐西蘭: '🇳🇿',
  英國: '🇬🇧',
  德國: '🇩🇪',
  瑞士: '🇨🇭',
}

/**
 * 根據國家名稱取得對應的國旗 emoji
 * @param country 國家名稱
 * @returns 國旗 emoji，若無對應則回傳地球 emoji
 */
export function getCountryFlag(country: string): string {
  return COUNTRY_FLAGS[country] || '🌍'
}

/**
 * 常見攀岩國家列表
 */
export const COMMON_COUNTRIES = [
  '台灣',
  '泰國',
  '越南',
  '中國',
  '日本',
  '韓國',
  '美國',
  '西班牙',
  '法國',
  '義大利',
  '希臘',
  '土耳其',
  '馬來西亞',
  '印尼',
  '菲律賓',
  '澳洲',
  '紐西蘭',
  '英國',
  '德國',
  '瑞士',
  '其他',
]
