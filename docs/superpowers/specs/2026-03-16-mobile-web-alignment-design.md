# Mobile ↔ Web 功能與 UI 對齊設計文件

**日期**：2026-03-16
**範圍**：`apps/mobile` 對齊 `apps/web` 的功能與視覺一致性
**方向**：雙軌並行（Track 1 設計系統補齊 + Track 2 功能模組補齊）

---

## 背景

NobodyClimb mobile app 與 web app 共用 `packages/constants/src/theme.ts` 的設計 token（顏色、字體、間距），但在 UI 元件完整度與功能覆蓋上仍有差距。本次對齊目標：

1. **視覺對齊**：確保兩端使用相同 token，補齊缺少的 UI 元件
2. **行為對齊**：補齊 mobile 缺少的用戶功能頁面

---

## 現狀分析

### 設計系統

| 項目 | 狀態 |
|------|------|
| 設計 token 共用（顏色、字體、間距） | ✅ 已透過 `@nobodyclimb/constants` 共用 |
| Mobile UI 元件數量 | 35 個 |
| Web UI 元件數量 | 37 個 |
| Hardcoded hex 值 | 部分存在，需稽核 |

### 功能差距

| 功能 | Web 路由 | Mobile 狀態 |
|------|---------|------------|
| 攀登記錄 | `/profile/ascents` | ❌ 缺少 |
| 個人統計 | `/profile/stats` | ❌ 缺少 |
| AI 記憶 | `/profile/ai-memory` | ❌ 缺少 |
| 路線推薦 | `/profile/recommendations` | ❌ 缺少 |
| Story Type 路由 | `/story/[type]/[id]` | ❌ 缺少 |

> **備註**：Admin 功能（管理後台、AI log 管理等）設計上不移植到 mobile，屬合理架構決策。

---

## 實作計畫

### 執行順序

```
Track 1 (設計系統) → PR-1 (Ascents) → PR-2 (Stats) → PR-3 (AI Memory) → PR-4 (Recommendations) → PR-5 (Story)
```

---

## Track 1：設計系統補齊

**目標**：為後續功能 PR 建立一致的視覺基礎。

### 1-1 補齊缺少的 UI 元件

新增至 `apps/mobile/src/components/ui/`：

| 元件 | 實作方式 |
|------|---------|
| `ConfirmDialog` | 基於現有 `Dialog` 元件封裝（選用 Dialog 而非 Sheet，保持與 web 一致的模態確認語義），加入確認/取消按鈕與 loading 狀態 |
| `MarkdownText` | 需先安裝 `react-native-markdown-display`（需確認 Expo SDK 54 相容性），套用 constants token 樣式 |
| `PlaceholderImage` | Tamagui `View` + skeleton 動畫，尺寸與 web 版一致 |

### 1-2 Hardcoded 值稽核

- 掃描 `apps/mobile/src/components/` 所有硬編碼 hex 值
- 替換成 `@nobodyclimb/constants` 的對應 token
- 同步修正 web `apps/web/src/components/ui/button.tsx` 的 `#1B1A1A`、`#ffe70c` 改用 CSS 變數

### 1-3 字體載入確認

- 確認 mobile 已正確載入 `Noto Sans TC`、`Glow Sans TC`、`Allerta Stencil`
- 確認 iOS / Android 兩端字體渲染一致

---

## PR-1：Ascents 攀登記錄

### 新增路由

> **路由架構說明**：Mobile profile 子頁面遵循現有模式，放在 `apps/mobile/app/profile/`（Stack navigator），而非 `(tabs)/profile/`（tab 頁面）。需同步更新 `apps/mobile/app/profile/_layout.tsx` 註冊新 screen。

| 路由 | 說明 |
|------|------|
| `apps/mobile/app/profile/ascents/index.tsx` | 記錄列表頁 |
| `apps/mobile/app/profile/ascents/create.tsx` | 多步驟新增流程 |

### 新增元件（`apps/mobile/src/components/ascent/`）

| 元件 | 說明 |
|------|------|
| `AscentCard` | 單筆記錄：類型 badge、路線名、岩場、難度、次數、星評、照片 carousel |
| `AscentForm` | 編輯表單：類型選擇、日期、次數、評分（5星）、筆記、照片上傳、YouTube/IG 連結 |
| `AscentTypeSelect` | 8 種攀登類型的 2×4 格子選擇器（redpoint / flash / onsight / attempt / toprope / lead / seconding / repeat）|
| `CreateAscentFlow` | 多步驟建立：岩場選擇 → 區域 → 路線 → 表單 |

### 頁面功能

- **頂部統計**（4 張卡片）：總記錄數、獨特路線數、獨特岩場數、最高難度
- **篩選**：類型篩選 + 岩場篩選（BottomSheet 展開）
- **列表**：每頁 10 筆，可滑動刪除或點擊編輯
- **新增**：FAB 浮動按鈕，進入 `CreateAscentFlow`

### API

| 端點 | 說明 |
|------|------|
| `GET /ascents` | 分頁取得記錄，支援 type / crag 篩選 |
| `GET /ascents/stats` | 取得統計資料 |
| `POST /ascents` | 建立新記錄 |
| `PUT /ascents/:id` | 更新記錄 |
| `DELETE /ascents/:id` | 刪除記錄 |

### Profile Tab 入口
在 `profile/index.tsx` 選單加入「攀登記錄」（Mountain icon），連結至 `/profile/ascents`。

---

## PR-2：Stats 個人統計

### 新增路由

| 路由 | 說明 |
|------|------|
| `apps/mobile/app/profile/stats/index.tsx` | 統計看板頁 |

### 元件（`apps/mobile/src/components/biography/stats/`）

> **注意**：`CircularProgress`、`ProgressBar`、`StatCard`、`StatsOverview`、`BadgeShowcase` 在 web 已存在，需移植為 React Native 版本（用 `react-native-svg` 取代 SVG/CSS）。`BarChart` 是唯一全新元件。

| 元件 | 狀態 | 說明 |
|------|------|------|
| `CircularProgress` | 移植（web → RN） | SVG 圓形進度圖，`react-native-svg` 實作 |
| `ProgressBar` | 移植（web → RN） | 水平進度條，顯示 label + ratio |
| `BarChart` | **全新** | 水平 bar chart，用於故事分布等 |
| `StatCard` | 移植（web → RN） | icon + 數值 + 標籤卡片，可選趨勢指標 |
| `StatsOverview` | 移植（web → RN） | 主統計看板，組合以上元件 |
| `BadgeShowcase` | 移植（web → RN） | 徽章展示，含類別篩選，顯示解鎖狀態與進度 |

### 頁面區塊

1. **頂部摘要**（4 張卡片）：總瀏覽、收到的讚、已解鎖徽章、完成目標
2. **故事完成度**：圓形進度 + 核心/進階故事 bar chart
3. **目標達成率**：圓形進度 + 分類統計
4. **社群互動**：追蹤者、追蹤中、讚、瀏覽 4 格統計
5. **徽章展示**：類別篩選 tabs + 徽章格子（解鎖/未解鎖狀態）

### 實作注意

- 所有圖表用 `react-native-svg` 自製，不引入外部圖表庫
- 動畫用 Tamagui `animation` prop 或 React Native `Animated` API

### Profile Tab 入口
在 profile 選單加入「統計」（BarChart2 icon），連結至 `/profile/stats`。

---

## PR-3：AI Memory AI 記憶

### 新增路由

| 路由 | 說明 |
|------|------|
| `apps/mobile/app/profile/ai-memory/index.tsx` | AI 記憶列表頁 |

### 頁面功能

每筆記憶顯示：
- **Key 標籤**（中文）：攀岩程度 / 偏好地區 / 偏好類型 / 偏好岩場 / 攀岩目標
- **Type badge**：藍色「偏好」/ 紫色「行為」/ 翠綠「事實」
- **記憶內容**：純文字
- **相對時間**：幾小時前 / 幾天前

**操作**：
- 每筆右側 Trash2 刪除按鈕
- 點擊後出現 `ConfirmDialog`（由 Track 1 新增）
- 刪除後 Toast 提示「記憶已刪除」

**空狀態**：Brain icon + 「AI 會在你提問後自動學習你的偏好，目前尚無記憶」

### API

| 端點 | 說明 |
|------|------|
| `GET /ai/memory` | 取得所有記憶（依 updated_at DESC） |
| `DELETE /ai/memory/:id` | 刪除單筆記憶 |

### Profile Tab 入口
在 profile 選單加入「AI 記憶」（Brain icon），連結至 `/profile/ai-memory`。

---

## PR-4：Recommendations 路線推薦

### 新增路由

| 路由 | 說明 |
|------|------|
| `apps/mobile/app/profile/recommendations/index.tsx` | 推薦列表頁 |

### 新增元件（`apps/mobile/src/components/ai/`）

| 元件 | 說明 |
|------|------|
| `MarkdownText` | Markdown 渲染（粗體、列表、標題、連結等），使用 Track 1 新增的元件 |
| `SourceCard` | 來源卡片：路線 / 岩場 / 影片，含類型 icon 與可點擊連結 |
| `RecommendationCard` | 可折疊推薦卡片：觸發類型 badge、完攀筆數、日期；展開後顯示 MarkdownText + SourceCard 列表 |

### 頁面功能

1. **頂部**：「重新推薦」按鈕（含 AI 配額扣除）
2. **首次載入輪詢**：最多 3 次，間隔 2 秒，等待系統自動生成
3. **列表**：可折疊 `RecommendationCard`，每次載入 10 筆
4. **空狀態**：Sparkles icon + 「完成第一筆完攀後，AI 將為你推薦下一條路線」+ 「立即推薦」按鈕
5. **錯誤處理**：配額用完 Toast「今日 AI 配額已用完，明日重置」/ 失敗 Toast「推薦生成失敗，請稍後再試」

### API

| 端點 | 說明 |
|------|------|
| `GET /ai/recommendations` | 分頁取得推薦（limit / offset） |
| `POST /ai/recommendations` | 觸發手動推薦生成 |

### Profile Tab 入口
在 profile 選單加入「路線推薦」（Sparkles icon），連結至 `/profile/recommendations`。

---

## PR-5：Story Type 動態路由

### 新增路由

> **路由架構說明**：`story/[type]/[id]` 是新的雙層動態路由，現有 mobile 慣例（`blog/[id].tsx`、`biography/[slug].tsx`）只有單層。需新增兩個 layout 檔案讓 Expo Router 正確處理巢狀動態 segment：
> - `apps/mobile/app/story/_layout.tsx`
> - `apps/mobile/app/story/[type]/_layout.tsx`

| 路由 | 說明 |
|------|------|
| `apps/mobile/app/story/_layout.tsx` | Stack layout（新增） |
| `apps/mobile/app/story/[type]/_layout.tsx` | 巢狀 Stack layout（新增） |
| `apps/mobile/app/story/[type]/[id]/index.tsx` | 動態路由，支援 3 種 story type |

### 支援的 Story Types

| Type | 標題來源 | 額外顯示 |
|------|---------|---------|
| `core-stories` | `title \|\| '核心故事'` | — |
| `one-liners` | `question \|\| '一句話'` | 問題文字 |
| `stories` | `title \|\| category_name \|\| '小故事'` | 分類 emoji + 字數 |

### 頁面結構（三種 type 共用）

- 作者頭像 + 名稱 + 頭銜
- 發布時間
- 內文（正規化換行處理）
- `ContentInteractionBar`（重用 mobile biography 現有元件）：快速反應 + 讚 + 留言
- **相關故事**：最多 3 筆同作者其他類型故事，連結至 `/story/[type]/[id]`

### 路由驗證

無效 type 導向 404 頁面。

### API

| 端點 | 說明 |
|------|------|
| `GET /content/core-stories/:id/detail` | 取得核心故事詳情 |
| `GET /content/one-liners/:id/detail` | 取得一句話詳情 |
| `GET /content/stories/:id/detail` | 取得小故事詳情 |

---

## 元件重用策略

| 元件類別 | 策略 |
|---------|------|
| 互動 bar（讚、留言、快速反應） | 重用 `apps/mobile/src/components/biography/display/ContentInteractionBar` |
| Toast 通知 | 重用現有 `Toast` 元件 |
| BottomSheet | 重用現有 `BottomSheet` 元件 |
| 分頁載入 | 重用現有 `LoadMoreButton` 元件 |
| 骨架載入 | 重用現有 `Skeleton` 元件 |

---

## 不在此次範圍內

- Admin 管理功能（設計上屬 web-only）
- AI Chat Widget（需要另外評估 mobile UX）
- Instagram 整合頁面
- `rank` 等級系統顯示元件
