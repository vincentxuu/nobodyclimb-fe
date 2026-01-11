# 路線資訊社群媒體整合規劃

**專案**: nobodyclimb-fe
**建立日期**: 2026-01-11
**狀態**: 規劃中
**版本**: v1.0

## 目錄

1. [概述](#概述)
2. [需求分析](#需求分析)
3. [資料來源整合](#資料來源整合)
4. [統一資料結構](#統一資料結構)
5. [前端元件架構](#前端元件架構)
6. [後端 API 設計](#後端-api-設計)
7. [實作流程](#實作流程)
8. [實作階段](#實作階段)

---

## 概述

### 專案目標

將 YouTube 和 Instagram 的攀岩影片內容整合到 NobodyClimb 平台的路線資訊中，讓使用者在瀏覽攀岩路線時，能同時看到相關的教學影片、攀登紀錄和社群分享內容。

### 整合範圍

| 平台 | 內容類型 | 整合方式 |
|------|----------|----------|
| YouTube | 教學影片、攀登紀錄、頻道內容 | iframe 嵌入 + API 資料 |
| Instagram | 貼文、Reels、攀登紀錄 | Embed SDK + API 資料 |

### 相關文件參考

- [YouTube 資料收集計畫](../youtube-data-collection-and-conversion-plan.md)
- [多頻道 YouTube 資料收集](../multi-channel-youtube-data-collection-plan.md)
- [Instagram 貼文整合專案](../ig-show-video/README.md)
- [路線資料規劃](../route-data/planning.md)
- [路線資料管理計畫](../route-data/data-management-plan.md)

---

## 需求分析

### 核心需求

根據 `docs/route-data/demand.md` 的需求：

> 目前在規劃路線資訊，除了文字與圖片外，還希望附上 YT 影片或是 IG 影片

### 功能需求

#### 1. 影片展示功能

- **YouTube 影片**
  - 支援標準 YouTube 影片嵌入
  - 顯示影片標題、時長、觀看次數
  - 自動取得影片縮圖
  - 支援播放清單

- **Instagram 影片**
  - 支援貼文（Post）嵌入
  - 支援 Reels 嵌入
  - 顯示貼文資訊（使用者、按讚數、留言數）
  - 支援輪播貼文

#### 2. 內容關聯功能

- 將影片關聯到特定攀岩路線
- 將影片關聯到特定岩場
- 支援標籤（Tags）分類
- 支援關鍵字搜尋

#### 3. 互動功能

- 點擊開啟原始影片連結
- 影片收藏功能
- 影片播放統計

### 非功能需求

1. **效能**：延遲載入、縮圖快取
2. **響應式**：支援手機、平板、桌面
3. **可維護性**：資料結構標準化、版本控制

---

## 資料來源整合

### YouTube 資料收集

#### 收集方式

使用 `yt-dlp` 工具自動收集 YouTube 頻道資料：

```bash
# 收集頻道影片資訊
yt-dlp --dump-json --flat-playlist "https://www.youtube.com/@mellowclimbing/videos" > mellow_videos.json

# 轉換為專案格式
node scripts/convert-youtube-videos.js mellow_videos.json src/lib/constants/mellow_videos.ts
```

#### 現有腳本

| 腳本 | 用途 |
|------|------|
| `scripts/collect-youtube-data.sh` | 收集 YouTube 頻道資料 |
| `scripts/convert-youtube-videos.js` | 轉換影片資料格式 |
| `scripts/update-videos.sh` | 更新影片資料 |

#### YouTube 資料欄位

```typescript
interface YouTubeVideo {
  id: string
  youtubeId: string
  title: string
  description: string
  thumbnailUrl: string
  channel: string
  channelId: string
  publishedAt: string
  duration: string           // 格式: "3:24" 或 "1:23:45"
  durationCategory: 'short' | 'medium' | 'long'
  viewCount: string          // 格式化: "1.2K", "500"
  category: string
  tags: string[]
  featured: boolean
}
```

### Instagram 資料收集

#### 收集方式

1. **手動輸入**: 貼上 Instagram 貼文 URL
2. **API 整合**: 透過 Instagram Basic Display API 同步
3. **Hashtag 追蹤**: 自動追蹤特定 hashtag 的貼文

#### Instagram 資料欄位

```typescript
interface InstagramPost {
  id: number
  instagramId: string
  shortcode: string
  url: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REEL'
  caption: string
  username: string
  userProfilePic?: string
  postedAt: string
  likesCount: number
  commentsCount: number
  viewsCount?: number        // 影片專用
  hashtags?: string[]
  locationName?: string
  featured?: boolean
}
```

---

## 統一資料結構

### RouteVideo 統一介面

為了統一管理 YouTube 和 Instagram 的影片資料，設計了 `RouteVideo` 介面：

```typescript
// src/lib/types/route-video.ts

/**
 * 影片來源類型
 */
export type VideoSource = 'youtube' | 'instagram'

/**
 * 路線影片統一介面
 */
export interface RouteVideo {
  // === 基本識別 ===
  id: string
  source: VideoSource

  // === URL 資訊 ===
  url: string              // 原始 URL
  embedUrl: string         // 嵌入用 URL

  // === 元資料 ===
  title?: string
  description?: string
  thumbnail?: string
  author?: string          // YouTube: channel / Instagram: username
  authorAvatar?: string    // 作者頭像
  uploadDate?: string      // ISO 8601 格式

  // === 影片資訊 ===
  duration?: number        // 秒數
  durationFormatted?: string  // 格式化: "3:24"

  // === 統計資訊 ===
  viewCount?: number
  likeCount?: number
  commentCount?: number

  // === 分類資訊 ===
  tags?: string[]
  category?: string

  // === 關聯資訊 ===
  relatedRouteId?: string
  relatedCragId?: string

  // === 系統欄位 ===
  featured?: boolean
  order?: number
  createdAt?: string
  updatedAt?: string
}
```

### Route 擴充定義

```typescript
// src/lib/types/route.ts

export interface Route {
  // === 基本資訊 ===
  id: string
  name: string
  englishName: string
  grade: string
  length: string
  type: '運動攀登' | '傳統攀登' | '抱石' | '混合'
  area: string

  // === 詳細描述 ===
  description: string
  protection: string
  tips?: string
  firstAscent: string

  // === 統計資訊 ===
  popularity: number
  views: number

  // === 多媒體資源 ===
  images?: string[]

  /**
   * 路線相關影片（整合 YouTube + Instagram）
   */
  videos?: RouteVideo[]
}
```

### 資料轉換工具

```typescript
// src/lib/utils/video-converter.ts

/**
 * 將 YouTube 影片資料轉換為 RouteVideo
 */
export function youtubeToRouteVideo(ytVideo: YouTubeVideo): RouteVideo {
  return {
    id: `yt-${ytVideo.youtubeId}`,
    source: 'youtube',
    url: `https://www.youtube.com/watch?v=${ytVideo.youtubeId}`,
    embedUrl: `https://www.youtube.com/embed/${ytVideo.youtubeId}`,
    title: ytVideo.title,
    description: ytVideo.description,
    thumbnail: ytVideo.thumbnailUrl,
    author: ytVideo.channel,
    uploadDate: ytVideo.publishedAt,
    durationFormatted: ytVideo.duration,
    duration: parseDuration(ytVideo.duration),
    viewCount: parseViewCount(ytVideo.viewCount),
    tags: ytVideo.tags,
    category: ytVideo.category,
    featured: ytVideo.featured
  }
}

/**
 * 將 Instagram 貼文轉換為 RouteVideo
 */
export function instagramToRouteVideo(igPost: InstagramPost): RouteVideo {
  return {
    id: `ig-${igPost.shortcode}`,
    source: 'instagram',
    url: igPost.url,
    embedUrl: igPost.url,
    title: extractTitleFromCaption(igPost.caption),
    description: igPost.caption,
    author: igPost.username,
    authorAvatar: igPost.userProfilePic,
    uploadDate: igPost.postedAt,
    viewCount: igPost.viewsCount,
    likeCount: igPost.likesCount,
    commentCount: igPost.commentsCount,
    tags: igPost.hashtags,
    featured: igPost.featured
  }
}

/**
 * 偵測影片來源
 */
export function detectVideoSource(url: string): VideoSource {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube'
  }
  if (url.includes('instagram.com')) {
    return 'instagram'
  }
  throw new Error(`Unsupported video source: ${url}`)
}

/**
 * 從 URL 建立 RouteVideo
 */
export function createRouteVideoFromUrl(url: string): RouteVideo {
  const source = detectVideoSource(url)
  const id = extractVideoId(url, source)

  return {
    id: `${source.substring(0, 2)}-${id}`,
    source,
    url,
    embedUrl: getEmbedUrl(url, source)
  }
}
```

---

## 前端元件架構

### 元件結構

```
src/components/
├── video/                        # 統一影片元件
│   ├── VideoPlayer.tsx           # 統一影片播放器
│   ├── VideoThumbnail.tsx        # 影片縮圖
│   ├── VideoSourceBadge.tsx      # 來源標記 (YT/IG)
│   ├── VideoInfoCard.tsx         # 影片資訊卡片
│   ├── VideoGallery.tsx          # 影片畫廊
│   └── VideoGalleryModal.tsx     # 影片播放彈窗
│
├── youtube/                      # YouTube 專用元件
│   └── YouTubeEmbed.tsx          # YouTube iframe 嵌入
│
├── instagram/                    # Instagram 專用元件（已實作）
│   ├── instagram-embed.tsx       # Instagram 基礎嵌入
│   ├── instagram-post-card.tsx   # Instagram 貼文卡片
│   └── instagram-feed.tsx        # Instagram Feed 網格
│
└── route/                        # 路線頁面元件
    └── RouteVideos.tsx           # 路線影片區塊
```

### 核心元件設計

#### VideoPlayer - 統一影片播放器

```tsx
// src/components/video/VideoPlayer.tsx

'use client'

import { RouteVideo } from '@/lib/types/route-video'
import YouTubeEmbed from '@/components/youtube/YouTubeEmbed'
import InstagramEmbed from '@/components/instagram/instagram-embed'

interface VideoPlayerProps {
  video: RouteVideo
  autoplay?: boolean
  className?: string
}

export default function VideoPlayer({
  video,
  autoplay = false,
  className
}: VideoPlayerProps) {
  if (video.source === 'youtube') {
    return (
      <YouTubeEmbed
        videoId={extractYouTubeId(video.url)}
        autoplay={autoplay}
        className={className}
      />
    )
  }

  if (video.source === 'instagram') {
    return (
      <InstagramEmbed
        url={video.url}
        className={className}
      />
    )
  }

  return <div>Unsupported video source</div>
}
```

#### VideoSourceBadge - 來源標記

```tsx
// src/components/video/VideoSourceBadge.tsx

import { Youtube, Instagram } from 'lucide-react'
import { VideoSource } from '@/lib/types/route-video'

interface VideoSourceBadgeProps {
  source: VideoSource
  size?: 'sm' | 'md' | 'lg'
}

export default function VideoSourceBadge({
  source,
  size = 'md'
}: VideoSourceBadgeProps) {
  const config = {
    youtube: {
      icon: Youtube,
      color: 'bg-red-500',
      label: 'YouTube'
    },
    instagram: {
      icon: Instagram,
      color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500',
      label: 'Instagram'
    }
  }

  const { icon: Icon, color, label } = config[source]
  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }

  return (
    <div className={`inline-flex items-center gap-1 rounded text-white ${color} ${sizes[size]}`}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
  )
}
```

#### RouteVideos - 路線影片區塊

```tsx
// src/components/route/RouteVideos.tsx

'use client'

import { useState } from 'react'
import { RouteVideo } from '@/lib/types/route-video'
import VideoThumbnail from '@/components/video/VideoThumbnail'
import VideoGalleryModal from '@/components/video/VideoGalleryModal'

interface RouteVideosProps {
  videos: RouteVideo[]
  maxDisplay?: number
}

export default function RouteVideos({
  videos,
  maxDisplay = 3
}: RouteVideosProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const displayVideos = videos.slice(0, maxDisplay)
  const hasMore = videos.length > maxDisplay

  if (videos.length === 0) return null

  return (
    <section className="mt-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <span>相關影片</span>
        <span className="text-sm text-gray-500">({videos.length})</span>
      </h3>

      {/* 影片縮圖網格 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {displayVideos.map((video, index) => (
          <VideoThumbnail
            key={video.id}
            video={video}
            onClick={() => setSelectedIndex(index)}
          />
        ))}
      </div>

      {/* 查看更多按鈕 */}
      {hasMore && (
        <button
          className="mt-4 text-sm text-blue-600 hover:underline"
          onClick={() => setSelectedIndex(0)}
        >
          查看全部 {videos.length} 部影片
        </button>
      )}

      {/* 影片播放彈窗 */}
      {selectedIndex !== null && (
        <VideoGalleryModal
          videos={videos}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </section>
  )
}
```

---

## 後端 API 設計

### Cloudflare Workers + Hono API

基於現有的 Cloudflare Workers 後端架構，設計以下 API 端點：

#### API 端點規劃

```typescript
// backend/src/routes/videos.ts

import { Hono } from 'hono'
import { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

const videosRouter = new Hono<{ Bindings: Bindings }>()

// 取得所有影片
videosRouter.get('/', async (c) => {
  const { source, routeId, cragId, featured, limit, offset } = c.req.query()

  // 建立查詢
  let query = `SELECT * FROM route_videos WHERE 1=1`
  const params: any[] = []

  if (source) {
    query += ` AND source = ?`
    params.push(source)
  }
  if (routeId) {
    query += ` AND related_route_id = ?`
    params.push(routeId)
  }
  if (cragId) {
    query += ` AND related_crag_id = ?`
    params.push(cragId)
  }
  if (featured === 'true') {
    query += ` AND featured = 1`
  }

  query += ` ORDER BY created_at DESC`
  query += ` LIMIT ? OFFSET ?`
  params.push(limit || 20, offset || 0)

  const { results } = await c.env.DB.prepare(query).bind(...params).all()

  return c.json({
    success: true,
    data: results,
    meta: {
      limit: Number(limit) || 20,
      offset: Number(offset) || 0
    }
  })
})

// 取得單一影片
videosRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const { results } = await c.env.DB
    .prepare('SELECT * FROM route_videos WHERE id = ?')
    .bind(id)
    .all()

  if (results.length === 0) {
    return c.json({ success: false, error: 'Video not found' }, 404)
  }

  return c.json({ success: true, data: results[0] })
})

// 取得路線的影片
videosRouter.get('/route/:routeId', async (c) => {
  const routeId = c.req.param('routeId')
  const { results } = await c.env.DB
    .prepare(`
      SELECT * FROM route_videos
      WHERE related_route_id = ?
      ORDER BY "order" ASC, created_at DESC
    `)
    .bind(routeId)
    .all()

  return c.json({
    success: true,
    data: results,
    meta: { routeId, total: results.length }
  })
})

// 取得岩場的影片
videosRouter.get('/crag/:cragId', async (c) => {
  const cragId = c.req.param('cragId')
  const { results } = await c.env.DB
    .prepare(`
      SELECT * FROM route_videos
      WHERE related_crag_id = ?
      ORDER BY featured DESC, created_at DESC
    `)
    .bind(cragId)
    .all()

  return c.json({
    success: true,
    data: results,
    meta: { cragId, total: results.length }
  })
})

// 新增影片
videosRouter.post('/', async (c) => {
  const body = await c.req.json<RouteVideo>()

  // 驗證必填欄位
  if (!body.source || !body.url) {
    return c.json({ success: false, error: 'Missing required fields' }, 400)
  }

  // 自動產生 embedUrl
  const embedUrl = body.embedUrl || generateEmbedUrl(body.url, body.source)

  const { success } = await c.env.DB
    .prepare(`
      INSERT INTO route_videos (
        id, source, url, embed_url, title, description,
        thumbnail, author, upload_date, duration,
        view_count, like_count, comment_count,
        tags, category, related_route_id, related_crag_id,
        featured, "order", created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      body.id || generateId(body.source),
      body.source,
      body.url,
      embedUrl,
      body.title || null,
      body.description || null,
      body.thumbnail || null,
      body.author || null,
      body.uploadDate || null,
      body.duration || null,
      body.viewCount || null,
      body.likeCount || null,
      body.commentCount || null,
      JSON.stringify(body.tags || []),
      body.category || null,
      body.relatedRouteId || null,
      body.relatedCragId || null,
      body.featured ? 1 : 0,
      body.order || 0,
      new Date().toISOString()
    )
    .run()

  return c.json({ success, data: body }, 201)
})

// 關聯影片到路線
videosRouter.post('/:id/link-route', async (c) => {
  const id = c.req.param('id')
  const { routeId } = await c.req.json()

  await c.env.DB
    .prepare('UPDATE route_videos SET related_route_id = ? WHERE id = ?')
    .bind(routeId, id)
    .run()

  return c.json({ success: true, message: 'Video linked to route' })
})

export default videosRouter
```

#### D1 資料庫 Schema

```sql
-- backend/migrations/0003_create_route_videos.sql

CREATE TABLE IF NOT EXISTS route_videos (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK(source IN ('youtube', 'instagram')),
  url TEXT NOT NULL,
  embed_url TEXT NOT NULL,

  -- 元資料
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  author TEXT,
  author_avatar TEXT,
  upload_date TEXT,

  -- 影片資訊
  duration INTEGER,
  duration_formatted TEXT,

  -- 統計資訊
  view_count INTEGER,
  like_count INTEGER,
  comment_count INTEGER,

  -- 分類資訊
  tags TEXT DEFAULT '[]',  -- JSON array
  category TEXT,

  -- 關聯資訊
  related_route_id TEXT,
  related_crag_id TEXT,

  -- 系統欄位
  featured INTEGER DEFAULT 0,
  "order" INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT,

  -- 索引
  FOREIGN KEY (related_route_id) REFERENCES routes(id) ON DELETE SET NULL,
  FOREIGN KEY (related_crag_id) REFERENCES crags(id) ON DELETE SET NULL
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_route_videos_source ON route_videos(source);
CREATE INDEX IF NOT EXISTS idx_route_videos_route ON route_videos(related_route_id);
CREATE INDEX IF NOT EXISTS idx_route_videos_crag ON route_videos(related_crag_id);
CREATE INDEX IF NOT EXISTS idx_route_videos_featured ON route_videos(featured);
```

---

## 實作流程

### 影片新增流程

```
使用者輸入影片 URL
       │
       ▼
┌──────────────────┐
│ 偵測影片來源      │
│ (YouTube/IG)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 提取影片 ID       │
│ 產生嵌入 URL      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 自動取得元資料    │
│ (標題/縮圖/時長)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 關聯到路線/岩場   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 儲存到資料庫      │
└──────────────────┘
```

### 影片顯示流程

```
路線頁面載入
       │
       ▼
┌──────────────────┐
│ 取得路線影片列表  │
│ GET /api/videos/ │
│ route/{routeId}  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 渲染影片縮圖      │
│ 顯示來源標記      │
└────────┬─────────┘
         │
    點擊影片
         │
         ▼
┌──────────────────┐
│ 開啟播放彈窗      │
│ 根據來源載入播放器│
└────────┬─────────┘
         │
         ├─── YouTube ──► iframe 嵌入
         │
         └─── Instagram ─► Embed SDK
```

---

## 實作階段

### Phase 1: 基礎建設 (Week 1-2)

#### 任務清單

- [ ] **1.1 建立型別定義**
  - 建立 `src/lib/types/route-video.ts`
  - 更新 `src/lib/types/route.ts`
  - 匯出型別到 `src/lib/types/index.ts`

- [ ] **1.2 建立工具函式**
  - `src/lib/utils/video-converter.ts`
  - `src/lib/utils/video-helpers.ts`
  - 撰寫單元測試

- [ ] **1.3 建立資料庫 Schema**
  - 建立 D1 migration
  - 執行 migration
  - 測試資料表

- [ ] **1.4 建立 API 端點**
  - 影片 CRUD API
  - 路線影片關聯 API
  - 岩場影片關聯 API

**完成標準**:
- 型別定義完整且測試通過
- 工具函式測試覆蓋率 > 80%
- API 端點可正常運作

---

### Phase 2: 前端元件開發 (Week 2-3)

#### 任務清單

- [ ] **2.1 統一影片元件**
  - `VideoPlayer.tsx`
  - `VideoThumbnail.tsx`
  - `VideoSourceBadge.tsx`
  - `VideoInfoCard.tsx`

- [ ] **2.2 影片畫廊元件**
  - `VideoGallery.tsx`
  - `VideoGalleryModal.tsx`
  - 支援多影片切換
  - 響應式設計

- [ ] **2.3 YouTube 嵌入優化**
  - `YouTubeEmbed.tsx`
  - Lazy loading
  - 播放控制

- [ ] **2.4 Instagram 嵌入優化**
  - 整合現有 `instagram-embed.tsx`
  - SDK 載入優化
  - 錯誤處理

**完成標準**:
- 所有元件可獨立使用
- 支援 YouTube + Instagram 影片
- 響應式設計測試通過

---

### Phase 3: 路線頁面整合 (Week 3-4)

#### 任務清單

- [ ] **3.1 路線影片區塊**
  - 建立 `RouteVideos.tsx`
  - 整合到路線詳情頁
  - 顯示影片縮圖網格

- [ ] **3.2 API 整合**
  - 建立 `videoService.ts`
  - 設定 React Query hooks
  - 處理載入/錯誤狀態

- [ ] **3.3 現有元件更新**
  - 更新 `route-section.tsx`
  - 更新攀登攻略彈窗
  - 整合影片播放器

- [ ] **3.4 岩場頁面整合**
  - 在岩場詳情頁加入影片區塊
  - 顯示岩場相關影片

**完成標準**:
- 路線頁面正確顯示影片
- 岩場頁面正確顯示影片
- YouTube/Instagram 都能正常播放

---

### Phase 4: 資料管理與優化 (Week 4-5)

#### 任務清單

- [ ] **4.1 資料收集自動化**
  - 整合 YouTube 資料收集腳本
  - 設定定期更新排程
  - 建立資料驗證機制

- [ ] **4.2 影片管理介面**
  - 建立影片列表頁面
  - 影片新增/編輯表單
  - 影片關聯管理

- [ ] **4.3 效能優化**
  - 圖片 lazy loading
  - API 快取
  - 縮圖預載入

- [ ] **4.4 測試與文件**
  - E2E 測試
  - 跨瀏覽器測試
  - 更新技術文件

**完成標準**:
- 自動化流程運作正常
- 效能指標符合要求
- 文件完整且最新

---

## 附錄

### A. YouTube 縮圖 API

```
https://img.youtube.com/vi/{VIDEO_ID}/{QUALITY}.jpg

畫質選項:
- default.jpg     (120x90)
- mqdefault.jpg   (320x180)
- hqdefault.jpg   (480x360)
- sddefault.jpg   (640x480)
- maxresdefault.jpg (1280x720)
```

### B. Instagram Embed 技術

```html
<!-- Instagram Embed -->
<blockquote
  class="instagram-media"
  data-instgrm-permalink="https://www.instagram.com/p/POST_ID/"
  data-instgrm-version="14"
/>
<script async src="//www.instagram.com/embed.js"></script>
```

### C. URL 格式參考

#### YouTube URL 格式
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

#### Instagram URL 格式
- `https://www.instagram.com/p/POST_ID/`
- `https://www.instagram.com/reel/REEL_ID/`
- `https://www.instagram.com/tv/VIDEO_ID/`

---

## 結論

本文件整合了 YouTube 和 Instagram 影片到路線資訊的完整規劃，包含：

1. **統一資料結構**: `RouteVideo` 介面支援雙平台
2. **前端元件架構**: 統一影片播放器和展示元件
3. **後端 API 設計**: Cloudflare Workers + D1 資料庫
4. **實作流程**: 分階段漸進式開發

### 關鍵成功因素

- 資料結構標準化，易於擴展
- 元件設計模組化，可重複使用
- API 設計 RESTful，易於維護
- 分階段實作，降低風險

### 預期效益

- 提升使用者體驗：豐富的影片內容
- 增加平台黏著度：多元化的內容展示
- 整合社群資源：連結 YouTube/Instagram 生態

---

**文件版本**: v1.0
**建立日期**: 2026-01-11
**維護者**: Development Team
**狀態**: 待審核
