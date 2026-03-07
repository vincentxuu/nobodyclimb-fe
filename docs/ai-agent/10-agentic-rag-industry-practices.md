# Agentic RAG 業界實務總覽（2026）

> 建立日期：2026-03-08
> 目的：整理業界 Agentic RAG 的定義、架構模式、生產實務與最佳做法，對照本專案現行系統
> 相關文件：`07-rag-strategy-proposals.md`、`backend/src/services/query.ts`

---

## 一、RAG 演進光譜

| 世代 | 名稱 | 特徵 |
|------|------|------|
| Gen 1 | Naive RAG | 單一向量檢索 → 一次生成，無迭代 |
| Gen 2 | Advanced RAG | 查詢改寫（HyDE）、後處理（Reranking、CRAG）、混合搜尋（Vector + BM25），仍為固定 pipeline |
| Gen 3 | Modular RAG | 可組合模組化架構，支援 A/B 測試 |
| **Gen 4** | **Agentic RAG** | **自主控制迴圈**：LLM 決定何時、如何、是否檢索，具備規劃、工具呼叫、自我修正、記憶 |
| Gen 4+ | Agentic Graph RAG | 結合知識圖譜走訪 + Agent 規劃，處理多跳實體推理 |

**核心差異**：Classic RAG 是 DAG（有向無環圖），資料單向流動；Agentic RAG 引入**迴圈**（cycle）——檢索、推理、決策、再檢索或停止。

---

## 二、Agentic RAG 五大特徵

| 特徵 | 說明 |
|------|------|
| **靈活性** | 可存取多個知識庫，不限單一資料集 |
| **適應性** | 被動查詢轉為智慧問題解決 |
| **準確性** | 迭代驗證取代一次性生成 |
| **可擴展性** | Agent 網路處理多元查詢類型 |
| **多模態** | 可處理圖片、音訊、結構化資料 |

---

## 三、業界架構模式

### 3.1 Single-Agent RAG（ReAct Loop）

最基礎的 Agentic 模式，單一 Agent 在 ReAct 迴圈中操作檢索工具：

```
User Query → Agent 推理 → 呼叫檢索工具 → 評估結果
  → 足夠？ → 生成答案
  → 不足？ → 改寫查詢、再次檢索（迴圈）
```

**本專案的 Agentic Mode（E）即為此模式**，透過 `agenticRetrieve()` 實現 ANSWER / RETRIEVE / BROADEN 決策迴圈。

### 3.2 Multi-Agent RAG（多 Agent 協作）

多個專責 Agent 分工：

| Agent | 職責 |
|-------|------|
| Routing Agent | 決定查詢哪些知識來源 |
| Query Planning Agent | 將複雜查詢分解為子查詢 |
| Retrieval Agent(s) | 領域專屬檢索器 |
| Validation Agent | 驗證事實性和接地性 |
| Synthesis Agent | 合併結果為連貫回應 |

**三層架構**：

```
┌─────────────────────────────────────────┐
│          Orchestration Layer            │
│  意圖分類 → 路由決策 → 工具選擇 → 協調  │
├─────────────────────────────────────────┤
│           Execution Layer               │
│  RAG 檢索 │ 工具執行 │ LLM 推理        │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│  模型閘道 │ 向量 DB │ 可觀測性 │ 快取   │
└─────────────────────────────────────────┘
```

**生產洞察**：智慧路由（不是每個查詢都走完整 RAG）可降低 ~40% 成本、~35% 延遲。

### 3.3 Graph RAG（知識圖譜 + 向量搜尋）

結合結構化知識圖譜與向量相似度搜尋，用於**多跳推理**：

- Microsoft GraphRAG 建構實體關係圖，支援主題層級查詢
- 生產結果：多跳查詢準確率提升 **340%**，幻覺率降低 **65%**
- **適用場景**：關係密集領域（法律研究、藥物研發、合規審計）

### 3.4 Adaptive / Router-Based RAG

用輕量分類器將查詢路由到最佳 pipeline：

```
Query → Classifier →
  簡單查詢  → 直接 LLM（不檢索）
  中等查詢  → 標準 RAG（單次檢索）
  複雜查詢  → Agentic RAG（多步驟）
```

**本專案已實作此模式**：`QueryClassifier` 在 simple / complex / general_knowledge 之間路由。

### 3.5 Corrective RAG（CRAG）

檢索後評估文件品質：
- **正確**（相關）→ 繼續生成
- **不正確**（不相關）→ 觸發替代檢索或網路搜尋
- **模糊**（不確定）→ 改寫重試

**本專案已實作**：RRF 合併後 0 筆結果且有難度過濾時，移除過濾條件重試。

### 3.6 Self-RAG

模型自行決定何時檢索並自我評判輸出：
- 減少不必要的檢索呼叫
- 為每段生成提供信心評分
- 透過自我評估改善事實性

### 模式總覽

| # | 架構 | 生產狀態 | 最適場景 |
|---|------|---------|---------|
| 1 | Naive RAG | 僅早期 | 簡單 FAQ |
| 2 | **Hybrid RAG** | **生產基線** | 企業搜尋 |
| 3 | Graph RAG | 採用增長中 | 多跳推理、合規 |
| 4 | Contextual RAG | 專用場景 | 長文件分析 |
| 5 | **Adaptive RAG** | **廣泛採用** | 混合複雜度工作負載 |
| 6 | **Agentic RAG** | 快速成長 | 複雜多來源工作流 |
| 7 | Self-RAG | 新興 | 高風險監管領域 |
| 8 | Modular RAG | 企業標準 | 多部門平台 |
| 9 | Agentic Graph RAG | 前沿 | 詐欺偵測、訴訟 |
| 10 | Hybrid + Vector | 生產標準 | 精確 + 語意匹配 |

**業界共識**：先建好 Hybrid RAG 基線，再視推理深度需求升級到 Graph 或 Agentic。

---

## 四、關鍵技術元件

### 4.1 查詢規劃與分解

多步驟 Agentic 檢索會將複雜查詢自適應地分解為子問題：
- Query Planning Agent 將多部分問題拆為子查詢
- 子查詢可並行或依序分派
- 結果以一致性投票機制合併
- 常見模式：兩層 master / sub-agent 層級

### 4.2 工具呼叫（Tool Use）

在 Agentic RAG 中，檢索變成 Agent 可呼叫的**工具**：

```typescript
tools = [
  { name: "vector_search", fn: vectorSearchTool },
  { name: "bm25_search", fn: bm25SearchTool },
  { name: "sql_query", fn: sqlQueryTool },
  { name: "knowledge_graph", fn: kgTool },
  { name: "web_search", fn: webSearchTool }
];

agent.run(query, tools, maxSteps = 5);
```

Agent 根據查詢分析選擇並呼叫專門工具（文字、表格、知識圖譜、資料庫）。

### 4.3 多步驟推理模式

| 模式 | 運作方式 | 最適場景 | 成本影響 |
|------|---------|---------|---------|
| **ReAct** | 逐步動態推理，每步根據結果調整 | 探索性任務、開放式研究 | 中等 |
| **Plan-and-Execute** | 先建完整計畫，再逐步執行 | 結構化任務 | **可降低 90% 成本**（貴模型規劃、便宜模型執行） |
| **LATS** | 樹狀搜索推理路徑，失敗可回溯 | 高不確定性任務 | 較高 |

### 4.4 自我反思與修正

自我改進的 Agentic RAG 迴圈：
1. **嘗試**：從檢索上下文生成答案
2. **評估**：自評答案品質（完整性、準確性、接地性）
3. **辨識**：判斷哪裡有誤或缺漏
4. **改進**：補充檢索證據、重組上下文或重新生成

**本專案已實作**：`SELF_REFLECTION_PROMPT` 評估答案是否完整，YES/NO 判斷，NO 時觸發重新生成。

### 4.5 記憶系統

業界 Agent 記憶分為三類：

| 類型 | 用途 | 實作方式 |
|------|------|---------|
| **情節記憶**（Episodic） | 回憶特定事件/經驗 | 儲存發生了什麼、何時、結果 |
| **語意記憶**（Semantic） | 領域專門知識 | 整合 RAG、領域專業 |
| **程序記憶**（Procedural） | 如何執行任務 | 學習到的模式、優化工作流 |

**新興趨勢 — Agentic Memory**：使用 Zettelkasten 風格的筆記結構，每個記憶單元以 LLM 生成關鍵字、標籤和語境描述。

**本專案已實作**：用戶記憶擷取（`extractMemoriesFromQuery`）、記憶摘要（`getMemoriesSummary`）、攀登歷史個人化。

### 4.6 檢索策略

| 策略 | 效果 | 本專案狀態 |
|------|------|-----------|
| Hybrid Search（Vector + BM25） | 精準度提升 15-30% | ✅ 已實作 |
| Cross-Encoder Reranking | 顯著改善準確率 | ✅ 已實作 |
| Iterative Retrieval | 核心 Agentic 模式 | ✅ 已設計 |
| HyDE | 改善 complex 查詢 recall | ✅ 已實作 |
| RRF 合併 | 多路結果融合 | ✅ 已實作 |

---

## 五、生產框架比較

| 框架 | 最適場景 | Agentic RAG 方式 | 關鍵優勢 |
|------|---------|-----------------|---------|
| **LangGraph** | 複雜有狀態工作流 | 圖節點 + 邊；原生支援迴圈 | 最靈活的自訂 Agentic 模式 |
| **LlamaIndex Workflows** | 文件密集 RAG | AgentWorkflow 結合 RAG + 多 Agent | 最佳檢索準確率（+35%） |
| **CrewAI** | 角色制團隊 | 角色協作（研究員、驗證員、撰寫員） | 部署速度快 **5.7x** |
| **AutoGen** | 對話式 Agent | 將工作流視為 Agent 對話 | 企業級人機互動 |
| **Semantic Kernel** | .NET 企業 | Azure / .NET 深度整合 | 微軟生態系 |
| **OpenAI Agents SDK** | 快速原型 | 內建工具 + 交接 | 最容易上手 |

**新興趨勢 — Agentic Mesh**：業界逐漸走向模組生態系，LangGraph 「大腦」可協調 CrewAI「行銷團隊」，同時呼叫 OpenAI 工具處理子任務。單框架鎖定正在減少。

---

## 六、生產實務

### 6.1 常見陷阱與解決方案

| 陷阱 | 影響 | 解決方案 |
|------|------|---------|
| **Token 失控** | 冗餘 API 呼叫侵蝕 ROI | 模型分層（貴模型規劃、便宜模型執行） |
| **Agent 蔓延** | 不協調的 Agent 造成治理真空 | 集中式 Orchestration 層 |
| **無限迴圈** | 資源耗盡、成本爆炸 | 最大步數限制 + 時鐘超時 + 熔斷器 |
| **檢索品質不足** | 40-60% RAG 實作無法上線 | Hybrid Search + Reranking 基線 |
| **過時上下文** | 回應含過期資訊 | Webhook 觸發索引、內容雜湊快取過期 |
| **Prompt Injection** | Agent 被惡意輸入操縱 | 輸入/輸出過濾、工具白名單、Schema 驗證 |

**關鍵統計**：Gartner 預測 2027 年前超過 40% 的 Agentic AI 專案可能因成本、複雜度或風險而被取消。

### 6.2 成本優化策略

| 策略 | 說明 | 效果 |
|------|------|------|
| **模型分層** | 貴模型負責推理/規劃，便宜模型負責執行 | Plan-and-Execute 可降低 90% 成本 |
| **智慧路由** | 分類查詢複雜度，簡單查詢跳過檢索 | 降低 ~40% 成本、~35% 延遲 |
| **語意快取** | 對語意相似的查詢快取回應 | 重複查詢零成本 |
| **上下文壓縮** | 截斷至關鍵資訊，MMR 去冗餘 | 降低生成 token 成本 |
| **工具深度上限** | 每查詢設成本預算和迭代上限 | 防止意外超支 |

### 6.3 延遲管理

- **邊緣部署**可達到亞 100ms 回應時間（Agent 靠近用戶、資料靠近 Agent、推理靠近資料）
- **盲目檢索增加 200-500ms 延遲** — 智慧路由可避免簡單查詢的不必要檢索
- **生產目標**：P95 端到端延遲 ≤ 2.5 秒

### 6.4 評估與可觀測性

**60% 新 RAG 部署從第一天就納入系統性評估**（2025 初不到 30%）。

**關鍵指標**：

| 類別 | 指標 | 目標 |
|------|------|------|
| 檢索品質 | Recall@K, MRR, nDCG | Recall@5 >= 0.85 |
| 答案品質（RAGAS） | Faithfulness, Answer Relevancy | Faithfulness >= 0.8 |
| 引用品質 | Citation Precision | >= 0.9 |
| 延遲 | P95 端到端 | <= 2.5 秒 |
| 成本 | 每解決查詢 | 趨勢下降 |
| 幻覺 | 偵測率 | 持續監控降低 |

**主流可觀測性平台**：

| 平台 | 特色 |
|------|------|
| **Langfuse** | 開源 tracing，開源技術棧最受歡迎 |
| **LangSmith** | LangChain 原生除錯 |
| **Maxim AI** | 模擬 + 評估 + 可觀測性一體 |
| **Arize** | ML 監控 + Agent 支援 |
| **Galileo** | RAG 專用評估 |

---

## 七、本專案對照分析

### 已實作的業界模式

| 業界模式 | 本專案實作 | 狀態 |
|---------|-----------|------|
| Adaptive RAG / Router | `QueryClassifier`（simple / complex / general_knowledge） | ✅ |
| Hybrid Search | Vector (Vectorize) + BM25 (D1 FTS5) + RRF | ✅ |
| Corrective RAG | 難度過濾放寬重試 | ✅ |
| HyDE | complex 查詢產生假設文件 | ✅ |
| Multi-Query Expansion | LLM 生成 N 路子查詢 | ✅ |
| Reranking | LLM 交叉編碼器風格 + 熱門度加權 | ✅ |
| MMR 多樣性 | Maximal Marginal Relevance | ✅ |
| Self-Reflection | YES/NO 完整性檢查 + 重新生成 | ✅ |
| Input/Output Guardrails | 模式匹配 + 白名單檢查 | ✅ |
| Judge / Groundedness | LLM 接地性評估（async） | ✅ |
| Agentic ReAct Loop | `agenticRetrieve()` + ANSWER/RETRIEVE/BROADEN | ✅（config 旗標後） |
| Memory | 用戶記憶擷取 + 個人化 | ✅ |
| Quota / Token Budget | 等級制每日配額、token 追蹤 | ✅ |
| SSE Streaming | `?stream=true` + token 事件 | ✅ |

### 尚未實作

| 模式 | 說明 | 優先度 |
|------|------|--------|
| Graph RAG | 知識圖譜 + 實體關係走訪 | 低（攀岩資料關係較簡單） |
| Multi-Agent | 多 Agent 協作 | 低（單 Agent 足夠） |
| 動態工具選擇 | Agent 自選檢索工具 | 中（目前硬編碼） |
| Plan-and-Execute | 先規劃再執行 | 中（可降低成本） |
| 語意快取 | 向量相似度快取 near-miss | 中（目前僅精確快取） |

### 本專案優勢

1. **完整 Advanced RAG Pipeline**：HyDE、Multi-Query、CRAG、Reranking、MMR、Self-Reflection、Judge 全具備
2. **Adaptive Routing**：QueryClassifier 已實作，符合業界 Adaptive RAG 模式
3. **Agentic Mode 已設計實作**：`agenticRetrieve()` 實現正規 ReAct 迴圈
4. **成本效率**：Cloudflare Workers AI 避免 per-token API 成本
5. **邊緣部署**：Cloudflare Workers 提供亞 100ms 網路延遲優勢
6. **模型分層**：已使用（gemma-3-12b-it 主生成、llama-3.1-8b-instruct 輕量任務）

---

## 八、最佳做法

### 何時使用 Agentic vs Non-Agentic

**使用 Baseline（Non-Agentic）**：
- 查詢直接明確，單步查找
- 初次檢索即可能足夠
- 延遲和可預測性是關鍵
- 需最小化每查詢成本
- 領域狹窄且索引完善

**使用 Agentic**：
- 問題需多跳推理
- 相關資訊分散在多個來源
- 初次檢索品質不確定
- 查詢模糊或複雜
- 自我修正可顯著改善結果

**本專案方式正確**：simple 走 Baseline、complex 走 Agentic。

### 評估 Agentic RAG 品質

1. 建立**黃金測試集**（200+ 問題 + 預期答案）
2. 度量檢索：Recall@5 >= 0.85
3. 度量生成：RAGAS Faithfulness >= 0.8、Citation Precision >= 0.9
4. 監控營運 KPI：P95 延遲 <= 2.5s、每查詢成本趨勢下降
5. 追蹤業務指標：任務完成率、用戶滿意度
6. 定期紅隊測試：Prompt Injection、資料洩露、幻覺觸發

### Agent 迴圈安全

| 措施 | 本專案 | 業界建議 |
|------|--------|---------|
| 最大迭代次數 | `agentic_max_steps: 3` | 3-5 次 |
| 時鐘超時 | `judge_timeout_ms` 模式 | 應擴展至全 pipeline |
| 成本預算 | token 追蹤 | 每查詢 token 上限 + 熔斷器 |
| 工具白名單 | 硬編碼工具 | 只允許預設工具 |
| 輸入/輸出防護 | `checkInput` / `checkOutput` | 業界標準做法 |

**關鍵風險**：在多 Agent 系統中，單一被攻破的 Agent 可在 4 小時內汙染 87% 的下游決策。本專案的單 Agent 方式避免了此風險。

---

## 九、具體建議

| 建議 | 說明 | 優先度 |
|------|------|--------|
| 啟用 `rag_strategy: 'agentic'` | 實作完善，可 A/B 測試與 Baseline 對比 | 高 |
| 評估 Cloudflare AI Search | 全 CF 原生棧可簡化基礎設施，但犧牲精細控制 | 中 |
| 新增語意快取 | KV 精確快取已有，向量相似度快取可捕捉 near-miss | 中 |
| 建立黃金測試集 | 200+ 攀岩查詢 + 預期答案，每次部署自動 RAGAS 評估 | 高 |
| **不急著多 Agent** | 單 Agent ReAct 對攀岩知識庫已足夠，多 Agent 增加複雜度與治理成本 | — |

---

## 十、參考資料

| 來源 | 主題 |
|------|------|
| [NVIDIA: Traditional vs Agentic RAG](https://developer.nvidia.com/blog/traditional-rag-vs-agentic-rag-why-ai-agents-need-dynamic-knowledge-to-get-smarter/) | 定義與差異 |
| [IBM: What is Agentic RAG?](https://www.ibm.com/think/topics/agentic-rag) | 概念與五大特徵 |
| [Towards Data Science: Pipeline to Control Loop](https://towardsdatascience.com/agentic-rag-vs-classic-rag-from-a-pipeline-to-a-control-loop/) | 架構演進 |
| [Adaline Labs: Production Agentic RAG](https://labs.adaline.ai/p/building-production-ready-agentic) | 三層架構設計 |
| [Techment: 10 RAG Architectures 2026](https://www.techment.com/blogs/rag-architectures-enterprise-use-cases-2026/) | 架構模式總覽 |
| [Data Nucleus: Enterprise Guide 2026](https://datanucleus.dev/rag-and-agentic-ai/agentic-rag-enterprise-guide-2026) | 企業實務 |
| [LangWatch: Ultimate RAG Blueprint](https://langwatch.ai/blog/the-ultimate-rag-blueprint-everything-you-need-to-know-about-rag-in-2025-2026) | 全面指南 |
| [Cloudflare: Introducing AutoRAG](https://blog.cloudflare.com/introducing-autorag-on-cloudflare/) | CF 原生 RAG |
| [Cloudflare: Agentic at the Edge](https://dev.to/onepoint/architecting-agentic-systems-at-the-edge-a-technical-strategic-analysis-of-the-cloudflare-3761) | 邊緣 Agent 架構 |
| [Redis: Agentic RAG for Enterprises](https://redis.io/blog/agentic-rag-how-enterprises-are-surmounting-the-limits-of-traditional-rag/) | 企業應用 |
| [Qdrant: What is Agentic RAG?](https://qdrant.tech/articles/agentic-rag/) | 向量 DB 視角 |
| [LangGraph: Adaptive RAG](https://langchain-ai.github.io/langgraph/tutorials/rag/langgraph_adaptive_rag/) | Adaptive RAG 教學 |
| [Maxim AI: RAG Evaluation Tools 2026](https://www.getmaxim.ai/articles/the-5-best-rag-evaluation-tools-you-should-know-in-2026/) | 評估工具 |
| [Gartner: Agentic AI Trends](https://machinelearningmastery.com/7-agentic-ai-trends-to-watch-in-2026/) | 市場預測 |
| [arxiv: Agentic RAG Survey](https://arxiv.org/abs/2501.09136) | 學術綜述 |
| [arxiv: A-MEM](https://arxiv.org/abs/2502.12110) | Agentic Memory |
| [Fluree: GraphRAG 2026](https://flur.ee/fluree-blog/graphrag-knowledge-graphs-making-your-data-ai-ready-for-2026/) | 知識圖譜 RAG |
