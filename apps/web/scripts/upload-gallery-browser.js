/**
 * Gallery 圖片上傳腳本
 *
 * 使用方式：
 * 1. 在瀏覽器登入 nobodyclimb.cc (使用 vincentxu@gmail.com)
 * 2. 開啟開發者工具 (F12)
 * 3. 在 Console 貼上此腳本執行
 */

const API_BASE = 'https://api.nobodyclimb.cc/api/v1'
const SITE_BASE = 'https://nobodyclimb.cc'

// 要上傳的圖片列表
const images = [
  { filename: 'gallery-1.jpg', caption: '攀岩照片 1' },
  { filename: 'gallery-2.jpg', caption: '攀岩照片 2' },
  { filename: 'gallery-3.jpg', caption: '攀岩照片 3' },
  { filename: 'gallery-4.jpg', caption: '攀岩照片 4' },
  { filename: 'gallery-5.jpg', caption: '攀岩照片 5' },
  { filename: 'gallery-6.jpg', caption: '攀岩照片 6' },
]

async function fetchImageAsBlob(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}`)
  return await response.blob()
}

async function uploadImage(blob, filename) {
  const formData = new FormData()
  formData.append('image', blob, filename)

  const response = await fetch(`${API_BASE}/galleries/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Upload failed: ${error}`)
  }

  return await response.json()
}

async function createPhotoRecord(imageUrl, caption) {
  const response = await fetch(`${API_BASE}/galleries/photos`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageUrl,
      caption: caption,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Create record failed: ${error}`)
  }

  return await response.json()
}

async function main() {
  let _successCount = 0

  for (const img of images) {
    const imageUrl = `${SITE_BASE}/images/gallery/${img.filename}`

    try {
      const blob = await fetchImageAsBlob(imageUrl)

      const uploadResult = await uploadImage(blob, img.filename)

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Upload failed')
      }

      const storedUrl = uploadResult.data.url

      const photoResult = await createPhotoRecord(storedUrl, img.caption)

      if (!photoResult.success) {
        throw new Error(photoResult.message || 'Create record failed')
      }

      _successCount++
    } catch (error) {
      console.error(`  ✗ 錯誤: ${error.message}\n`)
    }
  }
}

// 執行
main()
