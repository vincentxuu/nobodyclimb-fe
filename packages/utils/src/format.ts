/**
 * 格式化相關工具函數
 */

/**
 * 截斷文字
 * @param text 文字
 * @param maxLength 最大長度
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text

  return text.slice(0, maxLength) + '...'
}

/**
 * 格式化大數字
 * @param num 數字
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }

  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }

  return num.toString()
}

/**
 * 格式化數字（帶千分位）
 */
export function formatNumberWithCommas(num: number): string {
  return num.toLocaleString()
}

/**
 * 格式化檔案大小
 * @param bytes 位元組數
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
