# Icon 使用指南

本文件記錄專案中所有 Lucide React icon 的使用情況，供開發時參考，避免重複使用或誤用。

## 圖標庫

專案使用 [Lucide React](https://lucide.dev/) 作為圖標庫。

```bash
pnpm add lucide-react
```

```tsx
import { IconName } from 'lucide-react'
```

---

## 使用原則

### 1. 一致性原則
- 同一概念應使用相同的 icon
- 避免同一個 icon 代表不同的功能

### 2. 已保留用途的 Icon（請勿挪用）

| Icon | 保留用途 | 說明 |
|------|----------|------|
| `Mountain` | 按讚功能 | 攀岩主題的按讚按鈕 |
| `Gauge` | 攀岩資訊 | 個人檔案中的攀岩資訊區塊 |
| `User` | 使用者/個人資料 | 代表使用者相關功能 |
| `Target` | 目標/願望清單 | Bucket List 功能 |
| `Bookmark` | 收藏功能 | 收藏文章、路線等 |
| `MapPin` | 地點資訊 | 所有地點相關顯示 |

### 3. 尺寸規範

| 使用情境 | 建議尺寸 |
|----------|----------|
| 導航列 | `h-5 w-5` |
| 卡片標題 | `h-5 w-5` |
| 按鈕內 | `h-4 w-4` |
| 行內文字 | `h-3.5 w-3.5` |
| 大型展示 | `h-6 w-6` |

---

## Icon 清單（依功能分類）

### 導航 & UI 控制

| Icon | 檔案位置 | 用途 |
|------|----------|------|
| `Menu` | `layout/navbar/MobileMenu.tsx` | 手機版漢堡選單 |
| `X` | `ui/sheet.tsx`, `ui/toast.tsx`, 多個 dialog | 關閉按鈕 |
| `ChevronLeft` | `home/hero-article.tsx`, `gallery/photo-popup.tsx` | 向左切換（輪播、分頁） |
| `ChevronRight` | `gallery/photo-popup.tsx`, `ui/breadcrumb.tsx`, 多處 | 向右切換、展開指示 |
| `ChevronDown` | `home/explore-crag-section.tsx`, `ui/select.tsx` | 下拉選單、摺疊展開 |
| `ChevronUp` | `ui/back-to-top.tsx` | 收起、回到頂部 |
| `ArrowLeft` | `app/auth/login/page.tsx`, `crag/route-sidebar.tsx` | 返回上一頁 |
| `ArrowRight` | `home/gym-highlights.tsx`, `home/gallery-section.tsx` | 「查看更多」連結 |
| `ArrowDown` | `home/hero.tsx` | 向下滾動提示 |
| `Search` | `layout/navbar/SearchBar.tsx`, `ui/search-input.tsx` | 搜尋功能 |
| `Home` | `app/crag/error.tsx` | 返回首頁 |
| `MoreHorizontal` | `ui/collapsible-breadcrumb.tsx` | 更多選項 |
| `GripVertical` | `profile/image-gallery/SortableImageCard.tsx` | 拖曳排序手把 |

### 使用者 & 個人檔案

| Icon | 檔案位置 | 用途 |
|------|----------|------|
| `User` | `profile/dashboard/ProfileDashboard.tsx`, `blog/CommentSection.tsx` | 使用者頭像、基本資料 |
| `UserCircle` | `ProfileSidebar.tsx`, `profile/MobileNav.tsx` | 個人檔案導航 |
| `UserPlus` | `biography/follow-button.tsx`, `app/auth/register/page.tsx` | 追蹤、註冊 |
| `UserMinus` | `biography/follow-button.tsx` | 取消追蹤 |
| `Users` | `biography/stats/community-stats.tsx`, `biography/story-prompt-modal.tsx` | 社群、群組功能 |
| `Settings` | `ProfileSidebar.tsx` | 設定頁面 |
| `Gauge` | `profile/dashboard/ProfileDashboard.tsx`, `ProfileEditorVersionA/B/C.tsx` | 攀岩資訊區塊 |

### 攀岩 & 岩場

| Icon | 檔案位置 | 用途 |
|------|----------|------|
| `Mountain` | `biography/like-button.tsx`, `biography/biography-like-button.tsx`, `crag/route-section.tsx` | **按讚按鈕**、路線區塊 |
| `MapPin` | `home/explore-crag-section.tsx`, `gallery/upload-photo-dialog.tsx`, 多處 | 地點資訊 |
| `Globe` | `profile/dashboard/ProfileDashboard.tsx`, `biography/climbing-footprints-editor.tsx` | 全球、公開設定 |
| `Ruler` | `crag/route-section.tsx`, `crag/route-preview-panel.tsx` | 路線長度 |
| `Calendar` | `app/crag/page.tsx`, `biography/climbing-location-card.tsx` | 日期資訊 |
| `Car` | `crag/intro-section.tsx` | 交通方式 |
| `Clock` | `app/crag/page.tsx` | 時間資訊 |
| `Camera` | `crag/traffic-cameras-card.tsx` | 即時影像 |

### 天氣

| Icon | 檔案位置 | 用途 |
|------|----------|------|
| `Cloud` | `layout/weather/index.tsx`, `shared/weather-display.tsx` | 天氣資訊 |
| `Umbrella` | `crag/weather-card.tsx` | 降雨 |
| `ThermometerSun` | `shared/weather-display.tsx` | 溫度 |
| `Droplets` | `shared/weather-display.tsx` | 濕度 |

### 內容 & 媒體

| Icon | 檔案位置 | 用途 |
|------|----------|------|
| `Play` | `videos/video-card.tsx`, `home/featured-videos-section.tsx` | 影片播放 |
| `Youtube` | `crag/youtube-live-card.tsx`, `crag/route-section.tsx` | YouTube 連結 |
| `ImageIcon` | `ProfileSidebar.tsx`, `editor/ImageUploader.tsx` | 照片區塊 |
| `ImagePlus` | `profile/image-gallery/ProfileImageSection.tsx` | 新增照片 |
| `FileText` | `ProfileSidebar.tsx`, `app/blog/page.tsx` | 文章/部落格 |
| `BookOpen` | `biography/story-card.tsx`, `profile/dashboard/ProfileDashboard.tsx` | 故事功能 |
| `Eye` | `crag/route-section.tsx`, `biography/stats/stats-overview.tsx` | 瀏覽次數 |
| `EyeOff` | `app/auth/register/page.tsx`, `app/auth/login/page.tsx` | 隱藏密碼 |
| `Video` | `ui/empty-state.tsx` | 影片空狀態 |

### 社群互動

| Icon | 檔案位置 | 用途 |
|------|----------|------|
| `MessageCircle` | `blog/CommentSection.tsx`, `biography/comment-section.tsx` | 留言/評論 |
| `MessageSquare` | `app/biography/explore/location/[name]/page.tsx` | 評論（位置探索） |
| `Send` | `biography/comment-section.tsx`, `app/blog/create/page.tsx` | 送出留言/發布 |
| `Bookmark` | `ProfileSidebar.tsx`, `profile/MobileNav.tsx` | 收藏功能 |
| `BookmarkPlus` | `biography/reference-button.tsx` | 加入收藏 |
| `BookmarkMinus` | `biography/reference-button.tsx` | 移除收藏 |
| `Share` | `shared/share-button.tsx` | 分享按鈕 |
| `Link2` | `profile/dashboard/ProfileEditorVersionA.tsx`, `shared/share-button.tsx` | 複製連結 |
| `ExternalLink` | `videos/video-player.tsx`, `crag/youtube-live-card.tsx` | 外部連結 |
| `Instagram` | `biography/social-links.tsx`, `profile/SocialLinksSection.tsx` | Instagram 連結 |

### 目標 & 成就

| Icon | 檔案位置 | 用途 |
|------|----------|------|
| `Target` | `ProfileSidebar.tsx`, `profile/MobileNav.tsx`, `app/profile/bucket-list/page.tsx` | 目標/願望清單 |
| `ListTodo` | `biography/bucket-list-section.tsx` | Bucket List |
| `Trophy` | `lib/constants/badges.ts`, `app/profile/stats/page.tsx` | 成就獎盃 |
| `Award` | `lib/constants/badges.ts` | 獎項徽章 |
| `Medal` | `lib/constants/badges.ts` | 獎牌 |
| `Flame` | `lib/constants/badges.ts`, `biography/explore/trending-goals.tsx` | 熱門/趨勢 |
| `Sparkles` | `profile/dashboard/ProfileDashboard.tsx`, `biography/reference-button.tsx` | 進階故事、特殊功能 |
| `Sprout` | `lib/constants/badges.ts` | 新手徽章 |
| `Plane` | `lib/constants/badges.ts` | 國際旅行徽章 |

### 統計 & 數據

| Icon | 檔案位置 | 用途 |
|------|----------|------|
| `BarChart3` | `ProfileSidebar.tsx`, `profile/MobileNav.tsx` | 統計頁面導航 |
| `BarChart` | `biography/story-prompt-modal.tsx` | 故事統計 |
| `TrendingUp` | `biography/stats/community-stats.tsx` | 成長趨勢 |
| `Activity` | `biography/stats/community-stats.tsx` | 活動統計 |

### 表單 & 操作

| Icon | 檔案位置 | 用途 |
|------|----------|------|
| `Plus` | `editor/TagSelector.tsx`, `bucket-list/bucket-list-form.tsx` | 新增項目 |
| `Trash2` | `bucket-list/bucket-list-form.tsx`, `biography/comment-section.tsx` | 刪除 |
| `Edit2` | `app/profile/photos/page.tsx`, `app/profile/articles/page.tsx` | 編輯 |
| `Edit3` | `lib/constants/badges.ts` | 編輯（徽章） |
| `Pencil` | `profile/dashboard/ProfileEditorVersionB.tsx` | 編輯模式 |
| `Save` | `profile/dashboard/ProfileEditorVersionA.tsx`, `app/blog/create/page.tsx` | 儲存 |
| `Upload` | `gallery/upload-photo-dialog.tsx`, `app/upload/page.tsx` | 上傳 |
| `UploadCloud` | `editor/ImageUploader.tsx` | 雲端上傳 |
| `Scissors` | `profile/image-gallery/ImageUploader.tsx` | 裁切圖片 |
| `RotateCcw` | `profile/image-gallery/ImageCropDialog.tsx` | 重設/復原 |

### 狀態指示

| Icon | 檔案位置 | 用途 |
|------|----------|------|
| `Check` | `profile/dashboard/ProfileDashboardCard.tsx`, `bucket-list/progress-tracker.tsx` | 完成/勾選 |
| `CheckCircle` | `gallery/upload-photo-dialog.tsx`, `app/auth/forgot-password/page.tsx` | 成功狀態 |
| `CheckCircle2` | `bucket-list/biography-bucket-list.tsx` | 完成項目 |
| `Circle` | `bucket-list/progress-tracker.tsx` | 未完成項目 |
| `Loader2` | 多處（19+ 個檔案） | 載入中動畫 |
| `AlertCircle` | `gallery/upload-photo-dialog.tsx`, `crag/traffic-cameras-card.tsx` | 錯誤/警告 |
| `AlertTriangle` | `app/crag/error.tsx` | 錯誤頁面 |
| `RefreshCw` | `app/crag/error.tsx` | 重新整理 |
| `Info` | `crag/info-card.tsx`, `biography/story-prompt-modal.tsx` | 資訊提示 |

### 認證 & 安全

| Icon | 檔案位置 | 用途 |
|------|----------|------|
| `Lock` | `app/auth/login/page.tsx`, `app/auth/forgot-password/page.tsx` | 密碼欄位 |
| `KeyRound` | `app/auth/forgot-password/page.tsx` | 重設密碼 |
| `Mail` | `layout/footer.tsx`, `app/auth/register/page.tsx` | Email 欄位 |
| `LogIn` | `app/auth/login/page.tsx` | 登入按鈕 |
| `LogOut` | `layout/navbar/MobileMenu.tsx` | 登出按鈕 |

---

## 未使用的常用 Icon（可用於新功能）

以下 icon 在專案中尚未使用，可用於新功能：

| Icon | 建議用途 |
|------|----------|
| `Dumbbell` | 運動/訓練相關 |
| `Heart` | 喜愛功能（若不用 Mountain） |
| `Star` | 評分（目前僅 gym-highlights 使用） |
| `Bell` | 通知功能 |
| `Filter` | 篩選功能 |
| `SortAsc` / `SortDesc` | 排序功能 |
| `Download` | 下載功能 |
| `Copy` | 複製功能 |
| `Maximize` / `Minimize` | 全螢幕切換 |
| `Zap` | 能量/快速功能 |
| `Shield` | 安全/隱私設定 |
| `HelpCircle` | 幫助/FAQ |

---

## 新增 Icon 前的檢查清單

在新增 icon 之前，請確認：

- [ ] 該功能是否已有對應的 icon？（查閱上方清單）
- [ ] 該 icon 是否已被其他功能使用？
- [ ] icon 的語意是否符合功能？
- [ ] 尺寸是否符合使用情境？

---

## 相關資源

- [Lucide Icons 官網](https://lucide.dev/icons/)
- [Lucide React 文件](https://lucide.dev/guide/packages/lucide-react)

---

## 更新紀錄

| 日期 | 變更內容 |
|------|----------|
| 2026-01-17 | 建立文件，記錄所有 icon 使用情況 |
| 2026-01-17 | 攀岩資訊 icon 從 `Mountain` 改為 `Gauge` |
