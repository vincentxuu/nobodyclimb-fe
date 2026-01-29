# Entity Type 命名規範

> 定義 API 路徑、資料庫欄位、前端程式碼中的 entity_type 命名規則

## 命名規範

### API 路徑 (RESTful - 複數/kebab-case)
API 路徑遵循 RESTful 慣例,使用**複數名詞 + kebab-case**:

```
/api/v1/likes/biographies/:id
/api/v1/likes/posts/:id
/api/v1/likes/bucket-list/:id
/api/v1/likes/core-stories/:id
/api/v1/likes/one-liners/:id
/api/v1/likes/stories/:id
/api/v1/likes/galleries/:id
/api/v1/likes/videos/:id
/api/v1/likes/gyms/:id
/api/v1/likes/crags/:id
/api/v1/likes/routes/:id
```

### 資料庫 entity_type (單數/snake_case)
資料庫欄位使用**單數名詞 + snake_case**:

```sql
entity_type IN (
  'biography',
  'post',
  'bucket_list_item',
  'core_story',
  'one_liner',
  'story',
  'gallery',
  'video',
  'gym',
  'crag',
  'route'
)
```

### 前端 TypeScript (單數/camelCase)
TypeScript 類型定義使用**單數名詞 + camelCase**:

```typescript
type EntityType =
  | 'biography'
  | 'post'
  | 'bucketListItem'
  | 'coreStory'
  | 'oneLiner'
  | 'story'
  | 'gallery'
  | 'video'
  | 'gym'
  | 'crag'
  | 'route';
```

## 映射表

| 資源名稱 | API 路徑 (複數) | DB entity_type (單數) | 表格名稱 | 前端類型 |
|---------|----------------|---------------------|---------|---------|
| 人物誌 | `biographies` | `biography` | `biographies` | `biography` |
| 文章 | `posts` | `post` | `posts` | `post` |
| 人生清單 | `bucket-list` | `bucket_list_item` | `bucket_list_items` | `bucketListItem` |
| 核心故事 | `core-stories` | `core_story` | `biography_core_stories` | `coreStory` |
| 一句話 | `one-liners` | `one_liner` | `biography_one_liners` | `oneLiner` |
| 小故事 | `stories` | `story` | `biography_stories` | `story` |
| 相簿 | `galleries` | `gallery` | `galleries` | `gallery` |
| 影片 | `videos` | `video` | `videos` | `video` |
| 室內岩館 | `gyms` | `gym` | `gyms` | `gym` |
| 戶外岩場 | `crags` | `crag` | `crags` | `crag` |
| 攀岩路線 | `routes` | `route` | `routes` | `route` |

## 轉換函式

### 後端 (Hono)

```typescript
// utils/entity-type-mapper.ts

const API_TO_DB_MAPPING: Record<string, string> = {
  'biographies': 'biography',
  'posts': 'post',
  'bucket-list': 'bucket_list_item',
  'core-stories': 'core_story',
  'one-liners': 'one_liner',
  'stories': 'story',
  'galleries': 'gallery',
  'videos': 'video',
  'gyms': 'gym',
  'crags': 'crag',
  'routes': 'route',
};

const DB_TO_API_MAPPING: Record<string, string> = {
  'biography': 'biographies',
  'post': 'posts',
  'bucket_list_item': 'bucket-list',
  'core_story': 'core-stories',
  'one_liner': 'one-liners',
  'story': 'stories',
  'gallery': 'galleries',
  'video': 'videos',
  'gym': 'gyms',
  'crag': 'crags',
  'route': 'routes',
};

export function apiToDbEntityType(apiType: string): string {
  const dbType = API_TO_DB_MAPPING[apiType];
  if (!dbType) {
    throw new Error(`Invalid entity type: ${apiType}`);
  }
  return dbType;
}

export function dbToApiEntityType(dbType: string): string {
  const apiType = DB_TO_API_MAPPING[dbType];
  if (!apiType) {
    throw new Error(`Invalid entity type: ${dbType}`);
  }
  return apiType;
}

export const VALID_API_ENTITY_TYPES = Object.keys(API_TO_DB_MAPPING);
export const VALID_DB_ENTITY_TYPES = Object.keys(DB_TO_API_MAPPING);
```

### 使用範例

```typescript
// routes/likes.ts
import { apiToDbEntityType } from '../utils/entity-type-mapper';

likes.post('/:entityType/:entityId', authMiddleware, async (c) => {
  const apiEntityType = c.req.param('entityType');
  const dbEntityType = apiToDbEntityType(apiEntityType); // 'bucket-list' → 'bucket_list_item'

  // 使用 dbEntityType 查詢資料庫
  await c.env.DB.prepare(
    'INSERT INTO likes (user_id, entity_type, entity_id) VALUES (?, ?, ?)'
  ).bind(userId, dbEntityType, entityId).run();
});
```

## 驗證邏輯

### API 層驗證
```typescript
if (!VALID_API_ENTITY_TYPES.includes(apiEntityType)) {
  return c.json({ error: 'Invalid entity type' }, 400);
}
```

### 資料庫層驗證
```sql
CHECK (entity_type IN (
  'biography', 'post', 'bucket_list_item',
  'core_story', 'one_liner', 'story',
  'gallery', 'video', 'gym', 'crag', 'route'
))
```

## 注意事項

1. **API 路徑使用複數** - 符合 RESTful 慣例
2. **資料庫使用單數** - 符合資料建模慣例
3. **特殊情況**: `bucket-list` API 映射到 `bucket_list_item` DB (因為表格是 `bucket_list_items`)
4. **一致性**: 所有新功能必須遵循此規範
5. **向下相容**: 舊 API 端點可以保留,逐步遷移

## 相關文件

- [重構計劃](./REFACTORING-PLAN-FINAL.md)
- [API 設計規範](./API-DESIGN-GUIDELINES.md) (待建立)
- [Migration 0027](../../backend/migrations/0027_consolidated_schema_updates.sql)
