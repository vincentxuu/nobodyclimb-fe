# 人物誌內容重新規劃

> 文件版本：v1.0
> 建立日期：2026-01-18
> 關聯文件：`persona-creation-ux-improvement.md`

---

## 1. 設計目標

將原本「34 個開放性文字題目」重新設計為**三層漸進式結構**，讓用戶在 30 秒內就能完成基本人物誌，同時保留深度分享的可能性。

```
┌─────────────────────────────────────────────────────────────┐
│  第一層：標籤系統（11 維度）           ⏱️ 30 秒    完成率 80%+ │
├─────────────────────────────────────────────────────────────┤
│  第二層：一句話系列（8 題）            ⏱️ 2-3 分鐘  完成率 50%+ │
├─────────────────────────────────────────────────────────────┤
│  第三層：深度故事（10 題精選）         ⏱️ 依個人    完成率 15%+ │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 資料結構設計

### 2.1 新版 Biography Interface

```typescript
/**
 * 人物誌介面 v2
 * 三層漸進式設計
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
  // 第一層：標籤系統（JSON 儲存）
  // ═══════════════════════════════════════════
  tags: BiographyTags | null

  // ═══════════════════════════════════════════
  // 第二層：一句話系列
  // ═══════════════════════════════════════════
  one_liners: BiographyOneLiners | null

  // ═══════════════════════════════════════════
  // 第三層：深度故事
  // ═══════════════════════════════════════════
  stories: BiographyStories | null

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

### 2.2 標籤系統結構

```typescript
/**
 * 第一層：標籤系統
 * 11 個認同維度
 */
export interface BiographyTags {
  // 1. 風格邪教（可複選）
  style_cults: StyleCult[]

  // 2. 傷痛勳章（可複選）
  injury_badges: InjuryBadge[]

  // 3. 鞋子門派（單選）
  shoe_faction: ShoeFaction | null

  // 4. 時間型態（單選）
  time_type: TimeType | null

  // 5. 生活方式（單選）
  lifestyle: Lifestyle | null

  // 6. 爬牆 BGM（單選）
  climbing_music: ClimbingMusic | null

  // 7. 面對失敗（單選）
  failure_response: FailureResponse | null

  // 8. 社交類型（單選）
  social_type: SocialType | null

  // 9. 上粉習慣（單選）
  chalk_habit: ChalkHabit | null

  // 10. 訓練取向（可複選）
  training_approach: TrainingApproach[]

  // 11. 在地認同（可複選）
  local_identity: LocalIdentity[]

  // 自訂標籤
  custom_tags: string[]
}

// ═══════════════════════════════════════════
// 標籤選項定義
// ═══════════════════════════════════════════

type StyleCult =
  | 'crack_cult'      // #裂隙邪教
  | 'slab_cult'       // #Slab邪教
  | 'overhang_cult'   // #外傾邪教
  | 'dyno_cult'       // #Dyno邪教
  | 'crimp_cult'      // #Crimp邪教
  | 'jug_cult'        // #大把手邪教
  | 'all_styles'      // #什麼都爬教

type InjuryBadge =
  | 'a2_survivor'     // #A2滑輪倖存者
  | 'elbow_sufferer'  // #手肘苦主
  | 'shoulder_issues' // #肩膀卡卡
  | 'skin_badge'      // #手皮勳章
  | 'back_protest'    // #腰在抗議
  | 'injury_free'     // #目前無傷
  | 'always_rehabbing'// #永遠在復健

type ShoeFaction =
  | 'la_sportiva'     // #LaSportiva黨
  | 'scarpa'          // #Scarpa派
  | 'evolv'           // #Evolv教
  | 'unparallel'      // #UnParallel新勢力
  | 'many_shoes'      // #鞋子越多越好
  | 'one_pair'        // #一雙穿到爛
  | 'rental_fine'     // #租借鞋也能爬

type TimeType =
  | 'morning_climber' // #晨型攀岩人
  | 'night_climber'   // #夜貓攀岩人
  | 'weekend_warrior' // #週末戰士
  | 'lunch_attacker'  // #午休攻擊手
  | 'whenever'        // #有空就爬
  | 'fulltime'        // #全職岩棍

type Lifestyle =
  | 'dirtbag'         // #Dirtbag精神
  | 'workbag'         // #Workbag
  | 'weekend_escape'  // #週末出逃
  | 'gym_resident'    // #岩館居民
  | 'travel_climber'  // #旅行攀岩派
  | 'local_gym'       // #就近解決

type ClimbingMusic =
  | 'no_music'        // #不聽音樂派
  | 'electronic'      // #電子Techno
  | 'hiphop'          // #嘻哈饒舌
  | 'rock_metal'      // #搖滾金屬
  | 'lofi'            // #Lofi放鬆
  | 'podcast'         // #Podcast派
  | 'gym_music'       // #聽岩館放的

type FailureResponse =
  | 'try_again'       // #再試一次
  | 'rest_tomorrow'   // #先休息明天再來
  | 'switch_route'    // #換條線
  | 'watch_others'    // #看別人怎麼爬
  | 'video_analysis'  // #錄影分析
  | 'ask_others'      // #問人請教

type SocialType =
  | 'solo_climber'    // #獨攀俠
  | 'fixed_partner'   // #固定繩伴
  | 'group_organizer' // #揪團仔
  | 'shy_social'      // #社恐但想交朋友
  | 'talkative'       // #話很多
  | 'quiet_focused'   // #安靜專注派

type ChalkHabit =
  | 'heavy_chalker'   // #瘋狂上粉
  | 'moderate'        // #適量就好
  | 'liquid_chalk'    // #液態粉派
  | 'minimal_chalk'   // #幾乎不上粉
  | 'chalk_stalling'  // #上粉等於拖延

type TrainingApproach =
  | 'just_climb'      // #爬就對了
  | 'hangboard'       // #指力板信徒
  | 'campus_board'    // #CampusBoard派
  | 'core_training'   // #核心訓練狂
  | 'zen_progress'    // #佛系進步
  | 'planned_training'// #有計畫訓練
  | 'youtube_student' // #YouTube研究員

type LocalIdentity =
  | 'longdong_believer'  // #龍洞信徒
  | 'beitou_cannon'      // #北投大砲派
  | 'indoor_only'        // #只爬室內派
  | 'climb_anywhere'     // #哪裡都爬
  | string               // 自訂岩館名稱
```

### 2.3 一句話系列結構

```typescript
/**
 * 第二層：一句話系列
 * 8 個簡短問題
 */
export interface BiographyOneLiners {
  // 為什麼開始爬？
  // 格式引導：「因為＿＿＿」
  why_started: string | null

  // 最常去哪裡爬？
  // 格式引導：「＿＿＿，因為＿＿＿」
  favorite_place: string | null

  // 爬岩最爽的時刻？
  // 格式引導：「當＿＿＿的時候」
  best_moment: string | null

  // 給新手一句話？
  advice_for_beginners: string | null

  // 最近的小目標？
  // 格式引導：「想要＿＿＿」
  current_goal: string | null

  // 攀岩讓你學到？
  climbing_lesson: string | null

  // 一句話形容你的攀岩風格？
  climbing_style_desc: string | null

  // 攀岩之外你是？
  life_outside: string | null
}
```

### 2.4 深度故事結構

**設計理念：保留豐富的故事選項，改變呈現方式**

```
之前的問題：31 題全部攤開 → 用戶感到壓力
新的做法：31 題按分類收合 + 隨機推薦 → 想寫多少寫多少
```

```typescript
/**
 * 第三層：深度故事
 * 完整 31 題，按 6 大分類組織
 * 用戶可自由選擇想回答的問題
 */
export interface BiographyStories {
  // ═══════════════════════════════════════════
  // A. 成長與突破（6題）
  // ═══════════════════════════════════════════
  memorable_moment: string | null      // 最難忘的攀登經歷
  biggest_challenge: string | null     // 遇到的最大挑戰
  breakthrough_story: string | null    // 最大的突破經歷
  first_outdoor: string | null         // 第一次戶外攀岩
  first_grade: string | null           // 第一次完攀某個難度
  frustrating_climb: string | null     // 最挫折的攀登經歷

  // ═══════════════════════════════════════════
  // B. 心理與哲學（6題）
  // ═══════════════════════════════════════════
  fear_management: string | null       // 如何克服恐懼
  climbing_lesson: string | null       // 攀岩教會的事
  failure_perspective: string | null   // 如何看待失敗
  flow_moment: string | null           // 心流時刻
  life_balance: string | null          // 攀岩與生活平衡
  unexpected_gain: string | null       // 意外的收穫

  // ═══════════════════════════════════════════
  // C. 社群與連結（6題）
  // ═══════════════════════════════════════════
  climbing_mentor: string | null       // 攀岩路上的貴人
  climbing_partner: string | null      // 攀岩夥伴的故事
  funny_moment: string | null          // 搞笑或尷尬的經歷
  favorite_spot: string | null         // 推薦的攀岩地點
  advice_to_group: string | null       // 想對某個族群說的話
  climbing_space: string | null        // 難忘的岩館或空間

  // ═══════════════════════════════════════════
  // D. 實用分享（6題）
  // ═══════════════════════════════════════════
  injury_recovery: string | null       // 受傷與復原經歷
  memorable_route: string | null       // 最想分享的路線
  training_method: string | null       // 訓練方式與心得
  effective_practice: string | null    // 最有效的練習方法
  technique_tip: string | null         // 有幫助的技巧
  gear_choice: string | null           // 裝備選擇心得

  // ═══════════════════════════════════════════
  // E. 夢想與探索（6題）
  // ═══════════════════════════════════════════
  dream_climb: string | null           // 夢想中的攀登
  climbing_trip: string | null         // 特別的攀岩旅行
  bucket_list_story: string | null     // 完成人生清單的故事
  climbing_goal: string | null         // 目前的攀岩目標
  climbing_style: string | null        // 最吸引你的風格
  climbing_inspiration: string | null  // 啟發你的人或影片

  // ═══════════════════════════════════════════
  // F. 生活整合（1題）
  // ═══════════════════════════════════════════
  life_outside_climbing: string | null // 攀岩之外的興趣
}

/**
 * 故事分類定義
 */
export type StoryCategory =
  | 'growth'      // A. 成長與突破
  | 'psychology'  // B. 心理與哲學
  | 'community'   // C. 社群與連結
  | 'practical'   // D. 實用分享
  | 'dreams'      // E. 夢想與探索
  | 'life'        // F. 生活整合

/**
 * 故事問題定義
 */
export interface StoryQuestion {
  field: keyof BiographyStories
  category: StoryCategory
  title: string           // 問題標題（去成就化版本）
  subtitle: string        // 引導說明
  placeholder: string     // 簡短範例
  difficulty: 'easy' | 'medium' | 'deep'  // 回答難度
}
```

#### 故事問題完整清單（31 題）

##### A. 成長與突破（6題）

| 欄位 | 問題（去成就化） | 難度 |
|-----|----------------|------|
| `memorable_moment` | 有沒有某次攀爬讓你一直記到現在？ | easy |
| `biggest_challenge` | 有遇過什麼卡關的時候嗎？ | medium |
| `breakthrough_story` | 最近有沒有覺得自己進步的時刻？ | easy |
| `first_outdoor` | 還記得第一次戶外攀岩嗎？ | easy |
| `first_grade` | 有沒有哪條路線讓你特別有成就感？ | easy |
| `frustrating_climb` | 有沒有讓你很挫折的經驗？後來怎麼面對？ | medium |

##### B. 心理與哲學（6題）

| 欄位 | 問題（去成就化） | 難度 |
|-----|----------------|------|
| `fear_management` | 會怕高或怕墜落嗎？怎麼面對的？ | medium |
| `climbing_lesson` | 攀岩有沒有讓你學到什麼？ | medium |
| `failure_perspective` | 爬不上去的時候會怎麼想？ | easy |
| `flow_moment` | 有沒有爬到忘記時間的經驗？ | easy |
| `life_balance` | 怎麼安排攀岩和其他生活？ | medium |
| `unexpected_gain` | 攀岩有帶給你什麼意外的收穫嗎？ | deep |

##### C. 社群與連結（6題）

| 欄位 | 問題（去成就化） | 難度 |
|-----|----------------|------|
| `climbing_mentor` | 有沒有想感謝的人？ | easy |
| `climbing_partner` | 有沒有固定的攀岩夥伴？有什麼故事？ | easy |
| `funny_moment` | 有沒有什麼搞笑或尷尬的經歷？ | easy |
| `favorite_spot` | 最常去或最推薦哪裡爬？為什麼？ | easy |
| `advice_to_group` | 想對新手（或某個族群）說什麼？ | medium |
| `climbing_space` | 有沒有對你特別有意義的岩館或地點？ | medium |

##### D. 實用分享（6題）

| 欄位 | 問題（去成就化） | 難度 |
|-----|----------------|------|
| `injury_recovery` | 有受過傷嗎？怎麼復原的？ | medium |
| `memorable_route` | 有沒有想分享的路線或經驗？ | easy |
| `training_method` | 你平常怎麼練習？有什麼小習慣？ | easy |
| `effective_practice` | 有沒有對你特別有效的練習方法？ | medium |
| `technique_tip` | 有沒有學到什麼實用的技巧？ | easy |
| `gear_choice` | 關於裝備有沒有什麼心得？ | easy |

##### E. 夢想與探索（6題）

| 欄位 | 問題（去成就化） | 難度 |
|-----|----------------|------|
| `dream_climb` | 如果能去任何地方爬，你想去哪？ | easy |
| `climbing_trip` | 有沒有印象深刻的攀岩旅行？ | easy |
| `bucket_list_story` | 有沒有完成過什麼攀岩目標？感覺如何？ | medium |
| `climbing_goal` | 最近有什麼想達成的小目標？ | easy |
| `climbing_style` | 最喜歡什麼樣的路線或風格？ | easy |
| `climbing_inspiration` | 有沒有啟發你的人、影片或故事？ | easy |

##### F. 生活整合（1題）

| 欄位 | 問題（去成就化） | 難度 |
|-----|----------------|------|
| `life_outside_climbing` | 攀岩之外，還有什麼讓你著迷？ | easy |

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
function getRandomQuestion(stories: BiographyStories): StoryQuestion {
  // 優先推薦：
  // 1. 尚未填寫的
  // 2. 難度為 'easy' 的
  // 3. 如果都填了，隨機選一個讓用戶更新

  const unfilledEasy = questions.filter(
    q => !stories[q.field] && q.difficulty === 'easy'
  )

  if (unfilledEasy.length > 0) {
    return randomPick(unfilledEasy)
  }

  const unfilled = questions.filter(q => !stories[q.field])
  if (unfilled.length > 0) {
    return randomPick(unfilled)
  }

  return randomPick(questions)
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

### 3.1 新增欄位

```sql
-- 標籤系統（JSON）
ALTER TABLE biographies ADD COLUMN tags TEXT DEFAULT NULL;

-- 一句話系列（JSON）
ALTER TABLE biographies ADD COLUMN one_liners TEXT DEFAULT NULL;

-- 深度故事（JSON）
ALTER TABLE biographies ADD COLUMN stories TEXT DEFAULT NULL;

-- 隱私設定
ALTER TABLE biographies ADD COLUMN visibility TEXT DEFAULT 'private'
  CHECK (visibility IN ('public', 'community', 'private', 'anonymous'));

-- 主場岩館
ALTER TABLE biographies ADD COLUMN home_gym TEXT DEFAULT NULL;
```

### 3.2 資料遷移策略

舊欄位資料遷移到新結構：

```typescript
// 遷移腳本範例
function migrateToV2(oldBio: Biography): BiographyV2 {
  return {
    ...oldBio,

    // 遷移一句話系列
    one_liners: {
      why_started: oldBio.climbing_origin,
      advice_for_beginners: oldBio.advice_to_self,
      climbing_lesson: oldBio.climbing_lesson,
      // ... 其他欄位
    },

    // 遷移深度故事
    stories: {
      memorable_climb: oldBio.memorable_moment,
      overcoming_challenge: oldBio.biggest_challenge,
      funny_story: oldBio.funny_moment,
      dream_destination: oldBio.dream_climb,
      // ... 其他欄位
    },

    // 標籤需要用戶重新選擇
    tags: null,

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
│  ┌─ 風格邪教 ──────────────────────────────────────────┐   │
│  │ [#Slab邪教] [#外傾邪教] [#Dyno邪教] ...            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ 傷痛勳章 ──────────────────────────────────────────┐   │
│  │ [#A2滑輪倖存者] [#手皮勳章] [#目前無傷] ...        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ 鞋子門派 ──────────────────────────────────────────┐   │
│  │ ○ #LaSportiva黨  ○ #Scarpa派  ○ #一雙穿到爛 ...   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [展開更多標籤 ▾]                                           │
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
│  [展開更多問題 ▾]                                           │
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
│  [展開所有深度問題 ▾]                                       │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  [儲存]                                    [預覽我的頁面]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 展示頁面結構

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

### 4.3 標籤選擇器組件

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

### 4.4 一句話輸入組件

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

### 5.1 風格邪教

| 值 | 顯示名稱 | 說明 |
|---|---------|------|
| `crack_cult` | #裂隙邪教 | 塞裂隙的快感無可取代 |
| `slab_cult` | #Slab邪教 | 平衡就是藝術 |
| `overhang_cult` | #外傾邪教 | 沒有倒掛不想爬 |
| `dyno_cult` | #Dyno邪教 | 能飛就不要慢慢來 |
| `crimp_cult` | #Crimp邪教 | 小點越小越愛 |
| `jug_cult` | #大把手邪教 | jug 是我的信仰 |
| `all_styles` | #什麼都爬教 | 我不挑 |

### 5.2 傷痛勳章

| 值 | 顯示名稱 | 說明 |
|---|---------|------|
| `a2_survivor` | #A2滑輪倖存者 | 聽過那聲「啪」的都懂 |
| `elbow_sufferer` | #手肘苦主 | 網球肘/高爾夫球肘認證 |
| `shoulder_issues` | #肩膀卡卡 | 做 mantle 要小心 |
| `skin_badge` | #手皮勳章 | 撕過的皮都是榮耀 |
| `back_protest` | #腰在抗議 | 外傾爬多了 |
| `injury_free` | #目前無傷 | 珍惜這個狀態 |
| `always_rehabbing` | #永遠在復健 | 休息也是訓練 |

### 5.3 鞋子門派

| 值 | 顯示名稱 | 說明 |
|---|---------|------|
| `la_sportiva` | #LaSportiva黨 | Solution 是信仰 |
| `scarpa` | #Scarpa派 | Instinct 用過回不去 |
| `evolv` | #Evolv教 | 美國設計懂我的腳 |
| `unparallel` | #UnParallel新勢力 | 小眾但好穿 |
| `many_shoes` | #鞋子越多越好 | 不同路線不同鞋 |
| `one_pair` | #一雙穿到爛 | 感情比性能重要 |
| `rental_fine` | #租借鞋也能爬 | 鞋子不是重點 |

### 5.4 時間型態

| 值 | 顯示名稱 | 說明 |
|---|---------|------|
| `morning_climber` | #晨型攀岩人 | 早上岩館人少爽爽爬 |
| `night_climber` | #夜貓攀岩人 | 下班後的岩館時光 |
| `weekend_warrior` | #週末戰士 | 平日上班週末爆發 |
| `lunch_attacker` | #午休攻擊手 | 中午偷爬一下 |
| `whenever` | #有空就爬 | 不固定但把握機會 |
| `fulltime` | #全職岩棍 | 每天都是攀岩日 |

### 5.5 生活方式

| 值 | 顯示名稱 | 說明 |
|---|---------|------|
| `dirtbag` | #Dirtbag精神 | 為了爬可以睡車上 |
| `workbag` | #Workbag | 有工作但心在岩壁上 |
| `weekend_escape` | #週末出逃 | 平日社畜週末野人 |
| `gym_resident` | #岩館居民 | 室內就很滿足了 |
| `travel_climber` | #旅行攀岩派 | 去哪都要找岩場 |
| `local_gym` | #就近解決 | 家裡附近的岩館最好 |

### 5.6 爬牆 BGM

| 值 | 顯示名稱 | 說明 |
|---|---------|------|
| `no_music` | #不聽音樂派 | 要專心感受動作 |
| `electronic` | #電子Techno | 節奏帶動身體 |
| `hiphop` | #嘻哈饒舌 | Wu-Tang 給我力量 |
| `rock_metal` | #搖滾金屬 | 爆發力來源 |
| `lofi` | #Lofi放鬆 | chill 才爬得好 |
| `podcast` | #Podcast派 | 邊聽邊爬 |
| `gym_music` | #聽岩館放的 | 沒特別想法 |

### 5.7 面對失敗

| 值 | 顯示名稱 | 說明 |
|---|---------|------|
| `try_again` | #再試一次 | 今天一定要送 |
| `rest_tomorrow` | #先休息明天再來 | 不硬拼 |
| `switch_route` | #換條線 | 這條不適合我 |
| `watch_others` | #看別人怎麼爬 | 偷學 beta |
| `video_analysis` | #錄影分析 | 科學派 |
| `ask_others` | #問人請教 | 請教厲害的人 |

### 5.8 社交類型

| 值 | 顯示名稱 | 說明 |
|---|---------|------|
| `solo_climber` | #獨攀俠 | 一個人也能爬 |
| `fixed_partner` | #固定繩伴 | 有穩定的搭檔 |
| `group_organizer` | #揪團仔 | 人多熱鬧 |
| `shy_social` | #社恐但想交朋友 | 默默觀察中 |
| `talkative` | #話很多 | 邊爬邊聊 |
| `quiet_focused` | #安靜專注派 | 不太講話 |

### 5.9 上粉習慣

| 值 | 顯示名稱 | 說明 |
|---|---------|------|
| `heavy_chalker` | #瘋狂上粉 | 沒在省的 |
| `moderate` | #適量就好 | 環保一點 |
| `liquid_chalk` | #液態粉派 | 比較不會飛 |
| `minimal_chalk` | #幾乎不上粉 | 手不太流汗 |
| `chalk_stalling` | #上粉等於拖延 | 其實在逃避 crux |

### 5.10 訓練取向

| 值 | 顯示名稱 | 說明 |
|---|---------|------|
| `just_climb` | #爬就對了 | 爬多就會進步 |
| `hangboard` | #指力板信徒 | Hangboard 是日常 |
| `campus_board` | #CampusBoard派 | 爆發力至上 |
| `core_training` | #核心訓練狂 | 身體張力很重要 |
| `zen_progress` | #佛系進步 | 有爬就好不強求 |
| `planned_training` | #有計畫訓練 | 週期化、記錄、分析 |
| `youtube_student` | #YouTube研究員 | 看影片比爬多 |

### 5.11 在地認同

| 值 | 顯示名稱 | 說明 |
|---|---------|------|
| `longdong_believer` | #龍洞信徒 | 週末必去朝聖 |
| `beitou_cannon` | #北投大砲派 | 戶外啟蒙聖地 |
| `indoor_only` | #只爬室內派 | 有冷氣有軟墊 |
| `climb_anywhere` | #哪裡都爬 | 不挑場地 |

---

## 6. 實作檔案清單

### 6.1 類型定義

```
src/lib/types/biography-v2.ts          # 新版類型定義
src/lib/constants/biography-tags.ts    # 標籤選項與顯示名稱
```

### 6.2 組件

```
src/components/biography/
├── tags/
│   ├── TagSelector.tsx               # 標籤選擇器
│   ├── TagGroup.tsx                  # 標籤群組
│   ├── TagChip.tsx                   # 單一標籤
│   └── TagDisplay.tsx                # 標籤展示
├── one-liners/
│   ├── OneLinerEditor.tsx            # 一句話編輯器
│   ├── OneLinerInput.tsx             # 帶格式引導的輸入框
│   └── OneLinerDisplay.tsx           # 一句話展示
├── stories/
│   ├── StoryEditor.tsx               # 深度故事編輯器
│   ├── StoryCard.tsx                 # 故事卡片
│   └── StoryList.tsx                 # 故事列表
└── profile/
    ├── BiographyEditorV2.tsx         # 新版編輯器主組件
    ├── BiographyDisplayV2.tsx        # 新版展示主組件
    └── VisibilitySelector.tsx        # 隱私設定選擇器
```

### 6.3 API

```
src/lib/api/biography-v2.ts           # 新版 API 服務
backend/src/routes/biographies-v2.ts  # 新版後端路由
```

---

## 7. 變更紀錄

| 日期 | 版本 | 變更內容 | 作者 |
|-----|-----|---------|------|
| 2026-01-18 | v1.0 | 初版建立 | Claude |
