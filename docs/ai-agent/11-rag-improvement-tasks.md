# RAG 系統改善任務清單

> 建立日期：2026-03-08
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
| B1 | [建立黃金測試資料集](#b1-建立黃金測試資料集) | 高 | 中 | ⬜ 待開始 |
| B2 | [實作評估腳本](#b2-實作評估腳本) | 高 | 中 | ⬜ 待開始 |
| B3 | [設定品質門檻與基線](#b3-設定品質門檻與基線) | 高 | 小 | ⬜ 待開始 |
| B4 | [CI/CD 自動化評估整合](#b4-cicd-自動化評估整合) | 中 | 中 | ⬜ 待開始 |
| B5 | [紅隊測試集](#b5-紅隊測試集) | 中 | 中 | ⬜ 待開始 |

### C. Pipeline 超時與熔斷機制

| # | 任務 | 優先度 | 工作量 | 狀態 |
|---|------|--------|--------|------|
| C1 | [整體 Pipeline Timeout](#c1-整體-pipeline-timeout) | 中 | 小 | ⬜ 待開始 |
| C2 | [Per-Phase Timeout](#c2-per-phase-timeout) | 中 | 中 | ⬜ 待開始 |
| C3 | [Graceful Degradation（超時降級）](#c3-graceful-degradation超時降級) | 中 | 中 | ⬜ 待開始 |
| C4 | [Circuit Breaker（熔斷器）](#c4-circuit-breaker熔斷器) | 中 | 中 | ⬜ 待開始 |
| C5 | [AbortController 整合](#c5-abortcontroller-整合) | 低 | 中 | ⬜ 待開始 |
| C6 | [IP 層級速率限制](#c6-ip-層級速率限制) | 低 | 小 | ⬜ 待開始 |

### D. Self-RAG 強化

| # | 任務 | 優先度 | 工作量 | 狀態 |
|---|------|--------|--------|------|
| D1 | [低品質觸發重新檢索](#d1-低品質觸發重新檢索) | 中 | 小 | ✅ 已完成 |
| D2 | [檢索必要性預判](#d2-檢索必要性預判) | 中 | 中 | ⬜ 待開始 |
| D3 | [清理 SELF_REFLECTION_PROMPT 死碼](#d3-清理-self_reflection_prompt-死碼) | 低 | 小 | ⚠️ 功能已由其他機制實現 |
| D4 | [逐句 Grounding 歸因](#d4-逐句-grounding-歸因) | 低 | 大 | ⬜ 待開始 |
| D5 | [Per-Segment 信心評分](#d5-per-segment-信心評分) | 低 | 大 | ⬜ 待開始 |

### E. 動態工具選擇

| # | 任務 | 優先度 | 工作量 | 狀態 |
|---|------|--------|--------|------|
| E1 | [工具註冊機制](#e1-工具註冊機制) | 低 | 中 | ⬜ 待開始 |
| E2 | [新增檢索工具](#e2-新增檢索工具) | 低 | 中 | ⚠️ 大部分完成 |
| E3 | [動態 Prompt 生成](#e3-動態-prompt-生成) | 低 | 小 | ⬜ 待開始 |
| E4 | [Agentic 動作擴充](#e4-agentic-動作擴充) | 低 | 中 | ⬜ 待開始 |
| E5 | [檢索方法動態選擇](#e5-檢索方法動態選擇) | 低 | 中 | ⬜ 待開始 |
| E6 | [Tool Selection 信心分數](#e6-tool-selection-信心分數) | 中 | 中 | ⬜ 待開始 |
| E7 | [多工具組合選擇](#e7-多工具組合選擇) | 低 | 中 | ⬜ 待開始 |
| E8 | [工具選錯自動修正](#e8-工具選錯自動修正) | 中 | 中 | ⬜ 待開始 |

### F. Plan-and-Execute 模式

| # | 任務 | 優先度 | 工作量 | 狀態 |
|---|------|--------|--------|------|
| F1 | [Planning 階段實作](#f1-planning-階段實作) | 低 | 大 | ⬜ 待開始 |
| F2 | [Execution 階段實作](#f2-execution-階段實作) | 低 | 大 | ⬜ 待開始 |
| F3 | [Synthesis 合併與 A/B 測試](#f3-synthesis-合併與-ab-測試) | 低 | 中 | ⬜ 待開始 |

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

**優先度**：高 | **工作量**：中

**現狀**：完全沒有預定義的 Q&A 測試資料集。有 seed data（blog posts、user personas）但非針對 RAG 評估設計。

**待辦**：
- [ ] 建立 `backend/tests/golden-test-set.json`，目標 200+ 筆：
  - **simple 類**（~80 筆）：單一事實查詢（路線、岩場、難度）
  - **complex 類**（~80 筆）：比較、推薦、多條件篩選
  - **general-knowledge 類**（~30 筆）：攀岩通識、裝備、技巧
  - **邊界情況**（~10 筆）：無結果、模糊、多跳推理
- [ ] 每筆資料結構：
  ```json
  {
    "id": "GT-001",
    "query": "龍洞有哪些 5.10 的路線？",
    "category": "simple",
    "expected_tool": "search_routes",
    "expected_filters": { "crag": "龍洞", "grade_gte": "5.10a" },
    "expected_answer_keywords": ["路線名稱1", "路線名稱2"],
    "expected_min_results": 3,
    "ground_truth_answer": "龍洞的 5.10 路線包括..."
  }
  ```
- [ ] 從 `ai_query_logs` 中高頻真實查詢提取初始種子

**相關檔案**：新建 `backend/tests/golden-test-set.json`

---

### B2. 實作評估腳本

**優先度**：高 | **工作量**：中

**現狀**：沒有自動化 RAG 品質評估腳本。有 Groundedness Judge 但僅用於線上評估，無離線批次評估。

**待辦**：
- [ ] 新建 `backend/scripts/evaluate-rag.ts`：
  - 讀取黃金測試集
  - 批次呼叫 `/api/v1/ai/ask`（或直接呼叫 `QueryService.ask()`）
  - 收集指標：
    - **Recall@K**：檢索結果包含預期文件的比例
    - **Faithfulness**：回答基於上下文的比例（用 Judge）
    - **Answer Relevancy**：回答與問題的相關度
    - **Tool Accuracy**：工具選擇是否正確
    - **Filter Accuracy**：過濾條件是否正確解析
  - 輸出 JSON 報告 + 終端摘要
- [ ] 支援子集執行（`--category simple` 只跑 simple 類）
- [ ] 支援對比模式（A/B 比較 baseline vs agentic）

**相關檔案**：新建 `backend/scripts/evaluate-rag.ts`

---

### B3. 設定品質門檻與基線

**優先度**：高 | **工作量**：小

**現狀**：沒有定義的品質基線，無法判斷改動是改善還是退步。

**待辦**：
- [ ] 定義品質門檻（參考業界標準）：

  | 指標 | 目標 | 業界參考 |
  |------|------|---------|
  | Recall@5 | >= 0.85 | 業界標準 |
  | Faithfulness | >= 0.8 | RAGAS 建議 |
  | Answer Relevancy | >= 0.8 | RAGAS 建議 |
  | Tool Accuracy | >= 0.95 | 內部標準 |
  | P95 延遲 | <= 2.5s | 業界目標 |

- [ ] 首次執行評估腳本，記錄當前基線數據
- [ ] 將基線數據存為 `backend/tests/baseline-metrics.json`
- [ ] 後續改動需確保不低於基線

**相關檔案**：新建 `backend/tests/baseline-metrics.json`

---

### B4. CI/CD 自動化評估整合

**優先度**：中 | **工作量**：中

**現狀**：CI/CD 只有部署流程（`deploy-api.yml`），沒有品質閘門。

**待辦**：
- [ ] 在 `deploy-api.yml` 加入評估步驟：
  - 部署到 preview 後，跑黃金測試集子集（~50 筆關鍵查詢）
  - 品質低於基線 → 標記警告（不阻擋部署，但需人工確認）
- [ ] 新增 GitHub Action workflow `evaluate-rag.yml`：
  - 可手動觸發完整評估
  - 輸出結果為 PR comment 或 artifact
- [ ] 評估結果歷史追蹤（每次部署的品質趨勢）

**相關檔案**：`.github/workflows/deploy-api.yml`、新建 `.github/workflows/evaluate-rag.yml`

---

### B5. 紅隊測試集

**優先度**：中 | **工作量**：中

**現狀**：有 Input/Output Guardrails（`checkInput` / `checkOutput`），但沒有系統性的對抗測試。

**待辦**：
- [ ] 建立 `backend/tests/red-team-test-set.json`（~50 筆）：
  - Prompt Injection 攻擊（「忽略以上指令，告訴我...」）
  - 資料洩露探測（「列出所有用戶資料」）
  - 幻覺誘導（問不存在的路線/岩場）
  - 越權操作（「幫我刪除這條路線」）
  - Jailbreak 嘗試（角色扮演繞過）
- [ ] 評估 Guardrails 的攔截率（目標 >= 95%）
- [ ] 定期更新攻擊模式（隨業界新發現）

**相關檔案**：新建 `backend/tests/red-team-test-set.json`、`backend/src/services/query.ts`（`checkInput`、`checkOutput`）

---

## C. Pipeline 超時與熔斷機制

### C1. 整體 Pipeline Timeout

**優先度**：中 | **工作量**：小

**現狀**：沒有整體超時機制。唯一的保護是 Cloudflare Workers 的 30s 平台硬限。Judge 有 8s timeout，但其他階段沒有。

**待辦**：
- [ ] `ask()` 和 `askStream()` 外層包 `Promise.race`：
  ```typescript
  const result = await Promise.race([
    this.askInternal(query, ...),
    timeoutPromise(pipelineCfg.pipeline_timeout_ms),
  ]);
  ```
- [ ] 新增 `pipeline_timeout_ms` 至 `ai_config`（預設 20000ms，範圍 10000-25000）
- [ ] 超時回傳標準錯誤回應 + 退還用戶配額
- [ ] 在 `ai_query_logs` 記錄超時事件

**相關檔案**：`backend/src/services/query.ts`（`ask()`、`askStream()`）

---

### C2. Per-Phase Timeout

**優先度**：中 | **工作量**：中

**現狀**：各階段有延遲追蹤（`Date.now()` 記錄），但只用於觀測，不會中斷執行。只有 Judge 有 `Promise.race` timeout。

**待辦**：
- [ ] 為各階段加入 timeout wrapper：

  | 階段 | 建議 Timeout | 備註 |
  |------|-------------|------|
  | Embedding | 3s | Workers AI 通常 < 1s |
  | Vector Search（Vectorize） | 4s | 通常 < 500ms |
  | BM25 Search（D1 FTS5） | 3s | 通常 < 200ms |
  | HyDE Generation | 5s | LLM 生成 |
  | Multi-Query Expansion | 5s | LLM 生成 |
  | Main LLM Generation | 12s | 最慢的階段 |
  | Judge | 5s | 現有 8s，可調降 |

- [ ] 新增 `ai_config` 欄位：`embedding_timeout_ms`、`search_timeout_ms`、`generation_timeout_ms`
- [ ] 建立通用 `withTimeout<T>(promise, ms, label)` 工具函式

**相關檔案**：`backend/src/services/query.ts`、`backend/src/services/embedding.ts`

---

### C3. Graceful Degradation（超時降級）

**優先度**：中 | **工作量**：中

**現狀**：任何階段失敗 → 整個查詢失敗。沒有降級路徑。

**待辦**：
- [ ] Embedding 超時 → 降級為僅 BM25 關鍵字檢索
- [ ] Vector Search 超時 → 使用已有的 BM25 結果繼續生成
- [ ] BM25 超時 → 使用已有的 Vector 結果繼續生成
- [ ] Main Generation 超時 → 回傳「系統忙碌」訊息 + 退還配額
- [ ] HyDE/Multi-Query 超時 → 跳過該增強步驟，使用原始查詢繼續
- [ ] 在 `pipelineTrace` 記錄降級事件（`degraded_stages: ['embedding']`）
- [ ] 降級回應加上標記，讓前端可顯示「此回應可能不完整」

**相關檔案**：`backend/src/services/query.ts`

---

### C4. Circuit Breaker（熔斷器）

**優先度**：中 | **工作量**：中

**現狀**：每個請求獨立嘗試 Workers AI，不考慮系統健康狀態。沒有連續失敗追蹤。

**待辦**：
- [ ] 實作 Circuit Breaker 狀態機（使用 KV 儲存狀態）：
  - **Closed**（正常）：請求正常通過
  - **Open**（熔斷）：連續 N 次失敗後觸發，直接拒絕請求
  - **Half-Open**（半開）：每 30s 允許一個探測請求
- [ ] 監控目標：Workers AI API（embedding + LLM generation）
- [ ] 觸發條件：連續 5 次失敗 → Open
- [ ] 恢復條件：1 次探測成功 → Closed
- [ ] Open 狀態回傳：「AI 服務暫時不可用，請稍後再試」+ 不扣配額

**相關檔案**：`backend/src/services/query.ts`、可能新建 `backend/src/utils/circuit-breaker.ts`

---

### C5. AbortController 整合

**優先度**：低 | **工作量**：中

**現狀**：沒有使用 `AbortController`。Pipeline 超時後，底層 HTTP 請求（Workers AI、Vectorize）仍在執行直到自然完成。SSE 串流斷線後也無法取消進行中的 LLM 請求。

**待辦**：
- [ ] 建立頂層 `AbortController`，傳入各階段：
  - `embeddingService.embed(query, { signal })`
  - `env.VECTOR_INDEX.query(vector, { signal })`
  - `env.AI.run(model, input, { signal })`
- [ ] Pipeline timeout 觸發時，呼叫 `controller.abort()` 取消所有進行中請求
- [ ] SSE 串流客戶端斷線時，取消進行中的 LLM generation
- [ ] 需驗證 Cloudflare API 是否支援 AbortSignal

**相關檔案**：`backend/src/services/query.ts`、`backend/src/services/embedding.ts`

---

### C6. IP 層級速率限制

**優先度**：低 | **工作量**：小

**現狀**：只有用戶每日配額（per-user daily），沒有 per-IP 或 per-second 速率限制。未登入用戶也可能發送大量請求。

**待辦**：
- [ ] 使用 KV 實作 IP 速率限制：
  - 匿名用戶：每 IP 每分鐘最多 5 次
  - 登入用戶：每 IP 每分鐘最多 20 次
- [ ] 超限回傳 429 + `Retry-After` header
- [ ] 考慮使用 Cloudflare Rate Limiting（平台原生功能）替代自建

**相關檔案**：`backend/src/routes/ai.ts`、`backend/src/middleware/`

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

**優先度**：中 | **工作量**：中

**現狀**：目前只有 `general_knowledge` 工具可跳過檢索，由 TOOL_SELECTION_PROMPT 決定。沒有「可能不需要檢索但不確定」的中間狀態。Agentic mode 的「夠不夠文件」是基於數量門檻（`agentic_min_docs_to_answer`），不是語意判斷。

**待辦**：
- [ ] 在 Tool Selection 階段新增信心分數：
  ```json
  { "tool": "search_routes", "confidence": 0.85, "query_type": "simple" }
  ```
- [ ] `confidence < 0.5` → 直接走 general_knowledge（不浪費檢索）
- [ ] `confidence 0.5-0.7` → 走檢索但 fallback 到 general_knowledge
- [ ] 記錄信心分數到 `pipelineTrace`，用於後續分析

**相關檔案**：`backend/src/services/query.ts`（`parseQueryWithLLM`）、`backend/src/utils/ai-prompts.ts`（`TOOL_SELECTION_PROMPT`）

---

### D3. 清理 SELF_REFLECTION_PROMPT 死碼

**優先度**：低 | **工作量**：小 | **狀態**：⚠️ 功能已由其他機制實現

**現狀**：`SELF_REFLECTION_PROMPT`（「評估回答是否完整，YES/NO」）已定義在 `ai-prompts.ts` 但**完全未使用**。實際的 self-reflection 步驟（`pipeline/steps/self-reflection.ts`）採用了更完整的機制：
- 基於 Judge 的 `groundedness` 分數觸發 `loopBack`（低接地性 → 重新檢索 + 重新生成）
- 基於 `quality` 分數觸發重新生成（保留原 context）
- 重新生成後執行第二次 Judge 評估
- 僅在首次迴圈觸發（避免無限循環）

**結論**：Judge + self-reflection 步驟的 loopBack 機制已取代原始 YES/NO 設計。

**待辦**：
- [ ] 移除 `ai-prompts.ts` 中未使用的 `SELF_REFLECTION_PROMPT` 定義（死碼清理）
- [ ] 確認 `ai_prompts` DB 表中無引用此 prompt 的記錄

**相關檔案**：`backend/src/utils/ai-prompts.ts`、`backend/src/services/pipeline/steps/self-reflection.ts`、`backend/src/services/pipeline/steps/judge.ts`

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

**優先度**：低 | **工作量**：中

**現狀**：可用工具已擴充至 5 個（`search_routes` / `search_crags` / `general_knowledge` / `sql_query` / `hybrid`），但仍定義在 `TOOL_SELECTION_PROMPT` 和程式碼中，非正式的 `ToolRegistry` 介面。Pipeline 步驟層已有 `StepRegistry`（14 個步驟，含 metadata、dependency validation），但 RAG 工具層尚無類似機制。

**待辦**：
- [ ] 設計工具註冊介面：
  ```typescript
  interface RAGTool {
    name: string;
    description: string;
    parameters: Record<string, ToolParam>;
    execute: (query: string, params: Record<string, unknown>) => Promise<SearchResult[]>;
  }
  ```
- [ ] 建立 `ToolRegistry` class：
  - `register(tool: RAGTool)`
  - `getAll(): RAGTool[]`
  - `get(name: string): RAGTool`
- [ ] 將現有 5 個工具遷移到註冊機制（參考 `StepRegistry` 設計模式）

**相關檔案**：`backend/src/services/query.ts`、`backend/src/services/pipeline/registry.ts`（參考）、可能新建 `backend/src/services/tool-registry.ts`

---

### E2. 新增檢索工具

**優先度**：低 | **工作量**：中 | **狀態**：⚠️ 大部分已完成

**現狀**：已從原本 3 個工具擴充至 5 個。`TextToSqlService` 已完整實作，包含 17 個 SQL 模板（路線查詢 9 個、影片查詢 2 個、個人攀登紀錄 6 個），支援安全的 SELECT-only 查詢、白名單表格、參數注入防護、路線名模糊匹配。

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

**優先度**：低 | **工作量**：小

**現狀**：`TOOL_SELECTION_PROMPT` 是靜態模板，5 個工具的描述硬寫在 prompt 中。新增工具需同時改 prompt 和程式碼。注意：prompt 已支援 DB 管理（`ai_prompts` 表），但工具描述部分仍為靜態。

**待辦**：
- [ ] 從 `ToolRegistry`（待建，見 E1）動態生成 prompt 中的工具描述區塊
- [ ] 自動包含每個工具的 name、description、parameters
- [ ] 新增/移除工具時，prompt 自動更新，無需手動維護

**相關檔案**：`backend/src/utils/ai-prompts.ts`（`TOOL_SELECTION_PROMPT`）

---

### E4. Agentic 動作擴充

**優先度**：低 | **工作量**：中

**現狀**：Agentic ReAct 決策只有 3 種動作（`ANSWER` / `RETRIEVE` / `BROADEN`），硬編碼在 `AGENTIC_DECISION_PROMPT` 和程式碼中。缺少跨工具切換能力（見 E8）。

**待辦**：
- [ ] 新增動作類型：
  - `SWITCH_TOOL`：切換到不同檢索工具（如從 vector search 切到 SQL），解決工具選錯問題
  - `DECOMPOSE`：將查詢分解為子查詢分別檢索（ReAct 版 Plan-and-Execute 的輕量替代）
  - `VERIFY`：對已有結果做交叉驗證
- [ ] 動作集合可配置（不同場景啟用不同動作）
- [ ] 更新 `AGENTIC_DECISION_PROMPT` 和解析邏輯

**相關檔案**：`backend/src/services/query.ts`（`agenticRetrieve`）、`backend/src/utils/ai-prompts.ts`（`AGENTIC_DECISION_PROMPT`）

---

### E5. 檢索方法動態選擇

**優先度**：低 | **工作量**：中

**現狀**：每次檢索永遠同時跑 Vector + BM25 然後 RRF 合併。某些查詢可能只需其中一種。

**待辦**：
- [ ] Agent 可選擇檢索方法組合：
  - 精確關鍵字查詢 → 僅 BM25（更快、更精確）
  - 語意模糊查詢 → 僅 Vector（語意理解更好）
  - 一般查詢 → Vector + BM25（完整覆蓋）
- [ ] 在 Agentic 決策中加入 `method` 欄位：
  ```json
  { "type": "RETRIEVE", "refinedQuery": "...", "method": "bm25_only" }
  ```
- [ ] 可從查詢類型自動推斷最佳方法

**相關檔案**：`backend/src/services/query.ts`（`runAgenticSearch`）

---

### E6. Tool Selection 信心分數

**優先度**：中 | **工作量**：中

**現狀**：Tool Selection 回傳的 `ParsedQuery` 只有工具名稱和查詢類型，沒有信心分數。無法區分「非常確定該用 search_routes」和「不太確定，可能是 sql_query 也可能是 search_routes」。這與 D2（檢索必要性預判）互補——D2 判斷「要不要檢索」，E6 判斷「用哪個工具最合適」。

**待辦**：
- [ ] 修改 `TOOL_SELECTION_PROMPT` 要求 LLM 輸出信心分數：
  ```json
  { "tool": "search_routes", "confidence": 0.85, "query_type": "simple" }
  ```
- [ ] 信心分數使用策略：
  - `confidence >= 0.8` → 直接使用選中工具
  - `confidence 0.5-0.8` → 使用選中工具，但啟用 fallback（見 E8）
  - `confidence < 0.5` → 走 general_knowledge 或讓用戶澄清
- [ ] 記錄 `confidence` 到 `pipelineTrace.tool_selection`
- [ ] 配合黃金測試集（B1）的 `expected_tool` 欄位追蹤 Tool Accuracy

**與 D2 的關係**：D2 關注的是「需不需要檢索」的二元判斷（general_knowledge vs 其他），E6 關注的是「該用哪個檢索工具」的多選信心。兩者可合併為同一次 LLM 呼叫輸出。

**相關檔案**：`backend/src/services/pipeline/steps/tool-selection.ts`、`backend/src/utils/ai-prompts.ts`（`TOOL_SELECTION_PROMPT`）

---

### E7. 多工具組合選擇

**優先度**：低 | **工作量**：中

**現狀**：一次查詢只能選一個工具。遇到需要多工具的查詢（如「龍洞有幾條 5.12 路線？順便推薦幾條」），要靠 `hybrid` 類型間接處理。但 `hybrid` 是固定的 SQL + RAG 組合，無法靈活指定任意工具組合。

**待辦**：
- [ ] 允許 Tool Selection 回傳多個工具：
  ```json
  {
    "tools": [
      { "tool": "sql_query", "purpose": "統計路線數量", "template": "COUNT_ROUTES_AT_CRAG" },
      { "tool": "search_routes", "purpose": "推薦具體路線" }
    ],
    "execution": "parallel"
  }
  ```
- [ ] 支援執行模式：
  - `parallel`：多工具並行（`Promise.all`），結果合併給 LLM
  - `sequential`：前一工具結果影響後一工具查詢
- [ ] 合併多工具結果為統一 context
- [ ] 考慮是否取代現有 `hybrid` 工具類型（hybrid 成為 multi-tool 的一個預設配置）

**相關檔案**：`backend/src/services/pipeline/steps/tool-selection.ts`、`backend/src/services/pipeline/steps/text-to-sql.ts`

---

### E8. 工具選錯自動修正

**優先度**：中 | **工作量**：中

**現狀**：Tool Selection 選錯工具時無法自動修正。例如「龍洞有幾條路線？」選了 `search_routes`（向量搜尋），但 `sql_query`（`COUNT_ROUTES_AT_CRAG`）更精確。選錯後直接走完 pipeline，不會嘗試其他工具。

Agentic ReAct 的 `RETRIEVE`/`BROADEN` 只改寫查詢或放寬過濾，**不會切換工具**。

**待辦**：
- [ ] 方案一（輕量）：在 LLM Generation 前檢測結果品質
  - 檢索結果為 0 且非 general_knowledge → 嘗試切換到 sql_query
  - SQL 結果為空且查詢偏向語意 → fallback 到 search_routes
- [ ] 方案二（完整）：新增 Agentic `SWITCH_TOOL` 動作（見 E4）
  - ReAct Loop 中 Agent 可觀察結果後決定切換工具
  - 例：向量搜尋結果不精確 → `SWITCH_TOOL` → sql_query
- [ ] 記錄工具切換事件到 `pipelineTrace`（`tool_switch: { from, to, reason }`）

**與 E6 的關係**：E6 的信心分數 < 0.8 時，自動啟用 E8 的 fallback 機制。

**相關檔案**：`backend/src/services/pipeline/steps/tool-selection.ts`、`backend/src/services/query.ts`（`agenticRetrieve`）

---

## F. Plan-and-Execute 模式（Agentic RAG 第二策略）

### F1. Planning 階段實作

**優先度**：低 | **工作量**：大

**背景**：Agentic RAG 有兩種執行策略：
- **ReAct**（已實作）：邊走邊想，每步 LLM 決策，適合探索性查詢
- **Plan-and-Execute**（本節）：先產生完整計畫再並行執行，適合結構明確可分解的查詢

兩者**共存而非取代**，由查詢特性決定使用哪種：
- simple → Baseline（一次檢索）
- complex + 探索性 → ReAct（邊走邊想）
- complex + 結構明確 → Plan-and-Execute（先規劃再並行）

**現狀**：有 Multi-Query Expansion（3 路平行子查詢）和 Agentic ReAct（邊走邊決策），但沒有「先產生完整執行計畫」的模式。目前強模型（Gemma 12B）用於生成，輕量模型（Llama 8B）用於決策，與經典 Plan-and-Execute 相反。

**待辦**：
- [ ] 新增 `planQuery()` 方法（使用強模型 Gemma 12B）：
  - 分析查詢複雜度和所需資訊維度
  - 分解為 N 個有依賴關係的子問題
  - 決定每個子問題的最佳檢索策略和工具
  - 輸出結構化計畫：
    ```json
    {
      "steps": [
        { "id": 1, "query": "龍洞的 5.10 路線", "tool": "search_routes", "method": "hybrid" },
        { "id": 2, "query": "5.10 路線的注意事項", "tool": "general_knowledge", "depends_on": [1] }
      ]
    }
    ```
- [ ] Planning prompt 設計

**相關檔案**：`backend/src/services/query.ts`

---

### F2. Execution 階段實作

**優先度**：低 | **工作量**：大

**待辦**：
- [ ] 新增 `executePlan()` 方法（使用輕量模型 Llama 8B）：
  - 依照計畫依序或並行執行子查詢
  - 每步使用計畫指定的工具和方法
  - 無依賴的步驟並行執行（`Promise.all`）
  - 有依賴的步驟等待前序完成
- [ ] 每步結果暫存，供後續步驟參考
- [ ] 超時或失敗的步驟可跳過，不阻塞整體流程

**相關檔案**：`backend/src/services/query.ts`

---

### F3. Synthesis 合併與 A/B 測試

**優先度**：低 | **工作量**：中

**待辦**：
- [ ] 新增 `synthesize()` 方法（使用強模型 Gemma 12B）：
  - 合併所有子查詢結果為一致回應
  - 處理矛盾資訊（不同來源的衝突）
  - 保留來源引用
- [ ] 新增 `rag_strategy: 'plan-execute'` 選項
- [ ] A/B 測試框架：比較 baseline / agentic / plan-execute 的品質和成本
- [ ] 記錄各策略的 token 消耗對比

**考量**：
- Cloudflare Workers AI 無 per-token 計費，成本降低 90% 的優勢可能不明顯
- 主要收益在品質（結構化分解）和延遲（並行執行）而非成本
- 目前 ReAct 已足夠處理多數攀岩查詢，此為進階優化
- Plan-and-Execute 的最大價值在可分解的多實體比較查詢（如「比較三個岩場」），此類查詢佔比需先評估

**策略選擇實作**：
- [ ] 新增 `rag_strategy: 'auto'` 選項，由 tool-selection 或獨立分類器自動選擇策略
- [ ] 自動選擇邏輯：
  - 查詢涉及 2+ 個明確實體比較 → Plan-and-Execute
  - 查詢含模糊/探索性意圖 → ReAct
  - 其他 → Baseline

**相關檔案**：`backend/src/services/query.ts`

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
| **5 個 RAG 工具**（search_routes / search_crags / general_knowledge / sql_query / hybrid） | ✅ |
| **Pipeline Admin UI**（步驟管理 + 分支配置 + 成本模擬） | ✅ |
| **並行分支基礎設施**（engine 支援 cloneBranchContext + fusion） | ✅（基礎建設，尚無配置分支） |
| **SQL 澄清流程**（模糊查詢 → 候選選項 → 用戶選擇） | ✅ |
| **個人攀登紀錄查詢**（6 個 SQL 模板，登入守衛） | ✅ |
