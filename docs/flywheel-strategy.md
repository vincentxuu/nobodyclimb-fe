# NobodyClimb 用戶參與飛輪效應策略

## 核心概念

飛輪效應的關鍵：**每個用戶行為都應該強化其他行為，形成自我增強的循環。**

---

## 一、平台現況分析

### 現有內容類型

| 內容類型 | 用途 | 社群互動 | 與路線連結 |
|---------|------|---------|-----------|
| 人物誌 | 個人故事 | 讚/留言/追蹤 | ❌ 無 |
| 人生清單 | 目標設定 | 讚/留言/參考 | ⚠️ 僅文字 |
| 攀岩足跡 | 去過的地點 | ❌ 無 | ❌ 無 |
| 照片 | 攀岩照片 | ❌ 無 | ❌ 無 |
| 文章 | 分享知識 | 讚/留言 | ❌ 無 |
| 路線資料 | 路線資訊 | ❌ 無 | - |

### 現有問題

1. **內容孤島**：各功能獨立運作，缺乏連結
2. **單向創作**：只有自己記錄，沒有互相幫忙的機制
3. **路線資料靜態**：路線頁面缺乏用戶生成內容
4. **缺乏即時反饋**：完成路線沒有慶祝/分享機制

---

## 二、飛輪架構設計

### 主飛輪：完攀紀錄為核心

```
                    ┌─────────────────────────────┐
                    │                             │
                    ▼                             │
            ┌───────────────┐                     │
            │   完攀路線     │                     │
            │  (實際攀登)    │                     │
            └───────┬───────┘                     │
                    │                             │
                    ▼                             │
            ┌───────────────┐                     │
            │   上傳紀錄     │                     │
            │ (照片/影片/文字)│                     │
            └───────┬───────┘                     │
                    │                             │
        ┌───────────┼───────────┐                 │
        │           │           │                 │
        ▼           ▼           ▼                 │
   ┌─────────┐ ┌─────────┐ ┌─────────┐           │
   │豐富路線 │ │個人履歷 │ │社群動態 │           │
   │ 頁面   │ │ 成長   │ │ 曝光   │           │
   └────┬────┘ └────┬────┘ └────┬────┘           │
        │           │           │                 │
        └───────────┼───────────┘                 │
                    │                             │
                    ▼                             │
            ┌───────────────┐                     │
            │   他人發現     │                     │
            │  參考 Beta    │                     │
            └───────┬───────┘                     │
                    │                             │
                    ▼                             │
            ┌───────────────┐                     │
            │   想要挑戰     │─────────────────────┘
            │   同條路線     │
            └───────────────┘
```

### 子飛輪 A：社群協作紀錄

```
    ┌──────────────────────────────────────────────┐
    │                                              │
    ▼                                              │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  你幫朋友   │ ──▶ │  上傳媒體   │ ──▶ │  標記朋友   │
│  拍照/錄影  │     │  到平台     │     │  為主角     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  朋友收到   │
                                        │  通知&紀錄  │
                                        └──────┬──────┘
                                               │
                    ┌──────────────────────────┘
                    │
                    ▼
            ┌─────────────┐
            │  互惠心理   │
            │  下次換你   │
            └──────┬──────┘
                   │
                   └──────────────────────────────────┘
```

### 子飛輪 B：目標激勵循環

```
    ┌──────────────────────────────────────────────┐
    │                                              │
    ▼                                              │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  設定目標   │ ──▶ │  分享到     │ ──▶ │  獲得      │
│ (人生清單)  │     │  社群       │     │  鼓勵/讚   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  啟發他人   │ ◀── │  完成展示   │ ◀── │  更有動力   │
│  參考目標   │     │  (完攀紀錄) │     │  去完成     │
└──────┬──────┘     └─────────────┘     └─────────────┘
       │
       └──────────────────────────────────────────────┘
```

### 子飛輪 C：路線資料豐富化

```
    ┌──────────────────────────────────────────────┐
    │                                              │
    ▼                                              │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  有人完攀   │ ──▶ │  上傳 Beta  │ ──▶ │  路線頁面   │
│  某條路線   │     │  照片/心得  │     │  更豐富     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  更多人     │ ◀── │  搜尋找到   │ ◀── │  SEO 提升   │
│  來完攀     │     │  這條路線   │     │  更多曝光   │
└──────┬──────┘     └─────────────┘     └─────────────┘
       │
       └──────────────────────────────────────────────┘
```

### 子飛輪 D：地點社群連結

```
    ┌──────────────────────────────────────────────┐
    │                                              │
    ▼                                              │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  標記攀岩   │ ──▶ │  發現同地點 │ ──▶ │  追蹤/互動  │
│  足跡       │     │  的人       │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  回報更多   │ ◀── │  計劃一起   │ ◀── │  建立連結   │
│  地點       │     │  攀岩       │     │             │
└──────┬──────┘     └─────────────┘     └─────────────┘
       │
       └──────────────────────────────────────────────┘
```

---

## 三、新功能設計：完攀紀錄系統 (Ascent Log)

### 3.1 資料模型

```typescript
// 完攀紀錄
interface AscentLog {
  id: string

  // === 路線資訊 ===
  route_id: string | null        // 連結到路線資料庫（可選）
  route_name: string             // 路線名稱（必填）
  crag_id: string | null         // 岩場 ID
  crag_name: string | null       // 岩場名稱
  grade: string                  // 難度
  route_type: 'boulder' | 'sport' | 'trad' | 'mixed'

  // === 攀登資訊 ===
  climber_id: string             // 攀登者（主角）
  ascent_type: 'onsight' | 'flash' | 'redpoint' | 'repeat' | 'attempt' | 'toprope'
  ascent_date: string            // 攀登日期
  attempts: number | null        // 嘗試次數（redpoint 時記錄）

  // === 媒體紀錄 ===
  photos: string[]               // 照片 URL
  videos: {
    youtube?: string[]           // YouTube 影片 ID
    instagram?: string[]         // Instagram 貼文
    uploaded?: string[]          // 直接上傳的影片
  }

  // === 文字紀錄 ===
  description: string | null     // 攀登描述/故事
  beta_notes: string | null      // Beta 分享（技巧提示）
  conditions: string | null      // 當天狀況（天氣、岩況、溫度）
  rating: number | null          // 路線評分 (1-5 星)
  grade_opinion: string | null   // 難度意見（偏簡單/準確/偏難）

  // === 協作紀錄 ===
  recorded_by_id: string | null  // 誰上傳這筆紀錄
  belayer_id: string | null      // 確保者
  photographer_id: string | null // 攝影者
  partners: string[]             // 同行夥伴 ID

  // === 來源追蹤 ===
  source_type: 'manual' | 'bucket_list' | 'media_tag'
  source_id: string | null       // 如果是從 bucket_list 完成來的

  // === 社群互動 ===
  is_public: boolean
  likes_count: number
  comments_count: number

  // === 時間戳記 ===
  created_at: string
  updated_at: string
}
```

### 3.2 資料庫 Schema

```sql
-- 完攀紀錄表
CREATE TABLE ascent_logs (
  id TEXT PRIMARY KEY,

  -- 路線資訊
  route_id TEXT,
  route_name TEXT NOT NULL,
  crag_id TEXT,
  crag_name TEXT,
  grade TEXT,
  route_type TEXT CHECK (route_type IN ('boulder', 'sport', 'trad', 'mixed')),

  -- 攀登資訊
  climber_id TEXT NOT NULL,
  ascent_type TEXT CHECK (ascent_type IN ('onsight', 'flash', 'redpoint', 'repeat', 'attempt', 'toprope')),
  ascent_date TEXT NOT NULL,
  attempts INTEGER,

  -- 媒體
  photos TEXT,           -- JSON array
  videos TEXT,           -- JSON object

  -- 文字紀錄
  description TEXT,
  beta_notes TEXT,
  conditions TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  grade_opinion TEXT CHECK (grade_opinion IN ('soft', 'accurate', 'hard')),

  -- 協作紀錄
  recorded_by_id TEXT,
  belayer_id TEXT,
  photographer_id TEXT,
  partners TEXT,         -- JSON array

  -- 來源
  source_type TEXT DEFAULT 'manual',
  source_id TEXT,

  -- 社群
  is_public INTEGER DEFAULT 1,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- 時間
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (route_id) REFERENCES routes(id),
  FOREIGN KEY (crag_id) REFERENCES crags(id),
  FOREIGN KEY (climber_id) REFERENCES users(id),
  FOREIGN KEY (recorded_by_id) REFERENCES users(id),
  FOREIGN KEY (belayer_id) REFERENCES users(id),
  FOREIGN KEY (photographer_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX idx_ascent_climber ON ascent_logs(climber_id);
CREATE INDEX idx_ascent_route ON ascent_logs(route_id);
CREATE INDEX idx_ascent_crag ON ascent_logs(crag_id);
CREATE INDEX idx_ascent_date ON ascent_logs(ascent_date DESC);
CREATE INDEX idx_ascent_public ON ascent_logs(is_public, created_at DESC);

-- 完攀紀錄按讚
CREATE TABLE ascent_log_likes (
  id TEXT PRIMARY KEY,
  ascent_log_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(ascent_log_id, user_id),
  FOREIGN KEY (ascent_log_id) REFERENCES ascent_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 完攀紀錄留言
CREATE TABLE ascent_log_comments (
  id TEXT PRIMARY KEY,
  ascent_log_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ascent_log_id) REFERENCES ascent_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 媒體貢獻紀錄（誰幫誰拍了什麼）
CREATE TABLE media_contributions (
  id TEXT PRIMARY KEY,
  ascent_log_id TEXT NOT NULL,
  contributor_id TEXT NOT NULL,
  climber_id TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('photo', 'video')),
  media_url TEXT NOT NULL,
  is_accepted INTEGER DEFAULT 0,  -- 攀登者是否已接受
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ascent_log_id) REFERENCES ascent_logs(id) ON DELETE CASCADE
);
```

### 3.3 新增通知類型

```typescript
// 新增的通知類型
type NewNotificationType =
  | 'ascent_tagged'          // 你被標記在完攀紀錄中
  | 'ascent_liked'           // 完攀紀錄被按讚
  | 'ascent_commented'       // 完攀紀錄被留言
  | 'media_contributed'      // 有人幫你上傳了攀登媒體
  | 'route_new_ascent'       // 你追蹤的路線有新完攀
  | 'friend_ascent'          // 你追蹤的人有新完攀
  | 'same_route_climber'     // 有人也完成了你爬過的路線
```

---

## 四、功能整合設計

### 4.1 人生清單 → 完攀紀錄

**當用戶完成人生清單目標時：**

```
┌─────────────────────────────────────────────────────────────┐
│  完成人生清單目標                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 目標：完攀龍洞「黃金乳頭」5.12a                        │   │
│  │ 狀態：已完成 ✓                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎉 恭喜完成！要不要記錄這次完攀？                      │   │
│  │                                                      │   │
│  │ [自動帶入]                                           │   │
│  │ • 路線：黃金乳頭                                      │   │
│  │ • 難度：5.12a                                        │   │
│  │ • 地點：龍洞                                         │   │
│  │                                                      │   │
│  │ [需要填寫]                                           │   │
│  │ • 完攀類型：○ Onsight ○ Flash ● Redpoint           │   │
│  │ • 攀登日期：2024/01/15                               │   │
│  │ • 嘗試次數：3 次                                      │   │
│  │ • 上傳照片/影片                                      │   │
│  │ • Beta 分享（選填）                                  │   │
│  │                                                      │   │
│  │           [ 建立完攀紀錄 ]  [ 跳過 ]                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 照片 → 完攀紀錄

**擴展照片上傳功能：**

```sql
-- 修改 gallery_images 表
ALTER TABLE gallery_images ADD COLUMN route_id TEXT;
ALTER TABLE gallery_images ADD COLUMN crag_id TEXT;
ALTER TABLE gallery_images ADD COLUMN ascent_log_id TEXT;
ALTER TABLE gallery_images ADD COLUMN climber_id TEXT;  -- 照片中的攀登者
```

**上傳流程增強：**

```
┌─────────────────────────────────────────────────────────────┐
│  上傳攀岩照片                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📷 [照片預覽]                                       │   │
│  │                                                      │   │
│  │  這張照片是...                                       │   │
│  │  ○ 我自己攀爬的照片                                  │   │
│  │  ● 我幫朋友拍的照片                                  │   │
│  │  ○ 風景/岩場照片                                     │   │
│  │                                                      │   │
│  │  [如果是幫朋友拍]                                    │   │
│  │  標記攀登者：[@搜尋用戶...]                          │   │
│  │                                                      │   │
│  │  關聯路線：[搜尋路線...] 或 [手動輸入]               │   │
│  │  攀登日期：[2024/01/15]                              │   │
│  │                                                      │   │
│  │           [ 上傳並建立完攀紀錄 ]                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 完攀紀錄 → 攀岩足跡

**自動同步機制：**

```typescript
// 當建立完攀紀錄時，自動更新攀岩足跡
async function syncClimbingLocation(ascentLog: AscentLog) {
  const { climber_id, crag_name, crag_id, ascent_date } = ascentLog

  // 檢查是否已有該地點的足跡
  const existing = await db.query(`
    SELECT * FROM climbing_locations
    WHERE biography_id = ? AND location = ?
  `, [climber_id, crag_name])

  if (!existing) {
    // 自動建立足跡
    await db.insert('climbing_locations', {
      biography_id: climber_id,
      location: crag_name,
      country: getCragCountry(crag_id),
      visit_year: extractYear(ascent_date),
      notes: `首次紀錄於 ${ascent_date}`,
      is_public: 1,
      auto_generated: 1  // 標記為自動產生
    })
  }
}
```

### 4.4 路線頁面整合

**路線詳情頁新增區塊：**

```
┌─────────────────────────────────────────────────────────────┐
│  黃金乳頭 5.12a                                              │
│  龍洞・先鋒・25m・8 bolts                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 社群統計                                                │
│  ┌─────────┬─────────┬─────────┬─────────┐                │
│  │ 23      │ 5       │ 12      │ 6       │                │
│  │ 總完攀  │ Onsight │ Flash   │ Redpoint│                │
│  └─────────┴─────────┴─────────┴─────────┘                │
│                                                             │
│  ⭐ 難度共識：準確 (85%) ｜ 品質評分：4.5/5                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📝 Beta 集合（社群分享的技巧）                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ @小明：第三個 bolt 前的側拉很關鍵，要先把重心...     │   │
│  │ @阿華：crux 在最後三個動作，建議先練習...           │   │
│  │ [展開更多...]                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🖼️ 完攀紀錄牆                                              │
│  ┌───────┬───────┬───────┬───────┐                        │
│  │ 📷    │ 📷    │ 🎬    │ 📷    │                        │
│  │ @小明 │ @阿華 │ @小美 │ @大雄 │                        │
│  │ Flash │Onsight│Redpoint│Repeat│                        │
│  └───────┴───────┴───────┴───────┘                        │
│  [查看全部 23 筆完攀紀錄]                                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [ 🎯 加入人生清單 ]  [ ✅ 我也完攀了 ]                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.5 個人履歷整合

**人物誌新增區塊：**

```
┌─────────────────────────────────────────────────────────────┐
│  🧗 攀登履歷                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📈 統計總覽                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  總完攀數    最高難度    Onsight 最高   本月完攀      │  │
│  │    156        5.13a        5.12b         12          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  📊 難度分布                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  5.10a ████████████████████ 45                       │  │
│  │  5.10b ██████████████████ 38                         │  │
│  │  5.10c ████████████████ 32                           │  │
│  │  5.10d ██████████████ 28                             │  │
│  │  5.11a ████████████ 24                               │  │
│  │  5.11b ██████████ 20                                 │  │
│  │  ...                                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  🏆 精選完攀                                                │
│  ┌───────┬───────┬───────┐                                │
│  │ 📷    │ 🎬    │ 📷    │                                │
│  │黃金乳頭│ 大乳頭 │狂乳加速│                                │
│  │ 5.12a │ 5.12b │ 5.12c │                                │
│  └───────┴───────┴───────┘                                │
│                                                             │
│  [查看完整攀登紀錄]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 五、實作優先順序

### Phase 1：基礎建設（核心飛輪）

| 優先序 | 功能 | 說明 | 影響 |
|-------|------|------|------|
| 1.1 | 完攀紀錄資料表 | 建立 ascent_logs 相關表 | 核心資料結構 |
| 1.2 | 完攀紀錄 CRUD API | 建立/讀取/更新/刪除 | 基礎功能 |
| 1.3 | 完攀紀錄表單 | 手動建立完攀紀錄的 UI | 用戶入口 |
| 1.4 | 個人完攀列表 | 在人物誌顯示個人完攀 | 個人價值 |

### Phase 2：連結整合（子飛輪啟動）

| 優先序 | 功能 | 說明 | 影響 |
|-------|------|------|------|
| 2.1 | 人生清單→完攀 | 完成目標時建立完攀紀錄 | 目標飛輪 |
| 2.2 | 照片→完攀 | 上傳照片時可關聯路線 | 媒體飛輪 |
| 2.3 | 完攀→足跡 | 自動同步攀岩足跡 | 地點飛輪 |
| 2.4 | 路線頁整合 | 路線頁顯示社群完攀 | 內容飛輪 |

### Phase 3：社群協作（飛輪加速）

| 優先序 | 功能 | 說明 | 影響 |
|-------|------|------|------|
| 3.1 | 標記他人 | 標記攀登者/確保者/攝影者 | 社交飛輪 |
| 3.2 | 新通知類型 | 被標記/被讚/新完攀通知 | 反饋迴路 |
| 3.3 | Beta 集合 | 路線頁的社群技巧分享 | 知識飛輪 |
| 3.4 | 完攀動態牆 | 顯示追蹤者的最新完攀 | 發現飛輪 |

### Phase 4：進階功能（飛輪自轉）

| 優先序 | 功能 | 說明 | 影響 |
|-------|------|------|------|
| 4.1 | 統計儀表板 | 個人/路線/岩場統計 | 成就感 |
| 4.2 | 同路人發現 | 找到爬過同路線的人 | 連結感 |
| 4.3 | 路線推薦 | 根據完攀紀錄推薦路線 | 探索感 |
| 4.4 | 年度回顧 | 年度攀登總結 | 儀式感 |

---

## 六、成功指標 (KPIs)

### 飛輪健康度指標

| 指標 | 定義 | 目標 |
|------|------|------|
| 完攀紀錄轉換率 | 完成人生清單後建立完攀紀錄的比例 | > 60% |
| 媒體標記率 | 上傳照片時標記他人的比例 | > 30% |
| 路線貢獻率 | 有社群內容的路線佔比 | > 40% |
| 互惠紀錄率 | 被標記後反向標記對方的比例 | > 50% |

### 用戶參與度指標

| 指標 | 定義 | 目標 |
|------|------|------|
| 月活躍完攀者 | 每月有建立完攀紀錄的用戶數 | 持續成長 |
| 平均完攀數/月 | 每位活躍用戶的月均完攀紀錄 | > 3 |
| Beta 貢獻率 | 完攀紀錄中有 Beta 分享的比例 | > 25% |
| 路線重訪率 | 用戶透過完攀紀錄找到新路線的比例 | > 20% |

---

## 七、風險與對策

| 風險 | 可能影響 | 對策 |
|------|---------|------|
| 冷啟動問題 | 初期沒人上傳，路線頁空蕩蕩 | 種子內容策略：邀請核心攀岩者先上傳 |
| 隱私顧慮 | 用戶不想被標記 | 可關閉被標記功能，需確認才顯示 |
| 資料品質 | 錯誤的 Beta、假冒的完攀 | 社群檢舉機制、信譽系統 |
| 過度遊戲化 | 為了數字而失去真實性 | 強調故事價值而非數量 |

---

## 八、總結

這個飛輪設計以「完攀紀錄」為核心，串連所有現有功能：

```
                    ┌─────────────┐
                    │  完攀紀錄   │
                    │  (新核心)   │
                    └──────┬──────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
  ┌─────────┐        ┌─────────┐        ┌─────────┐
  │ 人生清單 │        │  路線   │        │  照片   │
  │(目標→完成)│        │(資料豐富)│        │(媒體來源)│
  └─────────┘        └─────────┘        └─────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  攀岩足跡   │
                    │  (自動產生)  │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   人物誌    │
                    │ (攀登履歷)   │
                    └─────────────┘
```

**核心價值主張**：
- 對攀岩者：記錄成長軌跡，建立攀登履歷
- 對社群：互相幫忙紀錄，建立連結
- 對內容：豐富路線資料，幫助後來者

這個飛輪一旦轉起來，每個用戶的參與都會強化整個生態系統的價值。
