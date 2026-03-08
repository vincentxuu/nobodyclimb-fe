# RAG 系統差距分析：現狀 vs 業界最佳實踐

> 建立日期：2026-03-08
> 目的：系統性比較本專案 AI RAG 實作與業界 2026 年最佳實踐，找出差距與改進方向
> 相關文件：`10-agentic-rag-industry-practices.md`、`backend/src/services/query.ts`、`backend/src/services/pipeline/`、`backend/src/services/text-to-sql.ts`

---

## 一、現狀總覽

本專案已建構一套**生產等級的 Advanced + Agentic RAG Pipeline**，部署於 Cloudflare Workers 邊緣運算環境，核心元件完整度高。

### 已實作元件清單

| 元件 | 實作位置 | 說明 |
|------|---------|------|
| **Modular Pipeline Engine** | `pipeline/engine.ts` | 14 步驟，DB 驅動配置，dependency validation，並行分支，loopBack，phase cleanup |
| **Pipeline Step Registry** | `pipeline/registry.ts` | 14 步驟註冊（含 phase、order、requires、provides、skipWhen metadata） |
| Adaptive Router | `pipeline/steps/tool-selection.ts` | LLM 分類 5 種工具類型（search_routes / search_crags / general_knowledge / sql_query / hybrid） |
| **Text-to-SQL** | `services/text-to-sql.ts` | 17 個 SQL 模板（路線 9、影片 2、個人紀錄 6），SELECT-only 安全查詢，模糊匹配，澄清流程 |
| Hybrid Search | `pipeline/steps/hybrid-search.ts` | Vector（Vectorize）+ BM25（D1 FTS5）雙路搜尋，Agentic 多步分支 |
| RRF 融合 | `query.ts` mergeResults() | K=60 倒數排名融合，支援多路合併 |
| HyDE | `pipeline/steps/hyde.ts` | complex 查詢產生假設文件向量，擴大召回 |
| Multi-Query Expansion | `pipeline/steps/multi-query.ts` | LLM 生成 N 路子查詢（可配置） |
| Cross-Encoder Reranking | `pipeline/steps/cross-encoder.ts` | `@cf/baai/bge-reranker-base` 重排序 |
| MMR 多樣性 | `pipeline/steps/mmr.ts` | λ=0.6 平衡相關性與多樣性 |
| Popularity Reranking | `pipeline/steps/popularity-rerank.ts` | 影片計數 + 最新影片 URL 加權排序 |
| CRAG | `pipeline/steps/hybrid-search.ts` | 0 筆結果 + 有難度過濾時放寬重試，similar-route fallback |
| Self-Reflection | `pipeline/steps/self-reflection.ts` | loopBack 重新檢索 + 重新生成 + 第二次 Judge 擇優 |
| LLM Judge | `pipeline/steps/judge.ts` | 接地性（0-1）+ 品質（1-4）雙評估，接地性不足自動加 disclaimer |
| Agentic ReAct Loop | `query.ts` agenticRetrieve() | ANSWER / RETRIEVE / BROADEN 多步決策 |
| Input Guardrails | `guardrails.ts` checkInput() | 36 種注入模式 + 11 種越獄模式偵測 |
| Output Guardrails | `guardrails.ts` checkOutput() | 長度限制 + 系統提示洩露偵測 |
| User Memory | `memory-extractor.ts` | 異步擷取攀登偏好、目標、經驗 |
| Personalization | `personalization.ts` | 記憶摘要 + 攀登歷史注入系統提示 |
| Token Budget | `rank.ts` | 等級制配額，原子扣除 + 斷線退還 |
| SSE Streaming | `ai.ts` | `?stream=true`，token / done / error 事件 |
| Semantic Cache | `pipeline/steps/semantic-cache.ts` | 向量相似度快取（閾值 0.95） |
| KV Cache | `query.ts` | TTL 精確快取 |
| Dynamic Config | `ai_config` 表 | 所有閾值 DB 可調，無需部署 |
| Dynamic Prompts | `ai_prompts` 表 | 提示詞 DB 管理，含變數驗證 |
| Pipeline Tracing | `ai_query_logs` | 全 pipeline JSON trace，含每階段詳細數據 |
| Model Tiering | 配置 | gemma-3-12b-it（主）+ llama-3.1-8b-instruct（輕量） |
| **Pipeline Admin UI** | `admin/ai/settings` | 步驟啟停/排序、分支配置、成本模擬、Guardrails 管理 |
| **Filter Building** | `pipeline/steps/filter-build.ts` | LLM 解析 + regex fallback，聊天歷史補充上下文相依查詢 |
| **SQL 澄清流程** | `pipeline/steps/text-to-sql.ts` | 模糊查詢 → 候選選項 → 用戶選擇確認 |

---

## 二、與業界模式對照

### 2.1 RAG 演進定位

| 世代 | 名稱 | 本專案覆蓋度 |
|------|------|-------------|
| Gen 1 | Naive RAG | ✅ 基礎已超越 |
| Gen 2 | Advanced RAG | ✅ **完整覆蓋**（HyDE、Reranking、CRAG、Hybrid Search、MMR） |
| Gen 3 | Modular RAG | ✅ **已達成**（14 步驟 Pipeline Engine，DB 驅動啟停/排序，dependency validation，並行分支基礎設施） |
| Gen 4 | Agentic RAG | ✅ 已實作（`agenticRetrieve()` ReAct Loop） |
| Gen 4+ | Agentic Graph RAG | ❌ 未實作 |

**定位**：本專案處於 **Gen 2 完整 + Gen 3 完整 + Gen 4 初期**階段，已超越多數生產系統。

### 2.2 架構模式覆蓋度

| 業界模式 | 狀態 | 實作細節 | 差距 |
|---------|------|---------|------|
| **Hybrid RAG**（生產基線）| ✅ 完整 | Vector + BM25 + RRF | 無 |
| **Adaptive RAG** | ✅ 完整 | QueryClassifier 五路路由（5 工具） | Tool Selection 信心分數、自動修正尚缺（見 2.3 差距 5） |
| **Corrective RAG** | ⚠️ 部分 | 難度過濾放寬重試 + similar-route fallback | 缺少個別文件相關性評估（見 2.3） |
| **Agentic RAG** | ✅ 已實作 | ReAct Loop + 3 種動作 | 僅 ReAct 策略，缺 Plan-and-Execute（見 2.3 差距 6）；預設 baseline，agentic 為 config 旗標 |
| **Self-RAG** | ✅ 已實作 | Judge + loopBack 重新檢索 + 重新生成 + 第二次 Judge 擇優 | 逐段歸因仍缺（見 2.3） |
| **Graph RAG** | ❌ 未實作 | — | 攀岩領域關係簡單，優先度低 |
| **Multi-Agent** | ❌ 未實作（Pipeline 模組化已覆蓋多數價值） | — | 見下方說明 |
| **Modular RAG** | ✅ 已實作 | 14 步驟 Pipeline Engine，DB 配置啟停/排序，dependency validation，並行分支 | 尚無 A/B pipeline 對比框架 |
| **Text-to-SQL** | ✅ 已實作 | 17 SQL 模板，澄清流程，Hybrid 模式 | — |

#### Multi-Agent 為何不需要

Multi-Agent 的核心價值（多來源檢索、品質驗證、查詢改寫、工具選擇、記憶管理、結果合併）已由本專案的 Pipeline 模組化覆蓋：

| Multi-Agent 典型角色 | 本專案等效實作 |
|---------------------|--------------|
| Retrieval Agent（搜文件） | `hybrid-search` 步驟（Vector + BM25） |
| SQL Agent（查資料庫） | `text-to-sql` 步驟（17 SQL 模板） |
| Critic Agent（驗品質） | `judge` + `self-reflection` 步驟 |
| Orchestrator（調度） | `PipelineEngine` + `tool-selection` |
| Memory Agent（記憶） | `memory-extractor` + `personalization` |
| Writer Agent（合併結果） | `llm-generation` + `popularity-rerank` |

差別是本專案的「Agent」是**確定性 Pipeline 步驟**而非各自有 LLM 大腦的獨立 Agent。在攀岩知識問答場景下更可控、更快、更省資源。Multi-Agent 的額外價值主要出現在跨系統整合（同時查內部資料庫 + 外部 API + 網頁爬蟲）和對抗式品質保證（兩個 Agent 互相挑戰），本專案暫無此需求。

### 2.3 具體差距分析

#### 差距 1：CRAG 深度不足
| 面向 | 業界標準 | 本專案現狀 |
|------|---------|-----------|
| 觸發條件 | 每份文件個別評估相關性 | 0 筆結果時觸發 + similar-route fallback |
| 評估方式 | LLM 評分每份文件：正確/不正確/模糊 | Cross-Encoder reranker 分數排序（無閾值過濾） |
| 修正動作 | 移除不相關文件 + 改寫查詢 + 替代來源 | 難度過濾放寬重試 + similar-route fallback + loopBack 重新檢索 |
| 影響 | 可能回傳低相關性文件給生成階段 | Reranking + self-reflection loopBack 部分補救 |

**改善進展**：`hybrid-search` 步驟已新增 similar-route fallback、multi-crag auto-k-doubling、excludes reference route 等機制。`self-reflection` 步驟的 loopBack 在低 groundedness 時觸發重新檢索。

**仍建議**：在 Cross-Encoder Reranking 後加入文件相關性閾值過濾（reranker score < 閾值的文件直接丟棄），從源頭減少低品質 context。成本低，效果顯著。

#### 差距 2：缺少系統性評估框架
| 面向 | 業界標準 | 本專案現狀 |
|------|---------|-----------|
| 黃金測試集 | 200+ 問答對，CI/CD 自動驗證 | ❌ 無 |
| RAGAS 指標 | Faithfulness、Answer Relevancy、Context Recall | ❌ 無自動化度量 |
| 回歸測試 | 每次 prompt/config 變更自動跑測試集 | ❌ 手動測試 |
| A/B 測試 | baseline vs agentic 統計對比 | ❌ 無框架 |
| 離線評估 | 定期批次跑評估 pipeline | ❌ 無 |

**影響**：無法量化 prompt 調整、config 變更、模型更換的影響。業界 60% 的 RAG 從第一天就納入系統性評估。

**建議（高優先度）**：
1. 建立 50-100 筆種子測試集（涵蓋 simple / complex / general_knowledge / edge case）
2. 實作離線評估腳本，計算 Recall@5、Faithfulness（用 LLM Judge 現有基礎）
3. 在 `ai_query_logs` 已有的 trace 資料上建立分析 dashboard

#### 差距 3：可觀測性深度
| 面向 | 業界標準 | 本專案現狀 |
|------|---------|-----------|
| 結構化 Tracing | OpenTelemetry / Langfuse 格式 | ✅ 有 pipeline_trace JSON（自訂格式） |
| Span 層級追蹤 | 每個元件獨立 span + 延遲 | ⚠️ 總延遲有，子階段延遲無 |
| 檢索品質監控 | Recall、MRR 趨勢 | ❌ 無長期趨勢 |
| Token 使用分析 | 按元件分析 token 消耗 | ✅ 已有分階段追蹤 |
| 異常偵測 | 自動告警 | ❌ 無 |

**建議**：
- 在 `pipeline_trace` 中加入每階段耗時（embedding_ms, search_ms, reranking_ms, generation_ms）
- 建立 `/admin/ai/metrics` 頁面展示長期趨勢

#### ~~差距 4：Modular RAG 可組合性~~（已解決）

**已實作**：Pipeline Engine（`pipeline/engine.ts`）提供完整的模組化架構：
- 14 個獨立步驟，各有 `requires`/`provides` 依賴宣告
- DB 驅動啟停和排序（Admin UI 管理）
- `skipWhen` 條件式路由（依查詢類型自動跳過不需要的步驟）
- 並行分支基礎設施（`cloneBranchContext` + `Promise.all` + fusion）
- `loopBack` 機制（self-reflection 觸發重新檢索）
- Phase cleanup（記憶體管理）

**剩餘差距**：尚無 A/B pipeline 對比框架（如同時跑兩組步驟配置並比較結果）。

#### 差距 5：Tool Selection 深度不足

Tool Selection（`tool-selection.ts`）功能完整但有 5 個可改善面向：

| 面向 | 業界標準 | 本專案現狀 |
|------|---------|-----------|
| 信心分數 | 工具選擇附帶 confidence，低信心時 fallback | ❌ 只回傳工具名，無信心分數 |
| 多工具組合 | 一次查詢可指定多個工具並行 | ⚠️ 僅 `hybrid` 類型固定組合 SQL + RAG |
| 選錯修正 | 觀察結果品質低時自動切換工具 | ❌ Agentic `RETRIEVE`/`BROADEN` 不會換工具 |
| 工具描述 | 從 Registry 動態生成 prompt | ❌ 5 個工具描述靜態硬寫在 prompt |
| 準確率追蹤 | 黃金測試集量化 Tool Accuracy | ❌ 無量化指標（屬評估框架缺口） |

**影響**：
- 選錯工具 → 回答品質下降（如統計問題用向量搜尋，結果不精確）
- 無信心分數 → 無法做智慧 fallback
- 準確率未知 → 無法評估 prompt 調整的影響

**建議**：
1. 信心分數（中優先度）：修改 `TOOL_SELECTION_PROMPT` 輸出 confidence，低信心啟用 fallback
2. 工具選錯修正（中優先度）：新增 Agentic `SWITCH_TOOL` 動作或 pipeline 內 fallback 邏輯
3. 準確率追蹤（高優先度）：隨黃金測試集（B1）一起建立，`expected_tool` 欄位量化 Tool Accuracy

#### 差距 6：Agentic RAG 僅有 ReAct 策略

Agentic RAG 有兩種執行策略，本專案僅實作第一種：

| 策略 | 適用場景 | 本專案 |
|------|---------|--------|
| **ReAct**（反應式） | 探索性查詢，無法預知需幾步 | ✅ 已實作（`agenticRetrieve`） |
| **Plan-and-Execute**（計畫式） | 結構明確、可分解為獨立子任務 | ❌ 未實作 |
| **Adaptive Plan**（混合） | 有計畫但可中途修改 | ❌ 未實作 |

**ReAct vs Plan-and-Execute 關鍵差異**：
- ReAct：每步 LLM 決策（循序），適應性高，延遲高
- Plan-and-Execute：開頭一次規劃 + 並行執行 + 合併，延遲低，適應性低
- 兩者**共存而非取代**，由查詢特性自動選擇

**建議**：目前 ReAct 已足夠處理本專案多數攀岩查詢。Plan-and-Execute 的最大價值在多實體比較查詢（「比較三個岩場」），此類查詢佔比需先評估。優先度低。

#### 差距 7：Pipeline 超時保護
| 面向 | 業界標準 | 本專案現狀 |
|------|---------|-----------|
| 全 pipeline 超時 | 總時鐘超時（如 30s） | ❌ 僅 Judge 有 timeout_ms |
| 熔斷器 | 連續失敗 N 次停止服務 | ❌ 無 |
| 降級策略 | 超時回退到快速模式 | ❌ 無 |

**建議**：加入 pipeline 級別超時，超時時直接返回已有結果（跳過 Judge / Self-Reflection），而非讓 Cloudflare Workers 30s 上限自然超時。

---

## 三、本專案優勢（業界領先面）

### 3.1 邊緣部署架構
- Cloudflare Workers 全球邊緣運算，天然低延遲
- Workers AI 無 per-token API 成本（包含在 Workers Paid Plan）
- Vectorize、D1、KV 全棧 Cloudflare 原生，無跨雲延遲
- **業界對比**：多數生產系統需要在中心化雲上運行，本專案邊緣部署是顯著優勢

### 3.2 Configuration-First 設計
- `ai_config` 動態配置，管理員可即時調整所有閾值
- `ai_prompts` DB 管理，支援 A/B 提示詞切換
- Pipeline 步驟啟停/排序 DB 驅動，Admin UI 可視化管理
- 無需程式碼變更即可調整行為
- **業界對比**：多數系統需要部署才能改配置，本專案設計領先

### 3.3 Modular Pipeline 架構
- 14 個獨立步驟，各有明確的 `requires`/`provides` 依賴宣告
- DB 驅動步驟啟停和排序，支援 dependency validation
- 並行分支基礎設施（`cloneBranchContext` + fusion）
- `loopBack` 機制實現 Self-RAG 的重新檢索能力
- `skipWhen` 條件式路由，依查詢類型自動跳過不需要的步驟
- Phase cleanup 記憶體管理，避免 Workers 記憶體壓力
- **業界對比**：達到 Gen 3 Modular RAG 水準，超越多數自建系統

### 3.4 成本效率
- 模型分層已落實（主模型 + 輕量模型）
- Adaptive Routing 避免簡單查詢走完整 pipeline
- Semantic Cache 減少重複生成
- Token Budget + 等級制配額防止濫用
- Text-to-SQL 直接查結構化資料，避免不必要的向量搜尋
- **業界對比**：符合業界成本優化最佳實踐

### 3.5 完整的 Pipeline Tracing
- 每次查詢記錄完整 JSON trace
- 涵蓋：過濾條件、檢索路徑、分數、決策、token 使用
- **業界對比**：自建 tracing 彈性高，雖非 OpenTelemetry 標準格式，但資訊完整度優秀

### 3.6 安全防護
- 輸入層：36 種注入模式 + 11 種越獄模式
- 輸出層：長度限制 + 系統提示洩露偵測
- Token Budget 防止資源耗盡
- 單 Agent 設計避免多 Agent 汙染風險
- **業界對比**：防護層次完整，符合 OWASP LLM Top 10

---

## 四、差距優先度排序

| 優先度 | 差距 | 影響 | 建議行動 | 預估工作量 |
|--------|------|------|---------|-----------|
| 🔴 高 | 缺少系統性評估框架 | 無法量化改動效果（含 Tool Accuracy） | 建立種子測試集 + 離線評估腳本 | 2-3 天 |
| 🟡 中 | Pipeline 超時保護 | 極端情況可能超時失敗 | 加入全 pipeline 超時 + 降級策略 | 0.5-1 天 |
| 🟡 中 | 子階段延遲追蹤 | 無法定位瓶頸 | pipeline_trace 加入各階段 ms | 0.5 天 |
| 🟡 中 | CRAG 深度 | 低相關文件可能進入生成 | Reranking 後加入相關性閾值過濾 | 0.5 天 |
| 🟡 中 | Tool Selection 信心分數 | 無法做智慧 fallback | TOOL_SELECTION_PROMPT 加 confidence 輸出 | 0.5 天 |
| 🟡 中 | 工具選錯無法自動修正 | 選錯工具時回答品質下降 | 新增 SWITCH_TOOL 動作或 pipeline fallback | 1 天 |
| ✅ 已解決 | ~~Modular RAG 可組合性~~ | ~~新策略需改程式碼~~ | Pipeline Engine 14 步驟 DB 配置 | 已完成 |
| ✅ 已解決 | ~~Self-RAG 重新檢索~~ | ~~低品質無法觸發重檢~~ | loopBack 機制已實作 | 已完成 |
| 🟢 低 | Agentic 僅 ReAct 策略 | 結構化多實體比較查詢效率低 | 評估 Plan-and-Execute 需求再決定 | 大 |
| 🟢 低 | Graph RAG | 多跳推理能力有限 | 攀岩領域關係簡單，暫不需要 | — |
| 🟢 低 | Multi-Agent | Pipeline 模組化已覆蓋多數價值 | 不建議引入 | — |
| ⚪ 建議 | 啟用 Agentic A/B 測試 | 未驗證 agentic vs baseline 效果差異 | 開啟 agentic + 收集對比數據 | 配置變更 |
| ⚪ 建議 | A/B Pipeline 對比框架 | 無法同時比較不同步驟配置 | 利用現有分支基礎設施建立 | 1-2 天 |

---

## 五、與業界指標對照

| 業界 KPI | 目標 | 本專案現狀 | 達標 |
|---------|------|-----------|------|
| Recall@5 | >= 0.85 | 未量測（無黃金測試集） | ❓ |
| RAGAS Faithfulness | >= 0.8 | LLM Judge groundedness 有，但非 RAGAS 格式 | ⚠️ |
| Tool Accuracy | >= 0.95 | 未量測（無黃金測試集 `expected_tool`） | ❓ |
| Citation Precision | >= 0.9 | 有 sources 返回，未量測精度 | ❓ |
| P95 延遲 | <= 2.5s | 有 latency_ms 記錄，未計算 P95 | ⚠️ |
| 每查詢成本 | 趨勢下降 | Workers AI 固定成本，無 per-token 計費 | ✅ |
| 幻覺偵測率 | 持續監控 | groundedness < 0.5 自動標記 | ✅ |

---

## 六、結論

### 整體評價

本專案 RAG 系統在**技術深度**上已達到業界 Advanced RAG + Modular RAG 的完整水準，並已踏入 Agentic RAG 階段。相比多數生產系統（業界 40-60% RAG 實作無法上線），本系統功能完整度、模組化程度、成本效率、安全防護均在水準之上。

近期重大進展：
- **Pipeline 模組化重構**：14 步驟 Pipeline Engine，DB 驅動配置，dependency validation，並行分支基礎設施
- **Text-to-SQL 整合**：17 個 SQL 模板，支援結構化資料查詢、個人攀登紀錄、澄清流程
- **Self-RAG 完善**：loopBack 重新檢索 + 重新生成 + 第二次 Judge 擇優機制
- **工具擴充**：從 3 個擴展至 5 個（新增 `sql_query`、`hybrid`）

### 最大差距

**系統性評估框架**是最關鍵的缺口。沒有量化評估，所有的 prompt 調整、config 變更、模型更換都是「盲飛」。業界 60% 的新 RAG 部署從第一天就納入評估，這是本專案最應優先補齊的能力。

### 已解決的差距

- ~~Modular RAG 可組合性~~ → Pipeline Engine 14 步驟 DB 配置
- ~~Self-RAG 重新檢索能力~~ → loopBack 機制
- ~~工具數量不足~~ → 5 個工具（含 Text-to-SQL 和 Hybrid）
- ~~Self-Reflection 未使用~~ → Judge + loopBack 取代原始 YES/NO 設計

### 不建議追求的方向

- **Graph RAG**：攀岩知識領域關係結構簡單（路線→岩場→區域），不需要多跳實體推理
- **Multi-Agent**：Pipeline 模組化已覆蓋多數 Multi-Agent 價值（多來源檢索、品質驗證、查詢改寫、記憶管理），多 Agent 增加的延遲、除錯複雜度與上下文汙染風險不值得
- **框架遷移**（LangGraph/LlamaIndex）：自建 Pipeline Engine 在 Cloudflare Workers 環境下效能和控制度更優
- **Plan-and-Execute**（短期）：多數攀岩查詢為探索性，ReAct 已足夠。需先評估多實體比較查詢佔比，再決定是否投資

### 建議下一步

1. **建立黃金測試集**（50-100 筆），含預期答案、`expected_tool` 和檢索來源
2. **實作離線評估腳本**，利用現有 LLM Judge 基礎計算 Faithfulness 和 Tool Accuracy
3. **Tool Selection 信心分數**，修改 TOOL_SELECTION_PROMPT 輸出 confidence
4. **加入 pipeline 超時保護**，防止極端情況
5. **在 pipeline_trace 加入子階段延遲**，建立效能監控基線
6. **工具選錯修正機制**，新增 SWITCH_TOOL 動作或 pipeline fallback
7. **啟用 Agentic 模式 A/B 測試**，量化 complex 查詢的效果差異
8. **清理 `SELF_REFLECTION_PROMPT` 死碼**，移除未使用的 prompt 定義
9. **啟用語意快取**，驗證 Vectorize 向量匹配流程
