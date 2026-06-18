# NobodyClimb Logging Design

## Purpose

這份文件整理 `nobodyclimb` 目前實際存在的 log / trace / observability 機制，以及和 Claude Code 相比有哪些缺口。

重點是描述現況，不是假想架構。

參考來源：

- [query/index.ts](/Users/xiaoxu/Projects/nobodyclimb/backend/src/services/query/index.ts)
- [cache-log.ts](/Users/xiaoxu/Projects/nobodyclimb/backend/src/services/query/cache-log.ts)
- [langfuse.ts](/Users/xiaoxu/Projects/nobodyclimb/backend/src/utils/langfuse.ts)
- [ai.ts](/Users/xiaoxu/Projects/nobodyclimb/backend/src/routes/ai.ts)
- [admin-ai.ts](/Users/xiaoxu/Projects/nobodyclimb/backend/src/routes/admin-ai.ts)

## High-Level Model

`nobodyclimb` 目前沒有一個統一的 logger abstraction。

它主要依賴三種機制：

1. D1 query log：`ai_query_logs`
2. Request-scoped trace object：`pipeline_trace`
3. Langfuse observability

另外在錯誤處理上，仍大量使用 `console.error` / `console.warn` 作為兜底。

## 1. D1 Query Log

### 核心入口

AI 問答最主要的持久化 log 在 [cache-log.ts](/Users/xiaoxu/Projects/nobodyclimb/backend/src/services/query/cache-log.ts) 的 `logQuery()`。

它會把以下資料寫入 `ai_query_logs`：

- `query`
- `response`
- `sources`
- `latency_ms`
- `token_count`
- `groundedness_score`
- `auto_score`
- `embedding_ms`
- `retrieval_ms`
- `generation_ms`
- `query_type`
- `model_used`
- `retrieval_score`
- `self_reflection_triggered`
- `is_high_consumption`
- `cache_hit`
- `hyde_triggered`
- `pipeline_trace`

### 特徵

- 這是目前最重要的事後排查資料來源
- 比一般 console log 更有結構
- admin 頁面會直接讀這張表顯示細節

### 限制

- 它主要覆蓋 AI pipeline，不是全系統 logger
- 失敗時若 DB insert 本身失敗，最後還是只能靠 `console.error`

## 2. Pipeline Trace

### 角色

`pipeline_trace` 是 AI pipeline 的結構化追蹤 JSON。

它不是獨立日誌系統，而是和 `ai_query_logs` 綁在一起寫進 DB。

### 產生方式

在 `QueryService.ask()` 裡建立 `pipelineCtx`，每個 pipeline step 把執行資訊寫到 `ctx.trace`，最後序列化進 `pipeline_trace`。

React Agent 路徑也會寫自己的 trace，例如：

- `strategy: 'react'`
- `turn_count`
- `tool_call_count`
- `per_model_stats`
- `react_fallback`

### 用途

- Admin AI log detail 頁面
- Golden evaluation 腳本讀 log 做分析
- 問題定位時查看各 stage 行為

### 優點

- 結構化
- 可查詢
- 和 query 結果關聯清楚

### 缺點

- 沒有統一 schema enforcement
- 不同 strategy 的 trace shape 不完全一致
- 新增 strategy 後，像 `evaluate-rag.ts` 這類 consumer 很容易跟不上

這次 `react` strategy 導致 golden eval 誤判，就是例子。

## 3. Langfuse Observability

### 入口

Langfuse 包裝在 [langfuse.ts](/Users/xiaoxu/Projects/nobodyclimb/backend/src/utils/langfuse.ts)。

主要 API：

- `createLangfuseClient(env)`
- `createTrace(langfuse, opts)`
- `startSpan(parent, name, input?)`
- `endSpan(span, opts)`
- `logGeneration(parent, opts)`
- `flushLangfuse(langfuse)`

### 特徵

- request-scoped client，不做 global singleton
- 沒有 keys 時靜默降級
- 在 `waitUntil` 裡 flush，不阻塞 response

### 實際接法

`QueryService.ask()` 會先建立：

- `langfuseClient`
- `langfuseTrace`

之後：

- pipeline / react-agent / judge / llm call 可掛 span 或 generation
- 最後在 `finally` 透過 `waitUntil(flushLangfuse(...))`

### 角色

Langfuse 是外部 observability，不是主資料面。

也就是：

- DB log 是系統內部真實來源
- Langfuse 是補充的 tracing/LLM 觀測能力

## 4. Console Logging

目前仍大量存在：

- `console.error`
- `console.warn`

常見場景：

- DB 寫入失敗
- pipeline / react-agent fallback
- judge 失敗
- recommendation service 錯誤

這些 log 對 Cloudflare runtime 排查有用，但有幾個問題：

- 格式不統一
- 無 correlation id
- 無統一 severity / event name
- 不容易做跨模組關聯

## 5. Admin Log Access

`nobodyclimb` 比一般產品強的一點是：它把 AI log 產品化了。

在 [admin-ai.ts](/Users/xiaoxu/Projects/nobodyclimb/backend/src/routes/admin-ai.ts)：

- 可以查 `ai_query_logs`
- 可以看 `pipeline_trace`
- 可以看 stage latency / quality / sources

這讓 log 不只存在後端，而是能被管理員真正使用。

## Current Strengths

目前設計的優點：

1. AI query 有結構化持久化 log
2. `pipeline_trace` 可看中間階段，不只有最終錯誤
3. Langfuse 提供 LLM-level tracing
4. Admin UI 可以直接讀 log

## Current Gaps

和 Claude Code 相比，主要缺口有：

1. 缺少統一 logging facade
2. 缺少 queue-until-attached sink pattern
3. `console.*` 與 DB trace 混用，分層不夠清楚
4. trace schema 沒有穩定 contract，consumer 容易壞
5. 缺少全域 request correlation id 策略

## Recommended Direction

如果要往更穩定的 logging 設計走，建議分成三層：

### A. Operational Log

建立統一 API，例如：

- `logDebug(message, meta?)`
- `logWarn(event, meta?)`
- `logError(error, meta?)`

用途：

- Cloudflare runtime 排查
- 非 AI 模組錯誤記錄

### B. Structured Domain Log

保留 `ai_query_logs`，但讓 `pipeline_trace` schema 更明確。

建議：

- 每個 strategy 都有共同欄位
- `strategy`
- `selected_tool` 或 `primary_tool`
- `fallback`
- `observations`

這樣 `evaluate-rag.ts`、Admin UI、後續報表就不會各自猜格式。

### C. External Observability

保留 Langfuse 作為外部 tracing：

- trace
- span
- generation
- token usage

但不要讓 Langfuse 成為唯一真相來源。

## Suggested Minimal Refactor

最小可行重構可以是：

1. 新增 `backend/src/utils/logger.ts`
2. 提供 `logDebug / logWarn / logError`
3. 所有 `console.error` 改走統一 wrapper
4. 規範 `pipeline_trace` 最低共通欄位
5. 讓 `evaluate-rag.ts` 讀統一欄位，而不是讀特定 strategy 的舊欄位

## Bottom Line

`nobodyclimb` 現在的 logging 不是沒有設計，而是 AI 區塊已經有一套「DB log + pipeline_trace + Langfuse」混合式 observability。

它的主要問題不是資料太少，而是：

- 沒有統一 facade
- schema contract 不夠穩
- runtime console log 和結構化 log 還沒完全分層

如果未來要持續擴張 AI strategy，優先該補的是 trace contract 和統一 logger，而不是再加更多散落的 `console.error`。
