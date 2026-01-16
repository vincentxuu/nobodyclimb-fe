# 圖片管理系統

本文件說明 NobodyClimb 平台的圖片上傳、儲存、刪除流程。

## 架構概覽

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │ ───> │   Backend   │ ───> │ Cloudflare  │
│  (Next.js)  │      │   (Hono)    │      │     R2      │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  D1 (SQLite)│
                     └─────────────┘
```

## 統一上傳端點

所有圖片上傳都使用同一個共用端點：

```
POST /api/v1/media/upload?type={type}
```

### 支援的類型

| type | R2 資料夾 | 用途 |
|------|-----------|------|
| `posts` | `posts/` | 文章圖片 |
| `biography` | `biography/` | 人物誌圖片 |
| `gallery` | `gallery/` | 相簿圖片 |
| `gyms` | `gyms/` | 攀岩館圖片 |
| `crags` | `crags/` | 岩場圖片 |
| `avatars` | `avatars/` | 頭像（備用） |

### 請求格式

```http
POST /api/v1/media/upload?type=posts
Authorization: Bearer {token}
Content-Type: multipart/form-data

image: (binary)
old_url: (optional) 要刪除的舊圖片 URL
```

### 回應格式

```json
{
  "success": true,
  "data": {
    "url": "https://r2.nobodyclimb.cc/posts/abc123.jpg"
  }
}
```

### 驗證規則

| 項目 | 限制 |
|------|------|
| 檔案類型 | JPEG, PNG, WebP, GIF |
| 檔案大小 | 最大 500KB |
| 認證 | 需要 JWT Token |

### 自動壓縮

前端在上傳前會自動壓縮圖片：
- 超過 500KB 的圖片會自動壓縮
- 使用 Canvas API 縮小尺寸和降低品質
- 最大尺寸：1920x1080
- GIF 不壓縮（會失去動畫），超過 500KB 會報錯

---

## 前端使用方式

### services.ts 方法

```typescript
// 文章圖片
postsService.uploadImage(file: File, oldUrl?: string)

// 人物誌圖片
biographyService.uploadImage(file: File, oldUrl?: string)

// 相簿圖片（單張）
galleryService.uploadImage(file: File, oldUrl?: string)

// 相簿圖片（多張）
galleryService.uploadImages(files: File[])

// 攀岩館圖片
gymService.uploadImage(file: File, oldUrl?: string)

// 岩場圖片（單張）
cragService.uploadImage(file: File, oldUrl?: string)

// 岩場圖片（多張）
cragService.uploadImages(files: File[])
```

### 使用範例

```typescript
// 新增圖片
const result = await postsService.uploadImage(file)
const imageUrl = result.data.url

// 替換圖片（自動刪除舊圖）
const result = await postsService.uploadImage(newFile, oldImageUrl)
```

---

## 圖片刪除機制

### 1. 上傳時替換

傳入 `old_url` 參數，上傳新圖片時自動刪除舊圖片：

```typescript
// 前端
await postsService.uploadImage(newFile, oldImageUrl)

// 後端會先刪除 oldImageUrl 對應的 R2 檔案，再上傳新檔案
```

### 2. 刪除實體時自動清理

刪除資料庫記錄時，會自動清理相關的 R2 圖片：

| 端點 | 清理的圖片 |
|------|-----------|
| `DELETE /posts/:id` | `cover_image` + 內容中所有圖片 |
| `DELETE /biographies/me` | `profile_image` + `cover_image` |
| `DELETE /gyms/:id` | `cover_image` |
| `DELETE /crags/:id` | `images` (JSON array) |
| `DELETE /galleries/:id` | `cover_image` + 所有 `gallery_images` |
| `DELETE /galleries/photos/:id` | 該照片的 `image_url` |

### 3. 頭像特殊處理

頭像使用獨立端點，自動處理舊頭像刪除和資料庫更新：

```
POST /api/v1/users/upload-avatar
```

流程：
1. 從資料庫取得目前 `avatar_url`
2. 刪除 R2 中的舊頭像
3. 上傳新頭像到 R2
4. 更新資料庫 `users.avatar_url`
5. 回傳新的 URL

---

## 工具函數

### backend/src/utils/storage.ts

```typescript
/**
 * 刪除 R2 圖片
 * @param storage - R2 bucket instance
 * @param url - 圖片 URL 或 URL 陣列
 */
async function deleteR2Images(
  storage: R2Bucket,
  url: string | string[] | null | undefined
): Promise<void>

/**
 * 從 HTML 內容提取 R2 圖片 URL
 * @param content - HTML 內容
 * @param r2PublicUrl - R2 公開 URL 前綴
 */
function extractR2ImagesFromContent(
  content: string | null | undefined,
  r2PublicUrl: string
): string[]
```

### 使用範例

```typescript
import { deleteR2Images, extractR2ImagesFromContent } from '../utils/storage';

// 刪除單張圖片
await deleteR2Images(c.env.STORAGE, imageUrl);

// 刪除多張圖片
await deleteR2Images(c.env.STORAGE, [url1, url2, url3]);

// 從內容提取並刪除圖片
const contentImages = extractR2ImagesFromContent(post.content, c.env.R2_PUBLIC_URL);
await deleteR2Images(c.env.STORAGE, [post.cover_image, ...contentImages]);
```

---

## 資料庫欄位對應

| 資料表 | 圖片欄位 | 類型 |
|--------|----------|------|
| `posts` | `cover_image` | 單一 URL |
| `posts` | `content` | HTML 內嵌圖片 |
| `biographies` | `profile_image` | 單一 URL |
| `biographies` | `cover_image` | 單一 URL |
| `gyms` | `cover_image` | 單一 URL |
| `crags` | `images` | JSON array |
| `galleries` | `cover_image` | 單一 URL |
| `gallery_images` | `image_url` | 單一 URL |
| `users` | `avatar_url` | 單一 URL |

---

## 流程圖

### 上傳新圖片

```
前端                    後端                      R2
  │                       │                        │
  │── POST /media/upload ─>│                        │
  │   + image file         │                        │
  │                       │── PUT object ─────────>│
  │                       │<── success ────────────│
  │<── { url } ───────────│                        │
  │                       │                        │
```

### 替換圖片

```
前端                    後端                      R2
  │                       │                        │
  │── POST /media/upload ─>│                        │
  │   + image file         │                        │
  │   + old_url            │── DELETE old_url ────>│
  │                       │<── success ────────────│
  │                       │── PUT new object ─────>│
  │                       │<── success ────────────│
  │<── { url } ───────────│                        │
  │                       │                        │
```

### 刪除實體

```
前端                    後端                      R2         D1
  │                       │                        │          │
  │── DELETE /posts/:id ──>│                        │          │
  │                       │── SELECT images ───────────────────>│
  │                       │<── images list ────────────────────│
  │                       │── DELETE images ──────>│          │
  │                       │<── success ────────────│          │
  │                       │── DELETE record ───────────────────>│
  │                       │<── success ────────────────────────│
  │<── success ───────────│                        │          │
  │                       │                        │          │
```

---

## 注意事項

1. **認證要求**：所有上傳和刪除操作都需要 JWT Token

2. **錯誤處理**：R2 刪除失敗不會阻止資料庫操作，避免資料不一致

3. **URL 格式**：R2 圖片 URL 格式為 `{R2_PUBLIC_URL}/{folder}/{id}.{ext}`

4. **快取設定**：上傳的圖片設定為 1 年快取 (`max-age=31536000, immutable`)

5. **檔名生成**：使用 `generateId()` 產生唯一檔名，避免衝突
