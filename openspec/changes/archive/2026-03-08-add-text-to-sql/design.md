## Context

AI 問答系統已透過 `modular-rag` 變更重構為模組化 pipeline 架構：

- **`PipelineEngine`**（`backend/src/services/pipeline/engine.ts`）：負責載入設定、依序執行已啟用的 pipeline step，支援 skipWhen 條件路由、earlyReturn 提前終止、loopBack 迴圈控制
- **`PipelineStep` 統一介面**（`types.ts`）：每個 step 有 `id: StepId`、`phase`、`skipWhen`、`requires`、`provides`、`execute(ctx)` 等標準欄位
- **`PipelineContext`**（`types.ts`）：所有 step 共用的上下文物件，`queryType` 目前為 `'simple' | 'complex' | 'general-knowledge'`
- **`ParsedQuery`**（`backend/src/types.ts`）：Tool Calling LLM 的結構化輸出，`tool` 目前為 `'search_routes' | 'search_crags' | 'general_knowledge'`
- **`AIAskResponse`**（`backend/src/types.ts`）：API 回應介面，含 `answer`、`sources`、`query_id`、`suggested_questions`
- **`tool-selection` step**（`steps/tool-selection.ts`）：解析查詢意圖，透過 `parseQueryWithLLM()` 呼叫 LLM，輸出 `ctx.queryType` 和 `ctx.parsedQuery`
- **`llm-generation` step**（`steps/llm-generation.ts`）：含 GK 通識路徑（直接 LLM + earlyReturn）和 RAG 路徑（使用 `ctx.context` 生成回答）
- **Conditional Routing**：engine 層級的 `skipWhen` 條件路由。目前 10 個 step 共用 `GK_SKIP = [{ field: 'queryType', operator: 'eq', value: 'general-knowledge' }]` 常數
- **Registry**（`registry.ts`）：13 個 step 的 metadata 陣列，`getDefaultStepConfigs()` 生成預設設定
- **Engine STEP_MAP**（`engine.ts`）：`Record<StepId, PipelineStep>` 映射表，目前 13 個 entry

現有 `extractLocationFilter`、`extractGradeFilter`、`extractTypeFilter` 三個 NLP 方法（`QueryService` 實例方法）已能從 query 抽出岩場/難度/類型參數，但目前只用來縮小向量搜尋範圍，並未直接執行 SQL。

---

## Goals / Non-Goals

**Goals:**
- 對計算型、統計型、篩選型問題（「有幾條」「列出」「最多」「我完攀了幾條」）使用 D1 直接查詢，取代向量搜尋猜測
- 新增 `text-to-sql` pipeline step，融入現有 modular RAG pipeline 架構
- 對模糊問題主動回問用戶選擇意圖（查詢清單 vs. 個人化推薦）
- 保留現有 RAG pipeline step 完整不變，SQL 作為新的平行路徑（透過 skipWhen 條件路由實現）
- 安全：只允許 SELECT，白名單資料表，所有參數化查詢

**Non-Goals:**
- 允許 LLM 自由生成任意 SQL（安全風險過高，使用模板替代）
- 取代 RAG（語義問題繼續走 RAG）
- 暴露 `users` 或其他敏感資料表
- 跨多個查詢的多輪 SQL 對話

---

## Decisions

### D1：SQL 路由整合點 — 擴充 `tool-selection` pipeline step

**決策**：擴充 `tool-selection` step 的 `TOOL_SELECTION_PROMPT`，新增 `search_sql` 和 `hybrid` 兩個 tool 選項，以及 `sql`、`hybrid`、`clarification-needed` 三種 `query_type`。`tool-selection` step 設定 `ctx.queryType` 後，後續 step 透過 engine 的 `skipWhen` 條件路由自動跳過不相關的 RAG step。

**型別異動**：
- `ParsedQuery`（`backend/src/types.ts`）：`tool` 新增 `'search_sql' | 'hybrid'`；`query_type` 新增 `'sql' | 'hybrid' | 'clarification-needed'`；`params` 新增 `route_name?: string`；新增 `template?: string` 和 `clarification_type?: 'intent' | 'missing-crag'`
- `tool-selection` step 的 `provides` 擴充：加入 `'sqlTemplate'`、`'sqlParams'`、`'clarificationType'`
- `tool-selection.ts` 的 `execute()` 方法（line 88-95 附近）：新增對 `search_sql` 和 `hybrid` tool 的處理，從 `parsedQuery` 解析並設定 `ctx.sqlTemplate`、`ctx.sqlParams`、`ctx.clarificationType`

**理由**：
- `tool-selection` step 本已是 pipeline 的分類入口，擴充比新增 pre-filter 更一致
- 只需改 prompt 和 step 程式碼，不需額外 LLM 呼叫
- 與 modular-rag 的 Conditional Routing 設計完全契合

**替代方案**：在 `tool-selection` 前加規則式快篩（`/有幾條|列出/` → 直接 sql）→ 捨棄，因 LLM 分類更能理解語義，而且 `tool-selection` 原本就做這件事。

---

### D2：`text-to-sql` 作為新的 pipeline step

**決策**：新增 `text-to-sql` pipeline step，phase 為 `pre-retrieval`，排序在 `tool-selection` 之後（defaultOrder 2）。此 step 根據 `ctx.queryType` 決定行為：

- `sql`：呼叫 `TextToSqlService.execute()`，結果交輕量 LLM 組裝自然語言，設定 `ctx.earlyReturn`
- `hybrid`：呼叫 `TextToSqlService.queryCandidates()` 取候選集，存入 `ctx.sqlCandidates` 與 `ctx.sqlContext`，供 `llm-generation` step 使用
- `clarification-needed`：根據 `ctx.clarificationType` 組裝回應，設定 `ctx.earlyReturn`
- 其他 `queryType`（simple/complex/general-knowledge）：由 `skipWhen` 跳過，不執行

**Step metadata**：
```typescript
{
  id: 'text-to-sql',
  name: 'Text-to-SQL 直查',
  description: '對計算/統計/篩選問題執行 SQL 模板查詢，或撈取 Hybrid 候選集',
  phase: 'pre-retrieval',
  defaultEnabled: true,
  defaultOrder: 2,
  requires: ['queryType', 'parsedQuery'],
  provides: ['earlyReturn', 'sqlCandidates', 'sqlContext'],
  skipWhen: [
    { field: 'queryType', operator: 'in', value: ['simple', 'complex', 'general-knowledge'] }
  ]
}
```

**理由**：
- 完全符合 modular-rag 的 pipeline step 設計模式
- 管理員可在 Pipeline Flow UI 中獨立啟用/停用 Text-to-SQL 功能
- `earlyReturn` 機制讓 SQL 和 clarification 路徑在 step 完成後立即返回，不浪費後續 step 的計算資源
- Hybrid 路徑不設 `earlyReturn`，讓 pipeline 繼續執行到 `llm-generation` step

**替代方案**：在 `PipelineEngine` 層級（如 KV 快取）處理 SQL 路由 → 捨棄，SQL 是業務邏輯而非橫切關注點，應作為 step 實作。

---

### D3：SQL 實作方式 — Template-based，不讓 LLM 生成 SQL

**決策**：LLM 只負責分類（`sql` / `hybrid`）和抽出結構化參數（岩場名、難度、類型、地區），實際 SQL 由 **預定義模板** 填入參數後執行。`TextToSqlService` 為獨立 class，不與 pipeline step 耦合。

**理由**：
- 安全：LLM 生成 SQL 存在 prompt injection 和語法錯誤風險
- 可預測：模板覆蓋明確的 80% 使用場景，邊界清晰
- 復用現有 `extractLocationFilter`、`extractGradeFilter`、`extractTypeFilter` 做二次確認

**支援的 SQL 模板類型**：

**路線查詢**

| 模板 ID | 問句範例 | 說明 |
|---------|---------|------|
| `COUNT_ROUTES_AT_CRAG` | 「龍洞有幾條路線？」 | 計算指定岩場的路線總數 |
| `LIST_ROUTES_BY_CRITERIA` | 「龍洞有哪些 5.11 以上的運攀路線？」 | 多條件篩選路線清單（難度 + 類型，**必須有岩場**，否則觸發 `clarification-needed` 回問「請問是哪個岩場？」） |
| `LIST_ROUTES_AT_GRADE` | 「龍洞有哪些 5.11b 的路線？」 | 精確等級 + 岩場篩選，回傳清單 |
| `ROUTE_INFO_LOOKUP` | 「一陽指幾級？」「鬼頭刀有幾顆 bolt？」 | 查詢單一路線精確欄位（grade、bolt_count、height 等） |
| `CRAG_INFO_LOOKUP` | 「龍洞有幾個區域？」「墾丁岩場類型？」 | 查詢岩場基本資訊（region、type、area 數量） |
| `RANK_CRAGS_BY_ROUTES` | 「哪個岩場路線最多？」 | 各岩場路線數量排名 |
| `GRADE_DISTRIBUTION` | 「龍洞各難度有幾條路線？」 | 路線難度分佈統計，按 grade GROUP BY |
| `ROUTE_TYPE_DISTRIBUTION` | 「龍洞有幾條運攀、幾條傳攀？」 | 路線攀登類型分佈統計（用戶輸入中文 → 對應 DB enum: sport/trad/boulder/mixed） |
| `ROUTE_FIRST_ASCENT` | 「一陽指的 FA 是誰？」「這條路線首攀是？」 | 查詢 `first_ascent` / `first_ascent_date` 欄位（用戶輸入 FA/fa/首攀皆可觸發） |

**影片查詢**

| 模板 ID | 問句範例 | 說明 |
|---------|---------|------|
| `LIST_VIDEOS_FOR_ROUTE` | 「鬼頭刀有哪些影片？」「一陽指有影片嗎？」 | routes ↔ route_videos ↔ videos，回傳標題與 YouTube 連結 |
| `ROUTES_WITH_VIDEOS` | 「龍洞哪些路線有影片？」 | 篩選指定岩場中有影片的路線清單 |

**個人完攀（需登入）**

`user_route_ascents.ascent_type` 使用英文原文：`flash`、`onsight`（縮寫 `os`）、`redpoint`（縮寫 `rp`）、`attempt`、`toprope`、`lead`、`seconding`、`repeat`。LLM 需將用戶的中文/縮寫輸入對應至正確的 enum 值。

| 模板 ID | 問句範例 | 說明 |
|---------|---------|------|
| `MY_ASCENT_COUNT` | 「我完攀了幾條路線？」 | 查詢當前用戶完攀總數 |
| `MY_ASCENT_BY_TYPE` | 「我有幾條 rp？」「我 os 過幾條？」 | 按 ascent_type 篩選計數（中文/縮寫 → enum 對應） |
| `MY_ASCENT_LIST` | 「我爬過哪些路線？」 | 查詢當前用戶完攀清單（JOIN routes 帶出名稱與難度） |
| `MY_ASCENT_AT_CRAG` | 「我在龍洞爬過哪些路線？」 | 岩場 + 用戶 JOIN |
| `MY_ASCENT_BY_DATE` | 「我今年爬了幾條？」「我上個月的紀錄」 | 按 ascent_date 範圍篩選 |
| `MY_HIGHEST_GRADE` | 「我最高完攀幾級？」 | 查詢用戶完攀的最高難度 |
| `MY_RATED_ROUTES` | 「我評了 5 星的路線有哪些？」 | 按 rating 欄位篩選 |

`LIST_VIDEOS_FOR_ROUTE` / `ROUTES_WITH_VIDEOS` 使用現有 `route_videos` 關聯表，RAG 只能回傳「影片數量：3」文字，SQL 才能提供完整標題與 YouTube 連結：

```sql
-- LIST_VIDEOS_FOR_ROUTE
SELECT v.title, v.youtube_id, v.thumbnail_url
FROM videos v
JOIN route_videos rv ON v.id = rv.video_id
JOIN routes r ON rv.route_id = r.id
WHERE r.name LIKE ?
ORDER BY rv.sort_order ASC
```

**替代方案**：LLM 直接生成 SQL → 捨棄，安全考量。

---

### D4：Clarification Response 格式 — 文字問題 + 結構化選項

**決策**：`query_type = 'clarification-needed'` 時，`text-to-sql` step 設定 `ctx.earlyReturn`，回傳特殊回應，`answer` 為問句文字，額外帶 `clarification_options`。

觸發情境分兩類：

1. **意圖模糊**（「找路線」）→ `clarification_options: ['A. 查詢符合條件的路線清單', 'B. 根據我的程度個人化推薦']`
2. **缺少必要參數**（「列出 5.11 以上的運攀路線」沒指定岩場）→ `clarification_options: []`，`answer` 直接問「請問是哪個岩場的路線？」

**理由**：
- 對前端 ChatWidget 改動最小（選項可顯示為快捷按鈕，也可讓用戶直接文字輸入）
- 不需後端新增端點

**回應格式擴充**（`backend/src/types.ts` 的 `AIAskResponse`）：
```typescript
interface AIAskResponse {
  answer: string;
  sources: AISource[];
  query_id: string;
  suggested_questions: string[];
  // 新增欄位
  clarification_needed?: boolean;
  clarification_options?: string[];
  query_route?: 'rag' | 'sql' | 'hybrid' | 'sql-fallback' | 'clarification';
}
```

---

### D5：路線名稱驗證 — 先查 DB 再執行模板，找不到則 fallback RAG

**問題**：路線名稱（「一陽指」「鬼頭刀」「冰攀具」）千奇百怪，LLM 無法事先知道哪些存在 DB 裡。現有 `TOOL_SELECTION_PROMPT` 只預載 crags/areas，路線筆數太多無法全部塞入 context。

**決策**：`ROUTE_INFO_LOOKUP` 等需要路線名稱的模板，`text-to-sql` step 執行前先做**名稱驗證查詢**，用回傳的 `route.id` 執行正式模板。找不到則 fallback RAG。

**完整流程**：

```
用戶：「一陽指幾級？」
    ↓
[tool-selection step] Tool Calling LLM 輸出
  ctx.queryType = 'sql'
  ctx.sqlTemplate = 'ROUTE_INFO_LOOKUP'
  ctx.sqlParams = { route_name: '一陽指' }
    ↓
[text-to-sql step] 名稱驗證查詢（TextToSqlService）
  SELECT id, name, crag_id FROM routes WHERE name LIKE '%一陽指%' LIMIT 5
    ↓
  ├── 找到 1 筆 → 取 route.id，執行正式模板
  ├── 找到多筆 → 取第一筆（或若有 crag 參數則過濾）
  └── 找不到 → fallback RAG（清除 earlyReturn，讓 pipeline 繼續走 RAG 路徑）
    ↓
[text-to-sql step] 正式模板執行（用 id 不用 name，避免 LIKE 重複）
  SELECT grade, bolt_count, height, route_type, description
  FROM routes WHERE id = ?
    ↓
[text-to-sql step] 輕量 LLM 組裝自然語言回答 → 設定 ctx.earlyReturn
  「一陽指難度為 5.11a，共 12 顆 bolt，高度約 25 公尺。」
```

**SQL fallback RAG 機制**：當 `text-to-sql` step 遇到以下情況時，不設定 `earlyReturn`，而是將 `ctx.queryType` 回復為 `complex`，讓 pipeline 繼續執行後續 RAG step：
- 路線名稱驗證失敗（0 筆結果）
- 無對應 SQL 模板
- `TextToSqlService` 拋出例外（D1 連線失敗、SQL 執行超時等）
- SQL 查詢回傳 0 筆結果

fallback 時 step 設定 `ctx.trace.sql_fallback = true`，供日誌分析。

**為什麼用 id 不用 name 執行正式模板**：
- 驗證階段 LIKE 查找，正式查詢用精確 id，避免「刀」匹配到「鬼頭刀」「冰攀具（刀）」等多條路線
- crag 白名單限定在驗證階段同步確認（`routes.crag_id` 存在即為公開資料）

**找到多筆時的處理**：若用戶問題帶有岩場（「龍洞的一陽指幾級？」），以 `extractLocationFilter` 先取 crag_id 縮小範圍；若仍有多筆（同名路線），回傳第一筆並在回答中標注岩場名稱（「龍洞的一陽指…」）。

**理由**：
- 不需要 LLM 知道全部路線名稱（路線太多無法預載）
- Fuzzy LIKE 可處理使用者輸入的小差異（「一陽指 5.11」「一陽指（龍洞）」）
- fallback RAG 確保找不到時仍能給出語義相關答案，不返回錯誤

---

### D6：Hybrid Pipeline 執行順序 — SQL 候選集 + `llm-generation` step 推薦

**決策**：Hybrid = `text-to-sql` step 取 ≤20 條候選存入 `ctx.sqlCandidates` → 後續 RAG step 被 skipWhen 跳過 → `llm-generation` step 偵測 `queryType = 'hybrid'` 時使用 `ctx.sqlContext` 作為 context 生成推薦。

**理由**：
- SQL 保證範圍精確（只推薦真實存在且符合條件的路線）
- `llm-generation` step 已有依 `queryType` 分支的設計（GK 路徑），hybrid 只需新增一條分支
- 不需修改 `SYSTEM_PROMPT`（候選集格式與現有 RAG context 相容）

---

### D7：PipelineContext 與 skipWhen 更新

**PipelineContext 新增欄位**：
```typescript
interface PipelineContext {
  // ...既有欄位

  // queryType 擴充
  queryType?: 'simple' | 'complex' | 'general-knowledge' | 'sql' | 'hybrid' | 'clarification-needed';

  // Text-to-SQL 相關（tool-selection step 產出）
  sqlTemplate?: string;           // SQL 模板 ID
  sqlParams?: Record<string, unknown>;  // 模板參數
  clarificationType?: 'intent' | 'missing-crag';  // 澄清類型

  // Text-to-SQL step 產出（hybrid 用）
  sqlCandidates?: Array<Record<string, unknown>>;  // SQL 候選集
  sqlContext?: string;            // 格式化後的候選集 context 文字
}
```

**更新後的 skipWhen 條件（含 Text-to-SQL）**：

| Step ID | skipWhen |
|---------|----------|
| `semantic-cache` | — |
| `tool-selection` | — |
| `text-to-sql` | `[{ field: 'queryType', operator: 'in', value: ['simple', 'complex', 'general-knowledge'] }]` |
| `hyde` | `[{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed'] }]` |
| `multi-query` | `[{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed'] }]` |
| `filter-build` | `[{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed'] }]` |
| `embedding` | `[{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed'] }]` |
| `hybrid-search` | `[{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed'] }]` |
| `cross-encoder` | `[{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed'] }]` |
| `mmr` | `[{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed'] }]` |
| `popularity-rerank` | `[{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed'] }]` |
| `llm-generation` | — |
| `judge` | `[{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'clarification-needed'] }]` |
| `self-reflection` | `[{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'clarification-needed'] }]` |

**備註**：
- `sql` 和 `clarification-needed` 路徑：`text-to-sql` step 設定 `earlyReturn` 後 pipeline 立即停止，skipWhen 條件實際上不會被評估（defence in depth）
- `hybrid` 路徑：skipWhen 跳過 pre-retrieval（hyde/multi-query/filter-build）→ retrieval → post-retrieval，但 `llm-generation` 正常執行（使用 SQL 候選集作為 context），`judge` 和 `self-reflection` 也正常執行（評估回答品質）
- 原本 modular-rag 的 `GK_SKIP` 常數（`registry.ts:3`，`[{ operator: 'eq', value: 'general-knowledge' }]`）需拆分為兩個常數：
  - `NON_RAG_SKIP`：`[{ operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed'] }]`（用於 hyde 至 popularity-rerank 共 8 個 step）
  - `GK_SQL_SKIP`：`[{ operator: 'in', value: ['general-knowledge', 'sql', 'clarification-needed'] }]`（用於 judge 和 self-reflection，不含 hybrid 因需評估品質）

---

### D8：更新後的 Pipeline Step 列表（14 個）

| Step ID | Phase | 預設順序 | 預設啟用 |
|---------|-------|---------|---------|
| `semantic-cache` | pre-retrieval | 0 | ✅ |
| `tool-selection` | pre-retrieval | 1 | ✅ |
| `text-to-sql` | pre-retrieval | 2 | ✅ |
| `hyde` | pre-retrieval | 3 | ✅ |
| `multi-query` | pre-retrieval | 4 | ✅ |
| `filter-build` | pre-retrieval | 5 | ✅ |
| `embedding` | retrieval | 6 | ✅ |
| `hybrid-search` | retrieval | 7 | ✅ |
| `cross-encoder` | post-retrieval | 8 | ✅ |
| `mmr` | post-retrieval | 9 | ✅ |
| `popularity-rerank` | post-retrieval | 10 | ✅ |
| `llm-generation` | generation | 11 | ✅ |
| `judge` | evaluation | 12 | ✅ |
| `self-reflection` | evaluation | 13 | ✅ |

---

## Risks / Trade-offs

**[Risk 1] 模板覆蓋不足** → Mitigation：`text-to-sql` step 找不到對應模板時，fallback 到 RAG pipeline（將 `queryType` 回復為 `complex`），並在 trace 記錄 `sql_fallback: true`。

**[Risk 2] SQL 模板參數抽取失誤**（如 LLM 輸出的 `crag_name` 對不上 DB 資料）→ Mitigation：抽出參數後用 DB LIKE 模糊比對，並以現有 `extractLocationFilter` 做 crag_id 解析，確保 SQL 使用 id 而非名稱。

**[Risk 3] `clarification-needed` 回問造成對話卡住** → Mitigation：若用戶下一輪問的問題仍然模糊，以 `complex` 類型（RAG）處理，不重複問。

**[Risk 4] Hybrid SQL 候選集過大或過小** → Mitigation：LIMIT 20；若 SQL 查無結果，fallback 到純 RAG。

**[Risk 5] `text-to-sql` step 被停用時的行為** → Mitigation：`tool-selection` step 仍可能輸出 `sql`/`hybrid`/`clarification-needed`，但因 `text-to-sql` step 被跳過，pipeline 會直接執行後續 step。由於 RAG step 的 skipWhen 條件含 `sql`/`hybrid`/`clarification-needed`，這些 RAG step 也會被跳過，導致 `llm-generation` 沒有 context。**解法**：在 `engine.ts` 的停用 step 記錄邏輯後加入 fallback——若 `text-to-sql` 被停用，pipeline 執行前檢查 `ctx.queryType`，為 `sql`/`hybrid`/`clarification-needed` 時自動回復為 `complex`，確保後續 RAG step 不被 skipWhen 跳過。此 fallback 在 engine 層級實作（非 step 層級），因為停用的 step 不會執行 `execute()`。

---

## Migration Plan

1. `modular-rag` 變更先完成並部署
2. PipelineContext 新增 SQL 相關欄位（`sqlTemplate`、`sqlParams`、`clarificationType`、`sqlCandidates`、`sqlContext`）
3. 擴充 `tool-selection` step 的 TOOL_SELECTION_PROMPT（新增 tool 選項和 query_type）
4. 新增 `TextToSqlService`（獨立 class）
5. 新增 `text-to-sql` pipeline step（`backend/src/services/pipeline/steps/text-to-sql.ts`）
6. 更新 registry.ts：新增 `text-to-sql` step metadata，更新 RAG step 的 skipWhen 條件
7. 擴充 `llm-generation` step 的 hybrid 路徑
8. 更新 `pipeline_steps` ai_config 預設值（14 個 step）
9. 現有 RAG 路徑維持不動
10. 不需 DB schema 異動，不需 migration

**依賴**：此變更依賴 `modular-rag` 變更完成（pipeline 架構建立）

**Rollback**：停用 `text-to-sql` step（Pipeline Flow UI 開關或 ai_config 設定 `enabled: false`），SQL 路徑完全跳過。或移除 `TOOL_SELECTION_PROMPT` 中的新 tool 選項，`query_type` 不再輸出 `sql`/`hybrid`/`clarification-needed`。

---

## Open Questions

1. **Log 記錄**：SQL 執行結果是否需要寫入 `ai_query_logs`？建議新增 `query_route: 'rag' | 'sql' | 'hybrid' | 'clarification'` 欄位，以及 `sql_fallback: boolean` 欄位，方便分析模板覆蓋率。需一次 DB migration，初版可先只記錄在 trace 中，待功能穩定後再加欄位。
2. **`ai_config` 擴充**：是否需要 admin 能控制 SQL 路由開關（`text_to_sql_enabled`）？因為已有 Pipeline Flow UI 可停用 `text-to-sql` step，不需要額外的 ai_config 開關。
3. **路線名稱驗證快取**：路線名稱驗證每次查詢都多一次 DB round-trip。若效能成為瓶頸，可考慮在 KV 快取 route name → id 的對應（TTL 24h），但初版不需要。
