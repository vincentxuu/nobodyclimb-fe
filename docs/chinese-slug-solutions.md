# 中文名稱 Slug 生成問題與解決方案

## 問題描述

目前 `generateSlug` 函數位於 `backend/src/utils/id.ts:11-17`：

```typescript
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

### 問題根源

正則表達式 `\W` 匹配所有非 word characters（即 `[^a-zA-Z0-9_]`），這會導致：

- 中文字符被全部替換為 `-`
- 連續的 `-` 最後被清除
- 結果：中文名稱部分完全消失

### 影響範例

| 輸入名稱 | 當前結果 | 預期結果 |
|----------|----------|----------|
| John Doe | `john-doe-abcd1234` | `john-doe-abcd1234` |
| 王小明 | `-abcd1234` | 應包含名稱資訊 |
| 陳大文 Alex | `-alex-abcd1234` | 應包含完整名稱 |

### 相關程式碼位置

- Slug 生成工具：`backend/src/utils/id.ts`
- Biography 建立：`backend/src/routes/biographies.ts:570`
- Biography 更新：`backend/src/routes/biographies.ts:512`, `768`

---

## 解決方案

### 方案一：保留中文字符（推薦）

直接保留中文字符在 slug 中，現代瀏覽器和伺服器都支援 Unicode URL。

#### 實作

```typescript
// backend/src/utils/id.ts
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, '-')              // 只處理空格為連字符
    .replace(/[^\w\u4e00-\u9fff-]/g, '') // 保留英數、中文(CJK)、連字符
    .replace(/-+/g, '-')                 // 合併多個連字符
    .replace(/^-+|-+$/g, '');            // 去除首尾連字符
}
```

#### 結果範例

| 輸入 | 輸出 |
|------|------|
| 王小明 | `王小明-abcd1234` |
| 陳大文 Alex | `陳大文-alex-abcd1234` |
| John Doe | `john-doe-abcd1234` |

#### 優點

- SEO 友好，搜尋引擎可索引中文
- 用戶辨識度高，一眼看出是誰的頁面
- URL 可讀性佳
- 實作簡單，無需額外依賴

#### 缺點

- URL 在某些情況下會顯示編碼形式（如 `%E7%8E%8B%E5%B0%8F%E6%98%8E`）
- 複製貼上時可能出現編碼字串

#### 技術考量

- RFC 3986 允許 UTF-8 字符在 URL 中
- 現代瀏覽器會自動處理 URL 編碼/解碼
- Cloudflare Workers 完全支援 Unicode URL

---

### 方案二：拼音轉換

將中文轉換為拼音，產生純 ASCII 的 slug。

#### 依賴安裝

```bash
cd backend
pnpm add pinyin-pro
```

#### 實作

```typescript
// backend/src/utils/id.ts
import { pinyin } from 'pinyin-pro';

export function generateSlug(text: string): string {
  // 檢測是否包含中文
  const hasChinese = /[\u4e00-\u9fff]/.test(text);

  let processedText = text;
  if (hasChinese) {
    // 將中文轉為拼音，不帶音調
    processedText = pinyin(text, {
      toneType: 'none',
      type: 'array',
      separator: ''
    }).join('');
  }

  return processedText
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

#### 結果範例

| 輸入 | 輸出 |
|------|------|
| 王小明 | `wangxiaoming-abcd1234` |
| 陳大文 Alex | `chendawen-alex-abcd1234` |
| John Doe | `john-doe-abcd1234` |

#### 優點

- 純 ASCII URL，無編碼問題
- 國際化友好，非中文用戶也能閱讀
- URL 分享時不會出現亂碼

#### 缺點

- 需要額外依賴套件（~50KB）
- 多音字可能產生非預期結果（如「單」可能是 dan 或 shan）
- 不支援日文、韓文等其他 CJK 文字
- 拼音相同的名字會產生相似 slug

#### 多音字處理

```typescript
// 可使用姓名模式提高準確度
const processedText = pinyin(text, {
  toneType: 'none',
  mode: 'surname',  // 姓名模式，優先使用姓氏讀音
  type: 'array'
}).join('');
```

---

### 方案三：純 ID Fallback

當中文名稱無法產生有效 slug 時，直接使用 ID。

#### 實作

```typescript
// backend/src/utils/id.ts
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// backend/src/routes/biographies.ts
// 修改 slug 生成邏輯
const nameSlug = generateSlug(body.name);
const slug = nameSlug
  ? `${nameSlug}-${id.substring(0, 8)}`
  : id.substring(0, 8);
```

#### 結果範例

| 輸入 | 輸出 |
|------|------|
| 王小明 | `abcd1234` |
| 陳大文 Alex | `alex-abcd1234` |
| John Doe | `john-doe-abcd1234` |

#### 優點

- 實作最簡單
- 不需要額外依賴
- 不會有編碼問題
- 向後相容性最好

#### 缺點

- URL 缺乏可讀性
- SEO 效果較差
- 用戶無法從 URL 辨識頁面內容

---

## 方案比較

| 評估項目 | 方案一（保留中文） | 方案二（拼音） | 方案三（純 ID） |
|----------|-------------------|----------------|-----------------|
| 實作複雜度 | 低 | 中 | 最低 |
| SEO 效果 | 好 | 好 | 差 |
| URL 可讀性 | 好（中文用戶） | 中 | 差 |
| 額外依賴 | 無 | pinyin-pro | 無 |
| 國際化 | 僅中文 | 僅中文 | 通用 |
| 分享友好度 | 中（可能編碼） | 好 | 中 |

---

## 建議

### 短期方案

建議採用**方案一（保留中文字符）**：

1. 實作成本最低
2. 對中文用戶體驗最好
3. SEO 友好
4. 無需額外依賴

### 長期考量

如果未來需要支援：

- 日文用戶：考慮擴展正則表達式包含平假名、片假名
- 韓文用戶：擴展包含韓文字符範圍
- 全球化：考慮方案二的變體，使用 `transliteration` 套件

### Unicode 範圍參考

```typescript
// CJK 統一漢字
const CJK_UNIFIED = /[\u4e00-\u9fff]/;

// 日文平假名
const HIRAGANA = /[\u3040-\u309f]/;

// 日文片假名
const KATAKANA = /[\u30a0-\u30ff]/;

// 韓文
const HANGUL = /[\uac00-\ud7af]/;

// 完整 CJK 支援
const CJK_ALL = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;
```

---

## 實作步驟（方案一）

1. 修改 `backend/src/utils/id.ts` 中的 `generateSlug` 函數
2. 測試各種輸入情境
3. 部署到 preview 環境驗證
4. 部署到 production

### 測試案例

```typescript
// 測試案例
const testCases = [
  { input: '王小明', expected: '王小明' },
  { input: 'John Doe', expected: 'john-doe' },
  { input: '陳大文 Alex', expected: '陳大文-alex' },
  { input: '  多餘空格  ', expected: '多餘空格' },
  { input: 'Test@#$%123', expected: 'test123' },
  { input: '攀岩者2024', expected: '攀岩者2024' },
];
```
