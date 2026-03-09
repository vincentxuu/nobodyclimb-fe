# Graph RAG 延伸應用研究：業界實踐與攀岩平台潛力

> 建立日期：2026-03-08
> 背景：`11-rag-improvement-tasks.md` 將 Graph RAG 列為「攀岩資料關係較簡單，暫不需要」排除項目
> 目的：重新審視 Graph RAG 的業界應用場景，探索攀岩社群平台的延伸可能性
> 相關文件：`10-agentic-rag-industry-practices.md`、`12-rag-gap-analysis.md`

---

## 一、Graph RAG 核心概念

### 1.1 什麼是 Graph RAG

**Graph RAG（Graph Retrieval-Augmented Generation）** 是一種以**知識圖譜**取代或增強傳統向量檢索的 RAG 架構。不同於將文件以扁平向量存入向量資料庫，Graph RAG 將**實體**建模為節點（Node）、**關係**建模為邊（Edge），透過圖結構實現結構化推理。

源自 Microsoft Research 2024 年論文 *"From Local to Global: A Graph RAG Approach to Query-Focused Summarization"*，核心洞見是：**傳統 RAG 在需要跨整個語料庫進行全域理解的查詢中表現不佳**。

### 1.2 與傳統 Vector RAG 的關鍵差異

| 面向 | 傳統 Vector RAG | Graph RAG |
|------|----------------|-----------|
| **資料結構** | 扁平向量（vector DB） | 節點 + 邊（圖資料庫） |
| **檢索方式** | 餘弦相似度 / ANN 搜尋 | 圖遍歷、社群摘要、Cypher 查詢 |
| **推理能力** | 單跳相似度匹配 | 多跳關係鏈推理 |
| **上下文範圍** | 局部（chunk 級別） | 全域（語料庫級別，透過社群摘要） |
| **查詢類型** | 「找出最相似的文件」 | 「整個資料集的主題模式是什麼？」 |
| **可解釋性** | 低（不透明的向量） | 高（可追蹤的實體-關係路徑） |
| **成本** | 索引便宜，查詢便宜 | 索引昂貴（需 LLM 抽取），查詢視模式而定 |

### 1.3 核心架構流程

```
文件語料庫
    │
    ▼
┌──────────────────────┐
│ 1. 文件分塊（Chunking）│
└──────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│ 2. 實體與關係抽取（LLM 驅動）      │
│    • 實體：名稱、類型、描述         │
│    • 關係：來源、目標、描述         │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│ 3. 圖建構與合併                    │
│    • 同名實體合併                   │
│    • 多描述 LLM 摘要               │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│ 4. 階層式社群偵測（Leiden 演算法）   │
│    • 多層級社群結構                  │
│    • 細粒度 → 粗粒度               │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│ 5. 社群報告生成                    │
│    • 由下而上遞迴摘要               │
│    • 每個社群的實體、關係、主要論述   │
└──────────────────────────────────┘
```

### 1.4 兩種查詢模式

| 模式 | 說明 | 適用場景 |
|------|------|---------|
| **Local Search** | 從特定實體出發，遍歷鄰居節點，收集相鄰上下文 | 具體事實查詢（「龍洞黃金谷有哪些路線？」） |
| **Global Search** | Map-Reduce 方式——每個社群摘要獨立回答，再合併為全域回應 | 主題/趨勢查詢（「台灣攀岩的整體發展趨勢？」） |

---

## 二、業界主要實作方案

### 2.1 Microsoft GraphRAG

最知名的開源實作（[github.com/microsoft/graphrag](https://github.com/microsoft/graphrag)）。

**四層架構**：
1. **Ingestion Layer**：文件處理與分塊
2. **Graph Construction Layer**：LLM 驅動的實體/關係抽取
3. **Community Detection Layer**：Leiden 階層式聚類
4. **Query Layer**：Local Search + Global Search

**特點**：Factory Pattern 模組化設計，支援自訂模型、儲存、Provider。

### 2.2 Microsoft LazyGraphRAG（2025 重大突破）

Graph RAG 生態系最重要的發展——**解決了索引成本過高的核心問題**。

| 面向 | 完整 GraphRAG | LazyGraphRAG |
|------|-------------|-------------|
| 索引方式 | LLM 抽取實體/關係/社群摘要 | NLP 名詞短語抽取（無 LLM） |
| 索引成本 | 高（大量 LLM 呼叫） | 與 Vector RAG 相同（**僅 0.1%**） |
| 查詢成本 | Global Search 昂貴 | **降低 700 倍** |
| LLM 使用時機 | 索引時 + 查詢時 | **僅查詢時**（延遲 LLM 使用） |
| 品質 | 基準線 | 與完整 GraphRAG 品質相當 |

**核心理念**：將所有 LLM 計算延遲到查詢時，索引只做低成本的 NLP 處理。這對資源受限的環境（如 Cloudflare Workers）特別有意義。

### 2.3 Neo4j GraphRAG

- **neo4j-graphrag-python**：官方 Python 套件
- **LLM Knowledge Graph Builder**：非結構化資料 → 知識圖譜的開源工具
- 原生支援圖查詢 + 向量索引（單一資料庫同時處理）
- 提供 GraphAcademy 免費課程

### 2.4 LlamaIndex

- **PropertyGraphIndex**：知識圖譜 RAG 的核心抽象
- 組件：`GraphRAGExtractor`、`GraphRAGStore`、`GraphRAGQueryEngine`
- 檢索器：`LLMSynonymRetriever`、`VectorContextRetriever`、`TextToCypherRetriever`

### 2.5 輕量級替代方案

| 框架 | 核心特點 | 成本優勢 |
|------|---------|---------|
| **LazyGraphRAG** | 無預摘要，NLP 名詞抽取 | 索引成本 0.1%，查詢成本 1/700 |
| **LightRAG** | 雙層級檢索（低階+高階） | Token 減少 6000 倍，延遲降低 ~30% |
| **HippoRAG** | 神經生物學啟發的檢索 | 多跳推理成本降低 10-30 倍 |
| **Fast-GraphRAG** | 自訂 PageRank 節點相關性 | 快速子圖識別 |

---

## 三、Graph RAG 相對於 Vector RAG 的核心優勢

### 3.1 多跳推理（Multi-Hop Reasoning）

知識圖譜以節點-邊網路儲存資料，允許 RAG 應用沿著邏輯連接從一個資訊跳到另一個。

**攀岩例子**：
- 「哪些岩場適合從 5.10 進階到 5.11 的攀岩者？」
  - 需要：攀岩者 → 歷史紀錄 → 已完成的 5.10 路線 → 同岩場的 5.11 路線 → 路線風格相似度
  - Vector RAG：只能找到「5.10」或「5.11」相關的文件 chunk
  - Graph RAG：沿著關係鏈推理，找出路線風格銜接合理的進階選擇

### 3.2 關係發現（Relationship Discovery）

Graph RAG 可以映射出使用者偏好、行為和外部趨勢之間的關係。

**業界案例**：某電商平台整合 Graph RAG 將購買歷史、產品評論和社交趨勢連結，**轉換率提升 25%**。

### 3.3 全域摘要（Global Summarization）

針對百萬 token 級別的語料庫，GraphRAG 的全域理解能力顯著領先：
- **完整性**：72-83% 勝率 vs 傳統 RAG
- **多樣性**：62-82% 勝率 vs 傳統 RAG
- **Token 效率**：根層級摘要最高節省 97% token

### 3.4 可解釋性與可追蹤性

每個答案都可以回溯到特定的實體-關係路徑，提供完整的稽核軌跡。在醫療、金融、法律等受監管產業至關重要。

### 3.5 精確度

結合知識圖譜與向量搜尋，在結構化領域中搜尋精確度可達 **99%**（企業基準測試）。

---

## 四、業界實際應用場景

### 4.1 內容與社群平台

| 應用 | 說明 |
|------|------|
| **LinkedIn** | 建構客服 Q&A 系統，結合 RAG + 知識圖譜，從歷史問題建構圖，考慮問題內部結構和問題間關係 |
| **內容發現平台** | 使用實體圖譜呈現文章、使用者、主題之間的主題連結 |
| **推薦系統** | 電商平台連結購買歷史、評論、社交趨勢，發現向量相似度無法偵測的隱藏模式 |

### 4.2 醫療與科學

| 應用 | 說明 |
|------|------|
| **個人化治療計畫** | 整合病歷、醫學文獻、臨床指南的多跳推理 |
| **藥物交互作用分析** | 跨實體推理（患者 → 病症 → 用藥 → 交互作用） |
| **科學研究** | Microsoft Discovery 平台使用 GraphRAG 進行代理式科學研究工作流 |

### 4.3 金融與法律

| 應用 | 說明 |
|------|------|
| **風險評估** | 跨公司、產業、市場的關係圖譜風險傳導分析 |
| **法律研究** | 結合判例法、法規、監管指南的結構化推理 |
| **合規監控** | 完整可追蹤的推理路徑，滿足稽核要求 |

### 4.4 企業 IT

| 應用 | 說明 |
|------|------|
| **微服務架構推理** | 跨服務、資產、工作流的複雜關係推理 |
| **知識庫整合** | 將結構化 metadata 與非結構化文件整合為一致的知識庫 |

---

## 五、Hybrid RAG：2026 年生產環境的主流架構

### 5.1 為什麼 Hybrid 是標準答案

**Hybrid RAG 是 2026 年多數企業的生產基線**。架構理念：**向量做廣度，圖做深度**。

### 5.2 架構模式

```
使用者查詢
    │
    ▼
┌──────────────────┐
│ Query Router      │ ── 決定檢索策略
└──────────────────┘
    │           │
    ▼           ▼
┌────────┐  ┌─────────┐
│ Vector │  │ Graph   │
│ Search │  │ Search  │
│ (ANN)  │  │(Cypher) │
└────────┘  └─────────┘
    │           │
    ▼           ▼
┌──────────────────┐
│ Result Fusion    │ ── 合併與重排序
└──────────────────┘
    │
    ▼
┌──────────────────┐
│ LLM Generation   │ ── 合成最終回答
└──────────────────┘
```

### 5.3 運作方式

1. **Vector Search**：提供廣泛的語意相似度檢索（初始候選）
2. **Graph Traversal**：擴展結構化、關係豐富的上下文（關係擴展）
3. **Fusion Layer**：合併與重排序兩個來源的結果
4. **LLM Generation**：結合語意與結構上下文合成最終回應

### 5.4 實作方式

| 方式 | 說明 |
|------|------|
| **Neo4j** | 圖資料庫原生向量索引（單一資料庫同時處理） |
| **Qdrant + Neo4j** | 獨立向量 DB 與圖 DB，加上調度層 |
| **LlamaIndex** | PropertyGraphIndex + VectorContextRetriever + 圖遍歷 |

---

## 六、Graph RAG 的挑戰與限制

### 6.1 高索引成本

完整 GraphRAG 需要大量 LLM 呼叫進行實體抽取、關係描述、社群摘要。LazyGraphRAG 將成本降至 0.1%，但查詢時仍需 LLM。

### 6.2 實體解析精確度

**實體解析精確度低於 85% 會使整個系統不可靠。** 每次圖遍歷都會複合錯誤——錯別字、別名、模糊引用都會降低品質。

### 6.3 擴展性挑戰

- 超過百萬實體後，圖分割變得關鍵
- 管理非結構化資料 + 圖查詢增加基礎設施複雜度
- 維護兩套資料儲存（向量 + 圖）增加營運負擔

### 6.4 精確度風險

部分研究顯示 GraphRAG 在 Natural Questions 上精確度**低 13.4%**，特別在時間敏感查詢表現不佳。結構複雜度也可能導致**更多幻覺**。

### 6.5 何時 Graph RAG 不划算

業界共識：**Graph RAG 的價值與查詢複雜度成正比**。

| 查詢類型 | 建議方案 |
|---------|---------|
| 簡單事實查詢 | 傳統 Vector RAG（Graph RAG 只是增加開銷） |
| 多跳推理 | Graph RAG 或 Hybrid RAG |
| 全域主題摘要 | Graph RAG（Global Search） |
| 成本敏感、大語料 | LazyGraphRAG 或 LightRAG |
| 受監管產業（需稽核軌跡） | Graph RAG（可解釋路徑） |
| 即時、低延遲 | LightRAG（~80ms）或 Vector RAG |
| 混合查詢類型 | Hybrid RAG |

---

## 七、攀岩社群平台的 Graph RAG 延伸應用

### 7.1 重新審視「攀岩資料關係較簡單」的假設

先前評估認為攀岩領域關係結構簡單（路線→岩場→區域），不需要多跳推理。但深入分析後，攀岩知識域實際上存在**豐富的隱性關係網路**：

```
┌─────────┐     位於     ┌─────────┐     位於     ┌──────┐
│  路線    │────────────▶│  岩場    │────────────▶│ 區域  │
└─────────┘             └─────────┘             └──────┘
    │                       │                       │
    │ 難度                   │ 季節                   │ 交通
    │ 類型                   │ 天氣                   │ 住宿
    │ 風格                   │ 設施
    ▼                       ▼
┌─────────┐             ┌─────────┐
│ 難度系統 │             │ 攀登條件 │
└─────────┘             └─────────┘

┌─────────┐    完攀     ┌─────────┐     拍攝     ┌──────────┐
│ 攀岩者   │───────────▶│  路線    │◀───────────│ YouTube  │
└─────────┘             └─────────┘             │ 影片/頻道 │
    │                       │                   └──────────┘
    │ 偏好                   │ 相似
    │ 等級                   │ 進階建議
    │ 故事                   │ 裝備需求
    ▼                       ▼
┌─────────┐             ┌──────────┐
│ 個人檔案 │             │ 路線群組  │
│ 記憶     │             │（風格/難度）│
└─────────┘             └──────────┘
```

### 7.2 具體應用場景

#### 場景 A：智慧進階路線推薦（多跳推理）

**使用者查詢**：「我完攀了龍洞黃金谷的幾條 5.10，接下來該挑戰什麼？」

**傳統 Vector RAG 的回答方式**：
- 搜尋「5.10」「龍洞」「進階」相關文件
- 基於語意相似度找出相關路線描述
- 可能推薦難度相近但風格不匹配的路線

**Graph RAG 的回答方式**：
```
攀岩者 ─完攀→ 龍洞黃金谷 5.10a（傳統攀登）
                    │
                    ├─ 風格相似 → 龍洞校門口 5.10c（同類型 crack）
                    ├─ 同岩場進階 → 龍洞黃金谷 5.10d（熟悉環境）
                    ├─ 跨岩場同風格 → 大砲岩 5.10b（類似 crack 系統）
                    └─ 技術延伸 → 龍洞 5.11a（風格銜接合理的下一步）
```

**價值**：基於「攀登風格」「技術要求」「裝備需求」的**結構化進階路徑**，而非單純的文字相似度。

#### 場景 B：岩場生態全景（全域摘要）

**使用者查詢**：「台灣各區域的攀岩風格有什麼差異？」

**傳統 Vector RAG**：找到幾個提及「台灣攀岩」的文件 chunk，拼湊不完整的回答。

**Graph RAG（Global Search）**：
- 自動建立社群：北部岩場群（龍洞、大砲岩...）、中部岩場群、南部岩場群
- 每個社群的摘要包含：主要路線類型分佈、難度分佈、岩質特色
- 跨社群比較：北部偏海蝕岩壁 crack + face、中部偏石灰岩洞穴...
- **產出結構化的全景式回答**，涵蓋整個知識庫

#### 場景 C：社群故事與經驗連結

**使用者查詢**：「有沒有從運動攀登轉傳統攀登的攀岩者分享經驗？」

**Graph RAG 路徑**：
```
攀岩者（故事/banter）
    ├─ 攀登紀錄類型 = 運動攀登（早期）
    ├─ 攀登紀錄類型 = 傳統攀登（後期）
    └─ 核心故事/一句話 ─主題→ 「轉型」「裂隙」「傳統」
```

結合 `banters`（攀岩閒聊）和 `stories`（故事）中的經驗分享，透過攀岩者的攀登類型變化軌跡，找到真正有轉型經驗的人的分享。

#### 場景 D：裝備與路線的關聯推薦

**使用者查詢**：「攀 5.11 的 crack 路線需要準備什麼裝備？」

**Graph RAG 路徑**：
```
路線（5.11 + crack 類型）
    ├─ 需要裝備 → cam size 分佈
    ├─ 完攀者經驗 → 常見裝備清單
    ├─ 所在岩場 → 岩質影響裝備選擇
    └─ 相似路線群 → 共同裝備需求模式
```

#### 場景 E：影片內容知識圖譜

**使用者查詢**：「有沒有教 heel hook 技巧的影片？最好是在抱石場景。」

**Graph RAG 路徑**：
```
YouTube 影片
    ├─ 頻道 → 教學型 vs 攀登紀錄型
    ├─ 技巧標籤 → heel hook
    ├─ 場景 → 抱石
    ├─ 提及路線 → 具體路線資訊
    └─ 攀岩者出演 → 其他相關影片
```

### 7.3 攀岩知識圖譜 Schema 設計

```
Node Types（實體類型）：
├── Route（路線）：name, grade, type, style, length, bolts
├── Crag（岩場）：name, location, rock_type, season, access
├── Area（區域）：name, region, characteristics
├── Climber（攀岩者）：username, level, preferences
├── Video（影片）：title, url, channel, topics
├── Channel（頻道）：name, type, subscriber_count
├── Gear（裝備）：name, type, brand
├── Technique（技巧）：name, category, difficulty
├── Story（故事）：title, author, themes
└── Grade（難度）：value, system, approximate_equivalent

Edge Types（關係類型）：
├── LOCATED_AT（路線→岩場、岩場→區域）
├── HAS_GRADE（路線→難度）
├── COMPLETED_BY（路線→攀岩者，含日期、方式）
├── FIRST_ASCENT_BY（路線→攀岩者）
├── SIMILAR_TO（路線→路線，含相似原因）
├── PROGRESSES_TO（路線→路線，進階關係）
├── REQUIRES_GEAR（路線→裝備）
├── DEMONSTRATES_TECHNIQUE（影片→技巧）
├── FEATURES_ROUTE（影片→路線）
├── PUBLISHED_BY（影片→頻道）
├── AUTHORED_BY（故事→攀岩者）
└── MENTIONS（故事→路線/岩場/技巧）
```

### 7.4 落地評估：是否值得引入

#### 目前資料規模

| 資料類型 | 估計量 | 圖譜潛力 |
|---------|--------|---------|
| 路線 | ~500-2000 | 核心節點 |
| 岩場 | ~20-50 | 核心節點 |
| 影片 | ~1000+ | 豐富的關係來源 |
| 攀岩者（含故事） | 持續成長 | 社群互動節點 |
| 裝備/技巧 | ~50-100 | 知識型節點 |

#### 投資回報分析

| 面向 | 評估 |
|------|------|
| **多跳推理需求** | 中——進階路線推薦、跨岩場比較有明確需求 |
| **全域摘要需求** | 中——「台灣攀岩概況」類查詢有價值 |
| **關係複雜度** | 中——不如醫療/金融，但比初步評估更豐富 |
| **資料規模** | 小——不需要 LazyGraphRAG 等大規模優化 |
| **實作複雜度** | 高——需新增圖資料庫、抽取 pipeline、查詢整合 |
| **現有方案覆蓋度** | 高——Text-to-SQL + Hybrid 已覆蓋多數結構化查詢 |

---

## 八、分階段引入策略

如果決定引入 Graph RAG，建議分三階段漸進實施，而非一次性大改造。

### Phase 1：輕量知識圖譜（低成本起步）

**目標**：在不引入圖資料庫的前提下，利用現有 D1 SQLite 模擬基礎圖結構。

**做法**：
- 建立 `entity_relationships` 表，存儲實體間的顯性關係
- 在 Tool Selection 中新增 `graph_query` 工具，走 SQL JOIN 查詢關係
- 利用現有 Text-to-SQL 基礎設施，新增關係查詢模板

```sql
-- 範例：找出與某路線風格相似的進階路線
SELECT r2.name, r2.grade, r2.type
FROM routes r1
JOIN route_similarities rs ON r1.id = rs.route_id
JOIN routes r2 ON rs.similar_route_id = r2.id
WHERE r1.name = ? AND r2.grade > r1.grade
ORDER BY rs.similarity_score DESC;
```

**工作量**：1-2 天
**風險**：低

### Phase 2：向量 + 圖混合檢索

**目標**：在 Phase 1 基礎上，整合向量搜尋與關係擴展。

**做法**：
1. 向量搜尋取得初始候選路線
2. 圖遍歷擴展相關上下文（同岩場路線、相似風格路線、相關影片）
3. RRF 合併兩路結果

**架構**：
```
查詢
  │
  ├─ Vector Search（Vectorize） → 語意相關文件
  │
  ├─ Graph Expansion（D1 SQL） → 結構關係上下文
  │
  └─ RRF Fusion → 合併結果 → LLM 生成
```

**工作量**：2-3 天
**風險**：中

### Phase 3：完整 Graph RAG（社群摘要）

**目標**：引入社群偵測與階層式摘要，支援全域查詢。

**做法**：
- 離線建構知識圖譜（LLM 從影片描述、路線資料抽取實體/關係）
- Leiden 社群偵測生成岩場群組、路線群組
- 社群摘要預生成，存入 KV
- Global Search 走 Map-Reduce 模式

**可能的圖資料庫選項**：
- **D1 模擬**：繼續用 SQLite，適合小規模（路線 < 5000）
- **Cloudflare Hyperdrive + 外部圖 DB**：連接 Neo4j Aura Free Tier
- **完全邊緣方案**：實體/關係存 D1，社群摘要存 KV，向量存 Vectorize

**工作量**：1-2 週
**風險**：高

---

## 九、與現有架構的整合點

### 9.1 Pipeline Engine 整合

現有 14 步驟 Pipeline Engine 已具備模組化基礎，Graph RAG 可作為新步驟插入：

| 新步驟 | Phase | 位置 | 說明 |
|--------|-------|------|------|
| `graph-expansion` | retrieval | hybrid-search 之後 | 從初始結果擴展關係上下文 |
| `graph-community-search` | retrieval | tool-selection 路由 | 全域查詢走社群摘要 |

### 9.2 Tool Selection 整合

在現有 5 個工具基礎上新增：

| 工具 | 適用查詢 | 範例 |
|------|---------|------|
| `graph_query` | 關係推理查詢 | 「跟 XX 路線風格類似的有哪些？」 |
| `graph_summary` | 全域摘要查詢 | 「台灣攀岩的整體面貌？」 |

### 9.3 與現有功能的互補性

| 現有功能 | Graph RAG 互補點 |
|---------|-----------------|
| Text-to-SQL（統計查詢） | Graph 處理**關係推理**，SQL 處理**聚合統計** |
| Hybrid Search（向量+BM25） | Graph 提供**結構化上下文擴展**，補充語意搜尋 |
| User Memory（個人化） | Graph 的使用者節點可整合攀登歷史，提供更精準的個人化推薦 |
| Popularity Reranking | Graph 的路線關係可提供更細緻的熱門度權重（社群中心性） |

---

## 十、業界最新趨勢（2025-2026）

### 10.1 Agentic Graph RAG

Agent + Graph RAG 的融合——自主代理規劃多步檢索，選擇工具（向量搜尋、圖遍歷、API 呼叫），反思中間結果，調整策略。代表從靜態檢索-閱讀到動態推理系統的演進。

### 10.2 RAG 作為「知識運行時」

RAG 不再只是「檢索+生成」，而是**調度層**——管理檢索、驗證、推理、存取控制、稽核軌跡的整合作業。企業正將 RAG 視為完整的知識管理平台。

### 10.3 GraphRAG-Bench（ICLR 2026）

官方基準測試 *"When to use Graphs in RAG"*，提供標準化的 GraphRAG 模型評估框架。這標誌著 Graph RAG 從實驗階段進入成熟期。

### 10.4 Self-RAG + Graph RAG

模型自主決定何時檢索、使用哪種檢索（向量 vs 圖），並批判自身輸出。本專案已有 Self-RAG 基礎（Judge + loopBack），未來可延伸至圖檢索的自主選擇。

---

## 十一、結論與建議

### 整體評估

| 面向 | 結論 |
|------|------|
| **是否需要 Graph RAG** | 短期不急迫，但中長期有明確價值 |
| **最大價值場景** | 進階路線推薦（多跳）、攀岩生態全景（全域）、跨實體關係查詢 |
| **最大障礙** | 實作複雜度高，需要建構知識圖譜的離線 pipeline |
| **推薦策略** | Phase 1 輕量圖結構（SQL 模擬）先驗證價值，再決定是否深入 |

### 優先度排序

1. **先完成 `11-rag-improvement-tasks.md` 中的高優先度項目**（評估框架、語意快取、超時保護）
2. **Phase 1 輕量知識圖譜**：在 Text-to-SQL 基礎上新增關係查詢模板（1-2 天）
3. **評估 Phase 1 效果**：收集使用者對關係推理查詢的回饋
4. **依數據決定 Phase 2/3**：如果多跳查詢佔比 > 15%，投資完整 Graph RAG

### 修正先前評估

先前「攀岩資料關係較簡單」的評估**部分正確但不完整**：
- ✅ 正確：核心結構（路線→岩場→區域）確實簡單
- ⚠️ 不完整：隱性關係（進階路徑、風格相似、裝備需求、影片關聯、社群故事）構成了一個中等複雜度的知識網路
- ⚠️ 不完整：隨著 `banters`（攀岩閒聊）等社群功能上線，關係密度會快速增長

**建議**：維持 Graph RAG 的「低優先度」定位，但不排除其價值。Phase 1 的輕量嘗試成本極低，可在完成高優先度任務後順帶驗證。

---

## 參考資源

- [Microsoft GraphRAG 論文](https://arxiv.org/abs/2404.16130)
- [Microsoft GraphRAG GitHub](https://github.com/microsoft/graphrag)
- [Microsoft LazyGraphRAG 部落格](https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/)
- [Neo4j GraphRAG Python](https://github.com/neo4j/neo4j-graphrag-python)
- [LlamaIndex GraphRAG V2 Cookbook](https://docs.llamaindex.ai/en/stable/examples/cookbooks/GraphRAG_v2/)
- [GraphRAG-Bench (ICLR 2026)](https://github.com/GraphRAG-Bench/GraphRAG-Benchmark)
- [IBM - What is GraphRAG](https://www.ibm.com/think/topics/graphrag)
- [Awesome-GraphRAG 資源清單](https://github.com/DEEP-PolyU/Awesome-GraphRAG)
