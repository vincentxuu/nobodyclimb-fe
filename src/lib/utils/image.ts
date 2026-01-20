/**
 * 圖片工具函式
 */

const MAX_FILE_SIZE = 500 * 1024 // 500KB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * 生成預設頭像 URL（使用 DiceBear notionists 風格）
 * 用名字當 seed 確保同一人每次都是同頭像
 * @param name 用戶名字（用作 seed）
 * @param size 頭像尺寸（預設 200）
 * @returns DiceBear 頭像 URL
 */
export function getDefaultAvatarUrl(name: string, size: number = 200): string {
  const seed = encodeURIComponent(name || 'anonymous')
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&size=${size}`
}

/**
 * 生成預設封面照 URL（使用 Lorem Picsum）
 * 用 id 或名字當 seed 確保同一人物誌每次都是同一張封面
 * @param seed 唯一識別碼（用作 seed，可以是 id 或名字）
 * @param width 封面寬度（預設 1920）
 * @param height 封面高度（預設 600）
 * @returns Lorem Picsum 封面照 URL
 */
export function getDefaultCoverUrl(seed: string, width: number = 1920, height: number = 600): string {
  const safeSeed = encodeURIComponent(seed || 'default')
  return `https://picsum.photos/seed/${safeSeed}/${width}/${height}`
}

/**
 * 檢查是否為 SVG 或 DiceBear URL（不需要 Next.js 圖片優化）
 * @param url 圖片 URL
 * @returns 是否應跳過 Next.js Image 優化
 */
export function isSvgUrl(url: string): boolean {
  return url.includes('dicebear.com') || url.endsWith('.svg')
}

/**
 * 驗證圖片檔案類型
 */
export function validateImageType(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type)
}

/**
 * 壓縮圖片至指定大小以下
 * @param file 原始檔案
 * @param maxSize 最大大小（bytes），預設 500KB
 * @param maxWidth 最大寬度，預設 1920px
 * @param maxHeight 最大高度，預設 1080px
 * @returns 壓縮後的檔案
 */
export async function compressImage(
  file: File,
  maxSize: number = MAX_FILE_SIZE,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<File> {
  // 驗證檔案類型
  if (!validateImageType(file)) {
    throw new Error('不支援的檔案格式，僅支援 JPEG、PNG、WebP、GIF')
  }

  // GIF 不壓縮（會失去動畫）
  if (file.type === 'image/gif') {
    if (file.size > maxSize) {
      throw new Error('GIF 檔案大小不能超過 500KB')
    }
    return file
  }

  // 如果已經小於限制，直接返回
  if (file.size <= maxSize) {
    return file
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('無法建立 canvas context'))
      return
    }

    img.onload = () => {
      // 計算縮放後的尺寸
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      // 繪製圖片
      ctx.drawImage(img, 0, 0, width, height)

      // 嘗試不同品質直到檔案大小符合要求
      const tryCompress = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('圖片壓縮失敗'))
              return
            }

            if (blob.size <= maxSize || quality <= 0.1) {
              // 符合大小要求或已達最低品質
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              // 繼續降低品質
              tryCompress(quality - 0.1)
            }
          },
          'image/jpeg',
          quality
        )
      }

      // 從 0.9 品質開始嘗試
      tryCompress(0.9)
    }

    img.onerror = () => {
      reject(new Error('圖片載入失敗'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * 壓縮並驗證圖片
 * @param file 原始檔案
 * @returns 壓縮後的檔案
 */
export async function processImage(file: File): Promise<File> {
  if (!validateImageType(file)) {
    throw new Error('不支援的檔案格式，僅支援 JPEG、PNG、WebP、GIF')
  }

  return compressImage(file)
}
