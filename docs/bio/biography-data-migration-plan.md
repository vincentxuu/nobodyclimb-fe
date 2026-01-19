# Biography Data Migration 規劃文件

> **版本**: 1.1
> **建立日期**: 2026-01-18
> **更新日期**: 2026-01-18
> **目標**: 統一人物誌資料結構，完成 V1 → V2 遷移
> **狀態**: ✅ 方案 A 已實作

---

## 已完成：方案 A - 前端統一（不動後端資料）

### 實作內容

在 `src/lib/constants/biography-questions.ts` 中：

1. **新增映射表**
   - `LEGACY_STORY_FIELD_TO_V2_ID`: 34 個故事欄位名 → V2 問題 ID
   - `LEGACY_ONELINER_FIELD_TO_V2_ID`: 4 個一句話欄位名 → V2 問題 ID

2. **新增轉換函數**
   - `normalizeStoryQuestionId()`: 將舊欄位名轉換為 V2 ID
   - `normalizeOneLinerQuestionId()`: 將舊一句話欄位名轉換為 V2 ID

3. **更新查找函數**
   - `getStoryQuestionById()`: 支援舊欄位名和 V2 ID
   - `getOneLinerQuestionById()`: 支援舊欄位名和 V2 ID

4. **補充缺失的問題定義**
   - `CLIMBING_MEANING` (sys_ol_climbing_meaning)
   - `BUCKET_LIST` (sys_ol_bucket_list)

### 效果

- 後端 `stories_data` 使用舊欄位名（如 `climbing_origin`）
- 前端查找函數自動轉換為 V2 ID（如 `sys_story_growth_memorable_moment`）
- 顯示組件正常顯示問題標題和內容

---

## 原始分析（備參考）

---

## 一、問題分析

### 1.1 現況：兩套設計並存

| 面向 | V1 設計（舊） | V2 設計（新） | 衝突點 |
|------|-------------|-------------|--------|
| **故事欄位** | 34 個獨立 DB 欄位 | `stories_data` JSON | 資料分散 |
| **一句話** | 4 個獨立欄位 | `one_liners_data` JSON | 問題定義不同 |
| **標籤系統** | 不存在 | `tags_data` JSON | 無舊資料可遷移 |
| **問題 ID 格式** | 欄位名稱 (`climbing_origin`) | 系統 ID (`sys_story_growth_memorable_moment`) | ID 不一致 |

### 1.2 問題定義文件衝突

**V1 問題定義** (`biography-stories.ts`)：
- 使用 `field` 欄位對應 DB 欄位名
- 範例：`{ field: 'climbing_origin', category: 'growth', ... }`

**V2 問題定義** (`biography-questions.ts`)：
- 使用系統 ID 格式
- 範例：`{ id: 'sys_story_growth_memorable_moment', category_id: 'sys_cat_growth', ... }`

### 1.3 現有 Migration 0023 的問題

`0023_add_biography_v2_fields.sql` 已執行，但存在以下問題：

```sql
-- 目前的 stories_data 格式（使用舊欄位名）
{
  "growth": {
    "climbing_origin": { "answer": "...", "visibility": "public" },
    "memorable_moment": { "answer": "...", "visibility": "public" }
  }
}

-- 應該使用的格式（V2 問題 ID）
{
  "growth": {
    "sys_story_growth_memorable_moment": { "answer": "...", "visibility": "public" }
  }
}
```

### 1.4 欄位對照表

#### 故事問題映射 (V1 欄位 → V2 ID)

| V1 欄位名 | V2 問題 ID | 分類 |
|-----------|-----------|------|
| `climbing_origin` | `sys_story_growth_memorable_moment` | growth |
| `memorable_moment` | `sys_story_growth_memorable_moment` | growth |
| `biggest_challenge` | `sys_story_growth_biggest_challenge` | growth |
| `breakthrough_story` | `sys_story_growth_breakthrough` | growth |
| `first_outdoor` | `sys_story_growth_first_outdoor` | growth |
| `first_grade` | `sys_story_growth_first_grade` | growth |
| `frustrating_climb` | `sys_story_growth_frustrating` | growth |
| `fear_management` | `sys_story_psychology_fear` | psychology |
| `climbing_lesson` | `sys_story_psychology_lesson` | psychology |
| `failure_perspective` | `sys_story_psychology_failure` | psychology |
| `flow_moment` | `sys_story_psychology_flow` | psychology |
| `life_balance` | `sys_story_psychology_balance` | psychology |
| `unexpected_gain` | `sys_story_psychology_gain` | psychology |
| `climbing_mentor` | `sys_story_community_mentor` | community |
| `climbing_partner` | `sys_story_community_partner` | community |
| `funny_moment` | `sys_story_community_funny` | community |
| `favorite_spot` | `sys_story_community_spot` | community |
| `advice_to_group` | `sys_story_community_advice` | community |
| `climbing_space` | `sys_story_community_space` | community |
| `advice_to_self` | `sys_story_practical_injury` | practical |
| `injury_recovery` | `sys_story_practical_injury` | practical |
| `memorable_route` | `sys_story_practical_route` | practical |
| `training_method` | `sys_story_practical_training` | practical |
| `effective_practice` | `sys_story_practical_practice` | practical |
| `technique_tip` | `sys_story_practical_technique` | practical |
| `gear_choice` | `sys_story_practical_gear` | practical |
| `dream_climb` | `sys_story_dreams_dream_climb` | dreams |
| `climbing_trip` | `sys_story_dreams_trip` | dreams |
| `bucket_list_story` | `sys_story_dreams_bucket_list` | dreams |
| `climbing_goal` | `sys_story_dreams_goal` | dreams |
| `climbing_style` | `sys_story_dreams_style` | dreams |
| `climbing_inspiration` | `sys_story_dreams_inspiration` | dreams |
| `life_outside_climbing` | `sys_story_life_outside` | life |

#### 一句話問題映射 (V1 欄位 → V2 ID)

| V1 欄位名 | V2 問題 ID | 說明 |
|-----------|-----------|------|
| `climbing_reason` | `sys_ol_why_started` | 為什麼開始攀岩？ |
| `climbing_meaning` | *(需新增)* | 攀岩對你的意義 |
| `bucket_list` | *(需新增)* | 人生清單 |
| `advice` | `sys_ol_advice_for_beginners` | 給新手一句話 |

---

## 二、遷移策略

### 2.1 方案選擇

| 方案 | 說明 | 優點 | 缺點 |
|------|------|------|------|
| **A. 完全遷移到 V2** | 廢棄 V1 欄位，全部使用 JSON | 架構統一 | 需更新所有讀寫邏輯 |
| **B. 雙向相容** | 保留 V1 欄位，讀取時兼容 | 不破壞現有功能 | 複雜度高 |
| **C. 漸進式遷移** | 先同步，再逐步移除 V1 | 風險最低 | 過渡期較長 |

**建議採用方案 C：漸進式遷移**

### 2.2 遷移階段

```
Phase 1: 資料同步
├── 建立新 migration 更新 stories_data 使用 V2 ID
├── 建立新 migration 更新 one_liners_data
└── 保留舊欄位不變

Phase 2: 程式碼更新
├── 更新後端 API 讀取邏輯（優先讀 V2 JSON）
├── 更新前端 transformBackendToBiographyV2 函數
└── 更新編輯器寫入邏輯

Phase 3: 驗證與清理
├── 驗證所有人物誌顯示正確
├── 停止寫入舊欄位
└── (可選) 刪除舊欄位
```

---

## 三、實作細節

### 3.1 Phase 1: 資料同步

#### Migration 0024: 更新 stories_data ID 格式

```sql
-- Migration: 0024_migrate_stories_to_v2_ids.sql
-- Description: 將 stories_data 中的欄位名轉換為 V2 問題 ID

-- 建立映射函數（SQLite JSON 操作）
-- 由於 D1 SQLite 限制，需要用 JavaScript 在 Cloudflare Worker 中處理

-- 或使用 SQL 批次更新（簡化版）
UPDATE biographies
SET stories_data = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(stories_data,
            '"memorable_moment":', '"sys_story_growth_memorable_moment":'),
            '"biggest_challenge":', '"sys_story_growth_biggest_challenge":'),
            '"breakthrough_story":', '"sys_story_growth_breakthrough":'),
            '"first_outdoor":', '"sys_story_growth_first_outdoor":'),
            '"first_grade":', '"sys_story_growth_first_grade":'),
            '"frustrating_climb":', '"sys_story_growth_frustrating":'
)
WHERE stories_data IS NOT NULL;

-- ... 繼續其他欄位的 REPLACE
```

#### Migration Script (JavaScript 版本，推薦)

```javascript
// backend/scripts/migrate-biography-v2-ids.js

const V1_TO_V2_STORY_MAP = {
  // growth
  'climbing_origin': 'sys_story_growth_memorable_moment',
  'memorable_moment': 'sys_story_growth_memorable_moment',
  'biggest_challenge': 'sys_story_growth_biggest_challenge',
  'breakthrough_story': 'sys_story_growth_breakthrough',
  'first_outdoor': 'sys_story_growth_first_outdoor',
  'first_grade': 'sys_story_growth_first_grade',
  'frustrating_climb': 'sys_story_growth_frustrating',
  // psychology
  'fear_management': 'sys_story_psychology_fear',
  'climbing_lesson': 'sys_story_psychology_lesson',
  'failure_perspective': 'sys_story_psychology_failure',
  'flow_moment': 'sys_story_psychology_flow',
  'life_balance': 'sys_story_psychology_balance',
  'unexpected_gain': 'sys_story_psychology_gain',
  // community
  'climbing_mentor': 'sys_story_community_mentor',
  'climbing_partner': 'sys_story_community_partner',
  'funny_moment': 'sys_story_community_funny',
  'favorite_spot': 'sys_story_community_spot',
  'advice_to_group': 'sys_story_community_advice',
  'climbing_space': 'sys_story_community_space',
  // practical
  'advice_to_self': 'sys_story_practical_injury', // 注意：這個映射可能需要調整
  'injury_recovery': 'sys_story_practical_injury',
  'memorable_route': 'sys_story_practical_route',
  'training_method': 'sys_story_practical_training',
  'effective_practice': 'sys_story_practical_practice',
  'technique_tip': 'sys_story_practical_technique',
  'gear_choice': 'sys_story_practical_gear',
  // dreams
  'dream_climb': 'sys_story_dreams_dream_climb',
  'climbing_trip': 'sys_story_dreams_trip',
  'bucket_list_story': 'sys_story_dreams_bucket_list',
  'climbing_goal': 'sys_story_dreams_goal',
  'climbing_style': 'sys_story_dreams_style',
  'climbing_inspiration': 'sys_story_dreams_inspiration',
  // life
  'life_outside_climbing': 'sys_story_life_outside',
};

const V1_TO_V2_ONELINER_MAP = {
  'climbing_reason': 'sys_ol_why_started',
  'advice': 'sys_ol_advice_for_beginners',
  // 需要新增的映射
  'climbing_meaning': 'sys_ol_climbing_meaning', // 需要在 biography-questions.ts 新增
  'bucket_list': 'sys_ol_bucket_list', // 需要在 biography-questions.ts 新增
};

async function migrateStories(db) {
  const biographies = await db.prepare(
    'SELECT id, stories_data FROM biographies WHERE stories_data IS NOT NULL'
  ).all();

  for (const bio of biographies.results) {
    try {
      const oldData = JSON.parse(bio.stories_data);
      const newData = {};

      for (const [category, questions] of Object.entries(oldData)) {
        newData[category] = {};
        for (const [oldKey, value] of Object.entries(questions || {})) {
          const newKey = V1_TO_V2_STORY_MAP[oldKey] || oldKey;
          if (value && value.answer) {
            newData[category][newKey] = value;
          }
        }
      }

      await db.prepare(
        'UPDATE biographies SET stories_data = ? WHERE id = ?'
      ).bind(JSON.stringify(newData), bio.id).run();

    } catch (e) {
      console.error(`Failed to migrate biography ${bio.id}:`, e);
    }
  }
}

async function migrateOneLiners(db) {
  const biographies = await db.prepare(
    'SELECT id, one_liners_data FROM biographies WHERE one_liners_data IS NOT NULL'
  ).all();

  for (const bio of biographies.results) {
    try {
      const oldData = JSON.parse(bio.one_liners_data);
      const newData = {};

      for (const [oldKey, value] of Object.entries(oldData)) {
        const newKey = V1_TO_V2_ONELINER_MAP[oldKey] || oldKey;
        if (value && value.answer) {
          newData[newKey] = value;
        }
      }

      await db.prepare(
        'UPDATE biographies SET one_liners_data = ? WHERE id = ?'
      ).bind(JSON.stringify(newData), bio.id).run();

    } catch (e) {
      console.error(`Failed to migrate biography ${bio.id}:`, e);
    }
  }
}

export { migrateStories, migrateOneLiners };
```

### 3.2 Phase 2: 程式碼更新

#### 更新前端轉換函數

**檔案**: `src/lib/types/biography-v2.ts`

```typescript
// 新增：V1 欄位名到 V2 ID 的映射
const V1_TO_V2_STORY_MAP: Record<string, string> = {
  'climbing_origin': 'sys_story_growth_memorable_moment',
  'memorable_moment': 'sys_story_growth_memorable_moment',
  // ... 完整映射
};

const V1_TO_V2_ONELINER_MAP: Record<string, string> = {
  'climbing_reason': 'sys_ol_why_started',
  'advice': 'sys_ol_advice_for_beginners',
  // ...
};

export function transformBackendToBiographyV2(backend: BiographyBackend): BiographyV2 {
  // ... 現有邏輯

  // 解析 stories_data，同時支援 V1 和 V2 ID 格式
  const storiesRaw = safeJsonParse<...>(backend.stories_data, {}) || {};
  const stories: StoryItem[] = Object.values(storiesRaw)
    .flatMap((category) =>
      Object.entries(category || {})
        .filter(([, data]) => data?.answer)
        .map(([question_id, data]) => ({
          // 如果是 V1 ID，轉換為 V2 ID
          question_id: V1_TO_V2_STORY_MAP[question_id] || question_id,
          content: data!.answer,
          source: 'system' as ContentSource,
        }))
    );

  // 新增：如果 stories_data 為空，從舊欄位讀取
  if (stories.length === 0) {
    const legacyStories = extractLegacyStories(backend);
    stories.push(...legacyStories);
  }

  // ... 其餘邏輯
}

// 新增：從舊欄位提取故事
function extractLegacyStories(backend: BiographyBackend): StoryItem[] {
  const legacyFields = [
    'climbing_origin', 'memorable_moment', 'biggest_challenge',
    // ... 所有舊欄位
  ];

  return legacyFields
    .filter(field => backend[field as keyof BiographyBackend])
    .map(field => ({
      question_id: V1_TO_V2_STORY_MAP[field] || field,
      content: backend[field as keyof BiographyBackend] as string,
      source: 'system' as ContentSource,
    }));
}
```

#### 新增缺失的一句話問題定義

**檔案**: `src/lib/constants/biography-questions.ts`

```typescript
// 在 SYSTEM_ONELINER_QUESTIONS 中新增
export const SYSTEM_ONELINER_QUESTIONS = {
  // ... 現有的
  CLIMBING_MEANING: 'sys_ol_climbing_meaning',    // 新增
  BUCKET_LIST: 'sys_ol_bucket_list',              // 新增
} as const;

// 在 SYSTEM_ONELINER_QUESTION_LIST 中新增
{
  id: SYSTEM_ONELINER_QUESTIONS.CLIMBING_MEANING,
  source: 'system',
  question: '攀岩對你來說是什麼？',
  format_hint: '對我來說，攀岩是＿＿＿',
  placeholder: '一種生活方式/挑戰自我的方式',
  order: 9,
},
{
  id: SYSTEM_ONELINER_QUESTIONS.BUCKET_LIST,
  source: 'system',
  question: '攀岩人生清單上有什麼？',
  format_hint: null,
  placeholder: '去優勝美地爬一次',
  order: 10,
},
```

### 3.3 Phase 3: 驗證與清理

#### 驗證腳本

```javascript
// backend/scripts/verify-migration.js

async function verifyMigration(db) {
  const results = {
    total: 0,
    withStoriesData: 0,
    withOneLinersData: 0,
    withV2Ids: 0,
    issues: [],
  };

  const biographies = await db.prepare('SELECT * FROM biographies').all();
  results.total = biographies.results.length;

  for (const bio of biographies.results) {
    if (bio.stories_data) {
      results.withStoriesData++;
      const data = JSON.parse(bio.stories_data);

      // 檢查是否使用 V2 ID
      const hasV2Id = Object.values(data).some(category =>
        Object.keys(category || {}).some(key => key.startsWith('sys_'))
      );

      if (hasV2Id) {
        results.withV2Ids++;
      } else {
        results.issues.push({
          id: bio.id,
          type: 'stories_not_migrated',
        });
      }
    }

    if (bio.one_liners_data) {
      results.withOneLinersData++;
    }
  }

  return results;
}
```

#### 清理遷移（可選，Phase 3 完成後）

```sql
-- Migration: 0025_cleanup_v1_fields.sql (執行前請確認所有資料已遷移)
-- ⚠️ 危險操作，建議保留欄位至少 3 個月

-- 不建議直接刪除欄位，改為標記棄用
-- 或使用以下 SQL 清理（需要 SQLite 重建表）

-- 如果確定要清理，可以設為 NULL
UPDATE biographies SET
  climbing_origin = NULL,
  memorable_moment = NULL,
  biggest_challenge = NULL,
  -- ... 其他欄位
WHERE stories_data IS NOT NULL
  AND JSON_EXTRACT(stories_data, '$') != '{}';
```

---

## 四、執行計畫

### 4.1 時程規劃

| 階段 | 任務 | 預估時間 | 負責人 |
|------|------|----------|--------|
| Phase 1.1 | 撰寫並測試 migration script | 2 天 | - |
| Phase 1.2 | 在 preview 環境執行 migration | 1 天 | - |
| Phase 1.3 | 驗證 preview 資料正確性 | 1 天 | - |
| Phase 1.4 | 在 production 執行 migration | 1 天 | - |
| Phase 2.1 | 更新前端轉換函數 | 1 天 | - |
| Phase 2.2 | 更新問題定義文件 | 0.5 天 | - |
| Phase 2.3 | 更新後端 API | 1 天 | - |
| Phase 3.1 | 全面驗證 | 1 天 | - |
| Phase 3.2 | 監控與修復 | 持續 | - |

### 4.2 風險評估

| 風險 | 機率 | 影響 | 緩解措施 |
|------|------|------|----------|
| 資料遺失 | 低 | 高 | 執行前完整備份 |
| ID 映射錯誤 | 中 | 中 | 建立完整對照表並覆核 |
| 前後端不同步 | 中 | 中 | 同時部署，使用 feature flag |
| 效能問題 | 低 | 低 | 分批處理，監控執行時間 |

### 4.3 回滾計畫

1. **資料回滾**: 從備份恢復 D1 資料庫
2. **程式碼回滾**: Revert Git commits，重新部署
3. **緊急修復**: 保留舊欄位讀取邏輯作為 fallback

---

## 五、檢查清單

### 5.1 執行前

- [ ] 完整備份 production D1 資料庫
- [ ] 在 preview 環境測試 migration script
- [ ] 確認映射表完整性
- [ ] 通知相關人員維護窗口
- [ ] 準備回滾腳本

### 5.2 執行中

- [ ] 執行 migration script
- [ ] 監控執行日誌
- [ ] 抽樣檢查遷移結果
- [ ] 執行驗證腳本

### 5.3 執行後

- [ ] 部署更新後的前端程式碼
- [ ] 部署更新後的後端程式碼
- [ ] 全面功能測試
- [ ] 監控錯誤日誌
- [ ] 更新文件

---

## 六、附錄

### 6.1 相關文件

- `src/lib/types/biography-v2.ts` - V2 類型定義
- `src/lib/constants/biography-questions.ts` - V2 問題定義
- `src/lib/constants/biography-stories.ts` - V1 問題定義
- `src/lib/constants/biography-tags.ts` - 標籤維度定義
- `backend/migrations/0023_add_biography_v2_fields.sql` - 現有 V2 欄位 migration

### 6.2 資料庫欄位一覽

**V2 JSON 欄位** (0023 新增)：
- `visibility` - 可見性設定
- `tags_data` - 標籤選擇 JSON
- `one_liners_data` - 一句話回答 JSON
- `stories_data` - 故事回答 JSON
- `basic_info_data` - 基本資訊備份 JSON
- `autosave_at` - 自動保存時間戳

**V1 獨立欄位** (待棄用)：
- 基本：`climbing_reason`, `climbing_meaning`, `bucket_list`, `advice`
- 成長：`climbing_origin`, `memorable_moment`, `biggest_challenge`, ...
- 心理：`fear_management`, `climbing_lesson`, `failure_perspective`, ...
- 社群：`climbing_mentor`, `climbing_partner`, `funny_moment`, ...
- 實用：`injury_recovery`, `memorable_route`, `training_method`, ...
- 夢想：`dream_climb`, `climbing_trip`, `bucket_list_story`, ...
- 生活：`life_outside_climbing`
