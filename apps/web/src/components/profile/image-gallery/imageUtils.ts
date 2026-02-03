import imageCompression from 'browser-image-compression'
import { IMAGE_CONSTRAINTS } from '../types'

/**
 * 壓縮圖片到指定大小
 */
export async function compressImage(file: File): Promise<File> {
  // 如果圖片已經小於限制，直接返回
  if (file.size <= IMAGE_CONSTRAINTS.maxSizeBytes) {
    return file
  }

  const options = {
    maxSizeMB: IMAGE_CONSTRAINTS.maxSizeMB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
  }

  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (error) {
    console.error('圖片壓縮失敗:', error)
    throw new Error('圖片壓縮失敗')
  }
}

/**
 * 驗證圖片格式
 */
export function validateImageType(file: File): boolean {
  return IMAGE_CONSTRAINTS.acceptedTypes.includes(file.type)
}

/**
 * 讀取圖片為 base64
 */
export function readImageAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 從 base64 創建 File 對象
 */
export async function dataURLtoFile(dataURL: string, filename: string): Promise<File> {
  const res = await fetch(dataURL)
  const blob = await res.blob()
  return new File([blob], filename, { type: blob.type })
}

/**
 * 獲取圖片尺寸
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
