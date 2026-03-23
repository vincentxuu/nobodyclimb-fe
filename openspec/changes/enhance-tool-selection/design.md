## Context

RAG Pipeline 的 tool-selection 步驟負責將用戶查詢路由到 5 個工具之一（search_routes / search_crags / general_knowledge / sql_query / hybrid）。目前工具定義靜態硬寫在 `TOOL_SELECTION_PROMPT` 和程式碼中，LLM 只回傳工具名稱無信心評估，選錯工具後 Agentic ReAct Loop 的 RETRIEVE / BROADEN 動作只能改寫查詢或放寬過濾，無法切換到不同工具。

**現有架構**：
- `TOOL_SELECTION_PROMPT`：靜態列舉 5 個工具描述，新增工具需同時改 prompt + 程式碼
- `ParsedQuery`：回傳 `{ tool, query_type, params, template }`，無 confidence
- `AgenticActionType`：僅 `ANSWER | RETRIEVE | BROADEN`
- Pipeline Step Registry（`registry.ts`）已有良好的步驟註冊模式可參考

## Goals / Non-Goals

**Goals:**
- 建立 ToolRegistry 統一管理 RAG 工具 metadata，從 registry 動態生成 prompt
- Tool Selection 輸出附帶信心分數，低信心時自動啟用 fallback
- 選錯工具時可自動修正（pipeline-level fallback + agentic SWITCH_TOOL）
- 完整記錄 tool selection 決策歷程到 pipelineTrace

- Agentic DECOMPOSE 動作：將多實體/多面向查詢拆為子查詢並行搜尋
- Agentic VERIFY 動作：用不同角度搜尋交叉驗證已有結果
- 檢索方法動態選擇（E5）：Tool Selection 可指定 vector / bm25 / hybrid 檢索方法，省去不必要的 embedding 或 D1 查詢
- 多工具組合選擇（E7）：復用 Plan-and-Execute 基礎設施，一次查詢組合多個工具

**Non-Goals:**
- 取代現有 `hybrid` 工具類型——hybrid 繼續作為固定 SQL+RAG 組合
- Plugin 式外掛載入——工具仍需程式碼註冊，非動態載入

## Decisions

### Decision 1：ToolRegistry 設計模式

**選擇**：參考現有 `StepRegistry`（array export + metadata），建立輕量 `ToolRegistry` class。

**替代方案**：
- (A) 沿用現有靜態寫法，只改 prompt → 無法動態生成，未來工具擴充仍需改多處
- (B) 完整 Plugin 架構（動態載入、生命週期鉤子）→ 過度工程，5-6 個工具不需要

**設計**：
```typescript
// backend/src/services/tool-registry.ts
interface RAGToolDefinition {
  name: string;                          // 'search_routes' | 'search_crags' | ...
  displayName: string;                   // 用於管理介面
  description: string;                   // 注入 TOOL_SELECTION_PROMPT 的描述
  triggerSignals: string[];              // 觸發信號詞（供 prompt 使用）
  parameters: ToolParameter[];           // 支援的參數定義
  queryType: PipelineQueryType;          // 對應的 pipeline queryType
  llmModel: 'main' | 'lightweight';     // 使用哪個模型
}

interface ToolParameter {
  name: string;
  description: string;
  required: boolean;
  enum?: string[];                       // 可選值
}

class ToolRegistry {
  private tools: Map<string, RAGToolDefinition>;

  register(tool: RAGToolDefinition): void;
  get(name: string): RAGToolDefinition | undefined;
  getAll(): RAGToolDefinition[];
  generatePromptBlock(): string;         // 動態生成 prompt 工具描述
  getValidToolNames(): string[];         // 用於 LLM 輸出驗證
}
```

**Prompt 動態生成**：`generatePromptBlock()` 從所有已註冊工具產生格式化描述文字，插入 `TOOL_SELECTION_PROMPT` 的 `{tools}` 佔位符。

### Decision 2：Confidence 信心分數整合

**選擇**：在現有 `ParsedQuery` 新增 `confidence` 欄位，由同一次 LLM 呼叫輸出。

**替代方案**：
- (A) 額外 LLM 呼叫做信心評估 → 多一次 LLM 延遲，不值得
- (B) 用 LLM logprobs 估算信心 → Cloudflare Workers AI 不提供 logprobs

**設計**：
```typescript
interface ParsedQuery {
  tool: string;
  query_type: string;
  params: Record<string, unknown>;
  template?: string;
  clarification_type?: string;
  confidence: number;                    // 新增：0.0-1.0
  alternative?: string;                  // 新增：第二選擇工具名
}
```

**信心分數策略**：
| confidence 區間 | 行為 |
|:---|:---|
| >= 0.8 | 直接使用選中工具 |
| 0.5-0.8 | 使用選中工具，啟用 pipeline-level fallback |
| < 0.5 | 走 general_knowledge 或觸發 clarification |

`alternative` 僅在 confidence < 0.8 時由 LLM 輸出，作為 fallback 目標工具。

### Decision 3：兩層 Fallback 機制

**選擇**：Pipeline-level 輕量 fallback + Agentic SWITCH_TOOL 深度修正。

**Layer 1 — Pipeline-level Fallback**（在 tool-selection 步驟後、retrieval 前）：
- 觸發條件：`confidence < 0.8` 且檢索結果為 0 筆
- 行為：自動切換到 `alternative` 工具重新執行
- 成本：無額外 LLM 呼叫（僅重走檢索路徑）
- 限制：最多 1 次 fallback

**Layer 2 — Agentic SWITCH_TOOL**（在 ReAct Loop 中）：
- 觸發條件：Agent 觀察已有結果品質不佳後主動決策
- 行為：切換工具 + 重新檢索
- 成本：1 次額外 LLM 決策呼叫
- 限制：最多 1 次 SWITCH_TOOL（避免工具間無限跳轉）

**替代方案**：
- 只做 Layer 1 → 無法處理「有結果但不精確」的情況
- 只做 Layer 2 → 只在 agentic 模式生效，baseline 模式無法受益

### Decision 4：SWITCH_TOOL Agentic 動作

**選擇**：擴充 `AgenticActionType` 新增 `SWITCH_TOOL`。

```typescript
type AgenticActionType = 'ANSWER' | 'RETRIEVE' | 'BROADEN' | 'SWITCH_TOOL';

interface AgenticAction {
  type: AgenticActionType;
  refinedQuery?: string;       // RETRIEVE
  targetTool?: string;         // SWITCH_TOOL：切換目標工具
  reason?: string;             // SWITCH_TOOL：切換原因（記錄用）
}
```

**AGENTIC_DECISION_PROMPT 更新**：
```
- {"type": "SWITCH_TOOL", "targetTool": "sql_query", "reason": "..."}
  → 目前工具的搜尋結果不精確，切換到更適合的工具
```

**選擇規則補充**：
- SWITCH_TOOL 僅在已嘗試 RETRIEVE 或 BROADEN 後仍不滿意時使用
- 不可切換到 general_knowledge（那等於放棄檢索）
- 每次 agentic loop 最多 1 次 SWITCH_TOOL

### Decision 5：Trace 擴充結構

**選擇**：在現有 `pipeline_trace` JSON 結構中擴充 `tool_selection` 區塊。

```typescript
// pipeline_trace.tool_selection — 初始工具選擇與 fallback
{
  selected_tool: string;
  confidence: number;
  alternative?: string;
  fallback?: {
    triggered: boolean;
    from_tool: string;
    to_tool: string;
    reason: 'empty_results';
  };
}

// pipeline_trace.agentic.steps[n] — 每步動作（含 SWITCH_TOOL）
{
  step: number;
  action_type: 'ANSWER' | 'RETRIEVE' | 'BROADEN' | 'SWITCH_TOOL';
  refinedQuery?: string;        // RETRIEVE
  target_tool?: string;         // SWITCH_TOOL
  reason?: string;              // SWITCH_TOOL
  docs_retrieved: number;
}
```

**職責劃分**：`tool_selection` 負責初始選擇與 pipeline-level fallback，`agentic.steps` 負責 ReAct loop 中的所有動作（含 SWITCH_TOOL），避免重複記錄。

### Decision 6：E4 補完 — DECOMPOSE + VERIFY Agentic 動作

**選擇**：在 ReAct loop 的 `AgenticActionType` 新增 `DECOMPOSE` 和 `VERIFY` 兩種動作。

**DECOMPOSE**：
- 適用場景：問題涉及多個實體或多面向比較（如「比較龍洞和北投的初級路線」）
- LLM 輸出 `subQueries` 陣列（最多 3 個子查詢）
- 執行：`Promise.all` 並行對每個子查詢呼叫 `runAgenticSearch()`，結果合併到 `allPaths`
- 限制：`decomposeUsed` 旗標確保最多 1 次

**VERIFY**：
- 適用場景：已有結果但不確定是否完整或正確
- LLM 輸出 `verifyQuery`（不同角度的驗證查詢）
- 執行：用空 filter `{}` 做獨立搜尋（更廣泛），結果合併到候選集
- 限制：`verifyUsed` 旗標確保最多 1 次

**替代方案**：
- 外部化為獨立 pipeline step → 過度複雜，DECOMPOSE/VERIFY 本質是 agentic loop 的決策動作
- 只做 DECOMPOSE 不做 VERIFY → VERIFY 是低成本的品質保證手段，值得加入

### Decision 7：E5 — RetrievalMethod 動態選擇

**選擇**：新增 `RetrievalMethod = 'vector' | 'bm25' | 'hybrid'` 型別，由 Tool Selection LLM 決定。

**設計**：
- `ParsedQuery.retrieval_method`：LLM 在工具選擇時同時決定檢索方法
- `PipelineContext.retrievalMethod`：預設 `'hybrid'`，由 tool-selection step 設定
- `AgenticAction.retrievalMethod`：agentic RETRIEVE 動作可選填，每步可用不同方法

**判斷規則**：
| 方法 | 適用場景 | 省去 |
|:---|:---|:---|
| `bm25` | 精確關鍵字查詢（路線名稱、岩場名稱精確匹配） | embedding 延遲 |
| `vector` | 語意模糊查詢（「適合初學者」「風景好的岩場」） | D1 FTS 查詢 |
| `hybrid` | 預設，一般查詢 | 無 |

**影響範圍**：
- `embedding.ts`：`bm25` 模式跳過 embedding
- `hybrid-search.ts`：baseline 路徑根據 method 選擇性跳過 Vector 或 BM25
- `runAgenticSearch()`：新增 `method` 參數控制檢索路徑

### Decision 8：E7 — MultiTool 復用 ExecutionPlan

**選擇**：新增 `multi_tool` 工具，復用現有 `executePlan()` + `synthesize()` 基礎設施。

**與 `hybrid` 的區別**：
- `hybrid` = SQL 候選集 + LLM 推薦（固定 2 步組合）
- `multi_tool` = 任意工具的自由組合（最多 3 步，支援 parallel/sequential）

**設計**：
```typescript
interface MultiToolStep {
  tool: string;        // 不可為 multi_tool 或 general_knowledge
  purpose: string;     // 該步目的說明
  query: string;       // 該步搜尋語句
  params?: Record<string, unknown>;
}
interface MultiToolPlan {
  steps: MultiToolStep[];
  execution_mode: 'parallel' | 'sequential';
}
```

**執行流程**：
1. tool-selection 解析 `multi_tool` 並驗證 steps
2. 所有中間步驟（hyde、multi-query、filter-build、embedding 等）透過 skipWhen 跳過
3. `hybrid-search` 步驟偵測 `queryType === 'multi-tool'`，將 `MultiToolPlan` 轉為 `ExecutionPlan` 格式
4. 復用 `executePlan()` 處理並行/循序，復用 `synthesize()` 合併結果
5. 失敗時 fallback 走 BM25-only 降級

**替代方案**：
- 每個子步驟走完整 pipeline → 延遲太高，中間步驟大部分無意義
- 獨立實作多工具邏輯 → 重複 executePlan/synthesize 的程式碼

## Risks / Trade-offs

| 風險 | 影響 | 緩解措施 |
|:---|:---|:---|
| TOOL_SELECTION_PROMPT 改動導致工具選擇準確率下降 | 回答品質降低 | 改動前後人工測試 20+ 筆查詢對比；信心分數閾值設為 DB 可調 |
| Confidence 分數不穩定（LLM 輸出品質不一致） | Fallback 過度或不足觸發 | 設保守預設值（0.8），上線後根據 trace 數據調整 |
| SWITCH_TOOL + RETRIEVE + BROADEN 組合爆炸 | Agentic loop 延遲增加 | 維持 agentic_max_steps 限制 + 最多 1 次 SWITCH_TOOL |
| ToolRegistry 增加間接層 | 程式碼理解成本增加 | 保持輕量（純 metadata 註冊，不改變執行流程） |

## Migration Plan

1. **Phase 1**：建立 ToolRegistry，遷移現有 5 個工具定義，確保 `generatePromptBlock()` 輸出與現有 `TOOL_SELECTION_PROMPT` 等效
2. **Phase 2**：ParsedQuery 新增 confidence + alternative，更新 TOOL_SELECTION_PROMPT
3. **Phase 3**：實作 Pipeline-level fallback 邏輯
4. **Phase 4**：擴充 AGENTIC_DECISION_PROMPT 加入 SWITCH_TOOL
5. **Phase 5**：pipelineTrace 擴充 + 驗證

每個 phase 可獨立部署，無 breaking change。Rollback 策略：confidence 解析失敗時 fallback 到 1.0（等同現有行為），SWITCH_TOOL 解析失敗時忽略（等同現有 RETRIEVE）。

## Open Questions

1. **confidence 閾值**是否應按 queryType 差異化？（simple 查詢閾值可較低，complex 較高）——建議上線後用 trace 數據再決定
2. **Fallback 目標工具**的對應關係是否需要靜態配置？（search_routes ↔ sql_query、sql_query ↔ search_routes）——先用 LLM 輸出的 alternative，不夠再考慮硬規則
