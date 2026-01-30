/**
 * Gallery 圖片上傳腳本
 *
 * 使用方式：
 * 1. 在瀏覽器登入 nobodyclimb.cc (使用 vincentxu@gmail.com)
 * 2. 開啟開發者工具 (F12)
 * 3. 在 Console 貼上此腳本執行
 */

const API_BASE = 'https://api.nobodyclimb.cc/api/v1';
const SITE_BASE = 'https://nobodyclimb.cc';

// 要上傳的圖片列表
const images = [
  { filename: 'gallery-1.jpg', caption: '攀岩照片 1' },
  { filename: 'gallery-2.jpg', caption: '攀岩照片 2' },
  { filename: 'gallery-3.jpg', caption: '攀岩照片 3' },
  { filename: 'gallery-4.jpg', caption: '攀岩照片 4' },
  { filename: 'gallery-5.jpg', caption: '攀岩照片 5' },
  { filename: 'gallery-6.jpg', caption: '攀岩照片 6' },
];

async function fetchImageAsBlob(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  return await response.blob();
}

async function uploadImage(blob, filename) {
  const formData = new FormData();
  formData.append('image', blob, filename);

  const response = await fetch(`${API_BASE}/galleries/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${error}`);
  }

  return await response.json();
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
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Create record failed: ${error}`);
  }

  return await response.json();
}

async function main() {
  console.log('🚀 開始上傳 Gallery 圖片...\n');

  let successCount = 0;

  for (const img of images) {
    const imageUrl = `${SITE_BASE}/images/gallery/${img.filename}`;
    console.log(`📷 處理: ${img.filename}`);

    try {
      // Step 1: 從網站取得圖片
      console.log('  ⏳ 取得圖片...');
      const blob = await fetchImageAsBlob(imageUrl);
      console.log(`  ✓ 圖片大小: ${(blob.size / 1024).toFixed(1)} KB`);

      // Step 2: 上傳圖片到 R2
      console.log('  ⏳ 上傳到儲存空間...');
      const uploadResult = await uploadImage(blob, img.filename);

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Upload failed');
      }

      const storedUrl = uploadResult.data.url;
      console.log(`  ✓ 已上傳: ${storedUrl}`);

      // Step 3: 建立照片記錄
      console.log('  ⏳ 建立資料庫記錄...');
      const photoResult = await createPhotoRecord(storedUrl, img.caption);

      if (!photoResult.success) {
        throw new Error(photoResult.message || 'Create record failed');
      }

      console.log(`  ✓ 記錄已建立: ${photoResult.data.id}\n`);
      successCount++;

    } catch (error) {
      console.error(`  ✗ 錯誤: ${error.message}\n`);
    }
  }

  console.log(`\n✅ 上傳完成！成功 ${successCount}/${images.length} 張`);
}

// 執行
main();
