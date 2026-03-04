## Context

AI 查詢目前由 `QueryService.ask(request, userId?)` 處理，userId 傳入後只用於 query log，不影響 LLM prompt。`SYSTEM_PROMPT` 是靜態常數，所有用戶共用相同 prompt。完攀紀錄存於 `user_route_ascents`（含 `route_id`、`ascent_type`、`ascent_date`），路線難度在 `routes.grade_numeric`（YDS 數值化）。

需要新增：
1. `user_ai_memory` 表 + CRUD API + 前端管理頁
2. `QueryService.ask()` 加入記憶注入與完攀 context
3. 對話結束後非同步提取記憶

## Goals / Non-Goals

**Goals:**
- 讓 LLM 回答能參考用戶既有記憶（攀岩程度、偏好地區、攀岩類型）
- 讓推薦路線時能根據用戶實際完攀紀錄調整難度
- 用戶可完全控制並刪除自己的 AI 記憶

**Non-Goals:**
- 不實作 embedding-based 語意去重（用結構化 memory_key 取代）
- 不提供跨用戶記憶分析或聚合
- 不修改前端 ChatWidget UI（記憶注入在後端透明進行）

## Decisions

### D1：記憶注入位置 — System prompt prefix

**決定**：在 `SYSTEM_PROMPT` 前動態附加個人化段落，格式：
```
[用戶資訊]
攀岩程度：5.11a
偏好地區：台中
攀岩類型：運攀
已完攀：龍洞青蛙石（5.10a）、玉山峭壁（5.11b）...
建議挑戰難度：5.11c-5.12a

[以下為 AI 助理標準指令]
{SYSTEM_PROMPT}
```

**理由**：System prompt 段落在 LLM attention 中優先度最高；比加入 user message 更清楚隔離「背景資訊」vs「本次問題」。

**替代方案**：加入額外 user message → 會干擾 chat history，模型可能將其誤認為對話輪次。

---

### D2：記憶提取時機 — 非同步 fire-and-forget

**決定**：`QueryService.ask()` 回應後，使用 Cloudflare Workers 的 `ctx.waitUntil()` 非同步觸發記憶提取，不阻塞回應。

**理由**：記憶提取需要第二次 LLM 呼叫，約增加 500-1,000ms；用戶不應等待。記憶是「下一次」使用，延遲數秒無影響。

**替代方案**：同步提取 → 增加延遲，影響體感。

---

### D3：快取鍵加入 userId 與個人化 context hash

**決定**：已登入用戶的快取鍵格式為 `ai:ask:{userId}:{hash(query)}{historyHash}:{hash(personalizedContext)}`；未登入用戶維持原鍵 `ai:ask:{hash(query)}{historyHash}`。

`personalizedContext` 為記憶摘要與完攀 context 的合併字串；若皆為空則省略此段（避免空字串 hash 影響鍵）。

**理由**：個人化 prompt 依用戶而異，需 userId 隔離跨用戶快取污染。但同一用戶的記憶或完攀紀錄更新後，context 會改變，若快取鍵不含 context hash，舊快取會持續命中，導致個人化失效。加入 context hash 確保 context 改變時自動 miss。

**替代方案**：已登入用戶完全不快取 → 浪費，同一用戶短時間重複提問仍有快取需求。

---

### D4：記憶去重策略 — 結構化 memory_key

**決定**：`user_ai_memory` 表新增 `memory_key` 欄位（`climbing_level`、`preferred_region`、`preferred_style` 等），以 `(user_id, memory_key)` 做 UPSERT。

**理由**：Spec 要求「語意相近的記憶更新而非重複新增」，但 embedding 去重需要向量搜尋，成本高。結構化 key 達到同樣效果且實作簡單；memory_key 由提取 LLM 從預定義清單中選取。

**替代方案**：每次寫入新記錄不去重 → 記憶膨脹，注入 prompt 時 token 失控。

---

### D5：記憶提取 LLM — 使用輕量模型

**決定**：記憶提取使用 `@cf/meta/llama-3.1-8b-instruct`，而非主要 RAG 模型（gemma-3-12b-it）。

**理由**：記憶提取是簡單的結構化資訊提取任務，不需要大模型的推理能力；輕量模型速度更快，成本更低；memory 品質不影響當前回答，只影響未來問答。

---

### D6：能力推算公式 — 成功完攀 P75

**決定**：從最近 10 條**成功完攀**（`ascent_type IN ('redpoint','flash','onsight','toprope','lead','repeat')`）的 `grade_numeric` 取 P75 百分位數作為能力基準；推薦目標難度為基準 +1 到 +3（YDS 步進）。少於 3 條成功完攀時跳過能力推算。

**理由**：P75 代表「穩定可完攀的高段水準」，比平均值更能反映真實能力上限；排除 `attempt`（未完攀）避免低估；+1 到 +3 步符合漸進式訓練原則。

## Risks / Trade-offs

- **False positive 記憶**：提取 LLM 可能誤判，如「我朋友是 5.12 選手」→ 記憶「程度 5.12」→ 提供刪除介面讓用戶自行修正
- **記憶注入 token 增加**：每次查詢多注入 ~100-200 tokens → 在 D3 的 userId 快取下，多出的 token 成本只在首次查詢發生
- **user_route_ascents 查詢增加 latency**：每次 ask() 多一次 D1 查詢（最多 10 筆）→ 與 LLM 呼叫並行執行，實際影響 <20ms
- **快取 key 分裂**：原本一個 `ai:ask:{hash}` 變成每個用戶各一個 → KV 用量線性增長；TTL 1hr 自動回收，可接受

## Migration Plan

1. 新增 migration：建立 `user_ai_memory` 表（含 `memory_key` 唯一索引）
2. 部署 `QueryService` 修改版：`ask()` 新增 memory 查詢與 context 注入，並加入 `waitUntil()` 非同步提取
3. 部署 `routes/ai.ts` 新增記憶 CRUD 端點（GET/DELETE）
4. 部署前端 `/profile/ai-memory` 頁面
5. Rollback：移除 `buildPersonalizedContext()` 呼叫即可回退，memory 表可保留

## Open Questions

- `memory_key` 的完整預定義清單是否需要產品確認？（目前提案：`climbing_level`、`preferred_region`、`preferred_style`、`preferred_crag`、`goals`）
- 記憶條數是否需要設上限？（建議每用戶最多 20 條，超過時刪除最舊）
