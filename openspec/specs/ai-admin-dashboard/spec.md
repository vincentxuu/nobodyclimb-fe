## MODIFIED Requirements

### Requirement: 設定頁面
系統應在 `/admin/ai/settings` 提供 AI 設定配置，使用分頁式（Tabs）介面組織設定項，取代原有的單一長頁面。

#### Scenario: 分頁式介面結構
- **WHEN** 管理員造訪 `/admin/ai/settings`
- **THEN** 頁面 SHALL 使用 Tabs 元件顯示 6 個分頁：模型設定、搜尋與排名、品質與 Token、對話與快取、Agentic 模式、防護設定

#### Scenario: 預設顯示第一個分頁
- **WHEN** 管理員造訪 `/admin/ai/settings`（無 URL hash）
- **THEN** 預設顯示「模型設定」分頁

#### Scenario: URL hash 同步分頁
- **WHEN** 管理員切換到「搜尋與排名」分頁
- **THEN** URL SHALL 更新為 `/admin/ai/settings#search`，重新載入頁面時 SHALL 自動切換到該分頁

#### Scenario: 分頁內容對應
- **WHEN** 各分頁載入完成
- **THEN** 分頁內容 SHALL 按以下對應顯示設定欄位：
  - 「模型設定」(#models)：模型設定區塊（5 個欄位）
  - 「搜尋與排名」(#search)：搜尋與檢索（7 個欄位）+ 排名與多樣性（3 個欄位）
  - 「品質與 Token」(#quality)：Token 限制（3 個欄位）+ 品質閾值（3 個欄位）+ Judge 設定（3 個欄位）+ Self-Reflection（1 個欄位）
  - 「對話與快取」(#chat)：對話與快取（3 個欄位）+ 語義快取（2 個欄位）
  - 「Agentic 模式」(#agentic)：Agentic 模式（3 個欄位）
  - 「防護設定」(#guardrails)：防護設定（1 個欄位）+ 4 組 guardrail 列表

#### Scenario: 每個分頁獨立儲存
- **WHEN** 管理員在「模型設定」分頁修改設定並點擊儲存
- **THEN** 系統 SHALL 只送出該分頁包含的設定 key（如 llm_model、simple_model 等），不影響其他分頁的設定值

#### Scenario: 獨立儲存成功回饋
- **WHEN** 分頁設定儲存成功
- **THEN** 該分頁 SHALL 顯示「已儲存」成功提示，其他分頁不受影響

## ADDED Requirements

### Requirement: Guardrail 標籤式編輯
系統 SHALL 將 guardrail 列表從 textarea 改為標籤式（tag input）編輯元件。

#### Scenario: 顯示現有關鍵字為標籤
- **WHEN** 防護設定分頁載入完成
- **THEN** 每個 guardrail 列表的現有關鍵字 SHALL 顯示為獨立的 chip/tag，每個 tag 帶有 × 刪除按鈕

#### Scenario: 新增關鍵字
- **WHEN** 管理員在 tag input 的輸入框中輸入文字並按 Enter
- **THEN** 系統 SHALL 將輸入文字新增為一個新 tag，輸入框清空

#### Scenario: 刪除關鍵字
- **WHEN** 管理員點擊某個 tag 的 × 按鈕
- **THEN** 該 tag SHALL 被移除

#### Scenario: 批次貼上
- **WHEN** 管理員在輸入框中貼上包含換行符號的多行文字
- **THEN** 系統 SHALL 自動依換行符號分割，每行建立一個 tag（忽略空行）

#### Scenario: 顯示項目數量
- **WHEN** guardrail 列表載入完成
- **THEN** 每個列表 SHALL 顯示目前的項目數量（如「目前共 12 個」）

#### Scenario: 儲存格式
- **WHEN** 管理員儲存防護設定分頁
- **THEN** 各 guardrail 列表 SHALL 以 JSON array 字串格式儲存到 ai_config 表（與現有格式相容）

## MODIFIED Requirements

### Requirement: 查詢詳細檢視
系統 SHALL 提供個別查詢的詳細檢視，顯示完整的 17 步 Pipeline 流程追蹤，讓管理員能追蹤每個決策點的輸入、決策依據與結果。

#### Scenario: 檢視查詢詳情
- **WHEN** 管理員點擊查詢列
- **THEN** 詳細頁面顯示：完整查詢、完整回應、使用的來源、時間分解、完整 Pipeline 流程卡片

#### Scenario: 顯示時間分解
- **WHEN** 檢視查詢詳情
- **THEN** 顯示：總延遲、embedding 時間、搜尋時間、LLM 時間

#### Scenario: Pipeline 流程顯示完整 17 步順序
- **WHEN** 管理員展開 RAG Pipeline 流程區段
- **THEN** 依序顯示以下 stage cards（未執行的 stage 顯示「已跳過」）：
  `guardrails_input` → `cache` → `quota_check` → `query_parsing` → `hyde`（條件性）→ `multi_query`（條件性）→ `filter` → `embedding` → `retrieval` → `mmr_selection` → `generation` → `self_reflection`（條件性）→ `judge` → `guardrails_output` → `memory_extraction`

#### Scenario: filter stage 獨立顯示
- **WHEN** 管理員展開 `filter` stage card
- **THEN** Input 區段顯示 LLM 抽取的 params；Decision 區段顯示 filter 來源（llm_parsed / regex_fallback / sim_route）、matched_texts（觸發各過濾條件的原始文字）、resolved_ids（DB 解析結果）；Output 區段顯示最終 Vectorize metadata filter JSON

#### Scenario: retrieval stage 展開顯示子步驟時間軸
- **WHEN** 管理員展開 `retrieval` stage card
- **THEN** 顯示多路搜尋子步驟：搜尋路徑（query_vec + hyde_vec + expanded × N + BM25）
- **THEN** 顯示 RRF 融合子步驟：paths_count、merged_count、min_score_threshold、after_threshold_count
- **THEN** 若 CRAG fallback 觸發，顯示 crag_fallback_detail：trigger_reason 與各次重試的移除 filter + 重試後候選數
- **THEN** 顯示 Cross-encoder 子步驟：若執行則顯示 top_scores 前 5 筆；若未執行顯示 skipped_reason

#### Scenario: mmr_selection stage 獨立顯示
- **WHEN** 管理員展開 `mmr_selection` stage card
- **THEN** Input 區段顯示 input_count（cross-encoder 後候選數）與 lambda 設定值；Decision 區段顯示 MMR 多樣性選取邏輯（relevance vs 多樣性權衡）；Output 區段顯示 selected_count 與 top_selected 前 5 筆（title + relevance_score + popularity_score + final_score）

#### Scenario: self_reflection stage 顯示完整因果鏈
- **WHEN** 管理員展開 `self_reflection` stage card（已觸發）
- **THEN** Decision 區段依序顯示：第一次 judge 分數（quality + groundedness）→ regen_reason（觸發原因）→ 重生成執行 → 第二次 judge 分數 → acceptance_reason（接受/拒絕原因）

#### Scenario: self_reflection stage 顯示未觸發原因
- **WHEN** 管理員展開 `self_reflection` stage card（未觸發）
- **THEN** Decision 區段顯示 judge 第一次分數高於閾值（quality > threshold），Output 顯示「品質合格，使用原始回答」

#### Scenario: judge stage 顯示各向度分數
- **WHEN** 管理員展開 `judge` stage card
- **THEN** 顯示 criteria（評判向度清單）與 raw_scores（各向度個別分數）

#### Scenario: generation stage 顯示 context 文件清單
- **WHEN** 管理員展開 `generation` stage card
- **THEN** Input 區段顯示 context_doc_titles（實際注入 prompt 的文件標題清單）、prompt_template 名稱、memory_summary_preview（若有）

---

## ADDED Requirements

### Requirement: 日誌詳情頁 Decision Narrative

系統 SHALL 在日誌詳情頁頂部顯示一行機器組合的決策敘事，讓管理員在不展開各 stage card 的情況下快速掌握整條 pipeline 的關鍵決策。

#### Scenario: 顯示完整查詢的 Decision Narrative
- **WHEN** 管理員開啟一筆完整跑完 RAG pipeline 的日誌詳情頁
- **THEN** 頁面頂部顯示單行敘事，包含：查詢類型、filter 關鍵詞、搜尋路徑數 + BM25、RRF 前後候選數、CRAG 狀態、cross-encoder 狀態、MMR 選取數、Judge 分數（若觸發重生成則顯示前後分數）、最終 groundedness

#### Scenario: 快取命中時顯示簡短 Narrative
- **WHEN** 管理員開啟一筆快取命中的日誌詳情頁
- **THEN** 頁面頂部顯示：`KV 快取命中 → 直接回傳`（或 `語義快取命中`）

#### Scenario: 通識查詢顯示 Narrative
- **WHEN** 管理員開啟一筆 general-knowledge 路徑的日誌詳情頁
- **THEN** 頁面頂部顯示：`通識查詢 → 跳過向量搜尋 → LLM 直接生成`

#### Scenario: 舊記錄缺少 trace 資料時 Narrative 降級
- **WHEN** 日誌記錄的 pipeline_trace 缺少部分欄位（舊記錄）
- **THEN** Decision Narrative 只顯示可取得的欄位，缺少的部分省略，不顯示錯誤

#### Scenario: Pipeline 完整度視覺提示
- **WHEN** pipeline_trace 資料完整（新記錄）
- **THEN** 每個 stage card 顯示完整 Input → Decision → Output 資訊
- **WHEN** pipeline_trace 資料缺失（舊記錄）
- **THEN** 對應 stage card 的詳細區段顯示「舊記錄無此資料」提示文字，不影響整體頁面渲染
