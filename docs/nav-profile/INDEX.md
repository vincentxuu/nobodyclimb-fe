# Navigation & Profile 系統文檔索引

> 📚 **快速導航**: 找到你需要的文檔

**最後更新**: 2026-01-14

---

## 📖 文檔列表

### 1. [系統架構總覽](./README.md) 👈 **從這裡開始**
**適合**: 新加入的開發者、需要了解整體架構的人

**內容**:
- 🏗️ 系統概述與設計原則
- 🧭 主站導航系統說明
- 📱 Profile 導航系統詳解
- 📄 Profile 頁面架構
- 🗂️ 組件清單
- 🗺️ 路由結構
- ⚠️ 已知問題與改進方向

**閱讀時間**: ~15 分鐘

---

### 2. [技術實作細節](./technical-details.md)
**適合**: 需要實作或修改功能的開發者

**內容**:
- 💻 技術棧說明
- 📊 狀態管理 (Zustand、Context)
- 🔀 路由導航機制
- 🔐 認證流程
- 📱 響應式設計實作
- ⚡ 效能優化技巧
- 🔄 資料流向圖
- 🎨 動畫效果實作
- 🔌 API 整合
- 🎯 型別定義
- ♿ 無障礙設計
- 🐛 錯誤處理

**閱讀時間**: ~25 分鐘

---

### 3. [改進建議](./improvement-proposals.md)
**適合**: 產品經理、技術負責人、想要改進系統的開發者

**內容**:
- 📋 優先級分類
- 🔴 高優先級改進 (立即處理)
  - 清理未使用組件
  - 統一導航項目
  - 實作缺失頁面
- 🟡 中優先級改進 (1-2 週)
  - 優化認證流程
  - 改善手機版體驗
  - 增強桌機版導航
- 🟢 低優先級改進 (視情況)
  - 圖示統一
  - 搜尋功能
  - 動態顯示
- 🚀 長期規劃
  - 通知系統
  - 個人化
  - 多語系

**閱讀時間**: ~20 分鐘

---

## 🎯 快速查詢

### 我是新加入的開發者
```
1. 閱讀 README.md 了解整體架構
2. 查看 technical-details.md 的「技術棧」和「組件結構」
3. 參考 improvement-proposals.md 了解待改進項目
```

### 我要修改導航功能
```
1. README.md → 找到相關組件位置
2. technical-details.md → 了解導航機制和狀態管理
3. 檢查 improvement-proposals.md 是否有相關改進計畫
```

### 我要新增 Profile 頁面
```
1. README.md → 「Profile 頁面架構」了解現有結構
2. technical-details.md → 「路由導航機制」了解路由設定
3. 參考現有頁面 (如 articles/page.tsx) 作為模板
```

### 我要優化效能
```
1. technical-details.md → 「效能優化」查看現有優化
2. improvement-proposals.md → 查看優化建議
3. 使用 React DevTools Profiler 分析瓶頸
```

### 我要修復已知問題
```
1. README.md → 「已知問題與改進方向」
2. improvement-proposals.md → 「高優先級改進」
3. 按照建議方案實作並測試
```

---

## 📁 檔案結構

```
docs/nav-profile/
├── INDEX.md                      # 📍 你在這裡
├── README.md                     # 系統架構總覽
├── technical-details.md          # 技術實作細節
└── improvement-proposals.md      # 改進建議
```

---

## 🔗 相關文檔連結

### 專案層級文檔
- [CLAUDE.md](../../CLAUDE.md) - 專案技術棧和開發指南
- [專案 PRD](../prd/README.md) - 產品需求文檔

### 其他子系統文檔
- [作者個人檔案設計](../author-profile-design.md) - 作者公開頁面規劃
- [人物誌系統](../bio/) - 人物誌功能文檔
- [後端整合](../backend/06-frontend-integration.md) - API 整合指南

---

## 🏷️ 關鍵概念速查

### 導航系統

| 名稱 | 位置 | 用途 |
|------|------|------|
| **Navbar** | `src/components/layout/navbar.tsx` | 全站頂部導航 |
| **UnifiedNav** | `src/components/layout/navbar/UnifiedNav.tsx` | 主導航連結 |
| **UserMenu** | `src/components/layout/navbar/UserMenu.tsx` | 用戶下拉選單 |
| **MobileNav** | `src/app/profile/MobileNav.tsx` | Profile 底部導航 |

### Profile 系統

| 名稱 | 位置 | 用途 |
|------|------|------|
| **ProfileLayout** | `src/app/profile/layout.tsx` | Profile 區域 Layout |
| **ProfileContainer** | `src/components/profile/ProfileContainer.tsx` | 主要內容容器 |
| **ProfileContext** | `src/components/profile/ProfileContext.tsx` | Profile 狀態管理 |

### 狀態管理

| 名稱 | 類型 | 用途 |
|------|------|------|
| **authStore** | Zustand | 全局認證狀態 |
| **ProfileContext** | React Context | Profile 資料狀態 |

### 路由

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/profile` | 我的人物誌 | Profile 主頁 |
| `/profile/articles` | 我的文章 | 文章列表 |
| `/profile/photos` | 我的照片 | 照片管理 |
| `/profile/bookmarks` | 我的收藏 | 收藏列表 |
| `/profile/settings` | 帳號設定 | 設定頁面 |
| `/profile/bucket-list` | 人生清單 | 目標清單 |
| `/profile/stats` | ⚠️ 未實作 | 成就統計 |

---

## ❓ 常見問題

### Q: 為什麼有兩個 Profile 導航組件？
A: `MobileNavigationBar.tsx` 是開發過程中的遺留組件，目前**未被使用**。實際使用的是 `MobileNav.tsx` (底部導航)。建議閱讀 [改進建議 #1](./improvement-proposals.md#1-清理未使用的-mobilenavigationbar-組件)

### Q: Profile 頁面如何判斷用戶是否登入？
A: 在 `ProfileLayout` 中使用 Zustand `authStore` 檢查 `isAuthenticated`。未登入會重導向到 `/auth/login`。詳見 [認證流程](./technical-details.md#認證流程)

### Q: 如何新增 Profile 導航項目？
A: 修改 `src/app/profile/MobileNav.tsx` 的 `mainMenuItems` 或 `moreMenuItems` 陣列。詳見 [README - MobileNav](./README.md#1-mobilenav-底部導航列)

### Q: 為什麼 UserMenu 和 MobileNav 有重複的項目？
A: 這是目前的已知問題。建議閱讀 [改進建議 #2](./improvement-proposals.md#2-統一-profile-導航項目)

### Q: 如何優化 Profile 頁面載入速度？
A: 參考 [效能優化](./technical-details.md#效能優化) 和 [改進建議 #7](./improvement-proposals.md#7-優化-profile-資料載入)

---

## 🛠️ 開發工作流程

### 修改現有功能
```bash
# 1. 查看文檔了解現有架構
open docs/nav-profile/README.md

# 2. 找到相關組件
# 例如: src/components/layout/navbar/UnifiedNav.tsx

# 3. 修改代碼

# 4. 測試
pnpm dev

# 5. 提交
git add .
git commit -m "feat: update navigation ..."
```

### 新增功能
```bash
# 1. 檢查是否已在改進建議中
open docs/nav-profile/improvement-proposals.md

# 2. 參考技術實作文檔
open docs/nav-profile/technical-details.md

# 3. 實作功能

# 4. 更新文檔
# 在 README.md 新增組件說明
# 在 technical-details.md 新增技術細節

# 5. 提交
git add .
git commit -m "feat: add new feature ..."
```

### 修復問題
```bash
# 1. 查看已知問題
open docs/nav-profile/README.md#已知問題與改進方向

# 2. 參考建議方案
open docs/nav-profile/improvement-proposals.md

# 3. 修復問題

# 4. 測試

# 5. 更新文檔 (移除已解決的問題)

# 6. 提交
git add .
git commit -m "fix: resolve known issue ..."
```

---

## 📊 文檔更新記錄

| 日期 | 文檔 | 更新內容 |
|------|------|---------|
| 2026-01-14 | 全部 | 初始版本建立 |

---

## 💡 貢獻指南

### 更新文檔時請：
1. ✅ 保持文檔同步更新
2. ✅ 使用清晰的標題和結構
3. ✅ 提供程式碼範例
4. ✅ 更新索引和連結
5. ✅ 記錄更新日期和版本

### 文檔風格：
- 使用 Emoji 增強可讀性 📚
- 提供「適合」和「閱讀時間」資訊
- 包含「快速查詢」和常見問題
- 使用表格整理資訊
- 提供完整的程式碼範例

---

## 📞 聯絡方式

如有任何問題或建議，請：
- 📝 在 GitHub 開 Issue
- 💬 在團隊 Slack 頻道討論
- 📧 聯絡技術負責人

---

**Happy Coding! 🚀**
