## Context

目前 AI pipeline 的 10 個 prompt 模板硬編碼在 `backend/src/utils/ai-prompts.ts`，`query.ts` 在最頂層 import 後直接使用。後端已有 `/admin/ai/prompts` CRUD API 和 `ai_prompts` 資料表（含版本號自動遞增），但前端完全沒有對應 UI。

Settings 頁面（`apps/web/src/app/admin/ai/settings/page.tsx`）將 11 個區塊、30+ 設定項和 4 組 guardrail textarea 全部渲染在同一個長捲軸頁面，管理員需要大量滾動才能找到目標設定。

## Goals / Non-Goals

**Goals:**
- 讓管理員能在後台即時編輯所有 prompt 模板，無需修改程式碼和重新部署
- 提供 prompt 版本歷史瀏覽和一鍵回滾能力
- 將 settings 頁面重構為分頁式 UI，每個分頁獨立儲存
- 改善 guardrail 列表的編輯體驗

**Non-Goals:**
- Prompt A/B testing（流量分配、實驗對照）
- Prompt 測試沙箱（輸入問題即時預覽回答）
- 多語言 prompt 支援
- Prompt 模板的團隊協作（審核流程、評論）
- Settings 欄位的新增或刪除（保持現有 30+ 設定項不變）

## Decisions

### D1: Prompt 載入機制 — DB 優先 + 硬編碼 fallback

**選擇**: 新增 `loadPrompts(db)` 函數，查詢 `ai_prompts` 表取得各 prompt 的 active 版本，找不到則 fallback 到 `ai-prompts.ts` 的硬編碼常數。

**替代方案**:
- (A) 完全遷移到 DB，刪除硬編碼 → 若 DB 查詢失敗或 seed 遺漏，整個 AI 功能癱瘓
- (B) 保持硬編碼，admin 編輯後寫入 KV overlay → 需要同時維護 DB + KV 兩套機制

**理由**: DB 優先 + fallback 最安全。即使 admin 從未編輯過任何 prompt，系統仍正常運作。且 `ai_prompts` 表已存在，不需新增 schema。

### D2: Prompt 快取策略 — 請求層級 (與 loadPipelineConfig 並行)

**選擇**: 在 `processQuery()` 中將 `loadPrompts(db)` 與 `loadPipelineConfig(db)` 並行執行（`Promise.all`），每次請求讀一次 DB。不額外加 KV 快取。

**替代方案**:
- (A) KV 快取 + TTL → 新增複雜度（快取失效、admin 編輯後需清 cache），prompt 表資料量小，D1 查詢成本低
- (B) Worker global 變數快取 → Worker 可能有多個 isolate，快取一致性難保證

**理由**: `ai_config` 已是每次請求讀 DB 的模式且運作良好。Prompt 表更小（最多 10 筆 active），單次 `SELECT WHERE status='active'` 成本極低。admin 編輯後立即生效，無快取失效問題。未來若有效能需求再加 KV 快取層。

### D3: Prompt 名稱對應 — 固定 name 欄位對應程式碼常數

**選擇**: 定義固定的 prompt name mapping：

| ai_prompts.name | 程式碼常數 |
|---|---|
| `system_prompt` | SYSTEM_PROMPT |
| `tool_selection_prompt` | TOOL_SELECTION_PROMPT |
| `general_knowledge_system_prompt` | GENERAL_KNOWLEDGE_SYSTEM_PROMPT |
| `hyde_prompt` | HYDE_PROMPT |
| `judge_prompt` | JUDGE_PROMPT |
| `self_reflection_prompt` | SELF_REFLECTION_PROMPT |
| `contextual_chunk_prompt` | CONTEXTUAL_CHUNK_PROMPT |
| `multi_query_expansion_prompt` | MULTI_QUERY_EXPANSION_PROMPT |
| `agentic_decision_prompt` | AGENTIC_DECISION_PROMPT |
| `query_template` | QUERY_TEMPLATE |

Prompt editor 不允許新增自訂名稱，僅能編輯這 10 個固定模板。

**理由**: AI pipeline 的使用位置是固定的，自訂 prompt 名稱沒有對應的呼叫點。限定名稱可避免混亂。

### D4: Settings 頁面分頁架構 — URL hash-based Tabs

**選擇**: 使用 Radix UI Tabs 元件，URL hash 同步當前分頁（如 `#search`、`#models`），每個 tab 有獨立的儲存按鈕。

分頁規劃（6 個 tab）：

| Tab ID | 標籤 | 對應 CONFIG_FIELDS sections |
|---|---|---|
| `models` | 模型設定 | 模型設定 |
| `search` | 搜尋與排名 | 搜尋與檢索 + 排名與多樣性 |
| `quality` | 品質與 Token | Token 限制 + 品質閾值 + Judge 設定 + Self-Reflection |
| `chat` | 對話與快取 | 對話與快取 + 語義快取 |
| `agentic` | Agentic 模式 | Agentic 模式 |
| `guardrails` | 防護設定 | 防護設定 + 4 組 guardrail 列表 |

**替代方案**:
- (A) Next.js 子路由（`/settings/models`、`/settings/search`）→ 過度工程，每個分頁內容不多
- (B) Accordion 折疊面板 → 仍需滾動，未解決頁面過長的核心問題
- (C) 側邊導航 + 單頁 scroll anchor → 適合更多分類的情況，目前 6 個分頁用 tabs 足夠

**理由**: Tabs 是最常見且直覺的分類 UI 模式。URL hash 讓管理員可以分享/書籤特定分頁。每個 tab 獨立儲存避免意外覆蓋其他分頁的設定。

### D5: Guardrail 列表編輯 — Tag Input 元件

**選擇**: 將 textarea 替換為 tag-input UI：
- 每個關鍵字顯示為一個 chip/tag，帶 × 刪除按鈕
- 底部輸入框，按 Enter 新增
- 支援批次貼上（偵測換行符號，自動分割為多個 tag）

**替代方案**:
- (A) 保持 textarea → 使用者已反映 UX 不佳
- (B) 獨立的 modal dialog 管理每個列表 → 增加操作步驟

**理由**: Tag input 比 textarea 更直覺，能一眼看到所有項目且容易操作。批次貼上保留從 textarea 遷移的便利性。

### D6: Prompt 編輯器 — 純文字 textarea + 變數高亮提示

**選擇**: 使用大型 textarea 搭配側邊變數提示面板，不使用程式碼編輯器 library。

- 編輯區：全寬 textarea，monospace 字體，可調整高度
- 側邊面板：顯示該 prompt 可用的變數列表（如 `{query}`、`{context}`），點擊可插入
- 上方：prompt 名稱（唯讀）、目前版本號、狀態（active/draft）

**替代方案**:
- (A) Monaco Editor / CodeMirror → 依賴大、載入慢，prompt 非程式碼不需要語法高亮
- (B) ContentEditable + 自訂高亮 → 複雜度高、瀏覽器相容性問題多

**理由**: Prompt 模板本質是純文字，不需要程式碼編輯器的功能。Textarea 足夠且零額外依賴。變數提示面板提供便利性而不增加複雜度。

### D7: 版本歷史與回滾 — 利用現有 version 機制

**選擇**: 每次儲存 prompt 內容時，調用現有 `POST /admin/ai/prompts` API（同名自動遞增 version），新版本設為 `active`，舊版本自動降為 `archived`。

版本列表頁面顯示：版本號、更新時間、狀態。點選舊版本可預覽內容、一鍵「回滾」（實質是建立一個內容相同的新版本）。

**需要的 API 調整**:
- `GET /admin/ai/prompts?name=system_prompt` — 需支援 name 篩選，回傳同名所有版本
- 現有 `POST /admin/ai/prompts` — 新建版本時自動將同名舊版本設為 archived

**理由**: 不需要新增 DB schema，復用 `ai_prompts` 表的 name + version + status 機制。

## Risks / Trade-offs

**[Prompt 格式錯誤] → 驗證 + fallback**
管理員可能編輯 prompt 時破壞變數佔位符（如刪除 `{query}`）。Mitigation: 儲存前驗證必要變數是否存在（警告但不阻擋），若執行時變數替換失敗則 fallback 到硬編碼版本。

**[每請求多一次 DB 查詢] → 可接受**
新增 `loadPrompts(db)` 會多一次 D1 查詢。但此查詢極輕量（最多 10 筆 active prompt），且與 `loadPipelineConfig` 並行執行不增加延遲。若未來成為瓶頸可加 KV 快取。

**[Settings 分頁獨立儲存可能造成部分更新] → 預期行為**
管理員可能只修改某一頁的設定。這是預期的：每個分頁獨立性高（model 設定不影響 quality 閾值），獨立儲存反而避免「改 model 時不小心覆蓋了別人正在改的 quality 閾值」。

**[Prompt 版本無上限] → 定期清理**
每次編輯都會產生新版本，長期累積可能過多。Mitigation: 暫不處理，日後可加定期清理邏輯（保留最近 N 個版本）。

## Open Questions

- 是否需要在 prompt 編輯儲存前提供「預覽」功能（用測試問題即時預覽回答）？目前設計為 Non-Goal，但後續可追加。
