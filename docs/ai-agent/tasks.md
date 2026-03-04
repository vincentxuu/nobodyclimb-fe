# NobodyClimb AI 功能改善任務清單

> 狀態：規劃中
> 建立日期：2026-03-03
> 參考文件：[AI Agent 架構](./01-architecture.md)、[後端實作](./03-backend-implementation.md)
> 參考研究：OWASP LLM Top 10 2025、2025-2026 AI Agent Best Practices
> 相關程式碼：`backend/src/routes/ai.ts`、`backend/src/services/query.ts`、`backend/src/utils/ai-prompts.ts`

---

## 現況摘要

### 已實作的功能
| 功能 | 位置 |
|------|------|
| JWT 認證 + RBAC 授權 | `backend/src/middleware/auth.ts` |
| Rank-based 每日配額 (2–24 次) | `backend/src/routes/ai.ts` |
| Zod 輸入驗證 (2–500 字元) | `backend/src/routes/ai.ts` |
| System prompt 限制攀岩範疇 | `backend/src/utils/ai-prompts.ts` |
| Multi-turn 對話 (chat sessions) | `backend/src/routes/ai.ts` + chat tables |
| Follow-up 問題建議 | `backend/src/utils/ai-prompts.ts` |
| Source 引用顯示 | `apps/web/src/components/ai/SourceCard.tsx` |
| Hash-based 查詢快取 (1hr TTL) | `backend/src/services/query.ts` |
| 用戶 1–5 星 Feedback | `backend/src/routes/ai.ts` |
| Query log + latency + token 計數 | `backend/migrations/0046_create_ai_tables.sql` |
| Admin 管理後台 | `backend/src/routes/admin-ai.ts` |

### 缺口總覽
- **安全防護**: 無 prompt injection / jailbreak 偵測、無 output 過濾、無 token 硬上限
- **基礎設施**: 無 streaming、無 semantic cache、無 provider fallback
- **品質保證**: 無 hallucination 自動評估、無 LLM-as-judge、無 RAG 分段 tracing
- **個人化**: 無長期記憶、回答不依用戶攀岩程度調整
- **主動功能**: 純被動回應，無 proactive 建議

---

## Phase 1：安全防護 (Security Guardrails)

> 優先級：🔴 高（直接影響安全性）
> 對應威脅：OWASP LLM01 Prompt Injection、LLM07 System Prompt Leakage、LLM10 Unbounded Consumption

### 1.1 輸入層防護

- [ ] **1.1.1** 建立 prompt injection 關鍵字過濾清單
  - 偵測常見注入模式：`ignore previous instructions`、`you are now`、`pretend to be`、`DAN`、`jailbreak` 等
  - 建立 `backend/src/utils/guardrails.ts` 模組
  - 驗證失敗時返回 400，不消耗配額

- [ ] **1.1.2** 加入 jailbreak pattern 偵測
  - Role-play 攻擊：`act as`、`roleplay as`、`simulate`
  - Encoding 攻擊：偵測 base64、rot13 混入的異常字串
  - 設定可在 `ai_config` 表動態更新的黑名單

- [ ] **1.1.3** 實作 per-request token 預算上限
  - 計算輸入 token 數（query + chat history）
  - 超過 2,000 tokens 時截斷 chat history（保留最近 3 輪）
  - 紀錄截斷事件到 query log

- [ ] **1.1.4** 加入語言/內容類型檢查
  - 純符號、亂碼、重複字元輸入直接拒絕
  - 非攀岩相關明顯離題（現有 system prompt 已處理，加上 pre-LLM 關鍵字快篩）

### 1.2 輸出層防護

- [ ] **1.2.1** System prompt leakage 偵測
  - 掃描 LLM 回應是否包含 `SYSTEM_PROMPT`、`You are a climbing assistant` 等 system prompt 的特徵字串
  - 偵測到時替換為通用錯誤訊息，並記錄告警

- [ ] **1.2.2** 敏感資訊過濾
  - 掃描輸出中的 email、電話、身分證字號等 PII
  - 使用 regex pattern 過濾後再返回給前端

- [ ] **1.2.3** 建立輸出長度上限
  - 回應超過 3,000 字元時自動截斷
  - 截斷時加入 `...（回答已截斷，請縮短問題或分多次詢問）`

### 1.3 成本控管

- [ ] **1.3.1** 實作每用戶每日 token 消耗上限
  - 在 `user_ranks` 表新增 `daily_token_used`、`daily_token_limit` 欄位
  - 各 rank 對應 token 上限（麓: 5K、壁: 15K、稜: 30K、巔: 60K）
  - 超過上限時提前返回 429，不發出 LLM 請求

- [ ] **1.3.2** Admin 告警：異常 token 消耗
  - 單一請求消耗超過 1,000 tokens 時寫入告警 log
  - Admin dashboard 新增「高消耗請求」篩選器

---

## Phase 2：基礎設施改進 (Infrastructure)

> 優先級：🔴 高（直接影響 UX 與成本）

### 2.1 Streaming 回應

- [ ] **2.1.1** 後端實作 SSE（Server-Sent Events）串流
  - `POST /api/v1/ai/ask` 新增 `?stream=true` 參數
  - 使用 Cloudflare Workers AI 的 streaming API
  - 每個 token 以 `data: {"token": "..."}` 格式推送

- [ ] **2.1.2** 前端 ChatWidget 支援串流顯示
  - 使用 `EventSource` 或 `fetch` + `ReadableStream` 接收
  - 實作逐字顯示動畫（typing effect）
  - 串流期間顯示「停止生成」按鈕

- [ ] **2.1.3** 串流錯誤處理
  - 中斷時顯示已接收內容 + 錯誤提示
  - 配額退還邏輯（串流中斷視為失敗）

### 2.2 Semantic Caching

- [ ] **2.2.1** 實作語意快取（取代 hash-based cache）
  - 對新 query 產生 embedding
  - 在 Cloudflare Vectorize 中搜尋相似已快取 query（cosine similarity > 0.95）
  - 命中時直接返回快取回應，不發 LLM 請求

- [ ] **2.2.2** 快取儲存結構
  - 建立 `ai_cache` 表：`query_embedding`、`response`、`sources`、`hit_count`、`created_at`
  - TTL 設為 24 小時（攀岩資料不常變動）

- [ ] **2.2.3** 快取命中率追蹤
  - Admin dashboard 新增快取命中率 KPI
  - 每週快取節省 token 數報表

### 2.3 Provider Fallback

- [ ] **2.3.1** 設定備援模型清單
  - 主要：`@cf/google/gemma-3-12b-it`
  - 備援 1：`@cf/meta/llama-3.1-8b-instruct`
  - 備援 2：`@cf/mistral/mistral-7b-instruct-v0.1`
  - 設定寫入 `ai_config` 表，可動態調整

- [ ] **2.3.2** 實作自動 Failover 邏輯
  - LLM 請求失敗（5xx、timeout）時自動切換備援
  - Exponential backoff：1s → 2s → 4s
  - 三個 provider 都失敗時返回明確錯誤，配額退還

- [ ] **2.3.3** Fallback 事件記錄
  - query log 新增 `model_used`、`fallback_count` 欄位
  - Admin dashboard 顯示各模型使用率與 fallback 頻率

---

## Phase 3：品質保證 (Quality Assurance)

> 優先級：🟡 中（影響回答品質與信任度）

### 3.1 Hallucination 偵測（Groundedness 評分）

- [ ] **3.1.1** 實作 RAG Groundedness 自動評分
  - 使用輕量 LLM（`@cf/meta/llama-3.1-8b-instruct`）作為 judge
  - 評分維度：回答是否完全基於取回的文件（0–1 分）
  - 分數低於 0.6 時，在回答前加入免責聲明：「以下資訊基於現有資料推斷，建議實地確認」

- [ ] **3.1.2** Faithfulness 指標追蹤
  - query log 新增 `groundedness_score` 欄位
  - Admin dashboard 顯示每日平均 groundedness 趨勢

- [ ] **3.1.3** 低 groundedness 回答自動標記
  - 分數 < 0.5 自動標記為「需人工審核」
  - Admin 後台新增「低可信度回答」篩選器

### 3.2 LLM-as-Judge 評估

- [ ] **3.2.1** 建立自動品質評分 pipeline
  - 對每個回答進行 1–4 分自動評分
  - 評分維度：相關性、完整性、格式正確性
  - 結果寫入 `ai_query_logs.auto_score`

- [ ] **3.2.2** 整合用戶回饋與自動評分
  - 比對 `auto_score` 與用戶 `feedback_score` 的差異
  - 差異 > 2 分時標記為「異常評分」供人工分析

- [ ] **3.2.3** 定期品質報表
  - 每週 Admin dashboard 顯示：平均自動評分、平均用戶評分、差異趨勢

### 3.3 RAG Pipeline 分段追蹤

- [ ] **3.3.1** 實作分段 latency 追蹤
  - 記錄每個 RAG 階段耗時：embedding、vector search、LLM generation
  - 寫入 query log：`embedding_ms`、`retrieval_ms`、`generation_ms`

- [ ] **3.3.2** Admin dashboard 瓶頸分析
  - 各階段 P50/P95 latency 圖表
  - 標示哪個階段是主要瓶頸

- [ ] **3.3.3** 低分 Feedback 自動 Flag
  - 用戶評分 ≤ 2 星時，自動發送通知到 Admin
  - 通知內容包含：query、回答、分段 latency、groundedness score

---

## Phase 4：對話體驗改善 (Conversation UX)

> 優先級：🟡 中（影響用戶信任與使用感受）

### 4.1 不確定性提示

- [ ] **4.1.1** 回答中加入信心程度標示
  - groundedness score 高（> 0.8）：正常顯示
  - groundedness score 中（0.6–0.8）：加入「⚠️ 部分資訊來自推斷」標示
  - groundedness score 低（< 0.6）：加入「❓ 建議實地確認」標示

- [ ] **4.1.2** 「查無結果」體驗優化
  - 搜尋無結果時，建議相近的搜尋詞
  - 顯示「你可以試試：...」的替代問題

### 4.2 Feedback 體驗改善

- [ ] **4.2.1** 細化 Feedback 選項
  - 現有：1–5 星
  - 新增：快速標記原因（「資訊不正確」、「沒有回答我的問題」、「太簡短」、「很有幫助」）
  - 前端 `ChatMessage.tsx` 新增 chip 選項

- [ ] **4.2.2** Feedback 結果即時更新 Admin
  - 低分 feedback 即時通知（WebSocket 或 polling）
  - Admin 可標記已處理

---

## Phase 5：記憶與個人化 (Memory & Personalization)

> 優先級：🟢 中長期（2026 主要趨勢）

### 5.1 長期記憶

- [ ] **5.1.1** 建立用戶偏好記憶表
  - 新增 `user_ai_memory` 表：`user_id`、`memory_type`（preference/behavior/fact）、`content`、`updated_at`
  - 記憶類型範例：攀岩等級偏好、常去岩場、攀岩類型（運攀/抱石/傳攀）

- [ ] **5.1.2** 自動從對話中提取記憶
  - 對話結束後，用輕量 LLM 提取關鍵用戶資訊
  - 範例：「用戶問過 5.11c 路線」→ 記憶「程度約 5.11」

- [ ] **5.1.3** 記憶注入 system prompt
  - 在 SYSTEM_PROMPT 前加入用戶記憶摘要
  - 範例：「此用戶攀岩程度約 5.11，偏好台中地區，喜歡運攀」

- [ ] **5.1.4** 用戶記憶管理介面
  - `/profile/ai-memory` 頁面：顯示、刪除個人 AI 記憶
  - 符合 GDPR 精神的資料控制

### 5.2 基於攀岩紀錄的個人化

- [ ] **5.2.1** 整合用戶攀岩紀錄到 RAG context
  - Query 時從用戶的 `route_ascents` 取出最近 10 條紀錄
  - 加入 context：「此用戶已完攀路線包含：XX（5.10a）、YY（5.11b）...」
  - LLM 據此調整推薦難度

- [ ] **5.2.2** 個人化難度推薦
  - 根據用戶已攀紀錄推算目前能力區間
  - 推薦路線時優先推薦「比目前能力略難一級」的路線

---

## Phase 6：Adaptive RAG 架構

> 優先級：🟢 長期（技術改進）

### 6.1 查詢複雜度路由

- [ ] **6.1.1** 實作 query classifier
  - 簡單問題（直接 lookup）→ 跳過 HyDE，直接 vector search
  - 複雜問題（比較、推薦）→ 完整 RAG pipeline
  - 一般知識問題 → general knowledge fallback（現有）

- [ ] **6.1.2** 依複雜度選擇模型
  - 簡單問題用小模型（節省成本）
  - 複雜推薦問題用大模型

### 6.2 Corrective RAG（CRAG）

- [ ] **6.2.1** 實作 retrieval 品質評估
  - 取回文件後，評估 retrieved chunks 是否真的相關
  - 相關性 < 0.6 時，放寬過濾條件重新搜尋

- [ ] **6.2.2** Self-reflection 機制
  - LLM 生成回答後，自我評估是否回答了問題
  - 評估失敗時觸發 re-generation（最多 1 次重試）

---

## Phase 7：主動式 AI 功能 (Proactive Features)

> 優先級：🟢 長期（產品差異化）

### 7.1 情境感知建議

- [ ] **7.1.1** 岩場頁面 AI 快速入口
  - 用戶在岩場詳情頁停留 > 10 秒，顯示「想了解這個岩場的路線嗎？」
  - 點擊直接開啟 ChatWidget，預填問題

- [ ] **7.1.2** 攀岩紀錄新增後的 AI 推薦
  - 用戶完成路線記錄後，AI 自動推薦下一個挑戰目標
  - 基於完攀歷史 + 同等級用戶常攀的路線

### 7.2 Observability Dashboard 完整化

> 搭配 Phase 3 的 tracing 資料

- [ ] **7.2.1** 實作完整 RAG Triad dashboard
  - 每日：Context Relevance、Groundedness、Answer Relevance 三指標趨勢
  - 可下鑽到單一 query 的詳細分數

- [ ] **7.2.2** 成本追蹤 dashboard
  - 每日 / 每週 token 消耗
  - 各 rank 用戶的平均消耗量
  - 快取節省的 token 數（Phase 2.2 建立後）

---

## 實作優先序建議

```
立即開始 (Phase 1 + 2.1 + 2.2)
├── [1.1.1] Prompt injection 過濾          ← 安全，1天
├── [1.1.2] Jailbreak pattern 偵測         ← 安全，1天
├── [1.3.1] Token 每日硬上限              ← 成本控制，1天
├── [2.1.x] Streaming 回應               ← UX 大幅改善，3天
└── [2.2.x] Semantic caching             ← 省 70-90% LLM 費用，2天

中期 (Phase 2.3 + 3)
├── [2.3.x] Provider fallback             ← 可靠性，2天
├── [3.1.x] Groundedness 評分             ← 品質保證，3天
├── [3.3.3] 低分 Feedback 自動 Flag       ← 品質監控，1天
└── [3.3.1] RAG 分段 latency 追蹤         ← 可觀測性，1天

長期 (Phase 4-7)
├── [5.x]   記憶與個人化
├── [6.x]   Adaptive RAG
└── [7.x]   主動式 AI 功能
```

---

## 參考資料

| 來源 | 連結 |
|------|------|
| OWASP LLM Top 10 2025 | https://owasp.org/www-project-top-10-for-large-language-model-applications/ |
| OpenAI Practical Guide to Building Agents | https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf |
| RAG Architectures 2025 | https://ragflow.io/blog/rag-review-2025-from-rag-to-context |
| LLM Observability Best Practices | https://www.getmaxim.ai/articles/llm-observability-best-practices-for-2025/ |
| Groundedness in RAG | https://www.deepset.ai/blog/rag-llm-evaluation-groundedness |
| LLM Caching & Fallback | https://radicalbit.ai/resources/blog/llm-performance/ |
