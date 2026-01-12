# 內容管理方案比較分析 (CMS Comparison Analysis)

**專案**: nobodyclimb-fe - 路線資訊管理
**建立日期**: 2025-12-03
**使用場景**: 多人協作編輯攀岩路線資訊（文字、圖片、YouTube/Instagram 影片）

## 📊 快速比較總覽

| 指標 | Google Sheets | Notion | Strapi |
|------|--------------|--------|--------|
| **學習曲線** | ⭐⭐⭐⭐⭐ 最簡單 | ⭐⭐⭐⭐ 簡單 | ⭐⭐⭐ 中等 |
| **多人協作** | ⭐⭐⭐⭐⭐ 即時協作 | ⭐⭐⭐⭐⭐ 即時協作 | ⭐⭐⭐⭐ 角色權限 |
| **資料驗證** | ⭐⭐ 弱 | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐⭐ 強 |
| **多媒體管理** | ⭐⭐ 只能連結 | ⭐⭐⭐⭐ 嵌入預覽 | ⭐⭐⭐⭐⭐ 完整管理 |
| **API 整合** | ⭐⭐⭐ 需要轉換 | ⭐⭐⭐⭐ 官方 API | ⭐⭐⭐⭐⭐ 自動生成 |
| **成本** | ⭐⭐⭐⭐⭐ 免費 | ⭐⭐⭐⭐ $8-10/月 | ⭐⭐⭐⭐ 免費（自架） |
| **客製化** | ⭐⭐ 受限 | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐⭐ 完全客製 |
| **長期維護** | ⭐⭐⭐ 依賴 Google | ⭐⭐⭐ 依賴 Notion | ⭐⭐⭐⭐⭐ 自主控制 |

---

## 方案 A: Google Sheets

<img src="https://img.shields.io/badge/推薦指數-3/5-orange" />

### 概述

使用 Google Sheets 作為資料庫，透過 Google Sheets API 讀取資料。

### 資料結構範例

**Sheet 1: 路線基本資訊**

| route_id | name | english_name | grade | length | type | area | description | protection | tips |
|----------|------|--------------|-------|--------|------|------|-------------|------------|------|
| LD001 | 海神 | Poseidon | 5.11c | 25m | 運動攀登 | 第一長岬 | 這條線路需要... | 固定保護點 | 攀爬此路線時... |
| LD002 | 藍色海洋 | Blue Ocean | 5.9+ | 18m | 傳統攀登 | 音樂廳 | 經典的中等難度... | 需自備裝備 | 攀爬前檢查... |

**Sheet 2: 路線影片**

| route_id | video_order | source | url | title | description |
|----------|-------------|--------|-----|-------|-------------|
| LD001 | 1 | youtube | <https://youtube.com/>... | 首攀影片 | 展示關鍵動作 |
| LD001 | 2 | instagram | <https://instagram.com/p/>... | 攀登示範 | ... |

**Sheet 3: 路線圖片**

| route_id | image_order | url | caption |
|----------|-------------|-----|---------|
| LD001 | 1 | https://... | 起攀段 |
| LD001 | 2 | https://... | 關鍵動作 |

### 技術架構

```
Google Sheets (資料源)
    ↓ Google Sheets API
Cloudflare Worker (資料轉換層)
    ↓ 快取 (KV Storage)
    ↓ JSON API
Next.js Frontend
```

### 實作範例

**1. Google Sheets API 設定**

```bash
# 啟用 Google Sheets API
1. 前往 https://console.cloud.google.com
2. 建立新專案 "NobodyClimb"
3. 啟用 "Google Sheets API"
4. 建立服務帳號金鑰 (JSON)
5. 將 Sheet 分享給服務帳號信箱
```

**2. Cloudflare Worker 讀取資料**

```typescript
// workers/sheets-api.ts

import { google } from 'googleapis'

export default {
  async fetch(request: Request, env: Env) {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(env.GOOGLE_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // 讀取路線資料
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: env.SHEET_ID,
      range: '路線基本資訊!A2:J100'
    })

    const rows = response.data.values || []

    // 轉換為 JSON
    const routes = rows.map(row => ({
      id: row[0],
      name: row[1],
      englishName: row[2],
      grade: row[3],
      length: row[4],
      type: row[5],
      area: row[6],
      description: row[7],
      protection: row[8],
      tips: row[9]
    }))

    // 讀取影片資料
    const videoResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: env.SHEET_ID,
      range: '路線影片!A2:F100'
    })

    const videoRows = videoResponse.data.values || []
    const videos = videoRows.map(row => ({
      routeId: row[0],
      order: parseInt(row[1]),
      source: row[2],
      url: row[3],
      title: row[4],
      description: row[5]
    }))

    // 合併資料
    const routesWithVideos = routes.map(route => ({
      ...route,
      videos: videos
        .filter(v => v.routeId === route.id)
        .sort((a, b) => a.order - b.order)
    }))

    return Response.json(routesWithVideos)
  }
}
```

### ✅ 優點

1. **零學習成本**
   - 所有人都會用試算表
   - 熟悉的儲存格、公式、篩選功能
   - 不需要技術背景

2. **即時協作**
   - 多人同時編輯
   - 即時看到其他人的變更
   - 內建留言討論功能

3. **版本歷史**
   - 自動記錄所有變更
   - 可回溯到任何時間點
   - 查看誰改了什麼

4. **免費**
   - Google 帳號即可使用
   - API 每天 100 次免費呼叫（足夠）
   - 無額外成本

5. **快速開始**
   - 建立 Sheet → 分享連結 → 開始編輯
   - 5 分鐘就能上手

6. **強大的資料處理**
   - 公式、樞紐分析、圖表
   - 資料驗證（下拉選單）
   - 條件式格式化

### ❌ 缺點

1. **資料驗證較弱**
   - 只能用「資料驗證」功能（下拉選單、範圍檢查）
   - 無法驗證複雜格式（如路線 ID: LD001）
   - 容易輸入錯誤資料

   ```
   例如：
   ✗ 難度輸入 "5.11" （少了 a/b/c/d）
   ✗ 長度輸入 "25" （少了單位 m）
   ✗ URL 輸入錯誤格式
   ```

2. **多媒體管理困難**
   - **無法上傳圖片**，只能貼連結
   - 無法預覽圖片/影片
   - 需要額外的圖床服務

   ```
   Sheet 中只能存：
   https://imgur.com/abc123.jpg  ← 需要先上傳到圖床
   https://youtube.com/...        ← 只是連結，無法預覽
   ```

3. **結構化資料困難**
   - 一對多關係需要多個 Sheet
   - 需要手動維護 `route_id` 關聯
   - 容易出現資料不一致

   ```
   路線 LD001 有 3 個影片：
   Sheet1: LD001 的基本資料
   Sheet2: LD001 的影片 1, 2, 3 （需手動對應 route_id）

   風險：刪除路線後忘記刪除對應的影片資料
   ```

4. **API 限制**
   - 每天 100 次讀取（免費版）
   - 需要服務帳號設定（技術門檻）
   - 資料轉換邏輯需自己寫

5. **效能問題**
   - API 呼叫較慢（1-2 秒）
   - 需要快取機制
   - 大量資料時載入緩慢

6. **格式控制困難**
   - Markdown 無法渲染
   - 長文字在儲存格中難以閱讀
   - 無法做格式化編輯（粗體、斜體等）

### 🎯 適用場景

- ✅ **快速原型開發**（1-2 週內驗證概念）
- ✅ **非技術團隊**（行銷、內容團隊）
- ✅ **資料結構簡單**（單一表格）
- ✅ **預算極度受限**（完全免費）

### 💡 實際使用建議

如果選擇 Google Sheets，建議：

1. **使用資料驗證**

   ```
   - 難度欄位：下拉選單（5.6, 5.7, ..., 5.15d）
   - 類型欄位：下拉選單（運動攀登、傳統攀登、抱石、混合）
   - URL 欄位：自訂公式檢查格式
   ```

2. **建立範本**
   - 複製範本 Sheet 新增路線
   - 預填固定值（如岩場名稱）

3. **使用條件式格式化**
   - 必填欄位空白時標紅
   - 無效資料標黃

4. **定期匯出備份**

   ```bash
   # 每天自動匯出 CSV
   0 2 * * * node scripts/export-from-sheets.js
   ```

---

## 方案 B: Notion

<img src="https://img.shields.io/badge/推薦指數-4/5-blue" />

### 概述

使用 Notion Database 作為內容管理系統，透過 Notion API 讀取資料。

### 資料結構範例

**Notion Database: 攀岩路線**

| 屬性名稱 | 類型 | 說明 |
|----------|------|------|
| 路線 ID | Title | LD001 |
| 中文名稱 | Text | 海神 |
| 英文名稱 | Text | Poseidon |
| 難度 | Select | 5.11c |
| 長度 | Text | 25m |
| 類型 | Select | 運動攀登 |
| 區域 | Relation | → 區域 Database |
| 描述 | Rich Text | （支援 Markdown）|
| 保護裝備 | Rich Text | 固定保護點... |
| 攀登攻略 | Rich Text | 攀爬此路線時... |
| 路線照片 | Files & Media | [上傳圖片] |
| 相關影片 | URL (Multi) | YouTube/IG 連結 |
| 人氣值 | Number | 4.5 |
| 瀏覽次數 | Number | 1245 |
| 狀態 | Status | ✅ 已發佈 |
| 建立者 | Created by | @user |
| 更新時間 | Last edited time | 2025-12-03 |

**Notion Database 視圖**

```
Table View (表格視圖)
├─ 所有路線
├─ 依難度篩選 (5.10a - 5.12d)
├─ 依類型篩選 (運動攀登)
└─ 待審核

Gallery View (畫廊視圖)
└─ 以封面圖片呈現路線

Board View (看板視圖)
├─ 草稿
├─ 待審核
└─ 已發佈
```

### 技術架構

```
Notion Database
    ↓ Notion API
Cloudflare Worker / Next.js API
    ↓ 快取 (KV Storage)
    ↓ JSON API
Next.js Frontend
```

### 實作範例

**1. Notion API 設定**

```bash
# 設定步驟
1. 前往 https://www.notion.so/my-integrations
2. 建立新整合 "NobodyClimb API"
3. 複製 Integration Token
4. 分享 Database 給整合

# 環境變數
NOTION_API_KEY=secret_xxxxx
NOTION_DATABASE_ID=abc123def456
```

**2. Next.js API Route**

```typescript
// src/app/api/routes/route.ts

import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_API_KEY
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cragId = searchParams.get('crag')

  // 查詢 Notion Database
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: cragId ? {
      property: '岩場',
      relation: {
        contains: cragId
      }
    } : undefined,
    sorts: [
      {
        property: '路線 ID',
        direction: 'ascending'
      }
    ]
  })

  // 轉換為前端格式
  const routes = response.results.map((page: any) => {
    const props = page.properties

    return {
      id: props['路線 ID'].title[0]?.plain_text || '',
      name: props['中文名稱'].rich_text[0]?.plain_text || '',
      englishName: props['英文名稱'].rich_text[0]?.plain_text || '',
      grade: props['難度'].select?.name || '',
      length: props['長度'].rich_text[0]?.plain_text || '',
      type: props['類型'].select?.name || '',
      area: props['區域'].rich_text[0]?.plain_text || '',
      description: props['描述'].rich_text[0]?.plain_text || '',
      protection: props['保護裝備'].rich_text[0]?.plain_text || '',
      tips: props['攀登攻略'].rich_text[0]?.plain_text || '',
      popularity: props['人氣值'].number || 0,
      views: props['瀏覽次數'].number || 0,

      // 圖片
      images: props['路線照片'].files?.map((f: any) =>
        f.type === 'file' ? f.file.url : f.external.url
      ) || [],

      // 影片
      videos: props['相關影片'].url ? [
        {
          id: '1',
          source: detectVideoSource(props['相關影片'].url),
          url: props['相關影片'].url,
          embedUrl: convertToEmbedUrl(props['相關影片'].url)
        }
      ] : []
    }
  })

  return Response.json(routes)
}
```

**3. Notion 頁面內容編輯**

```markdown
# 海神 (Poseidon)

## 路線描述

這條線路需要良好的體力和耐力，中間有一個關鍵的側拉動作需要配合腳步的精準踩點。

**關鍵動作：**
- 第 3 個確保點：側拉 + 精準踩點
- 頂部懸空段：重心控制

## 保護裝備

- 固定保護點
- 頂部有確保站

## 攀登攻略

1. **熱身**: 充分熱身足部和手臂
2. **中段技巧**: 第三個確保點多加注意
3. **最佳時間**: 冬季下午，陽光不會直射岩壁

---

📹 相關影片：
- [首攀影片](https://youtube.com/...)
- [攻略示範](https://instagram.com/...)
```

### ✅ 優點

1. **優雅的編輯體驗**
   - 類似筆記本的介面
   - 所見即所得編輯器
   - 支援 Markdown、拖曳排版

2. **強大的多媒體支援**
   - **直接上傳圖片** ✨
   - 圖片預覽、拖曳排序
   - 嵌入 YouTube/Instagram（自動預覽）
   - 支援 PDF、影片等多種格式

   ```
   Notion 中可以：
   [上傳圖片] → 直接拖曳圖片到編輯器
   [貼上 YouTube URL] → 自動顯示播放器預覽
   [嵌入 Instagram] → 自動顯示貼文預覽
   ```

3. **即時協作**
   - 多人同時編輯
   - 即時顯示其他人游標
   - @提及其他成員
   - 留言討論功能

4. **靈活的資料視圖**
   - 表格視圖（像試算表）
   - 畫廊視圖（圖片牆）
   - 看板視圖（Kanban）
   - 時間軸視圖
   - 列表視圖

5. **資料驗證較好**
   - Select 屬性（下拉選單）
   - Number 屬性（只能輸入數字）
   - URL 屬性（驗證 URL 格式）
   - Relation 屬性（關聯其他 Database）

6. **工作流程支援**
   - Status 屬性（草稿 → 待審核 → 已發佈）
   - 篩選器（只看特定狀態）
   - 排序

7. **官方 API**
   - 完整的 API 文件
   - 官方 SDK (@notionhq/client)
   - 穩定可靠

8. **跨平台**
   - Web、桌面、行動裝置 App
   - 離線編輯（同步）

### ❌ 缺點

1. **需要付費（團隊協作）**
   - 免費版：個人使用，有限協作
   - Plus 方案：$8/月/人（10+ 成員）
   - 對於團隊使用，需要成本

2. **API 限制**
   - 每秒 3 次請求限制
   - 需要快取機制避免超過限制
   - 不適合高流量應用

3. **資料結構限制**
   - **一個屬性只能存一個 URL**（無法存多個影片）
   - 需要用 Relation 關聯到另一個 Database
   - 複雜的一對多關係較麻煩

   ```
   路線有多個影片的解決方案：

   方案 1: 建立「影片 Database」
   攀岩路線 Database
       ↓ Relation
   影片 Database (每個影片一筆資料)

   方案 2: 在描述中用 Embed 嵌入多個影片
   （但無法透過 API 結構化存取）
   ```

4. **Rich Text 長度限制**
   - 單個 Rich Text 欄位最多 2000 字
   - 超長內容需要分段

5. **匯出格式有限**
   - 匯出為 Markdown、CSV、HTML
   - 無法直接匯出為 JSON（需透過 API）

6. **依賴 Notion 服務**
   - 如果 Notion 服務中斷，無法存取
   - 資料在 Notion 的伺服器上
   - 無法完全自主控制

7. **學習曲線（相對 Google Sheets）**
   - 需要理解 Database、Property、Relation 等概念
   - 非技術人員需要一些時間上手

### 🎯 適用場景

- ✅ **內容豐富**（需要 Markdown、圖片預覽）
- ✅ **協作頻繁**（團隊即時編輯）
- ✅ **工作流程**（草稿 → 審核 → 發佈）
- ✅ **願意付費**（團隊有預算）
- ⚠️ **資料量不大**（< 1000 筆，API 限制）

### 💡 實際使用建議

如果選擇 Notion，建議：

1. **資料庫架構設計**

   ```
   Database 1: 岩場 (Crags)
   ├─ 岩場名稱 (Title)
   ├─ 位置 (Text)
   └─ 路線 (Relation to Database 2)

   Database 2: 攀岩路線 (Routes)
   ├─ 路線 ID (Title)
   ├─ 基本資訊 (Properties)
   ├─ 岩場 (Relation to Database 1)
   ├─ 影片 (Relation to Database 3)
   └─ 內容 (Page Content - Rich Text)

   Database 3: 路線影片 (Route Videos)
   ├─ 標題 (Title)
   ├─ 來源 (Select: YouTube/Instagram)
   ├─ URL (URL)
   ├─ 所屬路線 (Relation to Database 2)
   └─ 排序 (Number)
   ```

2. **使用範本 (Templates)**
   - 建立「新路線範本」
   - 預設欄位、格式

3. **權限管理**
   - 編輯者：可新增、修改路線
   - 審核者：可變更狀態為「已發佈」
   - 檢視者：唯讀

4. **API 快取策略**

   ```typescript
   // 使用 Cloudflare KV 快取
   const cacheKey = `notion_routes_${cragId}`
   const cached = await env.KV.get(cacheKey)

   if (cached) {
     return Response.json(JSON.parse(cached))
   }

   // 從 Notion API 取得資料
   const routes = await fetchFromNotion()

   // 快取 5 分鐘
   await env.KV.put(cacheKey, JSON.stringify(routes), {
     expirationTtl: 300
   })
   ```

---

## 方案 C: Strapi (Headless CMS)

<img src="https://img.shields.io/badge/推薦指數-5/5-green" />

### 概述

開源的 Headless CMS，提供完整的內容管理功能和 REST/GraphQL API。

### 資料結構範例

**Strapi Content Types**

```javascript
// Collection Type: Route (路線)
{
  "kind": "collectionType",
  "collectionName": "routes",
  "info": {
    "singularName": "route",
    "pluralName": "routes",
    "displayName": "Route (路線)"
  },
  "options": {
    "draftAndPublish": true  // 草稿與發佈功能
  },
  "attributes": {
    // 基本資訊
    "routeId": {
      "type": "string",
      "required": true,
      "unique": true,
      "regex": "^[A-Z]{2}\\d{3}$"  // ✨ 格式驗證
    },
    "name": {
      "type": "string",
      "required": true,
      "maxLength": 100
    },
    "englishName": {
      "type": "string",
      "maxLength": 100
    },
    "grade": {
      "type": "enumeration",
      "enum": ["5.6", "5.7", "5.8", ..., "5.15d"],  // ✨ 嚴格驗證
      "required": true
    },
    "length": {
      "type": "string",
      "required": true,
      "regex": "^\\d+m$"  // ✨ 必須是數字+m
    },
    "type": {
      "type": "enumeration",
      "enum": ["運動攀登", "傳統攀登", "抱石", "混合"],
      "required": true
    },
    "area": {
      "type": "string",
      "required": true
    },

    // 詳細內容
    "description": {
      "type": "richtext",  // ✨ Markdown 編輯器
      "required": true
    },
    "protection": {
      "type": "text"
    },
    "tips": {
      "type": "richtext"  // ✨ Markdown 編輯器
    },

    // 統計資訊
    "popularity": {
      "type": "float",
      "min": 0,
      "max": 5,
      "default": 0
    },
    "views": {
      "type": "integer",
      "min": 0,
      "default": 0
    },

    // 多媒體
    "images": {
      "type": "media",
      "multiple": true,
      "allowedTypes": ["images"],  // ✨ 只允許圖片
      "required": false
    },

    // 關聯
    "crag": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::crag.crag",
      "inversedBy": "routes"
    },

    // Component: 影片（可重複）
    "videos": {
      "type": "component",
      "repeatable": true,  // ✨ 支援多個影片
      "component": "route.video",
      "required": false
    }
  }
}

// Component: route.video
{
  "collectionName": "components_route_videos",
  "info": {
    "displayName": "Video",
    "icon": "play"
  },
  "attributes": {
    "source": {
      "type": "enumeration",
      "enum": ["youtube", "instagram"],
      "required": true
    },
    "url": {
      "type": "string",
      "required": true,
      "regex": "^https?://"  // ✨ URL 驗證
    },
    "title": {
      "type": "string",
      "maxLength": 200
    },
    "description": {
      "type": "text"
    },
    "thumbnail": {
      "type": "string"
    },
    "author": {
      "type": "string",
      "maxLength": 100
    },
    "uploadDate": {
      "type": "date"
    },
    "duration": {
      "type": "integer",
      "min": 0
    },
    "order": {
      "type": "integer",
      "default": 0
    }
  }
}
```

### Strapi 後台介面

**1. Content Manager 視圖**

```
┌─────────────────────────────────────────────────┐
│ Content Manager > Routes                        │
├─────────────────────────────────────────────────┤
│ [+ Create new entry]  [⚙ Configure view]       │
├─────────────────────────────────────────────────┤
│ 🔍 Search routes...                             │
│                                                 │
│ Filters:                                        │
│ Grade: [All ▼] Type: [All ▼] Status: [All ▼]   │
│                                                 │
├─────────────────────────────────────────────────┤
│ ID     | Name    | Grade  | Type      | Status │
│─────────────────────────────────────────────────│
│ LD001  | 海神    | 5.11c  | 運動攀登  | ✅ 已發佈│
│ LD002  | 藍色... | 5.9+   | 傳統攀登  | ✅ 已發佈│
│ LD003  | 雷神    | 5.12b  | 運動攀登  | 📝 草稿  │
│                                                 │
│ [1] [2] [3] ... [10]                            │
└─────────────────────────────────────────────────┘
```

**2. Edit Entry 視圖**

```
┌─────────────────────────────────────────────────┐
│ Edit Route: 海神 (Poseidon)                     │
├─────────────────────────────────────────────────┤
│                                                 │
│ === Basic Information ===                      │
│                                                 │
│ Route ID *                                      │
│ [LD001_________________]  ✅ Valid format       │
│                                                 │
│ Chinese Name *                                  │
│ [海神___________________]                       │
│                                                 │
│ English Name                                    │
│ [Poseidon______________]                       │
│                                                 │
│ Grade *                                         │
│ [5.11c ▼]  5.6, 5.7, ..., 5.15d               │
│                                                 │
│ Length *                                        │
│ [25m___________________]  ✅ Valid format       │
│                                                 │
│ Type *                                          │
│ [運動攀登 ▼]                                    │
│                                                 │
│ === Description ===                            │
│                                                 │
│ Description * (Markdown supported)             │
│ ┌─────────────────────────────────────────┐    │
│ │ # 路線描述                              │    │
│ │                                         │    │
│ │ 這條線路需要良好的體力和耐力...         │    │
│ │                                         │    │
│ │ **關鍵動作：**                          │    │
│ │ - 第 3 個確保點...                      │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ === Images ===                                 │
│                                                 │
│ [+ Add images] or Drag & Drop                  │
│ ┌────┐ ┌────┐ ┌────┐                          │
│ │img1│ │img2│ │img3│  [X Remove]              │
│ └────┘ └────┘ └────┘                          │
│                                                 │
│ === Videos ===                                 │
│                                                 │
│ [+ Add video]                                  │
│                                                 │
│ Video 1                          [▲] [▼] [X]   │
│ ┌─────────────────────────────────────────┐    │
│ │ Source: [YouTube ▼]                     │    │
│ │ URL: [https://youtube.com/watch?v=...]  │    │
│ │ Title: [首攀影片__________________]     │    │
│ │ Description: [展示關鍵動作_________]     │    │
│ │ Upload Date: [2023-10-15]               │    │
│ │ Duration: [324] seconds                 │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ Video 2                          [▲] [▼] [X]   │
│ ┌─────────────────────────────────────────┐    │
│ │ Source: [Instagram ▼]                   │    │
│ │ URL: [https://instagram.com/p/ABC123/]  │    │
│ │ Title: [攀登示範__________________]     │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Save as draft] [Save & Publish]               │
└─────────────────────────────────────────────────┘
```

### 技術架構

```
Strapi CMS (自架)
    ↓ REST / GraphQL API
    ↓ Media: Cloudflare R2
PostgreSQL Database
    ↓
Next.js Frontend (Cloudflare Pages)
```

### 實作範例

**1. Strapi 部署（Railway）**

```bash
# 1. 建立 Strapi 專案
npx create-strapi-app@latest nobodyclimb-cms

# 2. 設定環境變數
# .env
DATABASE_CLIENT=postgres
DATABASE_HOST=containers-us-west-xxx.railway.app
DATABASE_PORT=5432
DATABASE_NAME=railway
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=xxx
DATABASE_SSL=true

# Cloudflare R2 (圖片儲存)
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_ACCESS_KEY_ID=xxx
CLOUDFLARE_SECRET_ACCESS_KEY=xxx
CLOUDFLARE_BUCKET=nobodyclimb-media

# 3. 安裝 R2 plugin
npm install @strapi/provider-upload-aws-s3

# 4. 設定上傳到 R2
# config/plugins.js
module.exports = {
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          accessKeyId: env('CLOUDFLARE_ACCESS_KEY_ID'),
          secretAccessKey: env('CLOUDFLARE_SECRET_ACCESS_KEY'),
          endpoint: `https://${env('CLOUDFLARE_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
          params: {
            Bucket: env('CLOUDFLARE_BUCKET'),
          },
        }
      },
    },
  },
}

# 5. 部署到 Railway
railway login
railway init
railway up
```

**2. Frontend API 整合**

```typescript
// src/lib/api/strapi.ts

const STRAPI_URL = 'https://strapi-api.nobodyclimb.cc'

export async function getRoutes(cragId?: string) {
  const filters = cragId ? `?filters[crag][id][$eq]=${cragId}` : ''
  const populate = '&populate[0]=images&populate[1]=videos&populate[2]=crag'

  const response = await fetch(
    `${STRAPI_URL}/api/routes${filters}${populate}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`
      },
      next: { revalidate: 300 }  // 快取 5 分鐘
    }
  )

  const { data } = await response.json()

  return data.map((item: any) => ({
    id: item.attributes.routeId,
    name: item.attributes.name,
    englishName: item.attributes.englishName,
    grade: item.attributes.grade,
    length: item.attributes.length,
    type: item.attributes.type,
    area: item.attributes.area,
    description: item.attributes.description,
    protection: item.attributes.protection,
    tips: item.attributes.tips,
    popularity: item.attributes.popularity,
    views: item.attributes.views,

    // 圖片
    images: item.attributes.images?.data?.map((img: any) =>
      img.attributes.url
    ) || [],

    // 影片
    videos: item.attributes.videos?.map((v: any) => ({
      id: v.id,
      source: v.source,
      url: v.url,
      embedUrl: v.embedUrl || convertToEmbedUrl(v.url),
      title: v.title,
      description: v.description,
      thumbnail: v.thumbnail,
      author: v.author,
      uploadDate: v.uploadDate,
      duration: v.duration
    })) || []
  }))
}

// 使用範例
// src/app/crag/[id]/page.tsx
export default async function CragDetailPage({ params }) {
  const { id } = await params
  const routes = await getRoutes(id)

  return (
    <CragRouteSection routes={routes} />
  )
}
```

### ✅ 優點

1. **完全客製化**
   - 自訂資料模型（Content Types）
   - 自訂 API 端點
   - 自訂 UI（插件）
   - 完全符合專案需求

2. **強大的資料驗證** ✨
   - Regex 驗證（路線 ID 格式）
   - Enum 枚舉（難度、類型）
   - 必填欄位
   - 最小/最大值
   - 唯一性約束

   ```javascript
   "routeId": {
     "type": "string",
     "required": true,
     "unique": true,
     "regex": "^[A-Z]{2}\\d{3}$"  // ✅ 嚴格驗證
   }
   ```

3. **完整的多媒體管理** ✨
   - **直接上傳圖片到 Cloudflare R2**
   - 圖片預覽、裁切、壓縮
   - **支援多個影片（Component repeatable）**
   - 檔案大小限制、類型限制

4. **複雜資料結構支援**
   - Component（可重複）
   - Dynamic Zone
   - Relation (一對一、一對多、多對多)
   - 嵌套結構

   ```javascript
   // ✅ 一個路線可以有多個影片
   "videos": {
     "type": "component",
     "repeatable": true,  // 關鍵！
     "component": "route.video"
   }
   ```

5. **完整的 API**
   - REST API（自動生成）
   - GraphQL（可選）
   - 篩選、排序、分頁
   - 關聯資料 populate
   - 權限控制（角色、欄位級別）

6. **草稿與發佈**
   - 草稿模式（編輯中）
   - 發佈版本（正式）
   - 版本歷史

7. **角色權限管理**
   - 預設角色：Public, Authenticated, Admin
   - 自訂角色：Editor, Reviewer
   - 細粒度權限（CRUD per Content Type）
   - 欄位級別權限

   ```
   Editor (編輯者):
   ✅ Create routes
   ✅ Update own routes
   ❌ Publish routes (需要 Reviewer)
   ❌ Delete routes

   Reviewer (審核者):
   ✅ All above
   ✅ Publish routes
   ✅ Delete routes
   ```

8. **開源免費**
   - MIT License
   - 自架無使用費
   - 社群活躍

9. **插件生態系統**
   - SEO Plugin
   - i18n (多語言)
   - 圖片優化
   - GraphQL
   - 第三方整合（Algolia 搜尋等）

10. **自主掌控**
    - 資料在自己的資料庫
    - 可備份、遷移
    - 不依賴第三方服務

### ❌ 缺點

1. **需要技術背景（架設）**
   - 需要懂 Node.js、PostgreSQL
   - 需要部署到伺服器（Railway, Heroku, DigitalOcean）
   - 需要設定環境變數、資料庫連線
   - **非技術人員無法獨立架設**

2. **學習曲線（初期）**
   - 需要理解 Content Types, Components, Relations
   - 需要學習 Strapi Admin Panel
   - API 使用需要看文件

   **BUT**: 一旦設定好，使用者介面很直觀！

3. **伺服器成本**
   - 需要主機（Railway: $5-10/月）
   - PostgreSQL 資料庫（Railway 免費 500MB）
   - Cloudflare R2 圖片儲存（免費 10GB）

   **總計**: 約 $5-10/月（比 Notion 團隊版便宜）

4. **維護需求**
   - 需要定期更新 Strapi 版本
   - 監控伺服器狀態
   - 資料庫備份

   **BUT**: Railway/Heroku 自動處理大部分維護

5. **初期設定時間**
   - 架設 Strapi: 1-2 小時
   - 設計 Content Types: 2-4 小時
   - 設定權限、插件: 2-3 小時
   - **總計: 1-2 天設定時間**

   **BUT**: 一次設定，長期受益

### 🎯 適用場景

- ✅ **長期專案**（值得投資設定時間）
- ✅ **複雜資料結構**（路線、影片、圖片、關聯）
- ✅ **資料驗證需求高**（確保資料品質）
- ✅ **多媒體管理**（大量圖片、影片）
- ✅ **權限管理需求**（編輯者、審核者）
- ✅ **團隊有技術人員**（初期設定）
- ✅ **自主掌控資料**（不依賴第三方）
- ✅ **未來整合 Django**（都用 PostgreSQL）

### 💡 實際使用建議

如果選擇 Strapi，建議：

1. **部署到 Railway**
   - 最簡單的部署方式
   - 自動提供 PostgreSQL
   - 免費額度 $5/月

2. **圖片上傳到 Cloudflare R2**
   - 便宜（$0.015/GB/月）
   - 快速（CDN）
   - 免費 10GB

3. **使用 Components**
   - 路線影片用 Component (repeatable)
   - 可重複使用的結構

4. **設定角色權限**
   - Editor: 可新增、編輯
   - Reviewer: 可發佈
   - Public: 唯讀 API

5. **啟用草稿功能**
   - `draftAndPublish: true`
   - 編輯不影響正式版

---

## 🏆 綜合比較與推薦

### 比較矩陣

| 評估項目 | Google Sheets | Notion | Strapi | 權重 |
|---------|--------------|--------|--------|------|
| **易用性** | | | | 20% |
| 零技術門檻 | ⭐⭐⭐⭐⭐ 5 | ⭐⭐⭐⭐ 4 | ⭐⭐⭐ 3 | |
| 學習時間 | 5 分鐘 | 30 分鐘 | 2-4 小時 | |
| **協作能力** | | | | 25% |
| 即時協作 | ⭐⭐⭐⭐⭐ 5 | ⭐⭐⭐⭐⭐ 5 | ⭐⭐⭐⭐ 4 | |
| 留言討論 | ✅ | ✅ | ❌ | |
| 版本歷史 | ✅ | ✅ | ✅ | |
| **資料品質** | | | | 30% |
| 格式驗證 | ⭐⭐ 2 | ⭐⭐⭐ 3 | ⭐⭐⭐⭐⭐ 5 | |
| 防止錯誤 | 下拉選單 | Select 屬性 | Regex + Enum | |
| 結構化資料 | ⭐⭐ 2 | ⭐⭐⭐ 3 | ⭐⭐⭐⭐⭐ 5 | |
| **多媒體** | | | | 15% |
| 圖片上傳 | ❌ | ✅ | ✅ | |
| 圖片預覽 | ❌ | ✅ | ✅ | |
| 多影片支援 | 困難 | 需 Relation | ✅ Component | |
| **技術整合** | | | | 10% |
| API 品質 | ⭐⭐⭐ 3 | ⭐⭐⭐⭐ 4 | ⭐⭐⭐⭐⭐ 5 | |
| API 限制 | 100/day | 3/sec | 無限制 | |
| 快取需求 | ✅ 需要 | ✅ 需要 | ⚠️ 建議 | |
| **成本** | | | | 移除評分 |
| 月費 | $0 | $8-10/人 | $5-10 (主機) | |
| **總分** | **2.95** | **3.85** | **4.55** | **100%** |

### 情境推薦

#### 情境 1: 小型團隊（2-3 人），預算有限

**推薦**: **Google Sheets** ⭐⭐⭐

**理由**:

- ✅ 完全免費
- ✅ 所有人都會用
- ✅ 5 分鐘開始編輯
- ⚠️ 接受資料品質較弱

**實施建議**:

1. 使用資料驗證（下拉選單）
2. 建立編輯範本
3. 定期匯出備份
4. API 快取避免超限

---

#### 情境 2: 內容團隊（3-10 人），重視體驗

**推薦**: **Notion** ⭐⭐⭐⭐

**理由**:

- ✅ 優雅的編輯體驗
- ✅ 圖片直接上傳
- ✅ Markdown 支援
- ✅ 即時協作
- ⚠️ 需要付費 ($8/人)

**實施建議**:

1. 設計 Database 架構（路線、影片分開）
2. 建立範本
3. 使用 Status 工作流程
4. API 限制需快取

---

#### 情境 3: 技術團隊，長期專案，重視資料品質

**推薦**: **Strapi** ⭐⭐⭐⭐⭐

**理由**:

- ✅ 強大的資料驗證
- ✅ 完整的多媒體管理
- ✅ 自主掌控資料
- ✅ 未來整合 Django 容易
- ✅ 比 Notion 便宜（$5-10 vs $8×人數）
- ⚠️ 需要 1-2 天初期設定

**實施建議**:

1. 部署到 Railway（最簡單）
2. 圖片上傳到 Cloudflare R2
3. 設定角色權限
4. 使用 Component 管理影片

---

## 🎯 最終推薦

### 針對你的需求（多人共同編輯）

根據你的情況分析：

1. **有多人共同編輯** → 協作能力很重要
2. **路線資料複雜** → 文字、圖片、YouTube、Instagram 影片
3. **資料品質重要** → 難度、類型需要標準化
4. **長期專案** → NobodyClimb 攀岩社群平台

### 我的推薦: **Strapi** 🏆

**原因**:

1. **多媒體管理完美**
   - 圖片直接上傳（不用額外圖床）
   - 多個影片支援（Component repeatable）
   - YouTube + Instagram 都能管理

2. **資料驗證最強**
   - 確保路線 ID 格式正確（LD001）
   - 難度只能選有效值（5.6 - 5.15d）
   - 防止資料錯誤

3. **成本比 Notion 低**
   - Strapi: $5-10/月（整個團隊）
   - Notion: $8/人/月（5 人 = $40/月）

4. **未來整合 Django 容易**
   - 都用 PostgreSQL
   - 資料遷移簡單
   - 平滑過渡

5. **長期價值高**
   - 一次設定，永久受益
   - 完全客製化
   - 資料自主掌控

### 如果你堅持不要技術門檻

**推薦**: **Notion** ⭐⭐⭐⭐

**理由**:

- 學習曲線低於 Strapi
- 圖片、影片管理比 Google Sheets 好太多
- 編輯體驗優雅
- 即時協作

**妥協點**:

- 需要付費
- 多個影片需要用 Relation（稍微複雜）
- API 有限制（需快取）

---

## 📋 決策流程圖

```
開始：需要多人編輯路線資訊
    ↓
是否有技術人員可協助初期設定？
    ├─ 是 → Strapi ⭐⭐⭐⭐⭐
    │         （最佳方案）
    │
    └─ 否 → 是否有預算？
            ├─ 有 ($8/人/月) → Notion ⭐⭐⭐⭐
            │                    （次佳方案）
            │
            └─ 無 → Google Sheets ⭐⭐⭐
                    （接受資料品質較弱）
```

---

## 實施建議

### 選擇 Strapi 的話

**Week 1: 設定與部署**

- Day 1-2: 部署 Strapi 到 Railway
- Day 3-4: 設計 Content Types
- Day 5: 設定 Cloudflare R2
- Day 6-7: 權限與角色設定

**Week 2: 資料遷移與整合**

- Day 1-3: 遷移現有路線資料
- Day 4-5: Frontend API 整合
- Day 6-7: 測試與調整

**Week 3: 培訓與上線**

- Day 1-2: 編輯者培訓
- Day 3-5: 試運行
- Day 6-7: 正式上線

### 選擇 Notion 的話

**Week 1: 設定**

- Day 1: 建立 Workspace
- Day 2-3: 設計 Database
- Day 4: 建立範本
- Day 5-7: API 整合與快取

**Week 2: 上線**

- Day 1-2: 資料遷移
- Day 3-4: 測試
- Day 5-7: 培訓與上線

---

**文件版本**: v1.0
**最後更新**: 2025-12-03
**建議方案**: Strapi (有技術支援) / Notion (無技術支援)
