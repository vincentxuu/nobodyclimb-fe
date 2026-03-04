## Context

NobodyClimb 已經有完善的互動系統架構,包括共用的 `likes`、`comments` 和 `content_reactions` 表,支援多種 entity_type。現有的人物誌功能使用 `biography_core_stories`、`biography_one_liners`、`biography_stories` 表,每個都有 `like_count` 和 `comment_count` 計數欄位,並透過共用互動表處理使用者互動。

攀岩幹話功能需要類似的架構,但有一個關鍵差異:**幹話是共用資源,而個人故事是使用者附加的個人化內容**。這需要兩層資料模型:
1. **共用幹話庫** - 所有人可見和貢獻
2. **個人收集 + 故事** - 使用者選擇的幹話及個人化內容(所有故事都公開)

技術棧:
- 後端: Hono + Cloudflare D1 (SQLite)
- 前端: Next.js 15 + React 19 + TailwindCSS
- 狀態管理: Zustand + TanStack Query
- API: RESTful with OpenAPI 3.1 documentation

## Goals / Non-Goals

**Goals:**
- 建立可擴展的幹話共用資料庫
- 讓使用者收集幹話並附加個人故事
- 複用現有的互動系統和元件
- 支援分類、標籤和搜尋功能
- 提供良好的 UX 讓使用者瀏覽和貢獻內容
- 所有個人故事都是公開的,促進社群分享

**Non-Goals:**
- 不實作自動內容審核 (MVP 階段依賴社群回報)
- 不支援幹話的版本歷史或編輯功能
- 不實作推薦演算法 (初期使用簡單的熱門排序)
- 不建立獨立的通知系統 (使用現有的 notifications 表)
- 不提供隱私設定 (所有故事都公開)

## Decisions

### 1. 雙表設計: banters + user_banters

**決策**: 使用分離的 `banters` (共用) 和 `user_banters` (個人) 兩個表

**理由**:
- **正規化**: 避免幹話文字重複,節省儲存空間
- **一致性**: 幹話內容的修正只需更新一處
- **統計準確**: 可以追蹤幹話的使用次數 (`usage_count`)
- **易於查詢**: 可以查詢特定幹話的所有故事,或查詢特定使用者的所有收集

**替代方案考量**:
- ❌ **單表設計** (所有內容在 user_banters): 會造成幹話文字大量重複,難以統計熱門幹話
- ❌ **嵌套 JSON** (在 banters 中儲存所有故事): 查詢效能差,不利於個人故事的 CRUD 操作

### 2. 複用現有互動系統

**決策**: 擴展現有的 `likes`、`comments`、`content_reactions` 表,新增 `'banter'` 和 `'user_banter'` entity types

**理由**:
- **一致性**: 與現有功能 (stories, one-liners) 保持一致的互動模式
- **程式碼複用**: 前端可直接使用 `ContentInteractionBar` 等現有元件
- **維護性**: 互動邏輯集中管理,減少重複程式碼
- **資料整合**: 所有互動資料在同一表中,便於跨功能的分析和查詢

**實作方式**:
```sql
-- 修改 CHECK 約束,不需要重建表
-- 使用 ALTER TABLE 或建立新表並遷移資料的方式

-- likes 表
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_entity_type_check;
ALTER TABLE likes ADD CONSTRAINT likes_entity_type_check
  CHECK (entity_type IN (
    'biography', 'post', 'bucket_list_item',
    'core_story', 'one_liner', 'story',
    'banter', 'user_banter',  -- 新增
    'gallery', 'video', 'gym', 'crag', 'route'
  ));

-- comments 表 (同樣方式)
-- content_reactions 表 (同樣方式)
```

**替代方案考量**:
- ❌ **獨立互動表**: 會造成程式碼和邏輯重複,增加維護成本

### 3. 所有故事公開,無隱私設定

**決策**: 所有個人故事都是公開的,不提供隱私控制

**理由**:
- **簡化設計**: 減少資料庫欄位和 UI 複雜度
- **促進分享**: 鼓勵社群成員分享經驗,增加社群互動
- **避免困惑**: 使用者不需要理解公開/私人的差異
- **一致體驗**: 所有人在幹話詳情頁看到相同的故事列表

**使用者預期**:
- 收集幹話時,UI 會明確提示「你的故事會公開顯示」
- 使用者可以隨時編輯或刪除自己的故事

### 4. 前端路由和頁面結構

**決策**:
- `/banters` - 瀏覽所有幹話 (公開頁面)
- `/banters/[id]` - 幹話詳情 + 所有人的故事
- `/profile/my-banters` - 個人收集頁面 (需登入)

**理由**:
- **RESTful**: 符合資源導向的路由設計
- **SEO 友善**: 公開頁面利於搜尋引擎收錄
- **權限清晰**: `/profile/*` 路徑明確表示需要認證

**頁面互動流程**:
1. 使用者在 `/banters` 瀏覽幹話
2. 點擊「收集」按鈕 → 開啟 `CollectBanterDialog`
3. 輸入個人故事 → 送出 (明確提示故事會公開)
4. 收集的幹話出現在 `/profile/my-banters`
5. 故事會顯示在 `/banters/[id]` 頁面供所有人瀏覽

### 5. 分類和標籤系統

**決策**: 使用預定義的分類 (category) + 自由標籤 (tags)

**預定義分類**:
```typescript
export const BANTER_CATEGORIES = [
  'recovery-climbing',  // 復健爬
  'route-rating',       // 路線評價
  'gear-jokes',         // 裝備玩笑
  'training-excuses',   // 訓練藉口
  'climbing-style',     // 風格吐槽
  'weather-conditions', // 天氣因素
  'other',              // 其他
] as const;
```

**理由**:
- **分類**: 固定選項,便於篩選和統計,確保資料一致性
- **標籤**: 靈活的 JSON array,支援多標籤,讓使用者自由描述
- **搜尋**: 兩者結合提供豐富的篩選維度

### 6. 資料庫索引策略

**決策**: 建立複合索引以優化常見查詢

**關鍵索引**:
```sql
-- banters 表
CREATE INDEX idx_banters_category ON banters(category);
CREATE INDEX idx_banters_popular ON banters(usage_count DESC, like_count DESC);
CREATE INDEX idx_banters_created ON banters(created_at DESC);

-- user_banters 表
CREATE INDEX idx_user_banters_user ON user_banters(user_id);
CREATE INDEX idx_user_banters_banter ON user_banters(banter_id);
CREATE INDEX idx_user_banters_popular ON user_banters(like_count DESC);
CREATE INDEX idx_user_banters_created ON user_banters(created_at DESC);
```

**理由**:
- **分類查詢**: `idx_banters_category` 支援按分類篩選
- **熱門排序**: `idx_banters_popular` 複合索引支援熱門幹話查詢
- **使用者查詢**: `idx_user_banters_user` 快速查詢個人收集
- **時間排序**: 支援最新故事查詢

### 7. API 設計: RESTful + OpenAPI

**決策**: 遵循 RESTful 原則,使用 Hono + zod-openapi

**API 端點設計**:
```typescript
// 幹話相關
GET    /api/v1/banters              // 列表 (支援 ?category, ?tags, ?sort)
POST   /api/v1/banters              // 貢獻新幹話
GET    /api/v1/banters/:id          // 單一幹話詳情
GET    /api/v1/banters/:id/stories  // 該幹話的所有故事

// 個人收集相關
GET    /api/v1/user-banters         // 個人收集列表
POST   /api/v1/user-banters         // 收集幹話 + 寫故事
GET    /api/v1/user-banters/:id     // 單一收集詳情
PUT    /api/v1/user-banters/:id     // 更新個人故事
DELETE /api/v1/user-banters/:id     // 移除收集

// 互動 (複用現有 API)
POST   /api/v1/likes                // { entity_type: 'banter', entity_id }
DELETE /api/v1/likes/:id            // 取消 like
POST   /api/v1/comments             // { entity_type: 'user_banter', ... }
POST   /api/v1/reactions            // { content_type: 'banter', ... }
```

**認證策略**:
- 公開 API: `GET /api/v1/banters/*` (不需認證)
- 需認證 API: `POST /api/v1/banters`, `/api/v1/user-banters/*`
- 權限檢查: 使用者只能編輯/刪除自己的內容

### 8. 前端狀態管理

**決策**: Zustand (UI 狀態) + TanStack Query (伺服器狀態)

**Zustand Store**:
```typescript
interface BanterStore {
  // UI 狀態
  selectedCategory: string | null;
  selectedTags: string[];
  sortBy: 'popular' | 'recent' | 'usage';

  // Actions
  setCategory: (category: string | null) => void;
  toggleTag: (tag: string) => void;
  setSortBy: (sort: 'popular' | 'recent' | 'usage') => void;
  resetFilters: () => void;
}
```

**TanStack Query Hooks**:
```typescript
// 幹話查詢
useBanters({ category, tags, sort })
useBanter(id)
useBanterStories(banterId)

// 個人收集查詢
useMyBanters()
useMyBanter(id)

// Mutations
useCreateBanter()
useCollectBanter()
useUpdateBanterStory()
useDeleteBanterCollection()
```

**理由**:
- **關注點分離**: Zustand 處理 UI 狀態 (篩選器),TanStack Query 處理資料
- **快取管理**: TanStack Query 自動處理資料快取、重新驗證、樂觀更新
- **輕量高效**: Zustand 比 Redux 更簡單,適合中小型專案

## Risks / Trade-offs

### 1. 資料庫遷移風險

**[Risk]** 修改現有表的 CHECK 約束可能在 production 環境失敗
**→ Mitigation**:
- 先在 preview 環境測試遷移
- 使用 SQLite 的 `PRAGMA foreign_keys = OFF` 期間建立新表並遷移資料的方式
- 準備 rollback script

### 2. 內容審核問題

**[Risk]** 使用者可能提交不當或重複的幹話
**→ Mitigation**:
- MVP 階段不實作自動審核,依賴社群回報
- 新增 `is_hidden` 欄位支援管理員隱藏內容
- 後續可考慮使用 Cloudflare Workers AI 進行內容過濾

### 3. 效能考量

**[Risk]** 熱門幹話頁面可能有大量查詢
**→ Mitigation**:
- 使用適當的索引 (已在設計中)
- 使用 Cloudflare KV 快取熱門幹話列表 (TTL 5 分鐘)
- 分頁查詢 (每頁 20 筆)

### 4. 搜尋功能限制

**[Trade-off]** SQLite 的全文搜尋功能有限
**→ Approach**:
- MVP 使用 `LIKE` 查詢和標籤篩選
- 後續可考慮整合 Cloudflare Workers AI 的語意搜尋
- 或使用外部搜尋服務 (e.g., Algolia, Meilisearch)

### 5. 所有故事公開的影響

**[Trade-off]** 使用者可能因為故事會公開而不願分享
**→ Approach**:
- UI 上明確提示故事會公開
- 鼓勵正面、有趣的分享文化
- 提供編輯和刪除功能,讓使用者隨時調整內容
- 後續可根據使用者回饋考慮是否新增隱私選項

## Migration Plan

### Phase 1: 資料庫遷移 (Backend)

1. **建立新表**:
   ```bash
   # 建立 migration 檔案
   cd backend/migrations
   # 檔名: 0044_add_banter_tables.sql
   ```

2. **擴展互動表 CHECK 約束**:
   - 修改 `likes`, `comments`, `content_reactions` 表
   - 測試現有功能不受影響

3. **本地測試**:
   ```bash
   cd backend
   pnpm db:migrate
   # 驗證表結構和約束
   ```

4. **部署到 preview**:
   ```bash
   pnpm db:migrate:remote --env preview
   ```

5. **部署到 production**:
   ```bash
   pnpm db:migrate:remote --env production
   ```

### Phase 2: 後端 API (Backend)

1. 建立 types 和 schemas (`@nobodyclimb` packages)
2. 實作 repositories (`backend/src/repositories/banter.ts`)
3. 實作 services (`backend/src/services/banter.ts`)
4. 實作 API routes (`backend/src/routes/banters.ts`, `user-banters.ts`)
5. 新增 OpenAPI documentation
6. 撰寫單元測試

### Phase 3: 前端實作 (Frontend)

1. 建立頁面結構 (`apps/web/src/app/banters/`)
2. 實作 UI 元件 (`apps/web/src/components/banter/`)
3. 設定 Zustand store 和 TanStack Query hooks
4. 整合互動元件 (`ContentInteractionBar` 等)
5. 實作搜尋和篩選功能
6. 撰寫 E2E 測試

### Phase 4: 測試與優化

1. 效能測試 (查詢速度、索引效能)
2. 使用者體驗測試
3. 修正 bugs 和優化 UI
4. 準備 production 部署

### Rollback Strategy

如果遇到嚴重問題:

1. **資料庫**: 執行 rollback migration 移除新表和約束修改
2. **API**: 切換到前一個 worker 版本
3. **前端**: 還原相關頁面和元件的變更
4. **資料備份**: 定期備份 D1 資料庫,確保可恢復

## Open Questions

1. **初始資料**: 需要預先填充多少幹話作為種子資料?是否需要從社群收集?
   - 建議: 準備 20-30 個常見幹話作為起始內容

2. **貢獻審核**: 是否需要新幹話的審核流程 (pending → approved)?
   - 建議: MVP 先開放直接發布,依賴社群回報和管理員審核

3. **通知機制**: 當別人對你的故事按讚或留言時,是否需要通知?
   - 建議: 複用現有的 notifications 系統,後續實作

4. **幹話編輯**: 貢獻者是否可以編輯已發布的幹話?
   - 建議: MVP 階段不支援編輯,避免影響已收集該幹話的使用者

5. **重複檢測**: 如何避免使用者提交重複的幹話?
   - 建議: 使用簡單的文字相似度檢查,提示使用者可能重複
