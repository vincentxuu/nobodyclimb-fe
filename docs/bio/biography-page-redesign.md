# 人物誌詳情頁重新設計規劃

> 目標：打造具有故事敘述感的人物誌頁面，透過多樣化版面配置和互動式組件提升閱讀體驗
>
> 建立日期: 2026-01-14
> 版本: 1.0

---

## 設計理念

**核心概念：像閱讀一本攀岩者的圖文日記**

- **章節式敘事**：將內容分為清晰的章節，每個章節有不同的視覺處理
- **視覺節奏**：透過版面變化、圖文穿插創造閱讀節奏感
- **沉浸式體驗**：讓讀者感覺在了解一個真實的人，而不是閱讀資料
- **互動探索**：讀者可以自由展開感興趣的內容，跳過不感興趣的部分

---

## 頁面整體結構

**設計理念：極簡文字 + 故事優先**

去除視覺干擾，以極簡的 Hero 快速進入內容，讓精選故事立即吸引讀者。

```
┌─────────────────────────────────────────────────────────┐
│ 1. Hero Section (簡潔標題)                              │
│    - 以文字為主，極簡設計                                │
│    - 快速進入內容                                        │
├─────────────────────────────────────────────────────────┤
│ 2. 精選故事（最前面！）                                 │
│    - 挑選 3-4 個最精彩的進階故事                         │
│    - 大卡片展示，立即吸引讀者                            │
│    - 建立興趣和期待                                      │
├─────────────────────────────────────────────────────────┤
│ 3. Chapter 1: 相遇篇                                    │
│    - 完整的相遇故事                                      │
│    - 側邊圖片裝飾                                        │
│    - 情感連結深化                                        │
├─────────────────────────────────────────────────────────┤
│ 4. Chapter 2: 意義篇                                    │
│    - 引言式設計                                          │
│    - 深化情感共鳴                                        │
├─────────────────────────────────────────────────────────┤
│ 5. Quick Facts (快速了解)                               │
│    - 橫向資訊卡片                                        │
│    - 具體資訊補充                                        │
├─────────────────────────────────────────────────────────┤
│ 6. Chapter 3: 人生清單                                  │
│    - 互動式看板                                          │
│    - 分為「追夢中」和「已完成」                          │
├─────────────────────────────────────────────────────────┤
│ 7. Gallery: 攀岩足跡地圖                                │
│    - 視覺化地點展示                                      │
├─────────────────────────────────────────────────────────┤
│ 8. 小故事（完整版）                                    │
│    - 顯示所有已填寫的進階故事                            │
│    - 簡潔的網格佈局                                      │
├─────────────────────────────────────────────────────────┤
│ 9. Chapter 4: 給新手的話                                │
│    - 特殊引言設計                                        │
├─────────────────────────────────────────────────────────┤
│ 10. 下一個故事                                          │
│    - 推薦其他人物誌                                      │
└─────────────────────────────────────────────────────────┘
```

**閱讀體驗流程：**

1. **極簡標題** → 純文字 Hero，1秒完成（100px 高度）
2. **立即吸引** → 精選故事，最精彩的內容立即呈現
3. **情感連結** → 相遇故事、攀岩意義（深化了解）
4. **資訊補充** → Quick Facts 基本資訊
5. **深入探索** → 人生清單、攀岩足跡
6. **完整瀏覽** → 所有故事
7. **情感結尾** → 給新手的話

**設計優勢：**

- **無視覺干擾**：純文字設計，內容為王
- **不依賴照片**：適合所有人，無論是否有照片
- **快速進入**：讀者 1 秒看完 Hero，立即看到精選故事
- **故事驅動**：精選故事作為「預告片」吸引繼續閱讀
- **專業質感**：極簡設計更符合文字優先的理念

---

## 各區塊詳細設計

### 1. Hero Section - 極簡標題區

**設計目的：**
以文字為中心的極簡設計，不依賴照片，快速進入內容。

**視覺設計：**

```
┌──────────────────────────────────────────┐
│                                          │
│      林小明                              │
│      攀岩者・創作者                       │
│                                          │
│   [追蹤按鈕]  <Eye /> 328  <Mountain /> 45  <Users /> 156      │
│                                          │
└──────────────────────────────────────────┘
```

**設計特點：**

- **極低高度**：只佔 15-20vh，不浪費空間
- **純文字**：名字 + 簡短描述
- **無照片**：完全不需要照片或頭像
- **白色背景**：乾淨簡潔，符合專案風格
- **社群數據**：以小圖標 + 數字呈現
- **橫向排列**：所有資訊在同一行或兩行內完成

**優勢：**

- 讀者 1 秒內完成 Hero 閱讀，立即進入精選故事
- 不需要準備封面照片
- 適合所有人，無論是否有照片
- 極簡專業，符合文字優先的理念

**實作重點：**

```tsx
const HeroSection = ({ person, followerCount, isOwner }) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          {/* 左側：名字與描述 */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-dark mb-2">
              {person.name}
            </h1>
            <p className="text-text-subtle text-base">
              攀岩者・創作者
            </p>
          </div>

          {/* 右側：追蹤按鈕與統計 */}
          <div className="flex items-center gap-6">
            {!isOwner && (
              <FollowButton
                biographyId={person.id}
                className="bg-brand-dark text-white hover:bg-brand-dark-hover"
              />
            )}

            {/* 社群統計 */}
            <div className="flex items-center gap-4 text-sm text-text-subtle">
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>{person.total_views || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mountain className="h-4 w-4" />
                <span>{person.total_likes || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{followerCount}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
```

**設計考量：**

- **極簡設計**：只有文字和數據，無任何圖片
- **低高度**：約 100-120px，不佔空間
- **專業質感**：使用專案色彩系統（brand-dark, text-subtle）
- **快速閱讀**：1秒內完成，立即進入精選故事
- **響應式**：手機版垂直排列，桌面版橫向排列
- **重點突出**：名字使用 brand-dark，統計數字使用 text-subtle
- **無干擾**：白色背景，讓內容說話

---

### 2. 精選故事

**設計目的：**
Hero 之後立即展示最精彩的進階故事，作為「預告片」吸引讀者繼續閱讀。

**視覺設計：**

```
┌─────────────────────────────────────────────────────────┐
│  精選小故事                                            │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │  最難忘的攀登經歷                              │      │
│  │                                              │      │
│  │  那是 2024 年夏天，我第一次挑戰龍洞的        │      │
│  │  校門口...經過三個月的準備，終於...          │      │
│  │                                              │      │
│  │  [閱讀完整故事 →]                            │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────┐            │
│  │ 如何克服攀岩中的  │  │ 最喜歡的攀岩夥伴與    │  │ 你的訓練方式與    │            │
│  │ 恐懼 (預覽)       │  │ 故事 (預覽)          │  │ 心得 (預覽)       │            │
│  └──────────────────┘  └──────────────────────┘  └──────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

**實作重點：**
使用專案色彩系統 `brand-accent` 作為強調色，`bg-white` 卡片配 `shadow-sm`。
（完整程式碼見後續章節）

---

### 3. Chapter 1 - 相遇篇

**視覺設計：**

```
┌───────────────────────────────────────────────────┐
│                                                    │
│  Chapter 1                                         │
│  你與攀岩的相遇                                     │
│                                                    │
│  ┌──────────────────┐  那是 2019 年的夏天，       │
│  │                  │  我第一次踏進岩館...         │
│  │  [插圖或照片]     │                             │
│  │                  │  當時完全不知道自己即將      │
│  │                  │  開啟一段改變人生的旅程...   │
│  └──────────────────┘                             │
│                                                    │
│  那時候我剛換工作，壓力很大...                      │
│  (故事內容繼續)                                     │
│                                                    │
└───────────────────────────────────────────────────┘
```

**互動效果：**

- 章節標題進入視窗時觸發淡入動畫
- 文字採用分段式閱讀，每段有輕微的動畫
- 側邊圖片使用 reveal 效果

**實作重點：**

```tsx
<motion.section
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  viewport={{ once: true, margin: "-100px" }}
  className="py-16 max-w-5xl mx-auto"
>
  {/* 章節標題 */}
  <div className="mb-8">
    <span className="text-sm uppercase tracking-wider text-yellow-500 font-medium">
      Chapter 1
    </span>
    <h2 className="text-3xl font-bold text-gray-900 mt-2">
      你與攀岩的相遇
    </h2>
  </div>

  {/* 內容區 - 使用 Grid 佈局 */}
  <div className="grid grid-cols-12 gap-8">
    {/* 圖片 - 占 5 欄 */}
    <motion.div
      className="col-span-5"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
    >
      <div className="sticky top-24 rounded-2xl overflow-hidden shadow-lg">
        <Image src={image} alt="相遇" className="w-full h-auto" />
      </div>
    </motion.div>

    {/* 文字 - 占 7 欄 */}
    <div className="col-span-7">
      {paragraphs.map((para, index) => (
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: index * 0.1 }}
          className="text-lg leading-relaxed text-gray-700 mb-6"
        >
          {para}
        </motion.p>
      ))}
    </div>
  </div>
</motion.section>
```

---

### 4. Chapter 2 - 意義篇

**視覺設計：**

```
┌────────────────────────────────────────────────────┐
│                                                     │
│            攀岩對你來說是什麼                        │
│                                                     │
│      「 攀岩是我的冥想，是我與自己對話的時刻。     │
│         當我在岩壁上，世界變得很簡單，             │
│         只有下一個手點和當下的呼吸。 」             │
│                                                     │
│                    — 林小明                        │
│                                                     │
└────────────────────────────────────────────────────┘
```

**互動效果：**

- 採用大型引言框設計
- 文字淡入 + 放大動畫
- 背景使用淡淡的漸層或紋理

**實作重點：**

```tsx
<motion.section
  className="py-20 px-8 bg-gradient-to-br from-yellow-50 to-yellow-50 my-16"
  initial={{ opacity: 0, scale: 0.95 }}
  whileInView={{ opacity: 1, scale: 1 }}
  viewport={{ once: true }}
>
  <div className="max-w-3xl mx-auto text-center">
    <h2 className="text-2xl font-semibold text-gray-900 mb-8">
      攀岩對你來說是什麼
    </h2>

    <blockquote className="relative">
      <span className="text-6xl text-yellow-300 absolute -top-4 -left-4">
        "
      </span>
      <p className="text-xl leading-relaxed text-gray-800 italic px-8">
        {content}
      </p>
      <span className="text-6xl text-yellow-300 absolute -bottom-8 -right-4">
        "
      </span>
    </blockquote>

    <p className="mt-8 text-gray-600">— {name}</p>
  </div>
</motion.section>
```

---

### 5. Quick Facts - 快速了解

**視覺設計：**

```
┌──────────────────────────────────────────────────────┐
│  快速了解 林小明                                      │
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ <Calendar />│  │ <MapPin />  │  │ <Activity />│            │
│  │ 2019        │  │ 龍洞        │  │ 抱石        │            │
│  │ 開始攀岩    │  │ 熱海        │  │ 先鋒        │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└──────────────────────────────────────────────────────┘
```

**互動效果：**

- 三張卡片從左到右依序淡入
- Hover 時卡片會微微上浮

**資料結構範例：**

```tsx
// Quick Facts 資料格式
const quickFacts = [
  {
    icon: <Calendar className="h-6 w-6 text-gray-600" />,
    label: '開始攀岩',
    value: '2019'
  },
  {
    icon: <MapPin className="h-6 w-6 text-gray-600" />,
    label: '常出沒地點',
    value: '龍洞、熱海'
  },
  {
    icon: <Activity className="h-6 w-6 text-gray-600" />,
    label: '喜歡的類型',
    value: '抱石、先鋒'
  }
]
```

**實作重點：**

```tsx
<div className="grid grid-cols-3 gap-6 py-12">
  {quickFacts.map((fact, index) => (
    <motion.div
      key={fact.label}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="rounded-2xl bg-white p-6 text-center shadow-sm
                 hover:shadow-md transition-shadow"
    >
      {/* Icon 組件 */}
      <div className="flex justify-center mb-3">
        {fact.icon}
      </div>
      <p className="text-sm text-gray-500">{fact.label}</p>
      <p className="font-medium text-gray-900">{fact.value}</p>
    </motion.div>
  ))}
</div>
```

---

### 6. Chapter 3 - 人生清單

**視覺設計：**

```
┌─────────────────────────────────────────────────────┐
│  Chapter 3                                           │
│  攀岩人生清單                                         │
│                                                      │
│  ┌─ 追夢中 ────────────────────────────────┐       │
│  │                                          │       │
│  │  ○ 完攀龍洞校門口 5.12a                  │       │
│  │  ├─────────────────────────> 65%         │       │
│  │  │ <Mountain /> 龍洞  <Calendar /> 2026/06│       │
│  │  └─ 最近練習：昨天完成關鍵動作！          │       │
│  │                                          │       │
│  │  ○ 完成 V6 等級抱石                      │       │
│  │  ├──────────> 40%                        │       │
│  │  │ <Activity /> 室內  <Calendar /> 2026/12│       │
│  │  └─ 3 個里程碑已完成                      │       │
│  └─────────────────────────────────────────┘       │
│                                                      │
│  ┌─ 已完成 ────────────────────────────────┐       │
│  │                                          │       │
│  │  ✓ 完成人生第一條戶外路線                │       │
│  │     完成於 2025.08                       │       │
│  │     <MessageCircle /> "終於克服了對高度的恐懼..."│       │
│  │     <Mountain /> 23  <MessageCircle /> 5  <Target /> 12人也想做│       │
│  └─────────────────────────────────────────┘       │
│                                                      │
│  [+ 我也有想做的清單]                               │
└─────────────────────────────────────────────────────┘
```

**互動效果：**

- 每個目標是可展開/收合的卡片
- 進度條有動畫效果（從 0 增長到目標值）
- Hover 時顯示更多操作選項（編輯、刪除、分享）
- 已完成的目標點擊可展開看完整故事

**實作重點：**

```tsx
// 人生清單項目卡片
const BucketListItemCard = ({ item, isOwner }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      className="rounded-xl bg-white border border-gray-200 p-5
                 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* 標題行 */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* 狀態圖標 */}
          <div className={cn(
            "mt-1 rounded-full p-1.5",
            item.status === 'completed'
              ? "bg-green-100 text-green-600"
              : "bg-yellow-100 text-yellow-600"
          )}>
            {item.status === 'completed' ? '✓' : '○'}
          </div>

          {/* 標題與標籤 */}
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-2">
              {item.title}
            </h4>
            <div className="flex flex-wrap gap-2 text-sm">
              {item.target_location && (
                <span className="inline-flex items-center gap-1 text-gray-600">
                  <Mountain className="h-3.5 w-3.5" />
                  {item.target_location}
                </span>
              )}
              {item.target_date && (
                <span className="inline-flex items-center gap-1 text-gray-600">
                  <Calendar className="h-3.5 w-3.5" />
                  {item.target_date}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 互動按鈕 */}
        <div className="flex items-center gap-2">
          <button className="text-gray-400 hover:text-brand-accent">
            <Mountain className="h-5 w-5" />
          </button>
          {isOwner && (
            <button className="text-gray-400 hover:text-gray-600">
              <MoreVertical className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* 進度條（進行中才顯示） */}
      {item.status === 'active' && item.enable_progress && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">進度</span>
            <span className="font-medium text-yellow-600">
              {item.progress}%
            </span>
          </div>
          <motion.div
            className="h-2 bg-gray-100 rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${item.progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </motion.div>

          {/* 最近更新 */}
          {item.latest_update && (
            <p className="mt-2 text-sm text-gray-500 italic">
              最近練習：{item.latest_update}
            </p>
          )}
        </div>
      )}

      {/* 已完成資訊 */}
      {item.status === 'completed' && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">
            完成於 {formatDate(item.completed_at)}
          </p>
          {item.completion_story && (
            <p className="text-sm text-gray-700 line-clamp-2">
              <MessageCircle className="inline h-3.5 w-3.5 mr-1" />
              "{item.completion_story}"
            </p>
          )}
          {/* 社群統計 */}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Mountain className="h-3.5 w-3.5" />
              {item.likes_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {item.comments_count}
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              {item.inspired_count}人也想做
            </span>
          </div>
        </div>
      )}

      {/* 展開內容 */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-gray-100"
          >
            {/* 詳細內容、里程碑、留言等 */}
            {item.description && (
              <p className="text-sm text-gray-600 mb-4">
                {item.description}
              </p>
            )}

            {/* 里程碑 */}
            {item.milestones && (
              <MilestonesList milestones={item.milestones} />
            )}

            {/* 完成故事完整版 */}
            {item.status === 'completed' && item.completion_story && (
              <CompletionStoryCard story={item} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
```

### 7. Gallery - 攀岩足跡地圖

**視覺設計：**

```
┌──────────────────────────────────────────────────────┐
│  攀岩足跡                                             │
│                                                       │
│  ┌──────────────────────────────────────┐           │
│  │                                       │           │
│  │         [互動式地圖或視覺化圖]         │           │
│  │                                       │           │
│  │   <MapPin /> 台灣 (5個地點)           │           │
│  │   <MapPin /> 日本 (2個地點)           │           │
│  │   <MapPin /> 泰國 (1個地點)           │           │
│  │                                       │           │
│  └──────────────────────────────────────┘           │
│                                                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ [照片]   │ │ [照片]   │ │ [照片]   │              │
│  │ 龍洞     │ │ 熱海     │ │ 甲仙     │              │
│  │ 2024.03  │ │ 2024.08  │ │ 2025.01  │              │
│  └─────────┘ └─────────┘ └─────────┘              │
└──────────────────────────────────────────────────────┘
```

**互動效果：**

- 地點卡片使用橫向滾動（carousel）
- Hover 時卡片放大，顯示更多資訊
- 點擊可以看該地點的完整照片和心得

**實作重點：**

```tsx
// 使用 Swiper 或自製 carousel
<section className="py-16 bg-gray-50">
  <div className="container mx-auto">
    <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
      攀岩足跡
      <span className="text-lg font-normal text-gray-500">
        {locations.length} 個地點
      </span>
    </h2>

    {/* 地點統計 */}
    <div className="flex gap-6 mb-8">
      {Object.entries(locationsByCountry).map(([country, count]) => (
        <div key={country} className="flex items-center gap-2 text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{country} ({count}個地點)</span>
        </div>
      ))}
    </div>

    {/* 橫向滾動地點卡片 */}
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
      {locations.map((location, index) => (
        <motion.div
          key={location.location}
          className="flex-shrink-0 w-72 snap-start"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          viewport={{ once: true }}
        >
          <div className="group relative rounded-2xl overflow-hidden
                          bg-white shadow-sm hover:shadow-xl
                          transition-shadow cursor-pointer">
            {/* 照片 */}
            <div className="relative h-48 overflow-hidden">
              <Image
                src={location.photos?.[0] || '/placeholder.jpg'}
                alt={location.location}
                fill
                className="object-cover group-hover:scale-110
                          transition-transform duration-300"
              />
              {/* 國旗或標籤 */}
              <div className="absolute top-3 right-3 bg-white/90
                              backdrop-blur-sm px-3 py-1 rounded-full
                              text-sm font-medium">
                {location.country}
              </div>
            </div>

            {/* 資訊 */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                {location.location}
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                {location.visit_year}
              </p>
              {location.notes && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {location.notes}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
</section>
```

---

### 8. 小故事（完整版）

**設計目的：**
顯示所有已填寫的進階故事，提供完整的故事瀏覽體驗。採用簡潔的網格佈局，不需要分類篩選。

**視覺設計：**

```
┌─────────────────────────────────────────────────────┐
│  小故事                                            │
│  已分享 12 則故事                                    │
│                                                      │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐        │
│  │ 最難忘的      │  │ 如何克服攀岩中的  │  │ 最喜歡的攀岩夥伴與    │        │
│  │ 攀登經歷      │  │ 恐懼             │  │ 故事                 │        │
│  │ (預覽)        │  │ (預覽)           │  │ (預覽)               │        │
│  └──────────────┘  └──────────────────┘  └──────────────────────┘        │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ ...      │  │ ...      │  │ ...      │        │
│  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────┘
```

**互動效果：**

- 故事卡片採用網格佈局（手機 1欄、平板 2欄、桌面 3欄）
- 點擊卡片展開完整故事（Modal）
- Hover 時卡片微微上浮並顯示「閱讀完整故事」提示
- 如果是擁有者且有未填寫的故事，顯示虛線框「新增故事」卡片

**實作重點：**

```tsx
const CompleteStoriesSection = ({ person, isOwner }) => {
  const [selectedStory, setSelectedStory] = useState(null)

  // 整理已填寫的故事
  const filledStories = useMemo(() => {
    return ADVANCED_STORY_QUESTIONS
      .filter(q => person[q.field] && person[q.field].trim())
      .map(q => ({
        ...q,
        content: person[q.field]
      }))
  }, [person])

  // 整理未填寫的故事（只給擁有者看）
  const unfilledStories = useMemo(() => {
    if (!isOwner) return []
    return ADVANCED_STORY_QUESTIONS.filter(
      q => !person[q.field] || !person[q.field].trim()
    )
  }, [person, isOwner])

  if (filledStories.length === 0 && !isOwner) return null

  return (
    <>
      <section id="complete-stories" className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
            小故事
          </h2>
          <p className="text-gray-600 mb-10">
            {filledStories.length > 0
              ? `已分享 ${filledStories.length} 則故事`
              : '還沒有分享故事'}
          </p>

          {/* 故事網格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 已填寫的故事 */}
            {filledStories.map((story, index) => (
              <motion.div
                key={story.field}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <div
                  onClick={() => setSelectedStory(story)}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md
                             transition-all cursor-pointer h-full group"
                >
                  {/* 分類標籤 */}
                  <div className={cn(
                    "text-xs px-2 py-1 rounded w-fit mb-3",
                    `bg-${getCategoryColor(story.category)}-100`,
                    `text-${getCategoryColor(story.category)}-700`
                  )}>
                    {getCategoryName(story.category)}
                  </div>

                  {/* 標題 */}
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {story.title}
                  </h3>

                  {/* 內容預覽 */}
                  <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed mb-4">
                    {story.content}
                  </p>

                  {/* 閱讀更多提示 */}
                  <div className="flex items-center gap-2 text-sm text-yellow-600
                                  font-medium opacity-0 group-hover:opacity-100
                                  transition-opacity">
                    <span>閱讀完整故事</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </motion.div>
            ))}

            {/* 未填寫的故事（只給擁有者看） */}
            {isOwner && unfilledStories.slice(0, 3).map((story, index) => (
              <motion.div
                key={story.field}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (filledStories.length + index) * 0.05 }}
              >
                <div
                  onClick={() => {
                    // 跳轉到編輯頁面或打開編輯 Modal
                    // 實際實作時可以觸發編輯功能
                  }}
                  className="relative rounded-xl border-2 border-dashed border-gray-300
                             p-6 text-center hover:border-yellow-400
                             transition-colors cursor-pointer group h-full
                             flex flex-col items-center justify-center"
                >
                  <div className="text-xs px-2 py-1 rounded w-fit mb-3
                                  bg-gray-200 text-gray-500
                                  group-hover:bg-yellow-100 group-hover:text-yellow-600
                                  transition-colors">
                    {getCategoryName(story.category)}
                  </div>
                  <h3 className="font-medium text-gray-500 mb-2
                                 group-hover:text-gray-700 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-sm text-gray-400">點擊新增故事</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 更多未填寫的故事提示 */}
          {isOwner && unfilledStories.length > 3 && (
            <div className="mt-8 text-center">
              <p className="text-gray-500">
                還有 {unfilledStories.length - 3} 個故事主題等待你的分享
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 故事詳情 Modal */}
      <StoryModal
        story={selectedStory}
        open={!!selectedStory}
        onClose={() => setSelectedStory(null)}
      />
    </>
  )
}
```

---

### 9. Chapter 4 - 給新手的話

**視覺設計：**

```
┌────────────────────────────────────────────────────┐
│                                                     │
│    給剛開始攀岩的自己                               │
│                                                     │
│    ┌────────────────────────────────────┐         │
│    │                                    │         │
│    │  不要害怕失敗，每一次墜落都是      │         │
│    │  在學習。攀岩最美的地方就是...     │         │
│    │                                    │         │
│    │  (完整內容)                        │         │
│    │                                    │         │
│    └────────────────────────────────────┘         │
│                                                     │
│                         — 林小明，2026.01          │
│                                                     │
└────────────────────────────────────────────────────┘
```

**互動效果：**

- 採用信件或留言板風格
- 柔和的背景色和手寫字體感
- 簡單的淡入動畫

**實作重點：**

```tsx
<motion.section
  className="py-20 px-8 bg-gradient-to-br from-blue-50 to-indigo-50 my-16"
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
>
  <div className="max-w-2xl mx-auto">
    <h2 className="text-2xl font-semibold text-center text-gray-900 mb-8">
      給剛開始攀岩的自己
    </h2>

    {/* 內容框 - 像是一張便條紙 */}
    <div className="relative bg-white rounded-2xl shadow-lg p-8
                    before:content-[''] before:absolute before:top-0
                    before:left-8 before:w-16 before:h-1 before:bg-yellow-300
                    before:rounded-full before:-translate-y-2">
      <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
        {advice}
      </p>

      {/* 簽名 */}
      <div className="mt-6 text-right text-gray-600">
        <p className="font-medium">— {name}</p>
        <p className="text-sm">{formatDate(new Date())}</p>
      </div>
    </div>
  </div>
</motion.section>
```

---

## 整體互動優化

### 1. 滾動進度指示器

在頁面右側顯示閱讀進度和章節導航：

```tsx
const ScrollProgress = ({ sections }) => {
  const [activeSection, setActiveSection] = useState(0)

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50
                    hidden lg:block">
      <div className="flex flex-col gap-3">
        {sections.map((section, index) => (
          <Tooltip key={section.id} content={section.title}>
            <button
              onClick={() => scrollToSection(section.id)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                activeSection === index
                  ? "bg-yellow-500 w-3 h-3"
                  : "bg-gray-300 hover:bg-gray-400"
              )}
            />
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
```

### 2. 浮動操作按鈕（擁有者專用）

```tsx
{isOwner && (
  <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-40">
    <Tooltip content="編輯人物誌">
      <button className="rounded-full bg-yellow-500 text-white p-4
                         shadow-lg hover:bg-yellow-600 transition-colors">
        <Edit className="h-5 w-5" />
      </button>
    </Tooltip>
    <Tooltip content="新增故事">
      <button className="rounded-full bg-white text-gray-700 p-4
                         shadow-lg hover:bg-gray-50 transition-colors">
        <Plus className="h-5 w-5" />
      </button>
    </Tooltip>
  </div>
)}
```

### 3. 圖片燈箱（Lightbox）

當點擊任何圖片時，以全螢幕方式展示：

```tsx
// 使用 yet-another-react-lightbox 或自製
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"

const [lightboxIndex, setLightboxIndex] = useState(-1)

<Lightbox
  open={lightboxIndex >= 0}
  close={() => setLightboxIndex(-1)}
  index={lightboxIndex}
  slides={allImages.map(img => ({ src: img }))}
/>
```

---

## 行動裝置優化

### 響應式設計重點

1. **Hero Section**
   - 手機版：縮小高度到 40vh
   - 資訊卡片改為垂直排列

2. **Quick Facts**
   - 手機版：單欄顯示，卡片更大

3. **章節內容**
   - 圖文並排改為上下排列
   - 文字大小調整為 16px

4. **人生清單**
   - 卡片改為全寬
   - 互動按鈕合併為選單

5. **故事網格**
   - 手機版：1欄
   - 平板：2欄
   - 桌面：3欄

```tsx
// Tailwind responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
```

---

## 效能優化

### 1. 圖片優化

```tsx
// 使用 Next.js Image 組件
<Image
  src={imageUrl}
  alt={alt}
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL={thumbnailUrl}
  priority={isFold} // 首屏圖片優先載入
/>
```

### 2. 懶載入

```tsx
// 使用 intersection observer
const LazySection = ({ children }) => {
  const ref = useRef()
  const inView = useInView(ref, { once: true, margin: "100px" })

  return (
    <div ref={ref}>
      {inView ? children : <SectionSkeleton />}
    </div>
  )
}
```

### 3. 動畫效能

```tsx
// 使用 transform 和 opacity（GPU 加速）
// 避免使用 width, height, top, left 等觸發 layout 的屬性
<motion.div
  initial={{ opacity: 0, transform: "translateY(20px)" }}
  animate={{ opacity: 1, transform: "translateY(0)" }}
/>
```

---

## 實作優先順序

### Phase 1: 基礎結構（1-2 天）

- [ ] 建立新的頁面結構（章節式）
- [ ] Hero Section
- [ ] Quick Facts
- [ ] 基本樣式系統

### Phase 2: 核心內容（2-3 天）

- [ ] Chapter 1-2（故事章節）
- [ ] Chapter 3（人生清單互動）
- [ ] Chapter 5（給新手的話）

### Phase 3: 進階功能（2-3 天）

- [ ] 攀岩足跡視覺化
- [ ] 小故事卡片牆
- [ ] 故事 Modal

### Phase 4: 互動優化（1-2 天）

- [ ] 滾動進度指示器
- [ ] 圖片燈箱
- [ ] 浮動操作按鈕
- [ ] 微動畫調整

### Phase 5: 行動裝置優化（1-2 天）

- [ ] RWD 調整
- [ ] 手機版互動優化
- [ ] 效能測試與優化

---

## Icon 使用指南

本專案使用 **Lucide React** 圖標庫，所有 emoji 已替換為對應的 icon 組件。

### 常用 Icon 對照表

| 用途 | Icon 組件 | 說明 |
|-----|----------|------|
| 瀏覽數 | `<Eye />` | 社群統計 |
| 按讚數 | `<Mountain />` | 社群統計（攀岩主題） |
| 追蹤數 | `<Users />` | 社群統計 |
| 留言數 | `<MessageCircle />` | 社群統計 |
| 啟發數 | `<Target />` | 人生清單統計 |
| 日期/年份 | `<Calendar />` | 時間資訊 |
| 地點 | `<MapPin />` | 地理位置 |
| 活動類型 | `<Activity />` | 攀岩類型（抱石、先鋒等） |

### Icon 尺寸規範

```tsx
// 小型 icon（用於內文、標籤）
<Calendar className="h-3.5 w-3.5" />

// 中型 icon（用於統計、資訊卡片）
<Eye className="h-4 w-4" />
<Mountain className="h-5 w-5" />

// 大型 icon（用於 Quick Facts）
<Calendar className="h-6 w-6" />
```

### Icon 顏色使用

```tsx
// 使用專案既有品牌色
<Mountain className="text-brand-dark" />        // 主色調
<Mountain className="text-text-subtle" />       // 次要文字色
<Mountain className="text-gray-600" />          // 中性灰色

// Hover 狀態
<Mountain className="hover:text-brand-accent" /> // 黃色強調
<Mountain className="hover:text-gray-700" />     // 深灰色
```

### 導入方式

```tsx
import {
  Eye,
  Mountain,
  Users,
  MessageCircle,
  Target,
  Calendar,
  MapPin,
  Activity,
  MoreVertical
} from 'lucide-react'
```

---

## 設計資源

### 推薦的 UI 套件

- **Framer Motion** - 動畫（已使用）
- **Radix UI** - 無障礙組件（已使用）
- **React Intersection Observer** - 滾動觸發
- **Swiper** - 輪播/橫向滾動
- **Yet Another React Lightbox** - 圖片燈箱

### 字體建議

- 標題：**Noto Sans TC Bold** 或 **Inter Bold**
- 內文：**Noto Sans TC Regular**
- 強調：**Noto Serif TC** （引言部分）

### 色彩使用指南

**專案現有色彩（tailwind.config.js）：**

```tsx
// 主要色彩
const projectColors = {
  // 品牌色
  'brand-dark': '#1B1A1A',        // 主色調深色（文字、按鈕）
  'brand-dark-hover': '#3F3D3D',  // 深色 hover 狀態
  'brand-light': '#dbd8d8',       // 淺灰色背景（次要按鈕、hover）
  'brand-accent': '#FFE70C',      // 黃色強調色（重點元素）
  'brand-accent-light': '#FAF40A',// 黃色亮色版

  // 文字
  'text-main': '#1B1A1A',         // 主要文字
  'text-subtle': '#6D6C6C',       // 次要文字

  // 背景
  'page-bg': '#f5f5f5',           // 頁面背景
  'page-content-bg': '#f5f5f5',   // 內容區背景

  // 邊框
  'subtle': '#B6B3B3',            // 邊框顏色
}

// 使用範例
<div className="bg-brand-light hover:bg-brand-dark hover:text-white">
  <span className="text-brand-accent">黃色強調</span>
</div>
```

**設計元素色彩應用：**

- **按鈕主色**：`bg-brand-dark text-white hover:bg-brand-dark-hover`
- **強調元素**：`text-brand-accent` 或 `bg-brand-accent`
- **卡片背景**：`bg-white` 或 `bg-gray-50`
- **次要按鈕**：`bg-brand-light hover:bg-gray-300`
- **漸層背景**：`bg-gradient-to-br from-yellow-400 via-brand-accent to-yellow-500`

---

## 總結

這個重新設計的核心理念是**讓人物誌像是在閱讀一本圖文日記**，而不是瀏覽一個資料頁面。透過：

1. **章節式結構** - 清晰的敘事脈絡
2. **多樣化版面** - 避免單調的長文
3. **豐富互動** - 讓讀者主動探索感興趣的內容
4. **視覺節奏** - 圖文穿插、大小卡片交錯
5. **情感連結** - 引言、便條紙等親和力設計

希望這個規劃能幫助你打造一個更生動、更吸引人的人物誌頁面！

---

**下一步建議：**

1. 先實作 Hero Section 和 Quick Facts，確定整體視覺風格
2. 完成一個完整的章節（如Chapter 1），作為範本
3. 逐步完成其他章節
4. 最後加入互動優化和動畫細節
