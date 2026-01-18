# 人物誌內容重新規劃

> 文件版本：v2.0
> 建立日期：2026-01-18
> 最後更新：2026-01-18
> 關聯文件：`persona-creation-ux-improvement.md`

---

## 1. 設計目標

將原本「34 個開放性文字題目」重新設計為**三層漸進式結構**，讓用戶在 30 秒內就能完成基本人物誌，同時保留深度分享的可能性。

### 1.1 核心架構

```
┌─────────────────────────────────────────────────────────────┐
│  第一層：標籤系統（11+ 維度）          ⏱️ 30 秒    完成率 80%+ │
├─────────────────────────────────────────────────────────────┤
│  第二層：一句話系列（8+ 題）           ⏱️ 2-3 分鐘  完成率 50%+ │
├─────────────────────────────────────────────────────────────┤
│  第三層：深度故事（31+ 題）            ⏱️ 依個人    完成率 15%+ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 開放式設計原則

**所有內容都支援用戶自訂**，不完全由開發者控制：

| 層級 | 開發者預設 | 用戶可自訂 |
|-----|-----------|-----------|
| 標籤系統 | 11 個維度、70+ 選項 | ✅ 新增維度、新增選項 |
| 一句話系列 | 8 個問題 | ✅ 新增問題 |
| 深度故事 | 31 個問題（6 分類） | ✅ 新增問題 |

**設計理念：**
- 開發者提供「好的起點」，降低用戶選擇困難
- 用戶可以「突破框架」，表達獨特身份
- 熱門的用戶自訂內容可被採納為系統預設（未來功能）

---

## 2. 資料結構設計

### 2.0 設計原則：開放式內容系統

```
┌─────────────────────────────────────────────────────────────┐
│                      內容來源                                │
├───────────────────────┬─────────────────────────────────────┤
│     系統預設 (system)  │        用戶自訂 (user)               │
│     ─────────────────  │        ─────────────────            │
│     • 開發者維護        │        • 用戶自由新增                │
│     • 提供好的起點      │        • 表達獨特身份                │
│     • ID 格式: sys_xxx  │        • ID 格式: usr_xxx            │
│                        │        • 熱門內容可被採納為系統預設   │
└───────────────────────┴─────────────────────────────────────┘
```

**核心型別：**

```typescript
/**
 * 內容來源標記
 */
export type ContentSource = 'system' | 'user'

/**
 * 可擴展項目的基礎介面
 */
export interface ExtensibleItem {
  id: string                    // sys_xxx 或 usr_xxx
  source: ContentSource         // 來源標記
  created_by?: string           // 用戶自訂時的 user_id
  created_at?: string           // 建立時間
}
```

### 2.1 新版 Biography Interface

```typescript
/**
 * 人物誌介面 v2
 * 三層漸進式設計 + 開放式內容
 */
export interface BiographyV2 {
  // ═══════════════════════════════════════════
  // 基本資訊
  // ═══════════════════════════════════════════
  id: string
  user_id: string | null
  slug: string
  name: string
  title: string | null  // 一句話介紹自己
  bio: string | null
  avatar_url: string | null
  cover_image: string | null

  // ═══════════════════════════════════════════
  // 攀岩基本資料
  // ═══════════════════════════════════════════
  climbing_start_year: number | null      // 開始攀岩年份
  frequent_locations: string[] | null     // 常去的地點（陣列）
  home_gym: string | null                 // 主場岩館

  // ═══════════════════════════════════════════
  // 第一層：標籤系統（開放式）
  // ═══════════════════════════════════════════
  tags: BiographyTagsV2 | null

  // ═══════════════════════════════════════════
  // 第二層：一句話系列（開放式）
  // ═══════════════════════════════════════════
  one_liners: BiographyOneLinersV2 | null

  // ═══════════════════════════════════════════
  // 第三層：深度故事（開放式）
  // ═══════════════════════════════════════════
  stories: BiographyStoriesV2 | null

  // ═══════════════════════════════════════════
  // 媒體與社群
  // ═══════════════════════════════════════════
  gallery_images: GalleryImage[] | null
  social_links: SocialLinks | null
  featured_video_id: string | null

  // ═══════════════════════════════════════════
  // 隱私與狀態
  // ═══════════════════════════════════════════
  visibility: 'public' | 'community' | 'private' | 'anonymous'
  is_featured: boolean
  published_at: string | null
  created_at: string
  updated_at: string

  // ═══════════════════════════════════════════
  // 統計
  // ═══════════════════════════════════════════
  total_likes: number
  total_views: number
  follower_count: number
  comment_count: number
}
```

### 2.2 標籤系統結構（開放式設計）

**設計原則：**
- 維度和選項都可動態擴展
- 系統預設提供 11 個維度、70+ 選項
- 用戶可新增維度、新增選項
- 使用 Map 結構儲存，支援任意維度 ID

```typescript
/**
 * 標籤維度定義
 * 開發者或用戶可新增
 */
export interface TagDimension extends ExtensibleItem {
  id: string                    // 維度 ID，如 'sys_style_cult' 或 'usr_custom_123'
  source: ContentSource         // 'system' | 'user'
  name: string                  // 顯示名稱，如「風格邪教」
  emoji: string                 // 圖標，如「🔮」
  description: string           // 說明文字
  selection_mode: 'single' | 'multiple'  // 單選或複選
  options: TagOption[]          // 該維度下的選項
  order: number                 // 排序（系統維度在前）
  is_active: boolean            // 是否啟用
}

/**
 * 標籤選項定義
 */
export interface TagOption extends ExtensibleItem {
  id: string                    // 選項 ID，如 'sys_crack_cult' 或 'usr_my_tag_123'
  source: ContentSource         // 'system' | 'user'
  dimension_id: string          // 所屬維度 ID
  label: string                 // 顯示標籤，如「#裂隙邪教」
  description: string           // 說明，如「塞裂隙的快感無可取代」
  order: number                 // 排序
}

/**
 * 用戶的標籤選擇結果
 * 使用 Map 結構支援動態維度
 */
export interface BiographyTagsV2 {
  // 用戶選擇的標籤，按維度分組
  // key: 維度 ID，value: 選中的選項 ID 陣列
  selections: Record<string, string[]>

  // 用戶自訂的維度（如果有的話）
  custom_dimensions?: TagDimension[]

  // 用戶自訂的選項（加到現有維度）
  custom_options?: TagOption[]
}

// ═══════════════════════════════════════════
// 系統預設維度 ID 常量
// ═══════════════════════════════════════════

export const SYSTEM_TAG_DIMENSIONS = {
  STYLE_CULT: 'sys_style_cult',           // 風格邪教
  INJURY_BADGE: 'sys_injury_badge',       // 傷痛勳章
  SHOE_FACTION: 'sys_shoe_faction',       // 鞋子門派
  TIME_TYPE: 'sys_time_type',             // 時間型態
  LIFESTYLE: 'sys_lifestyle',             // 生活方式
  CLIMBING_MUSIC: 'sys_climbing_music',   // 爬牆 BGM
  FAILURE_RESPONSE: 'sys_failure_response', // 面對失敗
  SOCIAL_TYPE: 'sys_social_type',         // 社交類型
  CHALK_HABIT: 'sys_chalk_habit',         // 上粉習慣
  TRAINING_APPROACH: 'sys_training_approach', // 訓練取向
  LOCAL_IDENTITY: 'sys_local_identity',   // 在地認同
} as const

// ═══════════════════════════════════════════
// 系統預設選項 ID 格式
// ═══════════════════════════════════════════

// 格式：sys_{dimension}_{option}
// 例如：
// - sys_style_cult_crack      (#裂隙邪教)
// - sys_style_cult_slab       (#Slab邪教)
// - sys_injury_badge_a2       (#A2滑輪倖存者)
// - usr_style_cult_custom_123 (用戶自訂)
```

#### 標籤資料範例

```typescript
// 系統預設維度範例
const styleCultDimension: TagDimension = {
  id: 'sys_style_cult',
  source: 'system',
  name: '風格邪教',
  emoji: '🔮',
  description: '你是哪個邪教的？',
  selection_mode: 'multiple',
  order: 1,
  is_active: true,
  options: [
    {
      id: 'sys_style_cult_crack',
      source: 'system',
      dimension_id: 'sys_style_cult',
      label: '#裂隙邪教',
      description: '塞裂隙的快感無可取代',
      order: 1,
    },
    {
      id: 'sys_style_cult_slab',
      source: 'system',
      dimension_id: 'sys_style_cult',
      label: '#Slab邪教',
      description: '平衡就是藝術',
      order: 2,
    },
    // ... 更多選項
  ],
}

// 用戶自訂維度範例
const customDimension: TagDimension = {
  id: 'usr_dim_456',
  source: 'user',
  created_by: 'user_123',
  created_at: '2026-01-18T10:00:00Z',
  name: '裝備迷信',
  emoji: '🧿',
  description: '你有什麼攀岩迷信？',
  selection_mode: 'multiple',
  order: 100,  // 用戶自訂維度排在後面
  is_active: true,
  options: [
    {
      id: 'usr_opt_789',
      source: 'user',
      created_by: 'user_123',
      dimension_id: 'usr_dim_456',
      label: '#左腳先穿',
      description: '穿鞋一定要左腳先',
      order: 1,
    },
  ],
}

// 用戶選擇結果範例
const userTags: BiographyTagsV2 = {
  selections: {
    'sys_style_cult': ['sys_style_cult_crack', 'sys_style_cult_overhang'],
    'sys_injury_badge': ['sys_injury_badge_a2'],
    'sys_shoe_faction': ['sys_shoe_faction_la_sportiva'],
    'usr_dim_456': ['usr_opt_789'],  // 用戶自訂維度的選擇
  },
  custom_dimensions: [customDimension],
  custom_options: [
    {
      id: 'usr_opt_999',
      source: 'user',
      created_by: 'user_123',
      dimension_id: 'sys_style_cult',  // 加到系統維度
      label: '#Campusing邪教',
      description: '不用腳也能爬',
      order: 100,
    },
  ],
}
```

### 2.3 一句話系列結構（開放式設計）

**設計原則：**
- 問題和回答都使用動態結構
- 系統預設 8 個問題
- 用戶可新增自己想回答的問題
- 使用陣列儲存，支援任意數量的問題

```typescript
/**
 * 一句話問題定義
 */
export interface OneLinerQuestion extends ExtensibleItem {
  id: string                    // 問題 ID，如 'sys_why_started' 或 'usr_q_123'
  source: ContentSource         // 'system' | 'user'
  question: string              // 問題文字，如「為什麼開始爬？」
  format_hint: string | null    // 格式引導，如「因為＿＿＿」
  placeholder: string           // 輸入提示，如「朋友拉我去，結果就回不去了」
  order: number                 // 排序
  category?: string             // 可選分類
}

/**
 * 用戶的一句話回答
 */
export interface OneLinerAnswer {
  question_id: string           // 對應的問題 ID
  answer: string                // 回答內容
  updated_at: string            // 最後更新時間
}

/**
 * 一句話系列資料結構
 */
export interface BiographyOneLinersV2 {
  // 用戶的回答列表
  answers: OneLinerAnswer[]

  // 用戶自訂的問題
  custom_questions?: OneLinerQuestion[]
}

// ═══════════════════════════════════════════
// 系統預設問題 ID
// ═══════════════════════════════════════════

export const SYSTEM_ONELINER_QUESTIONS = {
  WHY_STARTED: 'sys_ol_why_started',
  FAVORITE_PLACE: 'sys_ol_favorite_place',
  BEST_MOMENT: 'sys_ol_best_moment',
  ADVICE_FOR_BEGINNERS: 'sys_ol_advice_for_beginners',
  CURRENT_GOAL: 'sys_ol_current_goal',
  CLIMBING_LESSON: 'sys_ol_climbing_lesson',
  CLIMBING_STYLE_DESC: 'sys_ol_climbing_style_desc',
  LIFE_OUTSIDE: 'sys_ol_life_outside',
} as const
```

#### 一句話資料範例

```typescript
// 系統預設問題
const systemQuestions: OneLinerQuestion[] = [
  {
    id: 'sys_ol_why_started',
    source: 'system',
    question: '為什麼開始攀岩？',
    format_hint: '因為＿＿＿',
    placeholder: '朋友拉我去，結果就回不去了',
    order: 1,
  },
  {
    id: 'sys_ol_best_moment',
    source: 'system',
    question: '爬岩最爽的是？',
    format_hint: '當＿＿＿的時候',
    placeholder: '終於送出 project',
    order: 2,
  },
  // ... 更多問題
]

// 用戶自訂問題
const customQuestion: OneLinerQuestion = {
  id: 'usr_ol_123',
  source: 'user',
  created_by: 'user_456',
  created_at: '2026-01-18T10:00:00Z',
  question: '攀岩前最常吃什麼？',
  format_hint: null,
  placeholder: '香蕉配咖啡',
  order: 100,
}

// 用戶回答範例
const userOneLiners: BiographyOneLinersV2 = {
  answers: [
    {
      question_id: 'sys_ol_why_started',
      answer: '朋友拉我去，結果就回不去了',
      updated_at: '2026-01-18T10:00:00Z',
    },
    {
      question_id: 'sys_ol_best_moment',
      answer: '終於送出卡了一個月的路線',
      updated_at: '2026-01-18T10:00:00Z',
    },
    {
      question_id: 'usr_ol_123',  // 回答自訂問題
      answer: '香蕉加花生醬',
      updated_at: '2026-01-18T10:00:00Z',
    },
  ],
  custom_questions: [customQuestion],
}
```

### 2.4 深度故事結構（開放式設計）

**設計理念：**
- 保留豐富的故事選項，改變呈現方式
- 問題和分類都可動態擴展
- 用戶可新增自己想回答的問題

```
之前的問題：31 題全部攤開 → 用戶感到壓力
新的做法：31 題按分類收合 + 隨機推薦 + 用戶可自訂 → 想寫什麼寫什麼
```

```typescript
/**
 * 故事分類定義
 */
export interface StoryCategory extends ExtensibleItem {
  id: string                    // 分類 ID，如 'sys_growth' 或 'usr_cat_123'
  source: ContentSource         // 'system' | 'user'
  name: string                  // 顯示名稱，如「成長與突破」
  emoji: string                 // 圖標，如「🌱」
  description: string           // 說明文字
  order: number                 // 排序
}

/**
 * 故事問題定義
 */
export interface StoryQuestion extends ExtensibleItem {
  id: string                    // 問題 ID，如 'sys_memorable_moment' 或 'usr_q_123'
  source: ContentSource         // 'system' | 'user'
  category_id: string           // 所屬分類 ID
  title: string                 // 問題標題（去成就化版本）
  subtitle: string              // 引導說明
  placeholder: string           // 簡短範例
  difficulty: 'easy' | 'medium' | 'deep'  // 回答難度
  order: number                 // 排序
}

/**
 * 用戶的故事回答
 */
export interface StoryAnswer {
  question_id: string           // 對應的問題 ID
  content: string               // 故事內容
  updated_at: string            // 最後更新時間
  word_count?: number           // 字數統計
}

/**
 * 深度故事資料結構
 */
export interface BiographyStoriesV2 {
  // 用戶的回答列表
  answers: StoryAnswer[]

  // 用戶自訂的分類（如果有的話）
  custom_categories?: StoryCategory[]

  // 用戶自訂的問題
  custom_questions?: StoryQuestion[]
}

// ═══════════════════════════════════════════
// 系統預設分類 ID
// ═══════════════════════════════════════════

export const SYSTEM_STORY_CATEGORIES = {
  GROWTH: 'sys_cat_growth',           // A. 成長與突破
  PSYCHOLOGY: 'sys_cat_psychology',   // B. 心理與哲學
  COMMUNITY: 'sys_cat_community',     // C. 社群與連結
  PRACTICAL: 'sys_cat_practical',     // D. 實用分享
  DREAMS: 'sys_cat_dreams',           // E. 夢想與探索
  LIFE: 'sys_cat_life',               // F. 生活整合
} as const

// ═══════════════════════════════════════════
// 系統預設問題 ID 格式
// ═══════════════════════════════════════════

// 格式：sys_story_{category}_{question}
// 例如：
// - sys_story_growth_memorable_moment
// - sys_story_psychology_fear_management
// - usr_story_custom_123 (用戶自訂)
```

#### 故事資料範例

```typescript
// 系統預設分類
const systemCategories: StoryCategory[] = [
  {
    id: 'sys_cat_growth',
    source: 'system',
    name: '成長與突破',
    emoji: '🌱',
    description: '你的攀岩成長故事',
    order: 1,
  },
  {
    id: 'sys_cat_psychology',
    source: 'system',
    name: '心理與哲學',
    emoji: '🧠',
    description: '攀岩帶給你的思考',
    order: 2,
  },
  // ... 更多分類
]

// 系統預設問題
const systemQuestions: StoryQuestion[] = [
  {
    id: 'sys_story_growth_memorable_moment',
    source: 'system',
    category_id: 'sys_cat_growth',
    title: '有沒有某次攀爬讓你一直記到現在？',
    subtitle: '不一定要多厲害，只要對你有意義',
    placeholder: '去年第一次去龍洞...',
    difficulty: 'easy',
    order: 1,
  },
  {
    id: 'sys_story_psychology_fear_management',
    source: 'system',
    category_id: 'sys_cat_psychology',
    title: '會怕高或怕墜落嗎？怎麼面對的？',
    subtitle: '每個人都有害怕的時候',
    placeholder: '剛開始真的很怕...',
    difficulty: 'medium',
    order: 1,
  },
  // ... 更多問題
]

// 用戶自訂分類
const customCategory: StoryCategory = {
  id: 'usr_cat_456',
  source: 'user',
  created_by: 'user_123',
  created_at: '2026-01-18T10:00:00Z',
  name: '攀岩與感情',
  emoji: '💕',
  description: '攀岩對你的感情關係有什麼影響？',
  order: 100,
}

// 用戶自訂問題
const customQuestion: StoryQuestion = {
  id: 'usr_story_789',
  source: 'user',
  created_by: 'user_123',
  created_at: '2026-01-18T10:00:00Z',
  category_id: 'usr_cat_456',  // 放在自訂分類
  title: '攀岩有沒有影響你的感情關係？',
  subtitle: '不管是好的還是壞的',
  placeholder: '因為攀岩認識了我的另一半...',
  difficulty: 'deep',
  order: 1,
}

// 用戶回答範例
const userStories: BiographyStoriesV2 = {
  answers: [
    {
      question_id: 'sys_story_growth_memorable_moment',
      content: '去年第一次去龍洞，本來只是想說體驗看看，結果一爬就愛上了戶外的感覺...',
      updated_at: '2026-01-18T10:00:00Z',
      word_count: 150,
    },
    {
      question_id: 'usr_story_789',  // 回答自訂問題
      content: '因為攀岩認識了現在的女朋友，我們第一次約會就是去岩館...',
      updated_at: '2026-01-18T10:00:00Z',
      word_count: 200,
    },
  ],
  custom_categories: [customCategory],
  custom_questions: [customQuestion],
}
```

#### 系統預設故事問題清單（31 題）

> 以下為系統預設問題，用戶可另外新增自訂問題

##### A. 成長與突破（6題）

| 問題 ID | 問題（去成就化） | 難度 |
|--------|----------------|------|
| `sys_story_growth_memorable_moment` | 有沒有某次攀爬讓你一直記到現在？ | easy |
| `sys_story_growth_biggest_challenge` | 有遇過什麼卡關的時候嗎？ | medium |
| `sys_story_growth_breakthrough` | 最近有沒有覺得自己進步的時刻？ | easy |
| `sys_story_growth_first_outdoor` | 還記得第一次戶外攀岩嗎？ | easy |
| `sys_story_growth_first_grade` | 有沒有哪條路線讓你特別有成就感？ | easy |
| `sys_story_growth_frustrating` | 有沒有讓你很挫折的經驗？後來怎麼面對？ | medium |

##### B. 心理與哲學（6題）

| 問題 ID | 問題（去成就化） | 難度 |
|--------|----------------|------|
| `sys_story_psychology_fear` | 會怕高或怕墜落嗎？怎麼面對的？ | medium |
| `sys_story_psychology_lesson` | 攀岩有沒有讓你學到什麼？ | medium |
| `sys_story_psychology_failure` | 爬不上去的時候會怎麼想？ | easy |
| `sys_story_psychology_flow` | 有沒有爬到忘記時間的經驗？ | easy |
| `sys_story_psychology_balance` | 怎麼安排攀岩和其他生活？ | medium |
| `sys_story_psychology_gain` | 攀岩有帶給你什麼意外的收穫嗎？ | deep |

##### C. 社群與連結（6題）

| 問題 ID | 問題（去成就化） | 難度 |
|--------|----------------|------|
| `sys_story_community_mentor` | 有沒有想感謝的人？ | easy |
| `sys_story_community_partner` | 有沒有固定的攀岩夥伴？有什麼故事？ | easy |
| `sys_story_community_funny` | 有沒有什麼搞笑或尷尬的經歷？ | easy |
| `sys_story_community_spot` | 最常去或最推薦哪裡爬？為什麼？ | easy |
| `sys_story_community_advice` | 想對新手（或某個族群）說什麼？ | medium |
| `sys_story_community_space` | 有沒有對你特別有意義的岩館或地點？ | medium |

##### D. 實用分享（6題）

| 問題 ID | 問題（去成就化） | 難度 |
|--------|----------------|------|
| `sys_story_practical_injury` | 有受過傷嗎？怎麼復原的？ | medium |
| `sys_story_practical_route` | 有沒有想分享的路線或經驗？ | easy |
| `sys_story_practical_training` | 你平常怎麼練習？有什麼小習慣？ | easy |
| `sys_story_practical_practice` | 有沒有對你特別有效的練習方法？ | medium |
| `sys_story_practical_technique` | 有沒有學到什麼實用的技巧？ | easy |
| `sys_story_practical_gear` | 關於裝備有沒有什麼心得？ | easy |

##### E. 夢想與探索（6題）

| 問題 ID | 問題（去成就化） | 難度 |
|--------|----------------|------|
| `sys_story_dreams_dream_climb` | 如果能去任何地方爬，你想去哪？ | easy |
| `sys_story_dreams_trip` | 有沒有印象深刻的攀岩旅行？ | easy |
| `sys_story_dreams_bucket_list` | 有沒有完成過什麼攀岩目標？感覺如何？ | medium |
| `sys_story_dreams_goal` | 最近有什麼想達成的小目標？ | easy |
| `sys_story_dreams_style` | 最喜歡什麼樣的路線或風格？ | easy |
| `sys_story_dreams_inspiration` | 有沒有啟發你的人、影片或故事？ | easy |

##### F. 生活整合（1題）

| 問題 ID | 問題（去成就化） | 難度 |
|--------|----------------|------|
| `sys_story_life_outside` | 攀岩之外，還有什麼讓你著迷？ | easy |

---

#### 用戶自訂問題範例

用戶可以新增自己想回答的問題，放在現有分類或自訂分類中：

```typescript
// 加到現有分類
{
  id: 'usr_story_001',
  source: 'user',
  created_by: 'user_123',
  category_id: 'sys_cat_community',  // 放在「社群與連結」
  title: '有沒有因為攀岩認識的好朋友？',
  subtitle: '分享你們怎麼認識的',
  placeholder: '在岩館遇到一個很會聊天的人...',
  difficulty: 'easy',
  order: 100,
}

// 新增自訂分類
{
  id: 'usr_cat_relationship',
  source: 'user',
  created_by: 'user_123',
  name: '攀岩與感情',
  emoji: '💕',
  description: '攀岩對感情關係的影響',
  order: 100,
}
```

---

#### 故事 UI 呈現方式

**設計原則：**
- 預設收合，不造成壓力
- 按分類瀏覽，容易找到想回答的
- 「隨機推薦」幫助不知道從哪開始的人
- 顯示填寫進度，有成就感

```
┌─────────────────────────────────────────────────────────────┐
│  📖 我的故事                                    已記錄 5 則  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  不知道要寫什麼？ [🎲 隨機推薦一題]                          │
│                                                             │
│  ───────────────────────────────────────────────────────   │
│                                                             │
│  ▾ A. 成長與突破                               2/6 已填寫   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✓ 有沒有某次攀爬讓你一直記到現在？                    │   │
│  │   「去年第一次去龍洞...」                 [編輯]      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ✓ 最近有沒有覺得自己進步的時刻？                      │   │
│  │   「上週終於送出卡了一個月的...」         [編輯]      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ○ 有遇過什麼卡關的時候嗎？                [開始寫]    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ○ 還記得第一次戶外攀岩嗎？                [開始寫]    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ○ 有沒有哪條路線讓你特別有成就感？        [開始寫]    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ○ 有沒有讓你很挫折的經驗？                [開始寫]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ▸ B. 心理與哲學                               0/6 已填寫   │
│  ▸ C. 社群與連結                               2/6 已填寫   │
│  ▸ D. 實用分享                                 1/6 已填寫   │
│  ▸ E. 夢想與探索                               0/6 已填寫   │
│  ▸ F. 生活整合                                 0/1 已填寫   │
│                                                             │
│  ───────────────────────────────────────────────────────   │
│                                                             │
│  💡 想寫多少就寫多少，隨時可以回來補充                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**隨機推薦邏輯：**

```typescript
function getRandomQuestion(
  stories: BiographyStoriesV2,
  allQuestions: StoryQuestion[]
): StoryQuestion {
  // 建立已回答問題的 ID 集合
  const answeredQuestionIds = new Set(
    stories.answers.map(a => a.question_id)
  )

  // 優先推薦：
  // 1. 尚未填寫的
  // 2. 難度為 'easy' 的
  // 3. 如果都填了，隨機選一個讓用戶更新

  const unfilledEasy = allQuestions.filter(
    q => !answeredQuestionIds.has(q.id) && q.difficulty === 'easy'
  )

  if (unfilledEasy.length > 0) {
    return randomPick(unfilledEasy)
  }

  const unfilled = allQuestions.filter(
    q => !answeredQuestionIds.has(q.id)
  )
  if (unfilled.length > 0) {
    return randomPick(unfilled)
  }

  return randomPick(allQuestions)
}
```

### 2.5 輔助類型

```typescript
/**
 * 圖片資料
 */
export interface GalleryImage {
  id: string
  url: string
  caption?: string
  order: number
}

/**
 * 社群連結
 */
export interface SocialLinks {
  instagram?: string
  youtube?: string
  facebook?: string
  threads?: string
  website?: string
}
```

---

## 3. 資料庫 Schema 變更

### 3.1 Biography 表變更

```sql
-- 標籤系統（JSON，含用戶選擇和自訂內容）
ALTER TABLE biographies ADD COLUMN tags TEXT DEFAULT NULL;

-- 一句話系列（JSON，含回答和自訂問題）
ALTER TABLE biographies ADD COLUMN one_liners TEXT DEFAULT NULL;

-- 深度故事（JSON，含回答和自訂問題/分類）
ALTER TABLE biographies ADD COLUMN stories TEXT DEFAULT NULL;

-- 隱私設定
ALTER TABLE biographies ADD COLUMN visibility TEXT DEFAULT 'private'
  CHECK (visibility IN ('public', 'community', 'private', 'anonymous'));

-- 主場岩館
ALTER TABLE biographies ADD COLUMN home_gym TEXT DEFAULT NULL;
```

### 3.2 內容定義表（開發者維護）

```sql
-- 系統預設標籤維度
CREATE TABLE tag_dimensions (
  id TEXT PRIMARY KEY,              -- 'sys_style_cult'
  name TEXT NOT NULL,               -- '風格邪教'
  emoji TEXT,                       -- '🔮'
  description TEXT,
  selection_mode TEXT DEFAULT 'single' CHECK (selection_mode IN ('single', 'multiple')),
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 系統預設標籤選項
CREATE TABLE tag_options (
  id TEXT PRIMARY KEY,              -- 'sys_style_cult_crack'
  dimension_id TEXT NOT NULL,       -- 'sys_style_cult'
  label TEXT NOT NULL,              -- '#裂隙邪教'
  description TEXT,                 -- '塞裂隙的快感無可取代'
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (dimension_id) REFERENCES tag_dimensions(id)
);

-- 系統預設一句話問題
CREATE TABLE oneliner_questions (
  id TEXT PRIMARY KEY,              -- 'sys_ol_why_started'
  question TEXT NOT NULL,           -- '為什麼開始攀岩？'
  format_hint TEXT,                 -- '因為＿＿＿'
  placeholder TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 系統預設故事分類
CREATE TABLE story_categories (
  id TEXT PRIMARY KEY,              -- 'sys_cat_growth'
  name TEXT NOT NULL,               -- '成長與突破'
  emoji TEXT,                       -- '🌱'
  description TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 系統預設故事問題
CREATE TABLE story_questions (
  id TEXT PRIMARY KEY,              -- 'sys_story_growth_memorable_moment'
  category_id TEXT NOT NULL,        -- 'sys_cat_growth'
  title TEXT NOT NULL,              -- '有沒有某次攀爬讓你一直記到現在？'
  subtitle TEXT,
  placeholder TEXT,
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'deep')),
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES story_categories(id)
);

-- 建立索引
CREATE INDEX idx_tag_options_dimension ON tag_options(dimension_id);
CREATE INDEX idx_story_questions_category ON story_questions(category_id);
```

### 3.3 用戶自訂內容儲存策略

**核心問題：用戶自訂內容存在哪裡？**

用戶自訂內容採用**雙軌儲存機制**，根據是否公開共享而有不同的儲存方式：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          用戶建立自訂內容                                    │
│                                │                                            │
│                                ▼                                            │
│                   ┌────────────────────────┐                                │
│                   │ 用戶選擇是否公開共享？  │                                │
│                   └────────────────────────┘                                │
│                        │              │                                     │
│                        ▼              ▼                                     │
│            ┌──────────────────┐ ┌──────────────────┐                        │
│            │   僅自己使用      │ │   公開讓他人選用  │                        │
│            │   is_public=false │ │   is_public=true  │                        │
│            └──────────────────┘ └──────────────────┘                        │
│                        │              │                                     │
│                        ▼              ▼                                     │
│            ┌──────────────────┐ ┌──────────────────┐                        │
│            │ 儲存在 JSON 欄位  │ │ 同時儲存在：      │                        │
│            │ biographies.tags  │ │ 1. JSON 欄位      │                        │
│            │ biographies.xxx   │ │ 2. 共享表         │                        │
│            │                  │ │    user_custom_*  │                        │
│            └──────────────────┘ └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**儲存規則：**

| 情境 | 儲存位置 | 說明 |
|-----|---------|------|
| 用戶建立自訂標籤（不公開） | `biographies.tags.custom_options` | 僅存在用戶自己的 JSON 中 |
| 用戶建立自訂標籤（公開） | `biographies.tags.custom_options` + `user_custom_tags` | 同時存兩處 |
| 用戶選用他人的公開標籤 | `biographies.tags.selections` | 記錄選用的 ID |
| 用戶建立自訂問題（不公開） | `biographies.one_liners.custom_questions` 或 `biographies.stories.custom_questions` | 僅存在用戶自己的 JSON 中 |
| 用戶建立自訂問題（公開） | JSON 欄位 + `user_custom_questions` | 同時存兩處 |

**更新同步規則：**

1. **不公開的自訂內容**：僅更新用戶的 JSON 欄位
2. **公開的自訂內容**：
   - 用戶修改自己建立的內容 → 同步更新共享表
   - 共享表的 `usage_count` 記錄有多少人在使用
   - 已被其他人選用的內容，建議用戶只能新增而非刪除
3. **被採納為系統預設**：
   - 管理員審核後設置 `is_approved = true`
   - 將內容複製到系統表（`tag_options` / `story_questions`）
   - 原共享表記錄保留，用於追溯來源

**API 流程範例：**

```typescript
// 建立自訂標籤
async function createCustomTag(data: CreateCustomTagRequest) {
  const tagId = `usr_tag_${generateId()}`

  // 1. 更新用戶的 biography JSON
  await updateBiographyTags(userId, {
    custom_options: [
      ...existingCustomOptions,
      {
        id: tagId,
        source: 'user',
        created_by: userId,
        dimension_id: data.dimension_id,
        label: data.label,
        description: data.description,
      }
    ]
  })

  // 2. 如果用戶選擇公開，同時寫入共享表
  if (data.is_public) {
    await db.insert(user_custom_tags).values({
      id: tagId,
      user_id: userId,
      dimension_id: data.dimension_id,
      label: data.label,
      description: data.description,
      is_public: true,
    })
  }

  return tagId
}
```

### 3.4 用戶自訂內容共享表

```sql
-- 用戶自訂標籤（可能被其他用戶採用）
CREATE TABLE user_custom_tags (
  id TEXT PRIMARY KEY,              -- 'usr_tag_123'
  user_id TEXT NOT NULL,            -- 建立者
  dimension_id TEXT,                -- 加到哪個維度（null 表示新維度）
  dimension_name TEXT,              -- 如果是新維度，維度名稱
  label TEXT NOT NULL,              -- '#Campusing邪教'
  description TEXT,
  usage_count INTEGER DEFAULT 1,    -- 被多少人使用
  is_public BOOLEAN DEFAULT false,  -- 是否公開讓其他人選用
  is_approved BOOLEAN DEFAULT false,-- 是否已審核採納為系統預設
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 用戶自訂問題（一句話或故事）
CREATE TABLE user_custom_questions (
  id TEXT PRIMARY KEY,              -- 'usr_q_456'
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('oneliner', 'story')),
  category_id TEXT,                 -- 故事問題的分類
  question TEXT NOT NULL,
  format_hint TEXT,
  placeholder TEXT,
  difficulty TEXT DEFAULT 'easy',
  usage_count INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 建立索引
CREATE INDEX idx_user_custom_tags_user ON user_custom_tags(user_id);
CREATE INDEX idx_user_custom_tags_dimension ON user_custom_tags(dimension_id);
CREATE INDEX idx_user_custom_questions_user ON user_custom_questions(user_id);
CREATE INDEX idx_user_custom_questions_type ON user_custom_questions(type);
```

### 3.5 資料遷移策略

舊欄位資料遷移到新結構：

```typescript
// 遷移腳本範例
function migrateToV2(oldBio: Biography): BiographyV2 {
  return {
    ...oldBio,

    // 遷移一句話系列
    one_liners: {
      answers: [
        oldBio.climbing_origin && {
          question_id: 'sys_ol_why_started',
          answer: oldBio.climbing_origin,
          updated_at: oldBio.updated_at,
        },
        oldBio.advice_to_self && {
          question_id: 'sys_ol_advice_for_beginners',
          answer: oldBio.advice_to_self,
          updated_at: oldBio.updated_at,
        },
        // ... 其他欄位
      ].filter(Boolean),
      custom_questions: [],
    },

    // 遷移深度故事
    stories: {
      answers: [
        oldBio.memorable_moment && {
          question_id: 'sys_story_growth_memorable_moment',
          content: oldBio.memorable_moment,
          updated_at: oldBio.updated_at,
        },
        oldBio.biggest_challenge && {
          question_id: 'sys_story_growth_biggest_challenge',
          content: oldBio.biggest_challenge,
          updated_at: oldBio.updated_at,
        },
        // ... 其他欄位
      ].filter(Boolean),
      custom_categories: [],
      custom_questions: [],
    },

    // 標籤需要用戶重新選擇
    tags: {
      selections: {},
      custom_dimensions: [],
      custom_options: [],
    },

    // 預設私密
    visibility: 'private',
  }
}
```

---

## 4. UI 排版設計

### 4.1 編輯頁面結構

```
┌─────────────────────────────────────────────────────────────┐
│  📝 記錄我的攀岩故事                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🔒 這些內容目前只有你看得到                          │   │
│  │  [公開設定 ▾]                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│  📸 基本資料                                    [編輯]      │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  [頭像]  暱稱                                               │
│          開始攀岩：2022 年                                   │
│          常去：原岩、紅石                                    │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│  🏷️ 第一步：幫自己貼標籤                ⏱️ 30 秒完成        │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  ┌─ 🔮 風格邪教 ────────────────────────────────────────┐   │
│  │ [#Slab邪教] [#外傾邪教] [#Dyno邪教] ...              │   │
│  │                                         [+ 自訂標籤] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ 🩹 傷痛勳章 ────────────────────────────────────────┐   │
│  │ [#A2滑輪倖存者] [#手皮勳章] [#目前無傷] ...          │   │
│  │                                         [+ 自訂標籤] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ 👟 鞋子門派 ────────────────────────────────────────┐   │
│  │ ○ #LaSportiva黨  ○ #Scarpa派  ○ #一雙穿到爛 ...     │   │
│  │                                         [+ 自訂標籤] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [展開更多標籤 ▾]                    [+ 新增標籤類別]       │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│  💬 第二步：一句話系列                  ⏱️ 2-3 分鐘        │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  為什麼開始攀岩？                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 因為 [朋友拉我去，結果就回不去了              ]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  爬岩最爽的是？                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 當 [終於送出 project                        ] 的時候│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 一句話就好，不用寫很多                                  │
│                                                             │
│  [展開更多問題 ▾]                      [+ 自訂問題]         │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│  📖 第三步：想說更多嗎？（選填）                             │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  這些問題需要一點時間思考，有靈感的時候再來寫就好            │
│                                                             │
│  ▸ 有沒有某次攀爬讓你一直記到現在？                         │
│  ▸ 有遇過什麼卡關的時候嗎？                                 │
│  ▸ 攀岩有沒有改變你看事情的方式？                           │
│                                                             │
│  [展開所有深度問題 ▾]      [+ 自訂問題]    [+ 新增分類]     │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  [儲存]                                    [預覽我的頁面]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 自訂標籤 Modal

```
┌─────────────────────────────────────────────────────────────┐
│  ➕ 新增自訂標籤                                      [✕]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  加到哪個類別？                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ▾ 風格邪教                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  標籤名稱（會自動加上 #）                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Campusing邪教                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  說明文字（選填）                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 不用腳也能爬                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  預覽：[#Campusing邪教]                                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☐ 讓其他用戶也能選用這個標籤                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                [取消]        [新增標籤]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 自訂問題 Modal

```
┌─────────────────────────────────────────────────────────────┐
│  ➕ 新增自訂問題                                      [✕]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  問題類型                                                   │
│  ┌───────────────────┐ ┌───────────────────┐               │
│  │ ○ 一句話           │ │ ● 深度故事        │               │
│  └───────────────────┘ └───────────────────┘               │
│                                                             │
│  放在哪個分類？（深度故事需要）                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ▾ 社群與連結                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  問題內容                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 有沒有因為攀岩認識的好朋友？                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  引導說明（選填）                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 分享你們怎麼認識的                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  回答範例（選填）                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 在岩館遇到一個很會聊天的人...                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☐ 讓其他用戶也能回答這個問題                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                [取消]        [新增問題]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 新增標籤類別 Modal

```
┌─────────────────────────────────────────────────────────────┐
│  ➕ 新增標籤類別                                      [✕]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  類別名稱                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 裝備迷信                                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  選個圖示                                                   │
│  [🧿] [🔮] [🎯] [⭐] [🎪] [🎭] [🎨] [🎬]                    │
│                                                             │
│  說明文字                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 你有什麼攀岩迷信？                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  選擇方式                                                   │
│  ○ 單選（只能選一個）                                       │
│  ● 複選（可以選多個）                                       │
│                                                             │
│  第一個標籤                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 左腳先穿                                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                [取消]        [新增類別]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.5 展示頁面結構

```
┌─────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────┐ │
│  │                    [封面圖片]                          │ │
│  │                                                       │ │
│  │        [頭像]                                         │ │
│  │        小明                                           │ │
│  │        「快樂最重要的週末岩友」                        │ │
│  │                                                       │ │
│  │        攀岩第 3 年 ｜ 常出沒：原岩、龍洞              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│  🏷️ 我的攀岩人格                                           │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ #Slab邪教 #LaSportiva黨 #週末戰士 #獨攀俠           │   │
│  │ #A2滑輪倖存者 #佛系進步 #龍洞信徒                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│  💬 關於我                                                  │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  為什麼開始爬？                                             │
│  「因為朋友拉我去，結果就回不去了」                         │
│                                                             │
│  爬岩最爽的是？                                             │
│  「當終於送出 project 的時候」                              │
│                                                             │
│  給新手一句話？                                             │
│  「不要急，享受過程最重要」                                 │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│  📖 我的故事                                                │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  ┌─ 有沒有某次攀爬讓你一直記到現在？─────────────────────┐ │
│  │                                                       │ │
│  │  去年第一次去龍洞，本來只是想說體驗看看，結果...      │ │
│  │  [繼續閱讀]                                           │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ 有沒有什麼搞笑或尷尬的經歷？────────────────────────┐ │
│  │                                                       │ │
│  │  有一次在岩館，爬到一半褲子裂開...                    │ │
│  │  [繼續閱讀]                                           │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│  📸 相簿                                                    │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  [圖1] [圖2] [圖3] [圖4]                                    │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│  🔗 社群連結                                                │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  [Instagram] [YouTube]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.6 標籤選擇器組件

```
┌─────────────────────────────────────────────────────────────┐
│  🔮 風格邪教                                    已選 2 個   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐               │
│  │ ☑ 裂隙邪教│ │ ☐ Slab邪教│ │ ☑ 外傾邪教│               │
│  │ 塞裂隙的快│ │ 平衡就是藝│ │ 沒有倒掛不│               │
│  │ 感無可取代│ │ 術        │ │ 想爬      │               │
│  └───────────┘ └───────────┘ └───────────┘               │
│                                                             │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐               │
│  │ ☐ Dyno邪教│ │ ☐ Crimp邪│ │ ☐ 大把手邪│               │
│  │ 能飛就不要│ │ 教 小點越 │ │ 教 jug 是 │               │
│  │ 慢慢來    │ │ 小越愛    │ │ 我的信仰  │               │
│  └───────────┘ └───────────┘ └───────────┘               │
│                                                             │
│  ┌───────────┐                                             │
│  │ ☐ 什麼都爬│                                             │
│  │ 教 我不挑 │                                             │
│  └───────────┘                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.7 一句話輸入組件

```
┌─────────────────────────────────────────────────────────────┐
│  為什麼開始攀岩？                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 因為                                                 │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ 朋友拉我去，結果就回不去了                      │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 一句話就好，例如：「被朋友騙去的」                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 標籤顯示名稱對照表

> **ID 格式說明**：所有系統標籤使用 `sys_{dimension}_{option}` 格式
> 用戶自訂標籤使用 `usr_{type}_{id}` 格式

### 5.1 風格邪教（維度 ID: `sys_style_cult`）

| 完整 ID | 顯示名稱 | 說明 |
|---------|---------|------|
| `sys_style_cult_crack` | #裂隙邪教 | 塞裂隙的快感無可取代 |
| `sys_style_cult_slab` | #Slab邪教 | 平衡就是藝術 |
| `sys_style_cult_overhang` | #外傾邪教 | 沒有倒掛不想爬 |
| `sys_style_cult_dyno` | #Dyno邪教 | 能飛就不要慢慢來 |
| `sys_style_cult_crimp` | #Crimp邪教 | 小點越小越愛 |
| `sys_style_cult_jug` | #大把手邪教 | jug 是我的信仰 |
| `sys_style_cult_all` | #什麼都爬教 | 我不挑 |

### 5.2 傷痛勳章（維度 ID: `sys_injury_badge`）

| 完整 ID | 顯示名稱 | 說明 |
|---------|---------|------|
| `sys_injury_badge_a2` | #A2滑輪倖存者 | 聽過那聲「啪」的都懂 |
| `sys_injury_badge_elbow` | #手肘苦主 | 網球肘/高爾夫球肘認證 |
| `sys_injury_badge_shoulder` | #肩膀卡卡 | 做 mantle 要小心 |
| `sys_injury_badge_skin` | #手皮勳章 | 撕過的皮都是榮耀 |
| `sys_injury_badge_back` | #腰在抗議 | 外傾爬多了 |
| `sys_injury_badge_none` | #目前無傷 | 珍惜這個狀態 |
| `sys_injury_badge_rehab` | #永遠在復健 | 休息也是訓練 |

### 5.3 鞋子門派（維度 ID: `sys_shoe_faction`）

| 完整 ID | 顯示名稱 | 說明 |
|---------|---------|------|
| `sys_shoe_faction_lasportiva` | #LaSportiva黨 | Solution 是信仰 |
| `sys_shoe_faction_scarpa` | #Scarpa派 | Instinct 用過回不去 |
| `sys_shoe_faction_evolv` | #Evolv教 | 美國設計懂我的腳 |
| `sys_shoe_faction_unparallel` | #UnParallel新勢力 | 小眾但好穿 |
| `sys_shoe_faction_many` | #鞋子越多越好 | 不同路線不同鞋 |
| `sys_shoe_faction_one` | #一雙穿到爛 | 感情比性能重要 |
| `sys_shoe_faction_rental` | #租借鞋也能爬 | 鞋子不是重點 |

### 5.4 時間型態（維度 ID: `sys_time_type`）

| 完整 ID | 顯示名稱 | 說明 |
|---------|---------|------|
| `sys_time_type_morning` | #晨型攀岩人 | 早上岩館人少爽爽爬 |
| `sys_time_type_night` | #夜貓攀岩人 | 下班後的岩館時光 |
| `sys_time_type_weekend` | #週末戰士 | 平日上班週末爆發 |
| `sys_time_type_lunch` | #午休攻擊手 | 中午偷爬一下 |
| `sys_time_type_whenever` | #有空就爬 | 不固定但把握機會 |
| `sys_time_type_fulltime` | #全職岩棍 | 每天都是攀岩日 |

### 5.5 生活方式（維度 ID: `sys_lifestyle`）

| 完整 ID | 顯示名稱 | 說明 |
|---------|---------|------|
| `sys_lifestyle_dirtbag` | #Dirtbag精神 | 為了爬可以睡車上 |
| `sys_lifestyle_workbag` | #Workbag | 有工作但心在岩壁上 |
| `sys_lifestyle_weekend` | #週末出逃 | 平日社畜週末野人 |
| `sys_lifestyle_gym` | #岩館居民 | 室內就很滿足了 |
| `sys_lifestyle_travel` | #旅行攀岩派 | 去哪都要找岩場 |
| `sys_lifestyle_local` | #就近解決 | 家裡附近的岩館最好 |

### 5.6 爬牆 BGM（維度 ID: `sys_climbing_music`）

| 完整 ID | 顯示名稱 | 說明 |
|---------|---------|------|
| `sys_climbing_music_none` | #不聽音樂派 | 要專心感受動作 |
| `sys_climbing_music_electronic` | #電子Techno | 節奏帶動身體 |
| `sys_climbing_music_hiphop` | #嘻哈饒舌 | Wu-Tang 給我力量 |
| `sys_climbing_music_rock` | #搖滾金屬 | 爆發力來源 |
| `sys_climbing_music_lofi` | #Lofi放鬆 | chill 才爬得好 |
| `sys_climbing_music_podcast` | #Podcast派 | 邊聽邊爬 |
| `sys_climbing_music_gym` | #聽岩館放的 | 沒特別想法 |

### 5.7 面對失敗（維度 ID: `sys_failure_response`）

| 完整 ID | 顯示名稱 | 說明 |
|---------|---------|------|
| `sys_failure_response_retry` | #再試一次 | 今天一定要送 |
| `sys_failure_response_rest` | #先休息明天再來 | 不硬拼 |
| `sys_failure_response_switch` | #換條線 | 這條不適合我 |
| `sys_failure_response_watch` | #看別人怎麼爬 | 偷學 beta |
| `sys_failure_response_video` | #錄影分析 | 科學派 |
| `sys_failure_response_ask` | #問人請教 | 請教厲害的人 |

### 5.8 社交類型（維度 ID: `sys_social_type`）

| 完整 ID | 顯示名稱 | 說明 |
|---------|---------|------|
| `sys_social_type_solo` | #獨攀俠 | 一個人也能爬 |
| `sys_social_type_partner` | #固定繩伴 | 有穩定的搭檔 |
| `sys_social_type_organizer` | #揪團仔 | 人多熱鬧 |
| `sys_social_type_shy` | #社恐但想交朋友 | 默默觀察中 |
| `sys_social_type_talkative` | #話很多 | 邊爬邊聊 |
| `sys_social_type_quiet` | #安靜專注派 | 不太講話 |

### 5.9 上粉習慣（維度 ID: `sys_chalk_habit`）

| 完整 ID | 顯示名稱 | 說明 |
|---------|---------|------|
| `sys_chalk_habit_heavy` | #瘋狂上粉 | 沒在省的 |
| `sys_chalk_habit_moderate` | #適量就好 | 環保一點 |
| `sys_chalk_habit_liquid` | #液態粉派 | 比較不會飛 |
| `sys_chalk_habit_minimal` | #幾乎不上粉 | 手不太流汗 |
| `sys_chalk_habit_stalling` | #上粉等於拖延 | 其實在逃避 crux |

### 5.10 訓練取向（維度 ID: `sys_training_approach`）

| 完整 ID | 顯示名稱 | 說明 |
|---------|---------|------|
| `sys_training_approach_climb` | #爬就對了 | 爬多就會進步 |
| `sys_training_approach_hangboard` | #指力板信徒 | Hangboard 是日常 |
| `sys_training_approach_campus` | #CampusBoard派 | 爆發力至上 |
| `sys_training_approach_core` | #核心訓練狂 | 身體張力很重要 |
| `sys_training_approach_zen` | #佛系進步 | 有爬就好不強求 |
| `sys_training_approach_planned` | #有計畫訓練 | 週期化、記錄、分析 |
| `sys_training_approach_youtube` | #YouTube研究員 | 看影片比爬多 |

### 5.11 在地認同（維度 ID: `sys_local_identity`）

| 完整 ID | 顯示名稱 | 說明 |
|---------|---------|------|
| `sys_local_identity_longdong` | #龍洞信徒 | 週末必去朝聖 |
| `sys_local_identity_beitou` | #北投大砲派 | 戶外啟蒙聖地 |
| `sys_local_identity_indoor` | #只爬室內派 | 有冷氣有軟墊 |
| `sys_local_identity_anywhere` | #哪裡都爬 | 不挑場地 |
| `sys_local_identity_gym` | #岩館社畜 | 動態標籤，見下方說明 |

### 5.12 動態標籤說明

部分標籤的內容會根據用戶的其他欄位動態生成：

| 動態標籤 | 資料來源 | 顯示範例 |
|---------|---------|---------|
| `sys_local_identity_gym` | `biographies.home_gym` | #原岩攀岩館社畜 |
| `sys_local_identity_custom` | 用戶自訂地點 | #[自訂地點]信徒 |

**資料結構擴展：**

```typescript
interface TagOption extends ExtensibleItem {
  // ... 基本欄位

  // 動態標籤專用
  is_dynamic?: boolean           // 是否為動態標籤
  template?: string              // 顯示模板，如 "#{value}社畜"
  source_field?: string          // 資料來源欄位，如 "home_gym"
}

// 動態標籤範例
const gymWorkerTag: TagOption = {
  id: 'sys_local_identity_gym',
  source: 'system',
  dimension_id: 'sys_local_identity',
  label: '#岩館社畜',
  description: '常駐特定岩館',
  is_dynamic: true,
  template: '#{value}社畜',
  source_field: 'home_gym',
  order: 5,
}

// 渲染邏輯
function renderDynamicTag(tag: TagOption, biography: BiographyV2): string {
  if (!tag.is_dynamic || !tag.template || !tag.source_field) {
    return tag.label
  }
  const value = biography[tag.source_field as keyof BiographyV2]
  if (!value) return tag.label
  return tag.template.replace('{value}', String(value))
}

// 結果：如果 home_gym = "原岩攀岩館"，顯示 "#原岩攀岩館社畜"
```

---

## 6. 實作檔案清單

### 6.1 類型定義

```
src/lib/types/biography-v2.ts          # 新版類型定義（開放式結構）
src/lib/types/content-source.ts        # 內容來源類型定義
src/lib/constants/biography-tags.ts    # 系統預設標籤
src/lib/constants/biography-questions.ts  # 系統預設問題
```

### 6.2 組件

```
src/components/biography/
├── tags/
│   ├── TagSelector.tsx               # 標籤選擇器（支援自訂）
│   ├── TagGroup.tsx                  # 標籤群組
│   ├── TagChip.tsx                   # 單一標籤（區分系統/用戶）
│   ├── TagDisplay.tsx                # 標籤展示
│   ├── AddCustomTagModal.tsx         # 新增自訂標籤 Modal
│   └── AddTagDimensionModal.tsx      # 新增標籤類別 Modal
├── one-liners/
│   ├── OneLinerEditor.tsx            # 一句話編輯器（支援自訂問題）
│   ├── OneLinerInput.tsx             # 帶格式引導的輸入框
│   ├── OneLinerDisplay.tsx           # 一句話展示
│   └── AddOneLinerModal.tsx          # 新增自訂問題 Modal
├── stories/
│   ├── StoryEditor.tsx               # 深度故事編輯器（支援自訂）
│   ├── StoryCard.tsx                 # 故事卡片
│   ├── StoryList.tsx                 # 故事列表
│   ├── AddStoryQuestionModal.tsx     # 新增自訂問題 Modal
│   └── AddStoryCategoryModal.tsx     # 新增自訂分類 Modal
└── profile/
    ├── BiographyEditorV2.tsx         # 新版編輯器主組件
    ├── BiographyDisplayV2.tsx        # 新版展示主組件
    └── VisibilitySelector.tsx        # 隱私設定選擇器
```

### 6.3 Hooks

```
src/lib/hooks/
├── useTagDimensions.ts               # 取得標籤維度（系統+用戶自訂）
├── useOneLinerQuestions.ts           # 取得一句話問題（系統+用戶自訂）
├── useStoryQuestions.ts              # 取得故事問題（系統+用戶自訂）
├── useCustomContent.ts               # 管理用戶自訂內容
└── useBiographyV2.ts                 # 人物誌資料管理
```

### 6.4 API

```
src/lib/api/biography-v2.ts           # 新版 API 服務
src/lib/api/custom-content.ts         # 用戶自訂內容 API

backend/src/routes/biographies-v2.ts  # 新版後端路由
backend/src/routes/content-definitions.ts  # 內容定義 API（取得系統預設）
backend/src/routes/custom-content.ts  # 用戶自訂內容 API
```

### 6.5 資料庫遷移

```
backend/migrations/
├── 0010_add_biography_v2_columns.sql    # Biography 表新增欄位
├── 0011_create_content_tables.sql       # 內容定義表
└── 0012_create_custom_content_tables.sql  # 用戶自訂內容表
```

---

## 7. API 設計

### 7.1 取得內容定義

```typescript
// GET /api/v1/content-definitions
// 取得所有系統預設的維度、問題等

interface ContentDefinitionsResponse {
  tag_dimensions: TagDimension[]
  oneliner_questions: OneLinerQuestion[]
  story_categories: StoryCategory[]
  story_questions: StoryQuestion[]
}
```

### 7.2 用戶自訂內容 API

```typescript
// POST /api/v1/custom-content/tags
// 新增自訂標籤
interface CreateCustomTagRequest {
  dimension_id: string | null  // null 表示新維度
  dimension_name?: string      // 新維度名稱
  dimension_emoji?: string
  label: string
  description?: string
  is_public: boolean
}

// POST /api/v1/custom-content/questions
// 新增自訂問題
interface CreateCustomQuestionRequest {
  type: 'oneliner' | 'story'
  category_id?: string         // 故事問題需要
  question: string
  format_hint?: string
  placeholder?: string
  is_public: boolean
}

// GET /api/v1/custom-content/popular
// 取得熱門的用戶自訂內容（供其他用戶選用）
interface PopularCustomContentResponse {
  tags: UserCustomTag[]
  questions: UserCustomQuestion[]
}
```

---

## 8. 變更紀錄

| 日期 | 版本 | 變更內容 | 作者 |
|-----|-----|---------|------|
| 2026-01-18 | v1.0 | 初版建立 | Claude |
| 2026-01-18 | v2.0 | 開放式設計：支援用戶自訂維度、標籤、問題、分類 | Claude |
| 2026-01-18 | v2.1 | 審查修正：(1) 修正 getRandomQuestion 使用新資料結構 (2) 補充用戶自訂內容儲存策略 (3) 統一標籤 ID 格式對照表 (4) 新增動態標籤資料結構設計 | Claude |
