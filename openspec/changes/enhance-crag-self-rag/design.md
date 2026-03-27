## Context

本專案 RAG Pipeline 已有 14 步驟的模組化架構，包含 Cross-Encoder Reranking、Self-Reflection（loopBack）、Judge 品質評估等機制。但存在兩個中優先度差距：

1. **CRAG 深度不足**：`cross-encoder.ts` 僅對候選文件重新排序（`bge-reranker-base`），不會丟棄低分文件。所有候選文件無論 reranker score 高低都會進入後續 context 建構和 LLM 生成階段。
2. **Tool Selection 缺乏信心度量**：`tool-selection.ts` 從 LLM 取得工具選擇後直接使用，無 confidence 信號，無法在低信心時啟用 fallback。`SELF_REFLECTION_PROMPT` 已是死碼。

**約束**：
- Cloudflare Workers 環境，記憶體和執行時間有限（30s 硬限）
- `bge-reranker-base` 的分數範圍非標準化 0-1，需以經驗值設定閾值
- Tool Selection 使用 gemma-3-12b-it，JSON 輸出穩定性需考量

## Goals / Non-Goals

**Goals:**
- Cross-Encoder Reranking 後過濾低相關性文件，減少 LLM context 中的雜訊
- Tool Selection 輸出信心分數，低信心查詢自動 fallback 到 general_knowledge
- 所有新閾值通過 `ai_config` 表可配置，無需部署即可調整
- 清理 `SELF_REFLECTION_PROMPT` 死碼

**Non-Goals:**
- 不實作 per-document LLM 評分（如原始 CRAG 論文的 Correct/Incorrect/Ambiguous），成本太高
- 不實作多工具組合選擇（E7）或工具選錯自動修正（E8），屬後續迭代
- 不實作逐句 Grounding 歸因（D4）或 Per-Segment 信心評分（D5），工作量大且優先度低
- 不改變現有 pipeline 步驟順序或新增步驟

## Decisions

### 決策 1：Reranker 閾值過濾位置——在 cross-encoder step 內部

**選擇**：在 `cross-encoder.ts` 的 reranking 完成後，直接過濾低分文件。

**替代方案**：
- A) 新增獨立 pipeline step `relevance-filter`
- B) 在 `mmr.ts` 步驟中加入過濾

**理由**：cross-encoder step 已持有 reranker score，在同一步驟內過濾最自然。新增獨立步驟增加複雜度但無額外價值。MMR 步驟的職責是多樣性，不應承擔相關性過濾。

### 決策 2：Reranker score 閾值設計——靜態可配置門檻 + 最低保留數

**選擇**：
- `reranker_relevance_threshold`（預設 `0.3`）：低於此分數的文件丟棄
- `reranker_min_keep`（預設 `2`）：即使全部低於閾值，至少保留前 N 筆

**理由**：`bge-reranker-base` 的分數在不同查詢間分佈不一致。固定閾值可能導致某些查詢過濾太多。`min_keep` 作為安全網，確保不會出現「全部過濾後 context 為空」的極端情況。閾值 0.3 是保守起點，可透過 `ai_config` 即時調整。

### 決策 3：Tool Selection 信心分數——在現有 JSON 輸出中新增 confidence 欄位

**選擇**：修改 `TOOL_SELECTION_PROMPT`，在輸出 JSON 中新增 `"confidence": 0.0-1.0` 欄位。

**替代方案**：
- A) 用 logprobs 計算信心（Workers AI 不支援）
- B) 兩次 LLM 呼叫取一致性（延遲翻倍）

**理由**：LLM self-reported confidence 雖不完美，但成本最低。搭配 fallback 策略，即使 confidence 估計不準，worst case 也只是多走一次 general_knowledge 路徑，不會造成嚴重損害。

### 決策 4：低信心 fallback 策略——三層降級

**選擇**：
- `confidence >= 0.8`：正常使用選中工具
- `tool_confidence_threshold <= confidence < 0.8`：使用選中工具，但啟用空結果 fallback（若檢索結果為空，自動切換到備選工具）
- `confidence < tool_confidence_threshold`（預設 0.7）：降級為 `general_knowledge`（避免低信心檢索浪費資源）

**理由**：三層策略比單一閾值提供更細緻的控制。中等信心的查詢仍值得嘗試檢索，但搭配空結果 fallback 作為安全網。硬閾值 `tool_confidence_threshold` 可透過 `ai_config` 調整，軟閾值 0.8 固定。降級到 `general_knowledge` 而非拒絕回答，確保用戶總能得到回應。

### 決策 5：SELF_REFLECTION_PROMPT 清理——完整移除所有引用

**選擇**：移除 `SELF_REFLECTION_PROMPT` 的所有相關程式碼，包含 `ai-prompts.ts` 常量定義、`query.ts` 的 `resolvePrompt` 註冊、`admin-ai.ts` 的管理後台條目。

**理由**：此 prompt 未被任何 pipeline step 執行（`self-reflection.ts` 使用 Judge + loopBack 機制），但仍被 import 和註冊。完整清理避免 dead import 和管理後台顯示不存在的功能。

## Risks / Trade-offs

**[風險] Reranker 閾值設定不當**
→ 過高：過濾太多文件，context 不足導致回答品質下降
→ 過低：等同無效，低相關文件仍進入 context
→ **緩解**：`min_keep=2` 安全網 + `ai_config` 即時可調 + trace 記錄過濾數量供後續分析

**[風險] LLM 自報 confidence 不可靠**
→ LLM 可能過度自信或低估信心，導致 fallback 策略失效
→ **緩解**：保守閾值 0.7 + 記錄 confidence 分佈到 trace + 後續用黃金測試集校準

**[風險] TOOL_SELECTION_PROMPT 修改影響現有分類準確率**
→ 新增 confidence 欄位可能干擾 LLM 對其他欄位的輸出
→ **緩解**：confidence 放在 JSON 最後一個欄位，降低對前面欄位的影響。部署後監控 tool 分類分佈是否異常

**[取捨] 過濾 vs 保留低分文件**
→ 過濾減少 context 雜訊但可能丟失邊緣相關文件
→ 選擇過濾：Self-Reflection 的 loopBack 機制可在生成品質差時重新檢索，作為二道安全網

**[取捨] Reranker 過濾後對 MMR 多樣性的影響**
→ 過濾後候選文件減少，MMR 的多樣性選擇空間縮小
→ `min_keep=2` 確保至少有 2 筆文件供 MMR 選擇。實務上 reranker 低分文件通常也非 MMR 所需的「多樣但相關」文件，過濾不會顯著影響多樣性品質

## Migration Plan

### DB Migration
新增 migration 檔案（如 `0057_reranker_confidence_config.sql`）：
- `INSERT INTO ai_config (key, value) VALUES ('reranker_relevance_threshold', '0.3')`
- `INSERT INTO ai_config (key, value) VALUES ('reranker_min_keep', '2')`
- `INSERT INTO ai_config (key, value) VALUES ('tool_confidence_threshold', '0.7')`

### Rollback
- 刪除上述 3 筆 `ai_config` 記錄
- 程式碼回退後，`cross-encoder.ts` 和 `tool-selection.ts` 讀取不到這些 config key 時使用硬編碼預設值，不會崩潰

### 部署順序
1. 先跑 migration（新增 config 記錄）
2. 再部署程式碼（讀取新 config）
3. 部署後監控 trace 中 `filtered_count` 和 `confidence` 分佈
