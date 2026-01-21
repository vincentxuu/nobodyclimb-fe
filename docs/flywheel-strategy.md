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

### 子飛輪 E：故事回應互動（一句話系列）

**核心概念**：人物誌中的每個故事欄位都可以被其他用戶回應，形成主題式的微型社群討論。

```
    ┌──────────────────────────────────────────────┐
    │                                              │
    ▼                                              │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  寫一個     │ ──▶ │  他人看到   │ ──▶ │  引發共鳴   │
│  故事欄位   │     │  產生共鳴   │     │  想回應     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  更想寫     │ ◀── │  收到回應   │ ◀── │  留下回應   │
│  更多故事   │     │  獲得連結   │     │  或自己版本 │
└──────┬──────┘     └─────────────┘     └─────────────┘
       │
       └──────────────────────────────────────────────┘
```

**同時觸發的第二循環**：

```
    ┌──────────────────────────────────────────────┐
    │                                              │
    ▼                                              │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  看到別人   │ ──▶ │  「我也有   │ ──▶ │  去寫自己   │
│  的故事回答 │     │   類似經驗」│     │  的人物誌   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
       ┌───────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│  人物誌     │
│  更加豐富   │
└─────────────┘
```

**UI 設計示意**：

```
┌─────────────────────────────────────────────────────────────┐
│  小明的人物誌                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📝 你與攀岩的相遇                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 「那天只是陪朋友去，結果爬了一條 5.8 就徹底上癮了...   │   │
│  │  從此週末的行程只有一個選項。」                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💬 12 則回應                                   [ 回應 ]    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ @阿華：我也是陪朋友結果自己比他還認真！               │   │
│  │ @小美：5.8 入坑太經典了，我是被 V0 電到               │   │
│  │ @大雄：哈哈週末只有一個選項 +1                        │   │
│  │ [查看更多回應...]                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📝 攀岩對你的意義                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 「一個可以合法發瘋的地方」                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💬 28 則回應  🔥 熱門                          [ 回應 ]    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📝 給剛開始攀岩的自己一句話                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 「腳比你想的重要一百倍」                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💬 45 則回應  🔥 本週最熱                      [ 回應 ]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**探索頁面：依主題瀏覽所有回答**

```
┌─────────────────────────────────────────────────────────────┐
│  🗣️ 一句話系列：大家怎麼說                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  熱門話題                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 「攀岩對你的意義」           156 則回答  🔥          │   │
│  │ 「給初學者的一句話建議」      134 則回答  🔥          │   │
│  │ 「你與攀岩的相遇」           98 則回答               │   │
│  │ 「最難忘的一次墜落」          87 則回答               │   │
│  │ 「克服恐懼的方法」           76 則回答               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  「攀岩對你的意義」 - 精選回答                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ @小明：「一個可以合法發瘋的地方」           ❤️ 89    │   │
│  │ @阿華：「唯一能讓我忘記工作的事」           ❤️ 67    │   │
│  │ @小美：「認識一群瘋子的入場券」             ❤️ 54    │   │
│  │ @大雄：「重新學習失敗的課堂」               ❤️ 48    │   │
│  │ [查看全部 156 則...]                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [ 我也來回答 ] → 前往編輯你的人物誌                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
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
  | 'story_response'         // 你的故事收到回應
  | 'story_response_liked'   // 你的故事回應被按讚
```

---

## 四、新功能設計：故事回應系統 (Story Response)

### 4.0 設計理念

人物誌有 34 個故事欄位（3 核心 + 31 進階），每個欄位都是一個**微型話題**。
當用戶填寫某個欄位時，等於回答了一個問題，這個回答可以：
1. 被其他用戶回應（留言互動）
2. 啟發其他用戶寫自己的版本
3. 聚合成主題式的「一句話系列」探索頁

### 4.1 資料模型

```typescript
// 故事回應
interface StoryResponse {
  id: string

  // === 目標故事 ===
  biography_id: string           // 被回應的人物誌
  story_field: string            // 故事欄位名稱 (e.g., 'climbing_origin', 'climbing_meaning')

  // === 回應者 ===
  responder_id: string           // 回應者 user ID

  // === 回應內容 ===
  content: string                // 回應文字

  // === 社群互動 ===
  likes_count: number

  // === 時間 ===
  created_at: string
  updated_at: string
}

// 故事欄位定義（用於探索頁聚合）
interface StoryFieldMeta {
  field_name: string             // 'climbing_origin'
  display_name: string           // '你與攀岩的相遇'
  category: string               // '核心故事' | '成長與突破' | ...
  response_count: number         // 有多少人填寫了這個欄位
  total_replies: number          // 所有回應總數
}
```

### 4.2 資料庫 Schema

```sql
-- 故事回應表
CREATE TABLE story_responses (
  id TEXT PRIMARY KEY,

  -- 目標
  biography_id TEXT NOT NULL,
  story_field TEXT NOT NULL,        -- 欄位名稱

  -- 回應者
  responder_id TEXT NOT NULL,

  -- 內容
  content TEXT NOT NULL,

  -- 社群
  likes_count INTEGER DEFAULT 0,

  -- 時間
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
  FOREIGN KEY (responder_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX idx_story_response_biography ON story_responses(biography_id, story_field);
CREATE INDEX idx_story_response_field ON story_responses(story_field, created_at DESC);
CREATE INDEX idx_story_response_responder ON story_responses(responder_id);

-- 故事回應按讚
CREATE TABLE story_response_likes (
  id TEXT PRIMARY KEY,
  story_response_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(story_response_id, user_id),
  FOREIGN KEY (story_response_id) REFERENCES story_responses(id) ON DELETE CASCADE
);

-- 故事欄位統計快取（定期更新）
CREATE TABLE story_field_stats (
  field_name TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  filled_count INTEGER DEFAULT 0,     -- 有多少人填寫
  response_count INTEGER DEFAULT 0,   -- 總回應數
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### 4.3 API 端點設計

```typescript
// 故事回應 API

// 取得某故事的所有回應
GET /biographies/:id/stories/:field/responses
Response: { responses: StoryResponse[], total: number }

// 新增回應
POST /biographies/:id/stories/:field/responses
Body: { content: string }
Response: { response: StoryResponse }

// 刪除回應（只能刪自己的）
DELETE /story-responses/:id

// 按讚回應
POST /story-responses/:id/like
DELETE /story-responses/:id/like

// 探索頁：取得熱門話題
GET /stories/explore
Response: {
  trending: StoryFieldMeta[],      // 本週熱門
  popular: StoryFieldMeta[],       // 總回應最多
  recent: StoryFieldMeta[]         // 最近有新回應
}

// 探索頁：取得某話題的所有回答
GET /stories/:field/answers
Query: { sort: 'recent' | 'popular', page: number }
Response: {
  field: StoryFieldMeta,
  answers: Array<{
    biography: BiographySummary,
    content: string,
    responses_count: number,
    likes_count: number
  }>
}
```

### 4.4 故事欄位對照表

```typescript
const STORY_FIELDS = {
  // 核心故事（第二層）
  core: [
    { field: 'climbing_origin', name: '你與攀岩的相遇', prompt: '第一次接觸攀岩的故事' },
    { field: 'climbing_meaning', name: '攀岩對你的意義', prompt: '攀岩在你生命中扮演的角色' },
    { field: 'advice_to_self', name: '給剛開始的自己一句話', prompt: '如果能對初學時的自己說一句話' },
  ],

  // 進階故事（第三層）- 成長與突破
  growth: [
    { field: 'memorable_moment', name: '最難忘的攀岩時刻', prompt: '印象最深刻的一次經驗' },
    { field: 'biggest_challenge', name: '最大的挑戰', prompt: '你面對過最大的攀岩挑戰' },
    { field: 'breakthrough', name: '突破的經歷', prompt: '讓你感到突破的一次經驗' },
    { field: 'first_outdoor', name: '第一次戶外攀岩', prompt: '第一次到戶外的故事' },
    { field: 'first_grade', name: '第一次完攀的等級', prompt: '達成的第一個里程碑' },
    { field: 'frustration', name: '最挫折的經歷', prompt: '讓你感到挫折的一次經驗' },
  ],

  // 進階故事 - 心理與哲學
  philosophy: [
    { field: 'overcome_fear', name: '克服恐懼的方法', prompt: '你如何面對攀岩中的恐懼' },
    { field: 'important_lesson', name: '攀岩教會你的事', prompt: '最重要的一課' },
    { field: 'view_on_failure', name: '看待失敗的方式', prompt: '攀岩如何改變你看待失敗' },
    { field: 'flow_moment', name: '心流時刻', prompt: '完全沉浸的經驗' },
    { field: 'life_balance', name: '生活平衡', prompt: '如何平衡攀岩與生活' },
    { field: 'unexpected_gain', name: '意外的收穫', prompt: '攀岩帶來的意外收穫' },
  ],

  // 進階故事 - 社群與連結
  community: [
    { field: 'climbing_mentor', name: '攀岩導師', prompt: '對你影響最大的人' },
    { field: 'favorite_partner', name: '最喜歡的搭檔', prompt: '最享受一起攀岩的人' },
    { field: 'funny_moment', name: '尷尬或搞笑時刻', prompt: '讓你笑出來的經驗' },
    { field: 'recommended_spot', name: '最推薦的地點', prompt: '你最想推薦給別人的地方' },
    { field: 'advice_for_others', name: '給某族群的建議', prompt: '想對特定族群說的話' },
    { field: 'memorable_gym', name: '難忘的岩館', prompt: '印象深刻的岩館經驗' },
  ],

  // 進階故事 - 實用分享
  practical: [
    { field: 'injury_story', name: '受傷經歷', prompt: '受傷與復原的故事' },
    { field: 'memorable_route', name: '難忘的路線', prompt: '印象最深的一條路線' },
    { field: 'training_method', name: '訓練方式', prompt: '你的訓練方法' },
    { field: 'effective_practice', name: '有效的練習', prompt: '對你最有效的練習方式' },
    { field: 'technique_tip', name: '技巧心得', prompt: '想分享的技巧' },
    { field: 'gear_choice', name: '裝備選擇', prompt: '裝備的選擇心得' },
  ],

  // 進階故事 - 夢想與探索
  dreams: [
    { field: 'dream_climb', name: '夢想攀登', prompt: '最想完成的攀登' },
    { field: 'special_trip', name: '特別的旅行', prompt: '印象深刻的攀岩旅行' },
    { field: 'bucket_list_story', name: '完成的人生目標', prompt: '已完成的攀岩目標故事' },
    { field: 'current_goal', name: '目前的目標', prompt: '現在正在努力的目標' },
    { field: 'style_attraction', name: '吸引你的攀岩風格', prompt: '最吸引你的攀岩類型' },
    { field: 'inspiration', name: '啟發來源', prompt: '給你啟發的人事物' },
  ],

  // 進階故事 - 生活整合
  life: [
    { field: 'other_passion', name: '除了攀岩還熱愛的事', prompt: '攀岩之外的熱情' },
  ],
}
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

## 六、實作優先順序

### Phase 1：基礎建設（核心飛輪）

| 優先序 | 功能 | 說明 | 影響 |
|-------|------|------|------|
| 1.1 | 完攀紀錄資料表 | 建立 ascent_logs 相關表 | 核心資料結構 |
| 1.2 | 完攀紀錄 CRUD API | 建立/讀取/更新/刪除 | 基礎功能 |
| 1.3 | 完攀紀錄表單 | 手動建立完攀紀錄的 UI | 用戶入口 |
| 1.4 | 個人完攀列表 | 在人物誌顯示個人完攀 | 個人價值 |
| **1.5** | **故事回應資料表** | **建立 story_responses 相關表** | **互動基礎** |
| **1.6** | **故事回應 API** | **回應/按讚/列表** | **互動功能** |

### Phase 2：連結整合（子飛輪啟動）

| 優先序 | 功能 | 說明 | 影響 |
|-------|------|------|------|
| 2.1 | 人生清單→完攀 | 完成目標時建立完攀紀錄 | 目標飛輪 |
| 2.2 | 照片→完攀 | 上傳照片時可關聯路線 | 媒體飛輪 |
| 2.3 | 完攀→足跡 | 自動同步攀岩足跡 | 地點飛輪 |
| 2.4 | 路線頁整合 | 路線頁顯示社群完攀 | 內容飛輪 |
| **2.5** | **人物誌故事回應 UI** | **每個故事欄位可回應** | **故事飛輪** |
| **2.6** | **故事回應通知** | **收到回應時通知** | **反饋迴路** |

### Phase 3：社群協作（飛輪加速）

| 優先序 | 功能 | 說明 | 影響 |
|-------|------|------|------|
| 3.1 | 標記他人 | 標記攀登者/確保者/攝影者 | 社交飛輪 |
| 3.2 | 新通知類型 | 被標記/被讚/新完攀通知 | 反饋迴路 |
| 3.3 | Beta 集合 | 路線頁的社群技巧分享 | 知識飛輪 |
| 3.4 | 完攀動態牆 | 顯示追蹤者的最新完攀 | 發現飛輪 |
| **3.5** | **一句話系列探索頁** | **依話題瀏覽所有回答** | **發現飛輪** |
| **3.6** | **熱門故事排行** | **本週最多回應的故事** | **內容曝光** |

### Phase 4：進階功能（飛輪自轉）

| 優先序 | 功能 | 說明 | 影響 |
|-------|------|------|------|
| 4.1 | 統計儀表板 | 個人/路線/岩場統計 | 成就感 |
| 4.2 | 同路人發現 | 找到爬過同路線的人 | 連結感 |
| 4.3 | 路線推薦 | 根據完攀紀錄推薦路線 | 探索感 |
| 4.4 | 年度回顧 | 年度攀登總結 | 儀式感 |
| **4.5** | **故事精選** | **編輯精選優質故事回答** | **內容品質** |
| **4.6** | **話題互動統計** | **個人收到的回應總數等** | **成就感** |

---

## 七、成功指標 (KPIs)

### 飛輪健康度指標

| 指標 | 定義 | 目標 |
|------|------|------|
| 完攀紀錄轉換率 | 完成人生清單後建立完攀紀錄的比例 | > 60% |
| 媒體標記率 | 上傳照片時標記他人的比例 | > 30% |
| 路線貢獻率 | 有社群內容的路線佔比 | > 40% |
| 互惠紀錄率 | 被標記後反向標記對方的比例 | > 50% |
| **故事回應率** | **有故事的人物誌收到回應的比例** | **> 30%** |
| **回應轉創作率** | **回應後去寫自己人物誌的比例** | **> 15%** |

### 用戶參與度指標

| 指標 | 定義 | 目標 |
|------|------|------|
| 月活躍完攀者 | 每月有建立完攀紀錄的用戶數 | 持續成長 |
| 平均完攀數/月 | 每位活躍用戶的月均完攀紀錄 | > 3 |
| Beta 貢獻率 | 完攀紀錄中有 Beta 分享的比例 | > 25% |
| 路線重訪率 | 用戶透過完攀紀錄找到新路線的比例 | > 20% |
| **故事填寫率** | **人物誌中填寫 3 題以上的比例** | **> 50%** |
| **平均回應數/故事** | **每個有內容的故事平均回應數** | **> 2** |

### 故事回應飛輪專屬指標

| 指標 | 定義 | 目標 |
|------|------|------|
| 話題參與廣度 | 有回答的話題數（34題中）佔比 | > 80% |
| 回應留存率 | 回應後 7 天內再次回應的比例 | > 40% |
| 精選回答互動率 | 精選回答被點擊/按讚的比例 | > 60% |
| 探索頁導流率 | 從探索頁點進人物誌的比例 | > 25% |

---

## 七、風險與對策

| 風險 | 可能影響 | 對策 |
|------|---------|------|
| 冷啟動問題 | 初期沒人上傳，路線頁空蕩蕩 | 種子內容策略：邀請核心攀岩者先上傳 |
| 隱私顧慮 | 用戶不想被標記 | 可關閉被標記功能，需確認才顯示 |
| 資料品質 | 錯誤的 Beta、假冒的完攀 | 社群檢舉機制、信譽系統 |
| 過度遊戲化 | 為了數字而失去真實性 | 強調故事價值而非數量 |

---

## 九、總結

這個飛輪設計有**兩個核心引擎**，分別驅動不同類型的用戶參與：

### 雙核心飛輪架構

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│     【行動型飛輪】                    【故事型飛輪】                  │
│     以完攀紀錄為核心                   以故事回應為核心               │
│                                                                     │
│     ┌─────────────┐                 ┌─────────────┐                │
│     │  完攀紀錄   │                 │  故事回應   │                │
│     │  (新核心)   │                 │ (一句話系列) │                │
│     └──────┬──────┘                 └──────┬──────┘                │
│            │                               │                        │
│    ┌───────┼───────┐               ┌───────┼───────┐               │
│    │       │       │               │       │       │               │
│    ▼       ▼       ▼               ▼       ▼       ▼               │
│ ┌─────┐ ┌─────┐ ┌─────┐       ┌─────┐ ┌─────┐ ┌─────┐            │
│ │路線 │ │照片 │ │目標 │       │共鳴 │ │討論 │ │探索 │            │
│ │豐富 │ │標記 │ │完成 │       │回應 │ │互動 │ │發現 │            │
│ └──┬──┘ └──┬──┘ └──┬──┘       └──┬──┘ └──┬──┘ └──┬──┘            │
│    │       │       │               │       │       │               │
│    └───────┼───────┘               └───────┼───────┘               │
│            │                               │                        │
│            ▼                               ▼                        │
│     ┌─────────────┐                 ┌─────────────┐                │
│     │  攀岩足跡   │                 │  啟發創作   │                │
│     └──────┬──────┘                 └──────┬──────┘                │
│            │                               │                        │
│            └───────────────┬───────────────┘                        │
│                            │                                        │
│                            ▼                                        │
│                     ┌─────────────┐                                 │
│                     │   人物誌    │                                 │
│                     │  (個人中心)  │                                 │
│                     └─────────────┘                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 兩種用戶類型的入口

| 用戶類型 | 入口 | 飛輪路徑 |
|---------|------|---------|
| **行動派** | 完攀路線 → 上傳紀錄 | 完攀紀錄 → 路線豐富 → 被發現 → 社群連結 |
| **故事派** | 閱讀故事 → 產生共鳴 | 回應故事 → 互動討論 → 想寫自己的 → 豐富人物誌 |

### 飛輪交會點：人物誌

兩個飛輪最終都匯聚到**人物誌**：

```
完攀紀錄 ──→ 攀登履歷 ──┐
                        ├──→ 完整的人物誌 ──→ 被更多人發現
故事回應 ──→ 故事內容 ──┘
```

### 核心價值主張

| 對象 | 行動型飛輪價值 | 故事型飛輪價值 |
|------|---------------|---------------|
| **攀岩者** | 記錄成長軌跡，建立攀登履歷 | 分享故事，獲得共鳴與連結 |
| **社群** | 互相幫忙紀錄，建立協作 | 話題討論，建立情感連結 |
| **內容** | 豐富路線資料，幫助後來者 | 豐富故事內容，啟發他人 |

### 為什麼需要雙核心？

1. **降低參與門檻**
   - 不是每個人都常常完攀新路線
   - 但每個人都有故事可以分享、可以回應

2. **不同時機的參與**
   - 完攀紀錄：攀岩當天/隔天上傳
   - 故事回應：任何時間都可以參與

3. **互相導流**
   - 看到有趣的故事 → 好奇這個人爬過什麼 → 看完攀紀錄
   - 看到厲害的完攀 → 好奇這個人的故事 → 看人物誌

**這個雙核心飛輪一旦轉起來，無論用戶是「行動派」還是「故事派」，都能找到參與的入口，並且互相強化整個生態系統的價值。**
