## Context

`backend/src/services/query.ts`（2452 行）是 AI 查詢的核心，包含完整的 RAG pipeline。目前所有階段（Tool Calling、HyDE、Multi-Query、BM25、Cross-encoder、MMR、Judge、Self-reflection 等）硬編碼在單一 `ask()` 方法中，形成一個巨大的 monolithic function。

現有基礎設施：
- **`ai_config` 資料表**（key-value）：已用於儲存 pipeline 參數（llm_model、max_results、mmr_lambda 等），前端 `/admin/ai/settings` 已有完整的 CRUD UI
- **`ai_tools` 資料表**：已存在但未完全利用，有 `enabled` 欄位
- **`PipelineConfig` 介面**：已定義 40+ 個設定項，透過 `loadPipelineConfig()` 批次讀取
- **前端 settings page**：使用 tab 分組的表單式設定介面，含模型設定、搜尋與排名、品質與 Token、對話與快取、Agentic 模式、防護設定等 tab

管理員目前只能調整「參數值」（如 mmr_lambda、judge_timeout_ms），但無法控制「是否執行某個階段」或「調整階段順序」。

## Goals / Non-Goals

**Goals:**
- 將 `ask()` 方法拆解為獨立的 pipeline step，每個 step 有統一介面
- 利用現有 `ai_config` 資料表儲存 pipeline step 的啟用/停用與排序設定（避免新增資料表）
- 在 `/admin/ai/settings` 新增「Pipeline Flow」tab，提供視覺化的 step 管理 UI
- Pipeline 引擎在運行時依設定動態組裝已啟用的 step，依序執行
- 保持所有現有功能不受影響（向後相容）
- Step 間依賴關係驗證：防止停用被其他 step 依賴的 step

**Non-Goals:**
- 不在此次變更中支援自定義 step（用戶自行撰寫 step 程式碼）
- 不改變現有 `ai_config` 的參數設定機制（各 step 的細部參數仍透過現有 tab 設定）
- 不重構 `search()` 方法（僅重構 `ask()` 主流程）
- 不支援 per-user 的 pipeline 設定（僅全域設定）

## Decisions

### Decision 1：使用現有 `ai_config` 而非新增資料表

**選擇**：在 `ai_config` 中用 `pipeline_steps` key 儲存 JSON 格式的 step 設定

**理由**：
- `ai_config` 已有完善的讀寫 API 與前端整合
- 避免新增 migration 與額外的 DB 查詢
- Pipeline 設定本質上是一個有序列表，用 JSON 陣列更自然

**替代方案**：
- 新增 `ai_pipeline_steps` 資料表（rejected：over-engineering，一個有序列表不需要關聯式表）
- 每個 step 用獨立的 `ai_config` key（rejected：無法表達順序，且 key 過多）

**格式**：
```json
// ai_config.key = 'pipeline_steps', ai_config.value =
[
  { "id": "semantic-cache", "enabled": true, "order": 0 },
  { "id": "tool-selection", "enabled": true, "order": 1 },
  { "id": "hyde", "enabled": true, "order": 2 },
  { "id": "multi-query", "enabled": true, "order": 3 },
  { "id": "filter-build", "enabled": true, "order": 4 },
  { "id": "embedding", "enabled": true, "order": 5 },
  { "id": "hybrid-search", "enabled": true, "order": 6 },
  { "id": "cross-encoder", "enabled": true, "order": 7 },
  { "id": "mmr", "enabled": true, "order": 8 },
  { "id": "popularity-rerank", "enabled": true, "order": 9 },
  { "id": "llm-generation", "enabled": true, "order": 10 },
  { "id": "judge", "enabled": true, "order": 11 },
  { "id": "self-reflection", "enabled": true, "order": 12 }
]
```

### Decision 2：Pipeline Step 統一介面與 PipelineContext

**選擇**：每個 step 實作 `PipelineStep` 介面，共用 `PipelineContext` 作為上下文傳遞物件

```typescript
interface PipelineStep {
  id: string;
  name: string;
  description: string;
  phase: 'pre-retrieval' | 'retrieval' | 'post-retrieval' | 'generation' | 'evaluation';
  defaultEnabled: boolean;
  defaultOrder: number;
  // 此 step 需要哪些 context 欄位才能執行（用於依賴驗證）
  requires: Array<keyof PipelineContext>;
  // 此 step 會產出哪些 context 欄位
  provides: Array<keyof PipelineContext>;
  execute(ctx: PipelineContext): Promise<PipelineContext>;
}

interface PipelineContext {
  // 輸入
  env: Env;
  request: AIAskRequest;
  userId?: string;
  pipelineConfig: PipelineConfig;
  prompts: Record<string, string>;
  gatewayOptions?: object;
  trace: Record<string, unknown>;
  tokenBreakdown: PipelineTokenBreakdown;
  queryService: QueryService;  // 供 step 使用工具方法（extractGradeFilter 等）

  // Pre-retrieval 階段產出
  queryType?: 'simple' | 'complex' | 'general-knowledge';
  effectiveLlmModel?: string;
  parsedQuery?: ParsedQuery;
  hydeDoc?: string;
  expandedQueries?: string[];
  vectorFilter?: Record<string, unknown>;
  queryVector?: number[];
  hydeVector?: number[] | null;
  expandedVectors?: number[][];

  // Retrieval 階段產出
  candidateMatches?: SearchResult[];
  documents?: Map<string, AIDocument>;
  retrievalScore?: number;

  // Post-retrieval 階段產出
  scoredCandidates?: SearchResult[];
  rerankedMatches?: Array<SearchResult & { finalScore: number }>;
  sources?: AISource[];
  context?: string;

  // Generation 階段產出
  rawAnswer?: string;
  answer?: string;
  suggestedQuestions?: string[];

  // Evaluation 階段產出
  groundedness?: number | null;
  quality?: number | null;

  // 流程控制
  earlyReturn?: AIAskResponse;  // 若設定此值，pipeline 立即返回（快取命中、GK 路徑等）
  streamingMode?: boolean;
  onToken?: (token: string) => Promise<void>;
  waitUntilCtx?: { waitUntil(promise: Promise<unknown>): void };

  // 個人化
  memorySummary?: string | null;
  ascentContext?: string | null;
  abilityLevel?: number | null;

  // 輔助資料（預載）
  preloadedCrags?: Array<{ id: string; name: string; region: string | null }>;
  preloadedAreas?: Array<{ id: string; name: string }>;
}
```

**替代方案**：
- Function composition（pipe 函式組合）：更函式風格，但 TypeScript 型別推導複雜，且難以在 UI 上表達
- Event-based（pub/sub）：過度解耦，增加除錯難度

### Decision 3：Phase 分組與順序約束

**選擇**：Step 只能在所屬 phase 內排序，phase 之間的執行順序固定

Phase 順序：`pre-retrieval` → `retrieval` → `post-retrieval` → `generation` → `evaluation`

**理由**：
- 防止管理員將 LLM 生成排在向量搜尋之前等不合理配置
- 降低 UI 與引擎的複雜度
- 每個 phase 內的 step 可自由排序（如調整 cross-encoder 和 mmr 的先後順序）

### Decision 4：檔案組織結構

**選擇**：在 `backend/src/services/pipeline/` 下建立模組化結構

```
backend/src/services/pipeline/
├── engine.ts           # PipelineEngine：載入設定、驗證依賴、依序執行
├── context.ts          # PipelineContext 介面與 factory
├── types.ts            # PipelineStep 介面與共用型別
├── registry.ts         # Step 註冊表（所有可用 step 的 metadata）
└── steps/
    ├── semantic-cache.ts
    ├── tool-selection.ts
    ├── hyde.ts
    ├── multi-query.ts
    ├── filter-build.ts
    ├── embedding.ts
    ├── hybrid-search.ts    # Vector + BM25 + RRF 合併 + Agentic 分支
    ├── cross-encoder.ts
    ├── mmr.ts
    ├── popularity-rerank.ts
    ├── llm-generation.ts   # 含 GK 通識路徑
    ├── self-reflection.ts
    └── judge.ts
```

**替代方案**：
- 所有 step 放在單一檔案（rejected：重蹈 query.ts 覆轍）
- 每個 step 一個目錄含 `index.ts` + `test.ts`（rejected：目前不需要 step 級別的測試隔離）

### Decision 5：前端 Pipeline Flow UI

**選擇**：在 `/admin/ai/settings` 新增「Pipeline Flow」tab，使用分群卡片式 UI

UI 結構：
- 按 phase 分組（5 個區段），每組內的 step 以卡片形式排列
- 每張卡片顯示 step 名稱、描述、啟用開關
- 每個 phase 內支援拖拉排序（使用 HTML5 drag and drop，避免引入新依賴）
- 底部有「儲存」按鈕，調用 `PUT /api/v1/admin/ai/pipeline-steps` 更新設定
- 有「重設為預設」按鈕，恢復出廠設定

**替代方案**：
- 全域拖拉排序（不分 phase）：rejected，太容易配錯
- 獨立頁面 `/admin/ai/pipeline`：rejected，與現有 settings 整合更自然

### Decision 6：`query.ts` 重構策略

**選擇**：漸進式重構 — 保留 `QueryService` 類別，將 `ask()` 改為呼叫 `PipelineEngine.run()`

```typescript
// query.ts（重構後）
async ask(request, userId, ctx, onToken, extraTrace) {
  const engine = new PipelineEngine(this.env);
  const context = await engine.run(request, userId, ctx, onToken, extraTrace);
  return context.earlyReturn ?? this.buildResponse(context);
}
```

- `QueryService` 的工具方法（`extractGradeFilter`、`getDocuments`、`buildUrl` 等）保留在 `query.ts` 中，供各 step 透過 `ctx.env` 或直接 import 使用
- `search()` 和 `askStream()` 方法不在此次重構範圍，保持原樣

**理由**：
- 保持 API 層不變（routes 仍呼叫 `queryService.ask()`）
- 降低一次性重構的風險
- 各 step 可漸進遷移，不需一次全部完成

### Decision 7：General Knowledge 與 Similar Route 特殊路徑

`ask()` 中有兩條「提早返回」路徑：
1. **General Knowledge**：Tool Selection 判定為 `general_knowledge` 後，直接呼叫 LLM 跳過 RAG
2. **Similar Route**：偵測到「推薦類似路線」意圖後，走不同的 filter 建構邏輯

**選擇**：分離關注點 — `tool-selection` 只負責分類，GK 生成由 `llm-generation` step 處理
- `tool-selection` step 執行後設定 `ctx.queryType`（`simple` / `complex` / `general-knowledge`）
- `llm-generation` step 根據 `queryType` 決定行為：
  - `general-knowledge`：直接呼叫 LLM 通識回答（不使用 RAG context），完成後設定 `ctx.earlyReturn`
  - 其他：使用 RAG context 生成回答
- 引擎在每個 step 執行後檢查 `ctx.earlyReturn`，若存在則停止後續 step
- Similar route 的 filter 邏輯整合到 `filter-build` step 中

**理由**：避免 `tool-selection` step 同時承擔分類 + LLM 生成 + 防護過濾 + 日誌記錄等多重責任

**GK early skip 規則**：`tool-selection` 設定 `queryType = 'general-knowledge'` 後，以下 step 需跳過執行。跳過邏輯不再由各 step 硬編碼，改由 engine 層級的 `skipWhen` 條件路由統一處理（見 Decision 10）：
- Pre-retrieval：`hyde`、`multi-query`、`filter-build`
- Retrieval：`embedding`、`hybrid-search`
- Post-retrieval：`cross-encoder`、`mmr`、`popularity-rerank`
- Evaluation：`judge`、`self-reflection`

這確保 GK 路徑只執行 `tool-selection` → `llm-generation`，不浪費 LLM/向量搜尋資源。

### Decision 8：並行執行策略

原始 `ask()` 大量使用 `Promise.all()` 並行以降低延遲（如 Tool Calling + HyDE 並行、embed(query) + embed(hydeDoc) 並行、三路搜尋並行）。純線性 step-by-step 執行會失去這些並行優化。

**選擇**：在 step 實作層級處理並行，而非在引擎層級

- **合併相關 step**：將原本並行的操作合併在同一個 step 內使用 `Promise.all()`
  - `embedding` step 內部並行 embed(query) + embed(hydeDoc) + embedBatch(expandedQueries)
  - `vector-search` + `bm25-search` 合併為 `hybrid-search` step，內部並行三路搜尋
- **引擎保持線性**：引擎逐一呼叫 step，不負責並行編排，降低引擎複雜度
- **結果**：step 數量從 15 減為 13（合併 vector-search + bm25-search → hybrid-search，移除獨立的 rrf-merge 併入 hybrid-search）

**替代方案**：
- 引擎支援 `parallel` 群組宣告（此次暫不採用：固定並行關係在 step 內部處理更簡單，可配置的並行分支由 Decision 12 Branching + Fusion 另行處理）
- 完全不處理（rejected：延遲增加 300-500ms 不可接受）

**更新後的 Step 列表（13 個）**：

| Step ID | Phase | 預設啟用 |
|---------|-------|---------|
| `semantic-cache` | pre-retrieval | ✅ |
| `tool-selection` | pre-retrieval | ✅ |
| `hyde` | pre-retrieval | ✅ |
| `multi-query` | pre-retrieval | ✅ |
| `filter-build` | pre-retrieval | ✅ |
| `embedding` | retrieval | ✅ |
| `hybrid-search` | retrieval | ✅ |
| `cross-encoder` | post-retrieval | ✅ |
| `mmr` | post-retrieval | ✅ |
| `popularity-rerank` | post-retrieval | ✅ |
| `llm-generation` | generation | ✅ |
| `judge` | evaluation | ✅ |
| `self-reflection` | evaluation | ✅ |

### Decision 9：KV 快取與 Agentic 模式的定位

**KV 快取**

KV 快取（非語義快取）與 post-pipeline 後處理在 pipeline 之外由 engine 層級處理：
- **pipeline 執行前**：engine 檢查 KV 快取，命中則直接返回（記錄 cache hit 日誌），不進入 pipeline
- **pipeline 執行後**：engine 負責以下後處理（依序）：
  1. `logQuery()`：將查詢結果與品質指標寫入 `ai_query_logs`
  2. KV 快取寫入：`CACHE.put(cacheKey, response)`
  3. `flagResponse()`：低 groundedness 時寫入 `ai_flagged_responses`
  4. 語義快取寫入（`waitUntil`）：匿名+無歷史查詢時異步存入 Vectorize
  5. 串流模式異步 Judge（`waitUntil`）：token 已推送無法替換，Judge 異步執行並更新日誌分數
  6. Memory extraction（`waitUntil`）：已登入用戶的記憶提取

理由：這些後處理是所有 pipeline 路徑共用的橫切邏輯，不屬於特定 phase 或 step。

**Agentic 模式**

原始程式碼中 `rag_strategy === 'agentic'` 時走 `agenticRetrieve()`，這是一條完全不同的搜尋路徑（多輪迴圈搜尋 + LLM 判斷是否需要補充搜尋）。

**選擇**：Agentic 模式保持為 `hybrid-search` step 的內部分支

- `hybrid-search` step 內部根據 `pipelineConfig.rag_strategy` 決定走 baseline 或 agentic 路徑
- Agentic 路徑不使用 HyDE 和 Multi-Query 的結果（與現有行為一致），直接自行管理搜尋迴圈
- 若管理員停用 `hybrid-search` step，agentic 模式也一併停用（合理，因為沒有搜尋就沒有 agentic）

**替代方案**：
- 將 agentic 建模為獨立 step（rejected：agentic 本質上是 retrieval 的替代策略，不是額外步驟）

### Decision 10：Conditional Routing — 泛化的條件跳過機制

**現狀問題**：10 個 step 各自在 `execute()` 開頭寫 `if (ctx.queryType === 'general-knowledge') return ctx;`，邏輯分散且不可配置。新增跳過條件時需逐一修改每個 step。

**選擇**：在 engine 層級加入 `skipWhen` 條件路由規則，取代各 step 的 hardcoded 檢查

```typescript
// 新增型別（types.ts）
interface SkipCondition {
  field: keyof PipelineContext;
  operator: 'eq' | 'neq' | 'in';
  value: unknown;
}

// PipelineStep 介面擴充
interface PipelineStep {
  // ...既有欄位
  skipWhen?: SkipCondition[];  // 可選，engine 執行前評估
  execute(ctx: PipelineContext): Promise<PipelineContext>;
}
```

**Engine 評估邏輯**：
- 在呼叫 `step.execute(ctx)` 前，engine 遍歷 `step.skipWhen` 陣列
- 任一條件成立 → 跳過此 step（記錄 `trace: { skipped: true, reason: 'skipWhen: queryType eq general-knowledge' }`）
- 所有條件不成立 → 正常執行
- `skipWhen` 為空或未定義 → 正常執行

**條件運算子**：
- `eq`：`ctx[field] === value`
- `neq`：`ctx[field] !== value`
- `in`：`Array.isArray(value) && value.includes(ctx[field])`

**各 step 的 skipWhen 預設值**（registry.ts）：

| Step ID | skipWhen |
|---------|----------|
| `semantic-cache` | — |
| `tool-selection` | — |
| `hyde` | `[{ field: 'queryType', operator: 'eq', value: 'general-knowledge' }]` |
| `multi-query` | `[{ field: 'queryType', operator: 'eq', value: 'general-knowledge' }]` |
| `filter-build` | `[{ field: 'queryType', operator: 'eq', value: 'general-knowledge' }]` |
| `embedding` | `[{ field: 'queryType', operator: 'eq', value: 'general-knowledge' }]` |
| `hybrid-search` | `[{ field: 'queryType', operator: 'eq', value: 'general-knowledge' }]` |
| `cross-encoder` | `[{ field: 'queryType', operator: 'eq', value: 'general-knowledge' }]` |
| `mmr` | `[{ field: 'queryType', operator: 'eq', value: 'general-knowledge' }]` |
| `popularity-rerank` | `[{ field: 'queryType', operator: 'eq', value: 'general-knowledge' }]` |
| `llm-generation` | — |
| `judge` | `[{ field: 'queryType', operator: 'eq', value: 'general-knowledge' }]` |
| `self-reflection` | `[{ field: 'queryType', operator: 'eq', value: 'general-knowledge' }]` |

**保留 step 內部的業務邏輯跳過**：
- `skipWhen` 處理「路由層級」的跳過（如 GK 路徑不走 RAG）
- Step 內部仍可有業務邏輯跳過（如 cross-encoder 候選數 ≤ 1 時跳過、hyde 在 simple query 時跳過）
- 兩者分工明確：skipWhen = 路由決策，step 內部 = 業務判斷

**替代方案**：
- 保持各 step 自行 hardcode 檢查（rejected：邏輯分散、不可配置、新增條件需改 10+ 個檔案）
- 將 skipWhen 存入 ai_config 讓管理員配置（rejected：over-engineering，目前條件固定且與實作緊耦合）

### Decision 11：Looping Pattern — 評估驅動的迭代重試

**現狀問題**：`self-reflection` step 偵測到低品質回答時，只能在相同 context 下重新生成（re-generate），無法回退到 retrieval 階段用不同策略重新檢索更好的文件。

**選擇**：在 engine 加入可配置的迴圈機制

```typescript
// PipelineContext 新增欄位
interface PipelineContext {
  // ...既有欄位

  // Looping 控制
  loopCount: number;  // 當前迭代次數（初始化為 0）
  loopBack?: {
    targetPhase: PipelinePhase;  // 回跳目標 phase
    reason: string;              // 回跳原因（記入 trace）
  };
}
```

**Engine 迴圈邏輯**：
1. 每個 step 執行完畢後，engine 檢查 `ctx.loopBack`
2. 若 `loopBack` 已設定：
   a. 檢查 `ctx.loopCount < max_pipeline_loops`（從 `ai_config` 讀取，預設 1）
   b. 若未超限：`ctx.loopCount++`，清除 `ctx.loopBack`，跳回 `targetPhase` 重新執行該 phase 及後續所有 phase
   c. 若已超限：記錄 trace warning（`loop_limit_reached`），忽略 loopBack，繼續正常流程
3. 若 `loopBack` 未設定：繼續下一個 step

**self-reflection step 升級**：
- 現有行為（保留）：`quality` 低於 `judge_regen_quality_max` 時，在同 context 下重試 LLM 生成
- 新增行為：`groundedness < 0.5` 且 `loopCount === 0` 時，設定 `loopBack: { targetPhase: 'retrieval', reason: 'low-groundedness' }`，觸發重新檢索
- 回跳到 retrieval 時，engine 會清除 retrieval 階段的舊產出（`candidateMatches`、`documents` 等），讓 retrieval step 重新執行
- 第二次迭代時 self-reflection 不再觸發 loopBack（因 `loopCount >= max_pipeline_loops`）

**安全限制**：
- `max_pipeline_loops`：新增 `ai_config` key，預設值 1（即最多回跳 1 次，pipeline 最多執行 2 輪）
- 設定為 0 則完全停用 looping
- trace 記錄每次 loop 的 reason 與前後 groundedness 對比

**替代方案**：
- 僅在 self-reflection 內部實作 loop（rejected：looping 是 engine 層級的流程控制，不應由單一 step 管理 phase 跳轉）
- 無限制 loop（rejected：必須有安全上限防止無窮迴圈）

### Decision 12：Branching + Fusion — 並行分支與結果融合

**現狀**：`hybrid-search` step 內部已實作 Vector + BM25 並行搜尋 + RRF 合併，但這屬於 step 內部行為，engine 層級無法表達「多個 step 並行執行後融合」的模式。

**選擇**：在 engine 層級支援分支與融合

```typescript
// 新增型別（types.ts）
interface BranchConfig {
  // 分支組 ID（用於 trace 與配置識別）
  id: string;
  // 並行分支：每個內部陣列是一條分支的 step 序列
  branches: StepId[][];
  // 融合 step：負責合併所有分支的結果
  fusionStep: StepId;
}

// PipelineContext 新增欄位
interface PipelineContext {
  // ...既有欄位

  // Branching 控制
  branchResults?: Map<string, Partial<PipelineContext>>;  // 各分支的產出快照
}
```

**Engine 分支執行邏輯**：
1. Engine 在執行 phase 內的 step 時，檢查是否有 `BranchConfig` 涵蓋當前 step
2. 若當前 step 屬於某 branch group：
   a. 收集該 branch group 的所有 branches
   b. 為每條分支建立 context 淺拷貝（共享 `env`、`pipelineConfig` 等不可變欄位，獨立 retrieval/post-retrieval 產出欄位）
   c. `Promise.all()` 並行執行各分支的 step 序列
   d. 將各分支產出存入 `ctx.branchResults`（key = branch index）
   e. 執行 `fusionStep`，由其從 `branchResults` 合併結果寫回主 context
3. 已被 branch group 涵蓋的 step 不再在主流程中重複執行

**BranchConfig 儲存**：
- 與 `pipeline_steps` 一同存於 `ai_config`，key 為 `pipeline_branches`
- 預設值：空陣列（無分支，所有 step 線性執行，與現有行為一致）
- 管理員可透過 API 配置分支組

**預設 BranchConfig**（空，保持現有線性行為）：
```json
// ai_config.key = 'pipeline_branches', ai_config.value =
[]
```

**未來應用場景範例**（非此次實作，僅供設計參考）：
- 將 `hybrid-search` 拆為 `vector-search` + `bm25-search` 兩個獨立 step，配置為並行分支，用 `rrf-fusion` step 合併
- Multi-strategy retrieval：同時執行「精確語義搜尋」與「寬鬆關鍵字搜尋」分支

**替代方案**：
- 僅在 step 內部處理並行（Decision 8 現狀）（rejected：無法表達跨 step 的並行模式，限制了未來擴展性）
- DAG-based engine（rejected：過度複雜，phase-based 線性 + 分支已足夠表達所有當前與可預見的需求）

## Risks / Trade-offs

- **[風險] Step 拆解可能遺漏隱含的狀態依賴** → 透過 `requires`/`provides` 欄位明確宣告，引擎啟動時驗證所有已啟用 step 的依賴是否被滿足
- **[風險] 管理員停用關鍵 step 導致系統異常（如停用 embedding 但保留 hybrid-search）** → 引擎驗證依賴鏈，UI 端顯示警告（哪些 step 因依賴被連帶停用）
- **[風險] PipelineContext 物件過大影響記憶體** → Context 使用 mutable 物件（非 immutable clone），各 step 直接修改同一物件，不產生額外副本
- **[風險] 重構核心邏輯的回歸風險** → 先確保現有行為完全移植至 step 實作，可透過 pipeline trace 對比重構前後的執行結果
- **[風險] 並行執行效能退化** → 將原本 `Promise.all()` 並行的操作合併在同一 step 內部處理（Decision 8），引擎層級保持線性，不增加延遲。合併後 step 數量從 15 減為 13
- **[trade-off] 使用 `ai_config` JSON 而非獨立資料表** → 失去 SQL 層級的 step 查詢能力，但 step 數量固定（13 個），不需要複雜查詢
- **[trade-off] Phase 固定順序** → 限制了極端彈性（如在 generation 後插入額外 retrieval），但大幅降低配置錯誤的風險
- **[trade-off] Agentic 模式作為 hybrid-search 的內部分支** → 無法獨立停用 agentic（只能透過 `rag_strategy` 設定切換），但避免增加 step 複雜度
- **[風險] Looping 無窮迴圈** → `max_pipeline_loops` 預設 1，engine 強制檢查上限，超限時記錄 warning 並繼續正常流程
- **[風險] Branching context 淺拷貝一致性** → 分支間共享不可變欄位（env、pipelineConfig），獨立可變欄位（retrieval 產出）；fusionStep 負責合併，需確保無漏欄位
- **[trade-off] skipWhen 條件固定於 registry 而非可配置** → 目前跳過條件與實作緊耦合（如 GK 跳過 RAG），管理員不需要配置，但未來若需要可擴展至 ai_config
