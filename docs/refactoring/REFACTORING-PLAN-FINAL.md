# NobodyClimb 互動功能全面重構計畫

> **決策日期**: 2026-01-22
> **狀態**: 待實施
> **範圍**: 全面架構升級 (路由拆分 + API 重構 + 資料表統一 + Service 層完善)

---

## 📋 決策摘要

基於對 `biographies-route-restructure.md` 和 `interaction-features.md` 的討論,我們做出以下關鍵決策:

| 項目 | 決策 | 理由 |
|------|------|------|
| **API 路徑設計** | 採用功能分組 | 統一管理互動功能,易於維護和擴展 |
| **資料表設計** | 統一使用通用表 | 簡化架構,避免雙軌制的複雜性 |
| **重構範圍** | 全面重構 | 一次性解決所有架構問題,避免技術債累積 |
| **實施策略** | 一次性完成 | 集中精力,快速完成,減少長期維護負擔 |

---

## 🎯 重構目標

### 1. 路由檔案拆分

**目標**: 將 `biographies.ts` (2127 行) 拆分為:

```
src/routes/
├── biographies.ts              (~750 行) - 人物誌 CRUD
├── likes.ts                    (~250 行) - 統一按讚功能
├── comments.ts                 (~300 行) - 統一留言功能
├── follows.ts                  (~350 行) - 統一追蹤功能
├── bookmarks.ts                (~200 行) - 統一收藏功能
├── references.ts               (~200 行) - 引用清單功能
├── biography-badges.ts         (~200 行) - 徽章系統
├── climbing-footprints.ts      (~250 行) - 攀岩足跡
└── community-stats.ts          (~250 行) - 社群統計
```

### 2. API 路徑重構

**舊路徑** (按資源分組):
```
POST   /api/v1/biographies/:id/like
POST   /api/v1/posts/:id/like
POST   /api/v1/bucket-list/:id/like
DELETE /api/v1/biographies/:id/follow
```

**新路徑** (按功能分組):
```
POST   /api/v1/likes/:entityType/:entityId
DELETE /api/v1/likes/:entityType/:entityId
GET    /api/v1/likes/:entityType/:entityId
POST   /api/v1/comments/:entityType/:entityId
GET    /api/v1/comments/:entityType/:entityId
DELETE /api/v1/comments/:commentId
POST   /api/v1/follows/:entityType/:entityId
DELETE /api/v1/follows/:entityType/:entityId
GET    /api/v1/follows/:entityType/:entityId
POST   /api/v1/bookmarks/:entityType/:entityId
```

**支援的 entityType (API 路徑使用複數)**:
- `biographies` - 人物誌 (DB: `biography`)
- `posts` - 文章 (DB: `post`)
- `bucket-list` - 人生清單 (DB: `bucket_list_item`)
- `core-stories` - 核心故事 (DB: `core_story`)
- `one-liners` - 一句話 (DB: `one_liner`)
- `stories` - 小故事 (DB: `story`)
- `galleries` - 相簿 (DB: `gallery`)
- `videos` - 影片 (DB: `video`)
- `gyms` - 室內岩館 (DB: `gym`)
- `crags` - 戶外岩場 (DB: `crag`)
- `routes` - 攀岩路線 (DB: `route`)

**重要**: API 路徑使用複數/kebab-case,資料庫使用單數/snake_case。
詳見 [Entity Type 命名規範](./ENTITY-TYPE-MAPPING.md)

### 3. 資料表統一

**遷移計畫**:

將以下專門表的資料遷移到通用表:
- `biography_likes` → `likes` (entity_type='biography')
- `bucket_list_likes` → `likes` (entity_type='bucket_list_item')
- `core_story_likes` → `likes` (entity_type='core_story')
- `one_liner_likes` → `likes` (entity_type='one_liner')
- `story_likes` → `likes` (entity_type='story')
- `bucket_list_comments` → `comments` (entity_type='bucket_list_item')
- `core_story_comments` → `comments` (entity_type='core_story')
- `one_liner_comments` → `comments` (entity_type='one_liner')
- `story_comments` → `comments` (entity_type='story')

**保留的專門表**:
- `follows` - 追蹤關係(使用者對使用者)
- `bookmarks` - 收藏(已經是通用表設計)
- `bucket_list_references` - 引用清單(特殊業務邏輯)

### 4. Service 層架構

**新增統一的 Service 類別**:

```typescript
// src/services/interaction-service.ts
export class InteractionService {
  // 按讚相關
  async toggleLike(entityType, entityId, userId): Promise<{liked: boolean, count: number}>
  async getLikeStatus(entityType, entityId, userId): Promise<{liked: boolean, count: number}>
  async getLikedUsers(entityType, entityId, page, limit): Promise<User[]>

  // 留言相關
  async addComment(entityType, entityId, userId, content): Promise<Comment>
  async getComments(entityType, entityId, page, limit): Promise<{comments: Comment[], total: number}>
  async deleteComment(commentId, userId): Promise<void>

  // 追蹤相關
  async follow(targetUserId, followerId): Promise<void>
  async unfollow(targetUserId, followerId): Promise<void>
  async getFollowStatus(targetUserId, followerId): Promise<{isFollowing: boolean, followerCount: number}>
  async getFollowers(userId, page, limit): Promise<User[]>
  async getFollowing(userId, page, limit): Promise<User[]>

  // 收藏相關
  async toggleBookmark(entityType, entityId, userId): Promise<{bookmarked: boolean, count: number}>
  async getBookmarks(userId, entityType, page, limit): Promise<any[]>
}
```

---

## 🚀 實施步驟

### Phase 1: 準備階段 (1-2 天)

#### 1.1 建立資料遷移腳本

**檔案**: `backend/migrations/0028_unify_interaction_tables.sql`

```sql
-- 1. 遷移 biography_likes 到 likes
INSERT INTO likes (user_id, entity_type, entity_id, created_at)
SELECT user_id, 'biography', biography_id, created_at
FROM biography_likes
WHERE NOT EXISTS (
  SELECT 1 FROM likes
  WHERE likes.user_id = biography_likes.user_id
    AND likes.entity_type = 'biography'
    AND likes.entity_id = biography_likes.biography_id
);

-- 2. 遷移 bucket_list_likes 到 likes
INSERT INTO likes (user_id, entity_type, entity_id, created_at)
SELECT user_id, 'bucket_list_item', item_id, created_at
FROM bucket_list_likes
WHERE NOT EXISTS (
  SELECT 1 FROM likes
  WHERE likes.user_id = bucket_list_likes.user_id
    AND likes.entity_type = 'bucket_list_item'
    AND likes.entity_id = bucket_list_likes.item_id
);

-- 3. 遷移 core_story_likes 到 likes
INSERT INTO likes (user_id, entity_type, entity_id, created_at)
SELECT user_id, 'core_story', story_id, created_at
FROM core_story_likes
WHERE NOT EXISTS (
  SELECT 1 FROM likes
  WHERE likes.user_id = core_story_likes.user_id
    AND likes.entity_type = 'core_story'
    AND likes.entity_id = core_story_likes.story_id
);

-- 4. 遷移 one_liner_likes 到 likes
INSERT INTO likes (user_id, entity_type, entity_id, created_at)
SELECT user_id, 'one_liner', one_liner_id, created_at
FROM one_liner_likes
WHERE NOT EXISTS (
  SELECT 1 FROM likes
  WHERE likes.user_id = one_liner_likes.user_id
    AND likes.entity_type = 'one_liner'
    AND likes.entity_id = one_liner_likes.one_liner_id
);

-- 5. 遷移 story_likes 到 likes
INSERT INTO likes (user_id, entity_type, entity_id, created_at)
SELECT user_id, 'story', story_id, created_at
FROM story_likes
WHERE NOT EXISTS (
  SELECT 1 FROM likes
  WHERE likes.user_id = story_likes.user_id
    AND likes.entity_type = 'story'
    AND likes.entity_id = story_likes.story_id
);

-- 6. 遷移 bucket_list_comments 到 comments
INSERT INTO comments (user_id, entity_type, entity_id, content, created_at, updated_at)
SELECT user_id, 'bucket_list_item', item_id, content, created_at, created_at
FROM bucket_list_comments
WHERE NOT EXISTS (
  SELECT 1 FROM comments
  WHERE comments.user_id = bucket_list_comments.user_id
    AND comments.entity_type = 'bucket_list_item'
    AND comments.entity_id = bucket_list_comments.item_id
    AND comments.created_at = bucket_list_comments.created_at
);

-- 7. 遷移 core_story_comments 到 comments
INSERT INTO comments (user_id, entity_type, entity_id, content, created_at, updated_at)
SELECT user_id, 'core_story', story_id, content, created_at, created_at
FROM core_story_comments
WHERE NOT EXISTS (
  SELECT 1 FROM comments
  WHERE comments.user_id = core_story_comments.user_id
    AND comments.entity_type = 'core_story'
    AND comments.entity_id = core_story_comments.story_id
    AND comments.created_at = core_story_comments.created_at
);

-- 8. 遷移 one_liner_comments 到 comments
INSERT INTO comments (user_id, entity_type, entity_id, content, created_at, updated_at)
SELECT user_id, 'one_liner', one_liner_id, content, created_at, created_at
FROM one_liner_comments
WHERE NOT EXISTS (
  SELECT 1 FROM comments
  WHERE comments.user_id = one_liner_comments.user_id
    AND comments.entity_type = 'one_liner'
    AND comments.entity_id = one_liner_comments.one_liner_id
    AND comments.created_at = one_liner_comments.created_at
);

-- 9. 遷移 story_comments 到 comments
INSERT INTO comments (user_id, entity_type, entity_id, content, created_at, updated_at)
SELECT user_id, 'story', story_id, content, created_at, created_at
FROM story_comments
WHERE NOT EXISTS (
  SELECT 1 FROM comments
  WHERE comments.user_id = story_comments.user_id
    AND comments.entity_type = 'story'
    AND comments.entity_id = story_comments.story_id
    AND comments.created_at = story_comments.created_at
);

-- 10. 驗證遷移數據
SELECT 'biography_likes' as table_name, COUNT(*) as old_count,
       (SELECT COUNT(*) FROM likes WHERE entity_type = 'biography') as new_count
FROM biography_likes
UNION ALL
SELECT 'bucket_list_likes', COUNT(*),
       (SELECT COUNT(*) FROM likes WHERE entity_type = 'bucket_list_item')
FROM bucket_list_likes
UNION ALL
SELECT 'core_story_likes', COUNT(*),
       (SELECT COUNT(*) FROM likes WHERE entity_type = 'core_story')
FROM core_story_likes
UNION ALL
SELECT 'one_liner_likes', COUNT(*),
       (SELECT COUNT(*) FROM likes WHERE entity_type = 'one_liner')
FROM one_liner_likes
UNION ALL
SELECT 'story_likes', COUNT(*),
       (SELECT COUNT(*) FROM likes WHERE entity_type = 'story')
FROM story_likes;

-- 注意: 不要立即刪除舊表,等待驗證通過後再刪除
-- DROP TABLE IF EXISTS biography_likes;
-- DROP TABLE IF EXISTS bucket_list_likes;
-- DROP TABLE IF EXISTS core_story_likes;
-- DROP TABLE IF EXISTS one_liner_likes;
-- DROP TABLE IF EXISTS story_likes;
-- DROP TABLE IF EXISTS bucket_list_comments;
-- DROP TABLE IF EXISTS core_story_comments;
-- DROP TABLE IF EXISTS one_liner_comments;
-- DROP TABLE IF EXISTS story_comments;
```

#### 1.2 建立測試腳本

**檔案**: `backend/scripts/verify-migration.ts`

```typescript
// 驗證資料遷移的正確性
async function verifyMigration(db: D1Database) {
  const tables = [
    { old: 'biography_likes', entityType: 'biography', idColumn: 'biography_id' },
    { old: 'bucket_list_likes', entityType: 'bucket_list_item', idColumn: 'item_id' },
    { old: 'core_story_likes', entityType: 'core_story', idColumn: 'story_id' },
    { old: 'one_liner_likes', entityType: 'one_liner', idColumn: 'one_liner_id' },
    { old: 'story_likes', entityType: 'story', idColumn: 'story_id' },
  ];

  for (const table of tables) {
    const oldCount = await db.prepare(`SELECT COUNT(*) as count FROM ${table.old}`).first();
    const newCount = await db.prepare(`
      SELECT COUNT(*) as count FROM likes
      WHERE entity_type = ?
    `).bind(table.entityType).first();

    console.log(`${table.old}: ${oldCount.count} -> likes (${table.entityType}): ${newCount.count}`);

    if (oldCount.count !== newCount.count) {
      throw new Error(`Migration failed for ${table.old}`);
    }
  }

  console.log('✅ All migrations verified successfully!');
}
```

### Phase 2: 後端重構 (3-5 天)

#### 2.1 建立統一的 Repository

**檔案**: `backend/src/repositories/interaction-repository.ts`

```typescript
export class InteractionRepository {
  // 按讚
  async hasLiked(db: D1Database, entityType: string, entityId: number, userId: number): Promise<boolean>
  async addLike(db: D1Database, entityType: string, entityId: number, userId: number): Promise<void>
  async removeLike(db: D1Database, entityType: string, entityId: number, userId: number): Promise<void>
  async getLikeCount(db: D1Database, entityType: string, entityId: number): Promise<number>

  // 留言
  async getComments(db: D1Database, entityType: string, entityId: number, page: number, limit: number)
  async addComment(db: D1Database, entityType: string, entityId: number, userId: number, content: string)
  async deleteComment(db: D1Database, commentId: number)

  // 收藏
  async hasBookmarked(db: D1Database, entityType: string, entityId: number, userId: number)
  async addBookmark(db: D1Database, entityType: string, entityId: number, userId: number)
  async removeBookmark(db: D1Database, entityType: string, entityId: number, userId: number)
}
```

#### 2.2 建立統一的 Service

**檔案**: `backend/src/services/interaction-service.ts`

```typescript
export class InteractionService {
  constructor(private repo: InteractionRepository) {}

  async toggleLike(
    db: D1Database,
    entityType: string,
    entityId: number,
    userId: number
  ): Promise<{ liked: boolean; count: number }> {
    // 1. 驗證 entityType
    const validTypes = ['biography', 'post', 'bucket_list_item', 'core_story', 'one_liner', 'story', 'gallery', 'video', 'gym', 'crag', 'route'];
    if (!validTypes.includes(entityType)) {
      throw new Error('Invalid entity type');
    }

    // 2. 檢查內容是否存在
    await this.verifyEntityExists(db, entityType, entityId);

    // 3. Toggle 按讚
    const hasLiked = await this.repo.hasLiked(db, entityType, entityId, userId);

    if (hasLiked) {
      await this.repo.removeLike(db, entityType, entityId, userId);
    } else {
      await this.repo.addLike(db, entityType, entityId, userId);

      // 4. 發送通知
      const author = await this.getEntityAuthor(db, entityType, entityId);
      if (author && author.id !== userId) {
        await this.sendLikeNotification(db, entityType, entityId, userId, author.id);
      }
    }

    // 5. 取得最新計數
    const count = await this.repo.getLikeCount(db, entityType, entityId);

    return { liked: !hasLiked, count };
  }

  // 其他方法...
}
```

#### 2.3 建立新的路由檔案

**檔案**: `backend/src/routes/likes.ts`

```typescript
import { Hono } from 'hono';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { InteractionService } from '../services/interaction-service';
import { InteractionRepository } from '../repositories/interaction-repository';

const likes = new Hono();

// POST /api/v1/likes/:entityType/:entityId - Toggle 按讚
likes.post('/:entityType/:entityId', authMiddleware, async (c) => {
  const entityType = c.req.param('entityType');
  const entityId = parseInt(c.req.param('entityId'));
  const userId = c.get('userId');

  const repo = new InteractionRepository();
  const service = new InteractionService(repo);

  try {
    const result = await service.toggleLike(c.env.DB, entityType, entityId, userId);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// GET /api/v1/likes/:entityType/:entityId - 取得按讚狀態
likes.get('/:entityType/:entityId', optionalAuthMiddleware, async (c) => {
  const entityType = c.req.param('entityType');
  const entityId = parseInt(c.req.param('entityId'));
  const userId = c.get('userId');

  const repo = new InteractionRepository();

  try {
    const liked = userId ? await repo.hasLiked(c.env.DB, entityType, entityId, userId) : false;
    const count = await repo.getLikeCount(c.env.DB, entityType, entityId);

    return c.json({ success: true, data: { liked, count } });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

export default likes;
```

**類似地建立**:
- `backend/src/routes/comments.ts`
- `backend/src/routes/follows.ts`
- `backend/src/routes/bookmarks.ts`

#### 2.4 更新主路由檔案

**檔案**: `backend/src/index.ts`

```typescript
import { Hono } from 'hono';
import likes from './routes/likes';
import comments from './routes/comments';
import follows from './routes/follows';
import bookmarks from './routes/bookmarks';
// ... 其他 imports

const app = new Hono();

// 新的互動功能路由
app.route('/api/v1/likes', likes);
app.route('/api/v1/comments', comments);
app.route('/api/v1/follows', follows);
app.route('/api/v1/bookmarks', bookmarks);

// 保留舊路由以向下相容 (標記為 deprecated)
// ... 舊路由設定

export default app;
```

### Phase 3: 前端適配 (2-3 天)

#### 3.1 更新 API Client

**檔案**: `src/lib/api/interactions.ts`

```typescript
import { apiClient } from './client';

export interface LikeResponse {
  liked: boolean;
  count: number;
}

export interface CommentResponse {
  id: number;
  user_id: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
}

export const interactionsApi = {
  // 按讚
  toggleLike: (entityType: string, entityId: number) =>
    apiClient.post<LikeResponse>(`/likes/${entityType}/${entityId}`),

  getLikeStatus: (entityType: string, entityId: number) =>
    apiClient.get<LikeResponse>(`/likes/${entityType}/${entityId}`),

  // 留言
  getComments: (entityType: string, entityId: number, page = 1, limit = 20) =>
    apiClient.get(`/comments/${entityType}/${entityId}`, { params: { page, limit } }),

  addComment: (entityType: string, entityId: number, content: string) =>
    apiClient.post(`/comments/${entityType}/${entityId}`, { content }),

  deleteComment: (commentId: number) =>
    apiClient.delete(`/comments/${commentId}`),

  // 追蹤
  follow: (entityType: string, entityId: number) =>
    apiClient.post(`/follows/${entityType}/${entityId}`),

  unfollow: (entityType: string, entityId: number) =>
    apiClient.delete(`/follows/${entityType}/${entityId}`),

  getFollowStatus: (entityType: string, entityId: number) =>
    apiClient.get(`/follows/${entityType}/${entityId}`),

  // 收藏
  toggleBookmark: (entityType: string, entityId: number) =>
    apiClient.post(`/bookmarks/${entityType}/${entityId}`),
};
```

#### 3.2 更新 React Hooks

**檔案**: `src/lib/hooks/useInteractions.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { interactionsApi } from '../api/interactions';

export function useLike(entityType: string, entityId: number) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['like', entityType, entityId],
    queryFn: () => interactionsApi.getLikeStatus(entityType, entityId),
  });

  const mutation = useMutation({
    mutationFn: () => interactionsApi.toggleLike(entityType, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['like', entityType, entityId] });
    },
  });

  return {
    liked: data?.data.liked ?? false,
    count: data?.data.count ?? 0,
    isLoading,
    toggleLike: mutation.mutate,
  };
}

export function useComments(entityType: string, entityId: number, page = 1) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['comments', entityType, entityId, page],
    queryFn: () => interactionsApi.getComments(entityType, entityId, page),
  });

  const addMutation = useMutation({
    mutationFn: (content: string) => interactionsApi.addComment(entityType, entityId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', entityType, entityId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: number) => interactionsApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', entityType, entityId] });
    },
  });

  return {
    comments: data?.data ?? [],
    pagination: data?.pagination,
    isLoading,
    addComment: addMutation.mutate,
    deleteComment: deleteMutation.mutate,
  };
}

export function useFollow(entityType: string, entityId: number) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['follow', entityType, entityId],
    queryFn: () => interactionsApi.getFollowStatus(entityType, entityId),
  });

  const followMutation = useMutation({
    mutationFn: () => interactionsApi.follow(entityType, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow', entityType, entityId] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => interactionsApi.unfollow(entityType, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow', entityType, entityId] });
    },
  });

  return {
    isFollowing: data?.data.isFollowing ?? false,
    followerCount: data?.data.followerCount ?? 0,
    isLoading,
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
  };
}
```

#### 3.3 更新 UI 元件

**範例**: `src/components/shared/LikeButton.tsx`

```typescript
'use client';

import { Heart } from 'lucide-react';
import { useLike } from '@/lib/hooks/useInteractions';
import { Button } from '@/components/ui/button';

interface LikeButtonProps {
  entityType: 'biography' | 'post' | 'bucket_list_item' | 'core_story' | 'one_liner' | 'story';
  entityId: number;
  showCount?: boolean;
}

export function LikeButton({ entityType, entityId, showCount = true }: LikeButtonProps) {
  const { liked, count, toggleLike, isLoading } = useLike(entityType, entityId);

  return (
    <Button
      variant={liked ? 'default' : 'outline'}
      size="sm"
      onClick={() => toggleLike()}
      disabled={isLoading}
    >
      <Heart className={liked ? 'fill-current' : ''} />
      {showCount && <span>{count}</span>}
    </Button>
  );
}
```

### Phase 4: 測試與驗證 (2-3 天)

#### 4.1 單元測試

**檔案**: `backend/tests/services/interaction-service.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { InteractionService } from '../../src/services/interaction-service';

describe('InteractionService', () => {
  let service: InteractionService;

  beforeEach(() => {
    // Setup
  });

  describe('toggleLike', () => {
    it('應該能夠成功按讚', async () => {
      // Test implementation
    });

    it('應該能夠取消按讚', async () => {
      // Test implementation
    });

    it('應該拒絕無效的 entity type', async () => {
      // Test implementation
    });
  });

  // More tests...
});
```

#### 4.2 整合測試

建立測試腳本驗證:
- 資料遷移的完整性
- API 回應格式的一致性
- 前端元件的正常運作
- 通知系統的觸發

#### 4.3 效能測試

- 批次查詢按讚狀態的效能
- 留言列表分頁的效能
- 資料庫索引的有效性

### Phase 5: 部署與監控 (1 天)

#### 5.1 部署流程

1. **Preview 環境測試**
   ```bash
   cd backend
   pnpm db:migrate:remote --env preview
   pnpm deploy:preview
   ```

2. **Production 部署**
   ```bash
   # 1. 執行資料遷移
   pnpm db:migrate:remote --env production

   # 2. 部署後端
   pnpm deploy:production

   # 3. 部署前端
   cd ..
   pnpm build:cf
   wrangler deploy --env production
   ```

#### 5.2 監控指標

- API 回應時間
- 錯誤率
- 資料庫查詢效能
- 使用者互動行為變化

#### 5.3 回滾計畫

如果遇到嚴重問題:
1. 還原前端部署
2. 保留資料遷移(不影響舊資料)
3. 分析問題並修復

---

## ⚠️ 風險與注意事項

### 高風險項目

| 風險 | 影響範圍 | 緩解措施 |
|------|----------|----------|
| **資料遷移失敗** | 所有互動資料 | 1. 完整備份<br>2. 在 Preview 環境先測試<br>3. 保留舊表作為備份 |
| **API 不相容** | 前端所有互動功能 | 1. 同時維護舊 API<br>2. 分階段切換<br>3. 完整的前端測試 |
| **效能下降** | 使用者體驗 | 1. 效能測試<br>2. 資料庫索引優化<br>3. 批次查詢優化 |
| **通知系統異常** | 使用者通知 | 1. 單元測試覆蓋<br>2. 監控通知發送率<br>3. 錯誤處理機制 |

### 中風險項目

| 風險 | 影響範圍 | 緩解措施 |
|------|----------|----------|
| **前端 Cache 問題** | 使用者看到舊資料 | 1. 清除快取策略<br>2. 版本號控制<br>3. 使用者提示 |
| **開發時間超出預期** | 專案進度 | 1. 每日進度追蹤<br>2. 預留緩衝時間<br>3. 可縮減範圍 |

### 關鍵注意事項

1. **資料完整性**
   - ✅ 遷移前完整備份
   - ✅ 驗證遷移後的資料數量
   - ✅ 保留舊表至少 2 週

2. **向下相容性**
   - ✅ 保留舊 API 端點
   - ✅ 前端逐步切換到新 API
   - ✅ 監控舊 API 使用率

3. **效能優化**
   - ✅ 確保 entity_type + entity_id 有複合索引
   - ✅ 批次查詢使用 IN 語句
   - ✅ 適當使用快取

4. **測試覆蓋**
   - ✅ 單元測試覆蓋率 > 80%
   - ✅ 整合測試覆蓋關鍵流程
   - ✅ E2E 測試覆蓋主要使用場景

---

## 📊 預期效益

### 短期效益 (1-2 週)

- ✅ 程式碼可維護性大幅提升
- ✅ 檔案大小從 2127 行降至 ~300 行/檔
- ✅ API 設計更清晰統一
- ✅ 資料表設計更簡潔

### 中期效益 (1-2 月)

- ✅ 新功能開發速度提升 30-50%
- ✅ Bug 修復時間縮短
- ✅ 程式碼衝突減少
- ✅ 團隊協作更順暢

### 長期效益 (3-6 月)

- ✅ 技術債大幅降低
- ✅ 系統可擴展性提升
- ✅ 測試覆蓋率提升
- ✅ 系統穩定性提升

---

## 📝 實施檢查清單

### 準備階段
- [ ] 建立資料遷移腳本
- [ ] 建立驗證腳本
- [ ] 完整備份 Production 資料庫
- [ ] 在 Preview 環境測試遷移

### 後端開發
- [ ] 建立 InteractionRepository
- [ ] 建立 InteractionService
- [ ] 建立 likes.ts 路由
- [ ] 建立 comments.ts 路由
- [ ] 建立 follows.ts 路由
- [ ] 建立 bookmarks.ts 路由
- [ ] 更新 index.ts 主路由
- [ ] 撰寫單元測試

### 前端開發
- [ ] 更新 API Client
- [ ] 建立統一的 Hooks
- [ ] 更新 LikeButton 元件
- [ ] 更新 CommentSection 元件
- [ ] 更新 FollowButton 元件
- [ ] 更新 BookmarkButton 元件
- [ ] 撰寫元件測試

### 測試
- [ ] 單元測試通過
- [ ] 整合測試通過
- [ ] E2E 測試通過
- [ ] 效能測試通過
- [ ] Preview 環境驗證通過

### 部署
- [ ] Production 資料遷移
- [ ] 後端部署
- [ ] 前端部署
- [ ] 監控系統正常
- [ ] 錯誤率在可接受範圍

### 後續
- [ ] 監控 7 天無重大問題
- [ ] 刪除舊資料表
- [ ] 移除舊 API 端點
- [ ] 更新文件

---

## 📚 相關文件

- [原始重構計畫](./biographies-route-restructure.md)
- [互動功能實作文件](../interact/interaction-features.md)
- [API 設計規範](../api-design-guidelines.md) (待建立)
- [資料遷移指南](../database-migration-guide.md) (待建立)

---

## 🤝 團隊分工建議

### 後端開發 (3-5 天)
- 資料遷移腳本
- Repository & Service 層
- 新路由檔案
- 單元測試

### 前端開發 (2-3 天)
- API Client 更新
- Hooks 開發
- 元件更新
- 整合測試

### 測試工程 (2-3 天)
- 測試腳本開發
- 整合測試
- 效能測試
- 驗證流程

### DevOps (1 天)
- 部署流程
- 監控設定
- 回滾計畫
- 文件更新

---

## 📅 時間表

| 週次 | 階段 | 任務 | 產出 |
|------|------|------|------|
| **Week 1** | 準備 + 後端 | 資料遷移 + Repository/Service | 後端核心完成 |
| **Week 2** | 後端 + 前端 | 路由拆分 + 前端適配 | 功能開發完成 |
| **Week 3** | 測試 + 部署 | 全面測試 + Preview 部署 | 上線準備 |
| **Week 4** | 部署 + 監控 | Production 部署 + 穩定性監控 | 專案完成 |

---

## ✅ 成功指標

| 指標 | 目標值 | 測量方式 |
|------|--------|----------|
| 單元測試覆蓋率 | > 80% | 測試報告 |
| API 回應時間 | < 200ms | APM 監控 |
| 錯誤率 | < 0.1% | 錯誤追蹤系統 |
| 資料完整性 | 100% | 遷移驗證腳本 |
| 前端互動正常率 | > 99.9% | 使用者行為追蹤 |
| 程式碼可維護性 | A 級 | Code Review |

---

## 🎯 結論

這是一次全面性的架構升級,將會:

1. **大幅提升程式碼品質**:從 2127 行巨獸檔案變成多個清晰模組
2. **統一 API 設計**:功能分組讓 API 更直觀易用
3. **簡化資料結構**:通用表設計讓系統更易擴展
4. **完善架構分層**:Repository-Service-Route 分層更清晰

雖然這是一次大規模重構,但透過:
- ✅ 充分的測試
- ✅ 分階段部署
- ✅ 完善的監控
- ✅ 清晰的回滾計畫

我們可以確保重構順利完成,並為系統的長期發展打下堅實基礎。

---

**建立日期**: 2026-01-22
**最後更新**: 2026-01-22
**版本**: 1.0
**負責人**: 開發團隊
**審核狀態**: 待審核
