# Text-to-SQL 設計討論

> 整理自 2026-03-06 討論

---

## 核心概念

**Text-to-SQL** 讓 LLM 把自然語言翻譯成 SQL，然後執行真實查詢，取得精確結果。

```
用戶輸入：「龍洞有幾條路線？」
    ↓ LLM 翻譯
SQL：SELECT COUNT(*) FROM routes r
     JOIN crags c ON r.crag_id = c.id
     WHERE c.name = '龍洞'
    ↓ D1 執行
結果：42
    ↓ LLM 組裝回答（可選）
輸出：「龍洞共有 42 條路線。」
```

---

## RAG vs Text-to-SQL 差異

| | 現有 RAG | Text-to-SQL |
|---|---|---|
| 問題類型 | 「哪條路線適合初學者？」 | 「台北有幾條 5.12 路線？」 |
| 資料來源 | Vectorize 向量索引 | D1 直接 SQL 查詢 |
| 回答準確性 | 語義相關，但數字可能幻覺 | 精確數字 / 統計 |
| 適合場景 | 推薦、解釋、開放性問題 | 計算、篩選、排序 |

### 適合 Text-to-SQL 的問題

- 「龍洞有幾條路線？」
- 「哪個岩場路線最多？」
- 「列出所有 5.11 以上的多繩距」
- 「我完攀了幾條路線？」

### 適合 RAG 的問題

- 「龍洞適合初學者嗎？」
- 「推薦幾條入門路線」
- 「攀岩前要注意什麼？」

---

## 「找路線」的模糊性

「找路線」介於查詢與推薦之間：

```
「找 10 條 5.10 的路線」

意圖 A：統計 / 查詢
  → 「符合條件共 23 條，以下是清單...」
  → 只需要 SQL

意圖 B：個人化推薦
  → 「根據你的完攀紀錄，推薦這幾條...」
  → 需要 SQL + 用戶資料 + LLM 判斷
```

**結論**：「找」≠「推薦」，但邊界模糊，需要向用戶確認意圖。

---

## Hybrid 模式

推薦類問題永遠走 Hybrid：

```
「推薦我幾條適合初學者的龍洞路線」
    ↓
[Step 1 - SQL]  保證範圍精確
SELECT * FROM routes r
JOIN crags c ON r.crag_id = c.id
WHERE c.name = '龍洞' AND r.grade_numeric <= N
LIMIT 20

    ↓
[Step 2 - LLM]  負責品質判斷
「以下是龍洞的初級路線清單：{SQL結果}
 請從中推薦 3 條，並說明理由。」

    ↓
輸出：「推薦這三條，因為...」
```

**SQL 保證範圍正確，LLM 負責判斷哪個更好。**

---

## 整體架構設計

### 流程

```
用戶輸入
    ↓
[1. 意圖判斷]
    ├── 明確是查詢（有幾條、列出）→ 直接 SQL
    ├── 明確是推薦（推薦、適合我）→ 直接 Hybrid
    └── 模糊（找路線）→ 問用戶
              ↓
         「你是想要：
           A. 列出符合條件的路線清單
           B. 根據你的程度推薦適合的路線」
              ↓
[2. 資訊充足性判斷]
    ├── 資訊夠 → 執行
    └── 資訊不夠 → 問用戶補充缺少的參數
              ↓
[3. 執行]
    ├── SQL → D1 → 精確結果
    ├── RAG → Vectorize → 現有流程
    └── Hybrid → SQL 撈候選 + LLM 推薦
```

### 關鍵設計原則

1. **前置判斷**：在執行任何查詢前，先確認資訊是否充足
2. **意圖確認**：模糊問題先問清楚，不要猜測
3. **SQL 保底**：涉及數字、篩選、列表的部分一律用 SQL，不用向量搜尋猜測
4. **LLM 最後一哩**：SQL 取得精確資料後，由 LLM 組裝成自然語言回答

---

## Query Router 設計

### 規則式分類（快速路徑）

```typescript
// SQL 訊號
const sqlSignals = [
  /有幾條|幾條路線|幾個岩場/,
  /列出|顯示所有|哪些/,
  /最多|最少|排名|統計/,
  /我完攀了|我爬了|我的紀錄/,
  /難度.*以上|等級.*以下/,
];

// RAG 訊號
const ragSignals = [
  /推薦|建議|適合/,
  /怎麼|如何|為什麼/,
  /感覺|氛圍|風格/,
  /注意|危險|技巧/,
];
```

### 分層過濾

```
用戶問題
    ↓
[Layer 1] 規則式快篩（毫秒）
  明確 SQL 關鍵字 → SQL
  明確 RAG 關鍵字 → RAG
    ↓ 模糊
[Layer 2] 向量分數判斷（已有）
  score > 0.7 → RAG
  score < 0.5 → 考慮 SQL
    ↓ 還是不確定
[Layer 3] 輕量 LLM 分類（llama-3.1-8b）
  最終裁決
```

---

## 與現有系統的關係

### 已有可復用的基礎

| 現有元件 | 可復用方式 |
|----------|-----------|
| `extractLocationFilter()` | 抽出岩場名稱（龍洞）帶入 SQL WHERE |
| `extractGradeFilter()` | 抽出難度（5.11）帶入 SQL WHERE |
| `extractTypeFilter()` | 抽出路線類型帶入 SQL WHERE |
| `query-classifier` spec | 擴充新增 `sql`、`hybrid`、`clarification-needed` 類型 |
| D1 資料庫 | 直接查詢，取代向量猜測 |

### 目前的缺口

現有 filter 只用來**縮小向量搜尋範圍**，但這些參數直接拿去跑 SQL 才是最精確的做法。

---

## 安全性考量

- **只允許 SELECT**：禁止 UPDATE / DELETE / INSERT / DROP
- **白名單資料表**：只能查詢公開資料（routes、crags、gyms），不能查 users 敏感資料
- **Template-based**：不讓 LLM 自由生成 SQL，而是抽出參數填入預定義模板
- **參數化查詢**：所有用戶輸入透過 D1 binding 參數化，防止 SQL Injection

---

## 待規劃的實作範圍

1. **Query Router**：意圖分類 + 資訊充足性判斷
2. **Clarification Response**：回問用戶的機制（A. 查詢 B. 推薦）
3. **SQL Template Engine**：參數抽取 + 模板填充 + D1 執行
4. **Hybrid Pipeline**：SQL 候選 + LLM 推薦整合

> 下一步：建立 OpenSpec proposal（change-id: `add-text-to-sql`）
