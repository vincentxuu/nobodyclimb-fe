## 1. 修復 popularityRerankNode

- [x] 1.1 修改 `popularityRerankNode` return 值，加入 `context` 和 `sources`（已確認程式碼已有，無需修改）
- [x] 1.2 在 GraphState 加入 `climbed_route_ids` 欄位，並在 `runAIGraph` 注入
- [x] 1.3 在 `popularityRerankNode` 加入已攀路線排除邏輯

## 2. 加入 postGraphProcessing

- [x] 2.1 在 `ai-graph/index.ts` 新增 `postGraphProcessing()` 函式
- [x] 2.2 實作 token breakdown 彙總和 phase latency 計算
- [x] 2.3 實作 logQuery 呼叫
- [x] 2.4 實作 KV 快取寫入
- [x] 2.5 實作 finalResponse 組裝（answer + sources + query_id + suggested_questions）
- [x] 2.6 實作 streaming 模式 async Judge（waitUntil）
- [x] 2.7 實作低 groundedness flagging
- [x] 2.8 實作 semantic cache 寫入（waitUntil）
- [x] 2.9 跳過 earlyReturn 路徑的後處理
- [x] 2.10 避免與 memoryExtractorNode 重複觸發 memory extraction

## 3. 驗證

- [x] 3.1 確認 baseline graph RAG 路徑回傳完整 finalResponse
- [x] 3.2 確認 agentic graph RAG 路徑回傳完整 finalResponse
- [x] 3.3 TypeScript typecheck 通過
