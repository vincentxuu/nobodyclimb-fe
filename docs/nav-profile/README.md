# Navigation & Profile 系統架構文檔

**版本**: 1.0
**日期**: 2026-01-14
**狀態**: 現行架構整理

---

## 目錄

1. [系統概述](#系統概述)
2. [主站導航系統](#主站導航系統)
3. [Profile 導航系統](#profile-導航系統)
4. [Profile 頁面架構](#profile-頁面架構)
5. [組件清單](#組件清單)
6. [路由結構](#路由結構)
7. [已知問題與改進方向](#已知問題與改進方向)

---

## 系統概述

NobodyClimb 的導航系統分為兩個主要部分：

1. **主站導航 (Main Site Navigation)**: 全站固定在頂部，提供主要功能區導航
2. **Profile 導航 (Profile Navigation)**: Profile 區域專用導航，包含桌機版和手機版

### 設計原則

- **響應式設計**: 桌機版和手機版採用不同的導航模式
- **一致性**: 保持導航結構在不同裝置上的一致性
- **可訪問性**: 清晰的當前頁面指示和易於操作的介面

---

## 主站導航系統

### 組件結構

```
src/components/layout/
└── navbar/
    ├── navbar.tsx              # 主導航欄容器
    ├── Logo.tsx                # 網站 Logo
    ├── UnifiedNav.tsx          # 統一導航連結
    ├── UserMenu.tsx            # 用戶菜單
    ├── SearchBar.tsx           # 搜尋欄
    └── DesktopSearchBar.tsx    # 桌機版搜尋欄
```

### Navbar (主導航欄)

**位置**: `src/components/layout/navbar.tsx`
**類型**: Client Component

#### 主要功能
- 固定在頁面頂部 (fixed top-0 z-[999])
- 滾動時改變背景透明度
- 顯示頁面滾動進度條

#### 組成部分
```tsx
<header>
  <ProgressBar />           // 頁面頂部進度條 (黃色)
  <Logo />                  // 左側 Logo
  <UnifiedNav />           // 中間導航連結
  <UserMenu />             // 右側用戶菜單
</header>
```

### UnifiedNav (統一導航)

**位置**: `src/components/layout/navbar/UnifiedNav.tsx`
**類型**: Client Component

#### 導航連結

```typescript
const NAV_LINKS = [
  { href: '/biography', label: '人物誌' },
  { href: '/crag', label: '岩場' },
  { href: '/gym', label: '岩館' },
  { href: '/gallery', label: '攝影集' },
  { href: '/videos', label: '影片' },
  { href: '/blog', label: '部落格' },
]
```

#### 響應式行為
- **桌機版**: 導航連結居中顯示，水平排列
- **手機版**: 可水平滑動，右側顯示漸層提示可滑動

#### 視覺回饋
- 當前頁面: 底部顯示黑色下劃線
- Hover 狀態: 底部顯示動畫下劃線效果

### UserMenu (用戶菜單)

**位置**: `src/components/layout/navbar/UserMenu.tsx`
**類型**: Client Component

#### 未登入狀態
顯示「登入」按鈕，點擊導向 `/auth/login`

#### 已登入狀態

##### 1. 創作按鈕 (下拉選單)
```
[創作 ▼]
├── 發表文章 → /blog/create
└── 上傳照片 → /upload
```

##### 2. 用戶頭像 (下拉選單)
```
[頭像 ▼]
├── 我的人物誌 → /profile
├── 人生清單 → /profile/bucket-list
├── 我的照片 → /profile/photos
├── 我的文章 → /profile/articles
├── 我的收藏 → /profile/bookmarks
├── ─────────
├── 帳號設定 → /profile/settings
└── 登出
```

#### 頭像顯示邏輯
1. 優先使用用戶上傳的頭像 (`user.avatar`)
2. 若無上傳頭像，使用用戶選擇的預設頭像樣式 (`user.avatarStyle`)
3. 使用 `AvatarWithFallback` 組件處理載入失敗

---

## Profile 導航系統

Profile 區域有**兩個獨立的導航系統**，分別服務於不同的使用場景：

### 1. MobileNav (底部導航列)

**位置**: `src/app/profile/MobileNav.tsx`
**類型**: Client Component
**顯示條件**: 僅在手機版顯示 (`md:hidden`)

#### 定位方式
- 固定在螢幕底部 (`fixed bottom-0`)
- 層級 z-50

#### 主要導航項目 (4個)

| 圖示 | 名稱 | 路由 | 說明 |
|------|------|------|------|
| UserCircle | 人物誌 | `/profile` | 個人人物誌頁面 |
| Target | 清單 | `/profile/bucket-list` | 攀岩目標清單 |
| Image | 照片 | `/profile/photos` | 照片集管理 |
| FileText | 文章 | `/profile/articles` | 我的文章列表 |

#### 更多選單 (3個)

| 圖示 | 名稱 | 路由 | 說明 |
|------|------|------|------|
| BarChart3 | 成就 | `/profile/stats` | 攀岩成就統計 |
| Bookmark | 收藏 | `/profile/bookmarks` | 收藏的文章 |
| Settings | 設定 | `/profile/settings` | 帳號設定 |

#### 互動行為
- 點擊「更多」圖示彈出上方浮動選單
- 點擊外部關閉選單
- 當前頁面高亮顯示 (`text-text-main`)
- 使用 `useRouter` 和 `pathname` 控制導航

### 2. MobileNavigationBar (頂部導航列)

**位置**: `src/components/profile/MobileNavigationBar.tsx`
**類型**: Client Component
**顯示條件**: 僅在手機版顯示

#### 定位方式
- 固定在頁面頂部 (`fixed top-0`)
- 層級 z-50

#### 導航項目 (5個)

| 圖示 | 名稱 | 路由 |
|------|------|------|
| UserCircle | 我的人物誌 | `/profile` |
| FileText | 我的文章 | `/profile/articles` |
| Image | 我的照片 | `/profile/photos` |
| Bookmark | 收藏文章 | `/profile/bookmarks` |
| Settings | 帳號設定 | `/profile/settings` |

#### 視覺設計
- 圖示 + 文字標籤
- 水平排列，平均分配空間
- 白色背景，底部邊框
- Framer Motion 入場動畫

### 兩個導航的差異

| 特性 | MobileNav (底部) | MobileNavigationBar (頂部) |
|------|------------------|---------------------------|
| **位置** | 螢幕底部 | 頁面頂部 |
| **項目數量** | 4 + 更多選單(3) | 5 個直接項目 |
| **設計風格** | 簡潔，主要功能 | 完整列表 |
| **是否有清單頁** | ✅ 有 bucket-list | ❌ 無 |
| **是否有成就頁** | ✅ 有 stats (在更多選單) | ❌ 無 |
| **使用中** | ✅ 在 Profile Layout 中使用 | ⚠️ 未在 Layout 中使用 |

**⚠️ 重要發現**:
- `MobileNavigationBar` 組件存在但**未被使用**
- 目前 Profile Layout 只使用 `MobileNav` (底部導航)
- 可能是開發過程中的遺留組件

---

## Profile 頁面架構

### Profile Layout

**位置**: `src/app/profile/layout.tsx`
**類型**: Client Component

#### 功能
1. **認證檢查**: 未登入時重導向到登入頁
2. **Hydration 處理**: 等待 Zustand store hydration 完成
3. **載入狀態**: 顯示載入動畫
4. **Provider 包裝**: 使用 `ProfileProvider` 提供全局狀態

#### 結構
```tsx
<ProfileProvider>
  <div className="min-h-screen bg-[#F5F5F5] pb-20 md:pb-0">
    {/* 頁面內容 */}
    <div className="pt-2 md:py-6">
      {children}
    </div>

    {/* 手機版底部導航 */}
    <div className="fixed bottom-0 block md:hidden">
      <MobileNav />
    </div>
  </div>
</ProfileProvider>
```

### Profile 主頁

**位置**: `src/app/profile/page.tsx`

#### 結構
```tsx
<ProfilePageLayout>
  <ProfileContainer />
</ProfilePageLayout>
```

### ProfileContainer (核心容器)

**位置**: `src/components/profile/ProfileContainer.tsx`
**類型**: Client Component

#### 資料管理
- 使用 `useProfile()` hook 從 Context 獲取資料
- 編輯模式切換
- 表單驗證與提交

#### 內容區段 (依序排列)

| 區段組件 | 功能 | 資料來源 |
|---------|------|---------|
| `ProfilePageHeader` | 標題 + 編輯按鈕 | - |
| `BasicInfoSection` | 基本資訊 (名稱) | `profileData.name` |
| `ClimbingInfoSection` | 攀岩資訊 (年資、常去岩館、偏好路線) | `startYear`, `frequentGyms`, `favoriteRouteType` |
| `SocialLinksSection` | 社群連結 (IG, FB 等) | `socialLinks` |
| `ClimbingExperienceSection` | 攀岩經驗 (開始原因、意義、建議) | `climbingReason`, `climbingMeaning`, `adviceForBeginners` |
| `AdvancedStoriesSection` | 進階故事 (客製化問答) | `advancedStories` |
| `ClimbingFootprintsSection` | 攀岩足跡 (去過的岩場) | `climbingLocations` |
| `ProfileImageSection` | 圖片集 (照片上傳、排版) | `images`, `imageLayout` |
| `PublicSettingSection` | 公開設定 | `isPublic` |
| `ProfileActionButtons` | 儲存/取消按鈕 | - |

#### 編輯流程
1. 點擊「編輯資料」按鈕 → `handleStartEdit()`
2. 各區段變為可編輯狀態 → `isEditing = true`
3. 修改資料 → 觸發 `handleChange()`
4. 點擊「儲存」→ `handleSave()` 呼叫 API
5. 點擊「取消」→ 恢復原始資料

### Profile 子頁面

| 路由 | 頁面檔案 | 功能 |
|------|---------|------|
| `/profile/articles` | `src/app/profile/articles/page.tsx` | 我的文章列表 |
| `/profile/bookmarks` | `src/app/profile/bookmarks/page.tsx` | 收藏的文章 |
| `/profile/settings` | `src/app/profile/settings/page.tsx` | 帳號設定 |
| `/profile/photos` | `src/app/profile/photos/page.tsx` | 照片管理 |
| `/profile/bucket-list` | `src/app/profile/bucket-list/page.tsx` | 攀岩目標清單 |
| `/profile/stats` | ⚠️ 未實作 | 攀岩成就統計 |

---

## 組件清單

### 主站導航組件

```
src/components/layout/navbar/
├── navbar.tsx              # 主導航容器
├── Logo.tsx                # Logo 組件
├── UnifiedNav.tsx          # 導航連結
├── UserMenu.tsx            # 用戶菜單
├── SearchBar.tsx           # 搜尋欄
├── DesktopSearchBar.tsx    # 桌機搜尋欄
└── index.tsx               # 導出入口
```

### Profile 導航組件

```
src/app/profile/
└── MobileNav.tsx           # 底部導航 (使用中)

src/components/profile/
├── MobileNavigationBar.tsx # 頂部導航 (未使用)
└── MobileNavContext.tsx    # 導航 Context
```

### Profile 內容組件

```
src/components/profile/
├── ProfileContainer.tsx            # 主容器
├── ProfileContext.tsx              # Profile Context Provider
├── ProfilePageHeader.tsx           # 頁面標題
├── ProfileActionButtons.tsx        # 操作按鈕
├── ProfileDivider.tsx              # 分隔線
├── BasicInfoSection.tsx            # 基本資訊區段
├── ClimbingInfoSection.tsx         # 攀岩資訊區段
├── ClimbingExperienceSection.tsx   # 攀岩經驗區段
├── AdvancedStoriesSection.tsx      # 進階故事區段
├── ClimbingFootprintsSection.tsx   # 攀岩足跡區段
├── SocialLinksSection.tsx          # 社群連結區段
├── PublicSettingSection.tsx        # 公開設定區段
└── layout/
    └── ProfilePageLayout.tsx       # Profile 頁面 Layout
```

### Profile 圖片集組件

```
src/components/profile/image-gallery/
├── index.ts                        # 導出入口
├── ProfileImageSection.tsx         # 圖片集主組件
├── ImageGalleryDisplay.tsx         # 圖片展示
├── ImageUploader.tsx               # 圖片上傳
├── ImagePreviewCard.tsx            # 圖片預覽卡
├── ImageCropDialog.tsx             # 圖片裁切對話框
├── SortableImageCard.tsx           # 可排序圖片卡
├── SortableImageGrid.tsx           # 可排序圖片網格
├── LayoutSelector.tsx              # 排版選擇器
└── imageUtils.ts                   # 圖片工具函數
```

---

## 路由結構

### 主站路由

```
/                           # 首頁
├── /biography              # 人物誌列表
├── /crag                   # 岩場
├── /gym                    # 岩館
├── /gallery                # 攝影集
├── /videos                 # 影片
├── /blog                   # 部落格
│   └── /create             # 撰寫文章
├── /upload                 # 上傳照片
└── /auth
    └── /login              # 登入
```

### Profile 路由

```
/profile                    # 我的人物誌 (主頁)
├── /articles               # 我的文章
├── /bookmarks              # 我的收藏
├── /settings               # 帳號設定
├── /photos                 # 我的照片
├── /bucket-list            # 人生清單
└── /stats                  # 攀岩成就 (待實作)
```

### 其他 Profile 相關路由

```
/biography/profile/[id]     # 公開人物誌頁面 (其他用戶)
```

---

## 已知問題與改進方向

### 1. 未使用的組件

**問題**: `MobileNavigationBar.tsx` 組件存在但未被使用

**影響**:
- 程式碼冗余
- 可能造成維護困擾

**建議**:
- 確認是否需要此組件
- 若不需要，應該刪除
- 若需要，應明確使用場景並整合到 Layout

### 2. Profile 導航項目不一致

**問題**: MobileNav 和 MobileNavigationBar 的導航項目不完全相同

| 頁面 | MobileNav | MobileNavigationBar |
|------|-----------|---------------------|
| 人物誌 | ✅ | ✅ |
| 文章 | ✅ | ✅ |
| 照片 | ✅ | ✅ |
| 收藏 | ✅ (在更多選單) | ✅ |
| 設定 | ✅ (在更多選單) | ✅ |
| 清單 | ✅ | ❌ |
| 成就 | ✅ (在更多選單) | ❌ |

**建議**:
- 統一導航項目
- 確定是否保留兩個導航的必要性

### 3. 待實作功能

**待實作頁面**:
- `/profile/stats` - 攀岩成就統計頁面

**導航已存在但頁面未實作**:
- MobileNav 中有「成就」項目，但對應頁面未完成

**建議**:
- 完成 stats 頁面實作
- 或在未完成前從導航中移除

### 4. Profile Layout 認證邏輯

**現況**: 在 Profile Layout 中進行認證檢查

**潛在問題**:
- 每個子頁面都會重新檢查
- 載入狀態可能影響用戶體驗

**建議**:
- 考慮使用 Next.js Middleware 進行路由級別的認證
- 減少重複的認證檢查邏輯

### 5. 響應式斷點一致性

**現況**: 使用 Tailwind 的 `md:` 斷點 (768px)

**檢查項目**:
- 確保所有組件使用一致的斷點
- Profile 和主站導航的響應式行為是否一致

### 6. 用戶頭像菜單項目重複

**問題**: UserMenu 和 MobileNav 有重複的導航項目

**UserMenu 下拉選單**:
- 我的人物誌
- 人生清單
- 我的照片
- 我的文章
- 我的收藏
- 帳號設定

**MobileNav**:
- 人物誌
- 清單
- 照片
- 文章
- 收藏
- 設定

**影響**:
- 桌機版用戶可能混淆
- 導航路徑不清晰

**建議**:
- 桌機版: 在 Profile 頁面內使用側邊欄或標籤頁導航
- 簡化 UserMenu 的 Profile 項目，只保留「我的人物誌」入口

---

## 相關文檔

- [作者個人檔案設計規劃](../author-profile-design.md) - 規劃中的作者公開頁面
- [頁面佈局設計](../page-layout-design.md) - 整體頁面佈局規範
- [人物誌內容規範](../bio/biography-content-spec.md) - 人物誌內容結構

---

## 更新記錄

| 日期 | 版本 | 更新內容 |
|------|------|---------|
| 2026-01-14 | 1.0 | 初始版本，整理現行架構 |
