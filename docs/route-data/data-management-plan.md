# 路線資訊管理規劃 (Route Data Management Plan)

**專案**: nobodyclimb-fe
**建立日期**: 2025-12-03
**狀態**: Draft
**相關文件**:
- [需求文件](./demand.md)
- [功能規劃](./planning.md)

## 📋 目錄

1. [概述](#概述)
2. [現況分析](#現況分析)
3. [資料管理架構](#資料管理架構)
4. [資料來源與格式](#資料來源與格式)
5. [管理方案比較](#管理方案比較)
6. [推薦方案：階段性實作](#推薦方案階段性實作)
7. [資料操作介面](#資料操作介面)
8. [資料驗證與品質](#資料驗證與品質)
9. [遷移與備份策略](#遷移與備份策略)
10. [實作時程](#實作時程)

---

## 概述

### 管理目標

建立一套完整的路線資訊管理系統，讓團隊能夠：

1. **新增路線**: 輕鬆建立新的攀岩路線資料
2. **編輯資訊**: 更新路線描述、難度、影片等內容
3. **管理多媒體**: 上傳和管理路線照片、YouTube/Instagram 影片
4. **資料一致性**: 確保資料格式正確且完整
5. **版本控制**: 追蹤資料變更歷史
6. **協作管理**: 多人可以貢獻和審核路線資訊

### 核心挑戰

- **資料複雜度**: 路線資料包含文字、圖片、影片等多種類型
- **多媒體管理**: 需要管理 YouTube、Instagram 等外部影片連結
- **資料驗證**: 確保路線難度、類型等欄位符合規範
- **擴展性**: 從靜態資料過渡到動態資料庫
- **使用者體驗**: 提供簡單易用的管理介面

---

## 現況分析

### 當前資料管理方式

根據專案架構分析，目前有以下資料管理模式：

#### 1. **靜態資料檔案** (現行方式)

**位置**: `src/app/crag/[id]/page.tsx`

```typescript
// 模擬岩場資料（硬編碼在元件中）
const cragData = [
  {
    id: 1,
    name: '龍洞',
    englishName: 'Long Dong',
    // ... 其他欄位
    routes_details: [
      {
        id: 'LD001',
        name: '海神',
        englishName: 'Poseidon',
        grade: '5.11c',
        // ... 路線詳細資訊
      }
    ]
  }
]
```

**優點**:
- ✅ 實作簡單，無需後端
- ✅ 適合初期開發和測試
- ✅ 資料與程式碼一起版本控制

**缺點**:
- ❌ 資料與程式碼混合，不易維護
- ❌ 每次更新需要重新部署
- ❌ 無法即時更新內容
- ❌ 不適合多人協作編輯

#### 2. **JSON 資料檔案** (影片資料使用)

**位置**: `public/data/videos.json`

```json
[
  {
    "id": "56",
    "youtubeId": "PUdqRrQWLJ4",
    "title": "We Play Different | The North Face",
    "thumbnailUrl": "https://...",
    "channel": "The North Face",
    "publishedAt": "2025-08-19",
    "duration": "0:31"
  }
]
```

**優點**:
- ✅ 資料與程式碼分離
- ✅ 可獨立更新資料檔案
- ✅ 易於 Git 版本控制
- ✅ 支援資料匯入/匯出

**缺點**:
- ❌ 手動編輯 JSON 容易出錯
- ❌ 缺乏資料驗證機制
- ❌ 大量資料時效能問題
- ❌ 無法多人同時編輯

#### 3. **TypeScript 資料模組** (人物誌使用)

**位置**: `src/data/biographyData.ts`

```typescript
export const biographyData = [
  {
    id: 1,
    name: '謝璿',
    time: '2023.01.02',
    start: '2022',
    showUp: '各大天然岩場、波浪岩館',
    // ...
  }
]
```

**優點**:
- ✅ TypeScript 型別檢查
- ✅ IDE 自動完成支援
- ✅ 編譯時期錯誤檢測
- ✅ 易於重構和維護

**缺點**:
- ❌ 資料更新需要重新編譯
- ❌ 非技術人員難以編輯
- ❌ 無法動態載入

### 未來規劃：Django REST Framework 後端

**文件**: `specs/001-django-rest-framework/`

規劃中的後端 API 將提供：
- 完整的資料庫支援（PostgreSQL）
- RESTful API 端點
- 使用者權限管理
- 資料驗證與審核機制

---

## 資料管理架構

### 路線資料結構

根據 `planning.md` 定義的完整資料結構：

```typescript
// 岩場 (Crag)
interface Crag {
  id: number | string
  name: string                    // 岩場名稱
  englishName: string             // 英文名稱
  location: string                // 位置
  description: string             // 描述
  type: string                    // 岩場類型
  rockType: string                // 岩石類型

  // 統計資訊
  routes: number                  // 路線數量
  difficulty: string              // 難度範圍
  height: string                  // 岩壁高度

  // 交通與設施
  approach: string                // 步行時間
  transportation: Transportation[]
  parking: string
  amenities: string[]

  // 地理資訊
  geoCoordinates: {
    latitude: number
    longitude: number
  }

  // 多媒體
  images: string[]
  videoUrl?: string               // 介紹影片

  // 區域
  areas: Area[]

  // 路線詳情
  routes_details: Route[]
}

// 路線 (Route)
interface Route {
  id: string                      // 路線ID (如: LD001)
  name: string                    // 路線名稱
  englishName: string             // 英文名稱

  // 基本資訊
  grade: string                   // 難度等級 (如: 5.11c)
  length: string                  // 路線長度 (如: 25m)
  type: string                    // 攀登類型 (運動攀登/傳統攀登)
  area: string                    // 所屬區域

  // 歷史資訊
  firstAscent: string             // 首登者與年份

  // 詳細描述
  description: string             // 路線描述
  protection: string              // 保護裝備說明
  tips?: string                   // 攀登攻略

  // 統計資訊
  popularity: number              // 人氣值 (0-5)
  views: number                   // 瀏覽次數

  // 多媒體資源
  images?: string[]               // 路線照片
  videos?: RouteVideo[]           // 路線影片（新結構）
}

// 路線影片 (RouteVideo)
interface RouteVideo {
  id: string
  source: 'youtube' | 'instagram'
  url: string                     // 原始 URL
  embedUrl: string                // 嵌入 URL

  // 元資料（可選）
  title?: string
  description?: string
  thumbnail?: string
  author?: string
  uploadDate?: string
  duration?: number               // 秒
  viewCount?: number
}
```

### 資料層級關係

```
Crag (岩場)
├── Basic Info (基本資訊)
│   ├── name, location, type
│   └── description, statistics
│
├── Areas (區域)
│   ├── Area 1
│   ├── Area 2
│   └── Area N
│
├── Routes (路線)
│   ├── Route 1
│   │   ├── Basic Info
│   │   ├── Description
│   │   ├── Images []
│   │   └── Videos []
│   │       ├── YouTube Video
│   │       └── Instagram Video
│   └── Route N
│
└── Media (多媒體)
    ├── Crag Images []
    └── Intro Video
```

---

## 資料來源與格式

### 資料來源類型

#### 1. **結構化資料** (Structured Data)

**來源**: 手動輸入或資料庫匯入

```json
{
  "id": "LD001",
  "name": "海神",
  "englishName": "Poseidon",
  "grade": "5.11c",
  "length": "25m",
  "type": "運動攀登",
  "firstAscent": "李智強, 2001",
  "area": "第一長岬"
}
```

**管理方式**:
- JSON 檔案編輯
- 表單介面輸入
- CSV 批次匯入
- 資料庫直接寫入

#### 2. **文字內容** (Text Content)

**來源**: Markdown 或純文字

```markdown
# 路線描述

這條線路需要良好的體力和耐力，中間有一個關鍵的側拉動作...

## 攀登攻略

攀爬此路線時，建議在上方第三個確保點處多加注意...
```

**管理方式**:
- Markdown 編輯器
- 富文本編輯器 (WYSIWYG)
- 純文字檔案

#### 3. **圖片資源** (Images)

**來源**: 本地上傳或外部連結

```typescript
{
  images: [
    '/images/routes/poseidon-1.jpg',      // 本地儲存
    'https://cdn.example.com/img.jpg',    // CDN
    'https://cloudflare.r2.dev/img.jpg'   // Cloudflare R2
  ]
}
```

**儲存方案**:
- **本地儲存**: `public/images/routes/`
- **Cloudflare R2**: 物件儲存服務
- **外部 CDN**: 第三方圖床

#### 4. **影片連結** (Video URLs)

**來源**: YouTube / Instagram 公開連結

```typescript
{
  videos: [
    {
      source: 'youtube',
      url: 'https://www.youtube.com/watch?v=AbCdEfGhIjK'
    },
    {
      source: 'instagram',
      url: 'https://www.instagram.com/p/ABC123/'
    }
  ]
}
```

**管理方式**:
- 手動貼上 URL
- URL 驗證與解析
- 自動抓取縮圖（可選）

### 資料格式標準

#### JSON Schema 定義

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Route",
  "type": "object",
  "required": ["id", "name", "grade", "length", "type", "area"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[A-Z]{2}\\d{3}$",
      "description": "路線ID格式: 2個大寫字母 + 3個數字，如 LD001"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "grade": {
      "type": "string",
      "pattern": "^5\\.[0-9]{1,2}[a-d]?$",
      "description": "YDS 難度系統: 5.6 - 5.15d"
    },
    "length": {
      "type": "string",
      "pattern": "^\\d+m$",
      "description": "長度格式: 數字 + m，如 25m"
    },
    "type": {
      "type": "string",
      "enum": ["運動攀登", "傳統攀登", "抱石", "混合"]
    },
    "videos": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "source", "url"],
        "properties": {
          "id": { "type": "string" },
          "source": { "enum": ["youtube", "instagram"] },
          "url": { "type": "string", "format": "uri" },
          "embedUrl": { "type": "string", "format": "uri" }
        }
      }
    }
  }
}
```

---

## 管理方案比較

### 方案 A: 靜態 JSON 檔案 + Git 管理

**架構**:
```
public/data/
├── crags/
│   ├── longdong.json           # 龍洞岩場
│   ├── guanzilin.json          # 關子嶺岩場
│   └── index.json              # 岩場索引
└── routes/
    ├── longdong-routes.json    # 龍洞路線
    └── ...
```

**管理流程**:
1. 編輯 JSON 檔案
2. 執行驗證腳本
3. Git commit & push
4. 自動部署到 Cloudflare

**優點**:
- ✅ 實作簡單，無需後端
- ✅ Git 版本控制
- ✅ 資料即文件
- ✅ 可離線編輯

**缺點**:
- ❌ 需要技術背景
- ❌ 無即時預覽
- ❌ 協作困難（merge conflicts）
- ❌ 無權限控制

**適用場景**: 小型團隊、技術人員主導

---

### 方案 B: 低程式碼 CMS (Headless CMS)

**推薦工具**:
- **Strapi**: 開源、可自架
- **Sanity**: 強大的結構化內容
- **Contentful**: 商業化解決方案

**架構**:
```
Frontend (Next.js)
    ↓ fetch API
Headless CMS (Strapi)
    ↓ REST/GraphQL
Database (PostgreSQL)
```

**管理流程**:
1. 登入 CMS 後台
2. 使用視覺化介面新增/編輯路線
3. 上傳圖片
4. 發佈內容
5. Frontend 自動更新

**優點**:
- ✅ 視覺化編輯介面
- ✅ 權限管理完整
- ✅ 即時預覽
- ✅ 支援多人協作
- ✅ 資料驗證內建
- ✅ API 自動生成

**缺點**:
- ❌ 需要額外部署 CMS
- ❌ 學習成本
- ❌ 增加系統複雜度

**適用場景**: 內容管理頻繁、非技術人員參與

---

### 方案 C: Google Sheets + API

**架構**:
```
Google Sheets (資料源)
    ↓ Google Sheets API
Cloudflare Worker (轉換層)
    ↓ JSON API
Frontend (Next.js)
```

**管理流程**:
1. 編輯 Google Sheets 試算表
2. Worker 定期同步資料
3. 轉換為 JSON 格式
4. Frontend 讀取 API

**優點**:
- ✅ 熟悉的試算表介面
- ✅ 無需技術背景
- ✅ 多人即時協作
- ✅ 版本歷史
- ✅ 免費額度充足

**缺點**:
- ❌ 資料驗證較弱
- ❌ 多媒體管理困難
- ❌ 依賴 Google 服務
- ❌ API 配額限制

**適用場景**: 快速原型、非技術團隊

---

### 方案 D: 自建後端管理系統

**架構**:
```
Admin Panel (React)
    ↓ REST API
Django REST Framework
    ↓ ORM
PostgreSQL
    ↓ Storage
Cloudflare R2 (圖片/影片)
```

**管理流程**:
1. 登入管理後台
2. CRUD 操作路線資料
3. 上傳圖片到 R2
4. 貼上影片 URL
5. 資料審核與發佈

**優點**:
- ✅ 完全客製化
- ✅ 完整的資料庫支援
- ✅ 進階功能（審核、版本控制）
- ✅ 高效能
- ✅ 長期可維護

**缺點**:
- ❌ 開發成本高
- ❌ 維護成本高
- ❌ 需要伺服器成本

**適用場景**: 大型專案、長期運營

---

## 推薦方案：階段性實作

根據專案現況與需求，建議採用**漸進式架構**：

### Phase 1: 靜態 JSON + 編輯工具 (1-2 週)

**目標**: 建立基礎資料管理能力

**實作內容**:

1. **建立標準化 JSON 結構**

```
public/data/
├── crags/
│   ├── metadata.json           # 岩場元資料
│   └── routes/
│       ├── longdong.json       # 龍洞所有路線
│       └── ...
└── schema/
    └── route-schema.json       # JSON Schema 定義
```

2. **開發資料驗證腳本**

```bash
# scripts/validate-routes.js
node scripts/validate-routes.js
# ✓ longdong.json: 5 routes validated
# ✗ Error: Route LD003 missing required field 'grade'
```

3. **建立資料編輯器 (Web-based)**

```
/admin/routes/editor
├── Route List (路線列表)
├── Route Form (表單編輯)
│   ├── Basic Info
│   ├── Description (Markdown)
│   ├── Images Upload
│   └── Videos URL
└── Preview (即時預覽)
```

**技術棧**:
- **編輯器**: React + React Hook Form
- **驗證**: Zod schema validation
- **儲存**: 直接寫入 JSON 檔案（開發環境）

**完成標準**:
- ✅ 所有路線資料遷移到 JSON
- ✅ 驗證腳本可檢測資料錯誤
- ✅ 簡易編輯器可新增/編輯路線
- ✅ 支援影片 URL 管理

---

### Phase 2: Headless CMS 整合 (2-3 週)

**目標**: 提供專業的內容管理介面

**選用方案**: **Strapi** (開源、可自架)

**為什麼選 Strapi?**
- ✅ 開源免費
- ✅ 支援 PostgreSQL (與未來後端一致)
- ✅ REST + GraphQL API
- ✅ 自訂內容類型
- ✅ 圖片上傳內建
- ✅ 角色權限管理
- ✅ 可部署到 Railway/Heroku

**資料模型設計** (Strapi Content Types):

```javascript
// content-types/crag.js
module.exports = {
  collectionName: 'crags',
  info: {
    singularName: 'crag',
    pluralName: 'crags',
    displayName: 'Crag (岩場)'
  },
  attributes: {
    name: { type: 'string', required: true },
    englishName: { type: 'string', required: true },
    location: { type: 'string' },
    description: { type: 'richtext' },
    type: {
      type: 'enumeration',
      enum: ['海蝕岩場', '山岳岩場', '人工岩場']
    },
    images: {
      type: 'media',
      multiple: true,
      allowedTypes: ['images']
    },
    routes: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'api::route.route'
    }
  }
}

// content-types/route.js
module.exports = {
  collectionName: 'routes',
  attributes: {
    routeId: { type: 'string', required: true, unique: true },
    name: { type: 'string', required: true },
    englishName: { type: 'string' },
    grade: {
      type: 'enumeration',
      enum: ['5.6', '5.7', '5.8', '5.9', '5.10a', '5.10b', /* ... */]
    },
    length: { type: 'string' },
    type: {
      type: 'enumeration',
      enum: ['運動攀登', '傳統攀登', '抱石', '混合']
    },
    description: { type: 'richtext' },
    protection: { type: 'text' },
    tips: { type: 'richtext' },
    images: {
      type: 'media',
      multiple: true,
      allowedTypes: ['images']
    },
    videos: {
      type: 'component',
      repeatable: true,
      component: 'route.video'
    },
    crag: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'api::crag.crag'
    }
  }
}

// components/route/video.js
module.exports = {
  collectionName: 'components_route_videos',
  info: {
    displayName: 'Video',
    icon: 'play'
  },
  attributes: {
    source: {
      type: 'enumeration',
      enum: ['youtube', 'instagram'],
      required: true
    },
    url: { type: 'string', required: true },
    title: { type: 'string' },
    description: { type: 'text' },
    author: { type: 'string' },
    uploadDate: { type: 'date' }
  }
}
```

**部署架構**:

```
Frontend (Cloudflare Pages)
    ↓ https://strapi-api.nobodyclimb.cc
Strapi CMS (Railway/Heroku)
    ↓
PostgreSQL (Railway/Heroku)
    ↓
Cloudflare R2 (圖片儲存)
```

**API 使用範例**:

```typescript
// Frontend: 獲取龍洞岩場所有路線
const response = await fetch('https://strapi-api.nobodyclimb.cc/api/routes?filters[crag][name][$eq]=龍洞&populate=*')
const { data } = await response.json()

// Response structure
{
  data: [
    {
      id: 1,
      attributes: {
        routeId: 'LD001',
        name: '海神',
        grade: '5.11c',
        videos: [
          {
            source: 'youtube',
            url: 'https://youtube.com/...',
            title: '首攀影片'
          },
          {
            source: 'instagram',
            url: 'https://instagram.com/p/...'
          }
        ],
        images: {
          data: [
            { attributes: { url: '/uploads/...' } }
          ]
        }
      }
    }
  ]
}
```

**完成標準**:
- ✅ Strapi 部署完成
- ✅ 資料模型建立
- ✅ 現有資料遷移到 Strapi
- ✅ Frontend 串接 Strapi API
- ✅ 管理員可透過 Strapi 介面管理路線

---

### Phase 3: Django 後端整合 (3-4 週)

**目標**: 整合到最終的 Django REST Framework 後端

**參考文件**: `specs/001-django-rest-framework/`

**資料模型** (Django Models):

```python
# backend/climbing/models.py

from django.db import models
from django.contrib.auth.models import User

class Crag(models.Model):
    """岩場模型"""
    name = models.CharField(max_length=100, verbose_name='岩場名稱')
    english_name = models.CharField(max_length=100, verbose_name='英文名稱')
    location = models.CharField(max_length=200, verbose_name='位置')
    description = models.TextField(verbose_name='描述')
    type = models.CharField(max_length=50, choices=[
        ('sea_cliff', '海蝕岩場'),
        ('mountain', '山岳岩場'),
        ('indoor', '人工岩場'),
    ])

    # 地理資訊
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True)

    # 元資料
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name = '岩場'
        verbose_name_plural = '岩場'
        ordering = ['name']

class Route(models.Model):
    """路線模型"""
    route_id = models.CharField(max_length=20, unique=True, verbose_name='路線ID')
    name = models.CharField(max_length=100, verbose_name='路線名稱')
    english_name = models.CharField(max_length=100, verbose_name='英文名稱')

    # 基本資訊
    grade = models.CharField(max_length=10, verbose_name='難度等級')
    length = models.CharField(max_length=20, verbose_name='長度')
    type = models.CharField(max_length=20, choices=[
        ('sport', '運動攀登'),
        ('trad', '傳統攀登'),
        ('boulder', '抱石'),
        ('mixed', '混合'),
    ])
    area = models.CharField(max_length=100, verbose_name='區域')

    # 詳細描述
    description = models.TextField(verbose_name='路線描述')
    protection = models.TextField(verbose_name='保護裝備', blank=True)
    tips = models.TextField(verbose_name='攀登攻略', blank=True)

    # 歷史資訊
    first_ascent = models.CharField(max_length=200, verbose_name='首登', blank=True)

    # 統計資訊
    popularity = models.FloatField(default=0, verbose_name='人氣值')
    views = models.IntegerField(default=0, verbose_name='瀏覽次數')

    # 關聯
    crag = models.ForeignKey(Crag, on_delete=models.CASCADE, related_name='routes')

    # 元資料
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name = '路線'
        verbose_name_plural = '路線'
        ordering = ['route_id']

class RouteImage(models.Model):
    """路線圖片"""
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='images')
    image = models.URLField(verbose_name='圖片URL')
    caption = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

class RouteVideo(models.Model):
    """路線影片"""
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='videos')

    source = models.CharField(max_length=20, choices=[
        ('youtube', 'YouTube'),
        ('instagram', 'Instagram'),
    ])
    url = models.URLField(verbose_name='影片URL')
    embed_url = models.URLField(verbose_name='嵌入URL')

    # 元資料
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    thumbnail = models.URLField(blank=True)
    author = models.CharField(max_length=100, blank=True)
    upload_date = models.DateField(null=True, blank=True)
    duration = models.IntegerField(null=True, blank=True, help_text='秒')

    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name = '路線影片'
        verbose_name_plural = '路線影片'
        ordering = ['order']
```

**API 端點設計**:

```python
# backend/climbing/serializers.py

from rest_framework import serializers
from .models import Crag, Route, RouteImage, RouteVideo

class RouteVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteVideo
        fields = ['id', 'source', 'url', 'embed_url', 'title',
                  'description', 'thumbnail', 'author', 'upload_date',
                  'duration', 'order']

class RouteImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteImage
        fields = ['id', 'image', 'caption', 'order']

class RouteSerializer(serializers.ModelSerializer):
    images = RouteImageSerializer(many=True, read_only=True)
    videos = RouteVideoSerializer(many=True, read_only=True)

    class Meta:
        model = Route
        fields = '__all__'

class CragSerializer(serializers.ModelSerializer):
    routes = RouteSerializer(many=True, read_only=True)

    class Meta:
        model = Crag
        fields = '__all__'

# backend/climbing/views.py

from rest_framework import viewsets, filters
from .models import Crag, Route
from .serializers import CragSerializer, RouteSerializer

class CragViewSet(viewsets.ModelViewSet):
    queryset = Crag.objects.all()
    serializer_class = CragSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'location']

class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'grade', 'type']

    def get_queryset(self):
        queryset = Route.objects.all()
        crag_id = self.request.query_params.get('crag')
        if crag_id:
            queryset = queryset.filter(crag_id=crag_id)
        return queryset
```

**Django Admin 介面**:

```python
# backend/climbing/admin.py

from django.contrib import admin
from .models import Crag, Route, RouteImage, RouteVideo

class RouteImageInline(admin.TabularInline):
    model = RouteImage
    extra = 1

class RouteVideoInline(admin.TabularInline):
    model = RouteVideo
    extra = 1
    fields = ['source', 'url', 'title', 'order']

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['route_id', 'name', 'grade', 'type', 'crag', 'views']
    list_filter = ['type', 'crag', 'grade']
    search_fields = ['name', 'route_id', 'description']
    inlines = [RouteImageInline, RouteVideoInline]

    fieldsets = (
        ('基本資訊', {
            'fields': ('route_id', 'name', 'english_name', 'crag', 'area')
        }),
        ('攀登資訊', {
            'fields': ('grade', 'length', 'type', 'first_ascent')
        }),
        ('詳細描述', {
            'fields': ('description', 'protection', 'tips')
        }),
        ('統計資訊', {
            'fields': ('popularity', 'views')
        }),
    )

@admin.register(Crag)
class CragAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'type']
    search_fields = ['name', 'location']
```

**遷移策略**: 從 Strapi 到 Django

```python
# scripts/migrate_strapi_to_django.py

import requests
import json
from climbing.models import Crag, Route, RouteVideo, RouteImage

def migrate_from_strapi():
    """從 Strapi 遷移資料到 Django"""

    # 1. 獲取 Strapi 資料
    strapi_url = 'https://strapi-api.nobodyclimb.cc'
    routes = requests.get(f'{strapi_url}/api/routes?populate=*').json()

    for route_data in routes['data']:
        attrs = route_data['attributes']

        # 2. 建立路線
        route, created = Route.objects.get_or_create(
            route_id=attrs['routeId'],
            defaults={
                'name': attrs['name'],
                'english_name': attrs.get('englishName', ''),
                'grade': attrs['grade'],
                'length': attrs['length'],
                'type': attrs['type'],
                'description': attrs['description'],
                # ...
            }
        )

        # 3. 建立影片
        for video_data in attrs.get('videos', []):
            RouteVideo.objects.create(
                route=route,
                source=video_data['source'],
                url=video_data['url'],
                title=video_data.get('title', ''),
                # ...
            )

        # 4. 建立圖片
        for image_data in attrs.get('images', {}).get('data', []):
            RouteImage.objects.create(
                route=route,
                image=image_data['attributes']['url'],
                # ...
            )

        print(f'✓ Migrated route: {route.name}')
```

**完成標準**:
- ✅ Django models 建立完成
- ✅ REST API 端點正常運作
- ✅ Django Admin 介面可管理路線
- ✅ 資料從 Strapi 遷移到 Django
- ✅ Frontend 切換到 Django API

---

## 資料操作介面

### 介面 1: 命令列工具 (CLI)

**用途**: 批次操作、自動化腳本

```bash
# scripts/route-cli.js

# 新增路線
node scripts/route-cli.js add \
  --crag "龍洞" \
  --id "LD006" \
  --name "新路線" \
  --grade "5.10a" \
  --length "20m"

# 批次匯入
node scripts/route-cli.js import \
  --file "routes-data.csv"

# 驗證資料
node scripts/route-cli.js validate \
  --file "public/data/crags/longdong.json"

# 匯出資料
node scripts/route-cli.js export \
  --crag "龍洞" \
  --format "csv"
```

### 介面 2: Web 編輯器 (Phase 1)

**位置**: `/admin/routes/editor`

**功能**:

```
┌─────────────────────────────────────────┐
│  路線編輯器                             │
├─────────────────────────────────────────┤
│ 岩場: [龍洞 ▼]                          │
│                                         │
│ 路線ID: [LD___] (自動產生)              │
│ 中文名稱: [________________]            │
│ 英文名稱: [________________]            │
│                                         │
│ 難度: [5.11c ▼]                         │
│ 長度: [_____] m                         │
│ 類型: [運動攀登 ▼]                      │
│ 區域: [第一長岬 ▼]                      │
│                                         │
│ === 路線描述 ===                        │
│ [Markdown 編輯器]                       │
│                                         │
│ === 保護裝備 ===                        │
│ [文字輸入]                              │
│                                         │
│ === 路線照片 ===                        │
│ [+ 上傳圖片] [拖曳上傳區]               │
│  ┌────┐ ┌────┐                         │
│  │圖1 │ │圖2 │ [X 刪除]                │
│  └────┘ └────┘                         │
│                                         │
│ === 相關影片 ===                        │
│ [+ 新增影片]                            │
│  ┌──────────────────────────────┐      │
│  │ 來源: [YouTube ▼]             │      │
│  │ URL: [貼上連結]               │      │
│  │ 標題: [________________]      │      │
│  │ [X 移除]                      │      │
│  └──────────────────────────────┘      │
│                                         │
│  [即時預覽] [儲存草稿] [發佈]           │
└─────────────────────────────────────────┘
```

**技術實作**:

```tsx
// src/app/admin/routes/editor/page.tsx

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const routeSchema = z.object({
  routeId: z.string().regex(/^[A-Z]{2}\d{3}$/, '格式: 2字母+3數字'),
  name: z.string().min(1, '請輸入路線名稱'),
  englishName: z.string().optional(),
  grade: z.string().regex(/^5\.[0-9]{1,2}[a-d]?$/),
  length: z.string().regex(/^\d+m$/),
  type: z.enum(['運動攀登', '傳統攀登', '抱石', '混合']),
  area: z.string(),
  description: z.string(),
  protection: z.string().optional(),
  tips: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  videos: z.array(z.object({
    source: z.enum(['youtube', 'instagram']),
    url: z.string().url(),
    title: z.string().optional()
  })).optional()
})

type RouteForm = z.infer<typeof routeSchema>

export default function RouteEditor() {
  const { register, handleSubmit, formState: { errors } } = useForm<RouteForm>({
    resolver: zodResolver(routeSchema)
  })

  const onSubmit = async (data: RouteForm) => {
    // 儲存到 JSON 或 API
    console.log('Route data:', data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 表單欄位 */}
    </form>
  )
}
```

### 介面 3: Strapi CMS (Phase 2)

**登入**: `https://strapi-api.nobodyclimb.cc/admin`

**內容管理流程**:

1. **Content Manager** → **Routes** → **Create new entry**
2. 填寫表單欄位
3. 上傳圖片（自動上傳到 Cloudflare R2）
4. 新增影片元件
5. **Save** (草稿) 或 **Publish** (發佈)

### 介面 4: Django Admin (Phase 3)

**登入**: `https://api.nobodyclimb.cc/admin`

**進階功能**:
- 批次編輯
- 資料匯入/匯出
- 變更歷史記錄
- 權限管理

---

## 資料驗證與品質

### 驗證層級

#### Layer 1: Schema 驗證

```typescript
// src/lib/validators/route-validator.ts

import { z } from 'zod'

export const routeVideoSchema = z.object({
  id: z.string(),
  source: z.enum(['youtube', 'instagram']),
  url: z.string().url().refine(
    (url) => {
      return url.includes('youtube.com') ||
             url.includes('youtu.be') ||
             url.includes('instagram.com')
    },
    { message: '必須是有效的 YouTube 或 Instagram URL' }
  ),
  embedUrl: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().url().optional(),
  author: z.string().optional(),
  uploadDate: z.string().optional(),
  duration: z.number().int().positive().optional()
})

export const routeSchema = z.object({
  id: z.string().regex(/^[A-Z]{2}\d{3}$/, {
    message: '路線ID格式錯誤，應為2個大寫字母+3個數字，如 LD001'
  }),
  name: z.string().min(1).max(100),
  englishName: z.string().max(100),
  grade: z.string().regex(/^5\.[0-9]{1,2}[a-d]?$/, {
    message: '難度格式錯誤，應為 YDS 系統 (如 5.11c)'
  }),
  length: z.string().regex(/^\d+m$/, {
    message: '長度格式錯誤，應為數字+m (如 25m)'
  }),
  type: z.enum(['運動攀登', '傳統攀登', '抱石', '混合']),
  area: z.string(),
  description: z.string(),
  protection: z.string(),
  tips: z.string().optional(),
  firstAscent: z.string(),
  popularity: z.number().min(0).max(5),
  views: z.number().int().min(0),
  images: z.array(z.string().url()).optional(),
  videos: z.array(routeVideoSchema).optional()
})

export function validateRoute(data: unknown) {
  return routeSchema.safeParse(data)
}
```

#### Layer 2: 業務邏輯驗證

```typescript
// 進階驗證規則

export function validateRouteLogic(route: Route): ValidationResult {
  const errors: string[] = []

  // 1. 難度與類型一致性
  if (route.type === '抱石' && !route.grade.startsWith('V')) {
    errors.push('抱石路線應使用 V-scale 難度系統')
  }

  // 2. 路線長度合理性
  const length = parseInt(route.length)
  if (route.type === '抱石' && length > 10) {
    errors.push('抱石路線長度通常不超過 10m')
  }

  // 3. 影片 URL 可訪問性（可選）
  for (const video of route.videos || []) {
    if (video.source === 'youtube') {
      const videoId = extractYouTubeVideoId(video.url)
      if (!videoId) {
        errors.push(`YouTube 影片 URL 無效: ${video.url}`)
      }
    }
  }

  // 4. 必要欄位完整性
  if (!route.description || route.description.length < 20) {
    errors.push('路線描述過短，建議至少 20 字')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
```

#### Layer 3: 自動化測試

```typescript
// tests/data-validation.test.ts

import { validateRoute, validateRouteLogic } from '@/lib/validators/route-validator'

describe('Route Data Validation', () => {
  test('應通過有效的路線資料驗證', () => {
    const validRoute = {
      id: 'LD001',
      name: '海神',
      englishName: 'Poseidon',
      grade: '5.11c',
      length: '25m',
      type: '運動攀登',
      area: '第一長岬',
      description: '這條線路需要良好的體力和耐力...',
      protection: '固定保護點',
      firstAscent: '李智強, 2001',
      popularity: 4.5,
      views: 1245
    }

    const result = validateRoute(validRoute)
    expect(result.success).toBe(true)
  })

  test('應拒絕無效的路線ID', () => {
    const invalidRoute = {
      id: 'INVALID',  // 錯誤格式
      // ...
    }

    const result = validateRoute(invalidRoute)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('路線ID格式錯誤')
  })

  test('應驗證影片 URL 格式', () => {
    const routeWithVideos = {
      // ... 基本欄位
      videos: [
        {
          id: 'v1',
          source: 'youtube',
          url: 'https://www.youtube.com/watch?v=ABC123',
          embedUrl: 'https://www.youtube.com/embed/ABC123'
        },
        {
          id: 'v2',
          source: 'instagram',
          url: 'https://www.instagram.com/p/ABC123/',
          embedUrl: 'https://www.instagram.com/p/ABC123/'
        }
      ]
    }

    const result = validateRoute(routeWithVideos)
    expect(result.success).toBe(true)
  })
})
```

### 資料品質檢查清單

```bash
# scripts/quality-check.sh

#!/bin/bash

echo "🔍 執行資料品質檢查..."

# 1. Schema 驗證
echo "1️⃣ Schema 驗證..."
node scripts/validate-routes.js

# 2. 業務邏輯驗證
echo "2️⃣ 業務邏輯驗證..."
node scripts/validate-logic.js

# 3. 檢查重複資料
echo "3️⃣ 檢查重複路線ID..."
node scripts/check-duplicates.js

# 4. 檢查缺失圖片
echo "4️⃣ 檢查缺失的圖片檔案..."
node scripts/check-missing-images.js

# 5. 檢查無效影片連結
echo "5️⃣ 驗證影片 URL..."
node scripts/validate-video-urls.js

# 6. 統計報告
echo "6️⃣ 生成統計報告..."
node scripts/generate-stats.js

echo "✅ 資料品質檢查完成！"
```

---

## 遷移與備份策略

### 資料遷移流程

#### 遷移 1: 從元件內資料 → JSON 檔案

```bash
# scripts/extract-route-data.ts

import fs from 'fs'

// 讀取現有元件檔案
const componentContent = fs.readFileSync('src/app/crag/[id]/page.tsx', 'utf-8')

// 提取 cragData
const dataMatch = componentContent.match(/const cragData = (\[[\s\S]*?\]);/m)
const cragData = eval(dataMatch[1])

// 分離路線資料
cragData.forEach(crag => {
  const routes = crag.routes_details
  const filename = `public/data/routes/${crag.englishName.toLowerCase().replace(/\s/g, '-')}.json`

  fs.writeFileSync(filename, JSON.stringify(routes, null, 2))
  console.log(`✓ Exported ${routes.length} routes to ${filename}`)
})
```

#### 遷移 2: JSON → Strapi

```typescript
// scripts/import-to-strapi.ts

import fs from 'fs'
import axios from 'axios'

const STRAPI_URL = 'https://strapi-api.nobodyclimb.cc'
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN

async function importRoutes() {
  const routes = JSON.parse(fs.readFileSync('public/data/routes/longdong.json', 'utf-8'))

  for (const route of routes) {
    // 轉換格式
    const strapiRoute = {
      data: {
        routeId: route.id,
        name: route.name,
        englishName: route.englishName,
        grade: route.grade,
        // ... 其他欄位

        // 轉換影片格式
        videos: route.videos?.map(v => ({
          source: v.source || detectSource(v),
          url: v.url || v,
          embedUrl: v.embedUrl || convertToEmbedUrl(v.url || v)
        }))
      }
    }

    // 發送到 Strapi
    await axios.post(`${STRAPI_URL}/api/routes`, strapiRoute, {
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`✓ Imported route: ${route.name}`)
  }
}

importRoutes()
```

#### 遷移 3: Strapi → Django

見前面 Phase 3 的 `migrate_strapi_to_django.py`

### 備份策略

#### 1. Git 版本控制（JSON 檔案）

```bash
# 自動備份腳本

git add public/data/routes/*.json
git commit -m "chore: backup route data $(date +%Y-%m-%d)"
git push origin main
```

#### 2. 資料庫備份（Strapi/Django）

```bash
# Strapi 資料庫備份
pg_dump -h localhost -U strapi_user strapi_db > backup/strapi_$(date +%Y%m%d).sql

# Django 資料庫備份
python manage.py dumpdata climbing > backup/django_$(date +%Y%m%d).json
```

#### 3. 自動化備份腳本

```bash
# scripts/auto-backup.sh

#!/bin/bash

BACKUP_DIR="./backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# 1. 備份 JSON 檔案
cp -r public/data/routes $BACKUP_DIR/

# 2. 備份資料庫（如果使用）
if [ -f "strapi.db" ]; then
  cp strapi.db $BACKUP_DIR/
fi

# 3. 上傳到 Cloudflare R2
# wrangler r2 object put backups/$(date +%Y%m%d).tar.gz --file $BACKUP_DIR.tar.gz

# 4. 保留最近 30 天的備份
find ./backups -type d -mtime +30 -exec rm -rf {} \;

echo "✅ 備份完成: $BACKUP_DIR"
```

#### 4. Cron 自動執行

```bash
# 每天凌晨 2 點執行備份
0 2 * * * /path/to/scripts/auto-backup.sh
```

---

## 實作時程

### Timeline 概覽

```
Week 1-2   ━━━━━━━━━━━━━━━━━━━  Phase 1: JSON + Editor
Week 3-5   ━━━━━━━━━━━━━━━━━━━  Phase 2: Strapi CMS
Week 6-9   ━━━━━━━━━━━━━━━━━━━  Phase 3: Django Backend
```

### 詳細排程

#### Phase 1: 靜態 JSON + 編輯工具 (2 週)

**Week 1**:
- [ ] Day 1-2: 設計 JSON 結構與 Schema
- [ ] Day 3-4: 開發資料驗證腳本
- [ ] Day 5-7: 建立簡易 Web 編輯器

**Week 2**:
- [ ] Day 1-3: 遷移現有資料到 JSON
- [ ] Day 4-5: 整合到 Frontend
- [ ] Day 6-7: 測試與修正

**Deliverables**:
- ✅ `public/data/routes/*.json`
- ✅ `scripts/validate-routes.js`
- ✅ `/admin/routes/editor` 編輯器
- ✅ 文件更新

---

#### Phase 2: Headless CMS 整合 (3 週)

**Week 3**:
- [ ] Day 1-2: Strapi 安裝與配置
- [ ] Day 3-5: 設計 Content Types
- [ ] Day 6-7: 測試與調整

**Week 4**:
- [ ] Day 1-3: 資料遷移到 Strapi
- [ ] Day 4-5: Frontend API 整合
- [ ] Day 6-7: 圖片上傳配置（R2）

**Week 5**:
- [ ] Day 1-3: 管理介面優化
- [ ] Day 4-5: 權限與角色設定
- [ ] Day 6-7: 測試與文件

**Deliverables**:
- ✅ Strapi 部署完成
- ✅ API 端點可用
- ✅ 資料遷移完成
- ✅ 管理員培訓文件

---

#### Phase 3: Django 後端整合 (4 週)

**Week 6**:
- [ ] Day 1-3: Django models 設計
- [ ] Day 4-5: REST API 實作
- [ ] Day 6-7: Django Admin 配置

**Week 7**:
- [ ] Day 1-3: 資料遷移腳本
- [ ] Day 4-5: 執行遷移與驗證
- [ ] Day 6-7: API 測試

**Week 8**:
- [ ] Day 1-3: Frontend 切換到 Django API
- [ ] Day 4-5: 效能優化
- [ ] Day 6-7: 整合測試

**Week 9**:
- [ ] Day 1-3: 文件撰寫
- [ ] Day 4-5: 使用者培訓
- [ ] Day 6-7: 上線部署

**Deliverables**:
- ✅ Django 後端部署
- ✅ 完整 API 文件
- ✅ 管理介面
- ✅ 使用者手冊

---

## 總結

### 核心建議

1. **採用階段性實作**: 從簡單的 JSON 開始，逐步升級到 CMS 和後端
2. **優先 Strapi**: 在 Django 完成前，使用 Strapi 提供專業的內容管理
3. **資料驗證優先**: 從一開始就建立嚴格的資料驗證機制
4. **自動化工具**: 開發 CLI 工具和腳本簡化日常操作
5. **定期備份**: 建立自動化備份流程，確保資料安全

### 成功指標

- ✅ 非技術人員可獨立新增/編輯路線
- ✅ 資料更新後 5 分鐘內在前端顯示
- ✅ 影片（YouTube + Instagram）正常嵌入播放
- ✅ 資料驗證錯誤率 < 1%
- ✅ 完整的備份與恢復機制

### 下一步行動

1. **立即開始**: Phase 1 JSON 結構設計
2. **並行開發**: 影片功能實作（參考 `planning.md`）
3. **評估 Strapi**: 註冊並測試 Strapi 功能
4. **準備遷移**: 整理現有路線資料

---

**文件版本**: v1.0
**最後更新**: 2025-12-03
**負責人**: Development Team
**審核狀態**: 待審核
