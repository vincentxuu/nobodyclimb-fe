## Context

LangGraph 引擎是舊 PipelineEngine 的替代實作，透過 `pipelineConfig.use_langgraph_engine` feature flag 切換。兩者共用相同的 `PipelineContext` 型別和 `QueryService`。

舊引擎在 `PipelineEngine.run()` 結束時呼叫 `postPipelineProcessing()`，負責 logQuery、KV 快取、finalResponse 組裝。LangGraph 引擎完全缺少此邏輯。此外 `popularityRerankNode` 組裝了 context/sources 但沒有 return，導致下游 LLM 拿不到資料。

## Goals / Non-Goals

**Goals:**
- LangGraph 引擎的 RAG 路徑回應格式與舊引擎完全一致（含路線連結、建議問題、sources、query_id）
- 恢復 logQuery、KV 快取、token 追蹤、groundedness flagging
- Streaming 模式正確處理 async Judge 和 suggested_questions
- 已攀路線排除功能在 LangGraph 中可用

**Non-Goals:**
- 不改動舊引擎的邏輯（保持 feature flag 切換能力）
- 不新增功能，只修復與舊引擎的行為差異
- 不調整 graph 拓撲結構（node 順序和 routing 不變）

## Decisions

### D1: 在 `runAIGraph()` 中加入 `postGraphProcessing()` 函式

在 graph invoke 之後、return 之前，加入一個 `postGraphProcessing(finalState)` 函式。此函式提取自舊引擎 `postPipelineProcessing` 的邏輯，包含：
- Token breakdown 彙總
- logQuery
- KV 快取寫入
- finalResponse 組裝
- Streaming async Judge
- Memory extraction（若 memoryExtractorNode 未處理）
- Low groundedness flagging
- Semantic cache 寫入

**理由**：集中在一處處理，避免每個 node 各自負責部分後處理。與舊引擎結構對齊，便於比對。

### D2: 修復 `popularityRerankNode` return context/sources

直接修改 return 值，加入已組裝好的 `context` 和 `sources`。程式碼中已有完整的組裝邏輯，只是漏掉 return。

### D3: 在 GraphState 加入 `climbed_route_ids` 欄位

新增 `Annotation<Set<string> | undefined>()` 欄位，由 `runAIGraph()` 從 PipelineContext 注入。`popularityRerankNode` 使用此欄位過濾已攀路線。

### D4: Streaming 模式的 `---SUGGESTIONS---` 處理

兩個層面：
1. `llmGenerationNode` 在 streaming 模式下，`onToken` 收到的 raw token 已推送到客戶端，無法攔截 `---SUGGESTIONS---`
2. 改為在 `postGraphProcessing` 中確保 `done` 事件包含正確的 `answer`（已去除 suggestions）和 `suggested_questions` 陣列

前端已有邏輯在收到 `done` 事件時用 `answer` 取代 streamed text，所以只要 `done` 事件正確即可。

## Risks / Trade-offs

- **重複邏輯**：`postGraphProcessing` 與舊引擎的 `postPipelineProcessing` 有大量重複。未來應抽取為共用函式。→ 暫時接受，待舊引擎移除後再清理。
- **memoryExtractorNode 重複觸發**：graph 中已有 memoryExtractorNode，postGraphProcessing 也可能觸發。→ 在 postGraphProcessing 中檢查是否已由 node 處理，避免重複。
- **earlyReturn 路徑**：GK 和 text-to-sql 已設定 earlyReturn 並自行處理 logQuery 和 cache。postGraphProcessing 只在非 earlyReturn 時執行。
