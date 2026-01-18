# 人物誌章節重新設計規劃

## 現況分析

### 目前章節結構（舊版）

| 章節 | 標題 | 資料欄位 | 說明 |
|------|------|----------|------|
| Chapter 1 | 你與攀岩的相遇 | `climbing_origin` | 相遇篇 |
| Chapter 2 | 攀岩對你來說是什麼 | `climbing_meaning` | 意義篇（引言式設計）|
| Chapter 3 | 攀岩人生清單 | `bucket_list_story` + bucket_list items | 人生清單 |
| Chapter 4 | 給剛開始攀岩的自己 | `advice_to_self` | 給新手的話（便條紙設計）|
| - | 攀岩足跡 | climbing_locations | 時間軸設計（非章節）|

### 新版 V2 內容結構

新版採用**三層漸進式設計**：

1. **第一層：標籤系統** - 快速標記身份特徵
2. **第二層：一句話系列** - 10 個簡短問答
3. **第三層：深度故事** - 6 大類別，共 31 個問題

#### 故事分類（6 大類）

| 分類 ID | 名稱 | Icon | 題數 | 說明 | 顯示位置 |
|---------|------|------|------|------|---------|
| `growth` | 成長與突破 | `Sprout` | 6 | 攀岩成長故事 | Chapter 1: 起點 |
| `psychology` | 心理與哲學 | `Brain` | 6 | 攀岩帶來的思考 | Chapter 2: 內心 |
| `community` | 社群與連結 | `Users` | 6 | 攀岩社群的故事 | Chapter 3: 連結 |
| `practical` | 實用分享 | `Wrench` | 6 | 經驗與技巧分享 | 附加區塊 |
| `dreams` | 夢想與探索 | `Target` | 6 | 攀岩的夢想與目標 | Chapter 4: 探索 |
| `life` | 生活整合 | `Palette` | 1 | 攀岩與生活的交集 | 一句話精選（合併顯示）|

### 舊欄位與新分類的對應

| 舊欄位 | 對應新分類 | 對應問題 | 說明 |
|--------|-----------|----------|------|
| `climbing_origin` | growth | 有沒有某次攀爬讓你一直記到現在？ | Chapter 1 主要內容 |
| `climbing_meaning` | one-liner | 攀岩對你來說是什麼？ | Chapter 2 引言 |
| `advice_to_self` | community | 想對剛開始攀岩的自己說什麼？ | Chapter 3 便條紙式主內容 |
| `bucket_list_story` | dreams | 有沒有完成過什麼攀岩目標？ | Chapter 4 主要內容 |

---

## 設計方案

### 方案 A：保留章節編號，擴展內容

維持 Chapter 1-4 的結構，但每個章節可以顯示該分類下的多個故事。

```
Chapter 1: 成長與突破 (growth)
  - 你與攀岩的相遇（原 climbing_origin）
  - 其他成長故事...

Chapter 2: 攀岩的意義 (psychology + one-liner)
  - 攀岩對你來說是什麼（引言）
  - 其他心理/哲學故事...

Chapter 3: 夢想清單 (dreams)
  - 人生清單
  - 夢想攀岩地點
  - 攀岩旅行故事...

Chapter 4: 給新手的話 (community)
  - 給剛開始攀岩的自己
  - 其他社群故事...

附錄：實用分享 (practical)
附錄：攀岩足跡
```

**優點**：延續現有設計語言，用戶熟悉
**缺點**：分類邏輯不夠清晰，章節與內容對應較牽強

---

### 方案 B：移除章節編號，改用分類標籤

不使用 Chapter 編號，改用分類名稱作為區塊標題。

```
<Sprout /> 成長與突破
  - 相遇故事
  - 突破時刻
  - ...

<Brain /> 心理與哲學
  - 攀岩的意義（引言）
  - 恐懼管理
  - ...

<Users /> 社群與連結
  - 給新手的話
  - 攀岩夥伴
  - ...

<Wrench /> 實用分享
  - 訓練方法
  - 裝備心得
  - ...

<Target /> 夢想與探索
  - 人生清單
  - 夢想地點
  - ...

<MapPin /> 攀岩足跡
  - 時間軸
```

**優點**：與新版內容結構完全對應，擴展性好
**缺點**：失去「故事感」的敘事結構

---

### 方案 C：混合式設計（推薦）

保留「章節」的敘事感，但章節標題改用更有意義的名稱，並與新分類對應。

```
┌─────────────────────────────────────────────────────┐
│  Hero Section（封面 + 基本資訊）                      │
├─────────────────────────────────────────────────────┤
│  快速了解（標籤 + 一句話精選）                        │
├─────────────────────────────────────────────────────┤
│  精選故事（Featured Stories）                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ═══ 我的攀岩故事 ═══                               │
│                                                     │
│  Chapter 1: 起點                                    │
│  └─ <Sprout /> 成長與突破 的故事                            │
│     • 你與攀岩的相遇                                │
│     • 印象深刻的攀爬                                │
│     • 突破時刻                                      │
│                                                     │
│  Chapter 2: 內心                                    │
│  └─ <Brain /> 心理與哲學 的故事                            │
│     • 攀岩對你來說是什麼（引言式）                   │
│     • 恐懼與克服                                    │
│     • 攀岩教會我的事                                │
│                                                     │
│  Chapter 3: 連結                                    │
│  └─ <Users /> 社群與連結 的故事                            │
│     • 給新手的話（便條紙式）                         │
│     • 攀岩夥伴                                      │
│     • 推薦的岩場                                    │
│                                                     │
│  Chapter 4: 探索                                    │
│  └─ <Target /> 夢想與探索 的故事                            │
│     • 攀岩人生清單                                  │
│     • 夢想攀岩地點                                  │
│     • 攀岩旅行                                      │
│                                                     │
├─────────────────────────────────────────────────────┤
│  <Wrench /> 實用分享（可選區塊）                             │
│  └─ 訓練方法、裝備心得、受傷復原                     │
├─────────────────────────────────────────────────────┤
│  <MapPin /> 攀岩足跡                                        │
│  └─ 時間軸地圖                                      │
├─────────────────────────────────────────────────────┤
│  推薦其他人物誌                                      │
└─────────────────────────────────────────────────────┘
```

#### 章節對應表

| 新章節 | 標題 | 對應分類 | 保留原設計 |
|--------|------|----------|-----------|
| Chapter 1 | 起點 | growth | 文字段落式 |
| Chapter 2 | 內心 | psychology | 引言式（保留）|
| Chapter 3 | 連結 | community | 便條紙式（保留）|
| Chapter 4 | 探索 | dreams | 人生清單（保留）|
| 附加區塊 | 實用分享 | practical | 卡片式 |
| 附加區塊 | 攀岩足跡 | - | 時間軸（保留）|

---

## 設計決策（已確認）

### 1. `life` 分類的處理
**決策：併入「一句話精選」區塊**

- `life` 分類只有 1 題：「攀岩之外，還有什麼讓你著迷？」
- 一句話系統已有類似題目 `sys_ol_life_outside`：「攀岩之外，你是誰？」
- 這類問題適合簡短回答，不需要獨立章節
- 在 OneLinersSection 中與其他一句話一起顯示

### 2. `advice_to_self` 的分類
**決策：放在 Chapter 3（連結/community）**

- 原本舊版 Chapter 4 就是「給剛開始攀岩的自己」
- 這是「分享智慧給他人」的性質，屬於社群連結
- 在 Chapter 3 以「便條紙」形式作為主要特色內容
- 與 `sys_story_community_advice` 共用顯示邏輯

### 3. 章節標題命名
**決策：維持抽象命名**

| Chapter | 標題 | 分類 |
|---------|------|------|
| Chapter 1 | 起點 | growth |
| Chapter 2 | 內心 | psychology |
| Chapter 3 | 連結 | community |
| Chapter 4 | 探索 | dreams |

**理由**：
- 有敘事流動感：起點 → 內心 → 連結 → 探索
- 不與子分類 icon 標籤重複（避免「成長與突破」+「成長故事」的冗餘）
- 維持「故事章節」的閱讀感

---

## 實作建議

### 1. 組件重構

```
src/components/biography/profile/
├── HeroSection.tsx          # 不變
├── QuickFactsSection.tsx    # 不變
├── FeaturedStoriesSection.tsx # 不變
│
├── chapters/
│   ├── ChapterBeginning.tsx   # Chapter 1: 起點 (growth)
│   ├── ChapterMind.tsx        # Chapter 2: 內心 (psychology)
│   ├── ChapterConnection.tsx  # Chapter 3: 連結 (community)
│   ├── ChapterExplore.tsx     # Chapter 4: 探索 (dreams)
│   └── index.ts
│
├── PracticalSection.tsx      # 實用分享區塊
├── ClimbingFootprintsSection.tsx # 不變
└── index.ts
```

### 2. 資料流

每個章節組件接收 `person: Biography` 並自行提取相關故事：

```typescript
// 範例：ChapterBeginning.tsx
function ChapterBeginning({ person }: { person: Biography }) {
  // 從 stories 中提取 growth 分類的故事
  const growthStories = person.stories?.filter(
    story => getStoryCategoryByQuestionId(story.question_id)?.id === 'sys_cat_growth'
  ) || []

  // 舊版欄位向後兼容
  const legacyOrigin = person.climbing_origin

  // 合併顯示
  // ...
}
```

### 3. 空白狀態處理

每個章節都應該有預設內容，即使沒有資料也要顯示：

```typescript
{hasContent ? (
  <ActualContent />
) : (
  <EmptyState
    icon={<Sprout />}
    title={`${person.name} 的成長故事正在醞釀中...`}
    subtitle="每個攀岩者都有屬於自己的起點"
  />
)}
```

---

## 詳細規格（方案 C）

### 頁面結構總覽

```
┌─────────────────────────────────────────────────────────────┐
│  1. Hero Section                                            │
│     • 封面橫幅 (4:1)                                         │
│     • 頭像疊在左下                                           │
│     • 姓名、標題、社群連結                                    │
│     • 統計數據（瀏覽、按讚、追蹤、留言）                        │
├─────────────────────────────────────────────────────────────┤
│  2. 快速了解 (QuickFactsSection)                             │
│     • 標籤雲（第一層）                                        │
│     • 基本資訊卡片                                           │
├─────────────────────────────────────────────────────────────┤
│  3. 一句話精選 (OneLinersSection) 【新增】                    │
│     • 從第二層一句話系列中選取 3-5 個顯示                      │
│     • 卡片式 / 語錄式呈現                                     │
├─────────────────────────────────────────────────────────────┤
│  4. 精選故事 (FeaturedStoriesSection)                        │
│     • 橫向滾動卡片                                           │
│     • 從所有故事中精選                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ═══════════════ 我的攀岩故事 ═══════════════               │
│                                                             │
│  5. Chapter 1: 起點 【growth 分類】                          │
│  6. Chapter 2: 內心 【psychology 分類】                      │
│  7. Chapter 3: 連結 【community 分類】                       │
│  8. Chapter 4: 探索 【dreams 分類】                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  9. 實用分享 (PracticalSection) 【practical 分類】           │
├─────────────────────────────────────────────────────────────┤
│  10. 攀岩足跡 (ClimbingFootprintsSection)                    │
├─────────────────────────────────────────────────────────────┤
│  11. 上下篇導航                                              │
├─────────────────────────────────────────────────────────────┤
│  12. 推薦其他人物誌                                          │
└─────────────────────────────────────────────────────────────┘
```

---

### Chapter 1: 起點 (growth)

#### 內容來源

| 優先級 | 來源 | 問題 ID / 欄位 |
|--------|------|---------------|
| 1 | V2 stories | `sys_story_growth_memorable_moment` |
| 2 | V2 stories | `sys_story_growth_breakthrough` |
| 3 | V2 stories | `sys_story_growth_first_outdoor` |
| 4 | V2 stories | `sys_story_growth_first_grade` |
| 5 | V2 stories | `sys_story_growth_biggest_challenge` |
| 6 | V2 stories | `sys_story_growth_frustrating` |
| 備用 | 舊欄位 | `climbing_origin` |
| 備用 | 舊欄位 | `memorable_moment` |
| 備用 | 舊欄位 | `breakthrough_story` |

#### UI 設計

```
┌─────────────────────────────────────────────────────┐
│  bg-white py-16                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ [bg-brand-accent] Chapter 1                 │   │
│  │ 起點                                         │   │
│  │ <Sprout /> 成長與突破的故事                          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ 故事卡片 1 ─────────────────────────────────┐  │
│  │ Q: 有沒有某次攀爬讓你一直記到現在？           │  │
│  │                                              │  │
│  │ "去年第一次去龍洞，站在真正的岩壁前..."      │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ 故事卡片 2 ─────────────────────────────────┐  │
│  │ Q: 最近有沒有覺得自己進步的時刻？             │  │
│  │                                              │  │
│  │ "上週終於送出卡了一個月的那條路線..."        │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 空白狀態

```
┌─────────────────────────────────────────────────────┐
│           [Sprout icon in gray circle]                  │
│                                                     │
│     {name} 的成長故事正在醞釀中...                  │
│     每個攀岩者都有屬於自己的起點                     │
└─────────────────────────────────────────────────────┘
```

---

### Chapter 2: 內心 (psychology)

#### 內容來源

| 優先級 | 來源 | 問題 ID / 欄位 |
|--------|------|---------------|
| 主引言 | V2 one-liner | `sys_ol_climbing_meaning` |
| 主引言 | 舊欄位 | `climbing_meaning` |
| 1 | V2 stories | `sys_story_psychology_fear` |
| 2 | V2 stories | `sys_story_psychology_lesson` |
| 3 | V2 stories | `sys_story_psychology_failure` |
| 4 | V2 stories | `sys_story_psychology_flow` |
| 5 | V2 stories | `sys_story_psychology_balance` |
| 6 | V2 stories | `sys_story_psychology_gain` |

#### UI 設計（保留引言式）

```
┌─────────────────────────────────────────────────────┐
│  bg-gradient-to-br from-brand-accent/10 to-brand-light │
│  py-20 text-center                                  │
│                                                     │
│  [bg-brand-accent] Chapter 2                        │
│  內心                                               │
│  <Brain /> 攀岩對你來說是什麼                              │
│                                                     │
│         ┌─────────────────────────────┐            │
│         │  "                          │            │
│         │  攀岩對我來說，是一種       │            │
│         │  與自己對話的方式...        │            │
│         │                          "  │            │
│         │                             │            │
│         │              — {name}       │            │
│         └─────────────────────────────┘            │
│                                                     │
│  ─────────────────────────────────────────────     │
│                                                     │
│  【其他心理故事以卡片形式展開】                      │
│                                                     │
│  ┌─ 恐懼與克服 ──┐  ┌─ 攀岩教會我 ──┐              │
│  │ ...          │  │ ...          │              │
│  └──────────────┘  └──────────────┘              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 空白狀態

```
┌─────────────────────────────────────────────────────┐
│           [Brain icon in gray circle]                  │
│                                                     │
│     {name} 正在思考攀岩的意義...                    │
│     每個人都有自己與岩壁對話的方式                   │
└─────────────────────────────────────────────────────┘
```

---

### Chapter 3: 連結 (community)

#### 內容來源

| 優先級 | 來源 | 問題 ID / 欄位 |
|--------|------|---------------|
| 主內容 | V2 stories | `sys_story_community_advice` |
| 主內容 | 舊欄位 | `advice_to_self` |
| 1 | V2 stories | `sys_story_community_mentor` |
| 2 | V2 stories | `sys_story_community_partner` |
| 3 | V2 stories | `sys_story_community_funny` |
| 4 | V2 stories | `sys_story_community_spot` |
| 5 | V2 stories | `sys_story_community_space` |

#### UI 設計（保留便條紙式 + 社群故事）

```
┌─────────────────────────────────────────────────────┐
│  bg-gradient-to-br from-brand-light to-gray-100    │
│  py-20                                              │
│                                                     │
│  [text-brand-dark] Chapter 3                        │
│  連結                                               │
│  <Users /> 社群與夥伴的故事                                │
│                                                     │
│  ┌─ 便條紙卡片（給新手的話）────────────────────┐   │
│  │  [accent bar on top]                         │   │
│  │                                              │   │
│  │  不要因為爬不上去就覺得丟臉，               │   │
│  │  每個人都是從零開始的...                    │   │
│  │                                              │   │
│  │                          — {name}           │   │
│  │                            2024/01/15       │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ─────────────────────────────────────────────     │
│                                                     │
│  【其他社群故事】                                    │
│                                                     │
│  ┌─ 攀岩夥伴 ────┐  ┌─ 推薦岩場 ────┐              │
│  │ ...          │  │ ...          │              │
│  └──────────────┘  └──────────────┘              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 空白狀態

```
┌─────────────────────────────────────────────────────┐
│           [Users icon in gray circle]                  │
│                                                     │
│     {name} 的攀岩社群故事即將展開...                │
│     攀岩路上，總會遇見志同道合的夥伴                 │
└─────────────────────────────────────────────────────┘
```

---

### Chapter 4: 探索 (dreams)

#### 內容來源

| 優先級 | 來源 | 問題 ID / 欄位 |
|--------|------|---------------|
| 人生清單 | bucket_list API | 結構化清單項目 |
| 主故事 | V2 stories | `sys_story_dreams_bucket_list` |
| 主故事 | 舊欄位 | `bucket_list_story` |
| 1 | V2 stories | `sys_story_dreams_dream_climb` |
| 2 | V2 stories | `sys_story_dreams_trip` |
| 3 | V2 stories | `sys_story_dreams_goal` |
| 4 | V2 stories | `sys_story_dreams_style` |
| 5 | V2 stories | `sys_story_dreams_inspiration` |

#### UI 設計

```
┌─────────────────────────────────────────────────────┐
│  bg-white py-16                                     │
│                                                     │
│  [bg-brand-accent] Chapter 4                        │
│  探索                                               │
│  <Target /> 夢想與目標                                      │
│                                                     │
│  【人生清單故事描述】                                │
│  "一直夢想能去優勝美地..."                          │
│                                                     │
│  【結構化人生清單】                                  │
│  ┌──────────────────────────────────────────────┐  │
│  │ [x] 完成龍洞經典路線                          │  │
│  │ [ ] 去優勝美地爬 El Cap                       │  │
│  │ [ ] 完攀 5.12                                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ─────────────────────────────────────────────     │
│                                                     │
│  【其他夢想故事】                                    │
│                                                     │
│  ┌─ 夢想地點 ────┐  ┌─ 攀岩旅行 ────┐              │
│  │ ...          │  │ ...          │              │
│  └──────────────┘  └──────────────┘              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 空白狀態

```
┌─────────────────────────────────────────────────────┐
│           [Target icon in gray circle]                  │
│                                                     │
│     {name} 的攀岩人生清單正在醞釀中...              │
│     每個攀岩者都有屬於自己的目標與夢想               │
└─────────────────────────────────────────────────────┘
```

---

### 實用分享區塊 (practical)

#### 內容來源

| 問題 ID | 標題 |
|---------|------|
| `sys_story_practical_injury` | 有受過傷嗎？怎麼復原的？ |
| `sys_story_practical_route` | 有沒有想分享的路線或經驗？ |
| `sys_story_practical_training` | 你平常怎麼練習？ |
| `sys_story_practical_practice` | 有沒有對你特別有效的練習方法？ |
| `sys_story_practical_technique` | 有沒有學到什麼實用的技巧？ |
| `sys_story_practical_gear` | 關於裝備有沒有什麼心得？ |

#### UI 設計（卡片網格）

```
┌─────────────────────────────────────────────────────┐
│  bg-gray-50 py-16                                   │
│                                                     │
│  [bg-brand-accent] 實用分享                         │
│  <Wrench /> 經驗與技巧                                      │
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ 訓練    │  │ 技巧    │  │ 裝備    │            │
│  │ 方法    │  │ 心得    │  │ 選擇    │            │
│  │ ...     │  │ ...     │  │ ...     │            │
│  └─────────┘  └─────────┘  └─────────┘            │
│                                                     │
│  ┌─────────┐  ┌─────────┐                          │
│  │ 受傷    │  │ 路線    │                          │
│  │ 復原    │  │ 分享    │                          │
│  │ ...     │  │ ...     │                          │
│  └─────────┘  └─────────┘                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 空白狀態

```
┌─────────────────────────────────────────────────────┐
│           [Wrench icon in gray circle]                  │
│                                                     │
│     {name} 的實用分享即將上線...                    │
│     經驗是最好的老師                                 │
└─────────────────────────────────────────────────────┘
```

---

### 一句話精選區塊 (OneLinersSection) 【新增】

#### 內容來源

從 `one_liners` 中選取已填寫的項目顯示：

| 問題 ID | 問題 |
|---------|------|
| `sys_ol_why_started` | 為什麼開始攀岩？ |
| `sys_ol_best_moment` | 爬岩最爽的是？ |
| `sys_ol_advice_for_beginners` | 給新手一句話？ |
| `sys_ol_favorite_place` | 最喜歡在哪裡爬？ |
| `sys_ol_current_goal` | 目前的攀岩小目標？ |
| `sys_ol_climbing_lesson` | 攀岩教會我的一件事？ |
| `sys_ol_climbing_style_desc` | 用一句話形容你的攀岩風格？ |
| `sys_ol_life_outside` | 攀岩之外，你是誰？ |

#### UI 設計（語錄卡片）

```
┌─────────────────────────────────────────────────────┐
│  bg-white py-12                                     │
│                                                     │
│  快速了解 {name}                                    │
│                                                     │
│  ┌─────────────────┐  ┌─────────────────┐          │
│  │ Q: 為什麼開始   │  │ Q: 爬岩最爽的是 │          │
│  │    攀岩？       │  │                 │          │
│  │                 │  │                 │          │
│  │ "朋友拉我去，   │  │ "終於送出卡了   │          │
│  │  結果就回不去了"│  │  一個月的路線"  │          │
│  └─────────────────┘  └─────────────────┘          │
│                                                     │
│  ┌─────────────────┐  ┌─────────────────┐          │
│  │ Q: 給新手一句話 │  │ Q: 目前的小目標 │          │
│  │                 │  │                 │          │
│  │ "不要急，享受   │  │ "這個月送出    │          │
│  │  過程最重要"    │  │  V4"           │          │
│  └─────────────────┘  └─────────────────┘          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 資料轉換工具函數

```typescript
// src/lib/utils/biography-stories.ts

import {
  SYSTEM_STORY_CATEGORIES,
  getStoryCategoryByQuestionId,
  getStoryQuestionById,
} from '@/lib/constants/biography-questions'
import type { Biography } from '@/lib/types'
import type { StoryItem } from '@/lib/types/biography-v2'

/**
 * 根據分類 ID 取得該人物的所有相關故事
 */
export function getStoriesByCategory(
  person: Biography,
  categoryId: string
): StoryItem[] {
  if (!person.stories) return []

  return person.stories.filter((story) => {
    const category = getStoryCategoryByQuestionId(story.question_id)
    return category?.id === categoryId
  })
}

/**
 * 取得成長與突破類故事
 */
export function getGrowthStories(person: Biography): StoryItem[] {
  return getStoriesByCategory(person, SYSTEM_STORY_CATEGORIES.GROWTH)
}

/**
 * 取得心理與哲學類故事
 */
export function getPsychologyStories(person: Biography): StoryItem[] {
  return getStoriesByCategory(person, SYSTEM_STORY_CATEGORIES.PSYCHOLOGY)
}

/**
 * 取得社群與連結類故事
 */
export function getCommunityStories(person: Biography): StoryItem[] {
  return getStoriesByCategory(person, SYSTEM_STORY_CATEGORIES.COMMUNITY)
}

/**
 * 取得實用分享類故事
 */
export function getPracticalStories(person: Biography): StoryItem[] {
  return getStoriesByCategory(person, SYSTEM_STORY_CATEGORIES.PRACTICAL)
}

/**
 * 取得夢想與探索類故事
 */
export function getDreamsStories(person: Biography): StoryItem[] {
  return getStoriesByCategory(person, SYSTEM_STORY_CATEGORIES.DREAMS)
}

/**
 * 取得故事的問題標題
 */
export function getStoryTitle(questionId: string): string {
  const question = getStoryQuestionById(questionId)
  return question?.title || '故事'
}
```

---

## 下一步行動

### Phase 1: 基礎架構
1. [x] 確認採用方案 C
2. [ ] 建立 `src/lib/utils/biography-stories.ts` 工具函數
3. [ ] 建立 `chapters/` 目錄結構

### Phase 2: 章節組件重構
4. [ ] 重構 ChapterMeeting → ChapterBeginning (growth)
5. [ ] 重構 ChapterMeaning → ChapterMind (psychology)
6. [ ] 重構 ChapterAdvice → ChapterConnection (community)
7. [ ] 重構 ChapterBucketList → ChapterExplore (dreams)

### Phase 3: 新增區塊
8. [ ] 新增 OneLinersSection（一句話精選）
9. [ ] 新增 PracticalSection（實用分享）

### Phase 4: 整合與測試
10. [ ] 更新 ProfileClient.tsx 引用
11. [ ] 測試舊版欄位向後兼容
12. [ ] 測試新版 V2 資料顯示
13. [ ] 測試空白狀態顯示

---

## 附錄：分類圖示對應

| 分類 | Lucide Icon | 背景色建議 |
|------|-------------|-----------|
| 成長與突破 | `Sprout` | bg-white |
| 心理與哲學 | `Brain` | bg-gradient (accent) |
| 社群與連結 | `Users` | bg-gradient (light) |
| 實用分享 | `Wrench` | bg-gray-50 |
| 夢想與探索 | `Target` | bg-white |
| 生活整合 | `Palette` | bg-white |
| 攀岩足跡 | `MapPin` | bg-gradient |

## 附錄：舊欄位完整映射表

| 舊 DB 欄位 | V2 問題 ID | 分類 |
|-----------|-----------|------|
| `climbing_origin` | `sys_story_growth_memorable_moment` | growth |
| `memorable_moment` | `sys_story_growth_memorable_moment` | growth |
| `biggest_challenge` | `sys_story_growth_biggest_challenge` | growth |
| `breakthrough_story` | `sys_story_growth_breakthrough` | growth |
| `first_outdoor` | `sys_story_growth_first_outdoor` | growth |
| `first_grade` | `sys_story_growth_first_grade` | growth |
| `frustrating_climb` | `sys_story_growth_frustrating` | growth |
| `fear_management` | `sys_story_psychology_fear` | psychology |
| `climbing_lesson` | `sys_story_psychology_lesson` | psychology |
| `failure_perspective` | `sys_story_psychology_failure` | psychology |
| `flow_moment` | `sys_story_psychology_flow` | psychology |
| `life_balance` | `sys_story_psychology_balance` | psychology |
| `unexpected_gain` | `sys_story_psychology_gain` | psychology |
| `climbing_mentor` | `sys_story_community_mentor` | community |
| `climbing_partner` | `sys_story_community_partner` | community |
| `funny_moment` | `sys_story_community_funny` | community |
| `favorite_spot` | `sys_story_community_spot` | community |
| `advice_to_group` | `sys_story_community_advice` | community |
| `climbing_space` | `sys_story_community_space` | community |
| `advice_to_self` | `sys_story_community_advice` | community |
| `injury_recovery` | `sys_story_practical_injury` | practical |
| `memorable_route` | `sys_story_practical_route` | practical |
| `training_method` | `sys_story_practical_training` | practical |
| `effective_practice` | `sys_story_practical_practice` | practical |
| `technique_tip` | `sys_story_practical_technique` | practical |
| `gear_choice` | `sys_story_practical_gear` | practical |
| `dream_climb` | `sys_story_dreams_dream_climb` | dreams |
| `climbing_trip` | `sys_story_dreams_trip` | dreams |
| `bucket_list_story` | `sys_story_dreams_bucket_list` | dreams |
| `climbing_goal` | `sys_story_dreams_goal` | dreams |
| `climbing_style` | `sys_story_dreams_style` | dreams |
| `climbing_inspiration` | `sys_story_dreams_inspiration` | dreams |
| `life_outside_climbing` | `sys_story_life_outside` | life |
| `climbing_meaning` | `sys_ol_climbing_meaning` | one-liner |
