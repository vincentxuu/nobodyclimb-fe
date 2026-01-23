# 人物誌卡片內容選擇演算法規格

## 文檔資訊
- **版本**: 2.0
- **建立日期**: 2026-01-22
- **最後更新**: 2026-01-22
- **狀態**: 提案中

## 問題描述

### 當前問題
在人物誌列表頁面（`/biography`），每張卡片會顯示一個問題和答案。當前的演算法存在以下問題：

**問題場景**：
```
卡片 1: 顯示「攀岩對你來說是什麼？」- 使用者 A 的答案
卡片 2 (Jude): 也想顯示「攀岩對你來說是什麼？」- Jude 的答案
```

**當前行為**：
- 系統為了避免問題重複，會跳過 Jude 已填寫的 `climbing_meaning`
- 嘗試使用其他問題（如 `climbing_origin`、`advice_to_self`）
- 如果 Jude 只填了 `climbing_meaning`，其他問題都是空的
- **結果**：即使 Jude 有資料，卡片仍顯示預設語錄「手指還在長繭中，故事正在醞釀」

**影響**：
- 用戶體驗差：明明填了資料卻看不到
- 誤導性：訪客以為這個用戶沒有填寫內容
- 降低內容豐富度：有價值的內容被隱藏

### 當前邏輯流程

```typescript
// 位置: src/lib/utils/biography-cache.ts:210-296

function selectCardContent(
  id: string,
  oneLinersJson: string | null | undefined,
  storiesJson: string | null | undefined,
  usedQuestionIds: Set<string> = new Set()  // ⚠️ 問題：優先考慮去重
): SelectedCardContent | null {
  // 1. 解析 one_liners_data 和 stories_data
  // 2. 收集可用內容，**但排除已使用的問題 ID**
  // 3. 如果沒有可用內容，返回 null（使用預設語錄）
  // 4. 使用 ID hash 選擇一個固定的內容
}
```

**優先級順序（當前）**：
1. ❌ 避免問題 ID 重複
2. 顯示用戶真實內容
3. 使用預設語錄

---

## 解決方案

### 核心原則

**新的優先級順序**：
1. ✅ **優先顯示用戶真實內容**（即使問題重複）
2. 盡量避免問題重複（但非強制）
3. 沒有內容時才使用預設語錄

**設計理念**：
- 「問題重複」的用戶體驗損害 < 「有資料卻顯示預設值」的用戶體驗損害
- 真實內容永遠比預設語錄有價值
- 允許一定程度的問題重複，但保持多樣性

### 新演算法規則

#### 階段 1：收集所有可用內容（不考慮重複）

```typescript
// 收集用戶所有 public 的內容
const allAvailableContent = [
  ...oneLinersContent,  // 所有 one-liners（visibility = 'public'）
  ...storiesContent      // 所有 stories（visibility = 'public'）
]
```

#### 階段 2：內容選擇策略（按優先級）

**策略 1：優先選擇未使用的問題**
```typescript
const unusedContent = allAvailableContent.filter(
  item => !usedQuestionIds.has(item.key)
)

if (unusedContent.length > 0) {
  return selectByHash(id, unusedContent)  // 使用 ID hash 選擇固定內容
}
```

**策略 2：如果所有問題都被使用過，允許重複**
```typescript
// 計算每個問題被使用的次數
const usageCount = getQuestionUsageCount(usedQuestionIds)

// 選擇被使用次數最少的問題
const leastUsedContent = allAvailableContent.filter(
  item => usageCount[item.key] === minUsageCount
)

if (leastUsedContent.length > 0) {
  return selectByHash(id, leastUsedContent)
}
```

**策略 3：沒有內容，使用預設語錄**
```typescript
return null  // 返回 null，外層顯示預設語錄
```

#### 階段 3：問題去重限制（可選）

為了避免過度重複，可以設置**重複上限**：

```typescript
const MAX_QUESTION_REPETITION = 3  // 同一問題最多出現 3 次

// 在策略 2 中，過濾掉已達上限的問題
const availableContent = allAvailableContent.filter(
  item => (usageCount[item.key] || 0) < MAX_QUESTION_REPETITION
)
```

---

## 實作細節

### 數據結構調整

**修改 `usedQuestionIds` 為使用次數記錄**：

```typescript
// 舊版本（Set）
usedQuestionIds: Set<string>

// 新版本（Map，僅支援 Map）
questionUsageCount: Map<string, number>
```

**在 biography-list.tsx 中的調整**：

```typescript
// 舊版本
const biographiesWithContent = useMemo(() => {
  return biographies.reduce((acc, person) => {
    const usedQuestionIds = new Set(acc.usedIds)  // ❌
    const content = selectCardContent(
      person.id,
      person.one_liners_data,
      person.stories_data,
      usedQuestionIds
    )
    // ...
  }, { items: [], usedIds: [] })
}, [biographies])

// 新版本
const biographiesWithContent = useMemo(() => {
  return biographies.reduce((acc, person) => {
    const usageCount = new Map(acc.usageCount)  // ✅
    const content = selectCardContent(
      person.id,
      person.one_liners_data,
      person.stories_data,
      usageCount
    )

    // 更新使用次數
    if (content?.questionId) {
      usageCount.set(
        content.questionId,
        (usageCount.get(content.questionId) || 0) + 1
      )
    }

    return {
      items: [...acc.items, { person, content }],
      usageCount
    }
  }, { items: [], usageCount: new Map() })
}, [biographies])
```

### 新的 `selectCardContent` 函數簽名

```typescript
export function selectCardContent(
  id: string,
  oneLinersJson: string | null | undefined,
  storiesJson: string | null | undefined,
  questionUsageCount: Map<string, number> = new Map(),  // 改用 Map
  options?: {
    maxRepetition?: number  // 預設 3，可自訂
    allowRepetition?: boolean  // 預設 true
  }
): SelectedCardContent | null
```

---

## 邊界情況處理

### 情況 1：用戶只填了一個問題，且已被使用

**範例**：
- Jude 只填了 `climbing_meaning`
- 前面已有 2 張卡片使用 `climbing_meaning`

**處理**：
- 允許重複，顯示 Jude 的 `climbing_meaning` 答案
- 問題重複次數：3

### 情況 2：用戶填了多個問題，部分已被使用

**範例**：
- 用戶填了 `climbing_meaning`、`climbing_origin`、`advice_to_self`
- `climbing_meaning` 已被使用 2 次
- `climbing_origin` 已被使用 1 次
- `advice_to_self` 未被使用

**處理**：
- 優先選擇 `advice_to_self`（未使用）
- 如果 hash 結果選到已使用的，選擇使用次數較少的

### 情況 3：達到重複上限

**範例**：
- 某個問題已被使用 3 次（達到上限）
- 用戶只填了這個問題

**處理**：
- 如果 `allowRepetition = true` 且達上限：顯示內容，但記錄警告
- 如果 `allowRepetition = false`：跳過，使用預設語錄

### 情況 4：所有用戶都只填同一個問題

**範例**：
- 20 張卡片，大家都只填了 `climbing_meaning`

**處理**：
- 全部顯示 `climbing_meaning`，允許重複
- 因為顯示真實內容 > 避免重複

---

## 效能考量

### Hash 選擇策略

**當前實作**：
```typescript
const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
const index = hash % availableContent.length
```

**優點**：
- 同一用戶每次顯示相同內容（穩定性）
- 簡單高效

**維持不變**：這個策略很好，不需要修改

### 記憶體使用

**舊版本**：
- `Set<string>`：只記錄已使用的問題 ID
- 記憶體：O(n)，n = 不重複問題數

**新版本**：
- `Map<string, number>`：記錄每個問題的使用次數
- 記憶體：O(n)，n = 不重複問題數

**影響**：
- 記憶體增加：每個 entry 多儲存一個 number
- 可接受：總問題數量有限（約 40 題）

---

## 測試案例

### 測試 1：基本功能 - 優先顯示真實內容

```typescript
// 輸入
const usageCount = new Map([
  ['climbing_meaning', 1]  // 已被使用 1 次
])

const oneLinersData = {
  climbing_meaning: { answer: 'Jude 的答案', visibility: 'public' }
}

// 期望輸出
{
  question: '攀岩對你來說是什麼？',
  answer: 'Jude 的答案',
  questionId: 'climbing_meaning'
}

// ✅ 即使問題重複，仍顯示真實內容
```

### 測試 2：多個可用問題 - 優先選擇未使用

```typescript
// 輸入
const usageCount = new Map([
  ['climbing_meaning', 2],
  ['climbing_origin', 1]
])

const oneLinersData = {
  climbing_meaning: { answer: '答案 1', visibility: 'public' },
  climbing_origin: { answer: '答案 2', visibility: 'public' },
  advice_to_self: { answer: '答案 3', visibility: 'public' }  // 未使用
}

// 期望輸出
// 優先選擇 advice_to_self（未使用）
{
  question: '給剛開始攀岩的自己',
  answer: '答案 3',
  questionId: 'advice_to_self'
}
```

### 測試 3：達到重複上限 - 仍顯示內容

```typescript
// 輸入
const usageCount = new Map([
  ['climbing_meaning', 3]  // 已達上限
])

const oneLinersData = {
  climbing_meaning: { answer: 'Jude 的答案', visibility: 'public' }
}

// 期望輸出（allowRepetition = true）
{
  question: '攀岩對你來說是什麼？',
  answer: 'Jude 的答案',
  questionId: 'climbing_meaning'
}

// ✅ 有內容就顯示，不要用預設值
```

### 測試 4：無可用內容 - 使用預設值

```typescript
// 輸入
const oneLinersData = {
  climbing_meaning: { answer: '', visibility: 'public' }  // 空答案
}

// 期望輸出
null  // 返回 null，外層顯示預設語錄
```

---

## 遷移計劃

### 第 1 階段：修改核心函數
- 修改 `selectCardContent` 函數邏輯
- 支援 `Map<string, number>` 參數
 - 僅支援 `Map` 作為使用次數記錄（不提供 `Set` 向下相容）

### 第 2 階段：更新調用處
- 修改 `biography-list.tsx`
- 修改 `recommended-profiles.tsx`（如果有使用）
- 修改首頁人物誌區塊

### 第 3 階段：測試驗證
- 單元測試：測試各種邊界情況
- E2E 測試：驗證卡片顯示正確
- 生產驗證：檢查所有卡片都有內容

---

## 配置選項

### 全域配置（可選）

```typescript
// src/lib/constants/biography-config.ts

export const BIOGRAPHY_CARD_CONFIG = {
  // 同一問題最多重複次數（0 = 無限制）
  maxQuestionRepetition: 3,

  // 是否允許問題重複
  allowRepetition: true,

  // 是否優先顯示真實內容（即使重複）
  prioritizeRealContent: true,

  // 預設語錄池（當真的沒有內容時使用）
  defaultQuotes: [
    '正在岩壁上尋找人生的意義...',
    '手指還在長繭中，故事正在醞釀',
    // ...
  ]
}
```

---

## 成效指標

### 實作後預期改善

**改善前**：
- 有內容但顯示預設值的卡片：**估計 15-20%**
- 用戶困惑度：高（填了資料看不到）

**改善後**：
- 有內容但顯示預設值的卡片：**< 5%**（僅限真的沒填資料）
- 用戶滿意度：提升
- 內容豐富度：提升

### 監控指標

```typescript
// 開發環境 debug
if (process.env.NODE_ENV === 'development') {
  console.log('卡片內容選擇統計', {
    totalCards: biographies.length,
    withRealContent: cardsWithContent,
    withDefaultQuote: cardsWithDefaultQuote,
    questionRepetitionStats: usageCount
  })
}
```

---

## 參考資料

- **相關檔案**：
  - `src/lib/utils/biography-cache.ts` - 當前實作
  - `src/components/biography/biography-list.tsx` - 列表頁面
  - `src/components/home/biography-section.tsx` - 首頁區塊

- **相關 Issue**：
  - Jude 有 `climbing_meaning` 但卡片顯示預設值

- **設計原則**：
  - 真實內容 > 多樣性 > 預設值
  - 用戶體驗 > 技術完美

---

## 附錄：完整演算法偽代碼

```typescript
function selectCardContent(
  id: string,
  oneLinersJson: string,
  storiesJson: string,
  questionUsageCount: Map<string, number>,
  options = { maxRepetition: 3, allowRepetition: true }
): SelectedCardContent | null {

  // 1. 解析 JSON 數據
  const oneLiners = parseJSON(oneLinersJson)
  const stories = parseJSON(storiesJson)

  // 2. 收集所有可用內容（visibility = 'public' 且有答案）
  const allContent = [
    ...extractOneLiners(oneLiners),
    ...extractStories(stories)
  ]

  // 3. 如果沒有任何內容，使用預設語錄
  if (allContent.length === 0) {
    return null  // 使用預設語錄
  }

  // 4. 策略 1：優先選擇未使用的問題
  const unusedContent = allContent.filter(
    item => !questionUsageCount.has(item.key)
  )

  if (unusedContent.length > 0) {
    return selectByHash(id, unusedContent)
  }

  // 5. 策略 2：所有問題都被使用過，選擇使用次數最少的
  if (options.allowRepetition) {
    const minUsage = Math.min(...Array.from(questionUsageCount.values()))

    const leastUsedContent = allContent.filter(item => {
      const usage = questionUsageCount.get(item.key) || 0

      // 檢查是否達到重複上限
      if (options.maxRepetition > 0 && usage >= options.maxRepetition) {
        return false
      }

      return usage === minUsage
    })

    if (leastUsedContent.length > 0) {
      return selectByHash(id, leastUsedContent)
    }
  }

  // 6. 所有問題都達上限，但仍有內容 - 顯示內容（記錄警告）
  if (options.prioritizeRealContent && allContent.length > 0) {
    console.warn(`所有問題都達重複上限，但仍顯示內容 (user: ${id})`)
    return selectByHash(id, allContent)
  }

  // 7. 最後才使用預設語錄
  return null  // 使用預設語錄
}

// 輔助函數：使用 ID hash 選擇固定內容
function selectByHash(id: string, content: Content[]): SelectedCardContent {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const index = hash % content.length
  return content[index]
}
```

---

## 變更歷史

- **v2.0** (2026-01-22): 初版規格，解決「有資料卻顯示預設值」問題
- 待實作
