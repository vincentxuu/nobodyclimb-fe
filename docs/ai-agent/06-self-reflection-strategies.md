# Self-Reflection 策略：現況、業界對比與演進路徑

> 建立日期：2026-03-05
> 相關程式碼：`backend/src/services/query.ts`（L620–L666）、`backend/src/utils/ai-prompts.ts`（L128–L134）

---

## 一、現有策略（Baseline）

### 實作位置

`backend/src/services/query.ts:631–666`

### 流程

```
[生成回答]
     │
     ▼
[SELF_REFLECTION_PROMPT] ─── 用同一個 Gemma 問：
                              "這個回答完整嗎？只回 YES 或 NO"
     │
     ├─ YES → 直接使用原始回答
     │
     └─ NO  → 用相同 messages 重生成一次
                │
                ├─ 新答案有「找不到資訊」→ 保留原始（退化保護）
                └─ 否則 → 直接替換
```

### 觸發條件
- `queryType === 'complex'`（tool routing 判定為複雜查詢）
- 原始回答 ≥ 50 字元
- 原始回答不包含「超出知識範圍」、「找不到相關資訊」

### Prompt 原文

```
你剛剛回答了以下攀岩問題，請評估你的回答是否完整且直接地回應了問題。
只回覆 YES 或 NO，不含任何說明。

問題：{query}
回答：{answer}
```

---

## 二、這個策略在業界常見嗎？

### YES/NO 自我評估：常見 ✅

YES/NO 二元評估是 Self-RAG（Asai et al., 2024, ICLR）論文普及後的業界標準做法。LangGraph 官方 Self-RAG 範例的 Generation Grader 就是輸出 `bool_score: "yes" / "no"`，結構與現有實作一致。

```
業界通用 Pipeline：
  Document Grader（文件相關性 YES/NO）
       ↓
  Generator（生成回答）
       ↓
  Generation Grader（回答品質 YES/NO）  ← 對應現有 SELF_REFLECTION_PROMPT
```

### 現有實作與業界常見做法的差異

| 面向 | 現有實作（Baseline） | 業界常見做法 |
|------|---------------------|-------------|
| Judge 模型 | 生成用的同一個 Gemma | 獨立 judge 模型，或更大的 critic model |
| 替換決策 | 新答案沒退化就直接替換 | 比較 A/B 兩答案的評分，取分數較高者 |
| 重試次數 | 最多 1 次 | 通常 1–2 次，Self-RAG 原論文用 Best-of-N |
| 評估維度 | 「是否完整回答問題」 | 包含 faithfulness、relevance、groundedness 等多維度 |

### 同模型自評的已知問題

學術研究（2025）顯示，讓生成模型評估自己的回答有約 **64.5% 的盲點率**——模型傾向為自己生成的內容打高分，特別是在以下情境：
- 回答流暢但包含幻覺
- 自信語氣的錯誤陳述
- 合理聽起來但超出 context 的推斷

### 直接替換的問題

若重生成後品質實際上低於原始版本（但未觸發「找不到資訊」退化保護），現有邏輯仍會替換。業界做法是用評分比較：

```
原始回答 groundedness: 0.7  ←  應保留這個
重生成回答 groundedness: 0.4  ←  現有邏輯可能誤取這個
```

---

## 三、現有 Judge 機制如何補足

現有程式碼已實作了 **`JUDGE_PROMPT`**（`ai-prompts.ts:102`），在 self-reflection 之後異步執行：

```typescript
// query.ts:677
const { groundedness, quality } = await this.runJudge(query, context, answer);
```

Judge 輸出：
- `groundedness`（0.0–1.0）：回答有多少比例基於 context 文件
- `quality`（1–4）：整體品質分數

這些分數目前的用途：
1. 注入免責聲明（`groundedness < 0.6` → ❓、`< 0.8` → ⚠️）
2. 寫入 `ai_query_logs.groundedness_score` 與 `auto_score`

**但 Judge 的分數目前沒有用在 self-reflection 的替換決策上**——這是可以改善的點。

---

## 四、演進路徑

### 現況（已實作）

```
SELF_REFLECTION_PROMPT（同模型 YES/NO）
    → 直接替換（+退化保護）
    → JUDGE_PROMPT 評分（事後，不影響替換決策）
```

### 短期改善（對應 tasks.md Phase 6.2）

將 Judge 分數整合進替換決策：

```
SELF_REFLECTION_PROMPT（觸發偵測用）
    → 重生成
    → JUDGE 比較原始 vs. 重生成的 groundedness
    → 取分數較高者（而非直接替換）
```

### 中期改善

引入獨立 judge 模型（避免同模型自評盲點）：

```
主模型：Gemma（生成回答）
Judge 模型：Llama-3.1-8b（評估品質）← 目前 JUDGE_PROMPT 已使用此設計
```

現有 `runJudge()` 已用 `llama-3.1-8b`（tasks.md 3.1.1 的設計），只需把這個分數接回替換邏輯即可完成升級。

---

## 五、總結

| 評估 | 結論 |
|------|------|
| YES/NO 模式是否業界常見？ | ✅ 是，Self-RAG 以來的標準 |
| 現有實作是否有問題？ | ⚠️ 同模型自評 + 無分數比較，屬於簡化版 |
| 是否需要大改？ | 否，主要缺口是把已有的 Judge 分數接回決策邏輯 |
| 改善成本？ | 低，Judge 基礎設施已存在，改 `query.ts` 約 10 行 |

現有架構的最大優勢是 **Judge 已是獨立模型（Llama）評估 Gemma 的輸出**，符合業界「外部 critic」模式。主要缺口是 Judge 的分數還沒回饋到替換決策，導致 self-reflection 的替換邏輯仍是簡化版。

---

## 參考資料

| 來源 | 說明 |
|------|------|
| [Self-RAG (Asai et al., 2024)](https://selfrag.github.io/) | Self-reflection tokens 的原始論文 |
| [Building a Self RAG System with LangGraph](https://rajatnigam89.medium.com/building-a-self-rag-system-with-langgraph-now-with-hallucination-detection-7e66d6d21a97) | YES/NO bool_score 實作範例 |
| [Benchmarking Hallucination Detection Methods in RAG](https://cleanlab.ai/blog/rag-tlm-hallucination-benchmarking/) | 各種幻覺偵測方法比較 |
