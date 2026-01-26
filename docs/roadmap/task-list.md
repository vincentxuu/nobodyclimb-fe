# NobodyClimb 開發任務清單

> **版本**：v1.0
> **更新日期**：2026-01-27

---

## 專案現況

```
MVP 功能實作進度：100% 🎉

✅ 已完成：故事評論系統、通知系統、匿名故事分享、追蹤/按讚、首頁精選故事、引導式問答 UI、OG Image
⏸️ 持續進行：效能優化、Bug 修復
```

---

## 開發分支

**分支**：`feature/mvp-completion`

---

## Sprint 3：首頁精選故事整合 ✅ 已完成

**Commit Message**：`feat: add featured stories section to homepage`

| # | 任務 | 狀態 |
|---|------|------|
| 1 | 實作精選故事卡片組件 | ✅ |
| 2 | 首頁新增精選故事區塊 | ✅ |

### 相關 API（已完成）

```
GET /api/v1/content/popular/core-stories
GET /api/v1/content/popular/one-liners
GET /api/v1/content/popular/stories
```

### 交付物

- [x] `src/components/home/featured-stories-section.tsx`
- [x] 整合到 `src/app/page.tsx`

---

## Sprint 4：引導式體驗優化 ✅ 已完成

**Commit Message**：`feat: add guided onboarding experience for new users`

| # | 任務 | 狀態 |
|---|------|------|
| 3 | 設計並實作引導式問答 UI 組件 | ✅ |
| 4 | 調整註冊後引導流程 | ✅ |
| 5 | 實作空狀態設計與鼓勵文案 | ✅ |

### 交付物

- [x] `src/components/onboarding/GuidedQuestions.tsx`
- [x] `src/components/onboarding/EmptyStateCard.tsx`
- [x] 改善後的註冊引導流程（`src/app/auth/profile-setup/complete/page.tsx`）

---

## Sprint 5：分享優化與上線準備 ✅ 已完成

**Commit Message**：`feat: implement OG image generation for social sharing`

| # | 任務 | 狀態 |
|---|------|------|
| 6 | 設計 OG Image 模板 | ✅ |
| 7 | 實作 OG Image 自動生成 | ✅ |
| 8 | 效能優化 | ⏸️ 持續進行 |
| 9 | Bug 修復 | ⏸️ 持續進行 |

### 交付物

- [x] `src/app/biography/profile/[slug]/opengraph-image.tsx`
- [ ] 效能優化完成（持續進行）
- [ ] 無重大 Bug（持續進行）

---

## 可選功能：快速反應按鈕 ✅ 已完成

**Commit Message**：`feat: add quick reaction buttons for stories`

> 目前「按讚」功能已可滿足基本互動需求，此功能為體驗增強。

| # | 任務 | 狀態 |
|---|------|------|
| 10 | 建立 reactions 資料表 | ✅ |
| 11 | 實作快速反應 API | ✅ |
| 12 | 實作 QuickReactionBar 組件 | ✅ |

### 功能說明

| 快速反應 | Key | Icon | 說明 |
|---------|-----|------|------|
| 我也是 | `me_too` | HandMetal | 表達相同經歷或感受 |
| +1 | `plus_one` | ThumbsUp | 表示認同 |
| 說得好 | `well_said` | MessageSquareHeart | 讚賞表達方式 |

### 交付物

- [x] `backend/migrations/0029_create_reactions_table.sql`
- [x] `backend/src/routes/biography-content.ts` 新增 reaction 路由
- [x] `backend/src/services/biography-content-interactions-service.ts` 新增 reaction 邏輯
- [x] `src/components/biography/display/QuickReactionBar.tsx`
- [x] `src/lib/api/services.ts` 新增 reaction API

---

## 任務優先級摘要

**統一分支**：`feature/mvp-completion`

| 優先級 | Sprint | 任務數 | 狀態 |
|--------|--------|--------|------|
| ✅ 完成 | Sprint 3：首頁精選故事 | 2 | 已完成 |
| ✅ 完成 | Sprint 4：引導式體驗 | 3 | 已完成 |
| ✅ 完成 | Sprint 5：分享優化 | 4 | 已完成 |
| ✅ 完成 | 快速反應按鈕 | 3 | 已完成 |

---

## 相關文件

| 文件 | 說明 |
|------|------|
| [README.md](./README.md) | 產品開發路線圖 |
| [current-status.md](./current-status.md) | MVP 功能實作狀態 |
| [development-timeline.md](./development-timeline.md) | 開發時程表 |
| [quick-reaction-design.md](./quick-reaction-design.md) | 快速反應功能設計 |

---

## 更新記錄

| 日期 | 版本 | 更新內容 |
|------|------|----------|
| 2026-01-27 | v1.0 | 初始版本 |
