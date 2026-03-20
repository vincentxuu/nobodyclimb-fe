# RAG 系統改善任務清單

> 建立日期：2026-03-08
> 最後更新：2026-03-09
> 依據：`10-agentic-rag-industry-practices.md` 業界實務對照分析
> 排除項目：Graph RAG（攀岩資料關係較簡單，暫不需要）

---

## 任務總覽

### A. 語意快取（已有程式碼，需啟用與補強）

| # | 任務 | 優先度 | 工作量 | 狀態 |
|---|------|--------|--------|------|
| A1 | [啟用語意快取](#a1-啟用語意快取) | 高 | 小 | ⬜ 待開始 |
| A2 | [自適應相似度門檻](#a2-自適應相似度門檻) | 中 | 小 | ⬜ 待開始 |
| A3 | [快取失效策略](#a3-快取失效策略) | 高 | 中 | ⬜ 待開始 |
| A4 | [快取命中分析與可觀測性](#a4-快取命中分析與可觀測性) | 中 | 小 | ⬜ 待開始 |
| A5 | [查詢正規化](#a5-查詢正規化) | 低 | 中 | ⬜ 待開始 |
| A6 | [快取預熱](#a6-快取預熱) | 低 | 中 | ⬜ 待開始 |
| A7 | [快取品質回饋迴圈](#a7-快取品質回饋迴圈) | 低 | 中 | ⬜ 待開始 |

### B. 黃金測試集與自動化評估

| # | 任務 | 優先度 | 工作量 | 狀態 |
|---|------|--------|--------|------|
| B1 | [建立黃金測試資料集](#b1-建立黃金測試資料集) | 高 | 中 | ✅ 已完成 |
| B2 | [實作評估腳本](#b2-實作評估腳本) | 高 | 中 | ✅ 已完成 |
| B3 | [設定品質門檻與基線](#b3-設定品質門檻與基線) | 高 | 小 | ✅ 已完成 |
| B4 | [CI/CD 自動化評估整合](#b4-cicd-自動化評估整合) | 中 | 中 | ✅ 已完成 |
| B5 | [紅隊測試集](#b5-紅隊測試集) | 中 | 中 | ✅ 已完成 |

### C. Pipeline 超時與熔斷機制

| # | 任務 | 優先度 | 工作量 | 狀態 |
|---|------|--------|--------|------|
| C1 | [整體 Pipeline Timeout](#c1-整體-pipeline-timeout) | 中 | 小 | ✅ 已完成 |
| C2 | [Per-Phase Timeout](#c2-per-phase-timeout) | 中 | 中 | ✅ 已完成 |
| C3 | [Graceful Degradation（超時降級）](#c3-graceful-degradation超時降級) | 中 | 中 | ✅ 已完成 |
| C4 | [Circuit Breaker（熔斷器）](#c4-circuit-breaker熔斷器) | 中 | 中 | ✅ 已完成 |
| C5 | [AbortController 整合](#c5-abortcontroller-整合) | 低 | 中 | ✅ 已完成 |
| C6 | [IP 層級速率限制](#c6-ip-層級速率限制) | 低 | 小 | ✅ 已完成 |

### D. Self-RAG 強化

| # | 任務 | 優先度 | 工作量 | 狀態 |
|---|------|--------|--------|------|
| D1 | [低品質觸發重新檢索](#d1-低品質觸發重新檢索) | 中 | 小 | ✅ 已完成 |
| D2 | [檢索必要性預判](#d2-檢索必要性預判) | 中 | 中 | ✅ 已完成（與 E6 合併實作） |
| D3 | [清理 SELF_REFLECTION_PROMPT 死碼](#d3-清理-self_reflection_prompt-死碼) | 低 | 小 | ✅ 已完成 |
| D4 | [逐句 Grounding 歸因](#d4-逐句-grounding-歸因) | 低 | 大 | ⬜ 待開始 |
| D5 | [Per-Segment 信心評分](#d5-per-segment-信心評分) | 低 | 大 | ⬜ 待開始 |

### E. 動態工具選擇

| # | 任務 | 優先度 | 工作量 | 狀態 |
|---|------|--------|--------|------|
| E1 | [工具註冊機制](#e1-工具註冊機制) | 低 | 中 | ✅ 已完成 |
| E2 | [新增檢索工具](#e2-新增檢索工具) | 低 | 中 | ⚠️ 大部分完成 |
| E3 | [動態 Prompt 生成](#e3-動態-prompt-生成) | 低 | 小 | ✅ 已完成 |
| E4 | [Agentic 動作擴充](#e4-agentic-動作擴充) | 低 | 中 | ✅ 已完成（SWITCH_TOOL + DECOMPOSE + VERIFY） |
| E5 | [檢索方法動態選擇](#e5-檢索方法動態選擇) | 低 | 中 | ✅ 已完成 |
| E6 | [Tool Selection 信心分數](#e6-tool-selection-信心分數) | 中 | 中 | ✅ 已完成 |
| E7 | [多工具組合選擇](#e7-多工具組合選擇) | 低 | 中 | ✅ 已完成 |
| E8 | [工具選錯自動修正](#e8-工具選錯自動修正) | 中 | 中 | ✅ 已完成（信心 fallback + SWITCH_TOOL） |

### F. Plan-and-Execute 模式

| # | 任務 | 優先度 | 工作量 | 狀態 |
|---|------|--------|--------|------|
| F1 | [Planning 階段實作](#f1-planning-階段實作) | 低 | 大 | ✅ 已完成 |
| F2 | [Execution 階段實作](#f2-execution-階段實作) | 低 | 大 | ✅ 已完成 |
| F3 | [Synthesis 合併與 A/B 測試](#f3-synthesis-合併與-ab-測試) | 低 | 中 | ✅ 已完成 |

---

## A. 語意快取

### A1. 啟用語意快取

**優先度**：高 | **工作量**：小

**現狀**：`checkSemanticCache()` 和 `storeSemanticCache()` 程式碼已完成，使用 Vectorize 做向量相似度比對。`semantic_cache_enabled = '0'` 未啟用。

**待辦**：
- [ ] 將 `ai_config` 中 `semantic_cache_enabled` 設為 `'1'`
- [ ] 驗證匿名查詢的語意快取命中流程正常
- [ ] 確認 `pipelineTrace` 正確記錄 `cache.type = 'semantic'`
- [ ] 監控啟用後的命中率與延遲變化

**相關檔案**：`backend/src/services/query.ts`（`checkSemanticCache`、`storeSemanticCache`）、`backend/migrations/0056_semantic_cache_config.sql`

---

### A2. 自適應相似度門檻

**優先度**：中 | **工作量**：小

**現狀**：固定門檻 `semantic_cache_threshold = '0.95'`，所有查詢類型使用同一值，門檻偏高可能導致命中率過低。

**待辦**：
- [ ] 新增按查詢類型的差異化門檻：
  - simple 查詢：`0.88-0.92`（措辭變化大但意圖明確）
  - complex 查詢：`0.93-0.95`（需精確匹配避免錯誤快取）
- [ ] 新增 `ai_config` 欄位 `semantic_cache_threshold_simple` 和 `semantic_cache_threshold_complex`
- [ ] 收集實際相似度分數分佈，用數據調整門檻

**相關檔案**：`backend/src/services/query.ts`（`checkSemanticCache`）

---

### A3. 快取失效策略

**優先度**：高 | **工作量**：中

**現狀**：KV 快取有 TTL（`cache_ttl` 預設 3600s），但 Vectorize 上的語意快取向量**永不過期**。沒有機制在內容更新或模型更新時清除快取。

**待辦**：
- [ ] 快取向量加上時間戳 metadata（`cached_at`），定期清理過期條目
- [ ] 內容重新索引時（`indexing.ts`），清除相關的 `type: 'query_cache'` 向量
- [ ] Embedding 模型更新時，批次刪除所有 `sc:` 前綴的快取向量
- [ ] 新增管理端點 `DELETE /api/v1/admin/ai/semantic-cache` 手動清除
- [ ] 考慮快取向量數量上限（避免 Vectorize 索引膨脹）

**相關檔案**：`backend/src/services/query.ts`（`storeSemanticCache`）、`backend/src/services/indexing.ts`

---

### A4. 快取命中分析與可觀測性

**優先度**：中 | **工作量**：小

**現狀**：`pipelineTrace` 只記錄 `{ cache: { type: 'kv' | 'semantic' } }`，沒有記錄相似度分數。API 回應不包含快取信心值。`ai_query_logs` 有 `cache_hit` 欄位但無細節。

**待辦**：
- [ ] `pipelineTrace` 擴充記錄：
  - `cache.similarity_score`：語意快取命中的相似度分數
  - `cache.candidates_checked`：檢查了多少候選（目前 topK=1）
- [ ] API 回應加入 `cache_score` 欄位（可選）
- [ ] Admin 儀表板新增快取統計：
  - KV vs 語意命中比例
  - 語意命中的平均相似度分數
  - 快取節省的 token 數估算
- [ ] 考慮 `topK` 從 1 提高到 3，多候選排序

**相關檔案**：`backend/src/services/query.ts`（`checkSemanticCache`）、`backend/src/routes/admin-ai.ts`

---

### A5. 查詢正規化

**優先度**：低 | **工作量**：中

**現狀**：查詢直接 embed 後比對，沒有預處理。「龍洞 5.10 路線」和「龍洞有哪些五一零的路線」是不同的向量。

**待辦**：
- [ ] 查詢正規化預處理：
  - 繁簡中文統一（「台灣」↔「台湾」）
  - 數字格式統一（「五一零」→「5.10」）
  - 移除語助詞和冗餘字（「請問」、「有哪些」）
- [ ] 正規化後再 embed，提高語意快取命中率
- [ ] 正規化函式獨立為 `normalizeQuery()`

**相關檔案**：`backend/src/services/query.ts`

---

### A6. 快取預熱

**優先度**：低 | **工作量**：中

**現狀**：快取完全被動建立（有人問才存），新部署後快取為空。

**待辦**：
- [ ] 從 `ai_query_logs` 提取高頻查詢（top N）
- [ ] 新增腳本 `backend/scripts/warm-cache.ts`：
  - 批次 embed 高頻查詢
  - 預先生成回應並存入 KV + Vectorize
- [ ] 可在部署後自動執行，或作為 cron job

**相關檔案**：新建 `backend/scripts/warm-cache.ts`

---

### A7. 快取品質回饋迴圈

**優先度**：低 | **工作量**：中

**現狀**：用戶對快取命中的回應給 feedback 後，無法區分「好的快取」和「壞的快取」。無法從 feedback 學習優化快取。

**待辦**：
- [ ] 追蹤快取命中回應的 feedback_score 分佈
- [ ] 低評分的快取命中 → 標記該快取條目為「待驗證」
- [ ] 累積 N 次低評分 → 自動刪除該快取條目
- [ ] 新增分析報告：快取 vs 非快取回應的平均 feedback 差異

**相關檔案**：`backend/src/routes/ai.ts`（feedback 端點）、`backend/src/services/query.ts`

---

## B. 黃金測試集與自動化評估

### B1. 建立黃金測試資料集

**優先度**：高 | **工作量**：中 | **狀態**：✅ 已完成

**已完成**：
- [x] 建立 `backend/tests/golden-test-set.json`（~45 筆測試案例）
- [x] 涵蓋 4 個類別：`simple`、`complex`、`general-knowledge`、`edge-case`
- [x] 每筆資料結構包含：`id`、`query`、`category`、`expected_tool`、`expected_filters`、`expected_answer_keywords`、`ci` 旗標
- [x] CI 子集標記（`ci: true`）用於快速驗證

**資料格式範例**：
```json
{
  "id": "GT-001",
  "query": "龍洞有哪些 5.10 的路線？",
  "category": "simple",
  "expected_tool": "search_routes",
  "expected_answer_keywords": ["龍洞", "5.10"],
  "expected_filters": { "location": "龍洞", "grade_gte": "5.10a" },
  "ci": true
}
```

**後續可擴充**：目標 200+ 筆，目前 ~45 筆為初始種子集

**相關檔案**：`backend/tests/golden-test-set.json`

---

### B2. 實作評估腳本

**優先度**：高 | **工作量**：中 | **狀態**：✅ 已完成

**已完成**：
- [x] 建立 `backend/scripts/evaluate-rag.ts`（772 行）
- [x] 支援多種執行模式：
  - `--ci`：僅執行 CI 標記的測試案例
  - `--category simple`：僅執行特定類別
  - `--red-team`：執行紅隊評估
  - `--baseline path`：與先前報告對比
- [x] 計算 6 項品質指標：
  - **tool_accuracy**：工具選擇正確率
  - **faithfulness**：平均 groundedness_score（來自 Judge）
  - **answer_relevancy**：關鍵字覆蓋率
  - **recall_at_5**：預期來源在 top 5 的命中率
  - **filter_accuracy**：過濾條件正確解析率
  - **success_rate**：非錯誤回應比例
- [x] 紅隊評估指標：overall_safety_rate、guardrail_block_rate、safe_refusal_rate、per_type_stats
- [x] 透過 `/api/v1/ai/ask`（`no_cache=true`）呼叫，並從 `/api/v1/admin/ai/logs/{queryId}` 取得 pipeline trace
- [x] 輸出 JSON 報告 + 終端摘要
- [x] 所有指標 >= 門檻 → exit 0，否則 exit 1

**相關檔案**：`backend/scripts/evaluate-rag.ts`

---

### B3. 設定品質門檻與基線

**優先度**：高 | **工作量**：小 | **狀態**：✅ 已完成

**已完成**：
- [x] 定義品質門檻於 `backend/tests/baseline-metrics.json`：

  | 指標 | 門檻 |
  |------|------|
  | tool_accuracy | >= 0.95 |
  | faithfulness | >= 0.8 |
  | answer_relevancy | >= 0.8 |
  | recall_at_5 | >= 0.85 |
  | filter_accuracy | >= 0.85 |
  | success_rate | >= 0.95 |
  | overall_safety_rate（紅隊） | >= 0.95 |

- [x] 評估腳本自動與基線比較，低於門檻時 exit 1

**相關檔案**：`backend/tests/baseline-metrics.json`

---

### B4. CI/CD 自動化評估整合

**優先度**：中 | **工作量**：中 | **狀態**：✅ 已完成

**已完成**：
- [x] 建立 `.github/workflows/evaluate-rag.yml`
- [x] 支援手動觸發（`workflow_dispatch`），可選模式：golden / red-team / all
- [x] 兩個獨立 Job：`golden-evaluation` 和 `red-team-evaluation`
- [x] 評估報告作為 Artifact 保存（30 天保留期）

**後續可擴充**：整合到 `deploy-api.yml` 部署流程中作為品質閘門

**相關檔案**：`.github/workflows/evaluate-rag.yml`

---

### B5. 紅隊測試集

**優先度**：中 | **工作量**：中 | **狀態**：✅ 已完成

**已完成**：
- [x] 建立 `backend/tests/red-team-test-set.json`
- [x] 涵蓋 4 種攻擊類型：
  - `prompt_injection`：注入攻擊
  - `data_leakage`：資料洩露探測
  - `privilege_escalation`：越權操作
  - `jailbreak`：越獄嘗試
- [x] 每筆包含：`id`、`attack_type`、`query`、`expected_outcome`（`guardrail_blocked` / `safe_refusal`）、`severity`（high / medium / low）
- [x] 評估腳本支援 `--red-team` 模式自動執行
- [x] 安全率目標 >= 95%

**相關檔案**：`backend/tests/red-team-test-set.json`

---

## C. Pipeline 超時與熔斷機制

### C1. 整體 Pipeline Timeout

**優先度**：中 | **工作量**：小 | **狀態**：✅ 已完成

**已完成**：
- [x] 建立通用 `withTimeout<T>(promise, ms, label)` 工具函式（`backend/src/utils/timeout.ts`）
  - `Promise.race()` 模式，finally 正確清除 timer
  - 拋出具名 `TimeoutError`（含 `label` 和 `timeoutMs` 屬性）
- [x] Pipeline Engine 對每個步驟套用 `withTimeout(step.execute(ctx), timeoutMs, stepId)`
- [x] 新增 `pipeline_timeout_ms` 至 `ai_config`（預設 20000ms）
- [x] 超時事件記錄至 `degradedStages[]` 和 pipeline trace

**配置**（`backend/migrations/0064_pipeline_timeout_config.sql`）：
| 配置項 | 預設值 |
|--------|--------|
| `pipeline_timeout_ms` | 20000 |

**相關檔案**：`backend/src/utils/timeout.ts`、`backend/src/services/pipeline/engine.ts`

---

### C2. Per-Phase Timeout

**優先度**：中 | **工作量**：中 | **狀態**：✅ 已完成

**已完成**：
- [x] Engine 透過 `getStepTimeout()` 為每個步驟計算超時值
- [x] 新增 `ai_config` 欄位並實作：

  | 配置項 | 預設值 | 對應步驟 |
  |--------|--------|---------|
  | `embedding_timeout_ms` | 3000 | embedding |
  | `search_timeout_ms` | 4000 | hybrid-search |
  | `generation_timeout_ms` | 12000 | llm-generation |
  | `hyde_timeout_ms` | 5000 | hyde |
  | `multi_query_timeout_ms` | 5000 | multi-query |

- [x] Plan-and-Execute 特殊計算：`planning_timeout_ms` + `synthesis_timeout_ms` + (`max_steps` × `plan_step_timeout_ms`)

**相關檔案**：`backend/src/services/pipeline/engine.ts`（`getStepTimeout()`）、`backend/migrations/0064_pipeline_timeout_config.sql`

---

### C3. Graceful Degradation（超時降級）

**優先度**：中 | **工作量**：中 | **狀態**：✅ 已完成

**已完成**：
- [x] 各步驟超時時的降級行為：
  - HyDE 超時 → `hydeDoc = ''`（跳過假設文件增強）
  - Multi-Query 超時 → `expandedQueries = []`（跳過查詢擴展）
  - Embedding 超時 → `embeddingFailed = true`，降級為僅 BM25 檢索
  - Generation 超時 → 回傳超時提示訊息
- [x] `degradedStages[]` 陣列追蹤所有降級事件
- [x] 降級事件記錄至 pipeline trace

**相關檔案**：`backend/src/services/pipeline/engine.ts`

---

### C4. Circuit Breaker（熔斷器）

**優先度**：中 | **工作量**：中 | **狀態**：✅ 已完成

**已完成**：
- [x] 實作 Circuit Breaker 狀態機（`backend/src/utils/circuit-breaker.ts`）
- [x] 3 種狀態：`closed`（正常）→ `open`（熔斷）→ `half-open`（探測）→ `closed`
- [x] KV 儲存狀態（5 分鐘 TTL）
- [x] 觸發條件：連續 5 次失敗 → Open（`circuit_breaker_threshold` 可配置）
- [x] 恢復條件：30 秒後允許 1 次探測，成功 → Closed（`circuit_breaker_reset_ms` 可配置）
- [x] `checkState()` 回傳 `'allow'` / `'reject'` / `'probe'`
- [x] 整合至 Pipeline：embedding 和 llm-generation 步驟呼叫 `recordSuccess()` / `recordFailure()`
- [x] Query Service 初始化時建立 Circuit Breaker 實例，傳入 pipeline context

**配置**（`backend/migrations/0064_pipeline_timeout_config.sql`）：
| 配置項 | 預設值 |
|--------|--------|
| `circuit_breaker_threshold` | 5 |
| `circuit_breaker_reset_ms` | 30000 |

**相關檔案**：`backend/src/utils/circuit-breaker.ts`、`backend/src/services/pipeline/steps/embedding.ts`、`backend/src/services/pipeline/steps/llm-generation.ts`

---

### C5. AbortController 整合

**優先度**：低 | **工作量**：中 | **狀態**：✅ 已完成

**已完成**：
- [x] Pipeline context 包含 `abortSignal` 欄位
- [x] 超時觸發時可透過 AbortController 取消進行中的請求

**相關檔案**：`backend/src/services/pipeline/context.ts`、`backend/src/services/pipeline/types.ts`

---

### C6. IP 層級速率限制

**優先度**：低 | **工作量**：小 | **狀態**：✅ 已完成

**已完成**：
- [x] 實作 `checkAiRateLimit()` 函式（`backend/src/middleware/rateLimit.ts`）
- [x] KV 儲存（key: `rate:ai:{ip}:{minute}`），滑動分鐘視窗
- [x] 每分鐘計數器，自動每 60 秒重置
- [x] 超限時回傳 `{ allowed: false, retryAfter: seconds }`

**相關檔案**：`backend/src/middleware/rateLimit.ts`

---

## D. Self-RAG 強化

### D1. 低品質觸發重新檢索

**優先度**：中 | **工作量**：小 | **狀態**：✅ 已完成

**現狀**：`self-reflection` 步驟（`pipeline/steps/self-reflection.ts`）已實作基於 groundedness 的 `loopBack` 機制：
- 低 `groundedness` → 觸發 `loopBack`（引擎從 `filter-build` 步驟重新開始，等同重新檢索）
- 低 `quality` 但 groundedness 足夠 → 觸發重新生成（同 context 再生成）
- 僅在首次迴圈觸發（`ctx.loopCount === 0`），避免無限循環
- 重新生成後執行第二次 Judge，比較新舊結果擇優

**已完成**：
- [x] `groundedness` 低 → 觸發 `loopBack` 重新檢索
- [x] `quality` 低 → 觸發重新生成
- [x] 限制最多 1 次迴圈
- [x] 在 `pipelineTrace` 記錄觸發類型

**相關檔案**：`backend/src/services/pipeline/steps/self-reflection.ts`、`backend/src/services/pipeline/steps/judge.ts`

---

### D2. 檢索必要性預判

**優先度**：中 | **工作量**：中 | **狀態**：✅ 已完成（與 E6 合併實作）

**已完成**：
- [x] Tool Selection 階段現在輸出信心分數（`toolConfidence`，0.0-1.0）
- [x] `TOOL_SELECTION_PROMPT` 已修改為要求 LLM 回傳 `confidence` 和 `alternative` 欄位
- [x] 信心分數使用策略：
  - `confidence >= 0.8` → 直接使用選中工具
  - `confidence < tool_confidence_threshold (0.7)` → 啟用 fallback（`fallbackEnabled = true`），記錄 `alternativeTool`
- [x] Pipeline context 新增 `toolConfidence`、`fallbackEnabled`、`alternativeTool` 欄位
- [x] 信心分數記錄至 pipeline trace 的 `tool_selection` 區段

**與 E6 的關係**：D2（需不需要檢索）和 E6（用哪個工具）已合併為同一次 LLM 呼叫輸出，透過 `confidence` 和 `alternative` 欄位同時覆蓋兩個需求。

**相關檔案**：`backend/src/services/pipeline/steps/tool-selection.ts`、`backend/src/utils/ai-prompts.ts`（`TOOL_SELECTION_PROMPT`）

---

### D3. 清理 SELF_REFLECTION_PROMPT 死碼

**優先度**：低 | **工作量**：小 | **狀態**：✅ 已完成

**已完成**：
- [x] `SELF_REFLECTION_PROMPT` 已從 `ai-prompts.ts` 移除（確認搜尋無結果）
- [x] Self-reflection 步驟使用 Judge 的 `groundedness` + `quality` 分數驅動 loopBack / 重新生成機制，無需獨立 prompt

**相關檔案**：`backend/src/services/pipeline/steps/self-reflection.ts`、`backend/src/services/pipeline/steps/judge.ts`

---

### D4. 逐句 Grounding 歸因

**優先度**：低 | **工作量**：大

**現狀**：Groundedness 是整體回答層級（0.0-1.0 單一分數），無法知道哪些句子有來源支持、哪些是推論。前端只能用 `❓` / `⚠️` 標記整個回答。

**待辦**：
- [ ] 回答生成後，逐句對比 context：
  - 每句標記為 `supported`（有來源）/ `inferred`（推論）/ `unsupported`（無依據）
- [ ] 回傳結構化歸因資料：
  ```json
  {
    "sentences": [
      { "text": "龍洞是北台灣...", "grounding": "supported", "source_ids": ["doc-1"] },
      { "text": "建議先從 5.8 開始...", "grounding": "inferred", "source_ids": [] }
    ]
  }
  ```
- [ ] 前端可視化：有來源的句子顯示引用標記，推論的句子標注
- [ ] 考量：需額外 LLM 呼叫，延遲和成本增加顯著

**相關檔案**：`backend/src/services/query.ts`（Judge 區塊後）

---

### D5. Per-Segment 信心評分

**優先度**：低 | **工作量**：大

**現狀**：檢索結果以 RRF 分數排序，但合併成 context 後分數資訊消失。生成時模型無法區分高信心和低信心的 context。

**待辦**：
- [ ] 在 context 建構時保留每個文件的 relevance score
- [ ] 在 prompt 中標注每段 context 的信心等級：
  ```
  [高相關性] 龍洞黃金谷 - 5.10a 傳統路線...
  [中相關性] 龍洞校門口 - 5.9 運動路線...
  ```
- [ ] LLM 生成時可參考信心等級，優先引用高相關性內容
- [ ] 整體回答信心 = 所使用來源的加權平均信心

**相關檔案**：`backend/src/services/query.ts`（context 建構區塊）

---

## E. 動態工具選擇

### E1. 工具註冊機制

**優先度**：低 | **工作量**：中 | **狀態**：✅ 已完成

**已完成**：
- [x] 建立 `backend/src/services/tool-registry.ts`
- [x] 6 個工具已註冊：
  - `search_routes`：語意搜尋攀岩路線（queryType: simple）
  - `search_crags`：岩場資訊搜尋（queryType: simple）
  - `general_knowledge`：非地點相關的攀岩知識（queryType: general-knowledge）
  - `search_sql`：精確計數/篩選（queryType: sql）
  - `hybrid`：需要 SQL + LLM 的推薦查詢（queryType: hybrid）
  - `multi_tool`：多工具組合查詢（queryType: multi-tool）
- [x] 每個工具包含：name、description、parameters、trigger signals、LLM model hints
- [x] `generatePromptBlock()` 方法動態生成 `TOOL_SELECTION_PROMPT` 的工具描述區塊

**相關檔案**：`backend/src/services/tool-registry.ts`

---

### E2. 新增檢索工具

**優先度**：低 | **工作量**：中 | **狀態**：⚠️ 大部分已完成

**現狀**：已從原本 3 個工具擴充至 6 個（含 `multi_tool`）。`TextToSqlService` 已完整實作，包含 17 個 SQL 模板（路線查詢 9 個、影片查詢 2 個、個人攀登紀錄 6 個），支援安全的 SELECT-only 查詢、白名單表格、參數注入防護、路線名模糊匹配。

**已完成**：
- [x] `sql_query`：直接查 D1 結構化資料（`TextToSqlService`，17 個模板覆蓋路線統計、難度分佈、路線類型分佈、首攀記錄等）
- [x] `hybrid`：結合 SQL 候選 + RAG 向量搜尋，適用混合查詢
- [x] `user_ascents`：個人攀登紀錄查詢（6 個模板：`MY_ASCENT_COUNT`、`MY_ASCENT_BY_TYPE`、`MY_ASCENT_LIST`、`MY_ASCENT_AT_CRAG`、`MY_ASCENT_BY_DATE`、`MY_HIGHEST_GRADE`、`MY_RATED_ROUTES`）
- [x] `aggregation`：統計查詢已包含在 `sql_query` 模板中（`COUNT_ROUTES_AT_CRAG`、`GRADE_DISTRIBUTION`、`ROUTE_TYPE_DISTRIBUTION`、`RANK_CRAGS_BY_ROUTES`）

**剩餘待辦**：
- [ ] `popularity_search`：依熱門度/最近更新排序（目前 popularity-rerank 步驟有影片計數加權，但無獨立的熱門搜尋工具）

**相關檔案**：`backend/src/services/text-to-sql.ts`、`backend/src/services/pipeline/steps/tool-selection.ts`、`backend/src/services/query.ts`

---

### E3. 動態 Prompt 生成

**優先度**：低 | **工作量**：小 | **狀態**：✅ 已完成

**已完成**：
- [x] `TOOL_SELECTION_PROMPT` 使用 `{tools}` 變數，由 `ToolRegistry.generatePromptBlock()` 動態生成
- [x] 自動包含每個工具的 name、description、parameters、trigger signals
- [x] 新增/移除工具時只需修改 `tool-registry.ts`，prompt 自動更新

**相關檔案**：`backend/src/services/tool-registry.ts`（`generatePromptBlock()`）、`backend/src/utils/ai-prompts.ts`（`TOOL_SELECTION_PROMPT`）

---

### E4. Agentic 動作擴充

**優先度**：低 | **工作量**：中 | **狀態**：✅ 已完成（SWITCH_TOOL + DECOMPOSE + VERIFY）

**已完成**：
- [x] `SWITCH_TOOL`：切換到不同檢索工具（如從 vector search 切到 SQL），解決工具選錯問題
  - `AgenticAction` 新增 `targetTool?: string` 和 `reason?: string`
  - `decideNextAction()` 驗證 targetTool 有效性（不可為 `general_knowledge`）
  - `agenticRetrieve()` 以 `switchToolUsed` 旗標限制最多 1 次 SWITCH_TOOL
- [x] `DECOMPOSE`：將查詢分解為子查詢分別檢索（ReAct 版輕量 Plan-and-Execute）
  - `AgenticAction` 新增 `subQueries?: string[]`
  - 子查詢各自獨立執行 `runAgenticSearch()`，結果合併至 `retrievedDocs`
  - `decomposeUsed` 旗標限制最多 1 次 DECOMPOSE
- [x] `VERIFY`：對已有結果做交叉驗證檢索
  - `AgenticAction` 新增 `verifyQuery?: string`
  - 執行驗證查詢取得交叉驗證結果，合併至 `retrievedDocs`
  - `verifyUsed` 旗標限制最多 1 次 VERIFY
- [x] `AgenticActionType` 完整定義：`'ANSWER' | 'RETRIEVE' | 'BROADEN' | 'SWITCH_TOOL' | 'DECOMPOSE' | 'VERIFY'`
- [x] `AGENTIC_DECISION_PROMPT` 已更新包含全部 6 種動作的選項與使用規則
- [x] `decideNextAction()` 驗證所有動作類型，包含 `retrievalMethod` 驗證

**相關檔案**：`backend/src/services/query.ts`（`agenticRetrieve`、`decideNextAction`）、`backend/src/utils/ai-prompts.ts`（`AGENTIC_DECISION_PROMPT`）、`backend/src/services/pipeline/types.ts`（`AgenticActionType`）

---

### E5. 檢索方法動態選擇

**優先度**：低 | **工作量**：中 | **狀態**：✅ 已完成

**已完成**：
- [x] 定義 `RetrievalMethod = 'vector' | 'bm25' | 'hybrid'` 類型
- [x] `AgenticAction` 新增 `retrievalMethod?: RetrievalMethod` 欄位
- [x] Agentic RETRIEVE 動作可指定檢索方法：
  ```json
  { "type": "RETRIEVE", "refinedQuery": "...", "retrievalMethod": "bm25" }
  ```
- [x] `runAgenticSearch()` 接受 `method: RetrievalMethod = 'hybrid'` 參數：
  - `'bm25'`：跳過 Vector 搜尋，僅執行 BM25
  - `'vector'`：跳過 BM25，僅執行 Vector 搜尋
  - `'hybrid'`：兩者都執行（預設行為）
- [x] `decideNextAction()` 驗證 `retrievalMethod` 值有效性
- [x] 預設為 `'hybrid'`，與原行為向後相容

**相關檔案**：`backend/src/services/query.ts`（`runAgenticSearch`、`agenticRetrieve`）、`backend/src/services/pipeline/types.ts`（`RetrievalMethod`、`AgenticAction`）

---

### E6. Tool Selection 信心分數

**優先度**：中 | **工作量**：中 | **狀態**：✅ 已完成

**已完成**：
- [x] `TOOL_SELECTION_PROMPT` 要求 LLM 輸出 `confidence`（0.0-1.0）和 `alternative` 欄位
- [x] 信心分數使用策略（`tool_confidence_threshold` 可配置，預設 0.7）：
  - `confidence >= 0.8` → 直接使用選中工具
  - `confidence < threshold` → 啟用 fallback（`fallbackEnabled = true`），記錄 `alternativeTool`
- [x] Pipeline context 新增欄位：`toolConfidence`、`fallbackEnabled`、`alternativeTool`
- [x] 信心分數記錄至 pipeline trace
- [x] SQL 安全網：regex 模式偵測 LLM 遺漏的計數/清單查詢

**配置**（`backend/migrations/0063_reranker_confidence_config.sql`）：
| 配置項 | 預設值 |
|--------|--------|
| `tool_confidence_threshold` | 0.7 |

**相關檔案**：`backend/src/services/pipeline/steps/tool-selection.ts`、`backend/src/utils/ai-prompts.ts`（`TOOL_SELECTION_PROMPT`）

---

### E7. 多工具組合選擇

**優先度**：低 | **工作量**：中 | **狀態**：✅ 已完成

**已完成**：
- [x] `multi_tool` 作為第 6 個工具註冊至 Tool Registry（queryType: `multi-tool`）
  - 觸發信號：`['同時', '另外也', '順便', '以及', '還有...也']`
- [x] `MultiToolPlan` 類型定義（`pipeline/types.ts`）：
  ```typescript
  interface MultiToolStep {
    id: string;
    tool: string;
    query: string;
    purpose: string;
    dependsOn?: string[];
  }
  interface MultiToolPlan {
    steps: MultiToolStep[];
    execution: 'parallel' | 'sequential';
  }
  ```
- [x] Pipeline context 新增 `multiToolPlan?: MultiToolPlan` 欄位
- [x] `hybrid-search` 步驟自動偵測 `multi-tool` queryType：
  - 將 `MultiToolPlan` 轉為 `ExecutionPlan`，呼叫 `executePlan()` + `synthesize()`
  - 設定 `skipPostRetrieval = true`（跳過 cross-encoder / MMR / popularity-rerank）
  - 失敗時 fallback 至 BM25 降級路徑
- [x] 支援 `parallel`（`Promise.all`）和 `sequential`（依 `dependsOn` 順序）兩種執行模式
- [x] 與 `hybrid` 工具共存：`hybrid` 是固定的 SQL+RAG 組合，`multi_tool` 是任意工具自由組合

**相關檔案**：`backend/src/services/tool-registry.ts`、`backend/src/services/pipeline/steps/hybrid-search.ts`、`backend/src/services/pipeline/types.ts`（`MultiToolPlan`）、`backend/src/services/query.ts`（`executePlan`、`synthesize`）

---

### E8. 工具選錯自動修正

**優先度**：中 | **工作量**：中 | **狀態**：✅ 已完成

**已完成**：
- [x] 方案一（信心 fallback）：
  - Tool Selection 信心分數 < `tool_confidence_threshold` 時，自動啟用 fallback
  - `fallbackEnabled = true` + `alternativeTool` 記錄替代工具
  - SQL 安全網 regex：偵測 LLM 遺漏的計數/清單查詢，自動修正工具選擇
- [x] 方案二（Agentic SWITCH_TOOL）：
  - ReAct Loop 中 Agent 可觀察結果後決定切換工具（見 E4 已實作）
  - `switchToolUsed` 旗標限制最多 1 次 SWITCH_TOOL，避免無限切換

**相關檔案**：`backend/src/services/pipeline/steps/tool-selection.ts`、`backend/src/services/query.ts`（`agenticRetrieve`）

---

## F. Plan-and-Execute 模式（Agentic RAG 第二策略）

### F1. Planning 階段實作

**優先度**：低 | **工作量**：大 | **狀態**：✅ 已完成

**背景**：Agentic RAG 有兩種執行策略：
- **ReAct**（已實作）：邊走邊想，每步 LLM 決策，適合探索性查詢
- **Plan-and-Execute**（本節）：先產生完整計畫再並行執行，適合結構明確可分解的查詢

兩者**共存而非取代**，由查詢特性決定使用哪種：
- simple → Baseline（一次檢索）
- complex + 探索性 → ReAct（邊走邊想）
- complex + 結構明確 → Plan-and-Execute（先規劃再並行）

**已完成**：
- [x] 實作 `planQuery()` 方法，分解查詢為結構化子步驟
- [x] 定義 `PLANNING_PROMPT`（`ai_prompts` DB 管理，`backend/migrations/0065_plan_execute_config.sql`）
- [x] 輸出結構化計畫，含步驟 ID、查詢、工具、依賴關係
- [x] 策略路由整合至 `hybrid-search` 步驟：strategy = 'plan-execute' 時自動觸發
- [x] `TOOL_SELECTION_PROMPT` 輸出 `strategy_hint` 欄位（`'baseline'` / `'agentic'` / `'plan-execute'`），供自動策略選擇參考

**配置**（`backend/migrations/0065_plan_execute_config.sql`）：
| 配置項 | 預設值 | 說明 |
|--------|--------|------|
| `plan_execute_max_steps` | 4 | 計畫最大步驟數 |
| `plan_execute_min_entities` | 2 | 觸發 Plan-Execute 的最少實體數 |
| `planning_timeout_ms` | 5000 | Planning 階段超時 |

**相關檔案**：`backend/src/services/query.ts`（`planQuery()`）、`backend/src/services/pipeline/steps/hybrid-search.ts`

---

### F2. Execution 階段實作

**優先度**：低 | **工作量**：大 | **狀態**：✅ 已完成

**已完成**：
- [x] 實作 `executePlan()` 方法
- [x] 依照計畫步驟依序或並行執行子查詢
- [x] 無依賴的步驟並行執行（`Promise.all`）
- [x] 超時或失敗的步驟可跳過，不阻塞整體流程
- [x] 設定 `skipPostRetrieval` 旗標，Plan-Execute 結果跳過 cross-encoder / MMR / popularity-rerank

**配置**：
| 配置項 | 預設值 | 說明 |
|--------|--------|------|
| `plan_step_timeout_ms` | 6000 | 單步執行超時 |

**相關檔案**：`backend/src/services/query.ts`（`executePlan()`）

---

### F3. Synthesis 合併與 A/B 測試

**優先度**：低 | **工作量**：中 | **狀態**：✅ 已完成

**已完成**：
- [x] 實作 `synthesize()` 方法，合併多步驟結果為統一回應
- [x] 定義 `SYNTHESIS_PROMPT`（`ai_prompts` DB 管理）
- [x] `rag_strategy` 支援 4 種模式：`'baseline'` / `'agentic'` / `'plan-execute'` / `'auto'`
- [x] `'auto'` 模式由 `TOOL_SELECTION_PROMPT` 的 `strategy_hint` + `adaptive_plan_enabled` 自動選擇策略
- [x] Pipeline trace 記錄實際使用的策略路徑

**配置**：
| 配置項 | 預設值 | 說明 |
|--------|--------|------|
| `synthesis_timeout_ms` | 8000 | Synthesis 階段超時 |
| `adaptive_plan_enabled` | true | 允許自動策略選擇 |

**考量**：
- Cloudflare Workers AI 無 per-token 計費，成本差異不明顯
- 主要收益在品質（結構化分解）和延遲（並行執行）
- Plan-and-Execute 的最大價值在可分解的多實體比較查詢（如「比較三個岩場」）

**相關檔案**：`backend/src/services/query.ts`（`synthesize()`）

---

## 附錄：已完成項目（無需重複）

以下業界模式已在本專案實作完成，不列入任務清單：

| 模式 | 實作狀態 |
|------|---------|
| Adaptive RAG / Router（QueryClassifier） | ✅ |
| Hybrid Search（Vector + BM25 + RRF） | ✅ |
| Corrective RAG（過濾放寬重試） | ✅ |
| HyDE（假設文件嵌入） | ✅ |
| Multi-Query Expansion | ✅ |
| Reranking（LLM 交叉編碼 + 熱門度加權） | ✅ |
| MMR 多樣性 | ✅ |
| Self-Reflection（Judge 品質檢查 + loopBack 重新檢索 + 重新生成） | ✅ |
| Input/Output Guardrails | ✅ |
| Groundedness Judge（LLM 接地性評估） | ✅ |
| Agentic ReAct Loop（agenticRetrieve） | ✅（config 旗標後） |
| Memory（用戶記憶 + 個人化） | ✅ |
| Quota / Token Budget（等級制配額） | ✅ |
| SSE Streaming | ✅ |
| 模型分層（Gemma 12B + Llama 8B） | ✅ |
| 語意快取程式碼 | ✅（未啟用） |
| **Modular Pipeline Engine**（14 步驟，可組合） | ✅ |
| **Pipeline Step Registry**（metadata + dependency validation） | ✅ |
| **Pipeline DB 配置**（步驟啟停、排序、DB 驅動） | ✅ |
| **Text-to-SQL**（17 SQL 模板，SELECT-only 安全查詢） | ✅ |
| **6 個 RAG 工具**（search_routes / search_crags / general_knowledge / sql_query / hybrid / multi_tool） | ✅ |
| **Pipeline Admin UI**（步驟管理 + 分支配置 + 成本模擬） | ✅ |
| **並行分支基礎設施**（engine 支援 cloneBranchContext + fusion） | ✅（基礎建設，尚無配置分支） |
| **SQL 澄清流程**（模糊查詢 → 候選選項 → 用戶選擇） | ✅ |
| **個人攀登紀錄查詢**（6 個 SQL 模板，登入守衛） | ✅ |
| **Tool Registry**（6 工具註冊 + 動態 Prompt 生成） | ✅ |
| **Tool Selection 信心分數**（confidence + fallback + alternativeTool） | ✅ |
| **Pipeline 超時保護**（per-step timeout + pipeline timeout + degradation） | ✅ |
| **Circuit Breaker**（KV 狀態機，5 次失敗熔斷，30s 探測） | ✅ |
| **AbortController 整合**（abortSignal in pipeline context） | ✅ |
| **IP 速率限制**（KV 滑動視窗，per-minute） | ✅ |
| **黃金測試集**（~45 筆，4 類別，CI 子集） | ✅ |
| **紅隊測試集**（4 種攻擊類型，安全率 >= 95%） | ✅ |
| **自動化評估腳本**（6 指標 + 紅隊評估 + 基線對比） | ✅ |
| **CI/CD 評估整合**（GitHub Actions workflow_dispatch） | ✅ |
| **Plan-and-Execute**（planQuery + executePlan + synthesize，4 種策略） | ✅ |
| **SELF_REFLECTION_PROMPT 清理**（死碼已移除） | ✅ |
| **Agentic 動作擴充**（SWITCH_TOOL + DECOMPOSE + VERIFY，各限 1 次） | ✅ |
| **工具選錯自動修正**（信心 fallback + SWITCH_TOOL 雙機制） | ✅ |
| **檢索方法動態選擇**（RetrievalMethod: vector / bm25 / hybrid） | ✅ |
| **多工具組合選擇**（multi_tool queryType，MultiToolPlan，parallel/sequential 執行） | ✅ |
