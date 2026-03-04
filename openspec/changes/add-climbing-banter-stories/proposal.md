## Why

攀岩社群中充滿了幽默的幹話和有趣的故事,像是「我今天復健爬」但實際上都在爬 V4 以上。這些幹話反映了攀岩文化的獨特性,但目前缺乏一個地方讓社群成員收集、分享和記錄這些有趣的對話及背後的真實故事。建立此功能可以增強社群凝聚力,讓攀岩者找到共鳴並分享自己的經驗。

## What Changes

- 新增幹話共用資料庫 (`banters` 表),所有使用者可瀏覽和搜尋
- 使用者可貢獻新幹話到共用資料庫
- 使用者可收集喜歡的幹話到個人集合 (`user_banters` 表)
- 使用者可為自己收集的幹話附加個人故事
- **複用現有的共用互動表** (`likes`, `comments`, `content_reactions`),新增 `banter` 和 `user_banter` entity types
- 幹話支援分類、標籤和熱門排序
- 個人故事支援編輯、刪除和隱私設定

## Capabilities

### New Capabilities
- `climbing-banters`: 攀岩幹話共用資料庫的建立、瀏覽、搜尋和管理
- `user-banter-collection`: 使用者個人幹話收集和故事管理

### Modified Capabilities
<!-- 現有的互動系統已經很完善,只需要擴展支援的 entity_type -->

## Impact

### Backend (backend)

#### 新增資料表

**`banters` 表** (共用幹話資料庫)
- `id`: 主鍵
- `text`: 幹話內容
- `category`: 分類 (e.g., '復健爬', '路線評價', '裝備玩笑')
- `tags`: 標籤 JSON array
- `contributor_id`: 貢獻者 (可為空,表示初始資料)
- `usage_count`: 被收集次數
- `like_count`, `comment_count`: 互動計數
- 時間戳欄位

**`user_banters` 表** (使用者幹話收集 + 個人故事)
- `id`: 主鍵
- `user_id`: 擁有者
- `banter_id`: 關聯的幹話
- `personal_story`: 個人故事內容
- `is_public`: 是否公開故事
- `like_count`, `comment_count`: 互動計數
- 時間戳欄位

#### 修改現有資料表

**擴展 `likes` 表的 CHECK 約束**
- 新增 entity_type: `'banter'`, `'user_banter'`

**擴展 `comments` 表的 CHECK 約束**
- 新增 entity_type: `'banter'`, `'user_banter'`

**擴展 `content_reactions` 表的 CHECK 約束**
- 新增 content_type: `'banter'`, `'user_banter'`

#### 新增 API 路由
- `GET /api/v1/banters` - 取得幹話列表 (支援分類、標籤篩選、熱門排序)
- `POST /api/v1/banters` - 貢獻新幹話
- `GET /api/v1/banters/:id` - 取得單一幹話詳情
- `POST /api/v1/user-banters` - 收集幹話並附加個人故事
- `GET /api/v1/user-banters` - 取得個人收集列表
- `PUT /api/v1/user-banters/:id` - 更新個人故事
- `DELETE /api/v1/user-banters/:id` - 移除收集
- 複用現有的互動 API: `/api/v1/likes`, `/api/v1/comments`, `/api/v1/reactions`

### Frontend (apps/web)

#### 新增頁面
- `/banters` - 瀏覽所有幹話 (首頁)
- `/banters/[id]` - 單一幹話詳情頁 (顯示所有人的故事)
- `/profile/my-banters` - 個人幹話收集頁面

#### 新增元件
- `components/banter/`
  - `BanterCard.tsx` - 幹話卡片元件
  - `BanterList.tsx` - 幹話列表
  - `BanterDetailView.tsx` - 幹話詳情視圖
  - `AddBanterDialog.tsx` - 新增幹話對話框
  - `CollectBanterDialog.tsx` - 收集幹話 + 附加故事對話框
  - `UserStoryCard.tsx` - 使用者故事卡片
- **複用** `components/biography/display/` 的互動元件:
  - `ContentInteractionBar.tsx`
  - `QuickReactionBar.tsx`
  - `ContentLikeButton.tsx`
  - `ContentCommentSheet.tsx`

#### 狀態管理
- 新增 Zustand store: `useBanterStore.ts` (幹話列表、篩選狀態)
- TanStack Query hooks: 幹話和個人收集的資料抓取

### Shared Packages

- `@nobodyclimb/types`:
  - 新增 `Banter` 類型
  - 新增 `UserBanter` 類型
- `@nobodyclimb/schemas`:
  - 新增 Zod schemas: `BanterSchema`, `UserBanterSchema`
- `@nobodyclimb/constants`:
  - 新增 `BANTER_CATEGORIES` 常數
  - 新增 `BANTER_TAGS` 常數

### Database Migrations

- 建立 `banters` 表結構
- 建立 `user_banters` 表結構
- 修改 `likes` 表的 CHECK 約束
- 修改 `comments` 表的 CHECK 約束
- 修改 `content_reactions` 表的 CHECK 約束
- 建立索引以優化查詢效能
