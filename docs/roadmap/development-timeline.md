# NobodyClimb 開發時程表

> **版本**：v1.2
> **更新日期**：2026-01-27

---

## 專案現況摘要

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              專案實作現況                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ MVP 核心功能已完成：                                                     │
│     • 用戶系統（Google OAuth、Email、JWT）                                   │
│     • 人物誌系統（34 個故事欄位、展示頁面）                                    │
│     • 故事評論系統（支援核心故事、一句話、深度故事）                            │
│     • 故事按讚系統（likes 表完整支援）                                        │
│     • 通知系統（15 種類型完整）                                              │
│     • 追蹤/按讚功能                                                          │
│     • 人生清單、徽章、排行榜、足跡                                           │
│     • 匿名故事分享系統（新功能）                                             │
│     • 熱門故事 API                                                          │
│                                                                             │
│  ⚠️ 可優化項目：                                                             │
│     • 首頁精選故事整合（API 已有）                                           │
│     • 引導式問答 UI                                                          │
│     • OG Image 分享預覽                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 開發時程（根據 2026-01-27 現況調整）

### 週次概覽

```
✅ 已完成      當前          下一步
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Sprint  │  │ Sprint 3│  │ Sprint 4│
│ 1-2     │  │         │  │         │
│故事評論 │→ │首頁整合 │→ │引導優化 │
│通知系統 │  │精選故事 │  │上線準備 │
└─────────┘  └─────────┘  └─────────┘
     ✅           🟡           🟢
    已完成       當前        下一步
```

> ✅ **重大更新**：故事評論系統、通知系統已完成！剩餘工作為體驗優化。

---

## Sprint 1-2：故事評論系統與通知 ✅ 已完成

### 目標
實作 MVP 核心功能——故事評論系統，這是驗證「故事飛輪」假設的關鍵

### 完成狀態

#### 資料庫（Migration 0027 已完成）

| 任務 | 狀態 |
|------|------|
| comments 表支援 core_story, one_liner, story | ✅ 已完成 |
| likes 表支援故事類型 | ✅ 已完成 |
| like_count/comment_count 自動維護 | ✅ 已完成 |
| 15 種通知類型支援 | ✅ 已完成 |

#### 後端 API（biography-content.ts 已完成）

| 端點 | 狀態 |
|------|------|
| GET /core-stories/:id/comments | ✅ 已完成 |
| POST /core-stories/:id/comments | ✅ 已完成 |
| POST /core-stories/:id/like | ✅ 已完成 |
| DELETE /core-story-comments/:id | ✅ 已完成 |
| 一句話、深度故事同樣完整支援 | ✅ 已完成 |
| GET /popular/core-stories | ✅ 已完成 |
| GET /popular/one-liners | ✅ 已完成 |
| GET /popular/stories | ✅ 已完成 |

#### 前端組件

| 組件 | 狀態 |
|------|------|
| ContentCommentSheet（故事評論 Sheet） | ✅ 已完成 |
| ContentLikeButton（內容按讚按鈕） | ✅ 已完成 |
| StoryCard（故事卡片） | ✅ 已完成 |
| BiographyCoreStories | ✅ 已完成 |
| BiographyOneLiners | ✅ 已完成 |
| BiographyStories | ✅ 已完成 |

### 已完成的資料庫 Schema

```sql
-- comments 表 entity_type 支援：
'biography', 'post', 'bucket_list_item',
'core_story', 'one_liner', 'story',
'gallery', 'video', 'gym', 'crag', 'route'

-- 表結構：
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id TEXT,              -- 支援回覆
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_hidden INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);
```

### 已完成的通知類型

```typescript
// 15 種通知類型
'core_story_liked'      // 核心故事被按讚
'core_story_commented'  // 核心故事收到評論
'one_liner_liked'       // 一句話被按讚
'one_liner_commented'   // 一句話收到評論
'story_liked'           // 深度故事被按讚
'story_commented'       // 深度故事收到評論
'biography_commented'   // 人物誌收到評論
'new_follower'          // 新追蹤者
// ... 等
```

### 額外完成：匿名故事分享系統

| 功能 | 狀態 |
|------|------|
| guest_sessions 表（訪客追蹤） | ✅ 已完成 |
| 分享資格判定邏輯 | ✅ 已完成 |
| 匿名提交 API | ✅ 已完成 |
| 認領機制 | ✅ 已完成 |
| 前端組件（QuestionEditor 等） | ✅ 已完成 |

---

## Sprint 3：首頁精選故事整合（當前）🟡 中優先

### 目標
將已完成的熱門故事 API 整合到首頁展示

### 任務清單

| 優先級 | 任務 | 負責 | 預估時數 | 狀態 |
|--------|------|------|---------|------|
| P0 | 設計首頁精選故事區塊 | Design | 4h | □ |
| P0 | 實作精選故事卡片組件 | Frontend | 6h | □ |
| P0 | 整合到首頁 layout | Frontend | 4h | □ |
| P1 | 整合測試 | QA | 4h | □ |

### 已有 API

```typescript
// 熱門故事 API 已完成
GET /api/v1/content/popular/core-stories
GET /api/v1/content/popular/one-liners
GET /api/v1/content/popular/stories
```

### 交付物
- [ ] 首頁精選故事區塊組件
- [ ] 精選故事卡片組件
- [ ] 整合到 src/app/page.tsx

### 驗收標準
- 首頁顯示依互動熱度排序的精選故事
- 點擊可跳轉到對應人物誌

---

## Sprint 4：引導式體驗優化（可選）🟢

### 目標
優化用戶故事填寫體驗

### 任務清單

| 優先級 | 任務 | 負責 | 預估時數 | 狀態 |
|--------|------|------|---------|------|
| P1 | 設計引導式問答 UI 組件 | Design | 4h | □ |
| P1 | 實作引導式問答組件 | Frontend | 8h | □ |
| P1 | 調整註冊後引導流程 | Frontend | 4h | □ |
| P1 | 實作空狀態設計與鼓勵文案 | Frontend | 4h | □ |
| P2 | 文案優化 | Content | 4h | □ |

### 交付物
- [ ] 引導式問答 UI 組件
- [ ] 改善後的註冊引導流程
- [ ] 空狀態設計

### 驗收標準
- 新用戶可透過引導式問答完成核心故事填寫
- 空狀態有適當的引導文案

---

## Sprint 5：分享優化與上線準備 🟢

### 目標
優化分享體驗，準備上線

### 任務清單

| 優先級 | 任務 | 負責 | 預估時數 | 狀態 |
|--------|------|------|---------|------|
| P1 | 設計 OG Image 模板 | Design | 4h | □ |
| P1 | 實作 OG Image 生成 | Backend | 8h | □ |
| P0 | 效能優化 | Full | 6h | □ |
| P0 | Bug 修復 | Full | 6h | □ |
| P0 | 整合測試 | QA | 6h | □ |
| P0 | 種子內容準備 | Growth | 8h | □ |

### 交付物
- [ ] OG Image 自動生成
- [ ] 效能優化完成
- [ ] Bug 修復完成

### 驗收標準
- 分享到社群有正確的預覽圖
- 頁面載入時間 < 3 秒
- 無重大 Bug

---

## 冷啟動執行時程（與開發並行）

> 💡 冷啟動可在開發 Sprint 2-3 期間開始執行

### 開發期間（Week 1-4）：預備階段

```
□ 列出 30 個潛在種子用戶名單
□ 準備邀請話術與說明文件
□ 自己先填寫完整人物誌作為示範
□ 測試故事回應功能（內部測試）
```

### 上線前（Week 5-6）：種子用戶招募

```
□ 發送第一批 10 人邀請
□ 追蹤註冊與填寫狀況
□ 親自回應每一個故事（確保每個故事都有回應）
□ 發送第二批 10 人邀請
□ 確保種子用戶互相回應
□ 檢視並調整邀請話術
□ 確認 20+ 完整人物誌
```

### 上線後 2 週：推廣階段

```
□ 策劃首頁精選內容
□ 準備社群發文素材
□ 在 2-3 個 FB 社團發文
□ 追蹤發文效果
□ 請種子用戶分享
□ 收集用戶反饋
```

### 上線後 4 週：擴大階段

```
□ 分析成長數據
□ 識別最有效的獲客渠道
□ 開始岩館合作洽談
□ 規劃第一場線下活動
```

---

## 每週追蹤指標

| 指標 | Week 1 | Week 2 | Week 3 | Week 4 | Week 5 | Week 6 |
|------|--------|--------|--------|--------|--------|--------|
| 開發進度 (%) | | | | | | |
| 故事回應功能完成度 | | | | | | |
| 通知整合完成度 | | | | | | |
| 種子用戶邀請數 | - | - | - | | | |
| 種子用戶註冊數 | - | - | - | | | |
| 完整人物誌數 | - | - | - | | | |
| 故事回應數 | - | - | - | | | |
| 發現的 Bug 數 | | | | | | |
| 修復的 Bug 數 | | | | | | |

---

## 技術需求摘要（根據 2026-01-27 現況更新）

### 已完成的前端組件

| 組件 | 路徑 | 說明 | 狀態 |
|------|------|------|------|
| 故事評論 Sheet | `components/biography/display/ContentCommentSheet` | 評論輸入與列表 | ✅ 已完成 |
| 內容按讚按鈕 | `components/biography/display/ContentLikeButton` | 故事按讚 | ✅ 已完成 |
| 故事卡片 | `components/biography/display/StoryCard` | 故事展示 | ✅ 已完成 |
| 匿名分享組件 | `components/anonymous-share/*` | 8 個組件 | ✅ 已完成 |

### 待新增的前端組件

| 組件 | 路徑 | 說明 | 狀態 |
|------|------|------|------|
| 精選故事卡片 | `components/home/FeaturedStoryCard` | 首頁精選故事 | ⚠️ 需新增 |
| 引導式問答 | `components/onboarding/GuidedQuestions` | 一題一題填寫 | ⚠️ 可選 |

### 前端修改頁面

| 頁面 | 修改內容 | 狀態 |
|------|---------|------|
| 人物誌展示 `/biography/profile/[slug]` | 故事評論已整合 | ✅ 已完成 |
| 首頁 `/` | 加入精選故事區塊 | ⚠️ 需修改 |
| 通知中心 | 支援 15 種通知類型 | ✅ 已完成 |
| 匿名分享 `/share/anonymous` | 完整實作 | ✅ 已完成 |

### 已完成的後端 API

| 模組 | 端點 | 方法 | 狀態 |
|------|------|------|------|
| 核心故事評論 | `/content/core-stories/:id/comments` | GET, POST | ✅ 已完成 |
| 核心故事按讚 | `/content/core-stories/:id/like` | POST | ✅ 已完成 |
| 一句話評論 | `/content/one-liners/:id/comments` | GET, POST | ✅ 已完成 |
| 一句話按讚 | `/content/one-liners/:id/like` | POST | ✅ 已完成 |
| 深度故事評論 | `/content/stories/:id/comments` | GET, POST | ✅ 已完成 |
| 深度故事按讚 | `/content/stories/:id/like` | POST | ✅ 已完成 |
| 熱門核心故事 | `/content/popular/core-stories` | GET | ✅ 已完成 |
| 熱門一句話 | `/content/popular/one-liners` | GET | ✅ 已完成 |
| 熱門深度故事 | `/content/popular/stories` | GET | ✅ 已完成 |
| 匿名分享 | `/guest/*` | 多個 | ✅ 已完成 |

### 已完成的資料庫表格

| 表格 | 說明 | 狀態 |
|------|------|------|
| `comments` | 通用評論表（支援 11 種 entity_type） | ✅ 已完成 |
| `likes` | 通用按讚表 | ✅ 已完成 |
| `notifications` | 通知（15 種類型） | ✅ 已完成 |
| `biography_core_stories` | 核心故事（有 like_count, comment_count） | ✅ 已完成 |
| `biography_one_liners` | 一句話（有 like_count, comment_count） | ✅ 已完成 |
| `biography_stories` | 完整故事（有 like_count, comment_count） | ✅ 已完成 |
| `guest_sessions` | 訪客 Session | ✅ 已完成 |
| `content_claims` | 內容認領 | ✅ 已完成 |
| `share_eligibility_config` | 分享資格配置 | ✅ 已完成 |

---

## 風險與應對

| 風險 | 影響 | 應對措施 |
|------|------|---------|
| 故事回應 UI 複雜度高 | 開發延遲 | 先做最小可用版本，迭代優化 |
| 快速回應按鈕 UX 不佳 | 用戶不使用 | 參考成熟產品設計，做 A/B 測試 |
| 通知類型整合複雜 | 前後端不一致 | 明確定義 type 與 metadata 結構 |
| 種子用戶招募困難 | 上線後沒內容 | 提前開始招募，準備備選名單 |
| 用戶反饋需大改 | 重工 | 及早收集反饋，小步迭代 |

---

## 相依性說明

```
                    ┌─────────────────┐
                    │ Sprint 1        │
                    │ 故事評論系統     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ 評論通知     │  │ 精選故事     │  │ 按讚通知     │
    │ (Sprint 2)  │  │ (Sprint 2)  │  │ (Sprint 2)  │
    └─────────────┘  └─────────────┘  └─────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Sprint 3        │
                    │ 引導優化/上線    │
                    └─────────────────┘
```

> ⚠️ **關鍵相依**：Sprint 2 & 3 的功能都依賴 Sprint 1 的故事評論系統，務必先完成 Sprint 1。

---

## 更新記錄

| 日期 | 版本 | 更新內容 |
|------|------|----------|
| 2025-01-25 | v1.0 | 初始版本 |
| 2026-01-25 | v1.1 | 根據專案現況重新規劃，從 8 週縮減為 6 週，聚焦 MVP 核心缺失功能 |
| 2026-01-27 | v1.2 | 重大更新：確認故事評論系統、通知系統、匿名分享系統已完成。更新 Sprint 狀態和技術需求摘要。 |
