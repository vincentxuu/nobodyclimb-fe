## 新增需求

### 需求：儀表板總覽頁面
系統應提供位於 `/admin/ai` 的管理員儀表板頁面，顯示關鍵效能指標。

#### 場景：顯示 KPI 卡片
- **當** 管理員造訪 /admin/ai
- **則** 頁面顯示：今日查詢數、平均延遲、成功率和 token 用量

#### 場景：顯示趨勢指標
- **當** 顯示 KPI 值
- **則** 每張卡片顯示與前期比較（↑12% 或 ↓5%）

### 需求：健康狀態顯示
系統應在儀表板上顯示 AI 服務的即時健康狀態。

#### 場景：所有服務健康
- **當** Workers AI 和 Vectorize 運作正常
- **則** 健康指示器顯示綠色「healthy」狀態

#### 場景：服務降級
- **當** 任何 AI 服務不可用
- **則** 對應指示器顯示紅色「down」或黃色「degraded」狀態

### 需求：查詢日誌列表
系統應在 `/admin/ai/logs` 提供可搜尋的 AI 查詢日誌列表。

#### 場景：檢視近期查詢
- **當** 管理員造訪日誌頁面
- **則** 表格顯示：時間戳記、查詢文字（截斷）、延遲、回饋分數、狀態

#### 場景：依日期範圍篩選
- **當** 管理員選擇日期範圍篩選器
- **則** 只顯示該範圍內的查詢

#### 場景：依回饋分數篩選
- **當** 管理員篩選「低分」（1-2）
- **則** 只顯示評分較差的查詢供檢閱

### 需求：查詢詳細檢視
系統應提供個別查詢的詳細檢視，包含完整追蹤。

#### 場景：檢視查詢詳情
- **當** 管理員點擊查詢列
- **則** 詳細頁面顯示：完整查詢、完整回應、使用的來源、時間分解

#### 場景：顯示時間分解
- **當** 檢視查詢詳情
- **則** 顯示：總延遲、embedding 時間、搜尋時間、LLM 時間

### 需求：知識庫狀態
系統應在 `/admin/ai/knowledge` 提供知識庫總覽。

#### 場景：檢視資料來源
- **當** 管理員造訪知識庫頁面
- **則** 表格顯示每個來源（路線、岩場、影片）及其：數量、索引狀態、最後更新

#### 場景：顯示索引狀態
- **當** 路線來源有 946 個已索引文件
- **則** 顯示「946 筆 | 已索引 | 最後更新: 2小時前」

### 需求：手動觸發索引
系統應允許管理員從知識庫頁面觸發重建索引。

#### 場景：觸發路線重建索引
- **當** 管理員點擊路線的「重新索引」按鈕
- **則** 出現確認對話框，然後開始索引並顯示進度

#### 場景：顯示索引進度
- **當** 索引進行中
- **則** 按鈕顯示轉圈和「索引中...」狀態

### 需求：Prompt 管理
系統應在 `/admin/ai/prompts` 提供 prompt 模板管理。

#### 場景：列出 prompts
- **當** 管理員造訪 prompts 頁面
- **則** 表格顯示：prompt 名稱、目前版本、狀態（草稿/正式）、最後修改

#### 場景：編輯 prompt
- **當** 管理員點擊 prompt 的編輯
- **則** 編輯器開啟，顯示目前內容並高亮變數

#### 場景：儲存 prompt 版本
- **當** 管理員儲存 prompt 變更
- **則** 建立新版本，保留先前版本

### 需求：Prompt 發布
系統應支援將 prompts 從草稿發布到正式狀態。

#### 場景：發布到正式環境
- **當** 管理員點擊「發布到 Production」
- **則** prompt 狀態變更為正式並立即生效

#### 場景：回滾 prompt
- **當** 管理員選擇先前版本並點擊「回滾」
- **則** 該版本成為作用中的正式 prompt

### 需求：設定頁面
系統應在 `/admin/ai/settings` 提供 AI 設定配置。

#### 場景：檢視目前設定
- **當** 管理員造訪設定頁面
- **則** 頁面顯示：模型設定、快取設定、速率限制

#### 場景：更新快取 TTL
- **當** 管理員將快取 TTL 變更為 7200 秒
- **則** 設定被儲存並套用到後續查詢

### 需求：分析報告
系統應在儀表板上提供基礎分析。

#### 場景：查詢量圖表
- **當** 管理員檢視儀表板
- **則** 折線圖顯示過去 7 天的每日查詢量

#### 場景：熱門查詢
- **當** 管理員檢視儀表板
- **則** 列表顯示前 10 個最常見的查詢模式

### 需求：管理員認證
系統應要求管理員角色才能存取所有 AI 管理頁面。

#### 場景：管理員存取
- **當** 具管理員角色的使用者造訪 /admin/ai
- **則** 頁面正常載入

#### 場景：非管理員存取
- **當** 非管理員使用者造訪 /admin/ai
- **則** 使用者被重新導向到未授權頁面或顯示 403 錯誤

### 需求：匯出功能
系統應允許匯出查詢日誌供分析。

#### 場景：匯出為 CSV
- **當** 管理員在日誌頁面點擊「匯出」
- **則** 下載包含所有可見日誌條目的 CSV 檔案

### 需求：即時更新
系統應在儀表板上顯示近乎即時的更新。

#### 場景：自動重新整理 KPIs
- **當** 儀表板開啟
- **則** KPI 值每 60 秒重新整理一次，不需完整頁面重載

### 需求：響應式管理介面
系統應在平板和桌面螢幕上提供可用的管理介面。

#### 場景：桌面版佈局
- **當** 視窗寬度 >= 1024px
- **則** 側邊導航可見，包含完整頁面內容

#### 場景：平板版佈局
- **當** 視窗寬度在 768-1024px 之間
- **則** 佈局調整為單欄，帶可摺疊側邊欄

## ADDED Requirements (ai-quality-assurance)

### Requirement: 品質 KPI 面板
Admin API SHALL 提供 `GET /admin/ai/quality-stats` 端點，回傳 AI 品質相關的統計數據，供 Dashboard 顯示。回傳資料包含：過去 7 天每日平均 groundedness_score、每日平均 auto_score、每日平均用戶 feedback_score（1–5 尺度）、以及三者的整體平均值。

#### Scenario: 取得品質統計
- **WHEN** 管理員呼叫 GET /admin/ai/quality-stats
- **THEN** API 回傳 JSON，包含：daily（7 天陣列，各含 date、avg_groundedness、avg_auto_score、avg_feedback）與 overall 彙總

#### Scenario: 無評分資料時回傳 null
- **WHEN** 某日尚無任何評分（所有欄位為 null）
- **THEN** 該日的 avg_score 回傳 null，不影響其他日期的計算

#### Scenario: 需要 Admin 權限
- **WHEN** 非管理員用戶呼叫 GET /admin/ai/quality-stats
- **THEN** 回傳 403 Forbidden

### Requirement: RAG 分段延遲分析
Admin API SHALL 提供 `GET /admin/ai/latency-stats` 端點，回傳 RAG 各階段的延遲分布統計（P50、P95）。分析範圍：過去 24 小時的非快取查詢（embedding_ms NOT NULL）。

#### Scenario: 取得延遲統計
- **WHEN** 管理員呼叫 GET /admin/ai/latency-stats
- **THEN** API 回傳：embedding_p50、embedding_p95、retrieval_p50、retrieval_p95、generation_p50、generation_p95（單位毫秒）與 sample_count

#### Scenario: 樣本不足時的處理
- **WHEN** 過去 24 小時的非快取查詢少於 10 筆
- **THEN** 回傳現有樣本的計算結果，response 含 `sample_count` 欄位說明樣本數

#### Scenario: 需要 Admin 權限
- **WHEN** 非管理員用戶呼叫 GET /admin/ai/latency-stats
- **THEN** 回傳 403 Forbidden

### Requirement: 待審核標記列表
Admin API SHALL 提供 `GET /admin/ai/flagged` 端點，回傳 `is_reviewed = false` 的標記記錄列表，支援依 flag_reason 篩選，依 created_at 降序排列，預設回傳最近 50 筆。並提供 `PATCH /admin/ai/flagged/:id` 將記錄標記為已審核。

#### Scenario: 取得待審核列表
- **WHEN** 管理員呼叫 GET /admin/ai/flagged
- **THEN** 回傳 is_reviewed = false 的標記列表，每筆含：id、query_log_id、flag_reason、created_at，以及對應的 query 文字（JOIN ai_query_logs）

#### Scenario: 依 flag_reason 篩選
- **WHEN** 管理員呼叫 GET /admin/ai/flagged?reason=low_groundedness
- **THEN** 只回傳 flag_reason = low_groundedness 的記錄

#### Scenario: 標記已處理
- **WHEN** 管理員呼叫 PATCH /admin/ai/flagged/:id
- **THEN** 該標記記錄的 is_reviewed 更新為 1，下次查詢不再出現在列表；id 不存在時回傳 404

#### Scenario: 需要 Admin 權限
- **WHEN** 非管理員用戶呼叫任何 /admin/ai/flagged 端點
- **THEN** 回傳 403 Forbidden
